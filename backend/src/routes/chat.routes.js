import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || "AIzaSyAtwIBg2PoNXXavVsk8TUY24BCM9irlBKA";
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`;

// Helper function with retry
async function callGeminiAPI(message, retries = 2) {
  const payload = {
    contents: [
      {
        parts: [
          {
            text: `You are an AI study assistant. Help students with their questions by providing helpful, encouraging, and educational responses. Keep responses concise but informative. Focus on learning and understanding.\n\nUser: ${message}`,
          },
        ],
      },
    ],
  };

  try {
    const response = await fetch(GEMINI_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    // If model overloaded, retry
    if (response.status === 503 || data.error?.message?.toLowerCase().includes("overloaded")) {
      if (retries > 0) {
        console.warn("Gemini API overloaded — retrying...");
        await new Promise(r => setTimeout(r, 1000)); // wait 1s before retry
        return callGeminiAPI(message, retries - 1);
      }
    }

    if (!response.ok) {
      throw new Error(data.error?.message || `Gemini API error: ${response.statusText}`);
    }

    return data?.candidates?.[0]?.content?.parts?.[0]?.text || null;
  } catch (err) {
    console.error("Gemini API call failed:", err);
    throw err;
  }
}

router.post('/chat', requireAuth, async (req, res) => {
  console.log('=== Chat Request ===');
  console.log('Body:', req.body);

  try {
    const { message } = req.body;

    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return res.status(400).json({ error: 'Message is required and must be a non-empty string' });
    }

    console.log('Calling Gemini API...');
    const aiResponse = await callGeminiAPI(message);

    if (!aiResponse) {
      return res.status(503).json({
        error: 'Gemini model is overloaded. Please try again later.',
      });
    }

    res.json({
      success: true,
      message: aiResponse.trim(),
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Chat error:', error);
    res.status(500).json({ error: 'An unexpected error occurred. Please try again.' });
  }
});

router.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'Gemini Chat API',
  });
});

export default router;

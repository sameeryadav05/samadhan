import { Router } from 'express';
import { OpenAI } from 'openai';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

// Initialize OpenAI client with HuggingFace (same pattern as sources)
const client = new OpenAI({
  baseURL: "https://router.huggingface.co/v1",
  apiKey: process.env.HF_TOKEN || "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"
});

// Chat with DeepSeek AI
router.post('/chat', requireAuth, async (req, res) => {
  console.log('=== Chat Request ===');
  console.log('Body:', req.body);
  
  try {
    const { message } = req.body;
    
    // Validate input
    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return res.status(400).json({ 
        error: 'Message is required and must be a non-empty string' 
      });
    }

    console.log('Calling AI model...');
    
    const res_ai = await client.chat.completions.create({
      model: "deepseek-ai/DeepSeek-V3.1-Terminus:novita",
      messages: [
        { 
          role: "system", 
          content: "You are an AI study assistant. Help students with their questions by providing helpful, encouraging, and educational responses. Keep responses concise but informative. Focus on learning and understanding." 
        },
        { role: "user", content: message },
      ],
      temperature: 0.7,
      max_tokens: 500,
    });

    console.log('AI model response:', res_ai);
    
    const aiResponse = res_ai.choices[0]?.message?.content || 'I apologize, I could not generate a response.';
    console.log('AI Response:', aiResponse);

    res.json({
      success: true,
      message: aiResponse.trim(),
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Chat error:', error);
    
    // Handle specific error types
    if (error.response) {
      const status = error.response.status;
      const data = error.response.data;
      
      if (status === 401) {
        return res.status(500).json({ 
          error: 'AI service authentication failed. Please contact support.' 
        });
      } else if (status === 429) {
        return res.status(429).json({ 
          error: 'AI service is currently busy. Please try again in a moment.' 
        });
      } else if (status === 503) {
        return res.status(503).json({ 
          error: 'AI service is temporarily unavailable. Please try again later.' 
        });
      } else {
        return res.status(500).json({ 
          error: `AI service error: ${data?.error || 'Unknown error'}` 
        });
      }
    } else if (error.code === 'ECONNABORTED') {
      return res.status(504).json({ 
        error: 'AI service request timed out. Please try again.' 
      });
    } else if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
      return res.status(503).json({ 
        error: 'AI service is unavailable. Please try again later.' 
      });
    } else {
      return res.status(500).json({ 
        error: 'An unexpected error occurred. Please try again.' 
      });
    }
  }
});

// Health check endpoint
router.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    service: 'DeepSeek Chat API'
  });
});

export default router;

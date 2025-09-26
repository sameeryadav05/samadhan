import { Router } from 'express';
import { OpenAI } from 'openai';
import { requireAuth } from '../middleware/auth.js';
import ChatMessage from '../models/ChatMessage.js';

const router = Router();

// Initialize OpenAI client with HuggingFace (same pattern as sources)
const client = new OpenAI({
  baseURL: "https://router.huggingface.co/v1",
  apiKey: process.env.HF_TOKEN || "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"
});

// Test endpoint
router.get('/test', (req, res) => {
  res.json({ message: 'Mentor route is working', timestamp: new Date().toISOString() });
});

// Get chat history
router.get('/chat', requireAuth, async (req, res) => {
  try {
    const messages = await ChatMessage.find({ user: req.user.id })
      .sort({ timestamp: 1 })
      .limit(50);
    res.json(messages);
  } catch (e) {
    res.status(500).json({ message: 'Failed to fetch chat history' });
  }
});

// Send message to AI mentor
router.post('/chat', requireAuth, async (req, res) => {
  console.log('=== Mentor Chat Request ===');
  console.log('Body:', req.body);
  console.log('User:', req.user.id);
  
  try {
    const { message } = req.body;
    if (!message) return res.status(400).json({ message: 'Message required' });

    console.log('Saving user message...');
    // Save user message
    const userMessage = await ChatMessage.create({
      user: req.user.id,
      message,
      isAI: false
    });
    console.log('User message saved:', userMessage._id);

    console.log('Calling AI model...');
    
    const res = await client.chat.completions.create({
      model: "deepseek-ai/DeepSeek-V3.1-Terminus:novita",
      messages: [
        { 
          role: "system", 
          content: "You are an AI study mentor. Help students with their questions by providing helpful, encouraging, and educational responses. Keep responses concise but informative. Focus on learning and understanding." 
        },
        { role: "user", content: message },
      ],
      temperature: 0.7,
      max_tokens: 500,
    });

    console.log('AI model response:', res);
    
    const aiResponse = res.choices[0]?.message?.content || 'I apologize, I could not generate a response.';
    console.log('AI Response:', aiResponse);

    // Save AI response
    const aiMessage = await ChatMessage.create({
      user: req.user.id,
      message: aiResponse,
      isAI: true
    });
    console.log('AI message saved:', aiMessage._id);

    res.json({ userMessage, aiMessage });
  } catch (e) {
    console.error('Mentor chat error:', e);
    console.error('Error response:', e?.response?.data);
    res.status(500).json({ 
      message: 'Failed to get AI response', 
      error: e.message,
      details: e?.response?.data
    });
  }
});

export default router;

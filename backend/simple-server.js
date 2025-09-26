import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config({ path: './.env' });

const app = express();
app.use(cors());
app.use(express.json());

// Simple mentor route
app.get('/api/mentor/test', (req, res) => {
  res.json({ message: 'Mentor route is working', timestamp: new Date().toISOString() });
});

app.post('/api/mentor/chat', (req, res) => {
  const { message } = req.body;
  if (!message) {
    return res.status(400).json({ message: 'Message required' });
  }
  
  // Simple AI response simulation
  const aiResponse = `I understand you're asking about: "${message}". As your AI study mentor, I'm here to help you learn and understand this topic better. Could you provide more specific details about what you'd like to know?`;
  
  res.json({ 
    userMessage: { message, isAI: false },
    aiMessage: { message: aiResponse, isAI: true }
  });
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Simple server running on http://localhost:${PORT}`);
  console.log('Environment variables:');
  console.log('JWT_SECRET:', process.env.JWT_SECRET ? 'set' : 'not set');
  console.log('HF_TOKEN:', process.env.HF_TOKEN ? 'set' : 'not set');
});

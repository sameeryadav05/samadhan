import express from 'express';
import cors from 'cors';
import { OpenAI } from 'openai';

const app = express();
app.use(cors());
app.use(express.json());

// Initialize OpenAI client with HuggingFace (exact pattern from sources)
const client = new OpenAI({
  baseURL: "https://router.huggingface.co/v1",
  apiKey: process.env.HF_TOKEN || "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"
});

// Test endpoint
app.get('/api/mentor/test', (req, res) => {
  res.json({ message: 'AI Mentor is working!', timestamp: new Date().toISOString() });
});

// AI Mentor Chat
app.post('/api/mentor/chat', async (req, res) => {
  try {
    const { message } = req.body;
    if (!message) {
      return res.status(400).json({ message: 'Message required' });
    }

    console.log('Mentor chat request:', message);

    const res_ai = await client.chat.completions.create({
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

    const aiResponse = res_ai.choices[0]?.message?.content || 'I apologize, I could not generate a response.';
    console.log('AI Response:', aiResponse);

    res.json({ 
      userMessage: { message, isAI: false },
      aiMessage: { message: aiResponse, isAI: true }
    });

  } catch (error) {
    console.error('Mentor chat error:', error);
    res.status(500).json({ 
      message: 'Failed to get AI response', 
      error: error.message 
    });
  }
});

// AI Chat endpoint (no auth required for testing)
app.post('/api/chat/chat', async (req, res) => {
  try {
    const { message } = req.body;
    if (!message) {
      return res.status(400).json({ message: 'Message required' });
    }

    console.log('Chat request:', message);

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

    const aiResponse = res_ai.choices[0]?.message?.content || 'I apologize, I could not generate a response.';
    console.log('AI Response:', aiResponse);

    res.json({ 
      success: true,
      message: aiResponse,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Chat error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to get AI response', 
      error: error.message 
    });
  }
});

// AI Schedule Generation
app.post('/api/schedule/generate-schedule', async (req, res) => {
  try {
    const { goal, subjects, deadline, dailyStudyTime } = req.body;
    
    if (!goal || !subjects || !deadline || !dailyStudyTime) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    console.log('Schedule generation request:', { goal, subjects, deadline, dailyStudyTime });

    const subjectArray = Array.isArray(subjects) ? subjects : subjects.split(',').map(s => s.trim());
    
    const prompt = `Generate a comprehensive study schedule for the following requirements:

Goals: ${goal}
Subjects: ${subjectArray.join(', ')}
Deadline: ${deadline}
Daily Study Time: ${dailyStudyTime} minutes

Create a day-wise schedule that includes:
1. Daily time blocks with specific subjects/topics
2. Priority levels for each task
3. Break times and rest periods
4. Progress milestones

Output ONLY a JSON object with this structure:
{
  "schedule": [
    {
      "week": 1,
      "day": "2024-12-09",
      "subject": "Subject Name",
      "focus": "Specific topic to study",
      "duration": 120
    }
  ]
}`;

    const res_ai = await client.chat.completions.create({
      model: "deepseek-ai/DeepSeek-V3.1-Terminus:novita",
      messages: [
        { 
          role: "system", 
          content: "You are an AI study scheduler, an expert in creating personalized, efficient study schedules. Focus on practical, actionable schedules that maximize learning efficiency." 
        },
        { role: "user", content: prompt },
      ],
      temperature: 0.7,
      max_tokens: 2048,
      response_format: { type: "json_object" },
    });

    const content = res_ai.choices[0]?.message?.content;
    console.log('AI content:', content);
    
    if (!content) {
      throw new Error("AI model returned no content for schedule generation.");
    }

    // Extract JSON from markdown code blocks if present
    let jsonStr = content;
    const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/);
    if (jsonMatch) {
      jsonStr = jsonMatch[1];
    } else {
      // Try to find JSON object in the content
      const objectMatch = content.match(/\{[\s\S]*\}/);
      if (objectMatch) {
        jsonStr = objectMatch[0];
      }
    }

    const scheduleResult = JSON.parse(jsonStr);
    console.log('Parsed schedule result:', scheduleResult);
    
    if (!scheduleResult.schedule || !Array.isArray(scheduleResult.schedule)) {
      throw new Error("AI model did not return a valid schedule structure.");
    }

    res.json({ plan: { schedule: scheduleResult.schedule, generatedBy: 'ai' } });

  } catch (error) {
    console.error('Schedule generation error:', error);
    res.status(500).json({ 
      message: 'Schedule generation failed', 
      error: error.message 
    });
  }
});

// Plans endpoint for Tasks page
app.get('/api/plans', (req, res) => {
  // Return empty array for now - this would normally fetch from database
  res.json([]);
});

// Tasks endpoint for task management
app.patch('/api/tasks/:planId/:taskId/toggle', (req, res) => {
  const { planId, taskId } = req.params;
  console.log(`Toggling task ${taskId} in plan ${planId}`);
  res.json({ success: true, message: 'Task toggled successfully' });
});

// Gamification endpoint
app.post('/api/gamification/complete-task', (req, res) => {
  const { xpGained } = req.body;
  console.log(`Task completed, XP gained: ${xpGained}`);
  res.json({ success: true, message: 'XP updated successfully' });
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`🚀 AI Server running on http://localhost:${PORT}`);
  console.log('✅ AI Mentor endpoint: /api/mentor/chat');
  console.log('✅ AI Scheduler endpoint: /api/schedule/generate-schedule');
  console.log('✅ Test endpoint: /api/mentor/test');
});

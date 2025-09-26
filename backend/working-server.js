import express from 'express';
import cors from 'cors';
import axios from 'axios';

const app = express();
app.use(cors());
app.use(express.json());

// Environment variables
const HF_TOKEN = process.env.HF_TOKEN || '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';

// Test endpoint
app.get('/api/mentor/test', (req, res) => {
  res.json({ message: 'AI Mentor is working!', timestamp: new Date().toISOString() });
});

// AI Mentor Chat (no auth required for testing)
app.post('/api/mentor/chat', async (req, res) => {
  try {
    const { message } = req.body;
    if (!message) {
      return res.status(400).json({ message: 'Message required' });
    }

    console.log('Mentor chat request:', message);

    // Call HuggingFace API
    const response = await axios.post(
      'https://api-inference.huggingface.co/models/deepseek-ai/DeepSeek-V3.1-Terminus',
      { 
        inputs: `You are an AI study mentor. Help the student with their question: "${message}". Provide helpful, encouraging, and educational responses. Keep it concise but informative.`,
        parameters: { 
          max_new_tokens: 300, 
          temperature: 0.7,
          return_full_text: false
        } 
      },
      { 
        headers: { Authorization: `Bearer ${HF_TOKEN}` },
        timeout: 30000
      }
    );

    const aiResponse = Array.isArray(response.data)
      ? (response.data[0]?.generated_text || response.data[0]?.summary_text || 'I apologize, I could not generate a response.')
      : response.data?.generated_text || 'I apologize, I could not generate a response.';

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

// AI Schedule Generation (no auth required for testing)
app.post('/api/schedule/generate-schedule', async (req, res) => {
  try {
    const { goal, subjects, deadline, dailyStudyTime } = req.body;
    
    if (!goal || !subjects || !deadline || !dailyStudyTime) {
      return res.status(400).json({ 
        message: 'Missing required fields',
        received: { goal, subjects, deadline, dailyStudyTime }
      });
    }

    console.log('Schedule generation request:', { goal, subjects, deadline, dailyStudyTime });

    const subjectArray = Array.isArray(subjects) ? subjects : subjects.split(',').map(s => s.trim());
    
    const prompt = `You are an expert study planner. Generate a comprehensive day-wise study schedule.

User Input:
- Learning Goal: ${goal}
- Subjects: ${subjectArray.join(', ')}
- Deadline: ${deadline}
- Daily Study Time: ${dailyStudyTime} minutes

Rules:
- Break subjects into logical sequence from fundamentals to advanced
- Ensure complete coverage of important concepts
- Spread evenly until deadline
- Each day must have specific topics to cover
- Duration should equal daily study time

Output ONLY valid JSON with this exact structure:
{
  "schedule": [
    {
      "week": number,
      "day": "YYYY-MM-DD",
      "subject": "string",
      "focus": "string",
      "duration": number
    }
  ]
}

Return only JSON, no extra text.`;

    const response = await axios.post(
      'https://api-inference.huggingface.co/models/deepseek-ai/DeepSeek-V3.1-Terminus',
      { 
        inputs: prompt,
        parameters: { 
          max_new_tokens: 2000, 
          temperature: 0.3,
          return_full_text: false
        } 
      },
      { 
        headers: { Authorization: `Bearer ${HF_TOKEN}` },
        timeout: 30000
      }
    );

    const text = Array.isArray(response.data)
      ? (response.data[0]?.generated_text || response.data[0]?.summary_text || '')
      : response.data?.generated_text || JSON.stringify(response.data);

    console.log('AI Response text:', text);

    // Extract JSON from response
    let jsonStr = text;
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      jsonStr = jsonMatch[0];
    }

    let parsed;
    try {
      parsed = JSON.parse(jsonStr);
    } catch (e) {
      console.error('Failed to parse AI JSON:', e);
      // Return fallback schedule
      const fallbackSchedule = generateFallbackSchedule(goal, subjectArray, deadline, dailyStudyTime);
      return res.json({ plan: { schedule: fallbackSchedule, generatedBy: 'fallback' } });
    }

    if (!parsed.schedule || !Array.isArray(parsed.schedule)) {
      const fallbackSchedule = generateFallbackSchedule(goal, subjectArray, deadline, dailyStudyTime);
      return res.json({ plan: { schedule: fallbackSchedule, generatedBy: 'fallback' } });
    }

    res.json({ plan: { schedule: parsed.schedule, generatedBy: 'ai' } });

  } catch (error) {
    console.error('Schedule generation error:', error);
    res.status(500).json({ 
      message: 'Schedule generation failed', 
      error: error.message 
    });
  }
});

// Fallback schedule generator
function generateFallbackSchedule(goal, subjects, deadline, dailyStudyTime) {
  console.log('Generating fallback schedule...');
  
  const startDate = new Date();
  const endDate = new Date(deadline);
  const daysDiff = Math.max(1, Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)));
  
  const schedule = [];
  const totalWeeks = Math.ceil(daysDiff / 7);
  const daysPerSubject = Math.max(1, Math.floor(daysDiff / subjects.length));
  
  let currentWeek = 1;
  let currentDay = new Date(startDate);
  
  subjects.forEach((subject, subjectIndex) => {
    const subjectDays = Math.min(daysPerSubject, daysDiff - (subjectIndex * daysPerSubject));
    
    for (let i = 0; i < subjectDays; i++) {
      if (currentDay >= endDate) break;
      
      const focusTopics = [
        `${subject} Fundamentals`,
        `${subject} Core Concepts`,
        `${subject} Advanced Topics`,
        `${subject} Practice & Application`,
        `${subject} Review & Mastery`
      ];
      
      schedule.push({
        week: currentWeek,
        day: currentDay.toISOString().split('T')[0],
        subject: subject,
        focus: focusTopics[i % focusTopics.length],
        duration: Number(dailyStudyTime)
      });
      
      currentDay.setDate(currentDay.getDate() + 1);
      
      // Update week
      if (currentDay.getDay() === 0) { // Sunday
        currentWeek++;
      }
    }
  });
  
  return schedule;
}

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`🚀 AI Server running on http://localhost:${PORT}`);
  console.log('✅ AI Mentor endpoint: /api/mentor/chat');
  console.log('✅ AI Scheduler endpoint: /api/schedule/generate-schedule');
  console.log('✅ Test endpoint: /api/mentor/test');
});

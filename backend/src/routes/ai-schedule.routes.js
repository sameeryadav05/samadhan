import { Router } from 'express';
import { OpenAI } from 'openai';
import { requireAuth } from '../middleware/auth.js';
import StudyPlan from '../models/StudyPlan.js';

const router = Router();

// Initialize OpenAI client with HuggingFace (same pattern as sources)
const client = new OpenAI({
  baseURL: "https://router.huggingface.co/v1",
  apiKey: process.env.HF_TOKEN || "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"
});

// Test endpoint
router.get('/test', (req, res) => {
  res.json({ message: 'AI Schedule route is working', timestamp: new Date().toISOString() });
});

// Generate AI-powered study schedule
router.post('/generate-schedule', requireAuth, async (req, res) => {
  console.log('=== AI Schedule Generation Request ===');
  console.log('Body:', req.body);
  
  try {
    const { goal, subjects, deadline, dailyStudyTime } = req.body;
    
    // Validate required fields
    if (!goal || !subjects || !deadline || !dailyStudyTime) {
      return res.status(400).json({ 
        message: 'Missing required fields',
        received: { goal, subjects, deadline, dailyStudyTime }
      });
    }

    // Ensure subjects is an array
    const subjectArray = Array.isArray(subjects) ? subjects : subjects.split(',').map(s => s.trim());
    
    console.log('Generating AI schedule...');
    let schedule = null;
    let generatedBy = 'ai';

    // Try AI generation first
    try {
      schedule = await generateAISchedule(goal, subjectArray, deadline, dailyStudyTime);
      console.log('AI schedule generated successfully');
    } catch (aiError) {
      console.log('AI generation failed, using fallback:', aiError.message);
      schedule = generateFallbackSchedule(goal, subjectArray, deadline, dailyStudyTime);
      generatedBy = 'fallback';
    }

    // Calculate totals
    const totalWeeks = Math.max(...schedule.map(item => item.week));
    const totalDays = schedule.length;

    // Save to database
    const studyPlan = await StudyPlan.create({
      user: req.user.id,
      goal,
      subjects: subjectArray,
      deadline: new Date(deadline),
      dailyStudyTime: Number(dailyStudyTime),
      schedule,
      generatedBy,
      totalWeeks,
      totalDays
    });

    console.log('Study plan saved:', studyPlan._id);

    res.json({
      success: true,
      plan: studyPlan,
      message: `Schedule generated successfully with ${totalDays} study sessions across ${totalWeeks} weeks`
    });

  } catch (error) {
    console.error('Error in schedule generation:', error);
    res.status(500).json({ 
      message: 'Schedule generation failed', 
      error: error.message 
    });
  }
});

// Get user's study plans
router.get('/plans', requireAuth, async (req, res) => {
  try {
    const plans = await StudyPlan.find({ user: req.user.id })
      .sort({ createdAt: -1 })
      .select('-schedule'); // Exclude schedule for list view
    
    res.json(plans);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch study plans' });
  }
});

// Get specific study plan with schedule
router.get('/plans/:id', requireAuth, async (req, res) => {
  try {
    const plan = await StudyPlan.findOne({ 
      _id: req.params.id, 
      user: req.user.id 
    });
    
    if (!plan) {
      return res.status(404).json({ message: 'Study plan not found' });
    }
    
    res.json(plan);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch study plan' });
  }
});

// Update schedule item completion
router.patch('/plans/:id/schedule/:itemId', requireAuth, async (req, res) => {
  try {
    const { completed } = req.body;
    const plan = await StudyPlan.findOne({ 
      _id: req.params.id, 
      user: req.user.id 
    });
    
    if (!plan) {
      return res.status(404).json({ message: 'Study plan not found' });
    }
    
    const scheduleItem = plan.schedule.id(req.params.itemId);
    if (!scheduleItem) {
      return res.status(404).json({ message: 'Schedule item not found' });
    }
    
    scheduleItem.completed = completed;
    await plan.save();
    
    res.json({ success: true, item: scheduleItem });
  } catch (error) {
    res.status(500).json({ message: 'Failed to update schedule item' });
  }
});

// AI Schedule Generation with HuggingFace
async function generateAISchedule(goal, subjects, deadline, dailyStudyTime) {
  const prompt = `You are an expert study planner. Generate a comprehensive day-wise study schedule.

User Input:
- Learning Goal: ${goal}
- Subjects: ${subjects.join(', ')}
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

  console.log('Calling AI model...');
  
  const res = await client.chat.completions.create({
    model: "deepseek-ai/DeepSeek-V3.1-Terminus:novita",
    messages: [
      { 
        role: "system", 
        content: "You are an expert study planner. Generate comprehensive, personalized study schedules. Always return valid JSON with the exact structure requested." 
      },
      { role: "user", content: prompt },
    ],
    temperature: 0.3,
    max_tokens: 2000,
    response_format: { type: "json_object" },
  });

  console.log('AI model response:', res);
  
  const content = res.choices[0]?.message?.content;
  console.log('AI content:', content);
  
  if (!content) {
    throw new Error('AI model returned no content for schedule generation.');
  }

  let parsed;
  try {
    parsed = JSON.parse(content);
  } catch (e) {
    console.error('Failed to parse AI JSON:', e);
    throw new Error('AI returned invalid JSON format');
  }

  if (!parsed.schedule || !Array.isArray(parsed.schedule)) {
    throw new Error('AI response missing schedule array');
  }

  return parsed.schedule;
}

// Fallback Schedule Generation
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

export default router;

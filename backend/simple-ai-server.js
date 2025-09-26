import express from 'express';
import cors from 'cors';

const app = express();
app.use(cors());
app.use(express.json());

// Test endpoint
app.get('/api/mentor/test', (req, res) => {
  res.json({ message: 'AI Mentor is working!', timestamp: new Date().toISOString() });
});

// AI Mentor Chat (simulated AI responses)
app.post('/api/mentor/chat', async (req, res) => {
  try {
    const { message } = req.body;
    if (!message) {
      return res.status(400).json({ message: 'Message required' });
    }

    console.log('Mentor chat request:', message);

    // Simulate AI response based on keywords
    let aiResponse = "I'm here to help you with your studies! ";
    
    if (message.toLowerCase().includes('javascript') || message.toLowerCase().includes('js')) {
      aiResponse += "For JavaScript, I recommend starting with the basics: variables, functions, and DOM manipulation. Practice with small projects and gradually move to frameworks like React or Vue.";
    } else if (message.toLowerCase().includes('python')) {
      aiResponse += "Python is great for beginners! Start with basic syntax, data structures, and then move to libraries like pandas and numpy for data science.";
    } else if (message.toLowerCase().includes('study') || message.toLowerCase().includes('learn')) {
      aiResponse += "Great question! The key to effective learning is consistency. Set aside dedicated time each day, break topics into smaller chunks, and practice regularly.";
    } else {
      aiResponse += "That's an interesting question! Could you provide more specific details about what you'd like to learn? I'm here to help guide your learning journey.";
    }

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

// AI Schedule Generation (simulated AI responses)
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
    
    // Generate a simple fallback schedule
    const schedule = generateFallbackSchedule(goal, subjectArray, deadline, dailyStudyTime);

    res.json({ plan: { schedule, generatedBy: 'ai' } });

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
  console.log('Generating AI-powered schedule...');
  
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

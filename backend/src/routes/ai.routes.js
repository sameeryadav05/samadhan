import { Router } from 'express';
import axios from 'axios';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

// Test endpoint
router.get('/test', (req, res) => {
  res.json({ message: 'AI route is working', timestamp: new Date().toISOString() });
});

// Expected body: { goal, subjects, deadline, dailyAvailableMinutes }
router.post('/generate-schedule', requireAuth, async (req, res) => {
  console.log('=== Schedule Generation Request ===');
  console.log('Body:', req.body);
  
  try {
    const { goal, subjects, deadline, dailyAvailableMinutes } = req.body;
    
    // Validate required fields
    if (!goal || !subjects || !deadline || !dailyAvailableMinutes) {
      console.log('Missing required fields');
      return res.status(400).json({ 
        message: 'Missing required fields',
        received: { goal, subjects, deadline, dailyAvailableMinutes }
      });
    }

    console.log('Generating fallback schedule...');
    const plan = generateFallbackSchedule(goal, subjects, deadline, dailyAvailableMinutes);
    console.log('Generated plan:', JSON.stringify(plan, null, 2));
    
    res.json({ plan });
  } catch (error) {
    console.error('Error in schedule generation:', error);
    res.status(500).json({ 
      message: 'Schedule generation failed', 
      error: error.message 
    });
  }
});

// Fallback schedule generator
function generateFallbackSchedule(goal, subjects, deadline, dailyMinutes) {
  console.log('Creating fallback schedule for:', { goal, subjects, deadline, dailyMinutes });
  
  // Ensure subjects is an array
  const subjectArray = Array.isArray(subjects) ? subjects : subjects.split(',').map(s => s.trim());
  const startDate = new Date();
  const endDate = new Date(deadline);
  const daysDiff = Math.max(1, Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)));
  
  console.log('Days difference:', daysDiff);
  
  const tasks = [];
  const tasksPerSubject = Math.max(1, Math.min(3, Math.floor(daysDiff / subjectArray.length)));
  const minutesPerTask = Math.max(30, Math.floor(dailyMinutes / tasksPerSubject));
  
  console.log('Tasks per subject:', tasksPerSubject, 'Minutes per task:', minutesPerTask);
  
  // Create tasks for each subject
  subjectArray.forEach((subject, subjectIndex) => {
    for (let i = 0; i < tasksPerSubject; i++) {
      const taskDate = new Date(startDate);
      taskDate.setDate(startDate.getDate() + (subjectIndex * tasksPerSubject + i));
      
      const taskTitles = [
        `${subject} Fundamentals`,
        `${subject} Practice Session`,
        `${subject} Advanced Topics`
      ];
      
      tasks.push({
        title: taskTitles[i] || `${subject} Study Session ${i + 1}`,
        subject: subject,
        date: taskDate.toISOString().split('T')[0],
        durationMinutes: minutesPerTask
      });
    }
  });
  
  // Sort tasks by date
  const sortedTasks = tasks.sort((a, b) => new Date(a.date) - new Date(b.date));
  console.log('Generated', sortedTasks.length, 'tasks');
  
  return { tasks: sortedTasks };
}

export default router;



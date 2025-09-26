import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import dotenv from 'dotenv';
import mongoose from 'mongoose';

import authRoutes from './routes/auth.routes.js';
import planRoutes from './routes/plan.routes.js';
import taskRoutes from './routes/task.routes.js';
import reminderRoutes from './routes/reminder.routes.js';
import adminRoutes from './routes/admin.routes.js';
import aiRoutes from './routes/ai-simple.routes.js';
import aiScheduleRoutes from './routes/ai-schedule.routes.js';
import chatRoutes from './routes/chat.routes.js';
import mentorRoutes from './routes/mentor.routes.js';
import resourceRoutes from './routes/resource.routes.js';
import gamificationRoutes from './routes/gamification.routes.js';
import roomRoutes from './routes/room.routes.js';

dotenv.config({ path: '../.env' });

// Set environment variables directly if not loaded
if (!process.env.JWT_SECRET) {
  process.env.JWT_SECRET = 'your-super-secret-jwt-key-here';
}
if (!process.env.HF_TOKEN) {
  process.env.HF_TOKEN = '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';
}
if (!process.env.MONGO_URI) {
  process.env.MONGO_URI = 'mongodb://localhost:27017/studybuddy';
}

console.log('Environment variables loaded:');
console.log('JWT_SECRET:', process.env.JWT_SECRET ? 'set' : 'not set');
console.log('HF_TOKEN:', process.env.HF_TOKEN ? 'set' : 'not set');
console.log('MONGO_URI:', process.env.MONGO_URI ? 'set' : 'not set');

const app = express();
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/studybuddy';
const PORT = process.env.PORT || 4000;

mongoose
  .connect(MONGO_URI)
  .then(() => {
    console.log('MongoDB connected');
  })
  .catch((err) => {
    console.error('MongoDB connection error', err);
    process.exit(1);
  });

app.get('/', (req, res) => {
  res.json({ status: 'ok', service: 'studybuddy-backend' });
});

app.use('/api/auth', authRoutes);
app.use('/api/plans', planRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/reminders', reminderRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/schedule', aiScheduleRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/mentor', mentorRoutes);
app.use('/api/resources', resourceRoutes);
app.use('/api/gamification', gamificationRoutes);
app.use('/api/rooms', roomRoutes);

// Additional endpoints for Tasks page
app.get('/api/plans', (req, res) => {
  // Return empty array for now - this would normally fetch from database
  res.json([]);
});

app.patch('/api/tasks/:planId/:taskId/toggle', (req, res) => {
  const { planId, taskId } = req.params;
  console.log(`Toggling task ${taskId} in plan ${planId}`);
  res.json({ success: true, message: 'Task toggled successfully' });
});

app.post('/api/gamification/complete-task', (req, res) => {
  const { xpGained } = req.body;
  console.log(`Task completed, XP gained: ${xpGained}`);
  res.json({ success: true, message: 'XP updated successfully' });
});

// Reminders endpoint for Dashboard
app.get('/api/reminders', (req, res) => {
  // Return empty array for now - this would normally fetch from database
  res.json([]);
});

// Gamification stats endpoint for Dashboard
app.get('/api/gamification/stats', (req, res) => {
  // Return default stats - this would normally fetch from database
  res.json({
    streak: 0,
    xp: 0,
    level: 1,
    totalTasks: 0,
    completedTasks: 0,
    completionRate: 0
  });
});

// Leaderboard endpoint for Analytics
app.get('/api/gamification/leaderboard', (req, res) => {
  // Return empty leaderboard for now
  res.json([]);
});

// Resources endpoints
app.get('/api/resources', (req, res) => {
  // Return empty resources array for now
  res.json([]);
});

app.post('/api/resources', (req, res) => {
  // Mock resource creation
  res.json({ success: true, message: 'Resource saved successfully' });
});

app.post('/api/resources/recommend', (req, res) => {
  // Mock AI recommendations
  const { subject } = req.body;
  const mockRecommendations = [
    {
      title: `Best ${subject} Tutorial`,
      type: 'video',
      url: 'https://example.com/tutorial',
      description: `Comprehensive ${subject} tutorial for beginners`
    },
    {
      title: `${subject} Documentation`,
      type: 'article',
      url: 'https://example.com/docs',
      description: `Official ${subject} documentation and guides`
    }
  ];
  res.json({ recommendations: mockRecommendations });
});

app.put('/api/resources/:id', (req, res) => {
  // Mock resource update
  res.json({ success: true, message: 'Resource updated successfully' });
});

// Rooms endpoints
app.get('/api/rooms', (req, res) => {
  // Return empty rooms array for now
  res.json([]);
});

app.post('/api/rooms', (req, res) => {
  // Mock room creation
  const { name, description } = req.body;
  res.json({
    _id: 'mock-room-id',
    name,
    description,
    owner: { _id: 'mock-owner', name: 'Mock Owner', email: 'owner@example.com' },
    members: [],
    inviteCode: 'ABC123',
    isPublic: false
  });
});

app.post('/api/rooms/join', (req, res) => {
  // Mock room joining
  const { inviteCode } = req.body;
  res.json({
    _id: 'mock-joined-room-id',
    name: 'Joined Room',
    description: 'A room you joined',
    owner: { _id: 'mock-owner', name: 'Room Owner', email: 'owner@example.com' },
    members: [],
    inviteCode,
    isPublic: false
  });
});

app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.status || 500).json({ message: err.message || 'Server error' });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});



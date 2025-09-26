import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import dotenv from 'dotenv';
import mongoose from 'mongoose';

// Import routes
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

// Load environment variables
dotenv.config(); // backend/.env

// Verify environment variables
if (!process.env.JWT_SECRET || !process.env.HF_TOKEN || !process.env.MONGO_URI) {
  console.error('Missing required environment variables in .env');
  process.exit(1);
}

console.log('Environment variables loaded:');
console.log('JWT_SECRET:', 'set');
console.log('HF_TOKEN:', 'set');
console.log('MONGO_URI:', 'set');

const app = express();
const PORT = process.env.PORT || 4000;

// Middlewares
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// MongoDB connection
mongoose
  .connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log('MongoDB connected successfully'))
  .catch((err) => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });

// Test route
app.get('/', (req, res) => {
  res.json({ status: 'ok', service: 'studybuddy-backend' });
});

// API Routes
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

// Global error handler
app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.status || 500).json({ message: err.message || 'Server error' });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

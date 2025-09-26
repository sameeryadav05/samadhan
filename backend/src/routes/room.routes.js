import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import StudyRoom from '../models/StudyRoom.js';
import User from '../models/User.js';

const router = Router();

// Create study room
router.post('/', requireAuth, async (req, res) => {
  try {
    const room = await StudyRoom.create({
      ...req.body,
      owner: req.user.id,
      members: [req.user.id]
    });
    res.json(room);
  } catch (e) {
    res.status(400).json({ message: 'Failed to create room' });
  }
});

// Get user's rooms
router.get('/', requireAuth, async (req, res) => {
  try {
    const rooms = await StudyRoom.find({
      $or: [{ owner: req.user.id }, { members: req.user.id }]
    }).populate('owner members', 'name email');
    res.json(rooms);
  } catch (e) {
    res.status(500).json({ message: 'Failed to fetch rooms' });
  }
});

// Join room by invite code
router.post('/join', requireAuth, async (req, res) => {
  try {
    const { inviteCode } = req.body;
    const room = await StudyRoom.findOne({ inviteCode });
    if (!room) return res.status(404).json({ message: 'Room not found' });
    
    if (room.members.includes(req.user.id)) {
      return res.status(400).json({ message: 'Already a member' });
    }
    
    room.members.push(req.user.id);
    await room.save();
    res.json(room);
  } catch (e) {
    res.status(400).json({ message: 'Failed to join room' });
  }
});

// Get room details
router.get('/:id', requireAuth, async (req, res) => {
  try {
    const room = await StudyRoom.findOne({
      _id: req.params.id,
      $or: [{ owner: req.user.id }, { members: req.user.id }]
    }).populate('owner members', 'name email xp level');
    
    if (!room) return res.status(404).json({ message: 'Room not found' });
    res.json(room);
  } catch (e) {
    res.status(500).json({ message: 'Failed to fetch room' });
  }
});

// Share plan with room
router.post('/:id/share-plan', requireAuth, async (req, res) => {
  try {
    const { planId } = req.body;
    const room = await StudyRoom.findOne({
      _id: req.params.id,
      $or: [{ owner: req.user.id }, { members: req.user.id }]
    });
    
    if (!room) return res.status(404).json({ message: 'Room not found' });
    
    if (!room.sharedPlans.includes(planId)) {
      room.sharedPlans.push(planId);
      await room.save();
    }
    
    res.json(room);
  } catch (e) {
    res.status(400).json({ message: 'Failed to share plan' });
  }
});

export default router;

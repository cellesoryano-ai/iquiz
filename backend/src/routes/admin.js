const express = require('express');
const Question = require('../models/Question');
const User = require('../models/User');
const Room = require('../models/Room');
const GameHistory = require('../models/GameHistory');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');

const router = express.Router();
router.use(authMiddleware, adminMiddleware);

// Dashboard stats
router.get('/stats', async (req, res) => {
  try {
    const [users, questions, rooms, games] = await Promise.all([
      User.countDocuments(),
      Question.countDocuments({ isActive: true }),
      Room.countDocuments({ status: { $in: ['waiting', 'playing', 'question', 'results'] } }),
      GameHistory.countDocuments(),
    ]);
    res.json({ users, questions, activeRooms: rooms, totalGames: games });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

// Questions CRUD
router.get('/questions', async (req, res) => {
  try {
    const { page = 1, category, difficulty } = req.query;
    const filter = {};
    if (category) filter.category = category;
    if (difficulty) filter.difficulty = difficulty;

    const questions = await Question.find(filter)
      .sort({ createdAt: -1 })
      .skip((parseInt(page) - 1) * 50)
      .limit(50)
      .lean();

    const total = await Question.countDocuments(filter);
    res.json({ questions, total });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch questions' });
  }
});

router.post('/questions', async (req, res) => {
  try {
    const { question, options, correctIndex, category, difficulty } = req.body;

    if (!question || !options || options.length !== 4 || correctIndex === undefined) {
      return res.status(400).json({ error: 'Invalid question data' });
    }

    const q = await Question.create({
      question,
      options,
      correctIndex,
      category: category || 'General Knowledge',
      difficulty: difficulty || 'medium',
      createdBy: req.user._id,
    });

    res.status(201).json({ question: q });
  } catch (err) {
    res.status(500).json({ error: 'Failed to create question' });
  }
});

router.put('/questions/:id', async (req, res) => {
  try {
    const q = await Question.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!q) return res.status(404).json({ error: 'Question not found' });
    res.json({ question: q });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update question' });
  }
});

router.delete('/questions/:id', async (req, res) => {
  try {
    await Question.findByIdAndUpdate(req.params.id, { isActive: false });
    res.json({ message: 'Question deactivated' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete question' });
  }
});

// User management
router.get('/users', async (req, res) => {
  try {
    const { page = 1, search } = req.query;
    const filter = search ? { username: new RegExp(search, 'i') } : {};
    const users = await User.find(filter)
      .sort({ createdAt: -1 })
      .skip((parseInt(page) - 1) * 50)
      .limit(50)
      .lean();

    const total = await User.countDocuments(filter);
    res.json({ users, total });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

router.put('/users/:id/ban', async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { isBanned: req.body.banned },
      { new: true }
    );
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json({ user: { id: user._id, username: user.username, isBanned: user.isBanned } });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update user' });
  }
});

module.exports = router;

const express = require('express');
const User = require('../models/User');
const GameHistory = require('../models/GameHistory');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

// Get own profile
router.get('/me', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).lean();
    const recentGames = await GameHistory.find({ 'players.userId': req.user._id })
      .sort({ playedAt: -1 })
      .limit(10)
      .lean();

    const rank = await User.countDocuments({
      'stats.totalScore': { $gt: user.stats.totalScore },
      isBanned: false,
    });

    res.json({
      user: {
        ...user,
        accuracy: user.stats.totalAnswered > 0
          ? Math.round((user.stats.totalCorrect / user.stats.totalAnswered) * 100)
          : 0,
        globalRank: rank + 1,
      },
      recentGames,
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

// Update username (guests only)
router.put('/username', authMiddleware, async (req, res) => {
  try {
    const { username } = req.body;
    if (!username || username.trim().length < 2 || username.trim().length > 20) {
      return res.status(400).json({ error: 'Username must be 2–20 characters' });
    }

    if (req.user.authType === 'discord') {
      return res.status(400).json({ error: 'Discord users cannot change username here' });
    }

    req.user.username = username.trim();
    await req.user.save();

    res.json({ username: req.user.username });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update username' });
  }
});

// Get public profile
router.get('/:userId', async (req, res) => {
  try {
    const user = await User.findById(req.params.userId)
      .select('username avatar stats createdAt')
      .lean();

    if (!user || user.isBanned) {
      return res.status(404).json({ error: 'User not found' });
    }

    const recentGames = await GameHistory.find({ 'players.userId': req.params.userId })
      .sort({ playedAt: -1 })
      .limit(5)
      .lean();

    res.json({
      user: {
        ...user,
        accuracy: user.stats.totalAnswered > 0
          ? Math.round((user.stats.totalCorrect / user.stats.totalAnswered) * 100)
          : 0,
      },
      recentGames,
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

module.exports = router;

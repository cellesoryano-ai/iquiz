const express = require('express');
const User = require('../models/User');
const GameHistory = require('../models/GameHistory');

const router = express.Router();

// Global leaderboard by total score
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 50, sort = 'totalScore' } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const sortField = {
      totalScore: { 'stats.totalScore': -1 },
      gamesWon: { 'stats.gamesWon': -1 },
      accuracy: { 'stats.totalCorrect': -1 },
      gamesPlayed: { 'stats.gamesPlayed': -1 },
    }[sort] || { 'stats.totalScore': -1 };

    const users = await User.find({
      'stats.gamesPlayed': { $gt: 0 },
      isBanned: false,
    })
      .sort(sortField)
      .skip(skip)
      .limit(parseInt(limit))
      .select('username avatar stats createdAt')
      .lean();

    const ranked = users.map((u, i) => ({
      ...u,
      rank: skip + i + 1,
      accuracy: u.stats.totalAnswered > 0
        ? Math.round((u.stats.totalCorrect / u.stats.totalAnswered) * 100)
        : 0,
    }));

    const total = await User.countDocuments({ 'stats.gamesPlayed': { $gt: 0 }, isBanned: false });

    res.json({ players: ranked, total, page: parseInt(page) });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch leaderboard' });
  }
});

// Recent games
router.get('/recent', async (req, res) => {
  try {
    const games = await GameHistory.find()
      .sort({ playedAt: -1 })
      .limit(20)
      .lean();

    res.json({ games });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch recent games' });
  }
});

module.exports = router;

const express = require('express');
const Room = require('../models/Room');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

// Get public rooms
router.get('/rooms', async (req, res) => {
  try {
    const rooms = await Room.find({
      status: 'waiting',
      'settings.isPublic': true,
    })
      .select('code settings players status createdAt')
      .limit(20)
      .lean();

    res.json({ rooms });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch rooms' });
  }
});

// Get room by code
router.get('/room/:code', async (req, res) => {
  try {
    const room = await Room.findOne({ code: req.params.code.toUpperCase() })
      .select('-questions')
      .lean();

    if (!room) return res.status(404).json({ error: 'Room not found' });

    res.json({ room });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch room' });
  }
});

// Get live stats
router.get('/stats', async (req, res) => {
  try {
    const [waiting, playing] = await Promise.all([
      Room.countDocuments({ status: 'waiting' }),
      Room.countDocuments({ status: { $in: ['playing', 'question', 'results', 'starting'] } }),
    ]);

    res.json({ waiting, playing });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

module.exports = router;

const express = require('express');
const passport = require('passport');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const User = require('../models/User');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET || 'jwt-secret', {
    expiresIn: process.env.JWT_EXPIRE || '7d',
  });
};

// Discord OAuth
router.get('/discord', passport.authenticate('discord'));

router.get('/discord/callback',
  passport.authenticate('discord', { failureRedirect: `${process.env.FRONTEND_URL}/?auth=failed` }),
  (req, res) => {
    const token = generateToken(req.user._id);
    res.redirect(`${process.env.FRONTEND_URL}/?token=${token}&auth=success`);
  }
);

// Guest login
router.post('/guest', async (req, res) => {
  try {
    const { username } = req.body;

    if (!username || username.trim().length < 2 || username.trim().length > 20) {
      return res.status(400).json({ error: 'Username must be 2–20 characters' });
    }

    const sanitized = username.trim().replace(/[^a-zA-Z0-9_\- ]/g, '');
    if (!sanitized) {
      return res.status(400).json({ error: 'Invalid username' });
    }

    const guestToken = uuidv4();
    const user = await User.create({
      username: sanitized,
      authType: 'guest',
      guestToken,
      avatar: `https://api.dicebear.com/8.x/bottts/svg?seed=${encodeURIComponent(sanitized)}`,
    });

    const token = generateToken(user._id);
    res.json({
      token,
      user: {
        id: user._id,
        username: user.username,
        avatar: user.avatar,
        authType: user.authType,
        stats: user.stats,
      },
    });
  } catch (err) {
    console.error('Guest login error:', err);
    res.status(500).json({ error: 'Failed to create guest account' });
  }
});

// Get current user
router.get('/me', authMiddleware, (req, res) => {
  res.json({
    user: {
      id: req.user._id,
      username: req.user.username,
      avatar: req.user.avatar,
      authType: req.user.authType,
      stats: req.user.stats,
      isAdmin: req.user.isAdmin,
      accuracy: req.user.accuracy,
    },
  });
});

// Logout
router.post('/logout', (req, res) => {
  req.logout(() => {
    req.session.destroy();
    res.json({ message: 'Logged out successfully' });
  });
});

module.exports = router;

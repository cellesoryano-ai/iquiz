const jwt = require('jsonwebtoken');
const User = require('../models/User');

const authMiddleware = async (req, res, next) => {
  try {
    // Check passport session first
    if (req.isAuthenticated && req.isAuthenticated() && req.user) {
      return next();
    }

    // Check JWT token
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const token = authHeader.slice(7);
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'jwt-secret');
    const user = await User.findById(decoded.userId);

    if (!user || user.isBanned) {
      return res.status(401).json({ error: 'User not found or banned' });
    }

    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
};

const optionalAuth = async (req, res, next) => {
  try {
    if (req.isAuthenticated && req.isAuthenticated() && req.user) {
      return next();
    }

    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.slice(7);
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'jwt-secret');
      const user = await User.findById(decoded.userId);
      if (user && !user.isBanned) {
        req.user = user;
      }
    }
    next();
  } catch {
    next();
  }
};

const adminMiddleware = (req, res, next) => {
  if (!req.user || !req.user.isAdmin) {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
};

module.exports = { authMiddleware, optionalAuth, adminMiddleware };

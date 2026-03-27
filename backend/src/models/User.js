const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  discordId: { type: String, sparse: true, unique: true },
  username: { type: String, required: true, trim: true, maxlength: 32 },
  avatar: { type: String, default: '' },
  email: { type: String, sparse: true },
  authType: { type: String, enum: ['discord', 'guest'], default: 'guest' },
  guestToken: { type: String, sparse: true },

  stats: {
    gamesPlayed: { type: Number, default: 0 },
    gamesWon: { type: Number, default: 0 },
    totalScore: { type: Number, default: 0 },
    totalCorrect: { type: Number, default: 0 },
    totalAnswered: { type: Number, default: 0 },
    winStreak: { type: Number, default: 0 },
    bestWinStreak: { type: Number, default: 0 },
  },

  lastSeen: { type: Date, default: Date.now },
  createdAt: { type: Date, default: Date.now },
  isBanned: { type: Boolean, default: false },
  isAdmin: { type: Boolean, default: false },
}, { timestamps: true });

userSchema.virtual('accuracy').get(function () {
  if (this.stats.totalAnswered === 0) return 0;
  return Math.round((this.stats.totalCorrect / this.stats.totalAnswered) * 100);
});

userSchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('User', userSchema);

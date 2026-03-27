const mongoose = require('mongoose');

const playerResultSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  username: String,
  avatar: String,
  score: Number,
  correctAnswers: Number,
  wrongAnswers: Number,
  rank: Number,
}, { _id: false });

const gameHistorySchema = new mongoose.Schema({
  roomCode: String,
  roomId: { type: mongoose.Schema.Types.ObjectId, ref: 'Room' },
  hostId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  gameType: { type: String, enum: ['versus', 'ffa'] },
  settings: {
    questionCount: Number,
    timerSeconds: Number,
    difficulty: String,
  },
  players: [playerResultSchema],
  winnerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  winnerUsername: String,
  totalQuestions: Number,
  duration: Number, // seconds
  playedAt: { type: Date, default: Date.now },
}, { timestamps: true });

gameHistorySchema.index({ 'players.userId': 1, playedAt: -1 });
gameHistorySchema.index({ playedAt: -1 });

module.exports = mongoose.model('GameHistory', gameHistorySchema);

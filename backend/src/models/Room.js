const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const playerSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  username: String,
  avatar: String,
  socketId: String,
  score: { type: Number, default: 0 },
  correctAnswers: { type: Number, default: 0 },
  wrongAnswers: { type: Number, default: 0 },
  currentAnswer: { type: Number, default: null },
  answeredAt: { type: Date, default: null },
  isReady: { type: Boolean, default: false },
  isHost: { type: Boolean, default: false },
  isMuted: { type: Boolean, default: false },
  isConnected: { type: Boolean, default: true },
}, { _id: false });

const roomSchema = new mongoose.Schema({
  code: {
    type: String,
    unique: true,
    default: () => uuidv4().slice(0, 8).toUpperCase(),
  },
  hostId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  hostSocketId: String,

  settings: {
    maxPlayers: { type: Number, default: 10, min: 2, max: 20 },
    gameType: { type: String, enum: ['versus', 'ffa'], default: 'ffa' },
    questionCount: { type: Number, default: 10, min: 5, max: 30 },
    timerSeconds: { type: Number, default: 10, min: 1, max: 15 },
    isPublic: { type: Boolean, default: true },
    categories: [{ type: String }],
    difficulty: { type: String, enum: ['easy', 'medium', 'hard', 'mixed'], default: 'mixed' },
  },

  players: [playerSchema],

  status: {
    type: String,
    enum: ['waiting', 'starting', 'playing', 'question', 'results', 'finished'],
    default: 'waiting',
  },

  currentQuestion: {
    index: { type: Number, default: -1 },
    questionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Question' },
    startedAt: Date,
    endsAt: Date,
  },

  questions: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Question' }],
  answersRevealed: { type: Boolean, default: false },

  startedAt: Date,
  endedAt: Date,
}, { timestamps: true });

roomSchema.index({ status: 1, 'settings.isPublic': 1 });
roomSchema.index({ code: 1 });

module.exports = mongoose.model('Room', roomSchema);

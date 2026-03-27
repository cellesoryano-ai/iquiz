const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema({
  question: { type: String, required: true },
  options: [{ type: String, required: true }],
  correctIndex: { type: Number, required: true, min: 0, max: 3 },
  category: {
    type: String,
    enum: ['General Knowledge', 'Science', 'History', 'Geography', 'Sports', 'Entertainment', 'Technology', 'Math'],
    default: 'General Knowledge',
  },
  difficulty: { type: String, enum: ['easy', 'medium', 'hard'], default: 'medium' },
  timesUsed: { type: Number, default: 0 },
  timesCorrect: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
}, { timestamps: true });

questionSchema.index({ category: 1, difficulty: 1, isActive: 1 });

module.exports = mongoose.model('Question', questionSchema);

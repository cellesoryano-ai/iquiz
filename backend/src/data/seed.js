require('dotenv').config();
const mongoose = require('mongoose');
const Question = require('../models/Question');
const User = require('../models/User');
const questions = require('./questions');

const seed = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/iquiz');
    console.log('✅ Connected to MongoDB');

    // Seed questions
    await Question.deleteMany({});
    const result = await Question.insertMany(questions);
    console.log(`✅ Seeded ${result.length} questions`);

    // Create admin user if ADMIN_USERNAME provided
    if (process.env.ADMIN_USERNAME) {
      const admin = await User.findOneAndUpdate(
        { username: process.env.ADMIN_USERNAME },
        { isAdmin: true },
        { new: true }
      );
      if (admin) {
        console.log(`✅ Set ${admin.username} as admin`);
      }
    }

    console.log('🎉 Seed complete!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Seed error:', err);
    process.exit(1);
  }
};

seed();

const mongoose = require('mongoose');
const env = require('../config/env');
const User = require('../models/User');

const seedAdmin = async () => {
  try {
    await mongoose.connect(env.mongodbUri);
    const existing = await User.findOne({ email: env.adminEmail.toLowerCase() });

    if (existing) {
      if (existing.role !== 'admin') {
        existing.role = 'admin';
        await existing.save();
        console.log(`Promoted existing user ${existing.email} to admin.`);
      } else {
        console.log(`Admin user ${existing.email} already exists.`);
      }
    } else {
      await User.create({
        name: env.adminName,
        email: env.adminEmail,
        password: env.adminPassword,
        role: 'admin',
      });
      console.log(`Admin user created: ${env.adminEmail}`);
    }
    process.exit(0);
  } catch (err) {
    console.error('Failed to seed admin:', err.message);
    process.exit(1);
  }
};

seedAdmin();

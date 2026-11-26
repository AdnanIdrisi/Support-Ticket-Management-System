const mongoose = require('mongoose');
const env = require('./env');

const connectDB = async () => {
  const conn = await mongoose.connect(env.mongodbUri);
  if (env.nodeEnv !== 'test') {
    console.log(`MongoDB connected: ${conn.connection.host}`);
  }
  return conn;
};

module.exports = connectDB;

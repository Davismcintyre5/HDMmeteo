const mongoose = require('mongoose');
const env = require('./env');
const { logger } = require('../utils/logger');

mongoose.set('strictQuery', true);

let connecting = null;

async function connectDB() {
  if (mongoose.connection.readyState === 1) return mongoose.connection;
  if (connecting) return connecting;

  connecting = mongoose
    .connect(env.MONGODB_URI, {
      autoIndex: !env.isProd,
      serverSelectionTimeoutMS: 10_000,
    })
    .then(() => {
      logger.info('MongoDB connected');
      return mongoose.connection;
    })
    .catch((err) => {
      logger.error({ err: err.message }, 'MongoDB connection failed');
      connecting = null;
      throw err;
    });

  return connecting;
}

async function disconnectDB() {
  if (mongoose.connection.readyState === 0) return;
  await mongoose.disconnect();
  logger.info('MongoDB disconnected');
}

mongoose.connection.on('disconnected', () => logger.warn('MongoDB disconnected event'));
mongoose.connection.on('reconnected', () => logger.info('MongoDB reconnected'));

module.exports = { connectDB, disconnectDB };
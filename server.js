require('./config/env');

const express = require('express');
const http = require('http');
const os = require('os');
const mongoose = require('mongoose');

const env = require('./config/env');
const { connectDB, disconnectDB } = require('./config/db');
const { connectRedis, quitRedis, isRedisReady } = require('./config/redis');
const { startKeepAlive, stopKeepAlive } = require('./config/keepAlive');
const { logger } = require('./utils/logger');

const app = express();
const PORT = env.PORT;
const START = Date.now();

app.use(express.json({ limit: '1mb' }));

app.get('/', (req, res) => {
  res.json({
    success: true,
    service: env.APP_NAME,
    message: 'HDM METEO API — One key. Every forecast.',
    version: '1.0.0',
    environment: env.NODE_ENV,
    docs: `${env.API_URL}/api`,
    health: `${env.API_URL}/health`,
  });
});

app.get('/api', (req, res) => {
  res.json({
    success: true,
    api: 'v1',
    base: `${env.API_URL}/v1`,
    endpoints: {
      current:  'GET /v1/weather/current?lat=..&lon=..',
      forecast: 'GET /v1/weather/forecast?lat=..&lon=..&days=7',
      summary:  'GET /v1/weather/summary?lat=..&lon=..',
    },
    auth: 'Authorization: Bearer hdm_meteo_live_...',
  });
});

app.get('/health', (req, res) => {
  res.json({
    success: true,
    status: 'ok',
    uptime: Math.floor((Date.now() - START) / 1000),
    timestamp: new Date().toISOString(),
    environment: env.NODE_ENV,
    services: {
      mongo: mongoose.connection.readyState === 1 ? 'up' : 'down',
      redis: env.REDIS_ENABLED ? (isRedisReady() ? 'up' : 'down') : 'disabled',
    },
  });
});

app.use((req, res) => {
  res.status(404).json({ success: false, error: 'Not found', code: 'NOT_FOUND', path: req.originalUrl });
});

// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  const status = err.status || 500;
  const code = err.code || 'INTERNAL_ERROR';
  const message = status >= 500 ? 'Something went wrong' : err.message;
  logger.error({ err: err.message, stack: err.stack, path: req.originalUrl }, 'request error');
  res.status(status).json({ success: false, error: message, code });
});

const dbName = () => {
  const m = env.MONGODB_URI.match(/\/([^/?]+)(\?|$)/);
  return m ? m[1] : 'unknown';
};

const pad = (label) => `${label}:`.padEnd(26);

function printStatus() {
  const ok = (v) => `\x1b[32m${v}\x1b[0m`;
  const warn = (v) => `\x1b[33m${v}\x1b[0m`;
  const off = (v) => `\x1b[90m${v}\x1b[0m`;

  const mongoUp = mongoose.connection.readyState === 1;
  const redisUp = env.REDIS_ENABLED ? isRedisReady() : false;

  const lines = [
    '',
    '  ── HDM METEO ────────────────────────────────────────',
    `  ${pad('Server')} ${env.NODE_ENV} · :${PORT}`,
    `  ${pad('Hostname')} ${os.hostname()}`,
    `  ${pad('API URL')} ${env.API_URL}`,
    `  ${pad('MongoDB Connected')} ${mongoUp ? ok(dbName()) : warn('down')}`,
    `  ${pad('Redis')} ${!env.REDIS_ENABLED ? off('disabled') : redisUp ? ok('connected') : warn('down')}`,
    `  ${pad('Weather')} ${ok('open-meteo')} (default)`,
    `  ${pad('AI')} ${env.HDM_AI_ENABLED && env.HDM_AI_API_KEY ? ok('configured') : off('off')}`,
    `  ${pad('Email/SMS')} ${env.HDM_BRIDGE_ENABLED && env.HDM_API_KEY ? ok('configured') : off('off')}`,
    `  ${pad('M-Pesa')} ${ok(env.MPESA_ENV)}`,
    `  ${pad('Cloudinary')} ${env.CLOUDINARY_CLOUD_NAME ? ok('configured') : off('off')}`,
    `  ${pad('Keep-alive')} ${env.KEEP_ALIVE_ENABLED ? ok(`every 10m`) : off('off')}`,
    '',
  ];
  for (const l of lines) console.log(l);
}

let server = null;
let shuttingDown = false;

async function boot() {
  try {
    await connectDB();
    await connectRedis();
  } catch (err) {
    logger.error({ err: err.message }, 'Boot failed — exiting');
    process.exit(1);
  }

  server = http.createServer(app);
  server.listen(PORT, () => {
    printStatus();
    logger.info(`HDM METEO ready on :${PORT} (${env.NODE_ENV})`);
    startKeepAlive();
  });
}

async function shutdown(signal) {
  if (shuttingDown) return;
  shuttingDown = true;

  stopKeepAlive();

  console.log('');
  logger.warn(`Received ${signal} — shutting down…`);

  const forceExit = setTimeout(() => {
    logger.error('Shutdown timed out — forcing exit');
    process.exit(1);
  }, 15_000);
  forceExit.unref();

  try {
    if (server) await new Promise((r) => server.close(r));
    await quitRedis();
    await disconnectDB();
    logger.info('Shutdown complete');
    clearTimeout(forceExit);
    process.exit(0);
  } catch (err) {
    logger.error({ err: err.message }, 'Shutdown error');
    process.exit(1);
  }
}

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('unhandledRejection', (reason) => logger.error({ reason }, 'Unhandled rejection'));
process.on('uncaughtException', (err) => {
  logger.error({ err: err.message, stack: err.stack }, 'Uncaught exception');
  shutdown('uncaughtException');
});

boot();
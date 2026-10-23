require('./scripts/dnsSet');
require('./config/env');

const express = require('express');
const http = require('http');
const os = require('os');
const path = require('path');
const helmet = require('helmet');
const mongoose = require('mongoose');

const env = require('./config/env');
const { connectDB, disconnectDB } = require('./config/db');
const { connectRedis, quitRedis, isRedisReady } = require('./config/redis');
const { initSocket } = require('./config/socket');
const { startKeepAlive, stopKeepAlive } = require('./config/keepAlive');
const { startSchedulers, stopSchedulers } = require('./schedulers');
const { logger } = require('./utils/logger');

const requestId = require('./middleware/global/requestId');
const { corsMiddleware } = require('./middleware/global/cors');
const requestLogger = require('./middleware/global/requestLogger');
const { ipRateLimit, initLimiters } = require('./middleware/global/rateLimit');
const notFound = require('./middleware/global/notFound');
const errorHandler = require('./middleware/global/errorHandler');

const routes = require('./routes');

const app = express();
const PORT = env.PORT;
const START = Date.now();

app.set('trust proxy', 1);

app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(requestId);
app.use(corsMiddleware);
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));
app.use(requestLogger);
app.use(ipRateLimit);

app.use('/brand', express.static(path.join(__dirname, 'public', 'brand'), { maxAge: '7d' }));

app.use(routes);

app.use(notFound);
app.use(errorHandler);

const pad = (label) => `${label}:`.padEnd(26);

const dbName = () => {
  const m = env.MONGODB_URI.match(/\/([^/?]+)(\?|$)/);
  return m ? m[1] : 'unknown';
};

function printStatus() {
  const ok = (v) => `\x1b[32m${v}\x1b[0m`;
  const warn = (v) => `\x1b[33m${v}\x1b[0m`;
  const off = (v) => `\x1b[90m${v}\x1b[0m`;

  const mongoUp = mongoose.connection.readyState === 1;
  const redisUp = env.REDIS_ENABLED ? isRedisReady() : false;
  const mem = process.memoryUsage();
  const cpus = os.cpus();

  const emailOn = env.HDM_BRIDGE_ENABLED && env.HDM_API_KEY;
  const smsOn = env.HDM_BRIDGE_SMS_ENABLED && env.HDM_BRIDGE_ENABLED && env.HDM_API_KEY;

  const lines = [
    '',
    '  ── HDM METEO ────────────────────────────────────────',
    `  ${pad('Server')} ${env.NODE_ENV} · :${PORT}`,
    `  ${pad('URL')} ${env.API_URL}`,
    `  ${pad('Hostname')} ${os.hostname()}`,
    `  ${pad('Node / Arch')} ${process.version} · ${process.arch}`,
    `  ${pad('Platform')} ${os.platform()} (${os.type()} ${os.release()})`,
    `  ${pad('CPU')} ${cpus.length} cores`,
    `  ${pad('Memory')} ${Math.round(mem.rss / 1024 / 1024)} MB RSS · ${Math.round(mem.heapUsed / 1024 / 1024)} MB heap`,
    `  ${pad('MongoDB')} ${mongoUp ? ok(dbName()) : warn('down')}`,
    `  ${pad('Redis')} ${!env.REDIS_ENABLED ? off('disabled') : redisUp ? ok('connected') : warn('down')}`,
    `  ${pad('Socket.io')} ${ok('enabled')}`,
    `  ${pad('Weather')} ${ok('open-meteo')} (default)`,
    `  ${pad('AI')} ${env.HDM_AI_ENABLED && env.HDM_AI_API_KEY ? ok('configured') : off('off')}`,
    `  ${pad('Email')} ${emailOn ? ok('configured') : off('off')}`,
    `  ${pad('SMS')} ${smsOn ? ok('configured') : off('off')}`,
    `  ${pad('M-Pesa')} ${ok(env.MPESA_ENV)}`,
    `  ${pad('Cloudinary')} ${env.CLOUDINARY_CLOUD_NAME ? ok('configured') : off('off')}`,
    `  ${pad('Keep-alive')} ${env.KEEP_ALIVE_ENABLED ? ok('every 10m') : off('off')}`,
    `  ${pad('Rate-limit')} ${env.REDIS_ENABLED ? ok(`${env.RATE_LIMIT_PER_IP_PER_MINUTE}/min per IP`) : off('off')}`,
    `  ${pad('Routes')} /public · /admin · /app · /v1`,
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
    initLimiters();
  } catch (err) {
    logger.error({ err: err.message }, 'Boot failed — exiting');
    process.exit(1);
  }

  server = http.createServer(app);
  initSocket(server);

  server.listen(PORT, async () => {
    printStatus();
    logger.info(`HDM METEO ready on :${PORT} (${env.NODE_ENV})`);

    startKeepAlive();

    try {
      await startSchedulers();
    } catch (err) {
      logger.error({ err: err.message }, 'schedulers failed to start');
    }
  });
}

async function shutdown(signal) {
  if (shuttingDown) return;
  shuttingDown = true;

  stopKeepAlive();
  stopSchedulers();

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
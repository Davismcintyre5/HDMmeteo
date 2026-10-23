const Redis = require('ioredis');
const env = require('./env');
const { logger } = require('../utils/logger');

let client = null;
let ready = false;

function createClient() {
  const c = new Redis(env.REDIS_URL, {
    lazyConnect: true,
    maxRetriesPerRequest: 2,
    enableOfflineQueue: false,
    retryStrategy(times) {
      if (times > 10) return null;
      return Math.min(times * 200, 2000);
    },
  });

  c.on('ready', () => {
    ready = true;
    logger.info('Redis ready');
  });
  c.on('end', () => {
    ready = false;
    logger.warn('Redis connection ended');
  });
  c.on('error', (err) => {
    ready = false;
    logger.warn({ err: err.message }, 'Redis error');
  });

  return c;
}

async function connectRedis() {
  if (!env.REDIS_ENABLED) {
    logger.info('Redis disabled (REDIS_ENABLED=false)');
    return null;
  }
  if (client) return client;

  client = createClient();
  try {
    await client.connect();
  } catch (err) {
    logger.warn({ err: err.message }, 'Redis initial connect failed — continuing without it');
    ready = false;
  }
  return client;
}

async function quitRedis() {
  if (!client) return;
  try {
    await client.quit();
  } catch {
    try { client.disconnect(); } catch {}
  }
  client = null;
  ready = false;
}

function getRedis() { return client; }
function isRedisReady() { return ready; }

module.exports = { connectRedis, quitRedis, getRedis, isRedisReady };
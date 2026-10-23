const { RateLimiterRedis } = require('rate-limiter-flexible');
const env = require('../../config/env');
const { getRedis, isRedisReady } = require('../../config/redis');
const { logger } = require('../../utils/logger');
const { ApiError } = require('../../utils/apiError');

let ipLimiter = null;
let keyLimiter = null;

function build(prefix, points, durationSec) {
  if (!env.REDIS_ENABLED) return null;
  const redis = getRedis();
  if (!redis) return null;
  return new RateLimiterRedis({
    storeClient: redis,
    keyPrefix: prefix,
    points,
    duration: durationSec,
    blockDuration: 60,
  });
}

function initLimiters() {
  if (!env.REDIS_ENABLED) {
    logger.info('Rate limiting disabled (REDIS_ENABLED=false)');
    return;
  }
  ipLimiter = build('rl:ip', env.RATE_LIMIT_PER_IP_PER_MINUTE, 60);
  keyLimiter = build('rl:key', env.RATE_LIMIT_PER_KEY_PER_MINUTE, 60);
}

function ipRateLimit(req, res, next) {
  if (!ipLimiter || !isRedisReady()) return next();

  ipLimiter
    .consume(req.ip)
    .then(() => next())
    .catch(() => next(ApiError.rateLimited('Too many requests from this IP')));
}

function apiKeyRateLimit(req, res, next) {
  if (!keyLimiter || !isRedisReady()) return next();
  if (!req.apiKey?.hash) return next();

  keyLimiter
    .consume(req.apiKey.hash)
    .then(() => next())
    .catch(() => next(ApiError.rateLimited('API key rate limit exceeded')));
}

module.exports = { ipRateLimit, apiKeyRateLimit, initLimiters };
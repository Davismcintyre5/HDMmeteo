const os = require('os');
const mongoose = require('mongoose');
const asyncHandler = require('../../utils/asyncHandler');
const { successResponse, errorResponse } = require('../../utils/response');
const env = require('../../config/env');
const { getRedis, isRedisReady } = require('../../config/redis');
const settingsService = require('../../services/settingsService');
const smsService = require('../../services/smsService');

const Backup = require('../../models/admin/Backup');

function maskMongoHost(uri) {
  try {
    const u = new URL(uri);
    return u.host;
  } catch {
    return 'unknown';
  }
}

function maskEmail(email) {
  if (!email) return null;
  const [user, domain] = String(email).split('@');
  if (!domain) return '[redacted]';
  return `${user.slice(0, 2)}***@${domain}`;
}

function maskUri(uri) {
  if (!uri) return null;
  return uri.replace(/\/\/([^@]+)@/, '//***@');
}

function formatUptime(seconds) {
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  const parts = [];
  if (d) parts.push(`${d}d`);
  if (h) parts.push(`${h}h`);
  if (m) parts.push(`${m}m`);
  if (!d && !h) parts.push(`${s}s`);
  return parts.join(' ');
}

async function collectServer() {
  const mem = process.memoryUsage();
  const pkg = require('../../package.json');
  const cpus = os.cpus();

  return {
    status: 'up',
    url: env.API_URL || null,
    version: pkg.version,
    node: process.version,
    platform: os.platform(),
    platformFull: `${os.type()} ${os.release()}`,
    arch: process.arch,
    hostname: os.hostname(),
    env: env.NODE_ENV,
    uptimeSeconds: Math.floor(process.uptime()),
    uptimeHuman: formatUptime(process.uptime()),
    cpu: {
      cores: cpus.length,
      model: cpus[0]?.model || null,
      speedMhz: cpus[0]?.speed || null,
      loadAvg: os.loadavg(),
    },
    memory: {
      rssMb: Math.round(mem.rss / 1024 / 1024),
      heapUsedMb: Math.round(mem.heapUsed / 1024 / 1024),
      heapTotalMb: Math.round(mem.heapTotal / 1024 / 1024),
      externalMb: Math.round(mem.external / 1024 / 1024),
      totalSystemMb: Math.round(os.totalmem() / 1024 / 1024),
      freeSystemMb: Math.round(os.freemem() / 1024 / 1024),
    },
    pid: process.pid,
    startedAt: new Date(Date.now() - process.uptime() * 1000).toISOString(),
  };
}

async function collectDatabase() {
  const db = mongoose.connection.db;
  const stateMap = ['disconnected', 'connected', 'connecting', 'disconnecting'];
  const status = stateMap[mongoose.connection.readyState] || 'unknown';

  let collections = 0;
  let documents = 0;
  let dbName = null;

  if (db && mongoose.connection.readyState === 1) {
    try {
      const cols = await db.listCollections().toArray();
      collections = cols.length;
      dbName = db.databaseName;

      for (const c of cols) {
        try {
          documents += await db.collection(c.name).estimatedDocumentCount();
        } catch {}
      }
    } catch {}
  }

  return {
    status,
    type: 'MongoDB',
    host: maskMongoHost(env.MONGODB_URI),
    database: dbName,
    collections,
    documents,
  };
}

async function collectRedis() {
  if (!env.REDIS_ENABLED) {
    return {
      status: 'disabled',
      enabled: false,
      host: maskUri(env.REDIS_URL),
      message: 'Redis disabled via REDIS_ENABLED=false',
    };
  }

  const redis = getRedis();
  if (!redis || !isRedisReady()) {
    return {
      status: 'down',
      enabled: true,
      host: maskUri(env.REDIS_URL),
    };
  }

  try {
    const pong = await redis.ping();
    const info = await redis.info('memory').catch(() => '');
    const used = info.match(/used_memory_human:([^\r\n]+)/);

    return {
      status: pong === 'PONG' ? 'up' : 'down',
      enabled: true,
      host: maskUri(env.REDIS_URL),
      memoryUsed: used ? used[1].trim() : null,
    };
  } catch (e) {
    return {
      status: 'down',
      enabled: true,
      host: maskUri(env.REDIS_URL),
      error: e.message,
    };
  }
}

function collectEmail() {
  const enabled = Boolean(env.HDM_BRIDGE_ENABLED && env.HDM_API_KEY && env.HDM_FROM_EMAIL);
  return {
    status: enabled ? 'enabled' : 'disabled',
    enabled,
    provider: 'HDM Bridge',
    from: env.HDM_FROM_EMAIL || null,
    fromMasked: maskEmail(env.HDM_FROM_EMAIL),
    sender: env.HDM_FROM_NAME || null,
  };
}

function collectSms() {
  const bridgeOk = Boolean(env.HDM_BRIDGE_ENABLED && env.HDM_API_KEY);
  const smsOn = Boolean(env.HDM_BRIDGE_SMS_ENABLED);
  const enabled = bridgeOk && smsOn;

  return {
    status: enabled ? 'enabled' : 'disabled',
    enabled,
    provider: 'HDM Bridge',
    sender: env.HDM_FROM_NAME || null,
    smsEnabledFlag: smsOn,
    reason: !bridgeOk ? 'bridge disabled' : !smsOn ? 'HDM_BRIDGE_SMS_ENABLED=false' : null,
  };
}

function collectAi() {
  const enabled = Boolean(env.HDM_AI_ENABLED && env.HDM_AI_API_KEY && env.HDM_AI_API_URL);
  return {
    status: enabled ? 'enabled' : 'disabled',
    enabled,
    provider: 'HDM AI',
    baseUrl: env.HDM_AI_API_URL || null,
    model: env.HDM_AI_MODEL || null,
  };
}

function collectMpesa() {
  const enabled = Boolean(
    env.MPESA_CONSUMER_KEY &&
    env.MPESA_CONSUMER_SECRET &&
    env.MPESA_SHORTCODE &&
    env.MPESA_PASSKEY
  );
  return {
    status: enabled ? 'enabled' : 'disabled',
    enabled,
    mode: env.MPESA_ENV,
    transactionType: env.MPESA_TRANSACTION_TYPE,
    shortcode: env.MPESA_SHORTCODE || null,
    tillNumber: env.MPESA_TILL_NUMBER || null,
  };
}

function collectStripe() {
  const enabled = Boolean(process.env.STRIPE_SECRET_KEY);
  return {
    status: enabled ? 'enabled' : 'disabled',
    enabled,
  };
}

async function collectWeather() {
  const weather = await settingsService.getWeather();

  const activeCurrent = weather.current || 'open_meteo';
  const activeForecast = 'open_meteo';

  const providers = {
    open_meteo: { configured: true, requiresKey: false, keySet: true },
    weatherapi: {
      configured: Boolean(env.WEATHERAPI_API_KEY || weather.credentials?.weatherapi?.apiKey),
      requiresKey: true,
      keySet: Boolean(env.WEATHERAPI_API_KEY || weather.credentials?.weatherapi?.apiKey),
      enabled: Boolean(weather.credentials?.weatherapi?.enabled),
    },
    openweather: {
      configured: Boolean(env.OPENWEATHER_API_KEY || weather.credentials?.openweather?.apiKey),
      requiresKey: true,
      keySet: Boolean(env.OPENWEATHER_API_KEY || weather.credentials?.openweather?.apiKey),
      enabled: Boolean(weather.credentials?.openweather?.enabled),
    },
  };

  const activeProviderLabel =
    activeCurrent === 'open_meteo' ? 'Open-Meteo' :
    activeCurrent === 'weatherapi' ? 'WeatherAPI' :
    activeCurrent === 'openweather' ? 'OpenWeather' :
    activeCurrent;

  return {
    status: 'enabled',
    current: activeCurrent,
    currentLabel: activeProviderLabel,
    forecast: activeForecast,
    fallbackToOpenMeteo: weather.fallbackToOpenMeteo !== false,
    providers,
  };
}

function collectStorage() {
  const enabled = Boolean(
    env.CLOUDINARY_CLOUD_NAME &&
    env.CLOUDINARY_API_KEY &&
    env.CLOUDINARY_API_SECRET
  );
  return {
    status: enabled ? 'enabled' : 'disabled',
    enabled,
    type: 'Cloudinary',
    cloud: env.CLOUDINARY_CLOUD_NAME || null,
    folder: env.CLOUDINARY_FOLDER || null,
  };
}

async function collectBackups() {
  const [total, lastSuccess] = await Promise.all([
    Backup.countDocuments({ status: 'success' }),
    Backup.findOne({ status: 'success' }).sort({ completedAt: -1 }).lean(),
  ]);

  return {
    status: 'enabled',
    type: 'Cloudinary',
    folder: `${env.CLOUDINARY_FOLDER || 'hdm-meteo'}/backups`,
    count: total,
    lastBackupAt: lastSuccess?.completedAt || null,
    lastBackupSize: lastSuccess?.sizeBytes || null,
  };
}

async function collectSettings() {
  const brand = await settingsService.getBrand();
  return {
    platformName: brand.name,
    logoUrl: brand.logoUrl || null,
    supportEmail: brand.supportEmail || null,
    supportPhone: brand.supportPhone || null,
  };
}

function collectCors() {
  return env.CORS_ORIGINS;
}

function computeOverall(sections) {
  const keys = ['server', 'database', 'redis', 'email', 'sms', 'ai', 'mpesa', 'stripe', 'weather', 'storage'];
  let up = 0;
  for (const k of keys) {
    const s = sections[k]?.status;
    if (['up', 'enabled', 'connected', 'disabled'].includes(s)) up++;
  }
  return { up, total: keys.length };
}

const health = asyncHandler(async (req, res) => {
  const [server, database, redis, email, sms, ai, mpesa, stripe, weather, storage, backups, settings] = await Promise.all([
    collectServer(),
    collectDatabase(),
    collectRedis(),
    collectEmail(),
    collectSms(),
    collectAi(),
    collectMpesa(),
    collectStripe(),
    collectWeather(),
    collectStorage(),
    collectBackups(),
    collectSettings(),
  ]);

  const sections = { server, database, redis, email, sms, ai, mpesa, stripe, weather, storage };
  const overall = computeOverall(sections);

  return successResponse(res, {
    status: overall.up === overall.total ? 'healthy' : overall.up > 1 ? 'degraded' : 'unhealthy',
    overall,
    timestamp: new Date().toISOString(),
    platform: settings,
    server,
    database,
    redis,
    email,
    sms,
    ai,
    mpesa,
    stripe,
    weather,
    storage,
    backups,
    cors: collectCors(),
  });
});

const ready = asyncHandler(async (req, res) => {
  const dbUp = mongoose.connection.readyState === 1;
  if (!dbUp) return errorResponse(res, 'Database unavailable', 503, 'NOT_READY');
  return successResponse(res, { ready: true });
});

const metrics = asyncHandler(async (req, res) => {
  const mem = process.memoryUsage();
  return successResponse(res, {
    uptimeSeconds: Math.floor(process.uptime()),
    uptimeHuman: formatUptime(process.uptime()),
    memory: {
      rssMb: Math.round(mem.rss / 1024 / 1024),
      heapTotalMb: Math.round(mem.heapTotal / 1024 / 1024),
      heapUsedMb: Math.round(mem.heapUsed / 1024 / 1024),
      externalMb: Math.round(mem.external / 1024 / 1024),
    },
    cpu: {
      cores: os.cpus().length,
      loadAvg: os.loadavg(),
      model: os.cpus()[0]?.model || null,
    },
    node: process.version,
    platform: `${os.type()} ${os.release()}`,
    pid: process.pid,
  });
});

module.exports = { health, ready, metrics };
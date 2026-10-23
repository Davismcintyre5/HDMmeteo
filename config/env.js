require('dotenv').config();

function required(key, value) {
  if (value === undefined || value === null || value === '') {
    throw new Error(`Missing required env var: ${key}`);
  }
  return value;
}

function bool(v, def = false) {
  if (v === undefined || v === '') return def;
  return String(v).toLowerCase() === 'true' || v === '1';
}

function num(v, def) {
  if (v === undefined || v === '') return def;
  const n = Number(v);
  return Number.isFinite(n) ? n : def;
}

function list(v, def = []) {
  if (v === undefined || v === '') return def;
  return String(v).split(',').map((s) => s.trim()).filter(Boolean);
}

const NODE_ENV = process.env.NODE_ENV || 'development';
const isProd = NODE_ENV === 'production';
const PORT = num(process.env.PORT, 5000);

const env = {
  NODE_ENV,
  isProd,
  PORT,
  APP_NAME: process.env.APP_NAME || 'HDM METEO',
  API_URL: process.env.API_URL || `http://localhost:${PORT}`,
  CLIENT_URL: process.env.CLIENT_URL || 'http://localhost:3000',
  ADMIN_URL: process.env.ADMIN_URL || 'http://localhost:3001',
  LOG_LEVEL: process.env.LOG_LEVEL || 'info',
  CORS_ORIGINS: list(process.env.CORS_ORIGINS, [
    process.env.CLIENT_URL || 'http://localhost:3000',
    process.env.ADMIN_URL || 'http://localhost:3001',
  ]),

  KEEP_ALIVE_ENABLED: bool(process.env.KEEP_ALIVE_ENABLED, false),
  KEEP_ALIVE_VERBOSE: bool(process.env.KEEP_ALIVE_VERBOSE, false),
  KEEP_ALIVE_URL: process.env.KEEP_ALIVE_URL || '',

  JWT_SECRET: required('JWT_SECRET', process.env.JWT_SECRET),
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',
  REFRESH_TOKEN_EXPIRES_IN: process.env.REFRESH_TOKEN_EXPIRES_IN || '30d',

  MONGODB_URI: required('MONGODB_URI', process.env.MONGODB_URI),

  REDIS_ENABLED: bool(process.env.REDIS_ENABLED, false),
  REDIS_URL: process.env.REDIS_URL || 'redis://localhost:6379',

  OPENWEATHER_API_KEY: process.env.OPENWEATHER_API_KEY || '',
  WEATHERAPI_API_KEY: process.env.WEATHERAPI_API_KEY || '',

  API_KEY_LIVE_PREFIX: process.env.API_KEY_LIVE_PREFIX || 'hdm_meteo_live_',
  API_KEY_TEST_PREFIX: process.env.API_KEY_TEST_PREFIX || 'hdm_meteo_test_',
  API_KEY_DEFAULT_MAX: num(process.env.API_KEY_DEFAULT_MAX, 1),
  API_KEY_DEFAULT_EXPIRY_DAYS: num(process.env.API_KEY_DEFAULT_EXPIRY_DAYS, null),
  API_KEY_DEFAULT_SCOPES: list(process.env.API_KEY_DEFAULT_SCOPES, ['current', 'forecast']),

  MPESA_ENV: process.env.MPESA_ENV || 'sandbox',
  MPESA_BASE_URL: process.env.MPESA_BASE_URL || 'https://sandbox.safaricom.co.ke',
  MPESA_CONSUMER_KEY: process.env.MPESA_CONSUMER_KEY || '',
  MPESA_CONSUMER_SECRET: process.env.MPESA_CONSUMER_SECRET || '',
  MPESA_SHORTCODE: process.env.MPESA_SHORTCODE || '',
  MPESA_TILL_NUMBER: process.env.MPESA_TILL_NUMBER || '',
  MPESA_PASSKEY: process.env.MPESA_PASSKEY || '',
  MPESA_CALLBACK_URL: process.env.MPESA_CALLBACK_URL || '',
  MPESA_TRANSACTION_TYPE: process.env.MPESA_TRANSACTION_TYPE || 'CustomerBuyGoodsOnline',

  HDM_BRIDGE_ENABLED: bool(process.env.HDM_BRIDGE_ENABLED, false),
  HDM_BRIDGE_SMS_ENABLED: bool(process.env.HDM_BRIDGE_SMS_ENABLED, false),
  HDM_API_KEY: process.env.HDM_API_KEY || '',
  HDM_API_URL: process.env.HDM_API_URL || 'https://bridgeapi.hdm.co.ke/api',
  HDM_FROM_EMAIL: process.env.HDM_FROM_EMAIL || '',
  HDM_FROM_NAME: process.env.HDM_FROM_NAME || 'HDM METEO',

  HDM_AI_ENABLED: bool(process.env.HDM_AI_ENABLED, false),
  HDM_AI_API_KEY: process.env.HDM_AI_API_KEY || '',
  HDM_AI_API_URL: process.env.HDM_AI_API_URL || 'https://hdmaiserver.pxxl.click/api/v1',
  HDM_AI_MODEL: process.env.HDM_AI_MODEL || 'HDM Nova',
  HDM_AI_TIMEOUT_MS: num(process.env.HDM_AI_TIMEOUT_MS, 20000),

  CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME || '',
  CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY || '',
  CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET || '',
  CLOUDINARY_FOLDER: process.env.CLOUDINARY_FOLDER || 'hdm-meteo',

  BILLING_CURRENCY: process.env.BILLING_CURRENCY || 'KES',
  BILLING_DUE_HOURS: num(process.env.BILLING_DUE_HOURS, 3),
  INVOICE_PREFIX: process.env.INVOICE_PREFIX || 'HDM',

  RATE_LIMIT_PER_KEY_PER_MINUTE: num(process.env.RATE_LIMIT_PER_KEY_PER_MINUTE, 60),
  RATE_LIMIT_PER_IP_PER_MINUTE: num(process.env.RATE_LIMIT_PER_IP_PER_MINUTE, 120),
};

module.exports = Object.freeze(env);
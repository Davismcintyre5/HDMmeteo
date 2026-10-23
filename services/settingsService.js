const Setting = require('../models/admin/Setting');

const BRAND_FALLBACK = {
  name: 'HDM METEO',
  logoUrl: '',
  color: '#0F172A',
  accent: '#0EA5A4',
  supportEmail: 'support@hdm.co.ke',
  supportPhone: '',
  supportWhatsapp: '',
  website: 'https://meteo.hdm.co.ke',
  address: '',
};

const WEATHER_FALLBACK = {
  current: 'open_meteo',
  forecast: 'open_meteo',
  fallbackToOpenMeteo: true,
  credentials: {
    openweather: { apiKey: '', enabled: false },
    weatherapi: { apiKey: '', enabled: false },
  },
};

const API_KEYS_FALLBACK = {
  maxPerUser: 1,
  allowedScopes: ['current', 'forecast'],
  livePrefix: 'hdm_meteo_live_',
  testPrefix: 'hdm_meteo_test_',
  defaultExpiryDays: null,
};

const BACKUP_SETTINGS_FALLBACK = {
  enabled: true,
  frequency: 'daily',
  time: '02:00',
  retentionDays: 30,
  maxBackups: 10,
  emailOnCompletion: false,
  emailRecipient: null,
};

async function get(key, fallback) {
  const doc = await Setting.findOne({ key }).lean();
  return doc?.value ?? fallback;
}

async function set(key, value) {
  await Setting.updateOne({ key }, { $set: { value } }, { upsert: true });
  return value;
}

async function patch(key, partial, fallback) {
  const current = await get(key, fallback);
  const merged = { ...current, ...partial };
  await set(key, merged);
  return merged;
}

const getWeather = () => get('weather', WEATHER_FALLBACK);
const setWeather = (value) => set('weather', value);
const patchWeather = (partial) => patch('weather', partial, WEATHER_FALLBACK);

const getApiKeys = () => get('apiKeys', API_KEYS_FALLBACK);
const setApiKeys = (value) => set('apiKeys', value);
const patchApiKeys = (partial) => patch('apiKeys', partial, API_KEYS_FALLBACK);

const getBrand = async () => ({ ...BRAND_FALLBACK, ...(await get('brand', {})) });
const setBrand = (value) => set('brand', value);
const patchBrand = (partial) => patch('brand', partial, BRAND_FALLBACK);

const getBackupSettings = async () => ({
  ...BACKUP_SETTINGS_FALLBACK,
  ...(await get('backupSettings', {})),
});
const setBackupSettings = (patchObj) => patch('backupSettings', patchObj, BACKUP_SETTINGS_FALLBACK);

module.exports = {
  get,
  set,
  patch,
  getWeather,
  setWeather,
  patchWeather,
  getApiKeys,
  setApiKeys,
  patchApiKeys,
  getBrand,
  setBrand,
  patchBrand,
  getBackupSettings,
  setBackupSettings,
  WEATHER_FALLBACK,
  API_KEYS_FALLBACK,
  BRAND_FALLBACK,
  BACKUP_SETTINGS_FALLBACK,
};
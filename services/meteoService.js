const settingsService = require('./settingsService');
const aiService = require('./aiService');
const openMeteo = require('./weather/openMeteo');
const weatherApi = require('./weather/weatherApi');
const openWeather = require('./weather/openWeather');
const { logger } = require('../utils/logger');
const { ApiError } = require('../utils/apiError');

const CURRENT_PROVIDERS = {
  open_meteo: openMeteo,
  weatherapi: weatherApi,
  openweather: openWeather,
};

async function getCurrent(lat, lon) {
  const s = await settingsService.getWeather();
  const provider = s.current || 'open_meteo';
  const client = CURRENT_PROVIDERS[provider];
  if (!client) throw ApiError.internal('UNKNOWN_PROVIDER', `Unknown provider: ${provider}`);

  try {
    const raw = await client.current(lat, lon, s.credentials?.[provider]);
    return client.normalizeCurrent(raw);
  } catch (err) {
    logger.warn({ err: err.message, provider, lat, lon }, 'current weather failed');
    if (s.fallbackToOpenMeteo && provider !== 'open_meteo') {
      const raw = await openMeteo.current(lat, lon);
      return openMeteo.normalizeCurrent(raw);
    }
    throw err;
  }
}

async function getForecast(lat, lon, days = 7) {
  const raw = await openMeteo.forecast(lat, lon, days);
  return openMeteo.normalizeForecast(raw);
}

async function getSummary(lat, lon) {
  if (!aiService.enabled()) throw ApiError.internal('AI_NOT_CONFIGURED', 'AI not configured');
  const [current, forecast] = await Promise.all([
    getCurrent(lat, lon),
    getForecast(lat, lon, 3),
  ]);
  const reply = await aiService.summarizeWeather({ location: { lat, lon }, current, forecast });
  return { ...current, summary: reply };
}

module.exports = { getCurrent, getForecast, getSummary };
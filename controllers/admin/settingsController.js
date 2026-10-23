const settingsService = require('../../services/settingsService');
const aiService = require('../../services/aiService');
const openMeteo = require('../../services/weather/openMeteo');
const weatherApi = require('../../services/weather/weatherApi');
const openWeather = require('../../services/weather/openWeather');
const { successResponse, errorResponse } = require('../../utils/response');
const asyncHandler = require('../../utils/asyncHandler');

const getWeather = asyncHandler(async (req, res) => {
  const weather = await settingsService.getWeather();
  return successResponse(res, {
    weather: {
      current: weather.current,
      forecast: weather.forecast,
      fallbackToOpenMeteo: weather.fallbackToOpenMeteo,
      credentials: {
        openweather: { enabled: !!weather.credentials?.openweather?.enabled, hasKey: !!weather.credentials?.openweather?.apiKey },
        weatherapi: { enabled: !!weather.credentials?.weatherapi?.enabled, hasKey: !!weather.credentials?.weatherapi?.apiKey },
      },
    },
  });
});

const setWeather = asyncHandler(async (req, res) => {
  const current = await settingsService.getWeather();
  const merged = {
    ...current,
    ...req.body,
    credentials: { ...current.credentials, ...(req.body.credentials || {}) },
  };
  const saved = await settingsService.setWeather(merged);
  return successResponse(res, { weather: saved }, 'Weather settings saved');
});

const testWeather = asyncHandler(async (req, res) => {
  const { provider } = req.body;
  const weather = await settingsService.getWeather();
  const lat = 40.7128;
  const lon = -74.0060;

  let client;
  let label;
  if (provider === 'open_meteo') { client = openMeteo; label = 'Open-Meteo'; }
  else if (provider === 'weatherapi') { client = weatherApi; label = 'WeatherAPI'; }
  else if (provider === 'openweather') { client = openWeather; label = 'OpenWeather'; }
  else return errorResponse(res, 'Unknown provider', 400);

  try {
    const raw = await client.current(lat, lon, weather.credentials?.[provider]);
    return successResponse(res, { ok: true, provider, label, sample: client.normalizeCurrent(raw) }, 'Connection OK');
  } catch (err) {
    return successResponse(res, { ok: false, provider, label, error: err.message }, 'Connection failed');
  }
});

const getApiKeys = asyncHandler(async (req, res) => {
  const apiKeys = await settingsService.getApiKeys();
  return successResponse(res, { apiKeys });
});

const setApiKeys = asyncHandler(async (req, res) => {
  const merged = { ...(await settingsService.getApiKeys()), ...req.body };
  const saved = await settingsService.setApiKeys(merged);
  return successResponse(res, { apiKeys: saved }, 'API key settings saved');
});

const getBrand = asyncHandler(async (req, res) => {
  const brand = await settingsService.getBrand();
  return successResponse(res, { brand });
});

const setBrand = asyncHandler(async (req, res) => {
  const merged = { ...(await settingsService.getBrand()), ...req.body };
  const saved = await settingsService.setBrand(merged);
  return successResponse(res, { brand: saved }, 'Brand settings saved');
});

const aiStatus = asyncHandler(async (req, res) => {
  return successResponse(res, { enabled: aiService.enabled() });
});

module.exports = { getWeather, setWeather, testWeather, getApiKeys, setApiKeys, getBrand, setBrand, aiStatus };
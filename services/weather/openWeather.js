const axios = require('axios');
const { ApiError } = require('../../utils/apiError');

const BASE = 'https://api.openweathermap.org/data/2.5/weather';

async function current(lat, lon, credentials) {
  const key = credentials?.apiKey;
  if (!key) throw ApiError.internal('OPENWEATHER_KEY_MISSING', 'OpenWeather key not configured');

  const { data } = await axios.get(BASE, {
    params: { lat, lon, appid: key, units: 'metric' },
    timeout: 10_000,
  });
  return data;
}

function normalizeCurrent(raw) {
  const m = raw.main || {};
  const w = raw.wind || {};
  return {
    location: { lat: raw.coord?.lat, lon: raw.coord?.lon, name: raw.name || null },
    current: {
      temp: m.temp,
      feelsLike: m.feels_like,
      condition: raw.weather?.[0]?.description || null,
      humidity: m.humidity,
      wind: { speed: w.speed, dir: w.deg },
      pressure: m.pressure,
      provider: 'openweather',
    },
    observedAt: new Date(raw.dt * 1000).toISOString(),
  };
}

module.exports = { current, normalizeCurrent };
const axios = require('axios');
const { ApiError } = require('../../utils/apiError');

const BASE = 'https://api.weatherapi.com/v1/current.json';

async function current(lat, lon, credentials) {
  const key = credentials?.apiKey;
  if (!key) throw ApiError.internal('WEATHERAPI_KEY_MISSING', 'WeatherAPI key not configured');

  const { data } = await axios.get(BASE, {
    params: { key, q: `${lat},${lon}`, aqi: 'no' },
    timeout: 10_000,
  });
  return data;
}

function normalizeCurrent(raw) {
  const c = raw.current || {};
  return {
    location: { lat: raw.location?.lat, lon: raw.location?.lon, name: raw.location?.name || null },
    current: {
      temp: c.temp_c,
      feelsLike: c.feelslike_c,
      condition: c.condition?.text,
      humidity: c.humidity,
      wind: { speed: c.wind_kph, dir: c.wind_degree },
      pressure: c.pressure_mb,
      provider: 'weatherapi',
    },
    observedAt: c.last_updated || new Date().toISOString(),
  };
}

module.exports = { current, normalizeCurrent };
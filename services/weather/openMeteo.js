const axios = require('axios');
const { codeToText } = require('./normalize');

const BASE = 'https://api.open-meteo.com/v1/forecast';

async function current(lat, lon) {
  const { data } = await axios.get(BASE, {
    params: {
      latitude: lat,
      longitude: lon,
      current: 'temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m,wind_direction_10m,surface_pressure',
      timezone: 'auto',
    },
    timeout: 10_000,
  });
  return data;
}

async function forecast(lat, lon, days = 7) {
  const { data } = await axios.get(BASE, {
    params: {
      latitude: lat,
      longitude: lon,
      daily: 'weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum,wind_speed_10m_max',
      timezone: 'auto',
      forecast_days: Math.min(days, 16),
    },
    timeout: 10_000,
  });
  return data;
}

function normalizeCurrent(raw) {
  const c = raw.current || {};
  return {
    location: { lat: raw.latitude, lon: raw.longitude, name: null },
    current: {
      temp: c.temperature_2m,
      feelsLike: c.apparent_temperature,
      condition: codeToText(c.weather_code),
      humidity: c.relative_humidity_2m,
      wind: { speed: c.wind_speed_10m, dir: c.wind_direction_10m },
      pressure: c.surface_pressure,
      provider: 'open_meteo',
    },
    observedAt: c.time || new Date().toISOString(),
  };
}

function normalizeForecast(raw) {
  const d = raw.daily || {};
  const days = (d.time || []).map((date, i) => ({
    date,
    condition: codeToText(d.weather_code?.[i]),
    tempMax: d.temperature_2m_max?.[i],
    tempMin: d.temperature_2m_min?.[i],
    precipitation: d.precipitation_sum?.[i],
    windMax: d.wind_speed_10m_max?.[i],
  }));
  return {
    location: { lat: raw.latitude, lon: raw.longitude, name: null },
    forecast: { provider: 'open_meteo', days },
  };
}

module.exports = { current, forecast, normalizeCurrent, normalizeForecast };
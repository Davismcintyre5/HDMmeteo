import { api } from './axios';

function headersFor(apiKey) {
  return { Authorization: `Bearer ${apiKey}` };
}

export const weatherApi = {
  current: (apiKey, { lat, lon }) =>
    api.get('/v1/weather/current', {
      params: { lat, lon },
      headers: headersFor(apiKey),
    }),

  forecast: (apiKey, { lat, lon, days = 7 }) =>
    api.get('/v1/weather/forecast', {
      params: { lat, lon, days },
      headers: headersFor(apiKey),
    }),

  summary: (apiKey, { lat, lon }) =>
    api.get('/v1/weather/summary', {
      params: { lat, lon },
      headers: headersFor(apiKey),
    }),
};
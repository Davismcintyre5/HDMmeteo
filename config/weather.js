const env = require('./env');

const weatherConfig = {
  defaults: {
    current: 'open_meteo',
    forecast: 'open_meteo',
    fallbackToOpenMeteo: true,
  },
  providers: {
    open_meteo: { key: null, requiresKey: false },
    weatherapi: { key: env.WEATHERAPI_API_KEY, requiresKey: true },
    openweather: { key: env.OPENWEATHER_API_KEY, requiresKey: true },
  },
};

module.exports = { weatherConfig };
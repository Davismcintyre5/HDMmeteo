const env = require('./env');

const bridgeConfig = {
  apiKey: env.HDM_API_KEY,
  apiUrl: env.HDM_API_URL,
  fromEmail: env.HDM_FROM_EMAIL,
  fromName: env.HDM_FROM_NAME,
  enabled: () => Boolean(env.HDM_BRIDGE_ENABLED && env.HDM_API_KEY),
};

module.exports = { bridgeConfig };
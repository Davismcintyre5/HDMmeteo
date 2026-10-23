const env = require('./env');

const aiConfig = {
  apiKey: env.HDM_AI_API_KEY,
  apiUrl: env.HDM_AI_API_URL,
  model: env.HDM_AI_MODEL,
  timeoutMs: env.HDM_AI_TIMEOUT_MS,
  enabled: () => Boolean(env.HDM_AI_ENABLED && env.HDM_AI_API_KEY),
};

module.exports = { aiConfig };
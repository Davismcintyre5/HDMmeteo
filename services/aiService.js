const axios = require('axios');
const { aiConfig } = require('../config/hdmai');
const { logger } = require('../utils/logger');
const { ApiError } = require('../utils/apiError');

const enabled = () => aiConfig.enabled();

async function chat({ message, systemPrompt, temperature = 0.3, maxTokens = 300 }) {
  if (!enabled()) throw ApiError.internal('AI_NOT_CONFIGURED', 'AI not configured');

  try {
    const { data } = await axios.post(
      `${aiConfig.apiUrl}/completion`,
      { message, system_prompt: systemPrompt, temperature, max_tokens: maxTokens },
      {
        headers: { Authorization: `Bearer ${aiConfig.apiKey}`, 'Content-Type': 'application/json' },
        timeout: aiConfig.timeoutMs,
      }
    );
    return data?.data?.reply || '';
  } catch (err) {
    logger.warn({ err: err.response?.data || err.message }, 'ai chat failed');
    throw ApiError.internal('AI_FAILED', 'AI request failed');
  }
}

async function summarizeWeather({ location, current, forecast }) {
  const systemPrompt =
    'You are a concise weather assistant. Given JSON weather data, reply in 2 short sentences. ' +
    'No markdown, no emojis. Mention temperature, condition, and one practical tip.';
  const message = JSON.stringify({ location, current, forecast });
  return chat({ message, systemPrompt, temperature: 0.2, maxTokens: 120 });
}

module.exports = { chat, summarizeWeather, enabled };
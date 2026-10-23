const CODE_MAP = {
  0: 'Clear sky',
  1: 'Mainly clear',
  2: 'Partly cloudy',
  3: 'Overcast',
  45: 'Fog',
  48: 'Rime fog',
  51: 'Light drizzle',
  53: 'Drizzle',
  55: 'Dense drizzle',
  61: 'Light rain',
  63: 'Rain',
  65: 'Heavy rain',
  71: 'Light snow',
  73: 'Snow',
  75: 'Heavy snow',
  80: 'Rain showers',
  81: 'Heavy showers',
  82: 'Violent showers',
  95: 'Thunderstorm',
  96: 'Thunderstorm with hail',
  99: 'Severe thunderstorm',
};

function shapeCurrent({ lat, lon, name = null, provider, temp, feelsLike = null, condition, humidity = null, wind = null, pressure = null, observedAt }) {
  return {
    location: { lat, lon, name },
    current: {
      temp,
      feelsLike,
      condition,
      humidity,
      wind,
      pressure,
      provider,
    },
    observedAt,
  };
}

function shapeForecast({ lat, lon, name = null, provider, days }) {
  return {
    location: { lat, lon, name },
    forecast: { provider, days },
  };
}

function codeToText(code) {
  return CODE_MAP[code] || 'Unknown';
}

module.exports = { shapeCurrent, shapeForecast, codeToText };
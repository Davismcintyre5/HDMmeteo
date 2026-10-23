const { ApiError } = require('./apiError');

function parseLatLon(query = {}) {
  const lat = Number(query.lat);
  const lon = Number(query.lon);

  if (!Number.isFinite(lat) || lat < -90 || lat > 90) {
    throw ApiError.badRequest('INVALID_LAT', 'lat must be a number between -90 and 90');
  }
  if (!Number.isFinite(lon) || lon < -180 || lon > 180) {
    throw ApiError.badRequest('INVALID_LON', 'lon must be a number between -180 and 180');
  }
  return { lat, lon };
}

function parseDays(query = {}, max = 16) {
  if (query.days === undefined) return 7;
  const days = Number(query.days);
  if (!Number.isInteger(days) || days < 1 || days > max) {
    throw ApiError.badRequest('INVALID_DAYS', `days must be an integer between 1 and ${max}`);
  }
  return days;
}

module.exports = { parseLatLon, parseDays };
const meteoService = require('../../services/meteoService');
const { successResponse, errorResponse } = require('../../utils/response');
const asyncHandler = require('../../utils/asyncHandler');
const { parseLatLon, parseDays } = require('../../utils/validateCoords');

const current = asyncHandler(async (req, res) => {
  const { lat, lon } = parseLatLon(req.query);
  const data = await meteoService.getCurrent(lat, lon);
  return successResponse(res, data);
});

const forecast = asyncHandler(async (req, res) => {
  const { lat, lon } = parseLatLon(req.query);
  const days = parseDays(req.query, 16);
  const data = await meteoService.getForecast(lat, lon, days);
  return successResponse(res, data);
});

const summary = asyncHandler(async (req, res) => {
  const { lat, lon } = parseLatLon(req.query);
  try {
    const data = await meteoService.getSummary(lat, lon);
    return successResponse(res, data);
  } catch (err) {
    if (err.code === 'AI_NOT_CONFIGURED') return errorResponse(res, 'AI summary not configured', 501);
    throw err;
  }
});

module.exports = { current, forecast, summary };
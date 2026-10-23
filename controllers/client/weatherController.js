const meteoService = require('../../services/meteoService');
const { successResponse } = require('../../utils/response');
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
  return successResponse(res, {
    ...data,
    requestedDays: Number(req.query.days) || 7,
    days,
  });
});

module.exports = { current, forecast };
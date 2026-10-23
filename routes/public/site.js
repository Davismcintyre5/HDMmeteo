const express = require('express');
const ctrl = require('../../controllers/public/siteController');
const meteoService = require('../../services/meteoService');
const { logger } = require('../../utils/logger');
const { ApiError } = require('../../utils/apiError');

const router = express.Router();

router.get('/plans', ctrl.plans);
router.get('/providers', ctrl.providers);
router.get('/payment-methods', ctrl.paymentMethods);
router.get('/brand', ctrl.brand);
router.get('/invoices/:number', ctrl.invoiceByNumber);

// Public demo weather — accepts lat/lon, cached per rounded coord
const DEMO_TTL_MS = 5 * 60 * 1000;
const cache = new Map();

router.get('/demo-weather', async (req, res, next) => {
  try {
    const lat = Number(req.query.lat);
    const lon = Number(req.query.lon);

    if (!Number.isFinite(lat) || lat < -90 || lat > 90) {
      throw ApiError.badRequest('INVALID_LAT', 'lat must be between -90 and 90');
    }
    if (!Number.isFinite(lon) || lon < -180 || lon > 180) {
      throw ApiError.badRequest('INVALID_LON', 'lon must be between -180 and 180');
    }

    // Round to 2 decimals (~1.1km) so nearby requests share cache entries
    const cacheKey = `${lat.toFixed(2)}:${lon.toFixed(2)}`;
    const hit = cache.get(cacheKey);
    if (hit && Date.now() - hit.at < DEMO_TTL_MS) {
      return res.json({ success: true, data: hit.data, cached: true });
    }

    const data = await meteoService.getCurrent(lat, lon);
    cache.set(cacheKey, { data, at: Date.now() });

    // Keep cache bounded
    if (cache.size > 500) {
      const firstKey = cache.keys().next().value;
      cache.delete(firstKey);
    }

    return res.json({ success: true, data, cached: false });
  } catch (err) {
    logger.warn({ err: err.message }, 'demo-weather failed');
    next(err);
  }
});

module.exports = router;
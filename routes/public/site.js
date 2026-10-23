const express = require('express');
const ctrl = require('../../controllers/public/siteController');
const meteoService = require('../../services/meteoService');
const { ApiError } = require('../../utils/apiError');
const { logger } = require('../../utils/logger');

const router = express.Router();

/* ── Standard endpoints ── */
router.get('/plans', ctrl.plans);
router.get('/providers', ctrl.providers);
router.get('/payment-methods', ctrl.paymentMethods);
router.get('/brand', ctrl.brand);
router.get('/invoices/:number', ctrl.invoiceByNumber);

/* ── Demo weather (cached 5 min per rounded coord) ── */
const DEMO_TTL_MS = 5 * 60 * 1000;
const demoCache = new Map();

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

    const key = `${lat.toFixed(2)}:${lon.toFixed(2)}`;
    const hit = demoCache.get(key);
    if (hit && Date.now() - hit.at < DEMO_TTL_MS) {
      return res.json({ success: true, data: hit.data, cached: true });
    }

    const data = await meteoService.getCurrent(lat, lon);
    demoCache.set(key, { data, at: Date.now() });
    if (demoCache.size > 500) demoCache.delete(demoCache.keys().next().value);

    return res.json({ success: true, data, cached: false });
  } catch (err) {
    logger.warn({ err: err.message }, 'demo-weather failed');
    next(err);
  }
});

/* ── Reverse geocode (cached 24h) ── */
const GEO_TTL_MS = 24 * 60 * 60 * 1000;
const geoCache = new Map();

const WARD_PATTERNS = /\b(ward|sub-?county|sub-?location|division|location|sublocation|suburb|neighbourhood|neighborhood)\b/i;

function pickPlaceName(address) {
  if (!address) return null;
  const candidates = [
    address.city,
    address.town,
    address.municipality,
    address.village,
    address.county,
    address.state_district,
    address.state,
  ];
  for (const name of candidates) {
    if (!name) continue;
    if (WARD_PATTERNS.test(name)) continue;
    return name;
  }
  return address.county || address.state || null;
}

router.get('/geocode', async (req, res, next) => {
  try {
    const lat = Number(req.query.lat);
    const lon = Number(req.query.lon);

    if (!Number.isFinite(lat) || lat < -90 || lat > 90) {
      throw ApiError.badRequest('INVALID_LAT', 'lat must be between -90 and 90');
    }
    if (!Number.isFinite(lon) || lon < -180 || lon > 180) {
      throw ApiError.badRequest('INVALID_LON', 'lon must be between -180 and 180');
    }

    const key = `${lat.toFixed(3)}:${lon.toFixed(3)}`;
    const hit = geoCache.get(key);
    if (hit && Date.now() - hit.at < GEO_TTL_MS) {
      return res.json({ success: true, name: hit.name, cached: true });
    }

    let name = null;

    try {
      const r = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json&zoom=10&addressdetails=1`,
        {
          headers: { 'User-Agent': 'HDM-METEO/1.0 (support@hdm.co.ke)' },
          signal: AbortSignal.timeout(6000),
        }
      );
      if (r.ok) {
        const j = await r.json();
        name = pickPlaceName(j?.address);
      }
    } catch {}

    if (!name) {
      try {
        const r = await fetch(
          `https://geocoding-api.open-meteo.com/v1/search?latitude=${lat}&longitude=${lon}&count=5&language=en&format=json`,
          { signal: AbortSignal.timeout(5000) }
        );
        if (r.ok) {
          const j = await r.json();
          const CITY_CODES = ['PPL', 'PPLA', 'PPLA2', 'PPLA3', 'PPLA4', 'PPLA5', 'PPLC'];
          const city = (j.results || []).find((x) => CITY_CODES.includes(x.feature_code));
          if (city?.name && !WARD_PATTERNS.test(city.name)) {
            name = city.name;
          } else {
            const first = (j.results || []).find(
              (x) => x?.name && !['ADM3', 'ADM4'].includes(x.feature_code) && !WARD_PATTERNS.test(x.name)
            );
            name = first?.name || null;
          }
        }
      } catch {}
    }

    geoCache.set(key, { name, at: Date.now() });
    if (geoCache.size > 1000) geoCache.delete(geoCache.keys().next().value);

    return res.json({ success: true, name, cached: false });
  } catch (err) {
    logger.warn({ err: err.message }, 'geocode failed');
    next(err);
  }
});

module.exports = router;
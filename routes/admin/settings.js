const express = require('express');
const ctrl = require('../../controllers/admin/settingsController');
const requireAdmin = require('../../middleware/admin/requireAdmin');
const requireSuperAdmin = require('../../middleware/admin/requireSuperAdmin');

const router = express.Router();

router.get('/weather', requireAdmin, ctrl.getWeather);
router.put('/weather', requireSuperAdmin, ctrl.setWeather);
router.post('/weather/test', requireSuperAdmin, ctrl.testWeather);

router.get('/api-keys', requireAdmin, ctrl.getApiKeys);
router.put('/api-keys', requireSuperAdmin, ctrl.setApiKeys);

router.get('/brand', requireAdmin, ctrl.getBrand);
router.put('/brand', requireSuperAdmin, ctrl.setBrand);

router.get('/ai', requireAdmin, ctrl.aiStatus);

module.exports = router;
const express = require('express');
const ctrl = require('../../controllers/admin/healthController');
const requireAdmin = require('../../middleware/admin/requireAdmin');
const requireSuperAdmin = require('../../middleware/admin/requireSuperAdmin');

const router = express.Router();

router.get('/', requireAdmin, ctrl.health);
router.get('/ready', requireAdmin, ctrl.ready);
router.get('/metrics', requireSuperAdmin, ctrl.metrics);

module.exports = router;
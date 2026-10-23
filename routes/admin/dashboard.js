const express = require('express');
const ctrl = require('../../controllers/admin/dashboardController');
const requireAdmin = require('../../middleware/admin/requireAdmin');

const router = express.Router();

router.get('/stats', requireAdmin, ctrl.stats);
router.get('/recent-activity', requireAdmin, ctrl.recentActivity);

module.exports = router;
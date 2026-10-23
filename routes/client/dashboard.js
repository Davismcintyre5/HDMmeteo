const express = require('express');
const ctrl = require('../../controllers/client/dashboardController');
const { requireAuth } = require('../../middleware/client/requireAuth');
const requireTenant = require('../../middleware/client/requireTenant');

const router = express.Router();

router.get('/overview', requireAuth, requireTenant(), ctrl.overview);
router.get('/usage', requireAuth, requireTenant(), ctrl.usage);
router.get('/recent-invoices', requireAuth, requireTenant(), ctrl.recentInvoices);

module.exports = router;
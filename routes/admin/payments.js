const express = require('express');
const ctrl = require('../../controllers/admin/paymentsController');
const requireAdmin = require('../../middleware/admin/requireAdmin');
const requireSuperAdmin = require('../../middleware/admin/requireSuperAdmin');

const router = express.Router();

router.get('/', requireAdmin, ctrl.list);
router.get('/:id', requireAdmin, ctrl.get);
router.post('/:id/refund', requireSuperAdmin, ctrl.refund);

module.exports = router;
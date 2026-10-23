const express = require('express');
const ctrl = require('../../controllers/admin/pendingController');
const requireAdmin = require('../../middleware/admin/requireAdmin');

const router = express.Router();

router.get('/', requireAdmin, ctrl.list);
router.get('/:id', requireAdmin, ctrl.get);
router.post('/:id/approve', requireAdmin, ctrl.approve);
router.post('/:id/reject', requireAdmin, ctrl.reject);
router.post('/:id/confirm-payment', requireAdmin, ctrl.confirmPayment);

module.exports = router;
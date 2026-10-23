const express = require('express');
const ctrl = require('../../controllers/admin/invoicesController');
const requireAdmin = require('../../middleware/admin/requireAdmin');

const router = express.Router();

router.get('/', requireAdmin, ctrl.list);
router.get('/:id', requireAdmin, ctrl.get);
router.post('/:id/approve', requireAdmin, ctrl.approve);
router.post('/:id/cancel', requireAdmin, ctrl.cancel);
router.post('/:id/mark-paid', requireAdmin, ctrl.markPaid);
router.post('/:id/resend', requireAdmin, ctrl.resend);

module.exports = router;
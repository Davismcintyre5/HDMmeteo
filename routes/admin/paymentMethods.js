const express = require('express');
const ctrl = require('../../controllers/admin/paymentMethodsController');
const requireAdmin = require('../../middleware/admin/requireAdmin');
const requireSuperAdmin = require('../../middleware/admin/requireSuperAdmin');

const router = express.Router();

router.get('/', requireAdmin, ctrl.list);
router.put('/reorder', requireSuperAdmin, ctrl.reorder);
router.get('/:id', requireSuperAdmin, ctrl.get);
router.post('/', requireSuperAdmin, ctrl.create);
router.patch('/:id', requireSuperAdmin, ctrl.update);
router.patch('/:id/toggle', requireSuperAdmin, ctrl.toggle);
router.delete('/:id', requireSuperAdmin, ctrl.remove);

module.exports = router;
const express = require('express');
const ctrl = require('../../controllers/admin/tenantsController');
const requireAdmin = require('../../middleware/admin/requireAdmin');

const router = express.Router();

router.get('/', requireAdmin, ctrl.list);
router.get('/:id', requireAdmin, ctrl.get);
router.patch('/:id', requireAdmin, ctrl.update);
router.post('/:id/suspend', requireAdmin, ctrl.suspend);
router.post('/:id/reactivate', requireAdmin, ctrl.reactivate);
router.delete('/:id', requireAdmin, ctrl.remove);

module.exports = router;
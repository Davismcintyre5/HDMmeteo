const express = require('express');
const ctrl = require('../../controllers/admin/plansController');
const requireAdmin = require('../../middleware/admin/requireAdmin');

const router = express.Router();

router.get('/', requireAdmin, ctrl.list);
router.post('/', requireAdmin, ctrl.create);
router.patch('/:id', requireAdmin, ctrl.update);
router.post('/:id/deactivate', requireAdmin, ctrl.deactivate);
router.delete('/:id', requireAdmin, ctrl.remove);

module.exports = router;
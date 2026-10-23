const express = require('express');
const ctrl = require('../../controllers/admin/usersController');
const requireAdmin = require('../../middleware/admin/requireAdmin');

const router = express.Router();

router.get('/', requireAdmin, ctrl.list);
router.get('/:id', requireAdmin, ctrl.get);
router.patch('/:id', requireAdmin, ctrl.update);
router.post('/:id/reset-password', requireAdmin, ctrl.resetPassword);
router.patch('/:id/api-key-limit', requireAdmin, ctrl.setApiKeyLimit);

module.exports = router;
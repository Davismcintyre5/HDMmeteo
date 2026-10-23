const express = require('express');
const ctrl = require('../../controllers/admin/backupController');
const requireAdmin = require('../../middleware/admin/requireAdmin');
const requireSuperAdmin = require('../../middleware/admin/requireSuperAdmin');

const router = express.Router();

router.use(requireAdmin);

// Settings — MUST be before /:id
router.get('/settings', ctrl.getSettings);
router.put('/settings', requireSuperAdmin, ctrl.updateSettings);

// Existing
router.get('/', ctrl.list);
router.post('/', requireSuperAdmin, ctrl.trigger);
router.get('/:id/download', ctrl.download);
router.post('/:id/send-email', ctrl.sendToEmail);
router.delete('/:id', requireSuperAdmin, ctrl.remove);

module.exports = router;
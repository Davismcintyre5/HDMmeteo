const express = require('express');
const ctrl = require('../../controllers/admin/apiKeysController');
const requireAdmin = require('../../middleware/admin/requireAdmin');

const router = express.Router();

router.get('/', requireAdmin, ctrl.listAll);
router.post('/:id/revoke', requireAdmin, ctrl.revokeAny);

module.exports = router;
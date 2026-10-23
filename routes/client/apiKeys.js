const express = require('express');
const ctrl = require('../../controllers/client/apiKeysController');
const { requireAuth } = require('../../middleware/client/requireAuth');

const router = express.Router();

router.get('/', requireAuth, ctrl.list);
router.post('/', requireAuth, ctrl.create);
router.post('/:id/rotate', requireAuth, ctrl.rotate);
router.delete('/:id', requireAuth, ctrl.revoke);

module.exports = router;
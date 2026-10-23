const express = require('express');
const ctrl = require('../../controllers/client/profileController');
const { requireAuth } = require('../../middleware/client/requireAuth');

const router = express.Router();

router.get('/', requireAuth, ctrl.get);
router.patch('/', requireAuth, ctrl.update);
router.post('/change-password', requireAuth, ctrl.changePassword);

module.exports = router;
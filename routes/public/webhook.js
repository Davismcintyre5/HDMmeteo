const express = require('express');
const ctrl = require('../../controllers/public/webhookController');
const mpesaIpAllowlist = require('../../middleware/global/mpesaIpAllowlist');

const router = express.Router();

router.post('/mpesa/callback', mpesaIpAllowlist, ctrl.mpesaCallback);

module.exports = router;
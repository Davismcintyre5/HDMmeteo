const express = require('express');
const auth = require('./auth');
const site = require('./site');
const webhook = require('./webhook');

const router = express.Router();

router.use('/auth', auth);
router.use('/site', site);
router.use('/webhooks', webhook);

module.exports = router;
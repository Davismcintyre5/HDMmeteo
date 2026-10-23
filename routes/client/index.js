const express = require('express');
const dashboard = require('./dashboard');
const billing = require('./billing');
const apiKeys = require('./apiKeys');
const profile = require('./profile');

const router = express.Router();

router.use('/dashboard', dashboard);
router.use('/billing', billing);
router.use('/api-keys', apiKeys);
router.use('/profile', profile);

module.exports = router;
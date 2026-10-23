const express = require('express');
const publicRoutes = require('./public');
const adminRoutes = require('./admin');
const clientRoutes = require('./client');
const weatherRoutes = require('./client/weather');

const router = express.Router();

router.use('/public', publicRoutes);
router.use('/admin', adminRoutes);
router.use('/app', clientRoutes);
router.use('/v1', weatherRoutes);

module.exports = router;
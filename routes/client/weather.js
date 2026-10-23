const express = require('express');
const ctrl = require('../../controllers/client/weatherController');
const requireApiKey = require('../../middleware/client/requireApiKey');

const router = express.Router();

router.get('/current', requireApiKey('current'), ctrl.current);
router.get('/forecast', requireApiKey('forecast'), ctrl.forecast);

module.exports = router;
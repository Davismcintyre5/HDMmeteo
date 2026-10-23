const express = require('express');
const auth = require('./auth');
const dashboard = require('./dashboard');
const pending = require('./pending');
const tenants = require('./tenants');
const users = require('./users');
const plans = require('./plans');
const invoices = require('./invoices');
const payments = require('./payments');
const settings = require('./settings');
const paymentMethods = require('./paymentMethods');
const apiKeys = require('./apiKeys');
const backup = require('./backup');
const health = require('./health');

const router = express.Router();

router.use('/auth', auth);
router.use('/dashboard', dashboard);
router.use('/pending', pending);
router.use('/tenants', tenants);
router.use('/users', users);
router.use('/plans', plans);
router.use('/invoices', invoices);
router.use('/payments', payments);
router.use('/settings', settings);
router.use('/payment-methods', paymentMethods);
router.use('/api-keys', apiKeys);
router.use('/backups', backup);
router.use('/health', health);

module.exports = router;
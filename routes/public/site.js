const express = require('express');
const ctrl = require('../../controllers/public/siteController');

const router = express.Router();

router.get('/plans', ctrl.plans);
router.get('/providers', ctrl.providers);
router.get('/payment-methods', ctrl.paymentMethods);
router.get('/brand', ctrl.brand);
router.get('/invoices/:number', ctrl.invoiceByNumber);

module.exports = router;
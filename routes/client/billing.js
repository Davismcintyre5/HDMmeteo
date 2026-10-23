const express = require('express');
const ctrl = require('../../controllers/client/billingController');
const { requireAuth } = require('../../middleware/client/requireAuth');

const router = express.Router();

router.get('/current-invoice', requireAuth, ctrl.currentInvoice);
router.get('/invoices', requireAuth, ctrl.invoices);
router.get('/invoices/:number', requireAuth, ctrl.invoiceByNumber);
router.post('/stk-push', requireAuth, ctrl.stkPush);
router.post('/renew', requireAuth, ctrl.renew);
router.post('/upgrade', requireAuth, ctrl.upgrade);

module.exports = router;
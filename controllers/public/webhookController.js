const mpesaService = require('../../services/mpesaService');
const invoiceService = require('../../services/invoiceService');
const paymentNotifyService = require('../../services/paymentNotifyService');
const Invoice = require('../../models/client/Invoice');
const Payment = require('../../models/admin/Payment');
const Tenant = require('../../models/admin/Tenant');
const User = require('../../models/client/User');
const { logger } = require('../../utils/logger');

const mpesaCallback = async (req, res) => {
  try {
    const parsed = mpesaService.parseCallback(req.body);

    if (!parsed.success || !parsed.checkoutRequestId) {
      return res.json({ ResultCode: 0, ResultDesc: 'Accepted' });
    }

    /* Idempotency — if this callback already processed, ack and exit */
    const existing = await Payment.findOne({ checkoutRequestId: parsed.checkoutRequestId });
    if (existing?.status === 'success') {
      return res.json({ ResultCode: 0, ResultDesc: 'Accepted' });
    }

    const invoice = await Invoice.findOne({ 'stk.checkoutRequestId': parsed.checkoutRequestId });
    if (!invoice) {
      logger.warn({ parsed }, 'mpesa callback for unknown invoice');
      return res.json({ ResultCode: 0, ResultDesc: 'Accepted' });
    }

    /* Create payment row (idempotent) */
    if (!existing) {
      await Payment.create({
        tenantId: invoice.tenantId,
        invoiceId: invoice._id,
        type: 'payment',
        direction: 'in',
        method: 'mpesa_stk',
        amount: parsed.amount || invoice.amountDue,
        currency: invoice.currency,
        status: 'success',
        reference: parsed.mpesaReceiptNumber,
        mpesaReceipt: parsed.mpesaReceiptNumber,
        checkoutRequestId: parsed.checkoutRequestId,
        merchantRequestId: parsed.merchantRequestId,
        phone: parsed.phoneNumber,
        raw: req.body,
      });
    }

    /* Mark invoice paid + extend subscription */
    const paidInvoice = await invoiceService.markPaid({
      invoiceId: invoice._id,
      method: 'mpesa_stk',
      reference: parsed.mpesaReceiptNumber,
      amountPaid: parsed.amount,
    });

    /* Load related entities for notifications */
    const [tenant, owner] = await Promise.all([
      Tenant.findById(invoice.tenantId).lean(),
      User.findOne({ tenantId: invoice.tenantId, role: 'owner' }).lean(),
    ]);

    /* Fire notifications — user email, admin emails, sockets */
    await paymentNotifyService
      .notifyPaymentReceived({
        invoice: paidInvoice,
        tenant,
        owner,
        paymentMethod: 'mpesa_stk',
        paymentReference: parsed.mpesaReceiptNumber,
        paidAt: paidInvoice.paidAt,
      })
      .catch((err) => logger.warn({ err: err.message }, 'payment notify failed'));

    return res.json({ ResultCode: 0, ResultDesc: 'Accepted' });
  } catch (err) {
    logger.error({ err: err.message }, 'mpesa callback error');
    return res.json({ ResultCode: 0, ResultDesc: 'Accepted' });
  }
};

module.exports = { mpesaCallback };
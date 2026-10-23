const mpesaService = require('../../services/mpesaService');
const invoiceService = require('../../services/invoiceService');
const Invoice = require('../../models/client/Invoice');
const Payment = require('../../models/admin/Payment');
const socketService = require('../../services/socketService');
const { logger } = require('../../utils/logger');

const mpesaCallback = async (req, res) => {
  try {
    const parsed = mpesaService.parseCallback(req.body);

    if (!parsed.success || !parsed.checkoutRequestId) {
      return res.json({ ResultCode: 0, ResultDesc: 'Accepted' });
    }

    const existing = await Payment.findOne({ checkoutRequestId: parsed.checkoutRequestId });
    if (existing?.status === 'success') {
      return res.json({ ResultCode: 0, ResultDesc: 'Accepted' });
    }

    const invoice = await Invoice.findOne({ 'stk.checkoutRequestId': parsed.checkoutRequestId });
    if (!invoice) {
      logger.warn({ parsed }, 'mpesa callback for unknown invoice');
      return res.json({ ResultCode: 0, ResultDesc: 'Accepted' });
    }

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

    await invoiceService.markPaid({
      invoiceId: invoice._id,
      method: 'mpesa_stk',
      reference: parsed.mpesaReceiptNumber,
      amountPaid: parsed.amount,
    });

    socketService.emitToAdmin('payment:received', {
      tenantId: String(invoice.tenantId),
      invoiceNumber: invoice.invoiceNumber,
      amount: parsed.amount,
    });

    return res.json({ ResultCode: 0, ResultDesc: 'Accepted' });
  } catch (err) {
    logger.error({ err: err.message }, 'mpesa callback error');
    return res.json({ ResultCode: 0, ResultDesc: 'Accepted' });
  }
};

module.exports = { mpesaCallback };
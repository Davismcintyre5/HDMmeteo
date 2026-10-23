const Payment = require('../../models/admin/Payment');
const Invoice = require('../../models/client/Invoice');
const emailService = require('../../services/emailService');
const settingsService = require('../../services/settingsService');
const { successResponse, errorResponse } = require('../../utils/response');
const asyncHandler = require('../../utils/asyncHandler');
const { parsePagination, buildMeta } = require('../../utils/pagination');

const list = asyncHandler(async (req, res) => {
  const { page, limit, skip } = parsePagination(req.query);
  const filter = {};
  if (req.query.tenantId) filter.tenantId = req.query.tenantId;
  if (req.query.status) filter.status = req.query.status;
  if (req.query.type) filter.type = req.query.type;

  const [items, total] = await Promise.all([
    Payment.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    Payment.countDocuments(filter),
  ]);
  return successResponse(res, { items, meta: buildMeta(total, page, limit) });
});

const get = asyncHandler(async (req, res) => {
  const payment = await Payment.findById(req.params.id).lean();
  if (!payment) return errorResponse(res, 'Payment not found', 404);
  return successResponse(res, { payment });
});

const refund = asyncHandler(async (req, res) => {
  const { amount, reason } = req.body;

  const original = await Payment.findById(req.params.id);
  if (!original) return errorResponse(res, 'Payment not found', 404);
  if (original.type !== 'payment') return errorResponse(res, 'Only payments can be refunded', 400);

  const refundAmount = Number(amount) > 0 ? Number(amount) : original.amount;

  const refund = await Payment.create({
    tenantId: original.tenantId,
    invoiceId: original.invoiceId,
    type: 'refund',
    direction: 'out',
    method: original.method,
    amount: refundAmount,
    currency: original.currency,
    status: 'success',
    reference: `REFUND-${original.reference || original._id}`,
    raw: { originalPaymentId: String(original._id), reason: reason || null, refundedByAdminId: req.user.id },
  });

  const invoice = await Invoice.findById(original.invoiceId).lean();
  const brand = await settingsService.getBrand();
  if (invoice?.customerSnapshot?.email) {
    emailService.sendPaymentRefunded({
      tenantId: original.tenantId,
      to: invoice.customerSnapshot.email,
      businessName: brand.name,
      customerName: invoice.customerSnapshot.name || 'Customer',
      amount: refundAmount,
      currency: original.currency,
      reason,
      refundedAt: refund.createdAt,
    }).catch(() => {});
  }

  return successResponse(res, { refund }, 'Refund processed');
});

module.exports = { list, get, refund };
const Invoice = require('../../models/client/Invoice');
const Tenant = require('../../models/admin/Tenant');
const Plan = require('../../models/admin/Plan');
const mpesaService = require('../../services/mpesaService');
const invoiceService = require('../../services/invoiceService');
const paymentInstructionsService = require('../../services/paymentInstructionsService');
const { successResponse, errorResponse } = require('../../utils/response');
const asyncHandler = require('../../utils/asyncHandler');
const { parsePagination, buildMeta } = require('../../utils/pagination');
const { logger } = require('../../utils/logger');

const currentInvoice = asyncHandler(async (req, res) => {
  const invoice = await Invoice.findOne({
    tenantId: req.user.tenantId,
    status: { $in: ['sent', 'overdue'] },
  }).sort({ createdAt: -1 }).lean();

  return successResponse(res, { invoice });
});

const invoices = asyncHandler(async (req, res) => {
  const { page, limit, skip } = parsePagination(req.query);
  const filter = { tenantId: req.user.tenantId };
  if (req.query.status) filter.status = req.query.status;

  const [items, total] = await Promise.all([
    Invoice.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    Invoice.countDocuments(filter),
  ]);
  return successResponse(res, { items, meta: buildMeta(total, page, limit) });
});

const invoiceByNumber = asyncHandler(async (req, res) => {
  const invoice = await Invoice.findOne({
    invoiceNumber: req.params.number,
    tenantId: req.user.tenantId,
  }).lean();
  if (!invoice) return errorResponse(res, 'Invoice not found', 404);
  return successResponse(res, { invoice });
});

const stkPush = asyncHandler(async (req, res) => {
  const { phone } = req.body;
  if (!phone) return errorResponse(res, 'Phone number required', 400);
  if (!mpesaService.enabled()) return errorResponse(res, 'M-Pesa not configured', 503);

  const invoice = await Invoice.findOne({
    tenantId: req.user.tenantId,
    status: { $in: ['sent', 'overdue'] },
  }).sort({ createdAt: -1 });
  if (!invoice) return errorResponse(res, 'No open invoice', 400);

  const normalized = String(phone).replace(/\D/g, '');

  try {
    const result = await mpesaService.initiateStkPush({
      phone: normalized,
      amount: invoice.amountDue,
      accountReference: invoice.invoiceNumber,
      description: `HDM METEO ${invoice.invoiceNumber}`,
    });

    invoice.stk = {
      checkoutRequestId: result.CheckoutRequestID || null,
      merchantRequestId: result.MerchantRequestID || null,
      phone: normalized,
      initiatedAt: new Date(),
    };
    await invoice.save();

    return successResponse(res, {
      checkoutRequestId: result.CheckoutRequestID,
      customerMessage: result.CustomerMessage,
    }, 'STK push sent');
  } catch (err) {
    logger.warn({ err: err.message, invoiceId: invoice._id }, 'stk push failed');
    return errorResponse(res, 'Failed to send STK push', 502);
  }
});

const renew = asyncHandler(async (req, res) => {
  const tenant = await Tenant.findById(req.user.tenantId).lean();
  if (!tenant) return errorResponse(res, 'Tenant not found', 404);

  const plan = await Plan.findOne({ code: tenant.planCode }).lean();
  if (!plan) return errorResponse(res, 'Plan not found', 404);

  const owner = { fullName: req.user.fullName, email: req.user.email, phone: req.user.phone };

  const { invoice, instructions } = await invoiceService.generateSubscriptionInvoice({
    tenantId: tenant._id,
    owner,
    tenant,
    plan,
  });

  return successResponse(res, { invoice, instructions }, 'Renewal invoice created');
});

const upgrade = asyncHandler(async (req, res) => {
  const { planCode } = req.body;
  if (!planCode) return errorResponse(res, 'Plan code required', 400);

  const tenant = await Tenant.findById(req.user.tenantId).lean();
  if (!tenant) return errorResponse(res, 'Tenant not found', 404);
  if (tenant.planCode === planCode) return errorResponse(res, 'Already on this plan', 400);

  const plan = await Plan.findOne({ code: planCode, isActive: true, isPublic: true }).lean();
  if (!plan) return errorResponse(res, 'Plan not found', 404);

  const owner = { fullName: req.user.fullName, email: req.user.email, phone: req.user.phone };

  const { invoice, instructions } = await invoiceService.generateSubscriptionInvoice({
    tenantId: tenant._id,
    owner,
    tenant,
    plan,
  });

  return successResponse(res, { invoice, instructions }, 'Upgrade invoice created');
});

module.exports = { currentInvoice, invoices, invoiceByNumber, stkPush, renew, upgrade };
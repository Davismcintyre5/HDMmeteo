const Invoice = require('../../models/client/Invoice');
const Tenant = require('../../models/admin/Tenant');
const invoiceService = require('../../services/invoiceService');
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

  const [items, total] = await Promise.all([
    Invoice.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    Invoice.countDocuments(filter),
  ]);
  return successResponse(res, { items, meta: buildMeta(total, page, limit) });
});

const get = asyncHandler(async (req, res) => {
  const invoice = await Invoice.findById(req.params.id).lean();
  if (!invoice) return errorResponse(res, 'Invoice not found', 404);
  return successResponse(res, { invoice });
});

const approve = asyncHandler(async (req, res) => {
  const invoice = await Invoice.findById(req.params.id);
  if (!invoice) return errorResponse(res, 'Invoice not found', 404);

  const tenant = await Tenant.findById(invoice.tenantId);
  if (tenant) {
    tenant.subscriptionStatus = 'active';
    await tenant.save();
  }

  const brand = await settingsService.getBrand();
  if (invoice.customerSnapshot?.email) {
    emailService.sendPaymentReceived({
      tenantId: invoice.tenantId,
      to: invoice.customerSnapshot.email,
      businessName: brand.name,
      customerName: invoice.customerSnapshot.name || 'Customer',
      invoiceNumber: invoice.invoiceNumber,
      amount: invoice.amountPaid || invoice.total,
      currency: invoice.currency,
      paidAt: invoice.paidAt || new Date(),
      paymentMethod: invoice.paymentMethod,
      paymentReference: invoice.paymentRef,
    }).catch(() => {});
  }

  return successResponse(res, { approved: true, invoice: { id: String(invoice._id), status: 'paid' } }, 'Invoice approved');
});

const cancel = asyncHandler(async (req, res) => {
  const { reason } = req.body;
  const invoice = await Invoice.findById(req.params.id);
  if (!invoice) return errorResponse(res, 'Invoice not found', 404);
  if (invoice.status === 'paid') return errorResponse(res, 'Cannot cancel a paid invoice', 400);

  invoice.status = 'cancelled';
  await invoice.save();

  const brand = await settingsService.getBrand();
  if (invoice.customerSnapshot?.email) {
    emailService.sendInvoiceCancelled({
      tenantId: invoice.tenantId,
      to: invoice.customerSnapshot.email,
      businessName: brand.name,
      customerName: invoice.customerSnapshot.name || 'Customer',
      invoiceNumber: invoice.invoiceNumber,
      reason,
    }).catch(() => {});
  }

  return successResponse(res, { cancelled: true }, 'Invoice cancelled');
});

const markPaid = asyncHandler(async (req, res) => {
  const { method, reference, amountPaid } = req.body;
  if (!method) return errorResponse(res, 'Payment method required', 400);

  const invoice = await invoiceService.markPaid({
    invoiceId: req.params.id,
    method,
    reference,
    amountPaid,
  });

  return successResponse(res, { invoice }, 'Invoice marked paid');
});

const resend = asyncHandler(async (req, res) => {
  const invoice = await Invoice.findById(req.params.id).lean();
  if (!invoice) return errorResponse(res, 'Invoice not found', 404);

  const brand = await settingsService.getBrand();
  if (invoice.customerSnapshot?.email) {
    await emailService.sendInvoice({
      tenantId: invoice.tenantId,
      to: invoice.customerSnapshot.email,
      businessName: brand.name,
      customerName: invoice.customerSnapshot.name || 'Customer',
      invoiceNumber: invoice.invoiceNumber,
      items: invoice.items,
      subtotal: invoice.subtotal,
      discount: invoice.discount,
      tax: invoice.tax,
      total: invoice.total,
      amountDue: invoice.amountDue,
      currency: invoice.currency,
      dueDate: invoice.dueDate,
      issuedAt: invoice.issuedAt,
      notes: invoice.notes,
      instructions: invoice.paymentInstructions,
      payUrl: `${process.env.CLIENT_URL}/invoice/${invoice.invoiceNumber}`,
    });
  }

  return successResponse(res, { sent: true }, 'Invoice resent');
});

module.exports = { list, get, approve, cancel, markPaid, resend };
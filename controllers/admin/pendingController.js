const Tenant = require('../../models/admin/Tenant');
const User = require('../../models/client/User');
const Invoice = require('../../models/client/Invoice');
const Payment = require('../../models/admin/Payment');
const Plan = require('../../models/admin/Plan');
const invoiceService = require('../../services/invoiceService');
const paymentNotifyService = require('../../services/paymentNotifyService');
const { successResponse, errorResponse } = require('../../utils/response');
const asyncHandler = require('../../utils/asyncHandler');
const { parsePagination, buildMeta } = require('../../utils/pagination');
const { logger } = require('../../utils/logger');

/* ── LIST ── */
const list = asyncHandler(async (req, res) => {
  const { page, limit, skip } = parsePagination(req.query);
  const tab = req.query.tab || 'registrations';

  if (tab === 'registrations') {
    const [items, total, renewals, upgrades] = await Promise.all([
      Tenant.find({ status: 'pending' }).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      Tenant.countDocuments({ status: 'pending' }),
      Invoice.countDocuments({ status: { $in: ['sent', 'overdue'] }, 'items.description': /renewal/i }),
      Invoice.countDocuments({ status: { $in: ['sent', 'overdue'] }, 'items.description': /upgrade/i }),
    ]);
    return successResponse(res, {
      items,
      meta: buildMeta(total, page, limit),
      counts: { registrations: total, renewals, upgrades },
    });
  }

  const filter = tab === 'renewals'
    ? { status: { $in: ['sent', 'overdue'] }, 'items.description': /renewal/i }
    : { status: { $in: ['sent', 'overdue'] }, 'items.description': /upgrade/i };

  const [items, total] = await Promise.all([
    Invoice.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    Invoice.countDocuments(filter),
  ]);
  return successResponse(res, { items, meta: buildMeta(total, page, limit) });
});

/* ── GET ONE ── */
const get = asyncHandler(async (req, res) => {
  const tenant = await Tenant.findById(req.params.id).lean();
  if (!tenant) return errorResponse(res, 'Tenant not found', 404);

  const owner = await User.findOne({ tenantId: tenant._id, role: 'owner' }).lean();
  const invoice = await Invoice.findOne({ tenantId: tenant._id, status: { $in: ['sent', 'overdue', 'paid'] } })
    .sort({ createdAt: -1 })
    .lean();

  return successResponse(res, { tenant, owner, invoice });
});

/* ── APPROVE ── */
const approve = asyncHandler(async (req, res) => {
  const tenant = await Tenant.findById(req.params.id);
  if (!tenant) return errorResponse(res, 'Tenant not found', 404);

  tenant.status = 'active';
  if (tenant.subscriptionStatus === 'pending') tenant.subscriptionStatus = 'active';
  await tenant.save();

  const [owner, plan] = await Promise.all([
    User.findOne({ tenantId: tenant._id, role: 'owner' }).lean(),
    tenant.planCode ? Plan.findOne({ code: tenant.planCode }).lean() : null,
  ]);

  await paymentNotifyService
    .notifyTenantApproved({ tenant: tenant.toObject(), owner, plan })
    .catch((err) => logger.warn({ err: err.message }, 'tenant approved notify failed'));

  return successResponse(
    res,
    { approved: true, tenant: { id: String(tenant._id), status: tenant.status } },
    'Tenant approved'
  );
});

/* ── REJECT ── */
const reject = asyncHandler(async (req, res) => {
  const { reason } = req.body;
  const tenant = await Tenant.findById(req.params.id);
  if (!tenant) return errorResponse(res, 'Tenant not found', 404);

  tenant.status = 'rejected';
  await tenant.save();

  const owner = await User.findOne({ tenantId: tenant._id, role: 'owner' }).lean();
  if (owner) {
    const emailService = require('../../services/emailService');
    emailService
      .sendRegistrationRejected({
        tenantId: tenant._id,
        recipientId: owner._id,
        to: owner.email,
        name: owner.fullName,
        businessName: tenant.name,
        reason,
      })
      .catch(() => {});
  }

  return successResponse(res, { rejected: true }, 'Tenant rejected');
});

/* ── CONFIRM PAYMENT (admin manual) ── */
const confirmPayment = asyncHandler(async (req, res) => {
  const { method, reference, note } = req.body;
  if (!method) return errorResponse(res, 'Payment method required', 400);

  const tenant = await Tenant.findById(req.params.id);
  if (!tenant) return errorResponse(res, 'Tenant not found', 404);

  const invoice = await Invoice.findOne({ tenantId: tenant._id, status: { $in: ['sent', 'overdue'] } })
    .sort({ createdAt: -1 });
  if (!invoice) return errorResponse(res, 'No open invoice', 400);

  /* 1. Create payment row */
  await Payment.create({
    tenantId: tenant._id,
    invoiceId: invoice._id,
    type: 'payment',
    direction: 'in',
    method,
    amount: invoice.amountDue,
    currency: invoice.currency,
    status: 'success',
    reference: reference || null,
    raw: { note: note || null, confirmedByAdminId: req.user.id },
  });

  /* 2. Mark invoice paid + extend subscription */
  const paidInvoice = await invoiceService.markPaid({
    invoiceId: invoice._id,
    method,
    reference,
    amountPaid: invoice.amountDue,
  });

  /* 3. Load owner for notifications */
  const owner = await User.findOne({ tenantId: tenant._id, role: 'owner' }).lean();

  /* 4. Notify user + admins + sockets */
  await paymentNotifyService
    .notifyPaymentReceived({
      invoice: paidInvoice,
      tenant: tenant.toObject(),
      owner,
      paymentMethod: method,
      paymentReference: reference || null,
      paidAt: paidInvoice.paidAt,
    })
    .catch((err) => logger.warn({ err: err.message }, 'payment notify failed'));

  return successResponse(
    res,
    { confirmed: true, invoice: { id: String(paidInvoice._id), status: paidInvoice.status } },
    'Payment confirmed'
  );
});

module.exports = { list, get, approve, reject, confirmPayment };
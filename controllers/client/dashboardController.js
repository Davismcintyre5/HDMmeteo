const Tenant = require('../../models/admin/Tenant');
const Invoice = require('../../models/client/Invoice');
const Payment = require('../../models/admin/Payment');
const ApiKey = require('../../models/client/ApiKey');
const planService = require('../../services/planService');
const { successResponse, errorResponse } = require('../../utils/response');
const asyncHandler = require('../../utils/asyncHandler');

const overview = asyncHandler(async (req, res) => {
  const tenantId = req.user.tenantId;

  const tenant = await Tenant.findById(tenantId)
    .select('name planCode billingInterval subscriptionStatus currentPeriodStart currentPeriodEnd')
    .lean();
  if (!tenant) return errorResponse(res, 'Tenant not found', 404);

  const plan = await planService.getByCode(tenant.planCode);

  const [activeKeys, totalKeys, paidAgg, openInvoices] = await Promise.all([
    ApiKey.countDocuments({ tenantId, status: 'active' }),
    ApiKey.countDocuments({ tenantId }),
    Payment.aggregate([
      { $match: { tenantId, type: 'payment', status: 'success' } },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]),
    Invoice.countDocuments({ tenantId, status: { $in: ['sent', 'overdue'] } }),
  ]);

  return successResponse(res, {
    tenant,
    plan: {
      code: plan.code,
      name: plan.name,
      price: plan.price,
      features: plan.features,
    },
    subscription: {
      status: tenant.subscriptionStatus,
      interval: tenant.billingInterval,
      currentPeriodStart: tenant.currentPeriodStart,
      currentPeriodEnd: tenant.currentPeriodEnd,
    },
    usage: {
      apiKeys: { active: activeKeys, total: totalKeys },
      totalPaid: paidAgg[0]?.total || 0,
      openInvoices,
    },
  });
});

const usage = asyncHandler(async (req, res) => {
  const tenantId = req.user.tenantId;
  const [activeKeys, totalKeys] = await Promise.all([
    ApiKey.countDocuments({ tenantId, status: 'active' }),
    ApiKey.countDocuments({ tenantId }),
  ]);
  return successResponse(res, {
    apiKeys: { active: activeKeys, total: totalKeys },
  });
});

const recentInvoices = asyncHandler(async (req, res) => {
  const invoices = await Invoice.find({ tenantId: req.user.tenantId })
    .sort({ createdAt: -1 })
    .limit(10)
    .lean();
  return successResponse(res, { invoices });
});

module.exports = { overview, usage, recentInvoices };
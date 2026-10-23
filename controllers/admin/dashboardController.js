const Tenant = require('../../models/admin/Tenant');
const Invoice = require('../../models/client/Invoice');
const Payment = require('../../models/admin/Payment');
const User = require('../../models/client/User');
const { successResponse } = require('../../utils/response');
const asyncHandler = require('../../utils/asyncHandler');

const stats = asyncHandler(async (req, res) => {
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const [tenants, activeTenants, pendingTenants, users, revenue, paidThisMonth, overdueInvoices] = await Promise.all([
    Tenant.countDocuments(),
    Tenant.countDocuments({ status: 'active', subscriptionStatus: 'active' }),
    Tenant.countDocuments({ status: 'pending' }),
    User.countDocuments({ status: 'active' }),
    Payment.aggregate([
      { $match: { type: 'payment', status: 'success' } },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]),
    Payment.aggregate([
      { $match: { type: 'payment', status: 'success', createdAt: { $gte: monthStart } } },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]),
    Invoice.countDocuments({ status: 'overdue' }),
  ]);

  return successResponse(res, {
    tenants,
    activeTenants,
    pendingTenants,
    users,
    revenueTotal: revenue[0]?.total || 0,
    revenueThisMonth: paidThisMonth[0]?.total || 0,
    overdueInvoices,
  });
});

const recentActivity = asyncHandler(async (req, res) => {
  const [recentTenants, recentPayments] = await Promise.all([
    Tenant.find().sort({ createdAt: -1 }).limit(10).select('name slug status createdAt').lean(),
    Payment.find({ type: 'payment', status: 'success' }).sort({ createdAt: -1 }).limit(10).lean(),
  ]);
  return successResponse(res, { recentTenants, recentPayments });
});

module.exports = { stats, recentActivity };
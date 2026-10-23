const Tenant = require('../models/admin/Tenant');
const planService = require('./planService');
const { logger } = require('../utils/logger');

const INTERVAL_MS = {
  month: 30 * 24 * 60 * 60 * 1000,
  year: 365 * 24 * 60 * 60 * 1000,
};

async function extendOnPayment(invoice) {
  const tenant = await Tenant.findById(invoice.tenantId);
  if (!tenant) return null;

  const plan = await planService.getByCode(tenant.planCode);
  const interval = plan.price?.interval || 'month';
  const now = new Date();

  const base = interval === 'once'
    ? now
    : (tenant.currentPeriodEnd && tenant.currentPeriodEnd > now ? tenant.currentPeriodEnd : now);

  const end = interval === 'once' ? null : new Date(base.getTime() + INTERVAL_MS[interval]);

  tenant.billingInterval = interval;
  tenant.subscriptionStatus = 'active';
  tenant.currentPeriodStart = base;
  tenant.currentPeriodEnd = end;
  tenant.lastInvoiceId = invoice._id;
  await tenant.save();

  planService.invalidateCache(tenant.planCode);
  logger.info({ tenantId: tenant._id, interval, end }, 'subscription extended');
  return tenant;
}

async function expireSubscriptions() {
  const now = new Date();
  const result = await Tenant.updateMany(
    { subscriptionStatus: 'active', currentPeriodEnd: { $ne: null, $lt: now } },
    { $set: { subscriptionStatus: 'expired' } }
  );
  logger.info({ modified: result.modifiedCount }, 'expired subscriptions');
  return result.modifiedCount;
}

module.exports = { extendOnPayment, expireSubscriptions };
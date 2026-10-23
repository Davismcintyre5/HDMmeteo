const Tenant = require('../models/admin/Tenant');
const User = require('../models/client/User');
const planService = require('../services/planService');
const subscriptionService = require('../services/subscriptionService');
const emailService = require('../services/emailService');
const smsService = require('../services/smsService');
const socketService = require('../services/socketService');
const { logger } = require('../utils/logger');

const cron = '0 * * * *';

async function notifyOwner(tenant, { template, plan, daysLeft }) {
  const owner = await User.findOne({ tenantId: tenant._id, role: 'owner' })
    .select('fullName email phone')
    .lean();
  if (!owner) return;

  const renewUrl = `${process.env.API_URL}/billing/renew`;
  const vars = {
    tenantId: tenant._id,
    recipientId: owner._id,
    to: owner.email,
    businessName: tenant.name,
    planName: plan.name,
    daysLeft,
    renewUrl,
  };

  try {
    if (template === 'expiring') {
      await emailService.sendSubscriptionExpiring(vars);
      if (daysLeft === 1 && owner.phone) {
        await smsService.sendSubscriptionExpiring({ ...vars, to: owner.phone, shortUrl: renewUrl });
      }
    } else if (template === 'expired') {
      await emailService.sendSubscriptionExpired(vars);
      if (owner.phone) {
        await smsService.sendSubscriptionExpired({ ...vars, to: owner.phone, shortUrl: renewUrl });
      }
    }
  } catch (err) {
    logger.warn({ err: err.message, tenantId: tenant._id }, 'expiry notify failed');
  }
}

async function run() {
  const now = new Date();
  const tenants = await Tenant.find({
    status: 'active',
    subscriptionStatus: 'active',
    currentPeriodEnd: { $ne: null },
  }).lean();

  for (const tenant of tenants) {
    const msLeft = tenant.currentPeriodEnd.getTime() - now.getTime();
    if (msLeft < 0) continue;

    const daysLeft = Math.ceil(msLeft / (24 * 60 * 60 * 1000));
    if (daysLeft !== 3 && daysLeft !== 1) continue;

    try {
      const plan = await planService.getByCode(tenant.planCode);
      await notifyOwner(tenant, { template: 'expiring', plan, daysLeft });
    } catch (err) {
      logger.warn({ err: err.message, tenantId: tenant._id }, 'expiry reminder failed');
    }
  }

  const expired = await Tenant.find({
    status: 'active',
    subscriptionStatus: 'active',
    currentPeriodEnd: { $ne: null, $lt: now },
  }).lean();

  for (const tenant of expired) {
    try {
      const plan = await planService.getByCode(tenant.planCode);
      await notifyOwner(tenant, { template: 'expired', plan, daysLeft: 0 });
      socketService.emitToAdmin('tenant:expired', { tenantId: String(tenant._id), name: tenant.name });
    } catch (err) {
      logger.warn({ err: err.message, tenantId: tenant._id }, 'expired notify failed');
    }
  }

  const count = await subscriptionService.expireSubscriptions();
  logger.info({ expiringChecked: tenants.length, expired: count }, 'subscription expiry done');
}

module.exports = { cron, run };
const Tenant = require('../../models/admin/Tenant');
const planService = require('../../services/planService');
const { ApiError } = require('../../utils/apiError');

module.exports = function requireTenant(opts = {}) {
  const { feature } = opts;

  return async function (req, res, next) {
    try {
      const tenantId = req.tenantId || req.user?.tenantId;
      if (!tenantId) throw ApiError.unauthorized('TENANT_MISSING', 'Tenant required');

      const tenant = await Tenant.findById(tenantId)
        .select('status subscriptionStatus currentPeriodEnd planCode')
        .lean();

      if (!tenant) throw ApiError.unauthorized('TENANT_NOT_FOUND', 'Tenant not found');
      if (tenant.status !== 'active') throw ApiError.forbidden('TENANT_INACTIVE', 'Tenant inactive');
      if (tenant.subscriptionStatus !== 'active') {
        throw ApiError.paymentRequired('SUBSCRIPTION_REQUIRED', 'Subscription required');
      }
      if (tenant.currentPeriodEnd && tenant.currentPeriodEnd < new Date()) {
        throw ApiError.paymentRequired('SUBSCRIPTION_EXPIRED', 'Subscription expired');
      }

      if (feature) {
        const plan = await planService.getByCode(tenant.planCode);
        if (plan.features?.[feature] !== true) {
          throw ApiError.forbidden('FEATURE_NOT_IN_PLAN', `${feature} is not available on plan '${plan.name}'`);
        }
      }

      req.tenant = tenant;
      next();
    } catch (err) {
      next(err);
    }
  };
};
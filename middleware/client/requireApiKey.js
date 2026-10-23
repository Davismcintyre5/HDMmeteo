const { sha256 } = require('../../utils/hash');
const { ApiError } = require('../../utils/apiError');
const ApiKey = require('../../models/client/ApiKey');
const Tenant = require('../../models/admin/Tenant');

module.exports = function requireApiKey(requiredScope = null) {
  return async function (req, res, next) {
    try {
      const header = req.get('authorization') || req.get('x-api-key') || '';
      const raw = header.startsWith('Bearer ') ? header.slice(7) : header;

      if (!raw || !raw.startsWith('hdm_meteo_')) {
        throw ApiError.unauthorized('API_KEY_REQUIRED', 'API key required');
      }

      const hash = sha256(raw);
      const key = await ApiKey.findOne({ hash, status: 'active' }).lean();
      if (!key) throw ApiError.unauthorized('INVALID_API_KEY', 'Invalid API key');

      if (key.expiresAt && key.expiresAt < new Date()) {
        throw ApiError.unauthorized('API_KEY_EXPIRED', 'API key expired');
      }

      if (requiredScope && !key.scopes.includes(requiredScope)) {
        throw ApiError.forbidden('SCOPE_NOT_ALLOWED', `Scope '${requiredScope}' not allowed`);
      }

      const tenant = await Tenant.findById(key.tenantId)
        .select('status subscriptionStatus currentPeriodEnd planCode')
        .lean();

      if (!tenant || tenant.status !== 'active') {
        throw ApiError.forbidden('TENANT_INACTIVE', 'Tenant inactive');
      }
      if (tenant.subscriptionStatus !== 'active') {
        throw ApiError.paymentRequired('SUBSCRIPTION_REQUIRED', 'Subscription required');
      }
      if (tenant.currentPeriodEnd && tenant.currentPeriodEnd < new Date()) {
        throw ApiError.paymentRequired('SUBSCRIPTION_EXPIRED', 'Subscription expired');
      }

      ApiKey.updateOne({ _id: key._id }, { $set: { lastUsedAt: new Date() } }).catch(() => {});

      req.apiKey = key;
      req.tenantId = String(key.tenantId);
      req.tenant = tenant;
      next();
    } catch (err) {
      next(err);
    }
  };
};
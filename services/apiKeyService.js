const crypto = require('crypto');
const ApiKey = require('../models/client/ApiKey');
const User = require('../models/client/User');
const settingsService = require('./settingsService');
const { ApiError } = require('../utils/apiError');

function generate(prefix) {
  const secret = crypto.randomBytes(32).toString('base64url');
  const full = `${prefix}${secret}`;
  return {
    full,
    prefix,
    last4: secret.slice(-4),
    hash: crypto.createHash('sha256').update(full).digest('hex'),
  };
}

async function resolveLimit(userId) {
  const settings = await settingsService.getApiKeys();
  const user = await User.findById(userId).select('apiKeyLimit').lean();
  if (user?.apiKeyLimit === null || user?.apiKeyLimit === undefined) return settings.maxPerUser;
  return user.apiKeyLimit;
}

async function create({ tenantId, userId, name, scopes, expiresAt }) {
  const settings = await settingsService.getApiKeys();
  const limit = await resolveLimit(userId);

  const activeCount = await ApiKey.countDocuments({ tenantId, userId, status: 'active' });
  if (limit !== 0 && activeCount >= limit) {
    throw ApiError.badRequest('API_KEY_LIMIT_REACHED', `Max ${limit} active key${limit === 1 ? '' : 's'}. Revoke one first.`);
  }

  const g = generate(settings.livePrefix);
  const doc = await ApiKey.create({
    tenantId,
    userId,
    name,
    prefix: g.prefix,
    hash: g.hash,
    last4: g.last4,
    scopes: scopes?.length ? scopes : settings.allowedScopes,
    expiresAt: expiresAt || (settings.defaultExpiryDays ? new Date(Date.now() + settings.defaultExpiryDays * 864e5) : null),
  });

  return { apiKey: doc, plaintext: g.full };
}

async function list({ tenantId, userId }) {
  const settings = await settingsService.getApiKeys();
  const limit = await resolveLimit(userId);
  const keys = await ApiKey.find({ tenantId, userId }).sort({ createdAt: -1 }).lean();
  const used = keys.filter((k) => k.status === 'active').length;
  return {
    maxAllowed: limit,
    used,
    unlimited: limit === 0,
    keys: keys.map((k) => ({
      ...k,
      id: String(k._id),
      masked: `${k.prefix}••••${k.last4}`,
      _id: undefined,
      hash: undefined,
    })),
  };
}

async function revoke({ id, tenantId, userId, revokedBy }) {
  const key = await ApiKey.findOne({ _id: id, tenantId, userId });
  if (!key) throw ApiError.notFound('API_KEY_NOT_FOUND', 'API key not found');
  if (key.status === 'revoked') return key;

  key.status = 'revoked';
  key.revokedAt = new Date();
  key.revokedBy = revokedBy || userId;
  await key.save();
  return key;
}

async function revokeAny({ id, revokedBy }) {
  const key = await ApiKey.findById(id);
  if (!key) throw ApiError.notFound('API_KEY_NOT_FOUND', 'API key not found');
  if (key.status === 'revoked') return key;
  key.status = 'revoked';
  key.revokedAt = new Date();
  key.revokedBy = revokedBy || null;
  await key.save();
  return key;
}

async function findActiveByHash(hash) {
  return ApiKey.findOne({ hash, status: 'active' }).lean();
}

module.exports = { create, list, revoke, revokeAny, findActiveByHash, generate };
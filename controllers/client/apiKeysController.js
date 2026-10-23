const ApiKey = require('../../models/client/ApiKey');
const apiKeyService = require('../../services/apiKeyService');
const emailService = require('../../services/emailService');
const { successResponse, errorResponse } = require('../../utils/response');
const asyncHandler = require('../../utils/asyncHandler');

const list = asyncHandler(async (req, res) => {
  const data = await apiKeyService.list({ tenantId: req.user.tenantId, userId: req.user.id });
  return successResponse(res, data);
});

const create = asyncHandler(async (req, res) => {
  const { name, scopes, expiresAt } = req.body;
  if (!name || !name.trim()) return errorResponse(res, 'Name required', 400);

  try {
    const { apiKey, plaintext } = await apiKeyService.create({
      tenantId: req.user.tenantId,
      userId: req.user.id,
      name: name.trim(),
      scopes,
      expiresAt: expiresAt ? new Date(expiresAt) : null,
    });

    emailService.sendApiKeyCreated({
      tenantId: req.user.tenantId,
      recipientId: req.user.id,
      to: req.user.email,
      fullName: req.user.fullName,
      keyName: apiKey.name,
      keyPrefix: apiKey.prefix,
      keyLast4: apiKey.last4,
      scopes: apiKey.scopes,
      loginUrl: `${process.env.CLIENT_URL}/api-keys`,
    }).catch(() => {});

    return successResponse(res, {
      key: {
        id: String(apiKey._id),
        name: apiKey.name,
        masked: `${apiKey.prefix}••••${apiKey.last4}`,
        scopes: apiKey.scopes,
        expiresAt: apiKey.expiresAt,
        createdAt: apiKey.createdAt,
      },
      plaintext,
      warning: 'Copy this now. You won\'t be able to see it again.',
    }, 'API key created', 201);
  } catch (err) {
    if (err.code === 'API_KEY_LIMIT_REACHED') return errorResponse(res, err.message, 400);
    throw err;
  }
});

const revoke = asyncHandler(async (req, res) => {
  try {
    const key = await apiKeyService.revoke({
      id: req.params.id,
      tenantId: req.user.tenantId,
      userId: req.user.id,
      revokedBy: req.user.id,
    });

    emailService.sendApiKeyRevoked({
      tenantId: req.user.tenantId,
      recipientId: req.user.id,
      to: req.user.email,
      fullName: req.user.fullName,
      keyName: key.name,
      loginUrl: `${process.env.CLIENT_URL}/api-keys`,
    }).catch(() => {});

    return successResponse(res, { revoked: true }, 'API key revoked');
  } catch (err) {
    if (err.code === 'API_KEY_NOT_FOUND') return errorResponse(res, 'API key not found', 404);
    throw err;
  }
});

const rotate = asyncHandler(async (req, res) => {
  try {
    await apiKeyService.revoke({
      id: req.params.id,
      tenantId: req.user.tenantId,
      userId: req.user.id,
      revokedBy: req.user.id,
    });
  } catch (err) {
    if (err.code === 'API_KEY_NOT_FOUND') return errorResponse(res, 'API key not found', 404);
    throw err;
  }

  const { apiKey, plaintext } = await apiKeyService.create({
    tenantId: req.user.tenantId,
    userId: req.user.id,
    name: `Rotated ${new Date().toISOString().slice(0, 10)}`,
  });

  return successResponse(res, {
    key: {
      id: String(apiKey._id),
      name: apiKey.name,
      masked: `${apiKey.prefix}••••${apiKey.last4}`,
      scopes: apiKey.scopes,
    },
    plaintext,
    warning: 'Copy this now. You won\'t be able to see it again.',
  }, 'API key rotated', 201);
});

module.exports = { list, create, revoke, rotate };
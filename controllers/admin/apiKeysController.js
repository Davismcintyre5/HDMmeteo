const ApiKey = require('../../models/client/ApiKey');
const apiKeyService = require('../../services/apiKeyService');
const emailService = require('../../services/emailService');
const User = require('../../models/client/User');
const { successResponse, errorResponse } = require('../../utils/response');
const asyncHandler = require('../../utils/asyncHandler');
const { parsePagination, buildMeta } = require('../../utils/pagination');

const listAll = asyncHandler(async (req, res) => {
  const { page, limit, skip } = parsePagination(req.query);
  const filter = {};
  if (req.query.tenantId) filter.tenantId = req.query.tenantId;
  if (req.query.status) filter.status = req.query.status;

  const [items, total] = await Promise.all([
    ApiKey.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    ApiKey.countDocuments(filter),
  ]);

  return successResponse(res, {
    items: items.map((k) => ({ ...k, id: String(k._id), masked: `${k.prefix}••••${k.last4}`, _id: undefined, hash: undefined })),
    meta: buildMeta(total, page, limit),
  });
});

const revokeAny = asyncHandler(async (req, res) => {
  const key = await apiKeyService.revokeAny({ id: req.params.id, revokedBy: req.user.id });

  const user = await User.findById(key.userId).select('fullName email').lean();
  if (user) {
    emailService.sendApiKeyRevoked({
      tenantId: key.tenantId,
      recipientId: key.userId,
      to: user.email,
      fullName: user.fullName,
      keyName: key.name,
      loginUrl: `${process.env.CLIENT_URL}/api-keys`,
    }).catch(() => {});
  }

  return successResponse(res, { revoked: true }, 'API key revoked');
});

module.exports = { listAll, revokeAny };
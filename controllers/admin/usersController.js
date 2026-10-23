const User = require('../../models/client/User');
const { successResponse, errorResponse } = require('../../utils/response');
const asyncHandler = require('../../utils/asyncHandler');
const { parsePagination, buildMeta } = require('../../utils/pagination');

const list = asyncHandler(async (req, res) => {
  const { page, limit, skip } = parsePagination(req.query);
  const filter = {};
  if (req.query.tenantId) filter.tenantId = req.query.tenantId;
  if (req.query.status) filter.status = req.query.status;
  if (req.query.search) filter.email = new RegExp(req.query.search, 'i');

  const [items, total] = await Promise.all([
    User.find(filter).select('-password').sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    User.countDocuments(filter),
  ]);
  return successResponse(res, { items, meta: buildMeta(total, page, limit) });
});

const get = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id).select('-password').lean();
  if (!user) return errorResponse(res, 'User not found', 404);
  return successResponse(res, { user });
});

const update = asyncHandler(async (req, res) => {
  const allowed = ['fullName', 'phone', 'role', 'status', 'apiKeyLimit'];
  const patch = {};
  for (const key of allowed) if (req.body[key] !== undefined) patch[key] = req.body[key];

  const user = await User.findByIdAndUpdate(req.params.id, { $set: patch }, { new: true }).select('-password').lean();
  if (!user) return errorResponse(res, 'User not found', 404);
  return successResponse(res, { user }, 'User updated');
});

const resetPassword = asyncHandler(async (req, res) => {
  const { newPassword } = req.body;
  if (!newPassword || newPassword.length < 8) return errorResponse(res, 'Min 8 characters', 400);

  const user = await User.findById(req.params.id).select('+password');
  if (!user) return errorResponse(res, 'User not found', 404);

  user.password = newPassword;
  await user.save();

  return successResponse(res, null, 'Password reset');
});

const setApiKeyLimit = asyncHandler(async (req, res) => {
  const { apiKeyLimit } = req.body;
  if (apiKeyLimit !== null && (typeof apiKeyLimit !== 'number' || apiKeyLimit < 0)) {
    return errorResponse(res, 'apiKeyLimit must be null or >= 0', 400);
  }

  const user = await User.findByIdAndUpdate(req.params.id, { $set: { apiKeyLimit } }, { new: true }).select('-password').lean();
  if (!user) return errorResponse(res, 'User not found', 404);
  return successResponse(res, { user }, 'API key limit updated');
});

module.exports = { list, get, update, resetPassword, setApiKeyLimit };
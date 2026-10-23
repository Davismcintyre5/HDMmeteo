const User = require('../../models/client/User');
const emailService = require('../../services/emailService');
const { successResponse, errorResponse } = require('../../utils/response');
const asyncHandler = require('../../utils/asyncHandler');

const get = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id).select('fullName email phone role status emailVerifiedAt lastLoginAt createdAt').lean();
  if (!user) return errorResponse(res, 'User not found', 404);
  return successResponse(res, { user });
});

const update = asyncHandler(async (req, res) => {
  const allowed = ['fullName', 'phone'];
  const patch = {};
  for (const key of allowed) if (req.body[key] !== undefined) patch[key] = req.body[key];

  const user = await User.findByIdAndUpdate(req.user.id, { $set: patch }, { new: true, runValidators: true })
    .select('fullName email phone role status')
    .lean();
  if (!user) return errorResponse(res, 'User not found', 404);
  return successResponse(res, { user }, 'Profile updated');
});

const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword) return errorResponse(res, 'Both passwords required', 400);
  if (newPassword.length < 8) return errorResponse(res, 'New password must be at least 8 characters', 400);

  const user = await User.findById(req.user.id).select('+password');
  if (!user) return errorResponse(res, 'User not found', 404);

  const isMatch = await user.comparePassword(currentPassword);
  if (!isMatch) return errorResponse(res, 'Current password is incorrect', 400);

  user.password = newPassword;
  await user.save();

  emailService.sendPasswordChanged({
    tenantId: req.user.tenantId,
    recipientId: user._id,
    to: user.email,
    fullName: user.fullName,
    when: new Date().toISOString(),
    ip: req.ip,
  }).catch(() => {});

  return successResponse(res, null, 'Password changed');
});

module.exports = { get, update, changePassword };
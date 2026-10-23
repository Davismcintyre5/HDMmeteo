const Admin = require('../../models/admin/Admin');
const { generateToken, generateRefreshToken } = require('../../utils/jwt');
const { successResponse, errorResponse } = require('../../utils/response');
const asyncHandler = require('../../utils/asyncHandler');
const emailService = require('../../services/emailService');

const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) return errorResponse(res, 'Email and password are required', 400);

  const admin = await Admin.findOne({ email: email.toLowerCase() }).select('+password');
  if (!admin) return errorResponse(res, 'Invalid credentials', 401);
  if (admin.status !== 'active') return errorResponse(res, 'Account deactivated', 403);

  const isMatch = await admin.comparePassword(password);
  if (!isMatch) return errorResponse(res, 'Invalid credentials', 401);

  admin.lastLoginAt = new Date();
  await admin.save();

  const token = generateToken(admin._id, admin.role, 'admin');
  const refreshToken = generateRefreshToken(admin._id, admin.role, 'admin');

  return successResponse(res, {
    admin: { id: admin._id, fullName: admin.fullName, email: admin.email, role: admin.role },
    token,
    refreshToken,
  }, 'Login successful');
});

const logout = asyncHandler(async (req, res) => {
  return successResponse(res, null, 'Logged out');
});

const me = asyncHandler(async (req, res) => {
  const admin = await Admin.findById(req.user.id).select('email fullName role status lastLoginAt');
  if (!admin) return errorResponse(res, 'Admin not found', 404);
  return successResponse(res, { admin });
});

const updateProfile = asyncHandler(async (req, res) => {
  const { fullName, phone } = req.body;
  const admin = await Admin.findByIdAndUpdate(
    req.user.id,
    { fullName, phone },
    { new: true, runValidators: true }
  ).select('email fullName phone role status');
  if (!admin) return errorResponse(res, 'Admin not found', 404);
  return successResponse(res, { admin }, 'Profile updated');
});

const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword) return errorResponse(res, 'Both passwords required', 400);

  const admin = await Admin.findById(req.user.id).select('+password');
  if (!admin) return errorResponse(res, 'Admin not found', 404);

  const isMatch = await admin.comparePassword(currentPassword);
  if (!isMatch) return errorResponse(res, 'Current password is incorrect', 400);

  admin.password = newPassword;
  await admin.save();

  emailService.sendPasswordChanged({
    tenantId: null,
    recipientId: admin._id,
    to: admin.email,
    fullName: admin.fullName,
    when: new Date().toISOString(),
    ip: req.ip,
  }).catch(() => {});

  return successResponse(res, null, 'Password changed successfully');
});

const createAdmin = asyncHandler(async (req, res) => {
  const { fullName, email, password, role, phone } = req.body;
  if (!fullName || !email || !password) return errorResponse(res, 'Name, email and password are required', 400);

  const existing = await Admin.findOne({ email: email.toLowerCase() });
  if (existing) return errorResponse(res, 'Email already exists', 400);

  const admin = await Admin.create({ fullName, email: email.toLowerCase(), password, role: role || 'admin', phone });

  return successResponse(res, {
    admin: { id: admin._id, fullName: admin.fullName, email: admin.email, role: admin.role },
  }, 'Admin created successfully');
});

const getAllAdmins = asyncHandler(async (req, res) => {
  const admins = await Admin.find().select('-password');
  return successResponse(res, { admins });
});

const toggleAdminStatus = asyncHandler(async (req, res) => {
  const admin = await Admin.findById(req.params.id);
  if (!admin) return errorResponse(res, 'Admin not found', 404);

  admin.status = admin.status === 'active' ? 'suspended' : 'active';
  await admin.save();

  return successResponse(res, { admin }, `Admin ${admin.status === 'active' ? 'activated' : 'suspended'}`);
});

const deleteAdmin = asyncHandler(async (req, res) => {
  const target = await Admin.findById(req.params.id);
  if (!target) return errorResponse(res, 'Admin not found', 404);

  const count = await Admin.countDocuments({ status: 'active' });
  if (target.status === 'active' && count <= 1) {
    return errorResponse(res, 'Cannot delete the last active admin', 400);
  }

  await target.deleteOne();
  return successResponse(res, null, 'Admin deleted');
});

module.exports = {
  login,
  logout,
  me,
  updateProfile,
  changePassword,
  createAdmin,
  getAllAdmins,
  toggleAdminStatus,
  deleteAdmin,
};
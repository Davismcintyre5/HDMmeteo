const Tenant = require('../../models/admin/Tenant');
const User = require('../../models/client/User');
const { successResponse, errorResponse } = require('../../utils/response');
const asyncHandler = require('../../utils/asyncHandler');
const { parsePagination, buildMeta } = require('../../utils/pagination');

const list = asyncHandler(async (req, res) => {
  const { page, limit, skip } = parsePagination(req.query);
  const filter = {};
  if (req.query.status) filter.status = req.query.status;
  if (req.query.search) filter.name = new RegExp(req.query.search, 'i');

  const [items, total] = await Promise.all([
    Tenant.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    Tenant.countDocuments(filter),
  ]);
  return successResponse(res, { items, meta: buildMeta(total, page, limit) });
});

const get = asyncHandler(async (req, res) => {
  const tenant = await Tenant.findById(req.params.id).lean();
  if (!tenant) return errorResponse(res, 'Tenant not found', 404);
  const users = await User.find({ tenantId: tenant._id }).select('-password').lean();
  return successResponse(res, { tenant, users });
});

const update = asyncHandler(async (req, res) => {
  const allowed = ['name', 'planCode', 'billingInterval', 'subscriptionStatus', 'currentPeriodStart', 'currentPeriodEnd'];
  const patch = {};
  for (const key of allowed) if (req.body[key] !== undefined) patch[key] = req.body[key];

  const tenant = await Tenant.findByIdAndUpdate(req.params.id, { $set: patch }, { new: true, runValidators: true }).lean();
  if (!tenant) return errorResponse(res, 'Tenant not found', 404);
  return successResponse(res, { tenant }, 'Tenant updated');
});

const suspend = asyncHandler(async (req, res) => {
  const tenant = await Tenant.findByIdAndUpdate(req.params.id, { $set: { status: 'suspended' } }, { new: true });
  if (!tenant) return errorResponse(res, 'Tenant not found', 404);
  return successResponse(res, { tenant }, 'Tenant suspended');
});

const reactivate = asyncHandler(async (req, res) => {
  const tenant = await Tenant.findByIdAndUpdate(
    req.params.id,
    { $set: { status: 'active', subscriptionStatus: 'active' } },
    { new: true }
  );
  if (!tenant) return errorResponse(res, 'Tenant not found', 404);
  return successResponse(res, { tenant }, 'Tenant reactivated');
});

const remove = asyncHandler(async (req, res) => {
  const tenant = await Tenant.findById(req.params.id);
  if (!tenant) return errorResponse(res, 'Tenant not found', 404);
  await User.deleteMany({ tenantId: tenant._id });
  await tenant.deleteOne();
  return successResponse(res, null, 'Tenant deleted');
});

module.exports = { list, get, update, suspend, reactivate, remove };
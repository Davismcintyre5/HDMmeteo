const Plan = require('../../models/admin/Plan');
const planService = require('../../services/planService');
const { successResponse, errorResponse } = require('../../utils/response');
const asyncHandler = require('../../utils/asyncHandler');

const list = asyncHandler(async (req, res) => {
  const plans = await Plan.find().sort({ sortOrder: 1, code: 1 }).lean();
  return successResponse(res, { plans });
});

const create = asyncHandler(async (req, res) => {
  const { code, name } = req.body;
  if (!code || !name) return errorResponse(res, 'Code and name required', 400);

  const existing = await Plan.findOne({ code });
  if (existing) return errorResponse(res, 'Plan code already exists', 400);

  const plan = await Plan.create(req.body);
  planService.invalidateCache(plan.code);

  return successResponse(res, { plan }, 'Plan created', 201);
});

const update = asyncHandler(async (req, res) => {
  const plan = await Plan.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
  if (!plan) return errorResponse(res, 'Plan not found', 404);

  planService.invalidateCache(plan.code);
  return successResponse(res, { plan }, 'Plan updated');
});

const deactivate = asyncHandler(async (req, res) => {
  const plan = await Plan.findByIdAndUpdate(req.params.id, { $set: { isActive: false } }, { new: true });
  if (!plan) return errorResponse(res, 'Plan not found', 404);

  planService.invalidateCache(plan.code);
  return successResponse(res, { plan }, 'Plan deactivated');
});

const remove = asyncHandler(async (req, res) => {
  const plan = await Plan.findById(req.params.id);
  if (!plan) return errorResponse(res, 'Plan not found', 404);

  await plan.deleteOne();
  planService.invalidateCache(plan.code);
  return successResponse(res, null, 'Plan deleted');
});

module.exports = { list, create, update, deactivate, remove };
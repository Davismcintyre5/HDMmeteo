const PaymentMethod = require('../../models/admin/PaymentMethod');
const { successResponse, errorResponse } = require('../../utils/response');
const asyncHandler = require('../../utils/asyncHandler');

const list = asyncHandler(async (req, res) => {
  const methods = await PaymentMethod.find().sort({ order: 1 }).lean();
  return successResponse(res, { methods });
});

const get = asyncHandler(async (req, res) => {
  const method = await PaymentMethod.findById(req.params.id).lean();
  if (!method) return errorResponse(res, 'Payment method not found', 404);
  return successResponse(res, { method });
});

const create = asyncHandler(async (req, res) => {
  const { code, label } = req.body;
  if (!code || !label) return errorResponse(res, 'Code and label required', 400);

  const existing = await PaymentMethod.findOne({ code });
  if (existing) return errorResponse(res, 'Payment method code already exists', 400);

  const method = await PaymentMethod.create(req.body);
  return successResponse(res, { method }, 'Payment method created', 201);
});

const update = asyncHandler(async (req, res) => {
  const method = await PaymentMethod.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
  if (!method) return errorResponse(res, 'Payment method not found', 404);
  return successResponse(res, { method }, 'Payment method updated');
});

const toggle = asyncHandler(async (req, res) => {
  const method = await PaymentMethod.findById(req.params.id);
  if (!method) return errorResponse(res, 'Payment method not found', 404);

  method.enabled = !method.enabled;
  await method.save();

  return successResponse(res, { method }, `Payment method ${method.enabled ? 'enabled' : 'disabled'}`);
});

const reorder = asyncHandler(async (req, res) => {
  const items = Array.isArray(req.body?.items) ? req.body.items : [];
  await Promise.all(
    items.map((it) => PaymentMethod.updateOne({ _id: it.id }, { $set: { order: Number(it.order) || 0 } }))
  );
  return successResponse(res, { reordered: items.length }, 'Order updated');
});

const remove = asyncHandler(async (req, res) => {
  const method = await PaymentMethod.findById(req.params.id);
  if (!method) return errorResponse(res, 'Payment method not found', 404);
  if (method.enabled) return errorResponse(res, 'Disable the method before deleting', 400);

  await method.deleteOne();
  return successResponse(res, null, 'Payment method deleted');
});

module.exports = { list, get, create, update, toggle, reorder, remove };
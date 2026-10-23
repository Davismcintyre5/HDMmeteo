const planService = require('../../services/planService');
const settingsService = require('../../services/settingsService');
const paymentInstructionsService = require('../../services/paymentInstructionsService');
const Invoice = require('../../models/client/Invoice');
const { successResponse, errorResponse } = require('../../utils/response');
const asyncHandler = require('../../utils/asyncHandler');

const plans = asyncHandler(async (req, res) => {
  const list = await planService.list({ onlyPublic: true, onlyActive: true });
  return successResponse(res, { plans: list });
});

const providers = asyncHandler(async (req, res) => {
  const weather = await settingsService.getWeather();
  return successResponse(res, { current: weather.current, forecast: weather.forecast });
});

const paymentMethods = asyncHandler(async (req, res) => {
  const methods = await paymentInstructionsService.getPublicPaymentMethods();
  return successResponse(res, { methods });
});

const brand = asyncHandler(async (req, res) => {
  const b = await settingsService.getBrand();
  return successResponse(res, {
    brand: {
      name: b.name,
      logoUrl: b.logoUrl,
      color: b.color,
      accent: b.accent,
      supportEmail: b.supportEmail,
      supportPhone: b.supportPhone,
      supportWhatsapp: b.supportWhatsapp,
      website: b.website,
      address: b.address,
    },
  });
});

const invoiceByNumber = asyncHandler(async (req, res) => {
  const invoice = await Invoice.findOne({ invoiceNumber: req.params.number }).lean();
  if (!invoice) return errorResponse(res, 'Invoice not found', 404);
  return successResponse(res, { invoice });
});

module.exports = { plans, providers, paymentMethods, brand, invoiceByNumber };
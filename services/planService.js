const Plan = require('../models/admin/Plan');
const Tenant = require('../models/admin/Tenant');
const { ApiError } = require('../utils/apiError');

const CACHE = new Map();
const CACHE_TTL_MS = 60_000;

function cacheGet(code) {
  const e = CACHE.get(code);
  if (!e) return null;
  if (Date.now() - e.at > CACHE_TTL_MS) {
    CACHE.delete(code);
    return null;
  }
  return e.plan;
}

function cacheSet(code, plan) {
  CACHE.set(code, { plan, at: Date.now() });
}

function invalidateCache(code) {
  if (code) CACHE.delete(code);
  else CACHE.clear();
}

async function list({ onlyPublic = false, onlyActive = false } = {}) {
  const filter = {};
  if (onlyPublic) filter.isPublic = true;
  if (onlyActive) filter.isActive = true;
  return Plan.find(filter).sort({ sortOrder: 1, code: 1 }).lean();
}

async function getByCode(code) {
  if (!code) throw ApiError.badRequest('PLAN_REQUIRED', 'Plan code required');
  const cached = cacheGet(code);
  if (cached) return cached;
  const plan = await Plan.findOne({ code }).lean();
  if (!plan) throw ApiError.notFound('PLAN_NOT_FOUND', `Plan '${code}' not found`);
  cacheSet(code, plan);
  return plan;
}

async function getById(id) {
  const plan = await Plan.findById(id).lean();
  if (!plan) throw ApiError.notFound('PLAN_NOT_FOUND', 'Plan not found');
  return plan;
}

async function getTenantPlan(tenantId) {
  const tenant = await Tenant.findById(tenantId).select('planCode').lean();
  if (!tenant) throw ApiError.notFound('TENANT_NOT_FOUND', 'Tenant not found');
  return getByCode(tenant.planCode || 'monthly');
}

module.exports = { list, getByCode, getById, getTenantPlan, invalidateCache };
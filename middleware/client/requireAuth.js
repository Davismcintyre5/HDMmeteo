const jwt = require('../../utils/jwt');
const { ApiError } = require('../../utils/apiError');
const User = require('../../models/client/User');

async function extractUser(req) {
  const header = req.get('authorization') || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return null;

  const payload = jwt.verify(token);
  if (payload.kind !== 'user') throw ApiError.forbidden('NOT_USER', 'User token required');

  const user = await User.findById(payload.sub)
    .select('tenantId status role fullName email phone')
    .lean();

  if (!user || user.status !== 'active') {
    throw ApiError.unauthorized('USER_INACTIVE', 'User inactive');
  }

  return {
    id: String(user._id),
    tenantId: String(user.tenantId),
    role: user.role,
    fullName: user.fullName,
    email: user.email,
    phone: user.phone,
  };
}

async function requireAuth(req, res, next) {
  try {
    const user = await extractUser(req);
    if (!user) throw ApiError.unauthorized('TOKEN_MISSING', 'Authorization token required');
    req.user = user;
    req.tenantId = user.tenantId;
    next();
  } catch (err) {
    next(err);
  }
}

async function optionalAuth(req, res, next) {
  try {
    const user = await extractUser(req);
    if (user) {
      req.user = user;
      req.tenantId = user.tenantId;
    }
    next();
  } catch {
    next();
  }
}

module.exports = { requireAuth, optionalAuth };
const jwt = require('../../utils/jwt');
const { ApiError } = require('../../utils/apiError');
const Admin = require('../../models/admin/Admin');

module.exports = async function requireAdmin(req, res, next) {
  try {
    const header = req.get('authorization') || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : null;
    if (!token) throw ApiError.unauthorized('TOKEN_MISSING', 'Authorization token required');

    const payload = jwt.verify(token);
    if (payload.kind !== 'admin') throw ApiError.forbidden('NOT_ADMIN', 'Admin token required');

    const admin = await Admin.findById(payload.sub).select('role status email fullName').lean();
    if (!admin || admin.status !== 'active') throw ApiError.unauthorized('ADMIN_INACTIVE', 'Admin account inactive');
    if (admin.role !== 'admin' && admin.role !== 'super_admin') throw ApiError.forbidden('ROLE_REQUIRED', 'Admin role required');

    req.user = { id: String(admin._id), role: admin.role, kind: 'admin', email: admin.email, fullName: admin.fullName };
    next();
  } catch (err) {
    next(err);
  }
};
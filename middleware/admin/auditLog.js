const AuditLog = require('../../models/admin/AuditLog');
const { logger } = require('../../utils/logger');

module.exports = function auditLog(action, targetType = null) {
  return async function (req, res, next) {
    const originalJson = res.json.bind(res);

    res.json = function (body) {
      if (res.statusCode < 400) {
        AuditLog.create({
          actorId: req.admin?.id,
          actorEmail: req.admin?.email,
          action,
          targetType,
          targetId: req.params?.id || null,
          meta: {
            method: req.method,
            path: req.originalUrl,
            status: res.statusCode,
          },
          ip: req.ip,
          userAgent: req.get('user-agent'),
        }).catch((err) => logger.warn({ err: err.message, action }, 'audit log failed'));
      }
      return originalJson(body);
    };

    next();
  };
};
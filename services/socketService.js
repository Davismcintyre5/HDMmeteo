const { getIO } = require('../config/socket');
const { logger } = require('../utils/logger');

function emitToAdmin(event, payload) {
  try {
    getIO().to('admin').emit(event, payload);
  } catch (err) {
    logger.warn({ event, err: err.message }, 'emitToAdmin failed');
  }
}

function emitToTenant(tenantId, event, payload) {
  try {
    getIO().to(`tenant:${tenantId}`).emit(event, payload);
  } catch (err) {
    logger.warn({ event, tenantId, err: err.message }, 'emitToTenant failed');
  }
}

function emitToUser(userId, event, payload) {
  try {
    getIO().to(`user:${userId}`).emit(event, payload);
  } catch (err) {
    logger.warn({ event, userId, err: err.message }, 'emitToUser failed');
  }
}

module.exports = { emitToAdmin, emitToTenant, emitToUser };
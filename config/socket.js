const { Server } = require('socket.io');
const env = require('./env');
const jwt = require('../utils/jwt');
const { logger } = require('../utils/logger');

let io = null;

function initSocket(httpServer) {
  if (io) return io;

  io = new Server(httpServer, {
    cors: { origin: env.CORS_ORIGINS, credentials: true },
    transports: ['websocket', 'polling'],
  });

  /* Auth middleware — decode JWT before allowing connection */
  io.use((socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      if (!token) return next(new Error('TOKEN_MISSING'));
      const payload = jwt.verify(token);
      socket.data.kind = payload.kind;
      socket.data.userId = payload.sub;
      socket.data.tenantId = payload.tenantId || null;
      socket.data.role = payload.role || null;
      next();
    } catch (err) {
      next(new Error('TOKEN_INVALID'));
    }
  });

  io.on('connection', (socket) => {
    logger.info({ id: socket.id, kind: socket.data.kind, tenantId: socket.data.tenantId }, 'socket connected');

    /* Admin joins the admin room */
    if (socket.data.kind === 'admin') {
      socket.join('admin');
    }

    /* Client user joins their tenant room */
    if (socket.data.kind === 'user' && socket.data.tenantId) {
      socket.join(`tenant:${socket.data.tenantId}`);
    }

    socket.on('disconnect', () => {
      logger.info({ id: socket.id }, 'socket disconnected');
    });
  });

  return io;
}

function getIO() {
  if (!io) throw new Error('Socket.io not initialised — call initSocket(server) first');
  return io;
}

module.exports = { initSocket, getIO };
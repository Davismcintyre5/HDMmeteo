const { Server } = require('socket.io');
const env = require('./env');
const { logger } = require('../utils/logger');

let io = null;

function initSocket(httpServer) {
  if (io) return io;

  io = new Server(httpServer, {
    cors: { origin: env.CORS_ORIGINS, credentials: true },
    transports: ['websocket', 'polling'],
  });

  io.on('connection', (socket) => {
    logger.info({ id: socket.id }, 'socket connected');
    socket.on('disconnect', () => logger.info({ id: socket.id }, 'socket disconnected'));
  });

  return io;
}

function getIO() {
  if (!io) throw new Error('Socket.io not initialised — call initSocket(server) first');
  return io;
}

module.exports = { initSocket, getIO };
const { logger } = require('../../utils/logger');

module.exports = function requestLogger(req, res, next) {
  const started = Date.now();

  res.on('finish', () => {
    logger.info({
      id: req.id,
      method: req.method,
      path: req.originalUrl,
      status: res.statusCode,
      ms: Date.now() - started,
      ip: req.ip,
    }, 'request');
  });

  next();
};
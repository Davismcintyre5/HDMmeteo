const { ApiError } = require('../../utils/apiError');
const { logger } = require('../../utils/logger');
const env = require('../../config/env');

// eslint-disable-next-line no-unused-vars
module.exports = function errorHandler(err, req, res, next) {
  const isOperational = err instanceof ApiError;
  const status = isOperational ? err.status : 500;
  const code = isOperational ? err.code : 'INTERNAL_ERROR';
  const message = isOperational ? err.message : 'Something went wrong';

  if (!isOperational) {
    logger.error({ err: err.message, stack: err.stack, path: req.originalUrl, id: req.id }, 'unhandled error');
  } else if (status >= 500) {
    logger.error({ err: err.message, path: req.originalUrl, id: req.id }, 'server error');
  }

  const body = {
    success: false,
    error: message,
    code,
    requestId: req.id,
  };

  if (err.details) body.details = err.details;
  if (!env.isProd && !isOperational) body.stack = err.stack;

  res.status(status).json(body);
};
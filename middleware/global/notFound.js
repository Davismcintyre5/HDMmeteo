const { ApiError } = require('../../utils/apiError');

module.exports = function notFound(req, res, next) {
  next(ApiError.notFound('NOT_FOUND', `Route ${req.method} ${req.originalUrl} not found`));
};
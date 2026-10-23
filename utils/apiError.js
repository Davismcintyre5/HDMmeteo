class ApiError extends Error {
  constructor(status, code, message, details = null) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.details = details;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }

  static badRequest(code, message, details) {
    return new ApiError(400, code, message, details);
  }
  static unauthorized(code = 'UNAUTHORIZED', message = 'Unauthorized') {
    return new ApiError(401, code, message);
  }
  static paymentRequired(code, message) {
    return new ApiError(402, code, message);
  }
  static forbidden(code, message) {
    return new ApiError(403, code, message);
  }
  static notFound(code, message) {
    return new ApiError(404, code, message);
  }
  static conflict(code, message) {
    return new ApiError(409, code, message);
  }
  static internal(code = 'INTERNAL_ERROR', message = 'Something went wrong') {
    return new ApiError(500, code, message);
  }
  static rateLimited(message = 'Too many requests') {
    return new ApiError(429, 'RATE_LIMITED', message);
  }
}

module.exports = { ApiError };
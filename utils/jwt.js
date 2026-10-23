const jsonwebtoken = require('jsonwebtoken');
const env = require('../config/env');
const { ApiError } = require('./apiError');

function sign(payload, opts = {}) {
  const { expiresIn = env.JWT_EXPIRES_IN, secret = env.JWT_SECRET } = opts;
  return jsonwebtoken.sign(payload, secret, { expiresIn });
}

function verify(token, opts = {}) {
  const { secret = env.JWT_SECRET } = opts;
  try {
    return jsonwebtoken.verify(token, secret);
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      throw ApiError.unauthorized('TOKEN_EXPIRED', 'Token expired');
    }
    throw ApiError.unauthorized('INVALID_TOKEN', 'Token invalid');
  }
}

function decode(token) {
  return jsonwebtoken.decode(token);
}

module.exports = { sign, verify, decode };
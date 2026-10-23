const jsonwebtoken = require('jsonwebtoken');
const env = require('../config/env');
const { ApiError } = require('./apiError');

function generateToken(id, role, kind = 'user') {
  return jsonwebtoken.sign(
    { sub: String(id), role, kind },
    env.JWT_SECRET,
    { expiresIn: env.JWT_EXPIRES_IN }
  );
}

function generateRefreshToken(id, role, kind = 'user') {
  return jsonwebtoken.sign(
    { sub: String(id), role, kind, refresh: true },
    env.JWT_SECRET,
    { expiresIn: env.REFRESH_TOKEN_EXPIRES_IN }
  );
}

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

module.exports = { generateToken, generateRefreshToken, sign, verify, decode };
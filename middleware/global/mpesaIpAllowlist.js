const env = require('../../config/env');
const { ApiError } = require('../../utils/apiError');
const { logger } = require('../../utils/logger');

const SAFARICOM_IPS = [
  '196.201.214.200',
  '196.201.214.206',
  '196.201.213.114',
  '196.201.214.207',
  '196.201.214.208',
  '196.201.213.44',
  '196.201.212.127',
  '196.201.212.138',
  '196.201.212.129',
  '196.201.212.136',
  '196.201.212.74',
  '196.201.212.69',
];

module.exports = function mpesaIpAllowlist(req, res, next) {
  if (env.MPESA_ENV !== 'production') return next();

  const forwarded = req.get('x-forwarded-for');
  const ip = (forwarded ? forwarded.split(',')[0] : req.ip || '').trim();

  if (!SAFARICOM_IPS.includes(ip)) {
    logger.warn({ ip, path: req.originalUrl }, 'mpesa callback rejected — IP not allowed');
    return next(ApiError.forbidden('IP_NOT_ALLOWED', 'Source IP not allowed'));
  }

  next();
};
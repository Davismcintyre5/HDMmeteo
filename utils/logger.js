const pino = require('pino');
const env = require('../config/env');

const logger = pino({
  level: env.LOG_LEVEL || 'info',
  redact: {
    paths: [
      'req.headers.authorization',
      'req.headers.cookie',
      'password',
      'passwordHash',
      'hash',
      'apiKey',
      'secret',
      'token',
      'refreshToken',
      '*.password',
      '*.passwordHash',
      '*.apiKey',
      '*.secret',
    ],
    censor: '[REDACTED]',
  },
  transport: env.isProd
    ? undefined
    : {
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'SYS:HH:MM:ss',
          ignore: 'pid,hostname',
          singleLine: false,
        },
      },
});

module.exports = { logger };
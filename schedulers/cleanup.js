const RefreshToken = require('../models/client/RefreshToken');
const Verification = require('../models/client/Verification');
const ApiKey = require('../models/client/ApiKey');
const { logger } = require('../utils/logger');

const cron = '0 3 * * 0';

const STALE_DAYS = 90;

async function run() {
  const cutoff = new Date(Date.now() - STALE_DAYS * 24 * 60 * 60 * 1000);

  const [refresh, verif, keys] = await Promise.all([
    RefreshToken.deleteMany({
      $or: [
        { expiresAt: { $lt: new Date() } },
        { revokedAt: { $ne: null, $lt: cutoff } },
      ],
    }),
    Verification.deleteMany({
      $or: [
        { expiresAt: { $lt: new Date() } },
        { usedAt: { $ne: null, $lt: cutoff } },
      ],
    }),
    ApiKey.deleteMany({
      status: 'revoked',
      revokedAt: { $lt: cutoff },
    }),
  ]);

  logger.info(
    {
      refreshTokens: refresh.deletedCount,
      verifications: verif.deletedCount,
      apiKeys: keys.deletedCount,
    },
    'cleanup done'
  );
}

module.exports = { cron, run, enabled: false };
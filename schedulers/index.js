const cron = require('node-cron');
const { logger } = require('../utils/logger');
const { rescheduleBackupCron, stopBackupCron } = require('../services/backupScheduler');

const jobs = [
  { name: 'invoiceReminders',   mod: require('./invoiceReminders') },
  { name: 'subscriptionExpiry', mod: require('./subscriptionExpiry') },
  { name: 'cleanup',            mod: require('./cleanup') },
];

const registry = new Map();

async function startSchedulers() {
  if (registry.size > 0) {
    logger.warn('Schedulers already running');
    return;
  }

  for (const { name, mod } of jobs) {
    if (!mod.cron || !mod.run) {
      logger.warn({ name }, 'scheduler missing cron/run export — skipped');
      continue;
    }
    if (mod.enabled === false) {
      logger.info({ name }, 'scheduler disabled');
      continue;
    }

    const task = cron.schedule(mod.cron, async () => {
      const started = Date.now();
      try {
        await mod.run();
        logger.info({ name, ms: Date.now() - started }, 'scheduler ok');
      } catch (err) {
        logger.error({ name, err: err.message, stack: err.stack }, 'scheduler failed');
      }
    });

    registry.set(name, task);
    logger.info({ name, cron: mod.cron }, 'scheduler registered');
  }

  try {
    await rescheduleBackupCron();
  } catch (err) {
    logger.error({ err: err.message }, 'backup cron failed to start');
  }
}

function stopSchedulers() {
  for (const [name, task] of registry) {
    task.stop();
    logger.info({ name }, 'scheduler stopped');
  }
  registry.clear();

  try {
    stopBackupCron();
    logger.info('backup cron stopped');
  } catch {}
}

module.exports = { startSchedulers, stopSchedulers };
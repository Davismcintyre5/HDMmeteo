const cron = require('node-cron');
const settingsService = require('./settingsService');
const backupService = require('./backupService');
const emailService = require('./emailService');
const Admin = require('../models/admin/Admin');
const { logger } = require('../utils/logger');

let task = null;

function toCronExpr(settings) {
  const [h, m] = (settings.time || '02:00').split(':').map(Number);
  switch (settings.frequency) {
    case 'hourly':  return `${m} * * * *`;
    case 'daily':   return `${m} ${h} * * *`;
    case 'weekly':  return `${m} ${h} * * 0`;
    case 'monthly': return `${m} ${h} 1 * *`;
    default:        return `${m} ${h} * * *`;
  }
}

function humanSize(bytes = 0) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

async function sendCompletionEmail(recipient, doc) {
  const admins = recipient
    ? [{ email: recipient }]
    : await Admin.find({ status: 'active', role: 'super_admin' }).select('email').lean();

  for (const a of admins) {
    try {
      await emailService.sendAdminBackupSuccess({
        to: a.email,
        filename: doc.filename,
        sizeHuman: humanSize(doc.sizeBytes),
        durationMs: doc.durationMs,
        collections: doc.collections,
        at: doc.completedAt,
        downloadUrl: doc.storageUrl,
      });
    } catch (err) {
      logger.warn({ err: err.message, to: a.email }, 'backup completion email failed');
    }
  }
}

async function rescheduleBackupCron() {
  if (task) {
    task.stop();
    task = null;
  }

  const settings = await settingsService.getBackupSettings();
  if (!settings.enabled) {
    logger.info('Backup cron disabled by settings');
    return;
  }

  const expr = toCronExpr(settings);
  task = cron.schedule(expr, async () => {
    const latest = await settingsService.getBackupSettings();
    try {
      const doc = await backupService.create({ triggeredBy: 'cron' });

      if (latest.emailOnCompletion) {
        await sendCompletionEmail(latest.emailRecipient, doc);
      }

      await backupService.enforceRetention({
        retentionDays: latest.retentionDays,
        maxBackups: latest.maxBackups,
      });
    } catch (err) {
      logger.error({ err: err.message }, 'auto backup failed');
    }
  });

  logger.info({ expr, frequency: settings.frequency, time: settings.time }, 'backup cron scheduled');
}

function stopBackupCron() {
  if (task) {
    task.stop();
    task = null;
  }
}

module.exports = { rescheduleBackupCron, stopBackupCron };
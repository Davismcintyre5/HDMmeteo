const backupService = require('../../services/backupService');
const settingsService = require('../../services/settingsService');
const emailService = require('../../services/emailService');
const socketService = require('../../services/socketService');
const Backup = require('../../models/admin/Backup');
const { successResponse, errorResponse } = require('../../utils/response');
const asyncHandler = require('../../utils/asyncHandler');
const { ApiError } = require('../../utils/apiError');
const { parsePagination, buildMeta } = require('../../utils/pagination');

function humanSize(bytes = 0) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

function computeNextRun(settings) {
  if (!settings?.enabled) return null;
  const [h, m] = (settings.time || '02:00').split(':').map(Number);
  const now = new Date();
  const next = new Date(now);
  next.setHours(h, m, 0, 0);

  switch (settings.frequency) {
    case 'hourly':
      next.setMinutes(m, 0, 0);
      if (next <= now) next.setHours(now.getHours() + 1);
      break;
    case 'daily':
      if (next <= now) next.setDate(next.getDate() + 1);
      break;
    case 'weekly': {
      const daysAhead = (7 - now.getDay()) % 7 || 7;
      next.setDate(next.getDate() + daysAhead);
      break;
    }
    case 'monthly': {
      next.setDate(1);
      if (next <= now) next.setMonth(next.getMonth() + 1);
      break;
    }
    default:
      return null;
  }
  return next.toISOString();
}

const list = asyncHandler(async (req, res) => {
  const { page, limit, skip } = parsePagination(req.query);
  const { items, total } = await backupService.list({ skip, limit });
  return successResponse(res, {
    items: items.map((b) => ({ ...b, id: String(b._id), sizeHuman: humanSize(b.sizeBytes), _id: undefined })),
    meta: buildMeta(total, page, limit),
  });
});

const trigger = asyncHandler(async (req, res) => {
  const doc = await backupService.create({ triggeredBy: 'admin', adminId: req.user.id });
  socketService.emitToAdmin('backup:done', { id: String(doc._id), filename: doc.filename });
  return successResponse(res, { backup: { id: String(doc._id), filename: doc.filename, status: doc.status } }, 'Backup created');
});

const download = asyncHandler(async (req, res) => {
  const doc = await backupService.getById(req.params.id);
  return successResponse(res, { url: doc.storageUrl, filename: doc.filename });
});

const remove = asyncHandler(async (req, res) => {
  const result = await backupService.remove(req.params.id);
  return successResponse(res, result, 'Backup deleted');
});

const sendToEmail = asyncHandler(async (req, res) => {
  const doc = await backupService.getById(req.params.id);
  const to = req.body.email || req.user.email;
  if (!to) return errorResponse(res, 'Email required', 400);

  await emailService.sendBackupDelivered({
    to,
    filename: doc.filename,
    sizeHuman: humanSize(doc.sizeBytes),
    downloadUrl: doc.storageUrl,
    expiresIn: '7 days',
  });

  return successResponse(res, { sent: true, to }, 'Backup emailed');
});

const getSettings = asyncHandler(async (req, res) => {
  const stored = await settingsService.getBackupSettings();

  const lastAuto = await Backup.findOne({ type: 'auto', status: 'success' })
    .sort({ completedAt: -1 })
    .select('completedAt')
    .lean();

  return successResponse(res, {
    backupSettings: {
      ...stored,
      lastAutoBackupAt: lastAuto?.completedAt || null,
      nextAutoBackupAt: computeNextRun(stored),
    },
  });
});

const updateSettings = asyncHandler(async (req, res) => {
  const b = req.body;
  const patch = {};

  if (b.enabled !== undefined) patch.enabled = Boolean(b.enabled);

  if (b.frequency !== undefined) {
    if (!['hourly', 'daily', 'weekly', 'monthly'].includes(b.frequency)) {
      throw ApiError.badRequest('INVALID_FREQUENCY', 'Frequency must be hourly/daily/weekly/monthly');
    }
    patch.frequency = b.frequency;
  }

  if (b.time !== undefined) {
    if (!/^\d{2}:\d{2}$/.test(b.time)) {
      throw ApiError.badRequest('INVALID_TIME', 'Time must be HH:MM');
    }
    const [h, m] = b.time.split(':').map(Number);
    if (h > 23 || m > 59) throw ApiError.badRequest('INVALID_TIME', 'Time out of range');
    patch.time = b.time;
  }

  if (b.retentionDays !== undefined) {
    const n = Number(b.retentionDays);
    if (!Number.isInteger(n) || n < 0) throw ApiError.badRequest('INVALID_RETENTION', 'Retention must be ≥ 0');
    patch.retentionDays = n;
  }

  if (b.maxBackups !== undefined) {
    const n = Number(b.maxBackups);
    if (!Number.isInteger(n) || n < 1) throw ApiError.badRequest('INVALID_MAX_BACKUPS', 'Max backups must be ≥ 1');
    patch.maxBackups = n;
  }

  if (b.emailOnCompletion !== undefined) patch.emailOnCompletion = Boolean(b.emailOnCompletion);

  if (b.emailRecipient !== undefined) {
    if (b.emailRecipient && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(b.emailRecipient)) {
      throw ApiError.badRequest('INVALID_EMAIL', 'Invalid recipient email');
    }
    patch.emailRecipient = b.emailRecipient || null;
  }

  const updated = await settingsService.setBackupSettings(patch);

  try {
    const { rescheduleBackupCron } = require('../../services/backupScheduler');
    await rescheduleBackupCron();
  } catch (err) {
    // don't fail the response if cron can't reschedule
  }

  const lastAuto = await Backup.findOne({ type: 'auto', status: 'success' })
    .sort({ completedAt: -1 })
    .select('completedAt')
    .lean();

  return successResponse(res, {
    backupSettings: {
      ...updated,
      lastAutoBackupAt: lastAuto?.completedAt || null,
      nextAutoBackupAt: computeNextRun(updated),
    },
  }, 'Backup settings saved');
});

module.exports = { list, trigger, download, remove, sendToEmail, getSettings, updateSettings };
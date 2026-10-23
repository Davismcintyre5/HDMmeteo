const mongoose = require('mongoose');
const { v2: cloudinary } = require('cloudinary');
const Backup = require('../models/admin/Backup');
const { cloudinaryConfig } = require('../config/cloudinary');
const { logger } = require('../utils/logger');
const { ApiError } = require('../utils/apiError');

const EXCLUDED_COLLECTIONS = ['logs', 'auditlogs', 'apirequests', 'sessions', 'notifications'];

function timestamp() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}-${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`;
}

async function dumpCollections() {
  const db = mongoose.connection.db;
  const all = await db.listCollections().toArray();

  const names = all
    .map((c) => c.name)
    .filter((n) => !n.startsWith('system.') && !EXCLUDED_COLLECTIONS.includes(n.toLowerCase()));

  const dump = {};
  for (const name of names) {
    dump[name] = await db.collection(name).find({}).toArray();
  }
  return dump;
}

async function uploadToCloudinary(buffer, filename) {
  if (!cloudinaryConfig.enabled()) {
    throw ApiError.internal('CLOUDINARY_DISABLED', 'Cloudinary not configured');
  }
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        resource_type: 'raw',
        folder: `${cloudinaryConfig.folder}/backups`,
        public_id: filename,
        overwrite: true,
      },
      (err, result) => (err ? reject(err) : resolve(result))
    );
    stream.end(buffer);
  });
}

async function create({ triggeredBy = 'cron', adminId = null } = {}) {
  const startedAt = new Date();
  const filename = `hdm-meteo-${timestamp()}.json`;
  const type = triggeredBy === 'cron' ? 'auto' : 'manual';

  const doc = await Backup.create({
    filename,
    type,
    status: 'running',
    triggeredBy,
    triggeredByAdminId: adminId,
    storageProvider: 'cloudinary',
    startedAt,
  });

  try {
    const dump = await dumpCollections();
    const buffer = Buffer.from(JSON.stringify(dump, null, 2), 'utf8');
    const collections = Object.keys(dump);

    const upload = await uploadToCloudinary(buffer, filename);
    const durationMs = Date.now() - startedAt.getTime();

    doc.status = 'success';
    doc.sizeBytes = buffer.length;
    doc.durationMs = durationMs;
    doc.collections = collections;
    doc.storagePublicId = upload.public_id;
    doc.storageUrl = upload.secure_url;
    doc.completedAt = new Date();
    await doc.save();

    logger.info({ filename, sizeBytes: buffer.length, collections: collections.length, type }, 'backup success');
    return doc;
  } catch (err) {
    doc.status = 'failed';
    doc.error = err.message;
    doc.completedAt = new Date();
    await doc.save();
    logger.error({ filename, err: err.message, type }, 'backup failed');
    throw err;
  }
}

async function list({ skip = 0, limit = 20 } = {}) {
  const [items, total] = await Promise.all([
    Backup.find().sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    Backup.countDocuments(),
  ]);
  return { items, total };
}

async function getById(id) {
  const doc = await Backup.findById(id).lean();
  if (!doc) throw ApiError.notFound('BACKUP_NOT_FOUND', 'Backup not found');
  return doc;
}

async function remove(id) {
  const doc = await Backup.findById(id);
  if (!doc) throw ApiError.notFound('BACKUP_NOT_FOUND', 'Backup not found');

  if (doc.storagePublicId && cloudinaryConfig.enabled()) {
    try {
      await cloudinary.uploader.destroy(doc.storagePublicId, { resource_type: 'raw' });
    } catch (err) {
      logger.warn({ err: err.message, id }, 'cloudinary delete failed');
    }
  }

  await doc.deleteOne();
  return { deleted: true, id };
}

function downloadUrl(doc) {
  return doc.storageUrl;
}

async function enforceRetention({ retentionDays = 30, maxBackups = 10 } = {}) {
  const deletions = [];

  if (retentionDays > 0) {
    const cutoff = new Date(Date.now() - retentionDays * 24 * 60 * 60 * 1000);
    const oldByDate = await Backup.find({
      status: 'success',
      completedAt: { $lt: cutoff },
    }).lean();
    deletions.push(...oldByDate);
  }

  if (maxBackups > 0) {
    const keepIds = (
      await Backup.find({ status: 'success' })
        .sort({ completedAt: -1 })
        .limit(maxBackups)
        .select('_id')
        .lean()
    ).map((b) => String(b._id));

    const excess = await Backup.find({
      status: 'success',
      _id: { $nin: keepIds },
    }).lean();
    deletions.push(...excess);
  }

  const seen = new Set();
  let purged = 0;

  for (const b of deletions) {
    if (seen.has(String(b._id))) continue;
    seen.add(String(b._id));

    try {
      if (b.storagePublicId && cloudinaryConfig.enabled()) {
        await cloudinary.uploader
          .destroy(b.storagePublicId, { resource_type: 'raw' })
          .catch(() => {});
      }
      await Backup.deleteOne({ _id: b._id });
      purged++;
    } catch (err) {
      logger.warn({ err: err.message, id: b._id }, 'retention purge failed');
    }
  }

  if (purged > 0) {
    logger.info({ purged, retentionDays, maxBackups }, 'backup retention enforced');
  }

  return { purged };
}

module.exports = {
  create,
  list,
  getById,
  remove,
  downloadUrl,
  enforceRetention,
  EXCLUDED_COLLECTIONS,
};
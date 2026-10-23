const mongoose = require('mongoose');
const { Schema } = mongoose;

const schema = new Schema({
  filename:           { type: String, required: true, index: true },
  type:               { type: String, enum: ['auto', 'manual'], default: 'manual', index: true },
  sizeBytes:          { type: Number, default: 0 },
  durationMs:         { type: Number, default: 0 },
  collections:        { type: [String], default: [] },
  status:             { type: String, enum: ['running', 'success', 'failed'], default: 'running', index: true },
  error:              { type: String, default: null },
  triggeredBy:        { type: String, enum: ['cron', 'admin'], default: 'cron' },
  triggeredByAdminId: { type: Schema.Types.ObjectId, ref: 'Admin', default: null },
  storageProvider:    { type: String, default: 'cloudinary' },
  storagePublicId:    { type: String, default: null, index: true },
  storageUrl:         { type: String, default: null },
  checksum:           { type: String, default: null },
  startedAt:          { type: Date, default: Date.now },
  completedAt:        { type: Date, default: null },
}, {
  timestamps: true,
  versionKey: false,
  toJSON: {
    virtuals: true,
    transform: (_, ret) => {
      ret.id = String(ret._id);
      delete ret._id;
      return ret;
    },
  },
});

schema.index({ createdAt: -1 });
schema.index({ type: 1, status: 1, completedAt: -1 });

module.exports = mongoose.model('Backup', schema);
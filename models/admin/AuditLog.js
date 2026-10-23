const mongoose = require('mongoose');
const { Schema } = mongoose;

const schema = new Schema({
  actorId:    { type: Schema.Types.ObjectId, ref: 'Admin', default: null, index: true },
  actorEmail: { type: String, default: null },
  action:     { type: String, required: true, index: true },
  targetType: { type: String, default: null, index: true },
  targetId:   { type: Schema.Types.ObjectId, default: null, index: true },
  meta:       { type: Schema.Types.Mixed, default: {} },
  ip:         { type: String, default: null },
  userAgent:  { type: String, default: null },
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

module.exports = mongoose.model('AuditLog', schema);
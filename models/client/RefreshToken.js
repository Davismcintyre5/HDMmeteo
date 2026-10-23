const mongoose = require('mongoose');
const { Schema } = mongoose;

const schema = new Schema({
  userId:     { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  tenantId:   { type: Schema.Types.ObjectId, ref: 'Tenant', required: true, index: true },
  hash:       { type: String, required: true, unique: true, index: true },
  expiresAt:  { type: Date, required: true },
  revokedAt:  { type: Date, default: null },
  replacedBy: { type: String, default: null },
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
      delete ret.hash;
      return ret;
    },
  },
});

schema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model('RefreshToken', schema);
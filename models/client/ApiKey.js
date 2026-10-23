const mongoose = require('mongoose');
const { Schema } = mongoose;

const schema = new Schema({
  tenantId:   { type: Schema.Types.ObjectId, ref: 'Tenant', required: true, index: true },
  userId:     { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  name:       { type: String, required: true, trim: true, maxlength: 60 },
  prefix:     { type: String, required: true },
  hash:       { type: String, required: true, unique: true, index: true },
  last4:      { type: String, required: true },
  scopes:     { type: [String], default: ['current', 'forecast'] },
  status:     { type: String, enum: ['active', 'revoked'], default: 'active', index: true },
  lastUsedAt: { type: Date, default: null },
  expiresAt:  { type: Date, default: null },
  revokedAt:  { type: Date, default: null },
  revokedBy:  { type: Schema.Types.ObjectId, ref: 'User', default: null },
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

schema.index({ tenantId: 1, status: 1 });
schema.index({ tenantId: 1, userId: 1, status: 1 });

module.exports = mongoose.model('ApiKey', schema);
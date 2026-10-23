const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { Schema } = mongoose;

const schema = new Schema({
  tenantId:        { type: Schema.Types.ObjectId, ref: 'Tenant', required: true, index: true },
  fullName:        { type: String, required: true, trim: true },
  email:           { type: String, required: true, lowercase: true, trim: true, index: true },
  phone:           { type: String, default: null },
  password:        { type: String, required: true, select: false },
  role:            { type: String, enum: ['owner', 'staff'], default: 'owner' },
  status:          { type: String, enum: ['pending', 'active', 'suspended'], default: 'active', index: true },
  apiKeyLimit:     { type: Number, default: null },
  emailVerifiedAt: { type: Date, default: null },
  lastLoginAt:     { type: Date, default: null },
}, {
  timestamps: true,
  versionKey: false,
  toJSON: {
    virtuals: true,
    transform: (_, ret) => {
      ret.id = String(ret._id);
      delete ret._id;
      delete ret.password;
      return ret;
    },
  },
});

schema.index({ tenantId: 1, email: 1 }, { unique: true });

schema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

schema.methods.comparePassword = function (candidate) {
  return bcrypt.compare(candidate, this.password);
};

module.exports = mongoose.model('User', schema);
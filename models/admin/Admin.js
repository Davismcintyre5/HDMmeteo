const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const { Schema } = mongoose;

const schema = new Schema({
  email:       { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
  password:    { type: String, required: true, select: false },
  fullName:    { type: String, required: true, trim: true },
  phone:       { type: String, default: null },
  role:        { type: String, enum: ['admin', 'super_admin'], default: 'admin', index: true },
  status:      { type: String, enum: ['active', 'suspended'], default: 'active', index: true },
  lastLoginAt: { type: Date, default: null },
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

schema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

schema.methods.comparePassword = function (candidate) {
  return bcrypt.compare(candidate, this.password);
};

module.exports = mongoose.model('Admin', schema);
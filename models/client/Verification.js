const mongoose = require('mongoose');
const { Schema } = mongoose;

const schema = new Schema({
  userId:    { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  type:      { type: String, enum: ['email_verify', 'password_reset'], required: true, index: true },
  hash:      { type: String, required: true, unique: true, index: true },
  expiresAt: { type: Date, required: true },
  usedAt:    { type: Date, default: null },
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

module.exports = mongoose.model('Verification', schema);
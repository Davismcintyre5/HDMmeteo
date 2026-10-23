const mongoose = require('mongoose');
const { Schema } = mongoose;

const schema = new Schema({
  code:    { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
  label:   { type: String, required: true, trim: true },
  mode:    { type: String, enum: ['auto', 'manual'], default: 'manual' },
  config:  { type: Schema.Types.Mixed, default: {} },
  enabled: { type: Boolean, default: false, index: true },
  order:   { type: Number, default: 0 },
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

module.exports = mongoose.model('PaymentMethod', schema);
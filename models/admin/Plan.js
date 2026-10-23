const mongoose = require('mongoose');
const { Schema } = mongoose;

const schema = new Schema({
  code:        { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
  name:        { type: String, required: true, trim: true },
  description: { type: String, default: '' },
  price: {
    amount:   { type: Number, default: 0, min: 0 },
    currency: { type: String, default: 'KES' },
    interval: { type: String, enum: ['month', 'year', 'once'], default: 'month' },
  },
  features: {
    currentWeather: { type: Boolean, default: true },
    forecast:       { type: Boolean, default: true },
    aiSummary:      { type: Boolean, default: false },
    historical:     { type: Boolean, default: false },
    alerts:         { type: Boolean, default: false },
    bulkLookup:     { type: Boolean, default: false },
  },
  isPublic:  { type: Boolean, default: true, index: true },
  isActive:  { type: Boolean, default: true, index: true },
  sortOrder: { type: Number, default: 0 },
  trialDays: { type: Number, default: 0 },
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

module.exports = mongoose.model('Plan', schema);
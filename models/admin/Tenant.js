const mongoose = require('mongoose');
const { Schema } = mongoose;

const schema = new Schema({
  name:              { type: String, required: true, trim: true },
  slug:              { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
  status:            { type: String, enum: ['pending', 'active', 'suspended', 'rejected'], default: 'pending', index: true },
  planCode:          { type: String, required: true, index: true },
  billingInterval:   { type: String, enum: ['month', 'year', 'once'], default: 'month' },
  subscriptionStatus:{ type: String, enum: ['active', 'expired', 'cancelled', 'pending'], default: 'pending', index: true },
  currentPeriodStart:{ type: Date, default: null },
  currentPeriodEnd:  { type: Date, default: null, index: true },
  lastInvoiceId:     { type: Schema.Types.ObjectId, ref: 'Invoice', default: null },
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

module.exports = mongoose.model('Tenant', schema);
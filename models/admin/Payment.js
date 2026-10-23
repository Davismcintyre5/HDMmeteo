const mongoose = require('mongoose');
const { Schema } = mongoose;

const schema = new Schema({
  tenantId:          { type: Schema.Types.ObjectId, ref: 'Tenant', required: true, index: true },
  invoiceId:         { type: Schema.Types.ObjectId, ref: 'Invoice', default: null, index: true },
  type:              { type: String, enum: ['payment', 'refund'], default: 'payment', index: true },
  direction:         { type: String, enum: ['in', 'out'], default: 'in' },
  method:            { type: String, required: true, index: true },
  amount:            { type: Number, required: true, min: 0 },
  currency:          { type: String, default: 'KES' },
  status:            { type: String, enum: ['pending', 'success', 'failed', 'cancelled'], default: 'pending', index: true },
  reference:         { type: String, default: null, index: true },
  mpesaReceipt:      { type: String, default: null, index: true },
  checkoutRequestId: { type: String, default: null, index: true },
  merchantRequestId: { type: String, default: null },
  phone:             { type: String, default: null },
  raw:               { type: Schema.Types.Mixed, default: null },
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

module.exports = mongoose.model('Payment', schema);
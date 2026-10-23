const mongoose = require('mongoose');
const { Schema } = mongoose;

const itemSchema = new Schema({
  productId:   { type: Schema.Types.ObjectId, default: null },
  name:        { type: String, required: true },
  description: { type: String, default: '' },
  qty:         { type: Number, default: 1 },
  unitPrice:   { type: Number, default: 0 },
  subtotal:    { type: Number, default: 0 },
}, { _id: false });

const schema = new Schema({
  tenantId:       { type: Schema.Types.ObjectId, ref: 'Tenant', required: true, index: true },
  invoiceNumber:  { type: String, required: true, unique: true, index: true },
  customerSnapshot: {
    name:    { type: String, default: null },
    email:   { type: String, default: null },
    phone:   { type: String, default: null },
    address: { type: String, default: null },
  },
  items:          { type: [itemSchema], default: [] },
  subtotal:       { type: Number, default: 0 },
  discount:       { type: Number, default: 0 },
  tax:            { type: Number, default: 0 },
  total:          { type: Number, default: 0 },
  amountPaid:     { type: Number, default: 0 },
  amountDue:      { type: Number, default: 0 },
  currency:       { type: String, default: 'KES' },
  status:         { type: String, enum: ['draft', 'sent', 'paid', 'overdue', 'cancelled', 'refunded'], default: 'sent', index: true },
  dueDate:        { type: Date, default: null, index: true },
  issuedAt:       { type: Date, default: Date.now },
  sentAt:         { type: Date, default: null },
  paidAt:         { type: Date, default: null },
  paymentMethod:  { type: String, default: null },
  paymentRef:     { type: String, default: null },
  paymentInstructions: { type: Schema.Types.Mixed, default: [] },
  stk: {
    checkoutRequestId: { type: String, default: null, index: true },
    merchantRequestId: { type: String, default: null },
    phone:             { type: String, default: null },
    initiatedAt:       { type: Date, default: null },
  },
  notes:          { type: String, default: '' },
  createdBy:      { type: Schema.Types.ObjectId, default: null },
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

module.exports = mongoose.model('Invoice', schema);
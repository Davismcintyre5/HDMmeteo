const mongoose = require('mongoose');
const { Schema } = mongoose;

const schema = new Schema({
  scope:             { type: String, enum: ['system', 'tenant', 'admin'], default: 'system', index: true },
  tenantId:          { type: Schema.Types.ObjectId, ref: 'Tenant', default: null, index: true },
  recipientId:       { type: Schema.Types.ObjectId, default: null, index: true },
  channel:           { type: String, enum: ['email', 'sms'], required: true, index: true },
  template:          { type: String, required: true, index: true },
  to:                { type: String, required: true },
  subject:           { type: String, default: null },
  body:              { type: String, default: '' },
  status:            { type: String, enum: ['sent', 'failed'], default: 'sent', index: true },
  providerMessageId: { type: String, default: null },
  error:             { type: String, default: null },
  errorCode:         { type: String, default: null },
  sentAt:            { type: Date, default: null },
}, { timestamps: true, versionKey: false });

schema.index({ createdAt: -1 });

module.exports = mongoose.model('Notification', schema);
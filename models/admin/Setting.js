const mongoose = require('mongoose');
const { Schema } = mongoose;

const schema = new Schema({
  key:   { type: String, required: true, unique: true, trim: true, index: true },
  value: { type: Schema.Types.Mixed, required: true },
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

module.exports = mongoose.model('Setting', schema);
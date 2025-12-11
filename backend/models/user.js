const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const AlertSchema = new Schema({
  symbol: String,
  type: String,
  value: Number,
  active: { type: Boolean, default: true }
}, { _id: false });

const UserSchema = new Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  watchlist: { type: [String], default: [] },
  alerts: { type: [AlertSchema], default: [] },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('User', UserSchema);

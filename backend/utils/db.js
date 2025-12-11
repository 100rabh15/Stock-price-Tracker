const mongoose = require('mongoose');
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/stock-tracker';
async function connect(){
  try {
    await mongoose.connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });
    console.log('Connected to MongoDB');
  } catch (e) {
    console.error('MongoDB connect error', e.message);
    process.exit(1);
  }
}
module.exports = { connect, mongoose };

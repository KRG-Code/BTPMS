const mongoose = require('mongoose');

const changeStreamSchema = new mongoose.Schema({
  operationType: String,
  documentKey: Object,
  fullDocument: Object,
  updateDescription: Object,
  ns: Object,
  timestamp: Date
});

module.exports = mongoose.model('ChangeStream', changeStreamSchema);

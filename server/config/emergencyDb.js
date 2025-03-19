const mongoose = require('mongoose');

const emergencyDbConnection = mongoose.createConnection(process.env.EMERGENCY_MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

emergencyDbConnection.on('connected', () => {
  console.log('Connected to Emergency Response database');
});

emergencyDbConnection.on('error', (err) => {
  console.error('Emergency Response database connection error:', err);
});

module.exports = emergencyDbConnection;

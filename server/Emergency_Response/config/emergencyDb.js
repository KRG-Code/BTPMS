const mongoose = require('mongoose');

if (!process.env.EMERGENCY_MONGO_URI) {
  console.error('EMERGENCY_MONGO_URI is not defined in environment variables');
  process.exit(1);
}

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

emergencyDbConnection.on('disconnected', () => {
  console.log('Emergency Response database disconnected');
});

process.on('SIGINT', async () => {
  await emergencyDbConnection.close();
  console.log('Emergency Response database connection closed through app termination');
  process.exit(0);
});

module.exports = emergencyDbConnection;

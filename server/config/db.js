// db.js
const mongoose = require('mongoose');

const connectDB = async () => {
  const maxRetries = 5;
  let retries = 0;

  while (retries < maxRetries) {
    try {
      // Remove useNewUrlParser and useUnifiedTopology options
      await mongoose.connect(process.env.MONGO_URI);
      console.log('MongoDB connected');
      break; // Exit the loop if the connection is successful
    } catch (error) {
      console.error(`MongoDB connection failed: ${error.message}`);
      retries += 1;
      console.log(`Retrying (${retries}/${maxRetries})...`);
      if (retries === maxRetries) {
        process.exit(1); // Exit if max retries are reached
      }
      await new Promise((resolve) => setTimeout(resolve, 5000)); // Wait 5 seconds before retrying
    }
  }
};

module.exports = connectDB;

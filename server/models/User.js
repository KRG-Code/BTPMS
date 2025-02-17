// user.js
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Define the user schema
const userSchema = new mongoose.Schema({
  firstName: { type: String, required: true },
  middleName: { type: String },
  lastName: { type: String, required: true },
  address: { type: String },
  contactNumber: { type: String },
  birthday: { type: Date, required: false },
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  gender: { type: String, enum: ['Male', 'Female', 'Others', 'None'], default: 'None' },
  profilePicture: { type: String },
  userType: { type: String, enum: ['resident', 'tanod', 'admin'], required: true },
});

// Hash password before saving the user
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next(); // Only hash if the password is modified
  this.password = await bcrypt.hash(this.password, await bcrypt.genSalt(10)); // Hash the password
  next();
});

// Export the User model
module.exports = mongoose.model('User', userSchema);

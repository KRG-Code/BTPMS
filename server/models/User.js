// user.js
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Define the user schema
const userSchema = new mongoose.Schema({
  firstName: { type: String, required: true },
  middleName: { type: String },
  lastName: { 
    type: String, 
    required: function() {
      return this.userType !== 'admin'; // Only required if user is not admin
    }
  },
  address: { type: String },
  contactNumber: { type: String },
  birthday: { type: Date, required: false },
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  gender: { type: String, enum: ['Male', 'Female', 'Others', 'None'], default: 'None' },
  profilePicture: { type: String },
  userType: { type: String, enum: ['resident', 'tanod', 'admin'], required: true },
  isTeamLeader: { type: Boolean, default: false }, // New field for tracking team leader status
  isOnline: {
    type: Boolean,
    default: false
  },
  lastActive: {
    type: Date,
    default: Date.now
  }
});

// Add compound index for online status queries
userSchema.index({ userType: 1, isOnline: 1, lastActive: 1 });

// Update the pre-save middleware
userSchema.pre('save', async function(next) {
  try {
    // Only hash the password if it has been modified
    if (!this.isModified('password')) {
      return next();
    }

    // Generate salt and hash password
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Update the comparePassword method
userSchema.methods.comparePassword = async function(candidatePassword) {
  try {
    if (!candidatePassword || !this.password) {
      return false;
    }
    return await bcrypt.compare(candidatePassword, this.password);
  } catch (error) {
    return false;
  }
};

// Add method to handle password updates
userSchema.methods.updatePassword = async function(newPassword) {
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(newPassword, salt);
  return this.save();
};

// Export the User model
module.exports = mongoose.model('User', userSchema);

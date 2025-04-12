const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const residentSchema = new mongoose.Schema({
  residentId: {
    type: String,
    required: true,
    unique: true
  },
  firstName: { 
    type: String, 
    required: true 
  },
  middleName: { 
    type: String 
  },
  lastName: { 
    type: String, 
    required: true 
  },
  birthday: { 
    type: Date, 
    required: true 
  },
  age: { 
    type: Number 
  },
  gender: { 
    type: String,
    enum: ['Male', 'Female', 'Others', 'Prefer not to say'],
    required: true
  },
  maritalStatus: { 
    type: String,
    enum: ['Single', 'Married', 'Divorced', 'Widowed', 'Separated'],
    required: true
  },
  citizenship: { 
    type: String, 
    required: true 
  },
  religion: { 
    type: String 
  },
  contactNumber: { 
    type: String, 
    required: true 
  },
  email: { 
    type: String, 
    required: true, 
    unique: true 
  },
  address: { 
    type: String, 
    required: true 
  },
  password: { 
    type: String, 
    required: true 
  },
  pin: {
    type: String,
    required: true
  },
  profilePicture: { 
    type: String 
  },
  isActive: { 
    type: Boolean, 
    default: true 
  },
  isVerified: { 
    type: Boolean, 
    default: false 
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  lastLogin: {
    type: Date
  }
}, { timestamps: true });

// Pre-save middleware to hash password if modified
residentSchema.pre('save', async function(next) {
  if (!this.isModified('password')) {
    return next();
  }

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Method to compare password
residentSchema.methods.comparePassword = async function(candidatePassword) {
  try {
    return await bcrypt.compare(candidatePassword, this.password);
  } catch (error) {
    return false;
  }
};

module.exports = mongoose.model('Resident', residentSchema);

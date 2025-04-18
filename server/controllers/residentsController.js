const Resident = require('../models/residents');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const axios = require('axios');
const emailService = require('../utils/emailService');

/**
 * Generate a resident ID based on personal information
 * New Format: BSA + 6-digit number (e.g., BSA123456)
 */
const generateResidentId = async () => {
  try {
    // Generate a random 6-digit number
    const randomDigits = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Combine to create the resident ID
    const baseId = `BSA${randomDigits}`;
    
    // Check if ID already exists, if so, regenerate
    const existingResident = await Resident.findOne({ residentId: baseId });
    if (existingResident) {
      // If exists, recursively generate a new one
      return generateResidentId();
    }
    
    return baseId;
  } catch (error) {
    console.error('Error generating resident ID:', error);
    // Fallback ID generation if something goes wrong
    return `BSA${Date.now().toString().substring(7)}`;
  }
};

/**
 * Generate a PIN based on user's information
 * Using only @ as the special character
 */
const generatePin = (firstName, middleName, lastName, birthday) => {
  const firstInitial = firstName.charAt(0).toUpperCase();
  const middleInitial = middleName ? middleName.charAt(0).toUpperCase() : "";
  const lastInitial = lastName.charAt(0).toUpperCase();
  
  // Extract birth date components
  const birthDate = new Date(birthday);
  const day = String(birthDate.getDate()).padStart(2, '0');
  const month = String(birthDate.getMonth() + 1).padStart(2, '0');
  const year = String(birthDate.getFullYear()).slice(-2);
  
  // Use only @ as the special character
  const specialChar = '@';
  
  // Combine to form PIN
  return `${firstInitial}${middleInitial}${lastInitial}${specialChar}${day}${month}${year}`;
};

// Register a new resident
exports.register = async (req, res) => {
  console.log("Registration request received:", req.body);
  
  const {
    firstName,
    middleName,
    lastName,
    birthday,
    gender,
    maritalStatus,
    citizenship,
    religion,
    contactNumber,
    email,
    address,
    password, // This should be the PIN generated from frontend
    age,
    profilePicture // URL from Firebase
  } = req.body;

  // Basic validation with detailed errors
  const missingFields = [];
  if (!firstName) missingFields.push('firstName');
  if (!lastName) missingFields.push('lastName');
  if (!birthday) missingFields.push('birthday');
  if (!gender) missingFields.push('gender');
  if (!maritalStatus) missingFields.push('maritalStatus');
  if (!citizenship) missingFields.push('citizenship');
  if (!contactNumber) missingFields.push('contactNumber');
  if (!email) missingFields.push('email');
  if (!address) missingFields.push('address');
  if (!password) missingFields.push('password');

  if (missingFields.length > 0) {
    console.log("Missing required fields:", missingFields);
    return res.status(400).json({ 
      message: 'Please provide all required fields', 
      missingFields 
    });
  }

  try {
    // Check if resident already exists by email
    console.log("Checking if email already exists:", email);
    const existingResident = await Resident.findOne({ email });
    if (existingResident) {
      console.log("Email already exists:", email);
      return res.status(400).json({ message: 'User with this email already exists' });
    }

    // Generate unique resident ID
    console.log("Generating resident ID...");
    const residentId = await generateResidentId();
    console.log("Generated ID:", residentId);
    
    // Generate PIN if not provided (although it should be provided from frontend)
    const pin = password || generatePin(firstName, middleName || '', lastName, birthday);
    console.log("Using PIN:", pin);

    // Create new resident
    const newResident = new Resident({
      residentId,
      firstName,
      middleName: middleName || '',
      lastName,
      birthday,
      age: age || calculateAge(birthday),
      gender,
      maritalStatus,
      citizenship,
      religion: religion || '',
      contactNumber,
      email,
      address,
      password: pin, // This will be hashed by the pre-save middleware
      pin, // Store unhashed version for display purposes
      profilePicture: profilePicture || null,
      isActive: true,
      isVerified: true // Auto-verify for now, could be changed later
    });

    console.log("Saving new resident...");
    await newResident.save();
    console.log("Resident saved successfully!");

    res.status(201).json({
      message: 'Registration successful',
      resident: {
        id: newResident._id,
        residentId: newResident.residentId,
        firstName: newResident.firstName,
        lastName: newResident.lastName,
        email: newResident.email,
        pin: pin // Return the unhashed PIN for display
      }
    });
  } catch (error) {
    console.error('Registration error details:', error);
    
    // Handle duplicate key error
    if (error.code === 11000) {
      const keyPattern = error.keyPattern ? Object.keys(error.keyPattern)[0] : 'unknown field';
      console.log(`Duplicate key error for ${keyPattern}:`, error);
      return res.status(400).json({ 
        message: `${keyPattern} is already registered.`,
        field: keyPattern
      });
    }
    
    res.status(500).json({ 
      message: 'Server error during registration',
      error: error.message
    });
  }
};

// Login for residents
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Find resident by email
    const resident = await Resident.findOne({ email });
    if (!resident) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    
    // Check if password matches
    const isMatch = await resident.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    
    // Update last login time
    resident.lastLogin = new Date();
    await resident.save();
    
    // Generate JWT token
    const token = jwt.sign(
      { id: resident._id, type: 'resident' },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );
    
    res.json({
      message: 'Login successful',
      token,
      resident: {
        id: resident._id,
        residentId: resident.residentId,
        firstName: resident.firstName,
        lastName: resident.lastName,
        email: resident.email,
        profilePicture: resident.profilePicture
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error during login' });
  }
};

// Modify verifyResidentById to also generate a token
exports.verifyResidentById = async (req, res) => {
  try {
    const { residentId } = req.params;
    
    if (!residentId) {
      return res.status(400).json({ message: 'Resident ID is required' });
    }
    
    const resident = await Resident.findOne({ residentId });
    
    if (!resident) {
      return res.status(404).json({ message: 'Resident not found. Please check the ID and try again.' });
    }
    
    // Generate a JWT token for the resident
    const token = jwt.sign(
      { id: resident._id, type: 'resident' },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );
    
    // Return resident information without sensitive data
    res.status(200).json({
      success: true,
      token, // Include token in response
      resident: {
        residentId: resident.residentId,
        firstName: resident.firstName,
        middleName: resident.middleName,
        lastName: resident.lastName,
        age: resident.age,
        gender: resident.gender,
        contactNumber: resident.contactNumber,
        email: resident.email,
        address: resident.address,
        profilePicture: resident.profilePicture
      }
    });
  } catch (error) {
    console.error('Error verifying resident:', error);
    res.status(500).json({ message: 'Server error during verification', error: error.message });
  }
};

// Also modify verifyResidentPassword to consistently return a token
exports.verifyResidentPassword = async (req, res) => {
  try {
    const { residentId, password } = req.body;
    
    if (!residentId || !password) {
      return res.status(400).json({ success: false, message: 'Resident ID and password are required' });
    }
    
    // Find the resident by ID
    const resident = await Resident.findOne({ residentId });
    
    if (!resident) {
      return res.status(404).json({ success: false, message: 'Resident not found' });
    }
    
    // Compare the provided password with the stored password
    const isMatch = await resident.comparePassword(password);
    
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid password' });
    }
    
    // Generate a JWT token
    const token = jwt.sign(
      { id: resident._id, type: 'resident' },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );
    
    // If password matches, return success with token
    return res.status(200).json({ 
      success: true, 
      message: 'Password verified successfully',
      token, // Include token in response
      resident: {
        residentId: resident.residentId,
        firstName: resident.firstName,
        lastName: resident.lastName
      }
    });
  } catch (error) {
    console.error('Error verifying resident password:', error);
    return res.status(500).json({ success: false, message: 'Server error during verification', error: error.message });
  }
};

// Request PIN reset
exports.requestPinReset = async (req, res) => {
  try {
    const { email, residentId } = req.body;
    
    // Validate input
    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: 'Please enter a valid email address' });
    }
    
    let resident = null;
    
    // If residentId is provided, verify email matches that resident's account
    if (residentId) {
      resident = await Resident.findOne({ residentId });
      
      // Check if resident exists
      if (!resident) {
        return res.status(404).json({ message: 'Resident not found. Please check your Resident ID.' });
      }
      
      // Check if email matches resident's email
      if (resident.email.toLowerCase() !== email.toLowerCase()) {
        console.log(`Email mismatch: Provided ${email}, stored ${resident.email}`);
        return res.status(400).json({ 
          message: 'The email you entered does not match the email associated with this account.' 
        });
      }
    } else {
      // Only email was provided, find by email
      resident = await Resident.findOne({ email: { $regex: new RegExp(`^${email.toLowerCase()}$`, 'i') } });
      
      if (!resident) {
        return res.status(404).json({ 
          message: 'No account found with this email address.' 
        });
      }
    }
    
    // Generate a token for PIN reset (expires in 1 hour)
    const token = jwt.sign(
      { id: resident._id, type: 'pin-reset' },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );
    
    // Create reset URL (frontend will handle this route)
    const resetUrl = `${process.env.FRONTEND_URL}/reset-pin/${token}`;
    
    // Send email with the reset link
    try {
      const emailSent = await emailService.sendPinResetEmail(
        resident.email,
        resetUrl,
        resident.firstName
      );
      
      if (!emailSent && process.env.NODE_ENV !== 'Development') {
        return res.status(500).json({ message: "Failed to send PIN reset email. Please try again later." });
      }
      
      // Log successful reset request
      console.log(`PIN reset requested for resident: ${resident.residentId}, email: ${resident.email}`);
      
      return res.status(200).json({ 
        message: 'PIN reset instructions sent to your email' 
      });
    } catch (emailError) {
      console.error('Error sending PIN reset email:', emailError);
      return res.status(500).json({ message: 'Failed to send PIN reset email' });
    }
  } catch (error) {
    console.error('Error in requestPinReset:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};

// Reset PIN with token
exports.resetPin = async (req, res) => {
  try {
    const { token, newPin } = req.body;
    
    if (!token || !newPin) {
      return res.status(400).json({ message: 'Token and new PIN are required' });
    }
    
    // Basic PIN strength validation
    if (newPin.length < 8) {
      return res.status(400).json({ message: 'PIN must be at least 8 characters long' });
    }
    
    // Check PIN strength (require at least uppercase, lowercase, number, and special char)
    const hasUppercase = /[A-Z]/.test(newPin);
    const hasLowercase = /[a-z]/.test(newPin);
    const hasNumber = /[0-9]/.test(newPin);
    const hasSpecialChar = /[^A-Za-z0-9]/.test(newPin);
    
    const strength = [hasUppercase, hasLowercase, hasNumber, hasSpecialChar].filter(Boolean).length;
    
    // PIN must have at least 3 of the 4 criteria
    if (strength < 3) {
      return res.status(400).json({ 
        message: 'PIN is too weak. Please include a mix of uppercase letters, lowercase letters, numbers, and special characters.' 
      });
    }
    
    // Verify token
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      // Check if it's a valid PIN reset token
      if (decoded.type !== 'pin-reset') {
        return res.status(400).json({ message: 'Invalid token' });
      }
      
      // Find resident with the token
      const resident = await Resident.findById(decoded.id);
      
      if (!resident) {
        return res.status(404).json({ message: 'Resident not found' });
      }
      
      // UPDATE FIX: Using the same approach as in MyAcc.jsx for changing password
      // Instead of using updateOne, we'll update the resident object and save it
      // This ensures the pre-save middleware properly hashes the password
      
      // Update the password field with the new PIN
      resident.password = newPin;  // Will be hashed via pre-save middleware
      resident.pin = newPin;       // Store plain PIN for reference
      
      // Save the updated resident (triggers the pre-save middleware)
      await resident.save();
      
      return res.status(200).json({ message: 'PIN reset successful' });
    } catch (tokenError) {
      // Token verification failed
      return res.status(400).json({ message: 'Token is invalid or has expired' });
    }
  } catch (error) {
    console.error('Error in resetPin:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};

// Helper function to calculate age
const calculateAge = (birthday) => {
  const birthDate = new Date(birthday);
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  
  return age;
};

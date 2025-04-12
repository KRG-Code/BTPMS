const Resident = require('../models/residents');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const axios = require('axios');

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

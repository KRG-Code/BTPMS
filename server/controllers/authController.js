// authController.js
const User = require("../models/User");
const Equipment = require("../models/Equipment");
const TanodRating = require("../models/Rating");
const Schedule = require("../models/Schedule");
const Notification = require('../models/Notification');
const Inventory = require("../models/Inventory");
const IncidentReport = require('../models/IncidentReport'); // Add this import
const AssistanceRequest = require('../models/AssistanceRequest'); // Add this import
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const { validationResult } = require("express-validator");
const { bucket } = require("../config/firebaseAdmin");
const axios = require('axios');
const fetch = require('node-fetch');
const mongoose = require('mongoose');

const { sendVerificationCode, sendPasswordResetEmail } = require('../utils/emailService');
const VerificationCode = require('../models/VerificationCode');
const PasswordResetToken = require('../models/PasswordResetToken');

const userVerificationAttempts = new Map(); // Track verification attempts by user

// Generate JWT token
const generateToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "30d" });

// reCAPTCHA verification function (outside of registerUser)
const verifyRecaptcha = async (token) => {
  const secretKey = process.env.RECAPTCHA_SECRET_KEY; // Ensure this is set in your backend environment
  const response = await fetch(`https://www.google.com/recaptcha/api/siteverify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `secret=${secretKey}&response=${token}`,
  });
  const data = await response.json();

  console.log("reCAPTCHA Verification Response:", data); // For debugging

  // Only check for success
  return data.success;
};

// Generate public token for residents
exports.generatePublicToken = (req, res) => {
  const token = jwt.sign({ userType: 'resident' }, process.env.JWT_SECRET, { expiresIn: '30d' });
  res.json({ token });
};

// Register a new user
exports.registerUser = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty())
    return res.status(400).json({ errors: errors.array() });

  const { firstName, lastName, username, email, password, userType, recaptchaToken, ...rest } = req.body;

  // Verify reCAPTCHA
  const recaptchaValid = await verifyRecaptcha(recaptchaToken);
  if (!recaptchaValid) {
    console.log("reCAPTCHA validation failed."); // Log failure reason
    return res.status(400).json({ message: "reCAPTCHA validation failed" });
  }

  try {
    // Check if user with email already exists
    if (await User.findOne({ email })) {
      return res.status(400).json({ message: "User already exists" });
    }

    // Create a new user
    const user = await User.create({
      firstName,
      lastName,
      username,
      email,
      password,
      userType,
      ...rest,
    });

    // Send response with the user info and token
    res.status(201).json({
      _id: user._id,
      firstName: user.firstName,
      lastName: user.lastName,
      username: user.username,
      email: user.email,
      token: generateToken(user._id),
    });
  } catch (error) {
    console.error("Registration Error:", error.message);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Register a new Tanod
exports.registerTanod = async (req, res) => {
  try {
    const { firstName, middleName, lastName, email, username, password } = req.body;

    // Validate required fields
    if (!firstName || !lastName || !username || !password) {
      return res.status(400).json({ message: "All required fields must be provided" });
    }

    // Check for existing user
    const existingUser = await User.findOne({
      $or: [{ username }, { email }]
    });

    if (existingUser) {
      return res.status(400).json({
        message: existingUser.username === username
          ? "Username already exists"
          : "Email already exists"
      });
    }

    // Create new user
    const user = await User.create({
      firstName,
      middleName,
      lastName,
      email,
      username,
      password, // Let the pre-save middleware handle hashing
      userType: "tanod"
    });

    const userResponse = user.toObject();
    delete userResponse.password;

    res.status(201).json(userResponse);
  } catch (error) {
    console.error("Registration Error:", error);
    res.status(500).json({ message: error.message || "Server error" });
  }
};

//delete a user
exports.deleteUser = async (req, res) => {
  const userId = req.params.userId;

  try {
    const deletedUser = await User.findByIdAndDelete(userId);

    if (!deletedUser) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({ message: "User deleted successfully" });
  } catch (error) {
    console.error("Error deleting user:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Get all user profiles
exports.getAllUserProfiles = async (req, res) => {
  try {
    const users = await User.find().select("-password"); // Exclude passwords
    if (!users.length)
      return res.status(404).json({ message: "No users found" });

    // Return the user data
    res.json(users);
  } catch (error) {
    console.error("Error fetching all user profiles:", error.message);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Get current user profile or by userId
exports.getUserProfile = async (req, res) => {
  try {
    const userId = req.params.userId || req.user._id; // Use userId from params or authenticated user id
    const user = await User.findById(userId).select('-password'); // Exclude password field
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.updateUserProfile = async (req, res) => {
  try {
    const userId = req.params.userId || req.user._id;
    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Check authorization
    if (req.user.userType !== 'admin' && req.user._id.toString() !== userId.toString()) {
      return res.status(403).json({ message: "Not authorized" });
    }

    // Handle password update for admin users
    if (req.user.userType === 'admin' && req.body.password) {
      user.password = req.body.password;
    }

    // Special handling for lastName field
    if (user.userType === 'admin') {
      // For admin users, lastName is optional
      delete req.body.lastName; // Remove validation for lastName
    } else if (!req.body.lastName && !user.lastName) {
      // For non-admin users, lastName is required
      return res.status(400).json({ message: "Last name is required" });
    }

    // Special handling for team leader status toggle
    if (req.body.hasOwnProperty('isTeamLeader') && user.userType === 'tanod') {
      console.log(`Updating team leader status for ${user.firstName} ${user.lastName} to: ${req.body.isTeamLeader}`);
      user.isTeamLeader = req.body.isTeamLeader;
    }

    // Update other fields
    const allowedFields = [
      'firstName',
      'lastName',
      'middleName', 
      'email',
      'username',
      'address',
      'contactNumber',
      'birthday',
      'gender',
      'profilePicture'
    ];

    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) {
        user[field] = req.body[field];
      }
    });

    const updatedUser = await user.save();
    const userResponse = updatedUser.toObject();
    delete userResponse.password;
    
    res.json(userResponse);
  } catch (error) {
    console.error("Update Error:", error);
    res.status(500).json({ message: error.message || "Server error" });
  }
};

exports.loginResident = async (req, res) => {
  const { email, password } = req.body; // Extract email and password from request body
  try {
    // Find user by email
    const user = await User.findOne({ email });

    // Verify password and user type
    if (
      user &&
      (await bcrypt.compare(password, user.password)) &&
      user.userType === "resident"
    ) {
      return res.json({
        _id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        userType: user.userType,
        token: generateToken(user._id), // Use the generateToken function
        profilePicture: user.profilePicture,
      });
    }

    // Invalid credentials
    res.status(401).json({ message: "Invalid email or password" });
  } catch (error) {
    console.error("Login Error:", error.message);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// authController.js

exports.loginTanod = async (req, res) => {
  try {
    const { username, password } = req.body;

    const user = await User.findOne({ username }).select('+password');
    if (!user) {
      return res.status(401).json({ message: "Invalid username or password" });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid username or password" });
    }

    // Update online status and last active time
    user.isOnline = true;
    user.lastActive = new Date();
    await user.save();

    if (user.userType !== "tanod" && user.userType !== "admin") {
      return res.status(403).json({ message: "Access denied: User type not authorized" });
    }

    return res.json({
      _id: user._id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      userType: user.userType,
      token: generateToken(user._id),
      profilePicture: user.profilePicture,
      id: user._id
    });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

exports.loginAdmin = async (req, res) => {
  const { username, password } = req.body; // Extract username and password from request body
  try {
    const user = await User.findOne({ username }); // Find user by username

    // If user is not found, return an error
    if (!user) {
      return res.status(401).json({ message: "Invalid username or password" });
    }

    // Verify password
    const isPasswordMatch = await bcrypt.compare(password, user.password);
    if (!isPasswordMatch) {
      return res.status(401).json({ message: "Invalid username or password" });
    }

    // Check if the user type is either "tanod" or "admin"
    if (user.userType !== "tanod" && user.userType !== "admin") {
      return res.status(403).json({ message: "Access denied: User type not authorized" });
    }

    // If the password matches and user type is valid, return user info and token
    return res.json({
      _id: user._id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      userType: user.userType,
      token: generateToken(user._id), // Use the generateToken function
      profilePicture: user.profilePicture,
      id: user._id // Add this line to ensure userId is included
    });
  } catch (error) {
    console.error("Login Error:", error.message);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Change Password
exports.changePassword = async (req, res) => {
  try {
    const userId = req.params.userId || req.user._id;
    const { currentPassword, newPassword } = req.body;
    
    const user = await User.findById(userId).select('+password');
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Verify current password
    if (!req.params.userId) {
      const isMatch = await user.comparePassword(currentPassword);
      if (!isMatch) {
        return res.status(401).json({ message: "Current password is incorrect" });
      }
    }

    // Update password
    user.password = newPassword;
    await user.save();

    res.json({ message: "Password updated successfully" });
  } catch (error) {
    console.error("Change Password Error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

exports.loginUser = async (req, res) => {
  const { email, password } = req.body;

  try {
    // Find user by email
    const user = await User.findOne({ email });

    // Verify password
    if (user && (await bcrypt.compare(password, user.password))) {
      return res.json({
        _id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        userType: user.userType,
        token: generateToken(user._id),
      });
    }

    // Invalid credentials
    res.status(401).json({ message: "Invalid email or password" });
  } catch (error) {
    console.error("Login Error:", error.message);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Add new logout function
exports.logout = async (req, res) => {
  try {
    await User.findByIdAndUpdate(req.user._id, {
      isOnline: false,
      lastActive: new Date()
    });
    res.json({ message: 'Logged out successfully' });
  } catch (error) {
    console.error('Logout Error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Function to add equipment
exports.addEquipment = async (req, res) => {
  const { name, borrowDate, returnDate, imageUrl } = req.body;

  try {
    // Check if the inventory item exists and has sufficient quantity
    const inventoryItem = await Inventory.findOne({ 
      name: { $regex: new RegExp(`^${name}$`, 'i') }
    });
    
    if (!inventoryItem || inventoryItem.quantity <= 0) {
      return res.status(400).json({ message: "Item unavailable in inventory." });
    }

    // Check if user has already borrowed this item and not returned it
    const existingBorrowedItem = await Equipment.findOne({
      user: req.user.id,
      name: { $regex: new RegExp(`^${name}$`, 'i') },
      returnDate: new Date("1970-01-01T00:00:00.000Z") // Default date for unreturned items
    });

    if (existingBorrowedItem) {
      return res.status(400).json({ 
        message: "You already have this item checked out. Please return it before borrowing another one."
      });
    }

    // Create a new equipment entry
    const newEquipment = new Equipment({
      name,
      borrowDate,
      returnDate,
      // Use the provided imageUrl or fallback to the inventory item's imageUrl if available
      imageUrl: imageUrl || inventoryItem.imageUrl || null,
      user: req.user.id,
    });

    // Save equipment to indicate it has been borrowed
    const savedEquipment = await newEquipment.save();

    // Decrease inventory quantity by 1 but keep total the same
    inventoryItem.quantity -= 1;
    await inventoryItem.save();
    
    console.log(`Equipment borrowed: ${name}. Updated inventory: quantity=${inventoryItem.quantity}, total=${inventoryItem.total}`);

    res.status(201).json(savedEquipment);
  } catch (error) {
    console.error("Error saving equipment:", error);
    res.status(500).json({ message: "Error saving equipment" });
  }
};

// Function to get all equipment
exports.getEquipments = async (req, res) => {
  try {
    const equipments = await Equipment.find({ user: req.user._id }).populate("user", "firstName lastName");
    res.status(200).json(equipments);
  } catch (error) {
    console.error("Error fetching equipments:", error);
    res.status(500).json({ message: "Error fetching equipments" });
  }
};

// Update equipment return date and increment inventory quantity
exports.updateEquipment = async (req, res) => {
  try {
    const equipment = await Equipment.findById(req.params.id);

    if (!equipment) {
      return res.status(404).json({ message: "Equipment not found" });
    }
    
    // Get previous return date to check if this is a return operation
    const previousReturnDate = new Date(equipment.returnDate);
    const isReturn = previousReturnDate.getFullYear() <= 1970 && req.body.returnDate && new Date(req.body.returnDate).getFullYear() > 1970;

    // Update return date
    equipment.returnDate = req.body.returnDate;
    const updatedEquipment = await equipment.save();

    // Increment inventory quantity by 1 after return (only if this is a return operation)
    if (isReturn) {
      const inventoryItem = await Inventory.findOne({ 
        name: { $regex: new RegExp(`^${equipment.name}$`, 'i') } 
      });
      
      if (inventoryItem) {
        inventoryItem.quantity += 1;
        await inventoryItem.save();
        console.log(`Equipment returned: ${equipment.name}. Updated inventory: quantity=${inventoryItem.quantity}, total=${inventoryItem.total}`);
      }
    }

    res.json(updatedEquipment);
  } catch (error) {
    console.error("Error updating equipment:", error);
    res.status(500).json({ message: "Server error" });
  }
};

//Rate and edit rating tanod
exports.rateTanod = async (req, res) => {
  const { tanodId } = req.params;
  const { rating, comment } = req.body;

  if (!rating || !comment || rating < 1 || rating > 5) {
    return res.status(400).json({ message: "Invalid rating or comment" });
  }

  try {
    // Find or create rating document for this tanod
    let tanodRating = await TanodRating.findOne({ tanodId });
    
    if (!tanodRating) {
      tanodRating = new TanodRating({
        tanodId,
        ratings: []
      });
    }

    // If user has already rated, update their rating
    const ratingIndex = tanodRating.ratings.findIndex(
      r => r.userId && r.userId.toString() === req.user?._id?.toString()
    );

    if (ratingIndex > -1) {
      tanodRating.ratings[ratingIndex] = {
        ...tanodRating.ratings[ratingIndex],
        rating,
        comment,
        createdAt: new Date()
      };
    } else {
      // Add new rating
      tanodRating.ratings.push({
        userId: req.user?._id,
        rating,
        comment,
        createdAt: new Date()
      });
    }

    await tanodRating.save();
    
    return res.status(200).json({ 
      message: ratingIndex > -1 ? "Rating updated successfully" : "Rating submitted successfully",
      rating: tanodRating
    });
  } catch (error) {
    console.error("Error saving rating:", error);
    res.status(500).json({ message: "Error submitting rating" });
  }
};

exports.getTanodRatings = async (req, res) => {
  const { tanodId } = req.params;

  try {
    const tanodRating = await TanodRating.findOne({ tanodId })
      .populate('ratings.userId', 'firstName lastName');

    if (!tanodRating) {
      return res.status(200).json({
        overallRating: "0.0",
        ratingCounts: [0, 0, 0, 0, 0],
        comments: []
      });
    }

    const ratings = tanodRating.ratings;
    const overallRating = ratings.length > 0
      ? ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length
      : 0;

    const ratingCounts = [0, 0, 0, 0, 0];
    ratings.forEach(r => {
      ratingCounts[r.rating - 1]++;
    });

    // Make sure all properties are included in the comments array
    // Including identifier and visitorIdentifier to distinguish ticket-based ratings
    const comments = ratings.map(r => ({
      userId: r.userId?._id,
      fullName: r.fullName || (r.userId ? `${r.userId.firstName} ${r.userId.lastName}` : "Anonymous"),
      comment: r.comment,
      rating: r.rating,
      createdAt: r.createdAt,
      identifier: r.identifier || null,
      visitorIdentifier: r.visitorIdentifier || null
    }));

    // Sort comments by createdAt date, newest first
    comments.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    res.json({
      overallRating: overallRating.toFixed(1),
      ratingCounts,
      comments
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ 
      message: "Error fetching ratings",
      error: error.message 
    });
  }
};

// Get ratings by the logged-in user
exports.getUserRatings = async (req, res) => {
  try {
    const ratings = await TanodRating.find({ userId: req.user._id }).populate(
      "tanodId",
      "firstName lastName"
    );
    if (!ratings.length) {
      return res.status(404).json({ message: "No ratings found" });
    }
    res.json(ratings);
  } catch (error) {
    console.error("Error fetching user ratings:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Delete rating by the logged-in user
exports.deleteRating = async (req, res) => {
  try {
    const rating = await TanodRating.findOneAndDelete({
      _id: req.params.ratingId,
      userId: req.user._id,
    });
    if (!rating) {
      return res.status(404).json({
        message:
          "Rating not found or you do not have permission to delete this rating",
      });
    }
    res.json({ message: "Rating deleted successfully" });
  } catch (error) {
    console.error("Error deleting rating:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Create a new schedule
exports.createSchedule = async (req, res) => {
  const { unit, tanods, startTime, endTime, patrolArea, scheduleID } = req.body;

  try {
    if (!unit || !tanods || !startTime || !endTime) {
      return res.status(400).json({ message: "All fields are required" });
    }
    
    // Add validation for minimum number of tanods
    if (!Array.isArray(tanods) || tanods.length < 2) {
      return res.status(400).json({ message: "At least 2 tanods are required for a schedule" });
    }
    
    // Use the exact date and time provided from the client
    const startDateTime = new Date(startTime);
    const endDateTime = new Date(endTime);
    
    if (endDateTime <= startDateTime) {
      return res.status(400).json({ message: "End time must be after start time" });
    }
    
    // Determine status based on current time and schedule dates
    const now = new Date();
    let status;
    
    if (startDateTime > now) {
      status = 'Upcoming';
    } else if (endDateTime < now) {
      status = 'Completed';
    } else {
      status = 'Ongoing';
    }

    const schedule = new Schedule({
      unit,
      tanods,
      startTime,
      endTime,
      patrolArea,
      status,
    });

    // Set scheduleID if provided, otherwise it will use the default generator
    if (scheduleID) {
      schedule.scheduleID = scheduleID;
    }

    // Initialize patrolStatus for each tanod
    schedule.patrolStatus = tanods.map(tanodId => ({
      tanodId,
      status: 'Not Started',
    }));

    await schedule.save();

    // Create a notification for each Tanod in the schedule
    const notifications = tanods.map(tanodId => ({
      userId: tanodId,
      message: `You have new patrol schedule! Your shift is ${unit}.`,
    }));
    await Notification.insertMany(notifications);

    res.status(201).json({ message: "Schedule created successfully", schedule });
  } catch (error) {
    console.error("Error creating schedule:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Get all schedules
exports.getAllSchedules = async (req, res) => {
  try {
    const schedules = await Schedule.find().populate(
      "tanods",
      "firstName lastName"
    ).populate("patrolArea", "legend"); // Populate patrolArea's legend field
    if (!schedules.length)
      return res.status(404).json({ message: "No schedules found" });

    res.status(200).json(schedules);
  } catch (error) {
    console.error("Error fetching schedules:", error.message);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Get a single schedule by ID
exports.getScheduleById = async (req, res) => {
  try {
    const schedule = await Schedule.findById(req.params.scheduleId).populate(
      "tanods",
      "firstName lastName"
    ).populate("patrolArea", "legend"); // Populate patrolArea's legend field
    if (!schedule) {
      return res.status(404).json({ message: "Schedule not found" });
    }
    res.status(200).json(schedule);
  } catch (error) {
    console.error("Error fetching schedule:", error.message);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Update a schedule
exports.updateSchedule = async (req, res) => {
  const { unit, tanods, startTime, endTime, patrolArea, scheduleID } = req.body;

  try {
    const schedule = await Schedule.findById(req.params.scheduleId);
    if (!schedule) {
      return res.status(404).json({ message: "Schedule not found" });
    }

    // Add validation for minimum number of tanods when updating
    if (tanods && (tanods.length < 2)) {
      return res.status(400).json({ message: "At least 2 tanods are required for a schedule" });
    }

    // If both times are provided, validate start time is before end time
    if (startTime && endTime) {
      const startDateTime = new Date(startTime);
      const endDateTime = new Date(endTime);
      
      if (endDateTime <= startDateTime) {
        return res.status(400).json({ message: "End time must be after start time" });
      }
    }

    // Update schedule fields
    schedule.unit = unit || schedule.unit;
    
    // Handle tanods update - only update if there's a change to avoid unnecessary work
    if (tanods && JSON.stringify(tanods) !== JSON.stringify(schedule.tanods)) {
      // Find new tanods that were not in the previous version
      const existingTanods = schedule.tanods.map(t => t.toString());
      const newTanods = tanods.filter(t => !existingTanods.includes(t));
      
      // Update the tanods array
      schedule.tanods = tanods;
      
      // Update patrolStatus array to add new tanods
      newTanods.forEach(tanodId => {
        if (!schedule.patrolStatus.some(ps => ps.tanodId.toString() === tanodId)) {
          schedule.patrolStatus.push({ 
            tanodId,  
            status: 'Not Started' 
          });
        }
      });
      
      // Remove patrol status entries for tanods that are no longer in the schedule
      schedule.patrolStatus = schedule.patrolStatus.filter(ps => 
        tanods.includes(ps.tanodId.toString()));
    }

    // Update other fields
    if (startTime) schedule.startTime = startTime;
    if (endTime) schedule.endTime = endTime;      
    if (patrolArea) schedule.patrolArea = patrolArea;

    // Determine status based on current time and updated schedule dates
    const now = new Date();
    const updatedStartTime = new Date(startTime || schedule.startTime);
    const updatedEndTime = new Date(endTime || schedule.endTime);
    
    if (updatedStartTime > now) {
      schedule.status = 'Upcoming';
    } else if (updatedEndTime < now) {
      schedule.status = 'Completed';
    } else {
      schedule.status = 'Ongoing';
    }

    // Update scheduleID if provided
    if (scheduleID) {
      schedule.scheduleID = scheduleID;
    }

    await schedule.save();

    // Create notifications for tanods about the update
    const notifications = tanods.map(tanodId => ({
      userId: tanodId,
      message: `Your patrol schedule has been updated!`,
    }));
    await Notification.insertMany(notifications);

    res.status(200).json({ message: "Schedule updated successfully", schedule });
  } catch (error) {
    console.error("Error updating schedule:", error.message);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Delete a schedule
exports.deleteSchedule = async (req, res) => {
  try {
    const schedule = await Schedule.findByIdAndDelete(req.params.scheduleId);
    if (!schedule) {
      return res.status(404).json({ message: "Schedule not found" });
    }
    res.status(200).json({ message: "Schedule deleted successfully" });
  } catch (error) {
    console.error("Error deleting schedule:", error.message);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Fetch members of a specific schedule
exports.getScheduleMembers = async (req, res) => {
  const { id } = req.params;
  try {
    // Populate additional fields like profilePicture, contactNumber, and isTeamLeader
    const schedule = await Schedule.findById(id).populate(
      "tanods",
      "firstName lastName profilePicture contactNumber isTeamLeader"
    );
    if (!schedule) {
      return res.status(404).json({ message: "Schedule not found" });
    }
    res.status(200).json({ tanods: schedule.tanods });
  } catch (error) {
    console.error("Error fetching schedule members:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Fetch schedules for a specific Tanod
exports.getSchedulesForTanod = async (req, res) => {
  const { userId } = req.params;
  try {
    const schedules = await Schedule.find({ tanods: userId })
      .populate("tanods", "firstName lastName profilePicture contactNumber")
      .populate("patrolArea", "legend coordinates color"); // Populate patrolArea with necessary fields
    if (!schedules.length) {
      return res.status(404).json({ message: "No schedules found for this Tanod." });
    }
    res.status(200).json(schedules);
  } catch (error) {
    console.error("Error fetching schedules for Tanod:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Update patrol area of a schedule
exports.updatePatrolArea = async (req, res) => {
  const { id } = req.params;
  const { patrolArea } = req.body;

  try {
    const schedule = await Schedule.findById(id);
    if (!schedule) {
      return res.status(404).json({ message: "Schedule not found" });
    }
    schedule.patrolArea = patrolArea;
    await schedule.save();
    res.status(200).json({ message: "Patrol area assigned successfully", schedule });
  } catch (error) {
    res.status(500).json({ message: "Failed to assign patrol area", error: error.message });
  }
};

// Update patrol status to 'Ongoing' and member status to 'Started'
exports.startPatrol = async (req, res) => {
  const { scheduleId } = req.params;
  const userId = req.user._id;

  try {
    const schedule = await Schedule.findById(scheduleId);
    if (!schedule) {
      return res.status(404).json({ message: "Schedule not found" });
    }
    schedule.status = 'Ongoing';
    const memberStatus = schedule.patrolStatus.find(status => status.tanodId.toString() === userId.toString());
    if (memberStatus) {
      memberStatus.status = 'Started';
      memberStatus.startTime = new Date();
    } else {
      schedule.patrolStatus.push({ tanodId: userId, status: 'Started', startTime: new Date() });
    }
    await schedule.save();
    res.status(200).json({ message: "Patrol started", schedule });
  } catch (error) {
    console.error("Error starting patrol:", error.message);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Update patrol status to 'Completed' if all members have ended the patrol
exports.endPatrol = async (req, res) => {
  try {
    const { id } = req.params; // Schedule ID from URL parameter
    const userId = req.user.id; // Get user ID from authenticated request

    const schedule = await Schedule.findById(id);
    if (!schedule) {
      return res.status(404).json({ message: 'Schedule not found' });
    }
    // Find the patrol status for this user
    const patrolStatus = schedule.patrolStatus.find(
      status => status.tanodId.toString() === userId.toString()
    );

    if (!patrolStatus) {
      return res.status(400).json({ message: 'User not found in patrol status' });
    }

    // Update the patrol status
    patrolStatus.status = 'Completed';
    patrolStatus.endTime = new Date();

    // Check if all members have ended their patrol
    const allMembersEnded = schedule.patrolStatus.every(
      status => status.status === 'Completed' || status.status === 'Absent'
    );

    if (allMembersEnded) {
      schedule.status = 'Completed';
    }

    // Emit the update through WebSocket
    const io = require('../websocket').getIO();
    io.to('schedules').emit('scheduleUpdate', {
      type: 'update',
      schedule
    });

    await schedule.save();

    res.status(200).json({ 
      message: 'Patrol ended successfully',
      schedule
    });
  } catch (error) {
    console.error('Error ending patrol:', error);
    res.status(500).json({ 
      message: 'Failed to end patrol',
      error: error.message
    });
  }
};

// Function to automatically update the status when the end time is reached or passed
exports.updateScheduleStatus = async () => {
  try {
    const schedules = await Schedule.find({ status: { $in: ['Upcoming', 'Ongoing'] } });
    const now = new Date();
    for (const schedule of schedules) {
      if (new Date(schedule.endTime) <= now) {
        schedule.status = 'Completed';
        await schedule.save();
      }
    }
  } catch (error) {
    console.error("Error updating schedule status:", error.message);
  }
};

// Save patrol logs
exports.savePatrolLogs = async (req, res) => {
  const { scheduleId, logs } = req.body;

  try {
    const schedule = await Schedule.findById(scheduleId);
    if (!schedule) {
      return res.status(404).json({ message: 'Schedule not found' });
    }
    logs.forEach(log => {
      schedule.patrolLogs.push({ 
        userId: req.user.id, 
        log: log.report,
        timestamp: new Date(log.timestamp),
        scheduleId: scheduleId, // Ensure the schedule ID is saved with the log
      });
    });
    await schedule.save();
    res.status(200).json({ message: 'Patrol logs saved successfully' });
  } catch (error) {
    console.error('Error saving patrol logs:', error);
    res.status(500).json({ message: 'Failed to save patrol logs' });
  }
};

// Fetch patrol logs for a specific user and schedule
exports.getPatrolLogs = async (req, res) => {
  try {
    const { userId, scheduleId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(scheduleId)) {
      return res.status(400).json({ message: 'Invalid schedule ID' });
    }
    const schedule = await Schedule.findById(scheduleId);
    if (!schedule) {
      return res.status(404).json({ message: 'Schedule not found' });
    }
    const patrolLogs = schedule.patrolLogs.filter(log => log.userId.toString() === userId);
    res.status(200).json(patrolLogs);
  } catch (error) {
    console.error('Error fetching patrol logs:', error);
    res.status(500).json({ message: 'Failed to fetch patrol logs.' });
  }
};

// Fetch unread notifications for the logged-in user
exports.getUnreadNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({ userId: req.user._id, read: false });
    res.status(200).json(notifications);
  } catch (error) {
    console.error('Error fetching unread notifications:', error);
    res.status(500).json({ message: 'Failed to fetch unread notifications.' });
  }
};

// Mark notifications as read
exports.markNotificationsAsRead = async (req, res) => {
  try {
    await Notification.updateMany({ userId: req.user._id, read: false }, { read: true });
    res.status(200).json({ message: 'Notifications marked as read.' });
  } catch (error) {
    console.error('Error marking notifications as read:', error);
    res.status(500).json({ message: 'Failed to mark notifications as read.' });
  }
};

// Add these new controller functions:
exports.getPatrolStats = async (req, res) => {
  try {
    const userId = req.params.userId;
    
    // Fix: Use 'new' when creating ObjectId
    const userObjectId = new mongoose.Types.ObjectId(userId);
    
    // Get all schedules where this user is a tanod
    const schedules = await Schedule.find({ 
      tanods: userObjectId
    });

    // Calculate stats
    const totalPatrols = schedules.length;
    const completedPatrols = schedules.filter(s => s.status === 'Completed').length;
    const ongoingPatrols = schedules.filter(s => s.status === 'Ongoing').length;
    
    // Fix the date calculation for lastPatrolDate
    const lastPatrolDate = schedules.length > 0 ? 
        new Date(Math.max(...schedules.map(s => new Date(s.startTime).getTime()))) : null;

    // Calculate monthly stats
    const monthlyPatrols = Array(6).fill(0).map((_, i) => {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const monthName = date.toLocaleString('default', { month: 'short' });
      const count = schedules.filter(s => {
        const scheduleDate = new Date(s.startTime);
        return scheduleDate.getMonth() === date.getMonth() && 
               scheduleDate.getFullYear() === date.getFullYear();
      }).length;
      return { name: monthName, count };
    }).reverse();

    // Get areas patrolled - fix the MongoDB aggregation query
    const areasPatrolled = await Schedule.aggregate([
      { $match: { tanods: userObjectId } },
      { $lookup: { 
          from: 'polygons', 
          localField: 'patrolArea', 
          foreignField: '_id', 
          as: 'area' 
      }},
      { $unwind: { path: '$area', preserveNullAndEmptyArrays: true } },
      { $group: { 
        _id: '$area._id',
        name: { $first: '$area.legend' },
        patrolCount: { $sum: 1 }
      }}
    ]);

    res.json({
      totalPatrols,
      completedPatrols,
      ongoingPatrols,
      lastPatrolDate,
      monthlyPatrols,
      areasPatrolled
    });
  } catch (error) {
    console.error("Error fetching patrol stats:", error);
    res.status(500).json({ message: "Error fetching patrol stats" });
  }
};

exports.getIncidentStats = async (req, res) => {
  try {
    const userId = req.params.userId;
    // Fix: Use 'new' when creating ObjectId
    const userObjectId = new mongoose.Types.ObjectId(userId);
    
    // Get all incident reports handled by this user
    const incidents = await IncidentReport.find({
      responder: userObjectId
    });

    // Calculate stats
    const totalResponses = incidents.length;
    const resolvedIncidents = incidents.filter(i => i.status === 'Resolved').length;
    
    // Calculate response rate - properly calculate based on resolved/total
    const responseRate = totalResponses > 0 ? 
        ((resolvedIncidents / totalResponses) * 100).toFixed(1) : 0;
    
    // Calculate average response time with outlier handling
    const responseTimes = incidents
      .filter(i => i.status === 'Resolved' && i.respondedAt && i.createdAt) // Only consider resolved incidents
      .map(i => {
        const responseTimeMinutes = Math.max(0, (new Date(i.respondedAt) - new Date(i.createdAt)) / (1000 * 60));
        // Cap extremely large values (e.g., cap at 24 hours = 1440 minutes)
        return Math.min(responseTimeMinutes, 1440);
      });
    
    const averageResponseTime = responseTimes.length > 0 ?
        Math.round(responseTimes.reduce((a, b) => a + b) / responseTimes.length) : 0;
    
    res.json({
      totalIncidentResponses: totalResponses,
      resolvedIncidents,
      responseRate,
      averageResponseTime
    });
  } catch (error) {
    console.error("Error fetching incident stats:", error);
    res.status(500).json({ message: "Error fetching incident stats" });
  }
};

// Get incident types breakdown for a tanod
exports.getIncidentTypeBreakdown = async (req, res) => {
  try {
    const userId = req.params.userId;
    // Fix: Use 'new' when creating ObjectId
    const userObjectId = new mongoose.Types.ObjectId(userId);
    
    // Get all incident reports handled by this tanod
    const incidents = await IncidentReport.find({
      responder: userObjectId
    }).select('type');

    // Group by incident type and count
    const typeCounts = {};
    incidents.forEach(incident => {
      if (!typeCounts[incident.type]) {
        typeCounts[incident.type] = 0;
      }
      typeCounts[incident.type]++;
    });

    // Format for frontend
    const labels = Object.keys(typeCounts);
    const counts = labels.map(label => typeCounts[label]);

    res.json({
      labels,
      counts
    });
  } catch (error) {
    console.error("Error fetching incident type breakdown:", error);
    res.status(500).json({ message: "Error fetching incident type statistics" });
  }
};

// Get attendance statistics for a tanod
exports.getAttendanceStats = async (req, res) => {
  try {
    const userId = req.params.userId;
    // Fix: Use 'new' when creating ObjectId
    const userObjectId = new mongoose.Types.ObjectId(userId);
    
    // Get all schedules where this user was assigned
    const schedules = await Schedule.find({
      tanods: userObjectId
    });

    const totalScheduled = schedules.length;

    // Find schedules where the user actually participated (has patrolStatus entry)
    const attendedSchedules = schedules.filter(schedule => 
      schedule.patrolStatus.some(status => 
        status.tanodId.toString() === userId.toString() && 
        (status.status === 'Started' || status.status === 'Completed')
      )
    );

    const attended = attendedSchedules.length;
    const attendanceRate = totalScheduled > 0 ? 
        ((attended / totalScheduled) * 100).toFixed(1) : 0;

    // Calculate on-time rate
    let onTimeCount = 0;
    let totalDelayMinutes = 0;
    
    attendedSchedules.forEach(schedule => {
      const statusEntry = schedule.patrolStatus.find(
        status => status.tanodId.toString() === userId.toString()
      );
      
      if (statusEntry && statusEntry.startTime) {
        const scheduledStart = new Date(schedule.startTime);
        const actualStart = new Date(statusEntry.startTime);
        const delayInMinutes = Math.max(0, (actualStart - scheduledStart) / (1000 * 60));
        
        if (delayInMinutes <= 5) { // Consider "on time" if within 5 minutes
          onTimeCount++;
        }
        
        totalDelayMinutes += delayInMinutes;
      }
    });

    const onTimeRate = attended > 0 ? 
        ((onTimeCount / attended) * 100).toFixed(1) : 0;
    const averageDelay = attended > 0 ? 
        (totalDelayMinutes / attended).toFixed(1) : 0;

    res.json({
      totalScheduled,
      attended,
      attendanceRate,
      onTimeRate,
      averageDelay
    });
  } catch (error) {
    console.error("Error fetching attendance stats:", error);
    res.status(500).json({ message: "Error fetching attendance statistics" });
  }
};

// Get equipment statistics for a tanod
exports.getEquipmentStats = async (req, res) => {
  try {
    const userId = req.params.userId;
    // Fix: Use 'new' when creating ObjectId
    const userObjectId = new mongoose.Types.ObjectId(userId);
    
    // Get all equipment borrowed by this user
    const equipment = await Equipment.find({ 
      user: userObjectId
    }).sort({ borrowDate: -1 });

    const totalBorrowed = equipment.length;
    
    // Fix: Check if returnDate exists AND is after January 1, 1971 to consider it returned
    const currentlyBorrowed = equipment.filter(item => {
      return !item.returnDate || (new Date(item.returnDate).getFullYear() <= 1970);
    }).length;

    // Calculate return rate - only count properly returned items
    let returnedOnTime = 0;
    equipment.forEach(item => {
      if (item.returnDate && item.borrowDate && new Date(item.returnDate).getFullYear() > 1970) {
        const borrowDate = new Date(item.borrowDate);
        const returnDate = new Date(item.returnDate);
        const expectedReturn = new Date(borrowDate);
        expectedReturn.setDate(expectedReturn.getDate() + 7); // Assuming 7 days loan period
        
        if (returnDate <= expectedReturn) {
          returnedOnTime++;
        }
      }
    });

    const returnRate = totalBorrowed > 0 ? 
        ((returnedOnTime / totalBorrowed) * 100).toFixed(1) : 0;
    
    // Get recent equipment (last 5 items)
    const recentEquipment = equipment.slice(0, 5).map(item => ({
      name: item.name,
      borrowDate: item.borrowDate,
      returnDate: item.returnDate && new Date(item.returnDate).getFullYear() > 1970 ? item.returnDate : null
    }));

    res.json({
      totalBorrowed,
      currentlyBorrowed,
      returnedOnTime,
      returnRate,
      recentEquipment
    });
  } catch (error) {
    console.error("Error fetching equipment stats:", error);
    res.status(500).json({ message: "Error fetching equipment statistics" });
  }
};

// Get assistance request statistics for a tanod
exports.getAssistanceStats = async (req, res) => {
  try {
    const userId = req.params.userId;
    // Fix: Use 'new' when creating ObjectId
    const userObjectId = new mongoose.Types.ObjectId(userId);
    
    // Get all assistance requests made by this user
    const requests = await AssistanceRequest.find({ 
      requesterId: userObjectId
    });

    const totalRequests = requests.length;
    const approved = requests.filter(req => 
      req.status === 'Processing' || req.status === 'Deployed' || req.status === 'Completed'
    ).length;
    const rejected = requests.filter(req => req.status === 'Rejected').length;
    
    const approvalRate = totalRequests > 0 ? 
        ((approved / totalRequests) * 100).toFixed(1) : 0;
    
    // Calculate average response time (from request to approval)
    let totalResponseTime = 0;
    let responsesWithTime = 0;
    
    requests.forEach(req => {
      if (req.approvedDetails && req.approvedDetails.length > 0 && req.dateRequested) {
        const requestDate = new Date(req.dateRequested);
        const approvalDate = new Date(req.approvedDetails[0].approvedDateTime);
        const responseTimeMinutes = (approvalDate - requestDate) / (1000 * 60);
        
        totalResponseTime += responseTimeMinutes;
        responsesWithTime++;
      }
    });

    const avgResponseTime = responsesWithTime > 0 ? 
        Math.round(totalResponseTime / responsesWithTime) : 0;

    res.json({
      totalRequests,
      approved,
      rejected,
      approvalRate,
      avgResponseTime
    });
  } catch (error) {
    console.error("Error fetching assistance stats:", error);
    res.status(500).json({ message: "Error fetching assistance request statistics" });
  }
};

// Get performance comparison data for a tanod
exports.getPerformanceComparison = async (req, res) => {
  try {
    const userId = req.params.userId;
    // Fix: Use 'new' when creating ObjectId
    const userObjectId = new mongoose.Types.ObjectId(userId);
    
    // Get all tanods
    const tanods = await User.find({ userType: 'tanod' });
    const totalTanods = tanods.length;
    
    // Get patrol data for all tanods
    const patrolData = await Promise.all(tanods.map(async tanod => {
      const schedules = await Schedule.find({ tanods: tanod._id });
      return {
        tanodId: tanod._id,
        patrolCount: schedules.length
      };
    }));
    
    // Sort by patrol count
    patrolData.sort((a, b) => b.patrolCount - a.patrolCount);

    // Find user's rank in patrols
    const patrolsRank = patrolData.findIndex(data => data.tanodId.toString() === userId) + 1;
    const patrolsPercentile = patrolsRank > 0 ? 
        Math.round((totalTanods - patrolsRank) / totalTanods * 100) : 0;

    // Get incident data for all tanods
    const incidentData = await Promise.all(tanods.map(async tanod => {
      const incidents = await IncidentReport.find({ responder: tanod._id });
      return {
        tanodId: tanod._id,
        incidentCount: incidents.length
      };
    }));
    
    // Sort by incident count
    incidentData.sort((a, b) => b.incidentCount - a.incidentCount);

    // Find user's rank in incidents
    const incidentsRank = incidentData.findIndex(data => data.tanodId.toString() === userId) + 1;
    const incidentsPercentile = incidentsRank > 0 ? 
        Math.round((totalTanods - incidentsRank) / totalTanods * 100) : 0;

    // Get rating data for all tanods
    const ratingData = await Promise.all(tanods.map(async tanod => {
      const ratings = await TanodRating.findOne({ tanodId: tanod._id });
      let avgRating = 0;
      
      if (ratings && ratings.ratings.length > 0) {
        avgRating = ratings.ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.ratings.length;
      }
      
      return {
        tanodId: tanod._id,
        avgRating
      };
    }));
    
    // Sort by rating
    ratingData.sort((a, b) => b.avgRating - a.avgRating);

    // Find user's rank in ratings
    const ratingRank = ratingData.findIndex(data => data.tanodId.toString() === userId) + 1;
    const ratingPercentile = ratingRank > 0 ? 
        Math.round((totalTanods - ratingRank) / totalTanods * 100) : 0;

    res.json({
      patrolsRank: patrolsRank || totalTanods,
      patrolsPercentile,
      incidentsRank: incidentsRank || totalTanods,
      incidentsPercentile,
      ratingRank: ratingRank || totalTanods,
      ratingPercentile,
      totalTanods
    });
  } catch (error) {
    console.error("Error fetching performance comparison:", error);
    res.status(500).json({ message: "Error generating performance comparison" });
  }
};

// Get public tanod list
exports.getPublicTanodList = async (req, res) => {
  try {
    const tanods = await User.find({ userType: 'tanod' })
      .select('_id firstName lastName profilePicture')
      .sort({ firstName: 1 });
    res.status(200).json(tanods);
  } catch (error) {
    console.error('Error fetching public tanod list:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Generate a random 6-digit code
const generateVerificationCode = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Initiate Tanod Login with MFA
exports.initiateTanodLogin = async (req, res) => {
  try {
    const { username, password } = req.body;

    // Find user by username
    const user = await User.findOne({ username }).select('+password');
    if (!user) {
      return res.status(401).json({ message: "Invalid username or password" });
    }

    // Verify password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid username or password" });
    }

    // Check if the user type is either "tanod" or "admin"
    if (user.userType !== "tanod" && user.userType !== "admin") {
      return res.status(403).json({ message: "Access denied: User type not authorized" });
    }

    // Generate a verification code
    const verificationCode = generateVerificationCode();

    // First, delete any existing codes for this user
    await VerificationCode.deleteMany({ userId: user._id });
    
    // Create a new verification code
    await VerificationCode.create({
      userId: user._id,
      code: verificationCode
    });

    // Send verification code via email
    const emailSent = await sendVerificationCode(
      user.email, 
      verificationCode,
      user.firstName
    );

    if (!emailSent && process.env.NODE_ENV !== 'Development') {
      return res.status(500).json({ message: "Failed to send verification code. Please contact an administrator." });
    }

    // Return user id and type (without sensitive data)
    return res.status(200).json({
      message: "Verification code sent",
      userId: user._id,
      userType: user.userType
    });
  } catch (error) {
    console.error("Login Error:", error.message);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Verify Tanod MFA code
exports.verifyTanodMfa = async (req, res) => {
  try {
    const { userId, verificationCode } = req.body;
    
    if (!userId || !verificationCode) {
      return res.status(400).json({ message: "User ID and verification code are required" });
    }

    // Validate that userId is a valid ObjectId
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: "Invalid user ID format" });
    }

    // Find the verification code in the database
    const storedVerification = await VerificationCode.findOne({ userId });
    
    if (!storedVerification) {
      return res.status(401).json({ message: "Verification code expired or not found" });
    }

    // Check if the code matches
    if (storedVerification.code !== verificationCode) {
      return res.status(401).json({ message: "Invalid verification code" });
    }

    // Find the user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Update online status and last active time
    user.isOnline = true;
    user.lastActive = new Date();
    await user.save();

    // Delete the verification code after successful verification
    await VerificationCode.deleteOne({ _id: storedVerification._id });

    // Generate JWT token and return user data
    return res.status(200).json({
      _id: user._id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      userType: user.userType,
      token: generateToken(user._id),
      profilePicture: user.profilePicture
    });
  } catch (error) {
    console.error("MFA Verification Error:", error.message);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Resend verification code
exports.resendVerificationCode = async (req, res) => {
  try {
    const { userId } = req.body;
    
    if (!userId) {
      return res.status(400).json({ message: "User ID is required" });
    }

    // Validate that userId is a valid ObjectId
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: "Invalid user ID format" });
    }

    // Check if the user has recently requested a code
    const lastAttempt = userVerificationAttempts.get(userId);
    const now = Date.now();
    if (lastAttempt && (now - lastAttempt) < 60000) { // 60 seconds cooldown
      const remainingSeconds = Math.ceil((60000 - (now - lastAttempt)) / 1000);
      return res.status(429).json({ 
        message: `Please wait ${remainingSeconds} seconds before requesting another code`,
        remainingSeconds
      });
    }

    // Find the user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Generate a new verification code
    const verificationCode = generateVerificationCode();

    // Delete any existing codes for this user
    await VerificationCode.deleteMany({ userId });
    
    // Create a new verification code
    await VerificationCode.create({
      userId,
      code: verificationCode
    });

    // Record this attempt time
    userVerificationAttempts.set(userId, now);

    // Send verification code via email
    const emailSent = await sendVerificationCode(
      user.email, 
      verificationCode,
      user.firstName
    );

    if (!emailSent && process.env.NODE_ENV !== 'Development') {
      return res.status(500).json({ message: "Failed to send verification code. Please contact an administrator." });
    }

    return res.status(200).json({
      message: "Verification code resent successfully"
    });
  } catch (error) {
    console.error("Resend Verification Error:", error.message);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Request password reset
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      // For security reasons, don't reveal that the email doesn't exist
      return res.status(200).json({ 
        message: "If your email is registered, you will receive a password reset link shortly" 
      });
    }

    // Generate a reset token
    const token = PasswordResetToken.generateToken();
    
    // Delete any existing tokens for this user
    await PasswordResetToken.deleteMany({ userId: user._id });

    // Create a new token record
    await PasswordResetToken.create({
      userId: user._id,
      token: token
    });

    // Create the reset link
    const resetLink = `${process.env.FRONTEND_URL}/reset-password/${token}`;

    // Send the password reset email
    const emailSent = await sendPasswordResetEmail(
      user.email,
      resetLink,
      user.firstName
    );

    if (!emailSent && process.env.NODE_ENV !== 'Development') {
      return res.status(500).json({ 
        message: "Failed to send password reset email. Please contact an administrator." 
      });
    }

    // Return success message
    return res.status(200).json({
      message: "If your email is registered, you will receive a password reset link shortly"
    });
  } catch (error) {
    console.error("Forgot Password Error:", error.message);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Reset password with token
exports.resetPassword = async (req, res) => {
  try {
    const { token, password } = req.body;
    
    if (!token || !password) {
      return res.status(400).json({ message: "Token and new password are required" });
    }

    // Find the token in the database
    const resetToken = await PasswordResetToken.findOne({ token });
    
    if (!resetToken) {
      return res.status(400).json({ 
        message: "Invalid or expired password reset token" 
      });
    }

    // Find the user
    const user = await User.findById(resetToken.userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Update the user's password
    user.password = password;
    await user.save();

    // Delete the used token
    await PasswordResetToken.deleteOne({ _id: resetToken._id });

    return res.status(200).json({
      message: "Password has been reset successfully. Please login with your new password."
    });
  } catch (error) {
    console.error("Reset Password Error:", error.message);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Get today's schedules for a specific Tanod - with improved date handling
exports.getTodaySchedulesForTanod = async (req, res) => {
  const { userId } = req.params;

  try {
    // Set up date range to include:
    // 1. Today's schedules 
    // 2. Yesterday's schedules that might still be active (end time > today start)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    // Find schedules that:
    // 1. Start today OR
    // 2. Started yesterday but end today or later OR
    // 3. Have status 'Ongoing' (to catch any active patrols)
    const schedules = await Schedule.find({
      tanods: userId,
      $or: [
        // Today's schedules
        { startTime: { $gte: today, $lt: tomorrow } },
        // Yesterday's schedules that end today or later
        { 
          startTime: { $gte: yesterday, $lt: today },
          endTime: { $gte: today }
        },
        // Any ongoing schedules regardless of dates
        { 
          status: 'Ongoing',
          tanods: userId,
          "patrolStatus.tanodId": userId,
          "patrolStatus.status": "Started"
        }
      ]
    })
    .populate("tanods", "firstName lastName profilePicture contactNumber")
    .populate("patrolArea", "legend coordinates color");

    // Return whatever we find (even if empty)
    res.status(200).json(schedules);
  } catch (error) {
    console.error("Error fetching today's schedules for Tanod:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Generate equipment audit report
exports.generateEquipmentAuditReport = async (req, res) => {
  try {
    // Extract parameters for filtering
    const { reportType = 'monthly', startDate, endDate } = req.query;
    
    // Define date range based on report type
    const dateRange = getDateRangeFromReportType(reportType, startDate, endDate);
    
    // Get equipment data with proper population
    const allEquipments = await Equipment.find({})
      .populate('user', 'firstName lastName');
    
    // Filter by date range if needed
    const equipmentsInPeriod = allEquipments.filter(eq => 
      new Date(eq.createdAt) >= dateRange.startDate && 
      new Date(eq.createdAt) <= dateRange.endDate
    );
    
    // Get inventory items with full data
    const inventoryItems = await Inventory.find();
    
    // Calculate statistics more accurately
    const currentlyBorrowed = allEquipments.filter(eq => 
      eq.returnDate === "1970-01-01T00:00:00.000Z" || !eq.returnDate
    ).length;
    
    const overdueItems = allEquipments.filter(eq => {
      if (eq.returnDate === "1970-01-01T00:00:00.000Z" || !eq.returnDate) {
        const dueDate = eq.dueDate ? new Date(eq.dueDate) : null;
        return dueDate && dueDate < new Date();
      }
      return false;
    }).length;
    
    const equipmentStats = {
      totalItems: inventoryItems.reduce((sum, item) => sum + (item.total || 0), 0),
      currentlyBorrowed,
      overdueItems,
      returnRate: calculateReturnRate(allEquipments)
    };
    
    // Get top borrowers with improved logic for days calculation
    const borrowerStats = {};
    
    allEquipments.forEach(eq => {
      if (!eq.user || !eq.user._id) return;
      
      const userId = eq.user._id.toString();
      const userName = `${eq.user.firstName || ''} ${eq.user.lastName || ''}`;
      
      if (!borrowerStats[userId]) {
        borrowerStats[userId] = {
          name: userName.trim() || 'Unknown User',
          userId: userId,
          itemsBorrowed: 0,
          itemsReturned: 0,
          returnedOnTime: 0,
          totalDaysKept: 0
        };
      }
      
      borrowerStats[userId].itemsBorrowed++;
      
      // Check if item was returned and calculate days properly
      if (eq.returnDate && eq.returnDate !== "1970-01-01T00:00:00.000Z") {
        borrowerStats[userId].itemsReturned++;
        
        // Calculate days kept - ensure positive values only
        const borrowDate = new Date(eq.borrowDate || eq.createdAt);
        const returnDate = new Date(eq.returnDate);
        
        // Ensure the dates are valid
        if (!isNaN(borrowDate) && !isNaN(returnDate)) {
          const daysKept = Math.max(0, Math.floor((returnDate - borrowDate) / (1000 * 60 * 60 * 24)));
          borrowerStats[userId].totalDaysKept += daysKept;
        }
        
        // Check if returned on time
        const dueDate = eq.dueDate ? new Date(eq.dueDate) : null;
        if (dueDate && returnDate <= dueDate) {
          borrowerStats[userId].returnedOnTime++;
        }
      }
    });
    
    const topBorrowers = Object.values(borrowerStats)
      .map(borrower => ({
        name: borrower.name,
        itemsBorrowed: borrower.itemsBorrowed,
        returnRate: borrower.itemsReturned > 0 
          ? Math.round((borrower.returnedOnTime / borrower.itemsReturned) * 100) 
          : 0,
        averageDaysKept: borrower.itemsReturned > 0 
          ? Math.round(borrower.totalDaysKept / borrower.itemsReturned) 
          : 0
      }))
      .sort((a, b) => b.itemsBorrowed - a.itemsBorrowed)
      .slice(0, 10); // Top 10 borrowers
    
    // Most borrowed items with improved tracking
    const itemBorrowStats = {};
    
    // First add all inventory items to ensure we capture everything
    inventoryItems.forEach(item => {
      itemBorrowStats[item.name] = {
        name: item.name,
        borrowCount: 0,
        damageCount: 0,
        availableCount: item.total || 0
      };
    });
    
    // Then count actual borrowing activity
    allEquipments.forEach(eq => {
      if (!eq.name && !eq.itemName) return;
      
      const itemName = eq.itemName || eq.name;
      
      if (!itemBorrowStats[itemName]) {
        // Item was borrowed but isn't in current inventory
        itemBorrowStats[itemName] = {
          name: itemName,
          borrowCount: 0,
          damageCount: 0,
          availableCount: 0 // We don't know how many are available
        };
      }
      
      itemBorrowStats[itemName].borrowCount++;
      
      if (eq.condition === 'damaged') {
        itemBorrowStats[itemName].damageCount++;
      }
    });
    
    const mostBorrowedItems = Object.values(itemBorrowStats)
      .filter(item => item.borrowCount > 0) // Only include items that have been borrowed
      .map(item => ({
        name: item.name,
        borrowCount: item.borrowCount,
        availableCount: item.availableCount,
        damageRate: item.borrowCount > 0 
          ? Math.round((item.damageCount / item.borrowCount) * 100) 
          : 0
      }))
      .sort((a, b) => b.borrowCount - a.borrowCount)
      .slice(0, 10); // Top 10 items
    
    // Recent transactions with better formatting and date information
    const recentTransactions = await Equipment.find()
      .populate('user', 'firstName lastName')
      .sort({ createdAt: -1 })
      .limit(20)
      .then(transactions => transactions.map(tx => {
        const isReturned = tx.returnDate && tx.returnDate !== "1970-01-01T00:00:00.000Z";
        const borrowDate = new Date(tx.borrowDate || tx.createdAt);
        const returnDate = isReturned ? new Date(tx.returnDate) : null;
        
        // Calculate days kept for returned items
        let daysKept = null;
        if (isReturned && !isNaN(borrowDate) && !isNaN(returnDate)) {
          daysKept = Math.max(0, Math.floor((returnDate - borrowDate) / (1000 * 60 * 60 * 24)));
        }
        
        return {
          date: tx.createdAt,
          userName: tx.user 
            ? `${tx.user.firstName || ''} ${tx.user.lastName || ''}`.trim() || 'Unknown User'
            : 'Unknown User',
          itemName: tx.itemName || tx.name || 'Unknown Item',
          action: isReturned ? 'Returned' : 'Borrowed',
          borrowDate: borrowDate,
          returnDate: returnDate,
          daysKept: daysKept,
          notes: tx.notes || (isReturned ? 'Item returned' : 'Item borrowed')
        };
      }));
    
    // Return complete report data with correct structure
    res.json({
      equipmentStats,
      topBorrowers,
      mostBorrowedItems,
      recentTransactions,
      reportPeriod: {
        reportType,
        startDate: dateRange.startDate,
        endDate: dateRange.endDate
      }
    });
  } catch (error) {
    console.error('Error generating equipment audit report:', error);
    res.status(500).json({ 
      message: 'Error generating audit report', 
      error: error.message 
    });
  }
};

// Helper function to calculate return rate
function calculateReturnRate(equipments) {
  const returnedEquipments = equipments.filter(eq => 
    eq.returnDate && eq.returnDate !== "1970-01-01T00:00:00.000Z"
  );
  
  if (returnedEquipments.length === 0) return 0;
  
  const returnedOnTime = returnedEquipments.filter(eq => {
    const returnDate = new Date(eq.returnDate);
    const dueDate = new Date(eq.dueDate);
    return returnDate <= dueDate;
  });
  
  return Math.round((returnedOnTime.length / returnedEquipments.length) * 100);
}

// Helper function to calculate date range (same as in vehicleController)
function getDateRangeFromReportType(reportType, startDateStr, endDateStr) {
  const now = new Date();
  let startDate, endDate;
  
  if (startDateStr && endDateStr) {
    // Custom date range
    startDate = new Date(startDateStr);
    endDate = new Date(endDateStr);
    endDate.setHours(23, 59, 59, 999); // Set to end of day
  } else {
    // Calculate based on report type
    endDate = new Date(now);
    endDate.setHours(23, 59, 59, 999);
    
    switch (reportType) {
      case 'weekly':
        startDate = new Date(now);
        startDate.setDate(now.getDate() - 7);
        break;
      case 'monthly':
        startDate = new Date(now);
        startDate.setMonth(now.getMonth() - 1);
        break;
      case 'quarterly':
        startDate = new Date(now);
        startDate.setMonth(now.getMonth() - 3);
        break;
      case 'annual':
        startDate = new Date(now);
        startDate.setFullYear(now.getFullYear() - 1);
        break;
      default:
        startDate = new Date(now);
        startDate.setMonth(now.getMonth() - 1);
    }
    
    startDate.setHours(0, 0, 0, 0);
  }
  
  return { startDate, endDate };
}
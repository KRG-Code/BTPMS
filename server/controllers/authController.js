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
    const inventoryItem = await Inventory.findOne({ name });
    if (!inventoryItem || inventoryItem.quantity <= 0) {
      return res.status(400).json({ message: "Item unavailable in inventory." });
    }

    // Create a new equipment entry
    const newEquipment = new Equipment({
      name,
      borrowDate,
      returnDate,
      imageUrl,
      user: req.user.id,
    });

    // Save equipment to indicate it has been borrowed
    const savedEquipment = await newEquipment.save();

    // Decrease inventory quantity by 1
    inventoryItem.quantity -= 1;
    await inventoryItem.save();

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

    // Update return date
    equipment.returnDate = req.body.returnDate;
    const updatedEquipment = await equipment.save();

    // Increment inventory quantity by 1 after return
    const inventoryItem = await Inventory.findOne({ name: equipment.name });
    if (inventoryItem) {
      inventoryItem.quantity += 1;
      await inventoryItem.save();
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
  const { unit, tanods, startTime, endTime, patrolArea } = req.body;

  try {
    if (!unit || !tanods || !startTime || !endTime) {
      return res.status(400).json({ message: "All fields are required" });
    }
    const status = new Date(startTime) > new Date() ? 'Upcoming' : 'Ongoing';

    const schedule = new Schedule({
      unit,
      tanods,
      startTime,
      endTime,
      patrolArea,
      status,
    });
    await schedule.save();

    // Create a notification for each Tanod in the schedule
    const notifications = tanods.map(tanodId => ({
      userId: tanodId,
      message: `You have new patrol schedule!, your group is ${unit}.`,
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
  const { unit, tanods, startTime, endTime, patrolArea } = req.body;

  try {
    const schedule = await Schedule.findById(req.params.scheduleId);
    if (!schedule) {
      return res.status(404).json({ message: "Schedule not found" });
    }

    // Update schedule fields
    schedule.unit = unit || schedule.unit;
    schedule.tanods = tanods || schedule.tanods;
    schedule.startTime = startTime || schedule.startTime;
    schedule.endTime = endTime || schedule.endTime;
    schedule.patrolArea = patrolArea || schedule.patrolArea;
    schedule.status = new Date(startTime) > new Date() ? 'Upcoming' : 'Ongoing';

    await schedule.save();

    const notifications = tanods.map(tanodId => ({
      userId: tanodId,
      message: `Your patrol schedule has been updated!`,
    }));
    await Notification.insertMany(notifications);

    res
      .status(200)
      .json({ message: "Schedule updated successfully", schedule });
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
    // Populate additional fields like profilePicture and contactNumber
    const schedule = await Schedule.findById(id).populate(
      "tanods",
      "firstName lastName profilePicture contactNumber"
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
      return res
        .status(404)
        .json({ message: "No schedules found for this Tanod." });
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

    await schedule.save();

    // Emit the update through WebSocket
    const io = require('../websocket').getIO();
    io.to('schedules').emit('scheduleUpdate', {
      type: 'update',
      schedule
    });

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
    
    const totalResponses = incidents.length;
    const resolvedIncidents = incidents.filter(i => i.status === 'Resolved').length;
    
    // Calculate response rate - properly calculate based on resolved/total
    const responseRate = totalResponses > 0 ? 
        ((resolvedIncidents / totalResponses) * 100).toFixed(1) : 0;

    // Calculate average response time - use createdAt instead of date field for accuracy
    const responseTimes = incidents.map(i => {
      if (i.respondedAt && i.createdAt) {
        return Math.max(0, (new Date(i.respondedAt) - new Date(i.createdAt)) / (1000 * 60)); // in minutes
      }
      return null;
    }).filter(Boolean);

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
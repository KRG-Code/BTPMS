// authController.js
const User = require("../models/User");
const Equipment = require("../models/Equipment");
const TanodRating = require("../models/Rating");
const Schedule = require("../models/Schedule");
const Notification = require('../models/Notification');
const Inventory = require("../models/Inventory");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const { validationResult } = require("express-validator");
const { bucket } = require("../config/firebaseAdmin");
const axios = require('axios');
const fetch = require('node-fetch');

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

// Modify the existing registerUser function
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
  const errors = validationResult(req);
  if (!errors.isEmpty())
    return res.status(400).json({ errors: errors.array() });

  const {
    firstName,
    middleName,
    lastName,
    email,
    username,
    password,
    userType,
  } = req.body;

  try {
    const userExists = await User.findOne({ username });
    if (userExists)
      return res.status(400).json({ message: "Username already exists" });

    const user = await User.create({
      firstName,
      middleName,
      lastName,
      email,
      username,
      password,
      userType,
    });
    res.status(201).json({
      _id: user._id,
      firstName: user.firstName,
      middleName: user.middleName,
      email: user.email,
      lastName: user.lastName,
      username: user.username,
      token: generateToken(user._id),
    });
  } catch (error) {
    console.error("Registration Error:", error.message);
    res.status(500).json({ message: "Server error", error: error.message });
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

// Get current user profile
exports.getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select("-password");
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Update user profile
exports.updateUserProfile = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty())
    return res.status(400).json({ errors: errors.array() });

  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    Object.assign(user, req.body);
    if (req.file) user.profilePicture = req.file.filename;

    await user.save();
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
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
    });
  } catch (error) {
    console.error("Login Error:", error.message);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};


// Change Password
exports.changePassword = async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  try {
    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Current password is incorrect" });
    }

    // Set the new password directly
    user.password = newPassword; // Set new password directly

    // Save the user, which will trigger the pre-save hook
    await user.save();
    
    res.json({ message: "Password updated successfully" });
  } catch (error) {
    console.error("Change Password Error:", error.message);
    res.status(500).json({ message: "Server error", error: error.message });
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
  const { rating, comment, ratingId } = req.body; // Accept `ratingId` for editing

  if (!rating || !comment || rating < 1 || rating > 5) {
    return res.status(400).json({ message: "Invalid rating or comment" });
  }

  try {
    // If `ratingId` is provided, update the existing rating
    if (ratingId) {
      const existingRating = await TanodRating.findById(ratingId);
      if (!existingRating) {
        return res.status(404).json({ message: "Rating not found" });
      }

      existingRating.rating = rating;
      existingRating.comment = comment;
      await existingRating.save();
      return res.status(200).json({
        message: "Rating updated successfully",
        updatedRating: existingRating,
      });
    }

    // Create a new rating if `ratingId` is not provided
    const newRating = new TanodRating({
      tanodId,
      userId: req.user._id,
      rating,
      comment,
    });

    await newRating.save();
    return res
      .status(201)
      .json({ message: "Rating submitted successfully", newRating });
  } catch (error) {
    console.error("Error saving rating:", error);
    res.status(500).json({ message: "Error submitting rating" });
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

// Get Tanod ratings
exports.getTanodRatings = async (req, res) => {
  const { tanodId } = req.params;

  try {
    const ratings = await TanodRating.find({ tanodId })
      .populate("userId", "firstName lastName") // Populate userId with firstName and lastName
      .select("rating comment createdAt userId"); // Select fields

    if (!ratings.length) {
      return res
        .status(404)
        .json({ message: "No ratings found for this Tanod." });
    }

    const overallRating =
      ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length;
    const ratingCounts = [0, 0, 0, 0, 0]; // For ratings 1-5

    ratings.forEach((r) => {
      ratingCounts[r.rating - 1]++;
    });

    // Map the ratings to include userId and comment
    const commentsWithUser = ratings.map((r) => ({
      userId: r.userId._id, // Include the user's ID
      fullName: `${r.userId.firstName} ${r.userId.lastName}`, // Construct full name
      comment: r.comment, // Comment
    }));

    res.json({
      overallRating: overallRating.toFixed(1), // Round to one decimal
      ratingCounts,
      comments: commentsWithUser, // Return the structured comments
    });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ message: "Error fetching ratings", error: error.message });
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
    if (!schedule)
      return res.status(404).json({ message: "Schedule not found" });

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
  const { scheduleId } = req.params;
  const userId = req.user._id;

  try {
    const schedule = await Schedule.findById(scheduleId);
    if (!schedule) {
      return res.status(404).json({ message: "Schedule not found" });
    }

    const memberStatus = schedule.patrolStatus.find(status => status.tanodId.toString() === userId.toString());
    if (memberStatus) {
      memberStatus.status = 'Completed';
      memberStatus.endTime = new Date();
    }

    // Check if all members have ended the patrol
    const allMembersEnded = schedule.patrolStatus.every(status => status.status === 'Completed' || status.status === 'Absent');

    if (allMembersEnded) {
      schedule.status = 'Completed';
    }

    await schedule.save();

    res.status(200).json({ message: "Patrol ended", schedule });
  } catch (error) {
    console.error("Error ending patrol:", error.message);
    res.status(500).json({ message: "Server error", error: error.message });
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
      });
    });

    await schedule.save();
    res.status(200).json({ message: 'Patrol logs saved successfully' });
  } catch (error) {
    console.error('Error saving patrol logs:', error);
    res.status(500).json({ message: 'Failed to save patrol logs' });
  }
};

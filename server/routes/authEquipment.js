const express = require('express');
const mongoose = require('mongoose');
const { protect } = require('../middleware/authMiddleware');
const equipmentController = require('../controllers/authController');
const router = express.Router();
const Equipment = require("../models/Equipment")

// Routes
router.post('/', protect, equipmentController.addEquipment);
router.get('/', protect, equipmentController.getEquipments);
router.get('/user/:userId/equipments', protect, async (req, res) => {
    const { userId } = req.params;
    
    try {
      // Check if userId is valid
      const isValidUser = mongoose.Types.ObjectId.isValid(userId);
      if (!isValidUser) {
        return res.status(400).json({ message: 'Invalid userId' });
      }
      
      // Fetch the equipment for the user
      const equipments = await Equipment.find({ user: userId });
  
      // Handle no equipment found
      if (!equipments.length) {
        return res.status(404).json({ message: 'No equipment found for this user.' });
      }
  
      res.status(200).json(equipments);
    } catch (error) {
      console.error('Error fetching equipment:', error.message);
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  });
  
router.put('/:id', protect, equipmentController.updateEquipment);


module.exports = router;

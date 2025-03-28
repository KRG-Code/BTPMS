const express = require('express');
const { protect } = require('../middleware/authMiddleware');
const FalseAlarm = require('../models/FalseAlarm');

const router = express.Router();

// Get all false alarms
router.get('/', protect, async (req, res) => {
  try {
    const falseAlarms = await FalseAlarm.find()
      .populate('markedByUser', 'firstName lastName')
      .sort({ markedAt: -1 });
    
    res.status(200).json(falseAlarms);
  } catch (error) {
    console.error('Error fetching false alarms:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get a single false alarm by ID
router.get('/:id', protect, async (req, res) => {
  try {
    const falseAlarm = await FalseAlarm.findById(req.params.id)
      .populate('markedByUser', 'firstName lastName');
    
    if (!falseAlarm) {
      return res.status(404).json({ message: 'False alarm record not found' });
    }
    
    res.status(200).json(falseAlarm);
  } catch (error) {
    console.error('Error fetching false alarm:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;

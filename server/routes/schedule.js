const express = require('express');
const router = express.Router();
const Schedule = require('../models/Schedule');
const { verifyToken } = require('../middleware/auth');

// Save patrol logs
router.post('/save-patrol-logs', verifyToken, async (req, res) => {
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
});

module.exports = router;

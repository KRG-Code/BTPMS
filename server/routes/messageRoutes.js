const express = require('express');
const { protect } = require('../middleware/authMiddleware');
const { getMessages } = require('../controllers/messageController');

const router = express.Router();

// Route to get all messages
router.get('/', protect, getMessages);

module.exports = router;

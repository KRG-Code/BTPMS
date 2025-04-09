const express = require('express');
const { protect } = require('../middleware/authMiddleware');
const { createEncryptedZip } = require('../controllers/zipController');

const router = express.Router();

// Route to create an encrypted ZIP file
router.post('/create-encrypted', protect, createEncryptedZip);

module.exports = router;

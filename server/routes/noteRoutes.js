const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { getNotes, addNote, deleteNote } = require('../controllers/noteController');

router.route('/')
  .get(protect, getNotes)
  .post(protect, addNote);

router.delete('/:noteId', protect, deleteNote);

module.exports = router;

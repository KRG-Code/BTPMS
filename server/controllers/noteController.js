const Note = require('../models/Note');

exports.getNotes = async (req, res) => {
  try {
    const userNotes = await Note.findOne({ userId: req.user._id });
    res.status(200).json(userNotes?.notes || []);
  } catch (error) {
    console.error('Error fetching notes:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.addNote = async (req, res) => {
  try {
    const { date, note: content } = req.body;
    
    const newNote = {
      content,
      date,
      createdAt: new Date()
    };

    const userNotes = await Note.findOneAndUpdate(
      { userId: req.user._id },
      { 
        $push: { notes: newNote }
      },
      { 
        new: true, 
        upsert: true,
        setDefaultsOnInsert: true
      }
    );

    res.status(201).json(userNotes.notes);
  } catch (error) {
    console.error('Error adding note:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.deleteNote = async (req, res) => {
  try {
    const { noteId } = req.params;
    
    const result = await Note.findOneAndUpdate(
      { userId: req.user._id },
      { $pull: { notes: { _id: noteId } } },
      { new: true }
    );

    if (!result) {
      return res.status(404).json({ message: 'Note not found' });
    }

    res.json(result.notes);
  } catch (error) {
    console.error('Error deleting note:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

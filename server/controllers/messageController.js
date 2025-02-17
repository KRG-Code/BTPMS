const Message = require('../models/Message');

// Get all messages for a specific user
exports.getMessages = async (req, res) => {
  try {
    const messages = await Message.find({ userId: req.user._id });
    res.status(200).json({ messages });
  } catch (error) {
    console.error("Error fetching messages:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Create a new message
exports.createMessage = async (userId, content) => {
  try {
    const newMessage = new Message({
      userId,
      content,
    });
    await newMessage.save();
  } catch (error) {
    console.error("Error creating message:", error);
  }
};

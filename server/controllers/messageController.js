const Message = require('../models/Message');
const Conversation = require('../models/Conversation');
const User = require('../models/User');
const { getIO } = require('../websocket');

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

// Get all conversations for a user
exports.getConversations = async (req, res) => {
  try {
    const conversations = await Conversation.find({
      participants: req.user._id,
      deletedFor: { $ne: req.user._id } // Don't show conversations deleted by user
    }).populate('participants', 'firstName lastName profilePicture userType');
    
    res.status(200).json({ conversations });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Get messages for a specific conversation
exports.getConversationMessages = async (req, res) => {
  try {
    const messages = await Message.find({ 
      conversationId: req.params.conversationId,
      deletedFor: { $ne: req.user._id }
    })
    .populate('userId', '_id firstName lastName profilePicture userType')
    .sort('createdAt');
    
    res.status(200).json({ messages });
  } catch (error) {
    console.error("Error fetching messages:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Create a new message
exports.sendMessage = async (req, res) => {
  try {
    const { conversationId, content } = req.body;
    const newMessage = new Message({
      conversationId,
      userId: req.user._id,
      content
    });
    await newMessage.save();
    
    // Fully populate the new message
    const populatedMessage = await Message.findById(newMessage._id)
      .populate('userId', '_id firstName lastName profilePicture userType');
    
    // Update conversation's lastMessage and updatedAt
    await Conversation.findByIdAndUpdate(conversationId, {
      lastMessage: content,
      updatedAt: Date.now(),
      // Remove from deletedFor when new message is sent
      $pull: { deletedFor: req.user._id }
    });

    // Emit the new message to all clients in the conversation
    getIO().to(`conversation_${conversationId}`).emit('messageReceived', populatedMessage);

    res.status(201).json({ message: populatedMessage });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Create new conversation
exports.createConversation = async (req, res) => {
  try {
    const { participantId } = req.body;
    
    // Prevent self-messaging
    if (participantId === req.user._id.toString()) {
      return res.status(400).json({ 
        message: "You cannot start a conversation with yourself" 
      });
    }

    // Check if conversation already exists
    let existingConv = await Conversation.findOne({
      participants: { $all: [req.user._id, participantId] },
      deletedFor: { $ne: req.user._id } // Don't create new if just deleted
    });
    
    if (existingConv) {
      // Remove from deletedFor if it was previously deleted
      await Conversation.findByIdAndUpdate(existingConv._id, {
        $pull: { deletedFor: req.user._id }
      });
      
      const populatedConv = await Conversation.findById(existingConv._id)
        .populate('participants', 'firstName lastName profilePicture userType');
      return res.status(200).json({ conversation: populatedConv });
    }

    const newConversation = new Conversation({
      participants: [req.user._id, participantId],
      deletedFor: []
    });
    await newConversation.save();
    
    const populatedConv = await Conversation.findById(newConversation._id)
      .populate('participants', 'firstName lastName profilePicture userType');
    
    res.status(201).json({ conversation: populatedConv });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Add this new controller function
exports.deleteConversation = async (req, res) => {
  try {
    const { conversationId } = req.params;
    
    // Mark all messages as deleted for this user
    await Message.updateMany(
      { conversationId },
      { $addToSet: { deletedFor: req.user._id } }
    );
    
    // Mark conversation as deleted for this user
    await Conversation.findByIdAndUpdate(conversationId, {
      $addToSet: { deletedFor: req.user._id }
    });
    
    res.status(200).json({ message: "Conversation deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

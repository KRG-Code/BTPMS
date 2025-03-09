const express = require('express');
const { protect } = require('../middleware/authMiddleware');
const { 
  getMessages, 
  getConversations, 
  getConversationMessages, 
  sendMessage, 
  createConversation,
  deleteConversation,
  checkUnreadMessages,
  markMessagesAsRead
} = require('../controllers/messageController');

const router = express.Router();

// Conversation routes
router.get('/conversations', protect, getConversations);
router.post('/conversations', protect, createConversation);
router.get('/conversations/:conversationId/messages', protect, getConversationMessages);
router.delete('/conversations/:conversationId', protect, deleteConversation);

// Message routes
router.get('/', protect, getMessages);
router.post('/', protect, sendMessage);
router.get('/unread', protect, checkUnreadMessages);
router.post('/conversations/:conversationId/read', protect, markMessagesAsRead);

module.exports = router;

import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { toast, ToastContainer } from "react-toastify";
import { motion, AnimatePresence } from "framer-motion";
import { 
  RiUser3Line, 
  RiEmotionLine, 
  RiSendPlaneFill, 
  RiArrowLeftLine,
  RiAttachment2,
  RiCloseLine,
  RiCheckDoubleLine,
  RiTimeLine,
  RiInformationLine
} from "react-icons/ri";
import io from 'socket.io-client';
import RTCManager from './RTCManager';
import EmojiPicker from 'emoji-picker-react';
import { useTheme } from "../../contexts/ThemeContext";  // Fixed import path

// Animation variants
const modalVariants = {
  hidden: { opacity: 0, scale: 0.8 },
  visible: { 
    opacity: 1, 
    scale: 1,
    transition: { type: "spring", damping: 25, stiffness: 500 }
  },
  exit: { 
    opacity: 0, 
    scale: 0.8,
    transition: { duration: 0.15 } 
  }
};

const messageVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 }
};

export default function ConversationModal({ conversation, onClose, onNewMessage }) {
  const { isDarkMode } = useTheme();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const messagesEndRef = useRef(null);
  const [socket, setSocket] = useState(null);
  const [rtcManager, setRtcManager] = useState(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const messageInputRef = useRef(null);
  const [typing, setTyping] = useState(false);
  const [typingTimeoutId, setTypingTimeoutId] = useState(null);
  // Add a ref for the emoji button
  const emojiButtonRef = useRef(null);
  
  // Add refresh interval reference
  const refreshIntervalRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    const checkUserId = () => {
      const userId = localStorage.getItem("userId");
      if (!userId) {
        const token = localStorage.getItem("token");
        if (token) {
          try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            if (payload.id) {
              localStorage.setItem("userId", payload.id);
            }
          } catch (error) {
            console.error("Error parsing token:", error);
          }
        }
      }
    };

    checkUserId();
    fetchMessages();
  }, [conversation._id]);

  useEffect(() => {
    const socketInstance = io(process.env.REACT_APP_API_URL, {
      auth: { token: localStorage.getItem("token") },
      transports: ['websocket', 'polling']
    });

    socketInstance.on('connect', () => {
      console.log('Socket connected');
      socketInstance.emit('joinConversation', conversation._id);
    });

    socketInstance.on('messageReceived', (newMsg) => {
      console.log('New message received:', newMsg);
      if (newMsg.conversationId === conversation._id) {
        setMessages(prevMessages => {
          const messageExists = prevMessages.some(msg => msg._id === newMsg._id);
          if (!messageExists) {
            onNewMessage();
            scrollToBottom();
            return [...prevMessages, newMsg];
          }
          return prevMessages;
        });
      }
    });

    socketInstance.on('userTyping', (data) => {
      if (data.conversationId === conversation._id && 
          data.userId !== localStorage.getItem("userId")) {
        setTyping(true);
        // Clear any existing timeout
        if (typingTimeoutId) clearTimeout(typingTimeoutId);
        // Set a new timeout
        const timeoutId = setTimeout(() => setTyping(false), 3000);
        setTypingTimeoutId(timeoutId);
      }
    });

    setSocket(socketInstance);
    fetchMessages();

    return () => {
      if (socketInstance) {
        socketInstance.off('messageReceived');
        socketInstance.off('userTyping');
        socketInstance.emit('leaveConversation', conversation._id);
        socketInstance.disconnect();
      }
      if (typingTimeoutId) {
        clearTimeout(typingTimeoutId);
      }
    };
  }, [conversation._id]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    refreshIntervalRef.current = setInterval(() => {
      fetchMessages();
    }, 500);

    return () => {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
        refreshIntervalRef.current = null;
      }
    };
  }, [conversation._id]);

  // Modify fetchMessages to avoid unnecessary UI updates
  const fetchMessages = async () => {
    if (conversation.temporary) {
      return;
    }

    try {
      const response = await axios.get(
        `${process.env.REACT_APP_API_URL}/messages/conversations/${conversation._id}/messages`,
        {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        }
      );
      
      const newMessages = response.data.messages;
      const currentMessagesIds = new Set(messages.map(m => m._id));
      const hasNewMessages = newMessages.some(msg => !currentMessagesIds.has(msg._id));
      
      if (hasNewMessages) {
        setMessages(newMessages);
        scrollToBottom();
      }
    } catch (error) {
      console.error("Error fetching messages:", error);
      if (!refreshIntervalRef.current) {
        toast.error("Error fetching messages.");
      }
    }
  };

  const handleTyping = () => {
    if (socket) {
      socket.emit('typing', {
        conversationId: conversation._id,
        userId: localStorage.getItem("userId")
      });
    }
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    const messageContent = newMessage.trim();
    setNewMessage('');

    try {
      // If this is a new conversation, create it first
      if (conversation.temporary) {
        const convResponse = await axios.post(
          `${process.env.REACT_APP_API_URL}/messages/conversations`,
          { participantId: conversation.participants[1]._id },
          { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } }
        );
        conversation._id = convResponse.data.conversation._id;
        delete conversation.temporary;
      }

      const response = await axios.post(
        `${process.env.REACT_APP_API_URL}/messages`,
        {
          conversationId: conversation._id,
          content: messageContent,
        },
        {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        }
      );

      // Add the message to the UI immediately
      setMessages(prevMessages => [...prevMessages, response.data.message]);
      if (onNewMessage) onNewMessage();
      scrollToBottom();
      
      // Focus the input after sending
      messageInputRef.current?.focus();
    } catch (error) {
      toast.error("Error sending message.");
      setNewMessage(messageContent);
    }
  };

  const isCurrentUserMessage = (message) => {
    const currentUserId = localStorage.getItem("userId");
    if (!currentUserId) return false;

    const messageUserId = (message.userId?._id || message.userId)?.toString();
    return messageUserId === currentUserId.toString();
  };

  const getOtherParticipant = () => {
    const currentUserId = localStorage.getItem("userId");
    return conversation.participants.find(
      p => p._id?.toString() !== currentUserId?.toString()
    );
  };

  const onEmojiClick = (emojiObject) => {
    setNewMessage(prevMessage => prevMessage + emojiObject.emoji);
    setShowEmojiPicker(false);
    messageInputRef.current?.focus();
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(e);
    }
  };

  // Format messages by grouping them by date
  const groupMessagesByDate = () => {
    const groups = [];
    let currentDate = '';
    let currentGroup = [];

    messages.forEach(message => {
      const messageDate = new Date(message.createdAt).toLocaleDateString();
      
      if (messageDate !== currentDate) {
        if (currentGroup.length > 0) {
          groups.push({
            date: currentDate,
            messages: currentGroup
          });
        }
        currentDate = messageDate;
        currentGroup = [message];
      } else {
        currentGroup.push(message);
      }
    });

    if (currentGroup.length > 0) {
      groups.push({
        date: currentDate,
        messages: currentGroup
      });
    }

    return groups;
  };

  const formatMessageTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatDateHeader = (dateString) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' });
    }
  };

  useEffect(() => {
    // Add this function to mark messages as read
    const markConversationAsRead = async () => {
      if (!conversation.temporary) {
        try {
          await axios.post(
            `${process.env.REACT_APP_API_URL}/messages/conversations/${conversation._id}/read`,
            {},
            { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } }
          );
          onNewMessage(); // Update conversation list to reflect read status
        } catch (error) {
          console.error("Error marking conversation as read:", error);
        }
      }
    };

    // Call it when modal opens and after receiving new messages
    markConversationAsRead();
  }, [conversation._id, messages]);

  const messageGroups = groupMessagesByDate();

  return (
    <motion.div 
      variants={modalVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex justify-center items-center z-50 p-4"
    >
      <div className={`w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col ${
        isDarkMode ? 'bg-gray-900 text-gray-100' : 'bg-white text-gray-800'
      }`}>
        {/* Header */}
        <div className={`p-4 border-b flex justify-between items-center ${
          isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'
        }`}>
          {(() => {
            const receiver = getOtherParticipant();
            return (
              <div className="flex items-center">
                <div className="relative">
                  <div className={`w-12 h-12 rounded-full overflow-hidden ${
                    isDarkMode ? 'bg-gray-700' : 'bg-gray-200'
                  } flex items-center justify-center`}>
                    {receiver?.profilePicture ? (
                      <img
                        src={receiver.profilePicture}
                        alt={`${receiver.firstName}'s profile`}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <RiUser3Line className={`w-7 h-7 ${
                        isDarkMode ? 'text-gray-400' : 'text-gray-500'
                      }`} />
                    )}
                  </div>
                  {receiver?.isOnline && (
                    <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></span>
                  )}
                </div>
                <div className="ml-3">
                  <h3 className="font-bold text-lg">
                    {receiver?.firstName} {receiver?.lastName}
                  </h3>
                  <p className={`text-xs capitalize ${
                    isDarkMode ? 'text-gray-400' : 'text-gray-600'
                  }`}>
                    {receiver?.isOnline ? 'Online' : receiver?.lastActive 
                      ? `Last seen ${new Date(receiver.lastActive).toLocaleString()}`
                      : receiver?.userType || 'User'}
                  </p>
                </div>
              </div>
            );
          })()}
          <div className="flex items-center gap-2">
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={onClose}
              className={`p-2 rounded-full ${
                isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-200'
              }`}
            >
              <RiCloseLine size={24} className={isDarkMode ? 'text-gray-300' : 'text-gray-600'} />
            </motion.button>
          </div>
        </div>

        {/* Messages */}
        <div className={`flex-1 overflow-y-auto p-4 ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
          {messageGroups.length > 0 ? (
            messageGroups.map((group, groupIndex) => (
              <div key={group.date} className="mb-6">
                <div className="flex justify-center mb-4">
                  <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                    isDarkMode ? 'bg-gray-800 text-gray-300' : 'bg-gray-200 text-gray-700'
                  }`}>
                    {formatDateHeader(group.date)}
                  </div>
                </div>
                
                <div className="space-y-3">
                  {group.messages.map((message, index) => {
                    const isSender = isCurrentUserMessage(message);
                    const showAvatar = index === 0 || 
                      isCurrentUserMessage(group.messages[index - 1]) !== isSender;
                                        
                    return (
                      <motion.div
                        key={message._id}
                        variants={messageVariants}
                        initial="hidden"
                        animate="visible"
                        className={`flex items-end gap-2 ${isSender ? 'justify-end' : 'justify-start'}`}
                      >
                        {!isSender && showAvatar ? (
                          <div className={`w-8 h-8 rounded-full overflow-hidden ${
                            isDarkMode ? 'bg-gray-700' : 'bg-gray-200'
                          } flex items-center justify-center flex-shrink-0`}>
                            {getOtherParticipant()?.profilePicture ? (
                              <img
                                src={getOtherParticipant().profilePicture}
                                alt="Avatar"
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <RiUser3Line className={isDarkMode ? 'text-gray-500' : 'text-gray-400'} />
                            )}
                          </div>
                        ) : !isSender && (
                          <div className="w-8 flex-shrink-0"></div>
                        )}
                        
                        <div className={`${
                          isSender
                            ? isDarkMode 
                              ? 'bg-blue-700 text-white' 
                              : 'bg-blue-600 text-white'
                            : isDarkMode 
                              ? 'bg-gray-800 text-gray-200' 
                              : 'bg-gray-200 text-gray-800'
                        } px-4 py-2.5 rounded-2xl max-w-[75%] ${
                          isSender 
                            ? 'rounded-br-sm' 
                            : 'rounded-bl-sm'
                        }`}>
                          <div className="break-words">{message.content}</div>
                          <div className={`text-xs mt-1 flex items-center justify-end ${
                            isSender 
                              ? isDarkMode ? 'text-blue-200' : 'text-blue-100' 
                              : isDarkMode ? 'text-gray-400' : 'text-gray-500'
                          }`}>
                            {formatMessageTime(message.createdAt)}
                            {isSender && (
                              <span className="ml-1">
                                {message.read 
                                  ? <RiCheckDoubleLine className="text-xs" /> 
                                  : <RiTimeLine className="text-xs" />}
                              </span>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            ))
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center p-4">
              <div className={`w-16 h-16 mb-4 rounded-full flex items-center justify-center ${
                isDarkMode ? 'bg-gray-800' : 'bg-blue-50'
              }`}>
                <RiInformationLine size={28} className={isDarkMode ? 'text-blue-400' : 'text-blue-500'} />
              </div>
              <h4 className="text-lg font-medium mb-2">No messages yet</h4>
              <p className={`text-sm max-w-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                Send a message to start the conversation with {getOtherParticipant()?.firstName}
              </p>
            </div>
          )}
          
          {/* Typing indicator */}
          <AnimatePresence>
            {typing && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="flex items-center mt-2 ml-10"
              >
                <div className={`${isDarkMode ? 'bg-gray-800' : 'bg-gray-200'} px-4 py-2 rounded-xl`}>
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 rounded-full bg-gray-500 animate-bounce" style={{ animationDelay: '0ms' }}></div>
                    <div className="w-2 h-2 rounded-full bg-gray-500 animate-bounce" style={{ animationDelay: '150ms' }}></div>
                    <div className="w-2 h-2 rounded-full bg-gray-500 animate-bounce" style={{ animationDelay: '300ms' }}></div>
                  </div>
                </div>
                <div className={`text-xs ml-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  {getOtherParticipant()?.firstName} is typing...
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          
          <div ref={messagesEndRef} />
        </div>

        {/* Message Form */}
        <form onSubmit={sendMessage} className={`px-4 py-3 border-t ${
          isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
        }`}>
          <div className="flex items-center gap-3">
            {/* Emoji button with ref */}
            <motion.button
              ref={emojiButtonRef} // Add ref here
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              type="button"
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              className={`p-2 rounded-full flex-shrink-0 ${
                isDarkMode 
                  ? 'text-gray-300 hover:bg-gray-700' 
                  : 'text-gray-500 hover:bg-gray-100'
              }`}
            >
              <RiEmotionLine size={24} />
            </motion.button>

            {/* Message input */}
            <div className="relative flex-grow">
              <input
                ref={messageInputRef}
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyDown={handleKeyPress}
                onKeyUp={handleTyping}
                placeholder="Type a message..."
                className={`w-full pl-4 pr-10 py-3 rounded-full border ${
                  isDarkMode 
                    ? 'bg-gray-700 border-gray-600 text-white placeholder:text-gray-400' 
                    : 'bg-white border-gray-300 text-black placeholder:text-gray-500'
                } focus:outline-none focus:ring-2 focus:ring-blue-500`}
              />
            </div>
            
            {/* Send button */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              type="submit"
              className={`p-3 rounded-full flex-shrink-0 ${
                newMessage.trim() 
                  ? isDarkMode 
                    ? 'bg-blue-600 text-white hover:bg-blue-700' 
                    : 'bg-blue-500 text-white hover:bg-blue-600'
                  : isDarkMode
                    ? 'bg-gray-700 text-gray-400' 
                    : 'bg-gray-200 text-gray-400'
              }`}
              disabled={!newMessage.trim()}
            >
              <RiSendPlaneFill size={20} />
            </motion.button>
          </div>

          {/* Emoji picker - improved positioning */}
          <AnimatePresence>
            {showEmojiPicker && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                className="absolute z-20"
                style={{
                  bottom: '80px', // Position above the message form
                  left: '20px', // Align with the emoji button
                  maxWidth: 'calc(100vw - 40px)' // Prevent overflow
                }}
              >
                <div className="shadow-xl rounded-lg bg-opacity-100">
                  <EmojiPicker
                    onEmojiClick={onEmojiClick}
                    width={320}
                    height={400}
                    searchDisabled={false}
                    skinTonesDisabled={true}
                    previewConfig={{ showPreview: false }}
                    theme={isDarkMode ? "dark" : "light"}
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </form>
      </div>

      {/* Add ToastContainer with high z-index to ensure visibility */}
      <ToastContainer 
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop={true}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme={isDarkMode ? "dark" : "light"} 
        style={{ zIndex: 9999 }}
      />
    </motion.div>
  );
}

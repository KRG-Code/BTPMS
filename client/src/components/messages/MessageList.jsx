import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { toast, ToastContainer } from "react-toastify"; // Add ToastContainer
import { motion, AnimatePresence } from "framer-motion";
import { 
  RiUser3Line, 
  RiSearchLine, 
  RiChat3Line, 
  RiDeleteBin6Line, 
  RiCheckDoubleLine,
  RiEyeLine,
  RiArrowLeftLine,
  RiCloseLine,
  RiAddLine
} from "react-icons/ri";
import ConversationModal from "./ConversationModal";
import { io } from "socket.io-client";
import { useTheme } from "../../contexts/ThemeContext";  // Fixed import path

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.07 } }
};

const itemVariants = {
  hidden: { opacity: 0, x: -20 },
  visible: { opacity: 1, x: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
};

const listVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { duration: 0.3 } 
  }
};

export default function MessageList({ onClose, onConversationClick }) { // Accept onConversationClick prop
  const { isDarkMode } = useTheme();
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tanods, setTanods] = useState([]);
  const [showTanodList, setShowTanodList] = useState(false);
  const refreshIntervalRef = useRef(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [messageSearchTerm, setMessageSearchTerm] = useState(""); // Add state for message search
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    fetchConversations();
    
    const socket = io(process.env.REACT_APP_API_URL, {
      auth: { token: localStorage.getItem("token") }
    });

    socket.on('messageReceived', (newMsg) => {
      setConversations(prevConvs => {
        return prevConvs.map(conv => {
          if (conv._id === newMsg.conversationId) {
            return {
              ...conv,
              lastMessage: newMsg.content,
              updatedAt: new Date().toISOString()
            };
          }
          return conv;
        }).sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
      });
    });

    return () => {
      if (socket) socket.disconnect();
    };
  }, []);

  useEffect(() => {
    refreshIntervalRef.current = setInterval(() => {
      fetchConversations();
    }, 500);

    return () => {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }
    };
  }, []);

  const fetchConversations = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      toast.error("Please log in to view messages.");
      return;
    }

    try {
      const response = await axios.get(`${process.env.REACT_APP_API_URL}/messages/conversations`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setConversations(prev => {
        const hasChanges = JSON.stringify(prev) !== JSON.stringify(response.data.conversations);
        return hasChanges ? response.data.conversations : prev;
      });
      setLoading(false);
    } catch (error) {
      console.error("Error fetching conversations:", error);
      if (!refreshIntervalRef.current) {
        toast.error("Error fetching conversations.");
      }
    }
  };

  const handleStartNewChat = async () => {
    try {
      const response = await axios.get(`${process.env.REACT_APP_API_URL}/auth/users`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      const currentUserId = localStorage.getItem("userId");
      const currentUserType = localStorage.getItem("userType");
      
      const availableUsers = response.data.filter(user => {
        if (user._id === currentUserId) return false;
        if (currentUserType === 'admin') return user.userType === 'tanod';
        if (currentUserType === 'tanod') return user.userType === 'tanod'|| user.userType === 'admin';
        return false;
      });
      
      setTanods(availableUsers);
      setShowTanodList(true);
    } catch (error) {
      toast.error("Error fetching users.");
    }
  };

  const startConversation = async (tanodId) => {
    try {
      const selectedUser = tanods.find(user => user._id === tanodId);
      if (selectedUser) {
        setShowTanodList(false);
        // Create temporary conversation and pass to parent via callback
        const tempConversation = {
          _id: 'temp_' + Date.now(),
          participants: [
            { _id: localStorage.getItem("userId") },
            selectedUser
          ],
          lastMessage: '',
          temporary: true
        };
        // Use the callback to handle the conversation in TopNav
        onConversationClick(tempConversation);
        onClose(); // Close the message list
      }
    } catch (error) {
      toast.error("Error starting conversation.");
    }
  };

  const deleteConversation = async (conversationId, e) => {
    e.stopPropagation();
    e.preventDefault();
    
    toast.info(
      <div className="text-center" onClick={e => e.stopPropagation()}>
        <p className="mb-3">Delete this conversation?</p>
        <div className="flex justify-center gap-3">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              performDelete(conversationId);
              toast.dismiss();
            }}
            className={`px-3 py-1.5 rounded-md ${
              isDarkMode ? 'bg-red-600 text-white' : 'bg-red-500 text-white'
            } transition-colors`}
          >
            Delete
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              toast.dismiss();
            }}
            className={`px-3 py-1.5 rounded-md ${
              isDarkMode ? 'bg-gray-700 text-gray-200' : 'bg-gray-200 text-gray-800'
            } transition-colors`}
          >
            Cancel
          </motion.button>
        </div>
      </div>,
      {
        autoClose: false,
        closeButton: false,
        closeOnClick: false,
        draggable: false,
        onClick: (e) => {
          e.stopPropagation();
          e.preventDefault();
        }
      }
    );
  };

  const performDelete = async (conversationId) => {
    try {
      await axios.delete(
        `${process.env.REACT_APP_API_URL}/messages/conversations/${conversationId}`,
        { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } }
      );
      toast.success("Conversation deleted successfully");
      fetchConversations();
    } catch (error) {
      toast.error("Error deleting conversation");
    }
  };

  const markConversationAsRead = async (conversationId) => {
    try {
      await axios.post(
        `${process.env.REACT_APP_API_URL}/messages/conversations/${conversationId}/read`,
        {},
        { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } }
      );
      setConversations(prevConvs => 
        prevConvs.map(conv => 
          conv._id === conversationId ? { ...conv, read: true } : conv
        )
      );
    } catch (error) {
      console.error("Error marking conversation as read:", error);
    }
  };

  const filteredTanods = tanods.filter(user => 
    user.firstName.toLowerCase().includes(searchTerm.toLowerCase()) || 
    user.lastName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Add filtering for conversations
  const filteredConversations = conversations.filter(conv => {
    const otherParticipant = conv.participants.find(p => p._id !== localStorage.getItem("userId"));
    const participantName = `${otherParticipant?.firstName || ''} ${otherParticipant?.lastName || ''}`.toLowerCase();
    const messageContent = (conv.lastMessage || '').toLowerCase();
    const searchLower = messageSearchTerm.toLowerCase();
    
    return participantName.includes(searchLower) || messageContent.includes(searchLower);
  });

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    if (date.toDateString() === today.toDateString()) {
      return date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString([], {month: 'short', day: 'numeric'});
    }
  };

  // Get unread count
  const unreadCount = conversations.filter(conv => !conv.read).length;

  return (
    <>
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        className={`rounded-xl shadow-xl overflow-hidden ${
          isDarkMode ? 'bg-gray-900 text-gray-100' : 'bg-white text-gray-800'
        }`}
        style={{ 
          width: isMobile ? '100%' : '320px',
          maxHeight: isMobile ? '80vh' : '60vh'
        }}
      >
        {/* Header */}
        <div className={`p-4 border-b flex justify-between items-center ${
          isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'
        }`}>
          <h2 className="font-bold text-lg flex items-center">
            <RiChat3Line className="mr-2" />
            Messages
            {unreadCount > 0 && (
              <span className={`ml-2 text-xs px-2 py-0.5 rounded-full ${
                isDarkMode ? 'bg-blue-600 text-white' : 'bg-blue-100 text-blue-800'
              }`}>{unreadCount}</span>
            )}
          </h2>
          <div className="flex items-center space-x-2">
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={handleStartNewChat}
              className={`p-2 rounded-full ${
                isDarkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300'
              } transition-colors`}
              title="New Message"
            >
              <RiAddLine size={20} />
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={onClose}
              className={`p-2 rounded-full ${
                isDarkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300'
              } transition-colors`}
              title="Close"
            >
              <RiCloseLine size={20} />
            </motion.button>
          </div>
        </div>

        {/* Content area */}
        <div className={`overflow-y-auto ${isMobile ? 'max-h-[70vh]' : 'max-h-[60vh]'}`}>
          {showTanodList ? (
            <motion.div 
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="p-4"
            >
              {/* Search and back button */}
              <div className="flex items-center gap-2 mb-4">
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setShowTanodList(false)}
                  className={`p-2 rounded-full ${
                    isDarkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300'
                  } flex-shrink-0`}
                >
                  <RiArrowLeftLine />
                </motion.button>
                
                <div className={`relative flex-grow ${
                  isDarkMode ? 'text-white' : 'text-black'
                }`}>
                  <RiSearchLine className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" />
                  <input
                    type="text"
                    placeholder="Search users..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className={`w-full py-2 pl-10 pr-4 rounded-lg border ${
                      isDarkMode 
                        ? 'bg-gray-800 border-gray-700 text-white placeholder:text-gray-400' 
                        : 'bg-white border-gray-300 text-black placeholder:text-gray-500'
                    } focus:outline-none focus:ring-2 ${
                      isDarkMode ? 'focus:ring-blue-500' : 'focus:ring-blue-500'
                    }`}
                  />
                </div>
              </div>
              
              {/* User selection list */}
              <h3 className={`font-medium mb-3 ${
                isDarkMode ? 'text-gray-300' : 'text-gray-700'
              }`}>Select a Recipient</h3>
              
              <motion.ul 
                variants={listVariants}
                className="space-y-2"
              >
                {filteredTanods.length > 0 ? (
                  filteredTanods.map((user) => (
                    <motion.li
                      key={user._id}
                      variants={itemVariants}
                      whileHover={{ 
                        scale: 1.02, 
                        backgroundColor: isDarkMode ? 'rgba(59, 130, 246, 0.1)' : 'rgba(59, 130, 246, 0.05)' 
                      }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => startConversation(user._id)}
                      className={`p-3 rounded-xl cursor-pointer transition-colors flex items-center ${
                        isDarkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-100'
                      }`}
                    >
                      <div className={`w-10 h-10 rounded-full overflow-hidden mr-3 ${
                        isDarkMode ? 'bg-gray-700' : 'bg-gray-200'
                      } flex-shrink-0 flex items-center justify-center`}>
                        {user.profilePicture ? (
                          <img
                            src={user.profilePicture}
                            alt={`${user.firstName}'s profile`}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <RiUser3Line className={`w-6 h-6 ${
                            isDarkMode ? 'text-gray-400' : 'text-gray-500'
                          }`} />
                        )}
                      </div>
                      <div className="flex-grow min-w-0">
                        <p className="font-medium truncate">{user.firstName} {user.lastName}</p>
                        <p className={`text-xs truncate capitalize ${
                          isDarkMode ? 'text-gray-400' : 'text-gray-500'
                        }`}>{user.userType}</p>
                      </div>
                    </motion.li>
                  ))
                ) : (
                  <div className={`text-center py-8 ${
                    isDarkMode ? 'text-gray-400' : 'text-gray-500'
                  }`}>
                    <p className="mb-1">No users found</p>
                    <p className="text-sm">Try a different search term</p>
                  </div>
                )}
              </motion.ul>
            </motion.div>
          ) : (
            <>
              {/* Add search bar for conversations */}
              <div className={`p-3 ${isDarkMode ? 'bg-gray-800' : 'bg-gray-50'}`}>
                <div className={`relative w-full ${isDarkMode ? 'text-white' : 'text-black'}`}>
                  <RiSearchLine className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" />
                  <input
                    type="text"
                    placeholder="Search conversations..."
                    value={messageSearchTerm}
                    onChange={(e) => setMessageSearchTerm(e.target.value)}
                    className={`w-full py-2 pl-10 pr-4 rounded-lg border ${
                      isDarkMode 
                        ? 'bg-gray-700 border-gray-600 text-white placeholder:text-gray-400' 
                        : 'bg-white border-gray-300 text-black placeholder:text-gray-500'
                    } focus:outline-none focus:ring-2 ${
                      isDarkMode ? 'focus:ring-blue-500' : 'focus:ring-blue-500'
                    }`}
                  />
                </div>
              </div>

              {loading ? (
                <div className="flex flex-col items-center justify-center h-40">
                  <div className={`w-8 h-8 border-4 border-t-transparent rounded-full animate-spin mb-3 ${
                    isDarkMode ? 'border-blue-500' : 'border-blue-600'
                  }`}></div>
                  <p className={isDarkMode ? 'text-gray-300' : 'text-gray-600'}>Loading messages...</p>
                </div>
              ) : conversations.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-40 text-center px-4">
                  <div className={`w-16 h-16 mb-4 rounded-full flex items-center justify-center ${
                    isDarkMode ? 'bg-gray-800' : 'bg-blue-50'
                  }`}>
                    <RiChat3Line className={`text-2xl ${
                      isDarkMode ? 'text-blue-400' : 'text-blue-500'
                    }`} />
                  </div>
                  <p className={`font-medium mb-1 ${
                    isDarkMode ? 'text-gray-200' : 'text-gray-700'
                  }`}>No conversations yet</p>
                  <p className={`text-sm ${
                    isDarkMode ? 'text-gray-400' : 'text-gray-500'
                  }`}>
                    Start a new chat by clicking the plus button above
                  </p>
                </div>
              ) : (
                <motion.ul 
                  variants={containerVariants} 
                  initial="hidden" 
                  animate="visible" 
                  className="divide-y"
                >
                  {filteredConversations.length > 0 ? (
                    filteredConversations.map((conv) => {
                      const otherParticipant = conv.participants.find(
                        p => p._id !== localStorage.getItem("userId")
                      );
                      
                      return (
                        <motion.li
                          key={conv._id}
                          variants={itemVariants}
                          onClick={() => {
                            markConversationAsRead(conv._id);
                            onConversationClick(conv);
                          }}
                          className={`cursor-pointer transition-all group ${
                            !conv.read 
                              ? isDarkMode 
                                ? 'bg-blue-900 bg-opacity-20' 
                                : 'bg-blue-50'
                              : isDarkMode 
                                ? 'hover:bg-gray-800' 
                                : 'hover:bg-gray-50'
                          }`}
                          whileHover={{ 
                            backgroundColor: isDarkMode ? 'rgba(59, 130, 246, 0.15)' : 'rgba(59, 130, 246, 0.1)'
                          }}
                        >
                          <div className="py-4 px-4 flex items-start">
                            {/* Avatar with online indicator */}
                            <div className="relative">
                              <div className={`w-12 h-12 rounded-full overflow-hidden ${
                                isDarkMode ? 'bg-gray-700' : 'bg-gray-200'
                              } flex items-center justify-center`}>
                                {otherParticipant?.profilePicture ? (
                                  <img
                                    src={otherParticipant.profilePicture}
                                    alt={`${otherParticipant.firstName}'s profile`}
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <RiUser3Line className={`w-6 h-6 ${
                                    isDarkMode ? 'text-gray-400' : 'text-gray-500'
                                  }`} />
                                )}
                              </div>
                              {otherParticipant?.isOnline && (
                                <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></span>
                              )}
                            </div>
                            
                            {/* Message content */}
                            <div className="ml-3 flex-1 min-w-0">
                              <div className="flex justify-between items-center mb-1">
                                <p className={`font-semibold truncate ${!conv.read ? 'font-bold' : ''}`}>
                                  {otherParticipant?.firstName} {otherParticipant?.lastName}
                                </p>
                                <span className={`text-xs flex-shrink-0 ${
                                  isDarkMode ? 'text-gray-400' : 'text-gray-500'
                                }`}>
                                  {formatTime(conv.updatedAt || conv.createdAt)}
                                </span>
                              </div>
                              <div className={`flex justify-between items-center ${
                                !conv.read 
                                  ? isDarkMode ? 'text-white' : 'text-gray-900'
                                  : isDarkMode ? 'text-gray-300' : 'text-gray-700'
                              }`}>
                                <p className={`text-sm truncate mr-2 ${!conv.read ? 'font-medium' : ''}`}>
                                  {conv.lastMessage ? (
                                    conv.lastMessageSender?._id === localStorage.getItem("userId")
                                      ? <span>You: {conv.lastMessage}</span>
                                      : conv.lastMessage
                                  ) : (
                                    <span className={isDarkMode ? 'text-gray-500' : 'text-gray-400'}>
                                      No messages yet
                                    </span>
                                  )}
                                </p>
                                <div className="flex items-center space-x-2">
                                  {!conv.read && (
                                    <span className={`w-2 h-2 rounded-full flex-shrink-0 ${
                                      isDarkMode ? 'bg-blue-400' : 'bg-blue-600'
                                    }`}></span>
                                  )}
                                  <button
                                    onClick={(e) => deleteConversation(conv._id, e)}
                                    className={`p-1 rounded-full hover:bg-opacity-20 transition-opacity ${
                                      isDarkMode ? 'hover:bg-gray-700 text-gray-400 hover:text-red-400' : 'hover:bg-gray-200 text-gray-500 hover:text-red-600'
                                    } opacity-0 group-hover:opacity-100`}
                                    aria-label="Delete conversation"
                                  >
                                    <RiDeleteBin6Line size={16} />
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>
                        </motion.li>
                      );
                    })
                  ) : (
                    <div className="py-10 text-center">
                      <p className={isDarkMode ? 'text-gray-400' : 'text-gray-500'}>No conversations match your search</p>
                    </div>
                  )}
                </motion.ul>
              )}
            </>
          )}
        </div>
      </motion.div>
      
      {/* Add ToastContainer for notifications */}
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
        style={{ zIndex: 9999 }} // Ensure it's above other elements
      />
    </>
  );
}

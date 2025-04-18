import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { toast, ToastContainer } from "react-toastify";
import { motion, AnimatePresence } from "framer-motion";
import { 
  RiDeleteBin6Line,
  RiNotification3Line,
  RiCheckLine,
  RiCloseLine,
  RiSearchLine,
  RiErrorWarningLine,
  RiInformationLine,
  RiAlarmWarningLine,
  RiCalendarCheckLine,
  RiCheckboxCircleLine,
  RiSettings4Line,
  RiFilter2Line,
  RiCheckboxMultipleLine,
  RiArrowUpLine,
  RiArrowDownLine
} from "react-icons/ri";
import { useTheme } from "../../contexts/ThemeContext";

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: { 
    opacity: 1,
    transition: { staggerChildren: 0.05 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, x: -20 },
  visible: { opacity: 1, x: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
};

const buttonVariants = {
  hover: { scale: 1.05 },
  tap: { scale: 0.95 }
};

export default function NotificationList({ onClose }) {
  const { isDarkMode } = useTheme();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedNotifications, setSelectedNotifications] = useState([]);
  const [showSelectOptions, setShowSelectOptions] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const dropdownRef = useRef(null);
  const holdTimeoutRef = useRef(null);
  const [activeCategory, setActiveCategory] = useState("all");
  const [unreadCount, setUnreadCount] = useState(0);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [sortOrder, setSortOrder] = useState('desc'); // 'desc' for newest first, 'asc' for oldest first
  const [showFilters, setShowFilters] = useState(true); // State to toggle filter visibility

  useEffect(() => {
    fetchNotifications();
    
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        onClose();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      clearTimeout(holdTimeoutRef.current);
    };
  }, [onClose]);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const fetchNotifications = async () => {
    const token = localStorage.getItem("token");

    if (!token) {
      toast.error("Please log in to view notifications.");
      return;
    }

    try {
      const response = await axios.get(`${process.env.REACT_APP_API_URL}/notifications`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setNotifications(response.data.notifications);
      setUnreadCount(response.data.notifications.filter(n => !n.read).length);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching notifications:", error);
      toast.error("Error fetching notifications.");
    }
  };

  const markAllAsRead = async () => {
    const token = localStorage.getItem("token");
    try {
      await axios.post(
        `${process.env.REACT_APP_API_URL}/notifications/mark-read`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setNotifications(notifications.map(notification => ({ ...notification, read: true })));
      setUnreadCount(0);
      toast.success("All notifications marked as read");
    } catch (error) {
      console.error("Error marking notifications as read:", error);
      toast.error("Error marking notifications as read");
    }
  };

  const deleteNotification = async (notificationId) => {
    const token = localStorage.getItem("token");
    try {
      await axios.delete(`${process.env.REACT_APP_API_URL}/notifications/${notificationId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setNotifications(notifications.filter(notification => notification._id !== notificationId));
      setSelectedNotifications(selectedNotifications.filter(id => id !== notificationId));
      toast.success("Notification deleted successfully");
    } catch (error) {
      console.error("Error deleting notification:", error);
      toast.error("Error deleting notification");
    }
  };

  const performDeleteNotification = async (notificationId) => {
    const token = localStorage.getItem("token");
    try {
      await axios.delete(`${process.env.REACT_APP_API_URL}/notifications/${notificationId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setNotifications(notifications.filter(notification => notification._id !== notificationId));
      setSelectedNotifications(selectedNotifications.filter(id => id !== notificationId));
      toast.success("Notification deleted successfully");
    } catch (error) {
      console.error("Error deleting notification:", error);
      toast.error("Error deleting notification");
    }
  };

  const confirmDeleteNotification = (notificationId, e) => {
    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }
    
    // Create a local ID to track this specific toast
    const toastId = toast.info(
      // Use a div with onMouseDown instead of onClick for more reliable event handling
      <div 
        className="flex flex-col" 
        onMouseDown={e => e.stopPropagation()}
        onClick={e => {
          e.stopPropagation();
          e.preventDefault();
        }}
      >
        <p className="mb-3 text-center">Delete this notification?</p>
        <div className="flex justify-center space-x-3">
          <motion.button
            variants={buttonVariants}
            whileHover="hover"
            whileTap="tap"
            onMouseDown={(e) => {
              e.stopPropagation();
              e.preventDefault();
              // Instead of doing the deletion directly, schedule it after closing the toast
              const doDelete = async () => {
                await performDeleteNotification(notificationId);
              };
              toast.dismiss(toastId);
              setTimeout(doDelete, 100);
            }}
            className={`px-3 py-1.5 rounded-md ${
              isDarkMode ? 'bg-red-600 text-white' : 'bg-red-500 text-white'
            }`}
          >
            Delete
          </motion.button>
          <motion.button
            variants={buttonVariants}
            whileHover="hover"
            whileTap="tap"
            onMouseDown={(e) => {
              e.stopPropagation();
              e.preventDefault();
              toast.dismiss(toastId);
            }}
            className={`px-3 py-1.5 rounded-md ${
              isDarkMode ? 'bg-gray-700 text-gray-200' : 'bg-gray-200 text-gray-800'
            }`}
          >
            Cancel
          </motion.button>
        </div>
      </div>,
      { 
        toastId: `delete-notification-${notificationId}`, // Use unique ID
        autoClose: false,
        closeButton: false,
        closeOnClick: false,
        draggable: false,
        onClick: (e) => {
          e.stopPropagation();
          e.preventDefault();
          return false; // Prevent default and stop propagation
        }
      }
    );
  };

  const deleteSelectedNotifications = async () => {
    if (selectedNotifications.length === 0) {
      toast.error("No notifications selected to delete.");
      return;
    }

    const token = localStorage.getItem("token");
    try {
      await Promise.all(selectedNotifications.map(notificationId =>
        axios.delete(`${process.env.REACT_APP_API_URL}/notifications/${notificationId}`, {
          headers: { Authorization: `Bearer ${token}` },
        })
      ));
      setNotifications(notifications.filter(notification => !selectedNotifications.includes(notification._id)));
      setSelectedNotifications([]);
      toast.success("Selected notifications deleted successfully");
    } catch (error) {
      console.error("Error deleting selected notifications:", error);
      toast.error("Error deleting selected notifications");
    }
  };

  const confirmDeleteSelectedNotifications = () => {
    if (selectedNotifications.length === 0) {
      toast.error("No notifications selected to delete.");
      return;
    }

    const toastId = toast.info(
      <div 
        className="flex flex-col" 
        onMouseDown={e => e.stopPropagation()}
        onClick={e => {
          e.stopPropagation();
          e.preventDefault();
        }}
      >
        <p className="mb-3 text-center">Delete {selectedNotifications.length} notifications?</p>
        <div className="flex justify-center space-x-3">
          <motion.button
            variants={buttonVariants}
            whileHover="hover"
            whileTap="tap"
            onMouseDown={(e) => {
              e.stopPropagation();
              e.preventDefault();
              toast.dismiss(toastId);
              setTimeout(deleteSelectedNotifications, 100);
            }}
            className={`px-3 py-1.5 rounded-md ${
              isDarkMode ? 'bg-red-600 text-white' : 'bg-red-500 text-white'
            }`}
          >
            Delete All
          </motion.button>
          <motion.button
            variants={buttonVariants}
            whileHover="hover"
            whileTap="tap"
            onMouseDown={(e) => {
              e.stopPropagation();
              e.preventDefault();
              toast.dismiss(toastId);
            }}
            className={`px-3 py-1.5 rounded-md ${
              isDarkMode ? 'bg-gray-700 text-gray-200' : 'bg-gray-200 text-gray-800'
            }`}
          >
            Cancel
          </motion.button>
        </div>
      </div>,
      { 
        toastId: 'delete-selected-notifications',
        autoClose: false,
        closeButton: false,
        closeOnClick: false,
        draggable: false,
        onClick: (e) => {
          e.stopPropagation();
          e.preventDefault();
          return false;
        }
      }
    );
  };

  const toggleSelectNotification = (notificationId, e) => {
    e?.stopPropagation();
    
    setSelectedNotifications(prevSelected =>
      prevSelected.includes(notificationId)
        ? prevSelected.filter(id => id !== notificationId)
        : [...prevSelected, notificationId]
    );
  };

  const handleNotificationHold = (notificationId) => {
    holdTimeoutRef.current = setTimeout(() => {
      setShowSelectOptions(true);
      toggleSelectNotification(notificationId);
    }, 800);
  };

  const handleNotificationRelease = () => {
    clearTimeout(holdTimeoutRef.current);
  };

  const handleNotificationClick = (notificationId) => {
    if (showSelectOptions) {
      toggleSelectNotification(notificationId);
    } else {
      // Update the notification status to read
      const token = localStorage.getItem("token");
      axios.post(
        `${process.env.REACT_APP_API_URL}/notifications/${notificationId}/read`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      ).then(() => {
        setNotifications(notifications.map(notification =>
          notification._id === notificationId ? { ...notification, read: true } : notification
        ));
        setUnreadCount(prev => Math.max(0, prev - 1));
      }).catch(error => {
        console.error("Error marking notification as read:", error);
      });
    }
  };

  const selectAllNotifications = () => {
    const filtered = getFilteredNotifications();
    setSelectedNotifications(filtered.map(notification => notification._id));
  };
  
  const categorizeNotification = (message) => {
    const lowerMessage = message.toLowerCase();
    // Check for assistance first since it's more specific
    if (lowerMessage.includes("assistance") || lowerMessage.includes("help")) {
      return "assistance";
    } else if (lowerMessage.includes("incident") || lowerMessage.includes("emergency")) {
      return "incidents";
    } else if (lowerMessage.includes("schedule") || lowerMessage.includes("patrol")) {
      return "schedules";
    } else if (lowerMessage.includes("equipment") || lowerMessage.includes("borrow")) {
      return "equipment";
    }
    return "general";
  };
  
  const getNotificationIcon = (category) => {
    switch (category) {
      case "incidents":
        return <RiAlarmWarningLine className={`w-5 h-5 ${isDarkMode ? 'text-red-400' : 'text-red-500'}`} />;
      case "schedules":
        return <RiCalendarCheckLine className={`w-5 h-5 ${isDarkMode ? 'text-green-400' : 'text-green-500'}`} />;
      case "equipment":
        return <RiInformationLine className={`w-5 h-5 ${isDarkMode ? 'text-blue-400' : 'text-blue-500'}`} />;
      case "assistance":
        return <RiErrorWarningLine className={`w-5 h-5 ${isDarkMode ? 'text-yellow-400' : 'text-yellow-500'}`} />;
      default:
        return <RiCheckboxCircleLine className={`w-5 h-5 ${isDarkMode ? 'text-indigo-400' : 'text-indigo-500'}`} />;
    }
  };

  const getFilteredNotifications = () => {
    return notifications
      .filter(notification => {
        // Filter by search term
        const matchesSearch = notification.message.toLowerCase().includes(searchTerm.toLowerCase());
        
        // Filter by category
        const notificationCategory = categorizeNotification(notification.message);
        const matchesCategory = activeCategory === "all" || notificationCategory === activeCategory;
        
        return matchesSearch && matchesCategory;
      })
      .sort((a, b) => {
        // Sort by createdAt based on sortOrder
        if (sortOrder === 'desc') {
          return new Date(b.createdAt) - new Date(a.createdAt); // Newest first
        } else {
          return new Date(a.createdAt) - new Date(b.createdAt); // Oldest first
        }
      });
  };

  const toggleSortOrder = () => {
    setSortOrder(prevOrder => prevOrder === 'desc' ? 'asc' : 'desc');
  };

  const toggleFilters = () => {
    setShowFilters(prev => !prev);
  };

  const formatTimeAgo = (timestamp) => {
    const now = new Date();
    const date = new Date(timestamp);
    const diffInSeconds = Math.floor((now - date) / 1000);
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    const diffInHours = Math.floor(diffInMinutes / 60);
    const diffInDays = Math.floor(diffInHours / 24);

    if (diffInSeconds < 60) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInHours < 24) return `${diffInHours}h ago`;
    if (diffInDays < 7) return `${diffInDays}d ago`;
    return date.toLocaleDateString();
  };

  const filteredNotifications = getFilteredNotifications();

  // Theme-aware styles
  const bgClass = isDarkMode ? 'bg-gray-900 text-gray-100' : 'bg-white text-gray-800';
  const headerClass = isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200';
  const inputClass = isDarkMode ? 'bg-gray-800 border-gray-700 text-gray-100' : 'bg-white border-gray-200 text-gray-800';

  return (
    <>
      <motion.div 
        ref={dropdownRef}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 10 }}
        className={`${bgClass} rounded-xl shadow-xl overflow-hidden`}
        style={{ 
          width: isMobile ? '100%' : '360px',
          maxHeight: isMobile ? '80vh' : 'auto'
        }}
      >
        {/* Header */}
        <div className={`px-4 py-3 ${headerClass} border-b flex items-center justify-between`}>
          <div className="flex items-center gap-2">
            <RiNotification3Line className={`${isDarkMode ? 'text-indigo-400' : 'text-indigo-500'}`} size={20} />
            <h2 className="font-bold text-lg">Notifications</h2>
            {unreadCount > 0 && (
              <span className={`ml-2 px-2 py-0.5 text-xs rounded-full ${
                isDarkMode ? 'bg-indigo-900 text-indigo-100' : 'bg-indigo-100 text-indigo-800'
              }`}>
                {unreadCount} new
              </span>
            )}
          </div>
          <div className="flex items-center space-x-1">
            {showSelectOptions ? (
              <>
                <motion.button
                  variants={buttonVariants}
                  whileHover="hover"
                  whileTap="tap"
                  onClick={selectAllNotifications}
                  className={`p-1.5 rounded-full ${isDarkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-100'}`}
                  title="Select All"
                >
                  <RiCheckboxMultipleLine size={20} className={isDarkMode ? 'text-gray-300' : 'text-gray-600'} />
                </motion.button>
                <motion.button
                  variants={buttonVariants}
                  whileHover="hover"
                  whileTap="tap"
                  onClick={confirmDeleteSelectedNotifications}
                  className={`p-1.5 rounded-full ${isDarkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-100'}`}
                  title="Delete Selected"
                >
                  <RiDeleteBin6Line size={20} className={isDarkMode ? 'text-red-400' : 'text-red-500'} />
                </motion.button>
                <motion.button
                  variants={buttonVariants}
                  whileHover="hover"
                  whileTap="tap"
                  onClick={() => {
                    setShowSelectOptions(false);
                    setSelectedNotifications([]);
                  }}
                  className={`p-1.5 rounded-full ${isDarkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-100'}`}
                  title="Cancel"
                >
                  <RiCloseLine size={20} className={isDarkMode ? 'text-gray-300' : 'text-gray-600'} />
                </motion.button>
              </>
            ) : (
              <>
                <motion.button
                  variants={buttonVariants}
                  whileHover="hover"
                  whileTap="tap"
                  onClick={markAllAsRead}
                  className={`p-1.5 rounded-full ${isDarkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-100'}`}
                  title="Mark All as Read"
                >
                  <RiCheckLine size={20} className={isDarkMode ? 'text-green-400' : 'text-green-500'} />
                </motion.button>
                <motion.button
                  variants={buttonVariants}
                  whileHover="hover"
                  whileTap="tap"
                  onClick={() => setShowSelectOptions(true)}
                  className={`p-1.5 rounded-full ${isDarkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-100'}`}
                  title="Select Multiple"
                >
                  <RiSettings4Line size={20} className={isDarkMode ? 'text-gray-300' : 'text-gray-600'} />
                </motion.button>
                <motion.button
                  variants={buttonVariants}
                  whileHover="hover"
                  whileTap="tap"
                  onClick={onClose}
                  className={`p-1.5 rounded-full ${isDarkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-100'}`}
                  title="Close"
                >
                  <RiCloseLine size={20} className={isDarkMode ? 'text-gray-300' : 'text-gray-600'} />
                </motion.button>
              </>
            )}
          </div>
        </div>

        {/* Search and Filter - removed border-b border-gray-700 */}
        <div className="px-4 py-2">
          <div className="flex items-center gap-2">
            <div className="relative flex-grow">
              <RiSearchLine className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" />
              <input
                type="text"
                placeholder="Search notifications..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={`w-full py-2 pl-10 pr-4 rounded-lg border ${inputClass} focus:outline-none focus:ring-2 focus:ring-indigo-500`}
              />
            </div>
            <motion.button
              variants={buttonVariants}
              whileHover="hover"
              whileTap="tap"
              onClick={toggleSortOrder}
              className={`p-2 rounded-full ${isDarkMode ? 'bg-gray-800 hover:bg-gray-700' : 'bg-gray-200 hover:bg-gray-300'}`}
              title={sortOrder === 'desc' ? 'Showing newest first' : 'Showing oldest first'}
            >
              {sortOrder === 'desc' ? 
                <RiArrowDownLine size={20} className={isDarkMode ? 'text-gray-300' : 'text-gray-600'} /> : 
                <RiArrowUpLine size={20} className={isDarkMode ? 'text-gray-300' : 'text-gray-600'} />
              }
            </motion.button>
            <motion.button
              variants={buttonVariants}
              whileHover="hover"
              whileTap="tap"
              onClick={toggleFilters}
              className={`p-2 rounded-full ${isDarkMode ? 'bg-gray-800 hover:bg-gray-700' : 'bg-gray-200 hover:bg-gray-300'}`}
              title="Toggle filters"
            >
              <RiFilter2Line 
                size={20} 
                className={`${isDarkMode ? 'text-gray-300' : 'text-gray-600'} ${showFilters ? 'text-indigo-500' : ''}`} 
              />
            </motion.button>
          </div>

          {/* Category tabs with animation */}
          <AnimatePresence>
            {showFilters && (
              <motion.div 
                initial={{ height: 0, opacity: 0, overflow: 'hidden' }}
                animate={{ height: 'auto', opacity: 1, overflow: 'visible' }}
                exit={{ height: 0, opacity: 0, overflow: 'hidden' }}
                transition={{ duration: 0.2 }}
                className="pt-2"
              >
                <div className="flex overflow-x-auto space-x-1 pb-1 hide-scrollbar">
                  {["all", "incidents", "schedules", "equipment", "assistance"].map(category => (
                    <motion.button
                      key={category}
                      variants={buttonVariants}
                      whileHover="hover"
                      whileTap="tap"
                      onClick={() => setActiveCategory(category)}
                      className={`px-3 py-1.5 text-sm rounded-full whitespace-nowrap ${
                        activeCategory === category
                          ? `${isDarkMode ? 'bg-indigo-900 text-indigo-100' : 'bg-indigo-100 text-indigo-800'}`
                          : `${isDarkMode ? 'bg-gray-800 text-gray-300' : 'bg-gray-200 text-gray-700'}`
                      }`}
                    >
                      {category.charAt(0).toUpperCase() + category.slice(1)}
                    </motion.button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Notifications List */}
        <div className={`overflow-y-auto ${isMobile ? 'max-h-[70vh]' : 'max-h-[60vh]'}`}>
          {loading ? (
            <div className="flex flex-col items-center justify-center h-40">
              <div className={`w-8 h-8 border-4 border-t-transparent rounded-full animate-spin mb-3 ${
                isDarkMode ? 'border-indigo-500' : 'border-indigo-600'
              }`}></div>
              <p className={isDarkMode ? 'text-gray-300' : 'text-gray-600'}>Loading notifications...</p>
            </div>
          ) : filteredNotifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 text-center px-4">
              <div className={`w-16 h-16 mb-4 rounded-full flex items-center justify-center ${
                isDarkMode ? 'bg-gray-800' : 'bg-indigo-50'
              }`}>
                <RiNotification3Line className={`text-2xl ${
                  isDarkMode ? 'text-gray-400' : 'text-indigo-500'
                }`} />
              </div>
              <p className={`font-medium mb-1 ${
                isDarkMode ? 'text-gray-200' : 'text-gray-700'
              }`}>No notifications found</p>
              <p className={`text-sm ${
                isDarkMode ? 'text-gray-400' : 'text-gray-500'
              }`}>
                {searchTerm ? 'Try a different search term' : 'You\'re all caught up!'}
              </p>
            </div>
          ) : (
            <motion.ul
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className={isDarkMode ? 'divide-y divide-gray-800' : 'divide-y divide-gray-200'}
            >
              {filteredNotifications.map((notification) => {
                const category = categorizeNotification(notification.message);
                const notificationIcon = getNotificationIcon(category);
                
                return (
                  <motion.li
                    key={notification._id}
                    variants={itemVariants}
                    onMouseDown={() => handleNotificationHold(notification._id)}
                    onMouseUp={handleNotificationRelease}
                    onMouseLeave={handleNotificationRelease}
                    onTouchStart={() => handleNotificationHold(notification._id)}
                    onTouchEnd={handleNotificationRelease}
                    onClick={() => handleNotificationClick(notification._id)}
                    className={`py-3 px-4 cursor-pointer transition-all group ${
                      selectedNotifications.includes(notification._id) 
                        ? isDarkMode ? 'bg-indigo-900 bg-opacity-20' : 'bg-indigo-50'
                        : !notification.read
                          ? isDarkMode ? 'bg-gray-800' : 'bg-gray-50'
                          : ''
                    } hover:${isDarkMode ? 'bg-gray-800' : 'bg-gray-50'}`}
                  >
                    <div className="flex items-start">
                      {/* Selection Checkbox for multi-select mode */}
                      {showSelectOptions && (
                        <div 
                          onClick={(e) => toggleSelectNotification(notification._id, e)} 
                          className="mr-2 mt-0.5"
                        >
                          <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                            selectedNotifications.includes(notification._id)
                              ? isDarkMode ? 'bg-indigo-600 border-indigo-600' : 'bg-indigo-500 border-indigo-500'
                              : isDarkMode ? 'border-gray-600' : 'border-gray-400'
                          }`}>
                            {selectedNotifications.includes(notification._id) && (
                              <RiCheckLine className="text-white text-sm" />
                            )}
                          </div>
                        </div>
                      )}
                      
                      {/* Notification Icon */}
                      <div className="flex-shrink-0 mr-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                          !notification.read
                            ? isDarkMode ? 'bg-indigo-900 bg-opacity-30' : 'bg-indigo-100'
                            : isDarkMode ? 'bg-gray-800' : 'bg-gray-200'
                        }`}>
                          {notificationIcon}
                        </div>
                      </div>
                      
                      {/* Notification Content */}
                      <div className="flex-1 min-w-0">
                        <p className={`${
                          !notification.read 
                            ? 'font-semibold' 
                            : isDarkMode ? 'text-gray-300' : 'text-gray-600'
                        }`}>
                          {notification.message}
                        </p>
                        <div className="flex items-center justify-between mt-1">
                          <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                            {formatTimeAgo(notification.createdAt)}
                          </p>
                          
                          {/* Unread indicator dot */}
                          {!notification.read && (
                            <span className={`w-2 h-2 rounded-full ${
                              isDarkMode ? 'bg-indigo-400' : 'bg-indigo-500'
                            }`}></span>
                          )}
                        </div>
                      </div>
                      
                      {/* Delete Button */}
                      {!showSelectOptions && (
                        <motion.button
                          variants={buttonVariants}
                          whileHover="hover"
                          whileTap="tap"
                          onClick={(e) => confirmDeleteNotification(notification._id, e)}
                          className={`ml-2 p-1.5 rounded-full ${
                            isDarkMode 
                              ? 'hover:bg-gray-700 text-gray-400 hover:text-red-400' 
                              : 'hover:bg-gray-200 text-gray-500 hover:text-red-500'
                          } opacity-0 group-hover:opacity-100`}
                        >
                          <RiDeleteBin6Line size={18} />
                        </motion.button>
                      )}
                    </div>
                  </motion.li>
                );
              })}
            </motion.ul>
          )}
        </div>
      </motion.div>

      {/* Move ToastContainer out of the motion.div and update its z-index */}
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

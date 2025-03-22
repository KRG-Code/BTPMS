import React, { useRef, useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "../../../../contexts/ThemeContext";
import io from 'socket.io-client';
import { 
  FaMapMarkerAlt, 
  FaClock, 
  FaCalendarAlt, 
  FaUserFriends,
  FaPlay, 
  FaStop,
  FaTimes,
  FaCheck,
  FaExclamationTriangle,
  FaRegClock,
  FaSpinner
} from "react-icons/fa";

// Animation variants
const modalVariants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: { 
    opacity: 1, 
    scale: 1, 
    transition: { 
      type: "spring", 
      damping: 25, 
      stiffness: 300 
    }
  },
  exit: { 
    opacity: 0, 
    scale: 0.95, 
    transition: { duration: 0.2 } 
  }
};

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      when: "beforeChildren"
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      type: "spring",
      damping: 20,
      stiffness: 300
    }
  }
};

const buttonVariants = {
  hover: { scale: 1.05 },
  tap: { scale: 0.95 }
};

const TanodPatrolSchedule = ({ 
  todayPatrols, 
  setShowTodaySchedule, 
  fetchUpcomingPatrols, 
  fetchCurrentPatrolArea, 
  uploadPatrolLogs 
}) => {
  const socketRef = useRef(null);
  const [loading, setLoading] = useState({});
  const [confirmingEnd, setConfirmingEnd] = useState(null);
  const { isDarkMode } = useTheme();

  // Theme-aware styling
  const cardBg = isDarkMode ? 'bg-gray-800' : 'bg-white';
  const textColor = isDarkMode ? 'text-gray-100' : 'text-gray-800';
  const subTextColor = isDarkMode ? 'text-gray-400' : 'text-gray-600';
  const borderColor = isDarkMode ? 'border-gray-700' : 'border-gray-200';
  const inputBg = isDarkMode ? 'bg-gray-700' : 'bg-white';
  const inputBorder = isDarkMode ? 'border-gray-600' : 'border-gray-300';
  const buttonPrimary = isDarkMode ? 'bg-blue-600 hover:bg-blue-700' : 'bg-blue-500 hover:bg-blue-600';
  const buttonDanger = isDarkMode ? 'bg-red-600 hover:bg-red-700' : 'bg-red-500 hover:bg-red-600';
  const buttonSuccess = isDarkMode ? 'bg-green-600 hover:bg-green-700' : 'bg-green-500 hover:bg-green-600';
  const buttonSecondary = isDarkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300';
  const headerBg = isDarkMode ? 'bg-gray-900' : 'bg-blue-50';

  const startPatrol = async (patrolId, startTime) => {
    const token = localStorage.getItem("token");
    if (!token) {
      toast.error("Please log in.");
      return;
    }

    const now = new Date();
    const start = new Date(startTime);
    const diff = (start - now) / (1000 * 60); // Difference in minutes

    if (diff > 30) {
      toast.error("You can only start the patrol 30 minutes before the scheduled start time.");
      return;
    }

    setLoading(prev => ({ ...prev, [patrolId]: true }));

    try {
      await axios.put(
        `${process.env.REACT_APP_API_URL}/auth/schedule/${patrolId}/start-patrol`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      toast.success("Patrol has started successfully");
      fetchUpcomingPatrols(); // Refresh the patrols list
      fetchCurrentPatrolArea(); // Update the map with the current patrol area

      // Connect to WebSocket when patrol starts
      const userId = localStorage.getItem("userId");
      socketRef.current = io(`${process.env.REACT_APP_API_URL}/namespace`, {
        query: { userId },
      });

      socketRef.current.on('connect', () => {
        console.log('Connected to WebSocket');
      });

      socketRef.current.on('disconnect', () => {
        console.log('Disconnected from WebSocket');
      });

      socketRef.current.on('connect_error', (error) => {
        console.error('WebSocket connection error:', error);
        toast.error("Connection error occurred");
      });

      socketRef.current.on('locationUpdate', (location) => {
        console.log('Location update:', location);
      });
    } catch (error) {
      console.error("Error starting patrol:", error);
      toast.error("Failed to start patrol.");
    } finally {
      setLoading(prev => ({ ...prev, [patrolId]: false }));
    }
  };

  const confirmEndPatrol = (patrolId) => {
    setConfirmingEnd(patrolId);
  };

  const endPatrol = async (patrolId) => {
    setLoading(prev => ({ ...prev, [patrolId]: true }));
    
    try {
      const token = localStorage.getItem('token');
      
      // First end the patrol in the schedule
      await axios.put(
        `${process.env.REACT_APP_API_URL}/auth/schedule/${patrolId}/end-patrol`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Then update the location marker status
      await axios.post(
        `${process.env.REACT_APP_API_URL}/locations/patrol-status`,
        { endedPatrolId: patrolId },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Upload patrol logs first
      await uploadPatrolLogs(patrolId);

      // Clear local patrol logs after successful upload
      localStorage.removeItem("patrolLogs");

      // Update UI states
      await fetchUpcomingPatrols();
      await fetchCurrentPatrolArea();

      // Show success message
      toast.success('Patrol ended successfully');
      
      // Reset confirming end state
      setConfirmingEnd(null);
    } catch (error) {
      console.error('Error ending patrol:', error);
      toast.error('Failed to end patrol');
    } finally {
      setLoading(prev => ({ ...prev, [patrolId]: false }));
    }
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
  };

  const isScheduleActive = (patrol) => {
    const now = new Date();
    const endTime = new Date(patrol.endTime);
    const userId = localStorage.getItem("userId");
    const patrolStatus = patrol.patrolStatus.find(status => status.tanodId === userId);
    
    // Schedule is active if:
    // 1. End time hasn't passed OR
    // 2. Patrol status is 'Started' (ongoing)
    return now <= endTime || (patrolStatus && patrolStatus.status === 'Started');
  };

  // Filter patrols to show only active or not yet started ones
  const filteredPatrols = todayPatrols.filter(patrol => {
    const userId = localStorage.getItem("userId");
    const patrolStatus = patrol.patrolStatus.find(status => status.tanodId === userId);
    
    return patrol.patrolArea && (
      !patrolStatus || // Not started yet
      patrolStatus.status === 'Not Started' ||
      (patrolStatus.status === 'Started' && isScheduleActive(patrol)) // Started and still active
    );
  });

  const getPatrolButton = (patrol) => {
    const userId = localStorage.getItem("userId");
    const patrolStatus = patrol.patrolStatus.find(status => status.tanodId === userId);
    const isActive = isScheduleActive(patrol);
    const isLoading = loading[patrol._id];

    if (!isActive) {
      return null;
    }

    if (isLoading) {
      return (
        <motion.button 
          className={`${buttonSecondary} text-white text-sm md:text-base px-4 py-2 rounded-lg shadow flex items-center justify-center w-full sm:w-auto min-w-[120px]`}
          disabled
        >
          <FaSpinner className="animate-spin mr-2" /> Processing...
        </motion.button>
      );
    }

    if (confirmingEnd === patrol._id) {
      return (
        <div className="flex flex-col sm:flex-row gap-2 w-full justify-end">
          <motion.button 
            variants={buttonVariants}
            whileHover="hover"
            whileTap="tap"
            onClick={() => endPatrol(patrol._id)}
            className={`${buttonDanger} text-white text-sm md:text-base px-3 py-1.5 rounded-lg shadow flex items-center justify-center`}
          >
            <FaCheck className="mr-1.5" /> Confirm End
          </motion.button>
          <motion.button 
            variants={buttonVariants}
            whileHover="hover"
            whileTap="tap"
            onClick={() => setConfirmingEnd(null)}
            className={`${buttonSecondary} text-sm md:text-base px-3 py-1.5 rounded-lg shadow flex items-center justify-center`}
          >
            <FaTimes className="mr-1.5" /> Cancel
          </motion.button>
        </div>
      );
    }

    if (!patrolStatus || patrolStatus.status === 'Not Started') {
      return (
        <motion.button 
          variants={buttonVariants}
          whileHover="hover"
          whileTap="tap"
          onClick={() => startPatrol(patrol._id, patrol.startTime)}
          className={`${buttonSuccess} text-white text-sm md:text-base px-4 py-2 rounded-lg shadow flex items-center justify-center w-full sm:w-auto`}
        >
          <FaPlay className="mr-1.5" /> Start Patrol
        </motion.button>
      );
    } else if (patrolStatus.status === 'Started') {
      return (
        <motion.button 
          variants={buttonVariants}
          whileHover="hover"
          whileTap="tap"
          onClick={() => confirmEndPatrol(patrol._id)}
          className={`${buttonDanger} text-white text-sm md:text-base px-4 py-2 rounded-lg shadow flex items-center justify-center w-full sm:w-auto`}
        >
          <FaStop className="mr-1.5" /> End Patrol
        </motion.button>
      );
    }
    
    return null;
  };

  // Mobile patrol card component
  const PatrolCard = ({ patrol }) => {
    const userId = localStorage.getItem("userId");
    const patrolStatus = patrol.patrolStatus.find(status => status.tanodId === userId);
    const isStarted = patrolStatus && patrolStatus.status === 'Started';
    const startDate = new Date(patrol.startTime);
    const endDate = new Date(patrol.endTime);
    
    return (
      <motion.div 
        variants={itemVariants}
        className={`${cardBg} rounded-xl border ${borderColor} shadow-md overflow-hidden mb-4`}
      >
        <div className={`px-4 py-3 ${isStarted ? (isDarkMode ? 'bg-green-900/30' : 'bg-green-50') : (isDarkMode ? 'bg-blue-900/20' : 'bg-blue-50')} border-b ${borderColor} flex justify-between items-center`}>
          <div className="flex items-center">
            <span className={`text-base font-medium ${textColor}`}>{patrol.unit}</span>
          </div>
          <span className={`px-2.5 py-1 rounded-full text-sm font-medium ${
            isStarted 
              ? isDarkMode ? 'bg-green-900/40 text-green-300 border border-green-700' : 'bg-green-100 text-green-700 border border-green-200'
              : isDarkMode ? 'bg-blue-900/40 text-blue-300 border border-blue-700' : 'bg-blue-100 text-blue-700 border border-blue-200'
          }`}>
            {isStarted ? 'In Progress' : 'Scheduled'}
          </span>
        </div>
        
        <div className="p-4">
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div>
              <div className="flex items-center mb-1">
                <FaClock className={`mr-1.5 ${subTextColor}`} />
                <span className={`text-xs ${subTextColor}`}>Start Time</span>
              </div>
              <p className={`${textColor}`}>{formatTime(patrol.startTime)}</p>
              <p className={`text-xs ${subTextColor}`}>{formatDate(patrol.startTime)}</p>
            </div>
            
            <div>
              <div className="flex items-center mb-1">
                <FaRegClock className={`mr-1.5 ${subTextColor}`} />
                <span className={`text-xs ${subTextColor}`}>End Time</span>
              </div>
              <p className={`${textColor}`}>{formatTime(patrol.endTime)}</p>
              <p className={`text-xs ${subTextColor}`}>{formatDate(patrol.endTime)}</p>
            </div>
          </div>
          
          <div className="mb-4">
            <div className="flex items-center mb-1">
              <FaMapMarkerAlt className={`mr-1.5 ${subTextColor}`} />
              <span className={`text-xs ${subTextColor}`}>Patrol Area</span>
            </div>
            <p className={`${textColor} font-medium`}>
              {patrol.patrolArea ? patrol.patrolArea.legend : "No area assigned"}
            </p>
          </div>
          
          <div className="flex justify-end">
            {getPatrolButton(patrol)}
          </div>
        </div>
      </motion.div>
    );
  };

  // Empty state component
  const EmptyState = () => (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className={`text-center py-8 px-4 ${cardBg} rounded-xl border ${borderColor}`}
    >
      <motion.div variants={itemVariants}>
        <FaCalendarAlt className={`mx-auto text-5xl mb-4 ${subTextColor}`} />
        <h3 className={`text-lg font-medium ${textColor} mb-2`}>No Active Patrols</h3>
        <p className={`${subTextColor}`}>There are no scheduled patrols for today or your patrols have been completed.</p>
      </motion.div>
    </motion.div>
  );

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      style={{ touchAction: 'none' }}
      onTouchMove={(e) => e.stopPropagation()}
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          e.stopPropagation();
          setShowTodaySchedule(false);
        }
      }}
    >
      <motion.div 
        variants={modalVariants}
        initial="hidden"
        animate="visible"
        exit="exit"
        className={`w-full max-w-2xl rounded-xl shadow-xl overflow-hidden ${cardBg} border ${borderColor}`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className={`px-6 py-4 ${headerBg} border-b ${borderColor} flex justify-between items-center`}>
          <div className="flex items-center">
            <FaCalendarAlt className={`mr-3 text-lg ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`} />
            <h2 className={`text-lg font-bold ${textColor}`}>Today's Patrol Schedule</h2>
          </div>
          <motion.button
            variants={buttonVariants}
            whileHover="hover"
            whileTap="tap"
            onClick={() => setShowTodaySchedule(false)}
            className={`p-2 rounded-full ${isDarkMode ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-200 text-gray-600'}`}
          >
            <FaTimes />
          </motion.button>
        </div>
        
        {/* Body content */}
        <div 
          className="p-6 max-h-[calc(85vh-128px)] overflow-y-auto" 
          style={{ touchAction: 'pan-y' }}
          onTouchMove={(e) => e.stopPropagation()}
        >
          {filteredPatrols.length === 0 ? (
            <EmptyState />
          ) : (
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="visible"
            >
              {/* Desktop view (hidden on mobile) */}
              <div className="hidden sm:block">
                <div className={`bg-${isDarkMode ? 'gray-900' : 'gray-50'} rounded-lg overflow-hidden border ${borderColor}`}>
                  <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className={isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}>
                      <tr>
                        <th scope="col" className={`px-4 py-3.5 text-left text-sm font-medium ${subTextColor}`}>Unit</th>
                        <th scope="col" className={`px-4 py-3.5 text-left text-sm font-medium ${subTextColor}`}>Time</th>
                        <th scope="col" className={`px-4 py-3.5 text-left text-sm font-medium ${subTextColor}`}>Patrol Area</th>
                        <th scope="col" className={`px-4 py-3.5 text-left text-sm font-medium ${subTextColor}`}>Status</th>
                        <th scope="col" className={`px-4 py-3.5 text-right text-sm font-medium ${subTextColor}`}>Action</th>
                      </tr>
                    </thead>
                    <tbody className={`bg-${cardBg} divide-y divide-gray-200 dark:divide-gray-700`}>
                      {filteredPatrols.map((patrol) => {
                        const userId = localStorage.getItem("userId");
                        const patrolStatus = patrol.patrolStatus.find(status => status.tanodId === userId);
                        const isStarted = patrolStatus && patrolStatus.status === 'Started';
                        
                        return (
                          <motion.tr 
                            key={patrol._id}
                            variants={itemVariants}
                            className={`${isStarted ? (isDarkMode ? 'bg-green-900/10' : 'bg-green-50') : ''}`}
                          >
                            <td className={`px-4 py-4 whitespace-nowrap text-sm font-medium ${textColor}`}>
                              {patrol.unit}
                            </td>
                            <td className={`px-4 py-4 whitespace-nowrap text-sm ${textColor}`}>
                              <div className="flex flex-col">
                                <span>{formatTime(patrol.startTime)} - {formatTime(patrol.endTime)}</span>
                                <span className={`text-xs ${subTextColor}`}>{formatDate(patrol.startTime)}</span>
                              </div>
                            </td>
                            <td className={`px-4 py-4 whitespace-nowrap text-sm ${textColor}`}>
                              {patrol.patrolArea ? patrol.patrolArea.legend : "No area assigned"}
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap text-sm">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                isStarted 
                                  ? isDarkMode ? 'bg-green-900/40 text-green-300 border border-green-700' : 'bg-green-100 text-green-700 border border-green-200'
                                  : isDarkMode ? 'bg-blue-900/40 text-blue-300 border border-blue-700' : 'bg-blue-100 text-blue-700 border border-blue-200'
                              }`}>
                                {isStarted ? (
                                  <><FaSpinner className="mr-1.5 animate-spin" /> In Progress</>
                                ) : (
                                  <><FaClock className="mr-1.5" /> Scheduled</>
                                )}
                              </span>
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap text-right text-sm">
                              {getPatrolButton(patrol)}
                            </td>
                          </motion.tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
              
              {/* Mobile view (hidden on desktop) */}
              <div className="sm:hidden space-y-4">
                {filteredPatrols.map(patrol => (
                  <PatrolCard key={patrol._id} patrol={patrol} />
                ))}
              </div>
            </motion.div>
          )}
        </div>
        
        {/* Footer */}
        <div className={`border-t ${borderColor} p-4 flex justify-end`}>
          <motion.button
            variants={buttonVariants}
            whileHover="hover"
            whileTap="tap"
            onClick={() => setShowTodaySchedule(false)}
            className={`${buttonSecondary} text-sm px-5 py-2 rounded-lg flex items-center`}
          >
            <FaTimes className="mr-1.5" /> Close
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default TanodPatrolSchedule;

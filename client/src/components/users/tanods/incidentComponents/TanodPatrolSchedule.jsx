import React, { useRef, useState, useEffect } from "react";
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
  FaSpinner,
  FaDatabase
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
  uploadPatrolLogs,
  userLocation // Make sure this prop is passed from Map.jsx
}) => {
  const socketRef = useRef(null);
  const [loading, setLoading] = useState({});
  const [confirmingEnd, setConfirmingEnd] = useState(null);
  const [currentLocation, setCurrentLocation] = useState(null); // State for current location
  const [savedDatabaseLocation, setSavedDatabaseLocation] = useState(null); // New state for saved database location
  const [useCurrentLocation, setUseCurrentLocation] = useState(false); // Toggle between saved and current location
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

  // Add a function to fetch the user's saved location from the database
  const fetchSavedLocation = async () => {
    const token = localStorage.getItem('token');
    const userId = localStorage.getItem('userId');
    
    if (!token || !userId) {
      toast.error("Authentication required");
      return;
    }
    
    try {
      const response = await axios.get(
        `${process.env.REACT_APP_API_URL}/locations/active`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      const userLocationData = response.data.find(loc => 
        loc.userId && 
        (typeof loc.userId === 'string' ? loc.userId === userId : loc.userId._id === userId)
      );
      
      if (userLocationData) {
        setSavedDatabaseLocation({
          latitude: userLocationData.latitude,
          longitude: userLocationData.longitude
        });
        
        // If this is the first time loading, use the saved location by default
        if (!currentLocation) {
          setCurrentLocation({
            latitude: userLocationData.latitude,
            longitude: userLocationData.longitude
          });
        }
        
        return userLocationData;
      } else {
        toast.warning("No saved location found in database");
      }
    } catch (error) {
      console.error("Error fetching saved location:", error);
      toast.error("Failed to fetch your saved location");
    }
  };

  // Update useEffect to fetch both current and saved locations
  useEffect(() => {
    // Fetch saved location from database first
    fetchSavedLocation();
    
    // Still get current location as a backup option
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setCurrentLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          });
        },
        (error) => {
          console.error('Error getting location:', error);
          toast.error('Unable to get your live location. Will use saved location if available.');
        },
        { enableHighAccuracy: true }
      );
    } else {
      toast.error('Geolocation is not supported by your browser. Will use saved location only.');
    }
    
    // Use location from parent component if available
    if (userLocation) {
      setCurrentLocation({
        latitude: userLocation.latitude,
        longitude: userLocation.longitude
      });
    }
  }, [userLocation]);

  // Add function to check if a point is inside a polygon
  const isPointInPolygon = (point, polygon) => {
    if (!point || !polygon || !polygon.length) return false;

    // Extract coordinates from polygon
    const vertices = polygon.map(coord => [coord.lat, coord.lng]);
    
    // Ray casting algorithm for point-in-polygon detection
    let inside = false;
    let x = point.latitude;
    let y = point.longitude;
    
    for (let i = 0, j = vertices.length - 1; i < vertices.length; j = i++) {
      const xi = vertices[i][0], yi = vertices[i][1];
      const xj = vertices[j][0], yj = vertices[j][1];
      
      const intersect = ((yi > y) !== (yj > y))
          && (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
      if (intersect) inside = !inside;
    }
    
    return inside;
  };

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

    // Get the patrol area polygon for the schedule
    const patrol = todayPatrols.find(p => p._id === patrolId);
    
    if (!patrol || !patrol.patrolArea || !patrol.patrolArea.coordinates) {
      toast.error("Patrol area information is missing. Please contact an administrator.");
      return;
    }

    // Use saved database location if available, otherwise use current location
    const locationToCheck = useCurrentLocation ? currentLocation : (savedDatabaseLocation || currentLocation);
    
    // Check if location is available
    if (!locationToCheck) {
      toast.error("Unable to determine your location. Please try again or refresh the page.");
      return;
    }

    // Check if user is inside the patrol area
    const isInside = isPointInPolygon(locationToCheck, patrol.patrolArea.coordinates);
    
    if (!isInside) {
      toast.error(
        <div>
          <p className="font-semibold mb-1">You are not in the patrol area</p>
          <p className="text-sm">Please go to {patrol.patrolArea.legend} to start your patrol.</p>
        </div>, 
        { autoClose: 5000 }
      );
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

      // Use try-catch for socket connection to prevent errors from disrupting UI
      try {
        // Connect to WebSocket when patrol starts
        const userId = localStorage.getItem("userId");
        
        // Get socket URL without the namespace
        const socketUrl = process.env.REACT_APP_API_URL;
        
        // Connect to root namespace instead of specifying '/namespace'
        socketRef.current = io(socketUrl, {
          query: { userId },
          transports: ['websocket'],
          reconnectionAttempts: 3
        });

        socketRef.current.on('connect', () => {
          console.log('Connected to WebSocket');
        });

        socketRef.current.on('disconnect', () => {
          console.log('Disconnected from WebSocket');
        });

        socketRef.current.on('connect_error', (error) => {
          // Just log the error rather than showing a toast
          console.warn('WebSocket connection error:', error);
        });

        socketRef.current.on('locationUpdate', (location) => {
          console.log('Location update:', location);
        });
      } catch (socketError) {
        // Just log socket errors - don't interrupt patrol functionality
        console.warn('Socket connection failed:', socketError);
      }
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

  // Improved isScheduleActive function that checks if a schedule is still active
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

  // Modified filtering logic to keep active patrols visible
  const filteredPatrols = todayPatrols.filter(patrol => {
    const userId = localStorage.getItem("userId");
    const patrolStatus = patrol.patrolStatus.find(status => status.tanodId === userId);
    
    // Keep patrol if:
    // 1. It has a patrol area assigned AND
    // 2. Either:
    //    a. The patrol hasn't started, OR
    //    b. The patrol has started and is still active according to isScheduleActive
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
    
    // Determine which location to use for UI display
    const locationToCheck = useCurrentLocation ? currentLocation : (savedDatabaseLocation || currentLocation);
    const isInPatrolArea = locationToCheck ? 
      isPointInPolygon(locationToCheck, patrol.patrolArea?.coordinates) : false;
    
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
            
            {/* Updated location status indicator with toggle */}
            {patrol.patrolArea && locationToCheck && (
              <div className="mt-1">
                <div className="flex items-center text-xs mb-1">
                  <span className={`mr-1 w-2 h-2 rounded-full ${
                    isInPatrolArea
                      ? 'bg-green-500'
                      : 'bg-red-500'
                  }`}></span>
                  <span className={subTextColor}>
                    {isInPatrolArea
                      ? "You are inside the patrol area"
                      : "You are outside the patrol area"}
                  </span>
                </div>
                
                <div className="flex items-center space-x-2 mt-1">
                  <button 
                    onClick={() => {
                      if (navigator.geolocation) {
                        navigator.geolocation.getCurrentPosition(
                          (position) => {
                            setCurrentLocation({
                              latitude: position.coords.latitude,
                              longitude: position.coords.longitude
                            });
                            toast.info("Live location updated");
                          },
                          (error) => {
                            toast.error("Unable to get your location");
                          },
                          { enableHighAccuracy: true }
                        );
                      }
                    }}
                    className={`${buttonSecondary} px-1 py-0.5 rounded text-xs flex items-center`}
                    title="Refresh live location"
                  >
                    <FaMapMarkerAlt className="inline mr-1" /> Refresh Live
                  </button>

                  <button 
                    onClick={fetchSavedLocation}
                    className={`${buttonSecondary} px-1 py-0.5 rounded text-xs flex items-center`}
                    title="Refresh database location"
                  >
                    <FaDatabase className="inline mr-1" /> Refresh DB
                  </button>

                  <button 
                    onClick={toggleLocationSource}
                    className={`${useCurrentLocation ? buttonSuccess : buttonPrimary} px-1 py-0.5 rounded text-xs text-white flex items-center`}
                    title="Toggle location source"
                  >
                    {useCurrentLocation ? 'Using: Live' : 'Using: DB'}
                  </button>
                </div>
              </div>
            )}
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

  // Add a toggle function to switch between current and saved location
  const toggleLocationSource = () => {
    setUseCurrentLocation(prev => !prev);
    toast.info(`Using ${!useCurrentLocation ? 'current live' : 'saved database'} location`);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm z-50 flex items-start justify-center overflow-y-auto p-4"
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
        className={`w-full max-w-4xl rounded-xl shadow-xl overflow-hidden ${cardBg} border ${borderColor} my-4`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header - fixed at the top */}
        <div className={`px-6 py-4 ${headerBg} border-b ${borderColor} flex justify-between items-center sticky top-0 z-10`}>
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
        
        {/* Body content - scrollable */}
        <div 
          className="p-6 max-h-[60vh] overflow-y-auto" 
          style={{ 
            touchAction: 'pan-y', 
            WebkitOverflowScrolling: 'touch' 
          }}
          onTouchMove={(e) => e.stopPropagation()}
        >
          {filteredPatrols.length === 0 ? (
            <EmptyState />
          ) : (
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="flex flex-col w-full"
            >
              {/* Desktop view */}
              <div className="desktop-view">
                <div className={`rounded-xl overflow-hidden border ${borderColor} ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
                  <div className="overflow-x-auto">
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
                      <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                        {filteredPatrols.map((patrol, index) => {
                          const userId = localStorage.getItem("userId");
                          const patrolStatus = patrol.patrolStatus.find(status => status.tanodId === userId);
                          const isStarted = patrolStatus && patrolStatus.status === 'Started';
                          const isSameDay = formatDate(patrol.startTime) === formatDate(patrol.endTime);
                          
                          return (
                            <motion.tr 
                              key={patrol._id}
                              variants={itemVariants}
                              className={`${isStarted ? (isDarkMode ? 'bg-green-900/10' : 'bg-green-50') : ''} ${index % 2 === 0 ? 'bg-opacity-50' : ''}`}
                            >
                              <td className={`px-4 py-4 whitespace-nowrap text-sm font-medium ${textColor}`}>
                                <div className="flex items-center">
                                  <div className={`w-3 h-3 rounded-full mr-2 ${
                                    isStarted ? 'bg-green-500 animate-pulse' : 'bg-blue-500'
                                  }`}></div>
                                  {patrol.unit}
                                </div>
                              </td>
                              <td className={`px-4 py-4 whitespace-nowrap text-sm ${textColor}`}>
                                <div className="flex flex-col">
                                  <div className="flex items-center">
                                    <FaClock className={`mr-1.5 ${isStarted ? 'text-green-500' : 'text-blue-500'}`} size={14} />
                                    <span className="font-medium">{formatTime(patrol.startTime)} - {formatTime(patrol.endTime)}</span>
                                  </div>
                                  {!isSameDay && (
                                    <div className="flex items-start text-xs mt-1 ml-5">
                                      <span className={`${subTextColor} mr-2`}>{formatDate(patrol.startTime)}</span>
                                      {' - '}
                                      <span className={`${subTextColor} ml-2`}>{formatDate(patrol.endTime)}</span>
                                    </div>
                                  )}
                                  {isSameDay && (
                                    <span className={`text-xs ${subTextColor} ml-5`}>{formatDate(patrol.startTime)}</span>
                                  )}
                                </div>
                              </td>
                              <td className={`px-4 py-4 whitespace-nowrap text-sm ${textColor}`}>
                                <div className="flex items-center">
                                  <div className={`p-1 rounded-full mr-2`} style={{ 
                                    backgroundColor: patrol.patrolArea?.color || '#888',
                                    opacity: isDarkMode ? 0.8 : 0.6
                                  }}></div>
                                  <span>{patrol.patrolArea ? patrol.patrolArea.legend : "No area assigned"}</span>
                                </div>
                              </td>
                              <td className="px-4 py-4 whitespace-nowrap text-sm">
                                <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
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
              </div>
              
              {/* Mobile view - display card layout */}
              <div className="mobile-view space-y-4">
                {filteredPatrols.map(patrol => (
                  <PatrolCard key={patrol._id} patrol={patrol} />
                ))}
              </div>
            </motion.div>
          )}
        </div>
        
        {/* Footer - fixed at the bottom */}
        <div className={`border-t ${borderColor} p-4 flex justify-end sticky bottom-0 bg-inherit z-10`}>
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
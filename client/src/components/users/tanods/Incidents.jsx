import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { motion, AnimatePresence } from "framer-motion";
import { 
  FaUserShield, 
  FaCalendarAlt, 
  FaClipboardList, 
  FaExclamationTriangle,
  FaPencilAlt,
  FaTrashAlt,
  FaSave,
  FaClipboardCheck,
  FaMapMarkedAlt,
  FaEye,
  FaPaperPlane,
  FaLocationArrow,
  FaLock,
  FaChevronDown,
  FaChevronUp
} from "react-icons/fa";
import TanodPatrolSchedule from "./incidentComponents/TanodPatrolSchedule";
import ReportIncident from "./incidentComponents/IncidentResponse";
import ViewReportedIncidents from "./incidentComponents/ViewReportedIncidents";
import { useTheme } from "../../../contexts/ThemeContext";

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: { 
    opacity: 1,
    transition: { 
      staggerChildren: 0.1,
      when: "beforeChildren" 
    }
  },
  exit: { 
    opacity: 0,
    transition: { duration: 0.2 } 
  }
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: { 
    y: 0, 
    opacity: 1, 
    transition: { 
      type: "spring",
      damping: 25,
      stiffness: 200
    }
  },
  exit: { 
    y: -20, 
    opacity: 0,
    transition: { duration: 0.15 } 
  }
};

const buttonVariants = {
  hover: { scale: 1.05, transition: { duration: 0.2 } },
  tap: { scale: 0.95 }
};

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      type: "spring",
      damping: 25,
      stiffness: 200
    }
  },
  exit: { opacity: 0, y: -20, transition: { duration: 0.2 } }
};

const Incidents = ({ 
  fetchCurrentPatrolArea, 
  setUserLocation, 
  setIncidentLocations, 
  incidentReports,
  setIncidentReports,
  isTrackingVisible, 
  toggleTracking,
  showReportIncident,
  setShowReportIncident,
  selectedIncidentForResponse,
  setSelectedIncidentForResponse,
  socketRef,
  initializeSocket,
  userProfile,
  prevUserLocation,
  setPrevUserLocation
}) => {
  const [patrols, setPatrols] = useState([]);
  const [upcomingPatrols, setUpcomingPatrols] = useState([]);
  const [incident, setIncident] = useState({ type: "", description: "", location: "" });
  const [incidentLog, setIncidentLog] = useState([]);
  const [currentReport, setCurrentReport] = useState(localStorage.getItem("currentReport") || "");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [showTodaySchedule, setShowTodaySchedule] = useState(false);
  const [showReportedIncidents, setShowReportedIncidents] = useState(false);
  const [todayPatrols, setTodayPatrols] = useState([]);
  const [patrolLogs, setPatrolLogs] = useState(JSON.parse(localStorage.getItem("patrolLogs")) || []);
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [deleteIndex, setDeleteIndex] = useState(null);
  const [editIndex, setEditIndex] = useState(null);
  const [hasStartedPatrol, setHasStartedPatrol] = useState(false);
  const [currentScheduleId, setCurrentScheduleId] = useState(null);
  // Remove manual tracking state, it's always active now
  const watchPositionId = useRef(null);
  const [showLogForm, setShowLogForm] = useState(false);
  const { isDarkMode } = useTheme();

  // Get theme aware styles
  const cardBg = isDarkMode ? 'bg-gray-800' : 'bg-white';
  const textColor = isDarkMode ? 'text-gray-100' : 'text-gray-800';
  const subTextColor = isDarkMode ? 'text-gray-400' : 'text-gray-600';
  const borderColor = isDarkMode ? 'border-gray-700' : 'border-gray-200';
  const headerBg = isDarkMode ? 'bg-gray-900' : 'bg-blue-50';
  const buttonPrimary = isDarkMode ? 'bg-blue-600 hover:bg-blue-700' : 'bg-blue-500 hover:bg-blue-600';
  const buttonSecondary = isDarkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300';
  const buttonWarning = isDarkMode ? 'bg-yellow-600 hover:bg-yellow-700' : 'bg-yellow-500 hover:bg-yellow-600';
  const buttonDanger = isDarkMode ? 'bg-red-600 hover:bg-red-700' : 'bg-red-500 hover:bg-red-600';
  const buttonSuccess = isDarkMode ? 'bg-green-600 hover:bg-green-700' : 'bg-green-500 hover:bg-green-600';
  const inputBg = isDarkMode ? 'bg-gray-700' : 'bg-white';
  const inputText = isDarkMode ? 'text-white' : 'text-black';
  const inputBorder = isDarkMode ? 'border-gray-600' : 'border-gray-300';
  const tableBg = isDarkMode ? 'bg-gray-800' : 'bg-white';
  const tableHeaderBg = isDarkMode ? 'bg-gray-900' : 'bg-blue-50';
  const tableRowHover = isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-50';

  const fetchUserProfile = async () => {
    if (userProfile) return userProfile;
    
    const token = localStorage.getItem("token");
    if (!token) {
      toast.error("Please log in.");
      return null;
    }

    try {
      const response = await axios.get(`${process.env.REACT_APP_API_URL}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      localStorage.setItem("userId", response.data._id);
      return response.data;
    } catch (error) {
      console.error("Error fetching user profile:", error);
      toast.error("Error fetching user profile.");
      return null;
    }
  };

  const fetchUpcomingPatrols = async () => {
    const token = localStorage.getItem('token');
    const profile = await fetchUserProfile();
    if (!token || !profile) return;

    try {
      const response = await axios.get(`${process.env.REACT_APP_API_URL}/auth/tanod-schedules/${profile._id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const schedulesWithPatrolArea = await Promise.all(
        response.data.map(async (schedule) => {
          if (schedule.patrolArea && typeof schedule.patrolArea === 'object' && schedule.patrolArea._id) {
            const patrolAreaResponse = await axios.get(
              `${process.env.REACT_APP_API_URL}/polygons/${schedule.patrolArea._id}`,
              {
                headers: { Authorization: `Bearer ${token}` },
              }
            );
            schedule.patrolArea = patrolAreaResponse.data;
          } else if (schedule.patrolArea) {
            const patrolAreaResponse = await axios.get(
              `${process.env.REACT_APP_API_URL}/polygons/${schedule.patrolArea}`,
              {
                headers: { Authorization: `Bearer ${token}` },
              }
            );
            schedule.patrolArea = patrolAreaResponse.data;
          }
          return schedule;
        })
      );
      setUpcomingPatrols(schedulesWithPatrolArea || []);
      setTodayPatrols(schedulesWithPatrolArea.filter(schedule => {
        const today = new Date();
        const startTime = new Date(schedule.startTime);
        return startTime.toDateString() === today.toDateString();
      }));
      const startedPatrol = schedulesWithPatrolArea.some(schedule => {
        const patrolStatus = schedule.patrolStatus.find(status => status.tanodId === profile._id);
        return patrolStatus && patrolStatus.status === 'Started';
      });
      setHasStartedPatrol(startedPatrol);

      if (startedPatrol) {
        const currentSchedule = schedulesWithPatrolArea.find(schedule => {
          const patrolStatus = schedule.patrolStatus.find(status => status.tanodId === profile._id);
          return patrolStatus && patrolStatus.status === 'Started';
        });
        setCurrentScheduleId(currentSchedule._id);
      }
    } catch (error) {
      console.error('Error fetching upcoming patrols:', error);
      toast.error('Failed to load upcoming patrols.');
    }
  };

  useEffect(() => {
    fetchUpcomingPatrols();
  }, []);

  const toggleDropdown = () => {
    setIsDropdownOpen(!isDropdownOpen);
  };

  const savePatrolLog = () => {
    if (!currentReport || !currentReport.trim()) {
      toast.error("Cannot save empty patrol log.");
      return;
    }

    const timestamp = new Date().toLocaleString();
    const logEntry = { report: currentReport, timestamp, scheduleId: currentScheduleId };

    let updatedLogs;
    if (editIndex !== null) {
      updatedLogs = patrolLogs.map((log, index) => (index === editIndex ? logEntry : log));
      setEditIndex(null);
    } else {
      updatedLogs = [...patrolLogs, logEntry];
    }

    setPatrolLogs(updatedLogs);
    localStorage.setItem("patrolLogs", JSON.stringify(updatedLogs));
    localStorage.setItem("currentReport", "");
    setCurrentReport("");
    toast.success("Patrol log saved.");
  };

  const confirmDeletePatrolLog = (index) => {
    setDeleteIndex(index);
    setShowDeleteConfirmation(true);
  };

  const deletePatrolLog = () => {
    const updatedLogs = patrolLogs.filter((_, i) => i !== deleteIndex);
    setPatrolLogs(updatedLogs);
    localStorage.setItem("patrolLogs", JSON.stringify(updatedLogs));
    toast.success("Patrol log deleted.");
    setShowDeleteConfirmation(false);
    setDeleteIndex(null);
  };

  const editPatrolLog = (index) => {
    const log = patrolLogs[index];
    setCurrentReport(log.report);
    setEditIndex(index);
  };

  const uploadPatrolLogs = async (scheduleId) => {
    const token = localStorage.getItem("token");
    if (!token || !scheduleId) return;

    try {
      await axios.post(`${process.env.REACT_APP_API_URL}/auth/save-patrol-logs`, {
        scheduleId,
        logs: patrolLogs.filter(log => log.scheduleId === scheduleId),
      }, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setPatrolLogs([]);
      localStorage.removeItem("patrolLogs");
      toast.success("Patrol logs uploaded successfully");
    } catch (error) {
      console.error('Error uploading patrol logs:', error);
      toast.error('Failed to upload patrol logs');
    }
  };

  // Update the fetchPatrolAreaColor function
  const fetchPatrolAreaColor = async (scheduleId) => {
    try {
      const token = localStorage.getItem('token');
      const schedule = await axios.get(
        `${process.env.REACT_APP_API_URL}/auth/schedule/${scheduleId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const patrolAreaId = schedule.data.patrolArea?._id || schedule.data.patrolArea;
      
      if (patrolAreaId) {
        const patrolArea = await axios.get(
          `${process.env.REACT_APP_API_URL}/polygons/${patrolAreaId}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        return patrolArea.data.color;
      }
      return 'red';
    } catch (error) {
      console.error('Error fetching patrol area color:', error);
      return 'red';
    }
  };

  // Improved location update function with better error handling
  const updateUserLocation = async (position, profile) => {
    if (!profile || !position?.coords) return;

    const { latitude, longitude } = position.coords;
    
    const newLocation = {
      latitude,
      longitude,
      currentScheduleId,
      markerColor: currentScheduleId ? await fetchPatrolAreaColor(currentScheduleId) : 'red',
      isOnPatrol: !!currentScheduleId,
      lastUpdate: Date.now() // Add timestamp to track freshness
    };

    // Only update if location has actually changed
    if (!hasLocationChanged(prevUserLocation, newLocation)) {
      return;
    }
    
    try {
      const token = localStorage.getItem('token');
      
      // Send update to server
      await axios.post(
        `${process.env.REACT_APP_API_URL}/locations/update`,
        {
          ...newLocation,
          userId: profile._id
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      
      // Create complete location data object
      const locationData = {
        ...newLocation,
        firstName: profile.firstName,
        lastName: profile.lastName,
        profilePicture: profile.profilePicture,
      };

      // Update state
      setPrevUserLocation(locationData);
      setUserLocation(locationData);

    } catch (error) {
      console.error('Error updating location:', error?.response?.data || error.message);
    }
  };

  const hasLocationChanged = (prevLoc, newLoc) => {
    if (!prevLoc) return true;
    
    // Check if location has moved at least 5 meters or other properties changed
    return (
      calculateDistance(
        prevLoc.latitude,
        prevLoc.longitude,
        newLoc.latitude,
        newLoc.longitude
      ) > 5 ||
      prevLoc.currentScheduleId !== newLoc.currentScheduleId ||
      prevLoc.markerColor !== newLoc.markerColor ||
      prevLoc.isOnPatrol !== newLoc.isOnPatrol
    );
  };

  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = lat1 * Math.PI/180;
    const φ2 = lat2 * Math.PI/180;
    const Δφ = (lat2-lat1) * Math.PI/180;
    const Δλ = (lon2-lon1) * Math.PI/180;

    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

    return R * c;
  };

  // Improved location tracking with better error handling
  const startLocationTracking = async () => {
    const profile = await fetchUserProfile();
    if (!profile) {
      toast.error("Failed to fetch user profile");
      return;
    }

    if (navigator.geolocation) {
      const options = {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 3000 // Cache positions for 3 seconds
      };

      try {
        // Get initial position immediately
        navigator.geolocation.getCurrentPosition(
          (position) => {
            updateUserLocation(position, profile);
            
            // Clear any existing watch
            if (watchPositionId.current) {
              navigator.geolocation.clearWatch(watchPositionId.current);
            }
            
            // Start continuous watching
            watchPositionId.current = navigator.geolocation.watchPosition(
              (position) => updateUserLocation(position, profile),
              handleLocationError,
              options
            );
          },
          handleLocationError,
          options
        );
      } catch (error) {
        console.error('Geolocation error:', error);
        toast.error('Error initializing location tracking');
      }
    } else {
      toast.error('Geolocation is not supported by your browser');
    }
  };

  // Initialize tracking automatically on component mount
  useEffect(() => {
    // Initialize socket if it doesn't exist
    if (!socketRef.current) {
      socketRef.current = initializeSocket();

      if (socketRef.current) {
        socketRef.current.on('connect', () => {
          console.log('Connected to socket server');
          socketRef.current.emit('joinTrackingRoom');
        });

        // Setup location update handler
        socketRef.current.on('locationUpdate', async (data) => {
          const profile = await fetchUserProfile();
          if (profile && data.userId?._id === profile._id) {
            const locationData = {
              ...data,
              latitude: data.latitude,
              longitude: data.longitude,
              markerColor: data.markerColor || 'red',
              isOnPatrol: data.isOnPatrol || false,
              profilePicture: profile.profilePicture,
              firstName: profile.firstName,
              lastName: profile.lastName,
              lastUpdate: Date.now() // Add timestamp
            };
            
            // Always update current location to ensure the marker is visible
            setUserLocation(locationData);
            setPrevUserLocation(locationData);
          }
        });
      }
    } else {
      // If socket already exists but isn't connected, reconnect
      if (socketRef.current && !socketRef.current.connected) {
        socketRef.current.connect();
      }
    }
    
    // Start location tracking automatically
    startLocationTracking();
    
    // Update state in Map component
    toggleTracking(true);
    
    return () => {
      // Cleanup tracking on unmount
      if (watchPositionId.current) {
        navigator.geolocation.clearWatch(watchPositionId.current);
        watchPositionId.current = null;
      }
    };
  }, []);

  const handleLocationError = (error) => {
    let errorMessage = '';
    
    switch (error.code) {
      case error.PERMISSION_DENIED:
        errorMessage = "Location access denied. Please enable location services in your browser settings.";
        break;
      case error.POSITION_UNAVAILABLE:
        errorMessage = "Location information is unavailable. Please check your device's GPS settings.";
        break;
      case error.TIMEOUT:
        errorMessage = "Location request timed out. Please try again.";
        break;
      case error.UNKNOWN_ERROR:
      default:
        errorMessage = "An unknown error occurred while getting location.";
        break;
    }

    console.error('Geolocation error:', error.code, error.message);
    toast.error(errorMessage);
  };

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      style={{ 
        pointerEvents: isDropdownOpen ? 'auto' : 'none' 
      }}
    >
      <div className="max-w-7xl mx-auto w-full">
        {/* Main Dashboard Button - always needs pointer events */}
        <motion.div 
          variants={itemVariants}
          className="flex justify-between items-center"
          style={{ pointerEvents: 'auto' }}
        >
          <motion.button
            variants={buttonVariants}
            whileHover="hover"
            whileTap="tap"
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className={`flex items-center justify-between w-full ${buttonPrimary} text-white py-2.5 px-4 rounded-xl shadow-md`}
            aria-expanded={isDropdownOpen}
          >
            <div className="flex items-center">
              <FaUserShield className="mr-3 text-xl" />
              <span className="font-semibold text-lg">Tanod Control Panel</span>
            </div>
            <motion.div
              animate={{ rotate: isDropdownOpen ? 180 : 0 }}
              transition={{ duration: 0.3 }}
            >
              {isDropdownOpen ? <FaChevronUp /> : <FaChevronDown />}
            </motion.div>
          </motion.button>
        </motion.div>

        {/* Dropdown Content */}
        <AnimatePresence>
          {isDropdownOpen && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
              className="overflow-hidden rounded-xl mt-2"
              style={{ maxHeight: "calc(100vh - 8rem)", overflowY: "auto" }}
            >
              <motion.div 
                variants={containerVariants} 
                initial="hidden" 
                animate="visible"
                className={`p-4 ${cardBg} rounded-xl shadow-lg border ${borderColor}`}
              >
                {/* Quick Action Buttons */}
                <motion.div variants={itemVariants} className="mb-6">
                  <h2 className={`text-lg font-semibold mb-3 ${textColor}`}>Quick Actions</h2>
                  <div className="grid grid-cols-2 md:flex md:flex-wrap gap-2">
                    <motion.button
                      variants={buttonVariants}
                      whileHover="hover"
                      whileTap="tap"
                      onClick={() => setShowTodaySchedule(true)}
                      className={`${buttonPrimary} text-white p-3 rounded-lg shadow-md flex flex-col items-center justify-center w-full md:flex-1`}
                    >
                      <FaCalendarAlt className="text-xl mb-1" />
                      <span className="text-sm font-medium">Today's Schedule</span>
                    </motion.button>
                    
                    <motion.button
                      variants={buttonVariants}
                      whileHover="hover"
                      whileTap="tap"
                      onClick={() => setShowReportedIncidents(true)}
                      className={`${buttonWarning} text-white p-3 rounded-lg shadow-md flex flex-col items-center justify-center w-full md:flex-1`}
                    >
                      <FaExclamationTriangle className="text-xl mb-1" />
                      <span className="text-sm font-medium">View Reports</span>
                    </motion.button>
                    
                    {selectedIncidentForResponse && selectedIncidentForResponse.status === 'In Progress' && (
                      <motion.button
                        variants={buttonVariants}
                        whileHover="hover"
                        whileTap="tap"
                        onClick={() => setShowReportIncident(true)}
                        className={`${buttonSuccess} text-white p-3 rounded-lg shadow-md flex flex-col items-center justify-center w-full md:flex-1`}
                      >
                        <FaPaperPlane className="text-xl mb-1" />
                        <span className="text-sm font-medium">Respond to Incident</span>
                      </motion.button>
                    )}
                    
                    {/* Remove manual start/stop tracking button */}
                    
                    {hasStartedPatrol && (
                      <motion.button
                        variants={buttonVariants}
                        whileHover="hover"
                        whileTap="tap"
                        onClick={() => setShowLogForm(!showLogForm)}
                        className={`${buttonSecondary} ${textColor} p-3 rounded-lg shadow-md flex flex-col items-center justify-center w-full md:flex-1`}
                      >
                        <FaClipboardCheck className="text-xl mb-1" />
                        <span className="text-sm font-medium">Log Report</span>
                      </motion.button>
                    )}
                  </div>
                </motion.div>
                
                {/* Patrol Log Form */}
                <AnimatePresence>
                  {hasStartedPatrol && showLogForm && (
                    <motion.div 
                      variants={cardVariants}
                      initial="hidden"
                      animate="visible"
                      exit="exit"
                      className={`mb-6 p-4 border ${borderColor} rounded-xl bg-opacity-50 ${isDarkMode ? 'bg-gray-800/50' : 'bg-gray-50/50'}`}
                    >
                      <h2 className={`text-lg font-semibold mb-3 flex items-center ${textColor}`}>
                        <FaClipboardList className="mr-2" /> Patrol Report Log
                      </h2>
                      
                      <textarea
                        className={`w-full h-32 p-3 rounded-lg border ${inputBorder} ${inputBg} ${inputText} focus:ring-2 focus:ring-blue-500 focus:outline-none mb-3`}
                        placeholder="Enter your patrol report details..."
                        value={currentReport}
                        onChange={(e) => setCurrentReport(e.target.value)}
                      />
                      
                      <div className="flex justify-end">
                        <motion.button
                          variants={buttonVariants}
                          whileHover="hover"
                          whileTap="tap"
                          onClick={savePatrolLog}
                          disabled={!currentReport.trim()}
                          className={`${buttonSuccess} text-white px-4 py-2 rounded-lg flex items-center ${!currentReport.trim() ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                          <FaSave className="mr-2" /> Save Report
                        </motion.button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
                
                {/* Patrol Logs Table */}
                {patrolLogs.filter(log => log.scheduleId === currentScheduleId).length > 0 && (
                  <motion.div variants={itemVariants} className="mb-2">
                    <h2 className={`text-lg font-semibold mb-3 flex items-center ${textColor}`}>
                      <FaClipboardCheck className="mr-2" /> Saved Patrol Logs
                    </h2>
                    
                    <div className={`border ${borderColor} rounded-xl overflow-hidden shadow-md`}>
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead className={`${tableHeaderBg}`}>
                            <tr>
                              <th className={`text-left py-3 px-4 font-medium ${subTextColor}`}>Time</th>
                              <th className={`text-left py-3 px-4 font-medium ${subTextColor}`}>Report</th>
                              <th className={`text-center py-3 px-4 font-medium ${subTextColor}`}>Actions</th>
                            </tr>
                          </thead>
                          <tbody className={`divide-y ${borderColor}`}>
                            {patrolLogs.filter(log => log.scheduleId === currentScheduleId).map((log, index) => (
                              <motion.tr 
                                key={index} 
                                className={`${tableRowHover}`}
                                variants={itemVariants}
                                initial="hidden"
                                animate="visible"
                                exit="exit"
                              >
                                <td className={`py-3 px-4 ${textColor}`}>
                                  <p className="font-medium">{new Date(log.timestamp).toLocaleTimeString()}</p>
                                  <p className={`text-xs ${subTextColor}`}>{new Date(log.timestamp).toLocaleDateString()}</p>
                                </td>
                                <td className={`py-3 px-4 ${textColor}`}>
                                  <div className="max-h-20 overflow-y-auto pr-2">
                                    {log.report}
                                  </div>
                                </td>
                                <td className="py-3 px-4">
                                  <div className="flex justify-center space-x-2">
                                    <motion.button
                                      variants={buttonVariants}
                                      whileHover="hover"
                                      whileTap="tap"
                                      onClick={() => editPatrolLog(index)}
                                      className={`p-2 rounded-lg ${buttonWarning} text-white`}
                                      title="Edit log"
                                    >
                                      <FaPencilAlt />
                                    </motion.button>
                                    <motion.button
                                      variants={buttonVariants}
                                      whileHover="hover"
                                      whileTap="tap"
                                      onClick={() => confirmDeletePatrolLog(index)}
                                      className={`p-2 rounded-lg ${buttonDanger} text-white`}
                                      title="Delete log"
                                    >
                                      <FaTrashAlt />
                                    </motion.button>
                                  </div>
                                </td>
                              </motion.tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </motion.div>
                )}
                
                {/* Status Cards */}
                <motion.div 
                  variants={itemVariants} 
                  className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4"
                >
                  <motion.div 
                    variants={cardVariants}
                    whileHover={{ y: -5 }}
                    className={`p-4 rounded-xl border ${borderColor} ${cardBg} shadow-md`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h3 className={`font-medium ${textColor}`}>Patrol Status</h3>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${hasStartedPatrol ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'}`}>
                        {hasStartedPatrol ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    <p className={`text-sm ${subTextColor}`}>
                      {hasStartedPatrol 
                        ? 'You have an active patrol session.' 
                        : 'No active patrol session.'}
                    </p>
                  </motion.div>
                  
                  <motion.div 
                    variants={cardVariants}
                    whileHover={{ y: -5 }}
                    className={`p-4 rounded-xl border ${borderColor} ${cardBg} shadow-md`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h3 className={`font-medium ${textColor}`}>Tracking Status</h3>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400`}>
                        Enabled
                      </span>
                    </div>
                    <p className={`text-sm ${subTextColor}`}>
                      Your location is being tracked for patrol.
                    </p>
                  </motion.div>
                </motion.div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Modals */}
      {showTodaySchedule && (
        <div 
          className="fixed inset-0 overflow-y-auto modal-fixed z-[1500]"
          style={{ touchAction: 'manipulation' }}
          onTouchMove={(e) => e.stopPropagation()}
          onClick={(e) => e.stopPropagation()}
        >
          <div 
            className="flex items-start justify-center min-h-screen p-4 modal-container"
            onClick={(e) => e.stopPropagation()}
          >
            <TanodPatrolSchedule
              todayPatrols={todayPatrols}
              setShowTodaySchedule={setShowTodaySchedule}
              fetchUpcomingPatrols={fetchUpcomingPatrols}
              fetchCurrentPatrolArea={fetchCurrentPatrolArea}
              uploadPatrolLogs={uploadPatrolLogs}
            />
          </div>
        </div>
      )}

      {showReportIncident && selectedIncidentForResponse && (
        <div 
          className="fixed inset-0 z-50 overflow-y-auto modal-fixed"
          style={{ touchAction: 'none' }}
          onTouchMove={(e) => e.stopPropagation()}
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              e.stopPropagation();
              setShowReportIncident(false);
            }
          }}
        >
          <div 
            className="flex items-center justify-center min-h-screen p-4"
            onClick={(e) => e.stopPropagation()}
            style={{ marginTop: '0', paddingTop: '5vh' }}
          >
            <div onClick={(e) => e.stopPropagation()}>
              <ReportIncident
                incident={incident}
                setIncident={setIncident}
                setIncidentLog={setIncidentLog}
                incidentLog={incidentLog}
                setShowReportIncident={setShowReportIncident}
                selectedIncident={selectedIncidentForResponse}
                setSelectedIncidentForResponse={setSelectedIncidentForResponse}
              />
            </div>
          </div>
        </div>
      )}

      {showReportedIncidents && (
        <div 
          className="fixed inset-0 z-50 overflow-y-auto modal-fixed"
          style={{ touchAction: 'manipulation' }}
          onTouchMove={(e) => e.stopPropagation()}
          onClick={(e) => e.stopPropagation()}
        >
          <div 
            className="flex items-center justify-center min-h-screen p-4"
            onClick={(e) => e.stopPropagation()}
            style={{ marginTop: '0', paddingTop: '5vh' }}
          >
            <ViewReportedIncidents
              setShowReportedIncidents={setShowReportedIncidents}
              setIncidentLocations={setIncidentLocations}
              incidentReports={incidentReports}
              setShowReportIncident={setShowReportIncident}
              setSelectedIncidentForResponse={setSelectedIncidentForResponse}
            />
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {showDeleteConfirmation && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 modal-fixed"
            style={{ touchAction: 'none' }}
            onTouchMove={(e) => e.stopPropagation()}
            onClick={(e) => e.stopPropagation()}
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className={`${cardBg} rounded-xl shadow-xl mx-4 max-w-md w-full p-6 border ${borderColor}`}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center mb-4">
                <div className="p-3 rounded-full bg-red-100 dark:bg-red-900/30 mr-3">
                  <FaExclamationTriangle className="text-red-500 dark:text-red-400 text-xl" />
                </div>
                <h2 className={`text-xl font-bold ${textColor}`}>Confirm Delete</h2>
              </div>
              
              <p className={`mb-6 ${subTextColor}`}>
                Are you sure you want to delete this patrol log? This action cannot be undone.
              </p>
              
              <div className="flex justify-end space-x-3">
                <motion.button
                  variants={buttonVariants}
                  whileHover="hover"
                  whileTap="tap"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowDeleteConfirmation(false);
                  }}
                  className={`px-4 py-2 rounded-lg ${buttonSecondary} ${textColor}`}
                >
                  Cancel
                </motion.button>
                
                <motion.button
                  variants={buttonVariants}
                  whileHover="hover"
                  whileTap="tap"
                  onClick={(e) => {
                    e.stopPropagation();
                    deletePatrolLog();
                  }}
                  className={`px-4 py-2 rounded-lg ${buttonDanger} text-white`}
                >
                  Delete
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default Incidents;

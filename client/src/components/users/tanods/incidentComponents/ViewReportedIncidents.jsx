import React, { useEffect, useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "../../../../contexts/ThemeContext";
import L from 'leaflet';
import { 
  FaMapMarkerAlt, 
  FaSpinner, 
  FaTimesCircle, 
  FaEye, 
  FaMapMarked, 
  FaStreetView,
  FaCalendarAlt,
  FaClock, 
  FaPhoneAlt,
  FaUser,
  FaExclamationTriangle,
  FaInfoCircle,
  FaSearch,
  FaFilter,
  FaTimes,
  FaArrowLeft,
  FaCheckCircle,
  FaExclamationCircle
} from "react-icons/fa";

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: { 
    opacity: 1, 
    transition: { 
      staggerChildren: 0.05,
      when: "beforeChildren" 
    }
  }
};

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

const tableRowVariants = {
  hidden: { opacity: 0, x: -20 },
  visible: i => ({ 
    opacity: 1, 
    x: 0,
    transition: { 
      delay: i * 0.05,
      type: "spring",
      stiffness: 100,
      damping: 10
    }
  }),
  exit: { 
    opacity: 0,
    x: -20,
    transition: { duration: 0.2 }
  }
};

const ViewReportedIncidents = ({ 
  setShowReportedIncidents, 
  setIncidentLocations, 
  incidentReports,
  setShowReportIncident,
  setSelectedIncidentForResponse
}) => {
  const [incidentLog, setIncidentLog] = useState([]);
  const [selectedIncidentState, setSelectedIncidentState] = useState(null);
  const [visibleLocations, setVisibleLocations] = useState(() => {
    const saved = localStorage.getItem('visibleIncidentLocations');
    return saved ? JSON.parse(saved) : {};
  });
  const [showAllLocations, setShowAllLocations] = useState(
    JSON.parse(localStorage.getItem('showAllLocations')) || false
  );
  const [hasActiveResponse, setHasActiveResponse] = useState(false);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showFilters, setShowFilters] = useState(false);
  const { isDarkMode } = useTheme();

  // Theme-aware styling
  const cardBg = isDarkMode ? 'bg-gray-800' : 'bg-white';
  const textColor = isDarkMode ? 'text-gray-100' : 'text-gray-800';
  const subTextColor = isDarkMode ? 'text-gray-400' : 'text-gray-600';
  const borderColor = isDarkMode ? 'border-gray-700' : 'border-gray-200';
  const inputBg = isDarkMode ? 'bg-gray-700' : 'bg-white';
  const inputText = isDarkMode ? 'text-white' : 'text-black';
  const inputBorder = isDarkMode ? 'border-gray-600' : 'border-gray-300';
  const buttonPrimary = isDarkMode ? 'bg-blue-600 hover:bg-blue-700' : 'bg-blue-500 hover:bg-blue-600';
  const buttonSecondary = isDarkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300';
  const buttonDanger = isDarkMode ? 'bg-red-600 hover:bg-red-700' : 'bg-red-500 hover:bg-red-600';
  const buttonSuccess = isDarkMode ? 'bg-green-600 hover:bg-green-700' : 'bg-green-500 hover:bg-green-600';
  const buttonWarning = isDarkMode ? 'bg-yellow-600 hover:bg-yellow-700' : 'bg-yellow-500 hover:bg-yellow-600';

  const fetchIncidentReports = async () => {
    setLoading(true);
    const token = localStorage.getItem('token');
    if (!token) {
      toast.error('Please log in.');
      setLoading(false);
      return;
    }

    try {
      const response = await axios.get(`${process.env.REACT_APP_API_URL}/incident-reports`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      // Filter out resolved incidents
      const activeIncidents = response.data.filter(incident => incident.status !== 'Resolved');
      setIncidentLog(activeIncidents);
    } catch (error) {
      console.error('Error fetching incident reports:', error);
      toast.error('Failed to load incident reports.');
    } finally {
      setLoading(false);
    }
  };

  const checkActiveResponse = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      const response = await axios.get(
        `${process.env.REACT_APP_API_URL}/incident-reports`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const hasInProgress = response.data.some(incident => incident.status === 'In Progress');
      setHasActiveResponse(hasInProgress);
    } catch (error) {
      console.error('Error checking active responses:', error);
    }
  };

  useEffect(() => {
    fetchIncidentReports();
    checkActiveResponse();
  }, []);

  useEffect(() => {
    localStorage.setItem('visibleIncidentLocations', JSON.stringify(visibleLocations));
  }, [visibleLocations]);

  useEffect(() => {
    const savedLocations = localStorage.getItem('visibleIncidentLocations');
    if (savedLocations) {
      const parsedLocations = JSON.parse(savedLocations);
      setVisibleLocations(parsedLocations);
      setIncidentLocations(parsedLocations);
    }
  }, []);

  useEffect(() => {
    if (showAllLocations) {
      const allLocations = {};
      incidentReports
        // Filter out resolved incidents before showing locations
        .filter(incident => incident.status !== 'Resolved')
        .forEach(incident => {
          allLocations[incident._id] = {
            location: incident.location,
            type: incident.incidentClassification === 'Emergency Incident' ? 'Emergency' : 'Normal'
          };
        });
      setVisibleLocations(allLocations);
      setIncidentLocations(allLocations);
      localStorage.setItem('visibleIncidentLocations', JSON.stringify(allLocations));
    }
  }, [showAllLocations, incidentReports]);

  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  const handleViewDetails = (incident) => {
    setSelectedIncidentState(incident);
  };

  const handleCloseDetails = () => {
    setSelectedIncidentState(null);
  };

  const getIncidentType = (classification) => {
    return classification === 'Emergency Incident' ? 'Emergency' : 'Normal';
  };

  const handleToggleLocation = (incident) => {
    if (incident.status === 'Resolved') {
      toast.info('Location is not available for resolved incidents');
      return;
    }

    const latLngMatch = incident.location.match(/Lat:\s*([0-9.-]+),\s*Lon:\s*([0-9.-]+)/);
    if (!latLngMatch) {
      toast.warning(
        <div>
          <p>Cannot display location on map</p>
          <p className="text-sm mt-1">Location provided: {incident.location}</p>
          <p className="text-sm mt-1">Exact coordinates are required to show on map</p>
        </div>,
        {
          autoClose: 5000,
          icon: '📍'
        }
      );
      return;
    }

    setVisibleLocations((prev) => {
      const newVisibleLocations = { ...prev };
      if (newVisibleLocations[incident._id]) {
        delete newVisibleLocations[incident._id];
      } else {
        const incidentType = getIncidentType(incident.incidentClassification);
        newVisibleLocations[incident._id] = {
          location: incident.location,
          type: incidentType,
          status: incident.status
        };
      }
      setIncidentLocations(newVisibleLocations);
      return newVisibleLocations;
    });
  };

  const handleToggleAllLocations = () => {
    const newShowAllState = !showAllLocations;
    setShowAllLocations(newShowAllState);
    localStorage.setItem('showAllLocations', JSON.stringify(newShowAllState));

    if (!newShowAllState) {
      setVisibleLocations({});
      setIncidentLocations({});
      localStorage.setItem('visibleIncidentLocations', JSON.stringify({}));
    }
  };

  const getResponseButtonState = (incident) => {
    if (incident.status === 'Resolved') {
      return {
        disabled: true,
        text: 'Resolved',
        className: `${buttonSecondary} opacity-50 cursor-not-allowed`
      };
    }
    
    if (incident.status === 'In Progress' && incident.responderName) {
      return {
        disabled: true,
        text: `Handled by ${incident.responderName}`,
        className: `${buttonPrimary} opacity-50 cursor-not-allowed`
      };
    }

    if (hasActiveResponse) {
      return {
        disabled: true,
        text: 'Unavailable',
        className: `${buttonWarning} opacity-50 cursor-not-allowed`
      };
    }

    return {
      disabled: false,
      text: 'Respond',
      className: buttonWarning
    };
  };

  const handleRespond = (incident) => {
    if (incident.status === 'In Progress') {
      toast.warning(`This incident is already being handled by ${incident.responderName}`);
      return;
    }

    if (hasActiveResponse) {
      toast.error('You already have an active incident response');
      return;
    }

    toast.info(
      <div>
        <p className="font-medium mb-2">Respond to this incident?</p>
        <p className="text-sm mb-3">You will be assigned as the primary responder to this incident.</p>
        <div className="flex justify-end mt-2 space-x-3">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className={`${isDarkMode ? 'bg-green-600 hover:bg-green-700' : 'bg-green-500 hover:bg-green-600'} text-white px-4 py-1.5 rounded-lg flex items-center`}
            onClick={async () => {
              toast.dismiss();
              try {
                const token = localStorage.getItem('token');
                const userId = localStorage.getItem('userId');
                
                if (!token || !userId) {
                  toast.error('Authentication required');
                  return;
                }

                const currentStatus = await axios.get(
                  `${process.env.REACT_APP_API_URL}/incident-reports/${incident._id}/details`,
                  { headers: { Authorization: `Bearer ${token}` } }
                );

                if (currentStatus.data.status === 'In Progress') {
                  toast.warning(`This incident is already being handled by ${currentStatus.data.responderName}`);
                  return;
                }

                const response = await axios.put(
                  `${process.env.REACT_APP_API_URL}/incident-reports/${incident._id}/status`,
                  { 
                    status: 'In Progress',
                    userId: userId
                  },
                  { 
                    headers: { 
                      Authorization: `Bearer ${token}`,
                      'Content-Type': 'application/json'
                    } 
                  }
                );

                if (response.data) {
                  const updatedIncident = response.data;
                  setSelectedIncidentForResponse(updatedIncident);
                  setHasActiveResponse(true);
                  toast.success(`You are now responding to: ${updatedIncident.type}`);
                  setShowReportedIncidents(false);
                  
                  setIncidentLog(prevLog => 
                    prevLog.map(item => 
                      item._id === incident._id ? updatedIncident : item
                    )
                  );
                }
              } catch (error) {
                console.error('Error updating incident status:', error);
                toast.error('Failed to update incident status. Please try again.');
              }
            }}
          >
            <FaCheckCircle className="mr-2" /> Yes, Respond
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className={`${isDarkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-300 hover:bg-gray-400'} text-white px-4 py-1.5 rounded-lg flex items-center`}
            onClick={() => toast.dismiss()}
          >
            <FaTimes className="mr-2" /> Cancel
          </motion.button>
        </div>
      </div>,
      {
        autoClose: false,
        closeOnClick: false,
      }
    );
  };

  // Filter incidents based on search and status filter
  const filteredIncidents = incidentLog.filter(incident => {
    const matchesSearch = !searchQuery || 
      incident.type.toLowerCase().includes(searchQuery.toLowerCase()) || 
      (incident.description && incident.description.toLowerCase().includes(searchQuery.toLowerCase()));
      
    const matchesStatus = statusFilter === "all" || 
      (statusFilter === "pending" && incident.status === "Pending") ||
      (statusFilter === "inProgress" && incident.status === "In Progress");
      
    return matchesSearch && matchesStatus;
  });

  // Incident card component for mobile view
  const IncidentCard = ({ incident, index }) => {
    const isEmergency = incident.incidentClassification === 'Emergency Incident';
    const responseState = getResponseButtonState(incident);
    
    return (
      <motion.div 
        variants={tableRowVariants}
        initial="hidden"
        animate="visible"
        custom={index}
        className={`${cardBg} rounded-lg overflow-hidden shadow-md border ${borderColor} mb-3`}
      >
        <div className={`py-2 px-4 flex justify-between items-center ${
          isEmergency 
            ? (isDarkMode ? 'bg-red-900/40' : 'bg-red-100') 
            : (isDarkMode ? 'bg-blue-900/30' : 'bg-blue-50')
        } border-b ${borderColor}`}
        >
          <div className="flex items-center">
            {isEmergency ? 
              <FaExclamationTriangle className={`mr-2 ${isDarkMode ? 'text-red-400' : 'text-red-500'}`} /> : 
              <FaInfoCircle className={`mr-2 ${isDarkMode ? 'text-blue-400' : 'text-blue-500'}`} />
            }
            <h3 className={`font-medium ${textColor}`}>{incident.type}</h3>
          </div>
          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
            incident.status === 'Pending' 
              ? isDarkMode ? 'bg-yellow-900/40 text-yellow-300' : 'bg-yellow-100 text-yellow-800'
              : incident.status === 'In Progress' 
                ? isDarkMode ? 'bg-blue-900/40 text-blue-300' : 'bg-blue-100 text-blue-800'
                : isDarkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-800'
          }`}>
            {incident.status}
          </span>
        </div>
        
        <div className="p-4">
          <div className="mb-3 flex items-start space-x-2">
            <FaCalendarAlt className={`mt-0.5 ${subTextColor} flex-shrink-0`} />
            <div>
              <p className={`text-xs font-medium ${subTextColor}`}>Date</p>
              <p className={`${textColor}`}>{formatDate(incident.date)}</p>
            </div>
          </div>

          {/* Add address information if available */}
          {incident.address && (
            <div className="mb-3 flex items-start space-x-2">
              <FaMapMarkerAlt className={`mt-0.5 ${subTextColor} flex-shrink-0`} />
              <div>
                <p className={`text-xs font-medium ${subTextColor}`}>Address</p>
                <p className={`${textColor} text-sm`}>{incident.address}</p>
              </div>
            </div>
          )}

          {/* Classification section remains unchanged */}
          <div className="mb-3 flex items-start space-x-2">
            {isEmergency ? 
              <FaExclamationTriangle className={`mt-0.5 ${isDarkMode ? 'text-red-400' : 'text-red-500'} flex-shrink-0`} /> : 
              <FaInfoCircle className={`mt-0.5 ${isDarkMode ? 'text-blue-400' : 'text-blue-500'} flex-shrink-0`} />
            }
            <div>
              <p className={`text-xs font-medium ${subTextColor}`}>Classification</p>
              <p className={`${
                isEmergency 
                  ? isDarkMode ? 'text-red-400' : 'text-red-600' 
                  : isDarkMode ? 'text-blue-400' : 'text-blue-600'
              } font-medium`}>
                {isEmergency ? 'Emergency' : 'Normal'}
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-2 mt-4">
            <motion.button
              variants={buttonVariants}
              whileHover="hover"
              whileTap="tap"
              onClick={() => handleViewDetails(incident)}
              className={`${buttonPrimary} text-white flex-1 py-2 px-3 rounded-lg flex items-center justify-center text-sm`}
            >
              <FaEye className="mr-1.5" /> Details
            </motion.button>
            
            <motion.button
              variants={buttonVariants}
              whileHover="hover"
              whileTap="tap"
              onClick={() => handleToggleLocation(incident)}
              className={`${
                visibleLocations[incident._id] 
                  ? isDarkMode ? 'bg-red-600 hover:bg-red-700' : 'bg-red-500 hover:bg-red-600'
                  : buttonSuccess
              } text-white flex-1 py-2 px-3 rounded-lg flex items-center justify-center text-sm`}
            >
              <FaMapMarked className="mr-1.5" /> 
              {visibleLocations[incident._id] ? 'Hide Location' : 'Show Location'}
            </motion.button>
            
            <motion.button
              variants={buttonVariants}
              whileHover={!responseState.disabled && "hover"}
              whileTap={!responseState.disabled && "tap"}
              onClick={() => !responseState.disabled && handleRespond(incident)}
              className={`text-white flex-1 py-2 px-3 rounded-lg flex items-center justify-center text-sm ${responseState.className}`}
              disabled={responseState.disabled}
            >
              <FaStreetView className="mr-1.5" /> {responseState.text}
            </motion.button>
          </div>
        </div>
      </motion.div>
    );
  };

  // Loading skeleton for mobile and desktop
  const LoadingSkeleton = () => (
    <div className="animate-pulse">
      <div className={`h-12 ${isDarkMode ? 'bg-gray-700' : 'bg-gray-200'} rounded mb-4`}></div>
      <div className="space-y-3">
        {[...Array(3)].map((_, i) => (
          <div key={i} className={`h-24 ${isDarkMode ? 'bg-gray-700' : 'bg-gray-200'} rounded`}></div>
        ))}
      </div>
    </div>
  );

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm z-[1050] flex items-center justify-center p-4"
      style={{ touchAction: 'none' }}
      onTouchMove={(e) => e.stopPropagation()}
      onClick={(e) => e.stopPropagation()}
    >
      <motion.div 
        variants={modalVariants}
        initial="hidden"
        animate="visible"
        exit="exit"
        className={`w-full max-w-3xl rounded-xl shadow-2xl overflow-hidden ${cardBg} border ${borderColor}`}
        onClick={(e) => e.stopPropagation()}
        onTouchMove={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className={`px-6 py-4 border-b ${borderColor} flex justify-between items-center`}>
          <div className="flex items-center">
            <FaExclamationCircle className={`mr-3 text-2xl ${
              isDarkMode ? 'text-yellow-400' : 'text-yellow-600'
            }`} />
            <h2 className={`text-xl font-bold ${textColor}`}>Reported Incidents</h2>
          </div>
          <div className="flex items-center space-x-2">
            <motion.button
              variants={buttonVariants}
              whileHover="hover"
              whileTap="tap"
              onClick={() => setShowFilters(!showFilters)}
              className={`hidden sm:flex items-center px-3 py-1.5 rounded-lg ${buttonSecondary} ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}
            >
              <FaFilter className="mr-1.5" /> Filters
            </motion.button>
            <motion.button
              variants={buttonVariants}
              whileHover="hover"
              whileTap="tap"
              onClick={() => setShowReportedIncidents(false)}
              className={`${buttonDanger} text-white p-1.5 rounded-lg`}
            >
              <FaTimes />
            </motion.button>
          </div>
        </div>
        
        {/* Filter section (expandable) */}
        <AnimatePresence>
          {showFilters && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className={`px-6 py-3 border-b ${borderColor}`}>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="flex flex-col space-y-1">
                    <label className={`text-sm font-medium ${subTextColor}`}>Search</label>
                    <div className="relative">
                      <FaSearch className="absolute left-3 top-2.5 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Search by name or description..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className={`w-full pl-9 pr-3 py-2 border ${inputBorder} rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${inputBg} ${inputText}`}
                      />
                    </div>
                  </div>
                  
                  <div className="flex flex-col space-y-1">
                    <label className={`text-sm font-medium ${subTextColor}`}>Status</label>
                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      className={`w-full px-3 py-2 border ${inputBorder} rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${inputBg} ${inputText}`}
                    >
                      <option value="all">All Status</option>
                      <option value="pending">Pending</option>
                      <option value="inProgress">In Progress</option>
                    </select>
                  </div>
                  
                  <div className="flex flex-col space-y-1">
                    <label className={`text-sm font-medium ${subTextColor}`}>Map Visibility</label>
                    <motion.button
                      variants={buttonVariants}
                      whileHover="hover"
                      whileTap="tap"
                      onClick={handleToggleAllLocations}
                      className={`w-full py-2 px-3 rounded-lg text-white ${
                        showAllLocations ? buttonDanger : buttonSuccess
                      }`}
                    >
                      {showAllLocations ? 'Hide All Locations' : 'Show All Locations'}
                    </motion.button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Mobile filter toggle (visible only on small screens) */}
        <div className="sm:hidden px-6 py-2 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
          <motion.button
            variants={buttonVariants}
            whileHover="hover"
            whileTap="tap"
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center px-3 py-1.5 rounded-lg ${buttonSecondary}`}
          >
            {showFilters ? (
              <><FaTimes className="mr-1.5" /> Hide Filters</>
            ) : (
              <><FaFilter className="mr-1.5" /> Show Filters</>
            )}
          </motion.button>
          
          <motion.button
            variants={buttonVariants}
            whileHover="hover"
            whileTap="tap"
            onClick={handleToggleAllLocations}
            className={`flex items-center px-3 py-1.5 rounded-lg text-white ${
              showAllLocations ? buttonDanger : buttonSuccess
            }`}
          >
            {showAllLocations ? 'Hide Map' : 'Show Map'}
          </motion.button>
        </div>

        {/* Content area */}
        <div 
          className="p-6 max-h-[70vh] overflow-y-auto"
          style={{ touchAction: 'pan-y' }}
          onTouchMove={(e) => e.stopPropagation()}
        >
          {loading ? (
            <LoadingSkeleton />
          ) : filteredIncidents.length === 0 ? (
            <motion.div
              variants={itemVariants}
              className="text-center py-8"
            >
              <FaExclamationCircle className={`text-5xl mx-auto mb-4 ${subTextColor}`} />
              <p className={`text-lg font-medium ${textColor}`}>No incidents found</p>
              <p className={`mt-1 ${subTextColor}`}>Try adjusting your filters or check back later</p>
            </motion.div>
          ) : (
            <>
              {/* Desktop view */}
              <div className="hidden md:block">
                <table className={`w-full border-collapse`}>
                  <thead className={`${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'} border-b ${borderColor}`}>
                    <tr>
                      <th className={`py-3 px-4 text-left text-sm font-medium ${subTextColor}`}>Incident</th>
                      <th className={`py-3 px-4 text-left text-sm font-medium ${subTextColor}`}>Date</th>
                      <th className={`py-3 px-4 text-left text-sm font-medium ${subTextColor}`}>Status</th>
                      <th className={`py-3 px-4 text-left text-sm font-medium ${subTextColor}`}>Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {filteredIncidents.map((incident, index) => {
                      const responseState = getResponseButtonState(incident);
                      
                      return (
                        <motion.tr 
                          key={incident._id}
                          variants={tableRowVariants}
                          initial="hidden"
                          animate="visible"
                          exit="hidden"
                          custom={index}
                          className={`border-b ${borderColor} hover:${isDarkMode ? 'bg-gray-700/40' : 'bg-gray-50'}`}
                        >
                          <td className={`py-3 px-4 ${textColor}`}>
                            <div className="flex items-center">
                              {incident.incidentClassification === 'Emergency Incident' ? (
                                <FaExclamationTriangle className={`mr-2 ${isDarkMode ? 'text-red-400' : 'text-red-500'}`} />
                              ) : (
                                <FaInfoCircle className={`mr-2 ${isDarkMode ? 'text-blue-400' : 'text-blue-500'}`} />
                              )}
                              <span>{incident.type}</span>
                            </div>
                          </td>
                          <td className={`py-3 px-4 ${textColor}`}>{formatDate(incident.date)}</td>
                          <td className={`py-3 px-4`}>
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              incident.status === 'Pending' 
                                ? isDarkMode ? 'bg-yellow-900/40 text-yellow-300' : 'bg-yellow-100 text-yellow-800'
                                : incident.status === 'In Progress' 
                                  ? isDarkMode ? 'bg-blue-900/40 text-blue-300' : 'bg-blue-100 text-blue-800'
                                  : isDarkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-800'
                            }`}>
                              {incident.status}
                            </span>
                          </td>
                          <td className={`py-3 px-4`}>
                            <div className="flex items-center space-x-2">
                              <motion.button
                                variants={buttonVariants}
                                whileHover="hover"
                                whileTap="tap"
                                onClick={() => handleViewDetails(incident)}
                                className={`${buttonPrimary} text-white py-1 px-3 rounded-lg text-sm flex items-center`}
                              >
                                <FaEye className="mr-1.5" /> Details
                              </motion.button>
                              
                              <motion.button
                                variants={buttonVariants}
                                whileHover="hover"
                                whileTap="tap"
                                onClick={() => handleToggleLocation(incident)}
                                className={`${
                                  visibleLocations[incident._id] 
                                    ? isDarkMode ? 'bg-red-600 hover:bg-red-700' : 'bg-red-500 hover:bg-red-600'
                                    : buttonSuccess
                                } text-white py-1 px-3 rounded-lg text-sm flex items-center`}
                              >
                                <FaMapMarked className="mr-1.5" /> 
                                {visibleLocations[incident._id] ? 'Hide' : 'Show'}
                              </motion.button>
                              
                              <motion.button
                                variants={buttonVariants}
                                whileHover={!responseState.disabled && "hover"}
                                whileTap={!responseState.disabled && "tap"}
                                onClick={() => !responseState.disabled && handleRespond(incident)}
                                className={`py-1 px-3 rounded-lg text-sm text-white flex items-center ${responseState.className}`}
                                disabled={responseState.disabled}
                              >
                                <FaStreetView className="mr-1.5" /> {responseState.text}
                              </motion.button>
                            </div>
                          </td>
                        </motion.tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              
              {/* Mobile view */}
              <motion.div 
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className="md:hidden"
              >
                {filteredIncidents.map((incident, index) => (
                  <IncidentCard 
                    key={incident._id} 
                    incident={incident}
                    index={index}
                  />
                ))}
              </motion.div>
            </>
          )}
        </div>
      </motion.div>

      {/* Incident Details Modal */}
      <AnimatePresence>
        {selectedIncidentState && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center z-[1060]"
            style={{ touchAction: 'none' }}
            onTouchMove={(e) => e.stopPropagation()}
            onClick={(e) => {
              e.stopPropagation();
              setSelectedIncidentState(null);
            }}
          >
            <motion.div 
              variants={modalVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className={`w-11/12 max-w-lg rounded-xl shadow-xl overflow-hidden ${cardBg} border ${borderColor}`}
              onClick={(e) => e.stopPropagation()}
              onTouchMove={(e) => e.stopPropagation()}
            >
              {/* Modal header */}
              <div className={`px-6 py-4 border-b ${borderColor} flex justify-between items-center ${
                selectedIncidentState.incidentClassification === 'Emergency Incident'
                  ? isDarkMode ? 'bg-red-900/30' : 'bg-red-50'
                  : isDarkMode ? 'bg-blue-900/20' : 'bg-blue-50'
              }`}>
                <div className="flex items-center">
                  {selectedIncidentState.incidentClassification === 'Emergency Incident' ? (
                    <FaExclamationTriangle className={`mr-2 text-lg ${isDarkMode ? 'text-red-400' : 'text-red-500'}`} />
                  ) : (
                    <FaInfoCircle className={`mr-2 text-lg ${isDarkMode ? 'text-blue-400' : 'text-blue-500'}`} />
                  )}
                  <h3 className={`font-bold ${textColor}`}>Incident Details</h3>
                </div>
                <motion.button
                  variants={buttonVariants}
                  whileHover="hover"
                  whileTap="tap"
                  onClick={() => setSelectedIncidentState(null)}
                  className={`p-1 rounded-full ${
                    isDarkMode ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-200 text-gray-600'
                  }`}
                >
                  <FaTimes />
                </motion.button>
              </div>

              {/* Modal body - fixed display of incident details */}
              <div className="p-6">
                <div className="space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <div className="flex items-start mb-3">
                        <FaExclamationCircle className={`mt-1 mr-2 ${subTextColor}`} />
                        <div>
                          <p className={`text-xs font-medium ${subTextColor}`}>Incident Type</p>
                          <p className={textColor}>{selectedIncidentState.type}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-start mb-3">
                        <FaUser className={`mt-1 mr-2 ${subTextColor}`} />
                        <div>
                          <p className={`text-xs font-medium ${subTextColor}`}>Reported By</p>
                          <p className={textColor}>{selectedIncidentState.fullName || 'Anonymous'}</p>
                        </div>
                      </div>
                    </div>
                    
                    <div>
                      <div className="flex items-start mb-3">
                        <FaCalendarAlt className={`mt-1 mr-2 ${subTextColor}`} />
                        <div>
                          <p className={`text-xs font-medium ${subTextColor}`}>Date</p>
                          <p className={textColor}>{formatDate(selectedIncidentState.date)}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-start mb-3">
                        <FaClock className={`mt-1 mr-2 ${subTextColor}`} />
                        <div>
                          <p className={`text-xs font-medium ${subTextColor}`}>Time</p>
                          <p className={textColor}>{selectedIncidentState.time || 'Not specified'}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-start mb-3">
                    <FaPhoneAlt className={`mt-1 mr-2 ${subTextColor}`} />
                    <div>
                      <p className={`text-xs font-medium ${subTextColor}`}>Contact</p>
                      <p className={textColor}>{selectedIncidentState.contactNumber || 'Not provided'}</p>
                    </div>
                  </div>

                  <div className="flex items-start mb-3">
                    <FaMapMarkerAlt className={`mt-1 mr-2 ${subTextColor}`} />
                    <div>
                      <p className={`text-xs font-medium ${subTextColor}`}>Location</p>
                      {selectedIncidentState.address ? (
                        <p className={textColor}>{selectedIncidentState.address}</p>
                      ) : (
                        <p className={textColor}>{selectedIncidentState.location}</p>
                      )}
                      
                      {selectedIncidentState.locationNote && (
                        <div className="mt-2">
                          <p className={`text-xs font-medium ${subTextColor}`}>Location Note</p>
                          <p className={`text-sm ${textColor}`}>{selectedIncidentState.locationNote}</p>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-start">
                    <FaInfoCircle className={`mt-1 mr-2 ${subTextColor}`} />
                    <div>
                      <p className={`text-xs font-medium ${subTextColor}`}>Description</p>
                      <p className={textColor}>{selectedIncidentState.description || 'No description provided'}</p>
                    </div>
                  </div>
                </div>

                {/* Action buttons */}
                <div className="flex justify-end space-x-3 mt-6">
                  {/* Toggle location on map button */}
                  <motion.button
                    variants={buttonVariants}
                    whileHover="hover"
                    whileTap="tap"
                    onClick={() => {
                      handleToggleLocation(selectedIncidentState);
                      handleCloseDetails();
                    }}
                    className={`py-2 px-4 rounded-lg ${
                      visibleLocations[selectedIncidentState._id] 
                        ? isDarkMode ? 'bg-red-600 hover:bg-red-700' : 'bg-red-500 hover:bg-red-600'
                        : buttonSuccess
                    } text-white flex items-center text-sm`}
                  >
                    <FaMapMarked className="mr-1.5" />
                    {visibleLocations[selectedIncidentState._id] ? 'Hide on Map' : 'Show on Map'}
                  </motion.button>
                  
                  <motion.button
                    variants={buttonVariants}
                    whileHover="hover"
                    whileTap="tap"
                    onClick={handleCloseDetails}
                    className={`py-2 px-4 rounded-lg ${buttonSecondary} flex items-center text-sm`}
                  >
                    <FaArrowLeft className="mr-1.5" /> Back
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default ViewReportedIncidents;


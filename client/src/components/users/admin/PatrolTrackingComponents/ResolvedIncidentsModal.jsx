import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { motion, AnimatePresence } from 'framer-motion';
import { MapContainer, TileLayer, Marker, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useTheme } from '../../../../contexts/ThemeContext';
import {
  RiCloseLine,
  RiMapPin2Line,
  RiCheckboxCircleLine,
  RiInformationLine,
  RiCalendarCheckLine,
  RiUserLine,
  RiFileTextLine,
  RiTimeLine,
  RiPhoneLine,
  RiAlertLine,
  RiSearchLine,
  RiFilterLine,
  RiDeleteBin7Line,
  RiFileDownloadLine
} from 'react-icons/ri';
import { FaExclamationTriangle, FaSearch, FaSearchMinus, FaMapMarkerAlt, FaCalendarAlt, FaClock, FaFileAlt, FaUser, FaPhone, FaUserShield, FaClipboardCheck, FaCheckCircle, FaFilePdf } from 'react-icons/fa';
import PasswordVerificationModal from '../../admin/PersonelsComponents/PasswordVerificationModal';
import PDFPasswordModal from '../../admin/PersonelsComponents/PDFPasswordModal';
import { createAndDownloadProtectedZip } from '../../../../utils/zipUtils';
import ResolvedIncidentReportPreview from './ResolvedIncidentReportPreview';

// Animation variants
const modalVariants = {
  hidden: {
    opacity: 0,
    scale: 0.8, 
    y: 50
  },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      type: "spring",
      stiffness: 400,
      damping: 30
    }
  },
  exit: {
    opacity: 0,
    scale: 0.9,
    transition: {
      duration: 0.2
    }
  }
};

const contentVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      type: "spring",
      stiffness: 300,
      damping: 25
    }
  }
};

const buttonVariants = {
  hover: { scale: 1.05 },
  tap: { scale: 0.95 }
};

// Map component to handle marker creation and updates
const MapComponent = ({ incident }) => {
  const map = useMap();
  const markerRef = useRef(null);

  React.useEffect(() => {
    if (incident) {
      const match = incident.location.match(/Lat:\s*([0-9.-]+),\s*Lon:\s*([0-9.-]+)/);
      if (match) {
        const [_, lat, lng] = match.map(Number);
        
        // Use the same marker style as PatrolTracking.jsx
        const icon = L.divIcon({
          className: 'custom-icon',
          html: `<div style="position: relative; width: 36px; height: 36px;">
                  <div style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; 
                       border-radius: 50%; 
                       background-color: ${incident.incidentClassification === 'Emergency Incident' ? 'rgba(255, 0, 0, 0.5)' : 'rgba(0, 0, 255, 0.5)'}; 
                       animation: pulse 1.5s infinite;"></div>
                  <div style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; 
                       display: flex; align-items: center; justify-content: center;">
                    ${incident.incidentClassification === 'Emergency Incident'
                      ? '<i class="fas fa-exclamation-triangle" style="color: red; font-size: 20px;"></i>'
                      : '<i class="fas fa-info-circle" style="color: blue; font-size: 20px;"></i>'}
                  </div>
                </div>
                <style>
                  @keyframes pulse {
                    0% { transform: scale(0.5); opacity: 1; }
                    100% { transform: scale(2); opacity: 0; }
                  }
                </style>`,
          iconSize: [36, 36],
          iconAnchor: [18, 18]
        });

        // Remove existing marker if any
        if (markerRef.current) {
          markerRef.current.remove();
        }

        // Create and add new marker
        const marker = L.marker([lat, lng], { icon }).addTo(map);
        markerRef.current = marker;

        // Center map on marker
        map.setView([lat, lng], 15);
      }
    }

    // Cleanup on unmount
    return () => {
      if (markerRef.current) {
        markerRef.current.remove();
      }
    };
  }, [incident, map]);

  return null;
};

const ResolvedIncidentsModal = ({ isOpen, onClose, resolvedIncidents }) => {
  const { isDarkMode } = useTheme();
  const [selectedIncident, setSelectedIncident] = useState(null);
  const [showDetails, setShowDetails] = useState(false);
  const [showMap, setShowMap] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [assistanceRequests, setAssistanceRequests] = useState({});
  const [showAssistanceDetails, setShowAssistanceDetails] = useState(false);
  const [selectedAssistance, setSelectedAssistance] = useState(null);
  const [friendlyLocation, setFriendlyLocation] = useState('');
  const [activeTab, setActiveTab] = useState('details'); // 'details' or 'map'
  const [mobileView, setMobileView] = useState(window.innerWidth < 768);
  const [falseAlarms, setFalseAlarms] = useState([]); // Add state for false alarms
  const [viewType, setViewType] = useState('resolved'); // 'resolved' or 'falseAlarm'
  const [loading, setLoading] = useState(false); // Add loading state
  // Add new state variables for report generation
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showReportPreview, setShowReportPreview] = useState(false);
  const [showPdfPasswordModal, setShowPdfPasswordModal] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      setMobileView(window.innerWidth < 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  const handleViewDetails = (incident) => {
    setSelectedIncident(incident);
    setShowDetails(true);
    setShowMap(false);
    if (mobileView) {
      setActiveTab('details');
    }
  };

  const handleViewLocation = (incident) => {
    setSelectedIncident(incident);
    setShowDetails(false);
    setShowMap(true);
    if (mobileView) {
      setActiveTab('map');
    }
  };

  // Fetch false alarms when the modal opens
  const fetchFalseAlarms = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `${process.env.REACT_APP_API_URL}/false-alarms`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setFalseAlarms(response.data);
    } catch (error) {
      console.error('Error fetching false alarms:', error);
      toast.error('Failed to load false alarm records');
    } finally {
      setLoading(false);
    }
  };

  // Add this new function to filter incidents based on view type
  const filteredIncidents = (viewType === 'resolved' ? resolvedIncidents : falseAlarms).filter(incident => {
    // Common filter logic for both resolved incidents and false alarms
    const matchesSearch = 
      !searchTerm ||
      incident.type?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      incident.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      incident.incidentClassification?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesDate = 
      !dateFilter || 
      (incident.date && new Date(incident.date).toLocaleDateString() === new Date(dateFilter).toLocaleDateString());
    
    const matchesType = 
      typeFilter === 'all' || 
      (typeFilter === 'emergency' && incident.incidentClassification === 'Emergency Incident') ||
      (typeFilter === 'normal' && incident.incidentClassification !== 'Emergency Incident');
    
    return matchesSearch && matchesDate && matchesType;
  });

  const handleClose = () => {
    setSelectedIncident(null);
    setShowDetails(false);
    setShowMap(false);
    onClose();
  };

  const fetchAssistanceRequests = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `${process.env.REACT_APP_API_URL}/assistance-requests`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const requests = {};
      response.data.forEach(request => {
        const incidentId = request.incidentId._id || request.incidentId;
        requests[incidentId] = request;
      });
      setAssistanceRequests(requests);
    } catch (error) {
      console.error('Error fetching assistance requests:', error);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchAssistanceRequests();
      fetchFalseAlarms(); // Fetch false alarms when modal opens
    }
  }, [isOpen]);

  useEffect(() => {
    if (selectedIncident) {
      // Use address field if available, otherwise use location
      const friendly = selectedIncident.address || selectedIncident.location;
      setFriendlyLocation(friendly);
    }
  }, [selectedIncident]);

  const reverseGeocode = async (location) => {
    return location;
  };

  const renderAssistanceStatus = (status) => {
    const statusColors = {
      'Pending': isDarkMode ? 'text-yellow-400' : 'text-yellow-600',
      'Processing': isDarkMode ? 'text-blue-400' : 'text-blue-600',
      'Deployed': isDarkMode ? 'text-indigo-400' : 'text-indigo-600',
      'Rejected': isDarkMode ? 'text-red-400' : 'text-red-600',
      'Completed': isDarkMode ? 'text-green-400' : 'text-green-600'
    };
    return statusColors[status] || (isDarkMode ? 'text-gray-300' : 'text-gray-600');
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'Resolved':
        return isDarkMode ? 'bg-green-900 text-green-200' : 'bg-green-100 text-green-800';
      case 'In Progress':
        return isDarkMode ? 'bg-blue-900 text-blue-200' : 'bg-blue-100 text-blue-800';
      case 'Pending':
        return isDarkMode ? 'bg-yellow-900 text-yellow-200' : 'bg-yellow-100 text-yellow-800';
      default:
        return isDarkMode ? 'bg-gray-800 text-gray-200' : 'bg-gray-100 text-gray-800';
    }
  };

  const getIncidentTypeBadgeClass = (type) => {
    return type === 'Emergency Incident'
      ? isDarkMode ? 'bg-red-900 text-red-200' : 'bg-red-100 text-red-800'
      : isDarkMode ? 'bg-blue-900 text-blue-200' : 'bg-blue-100 text-blue-800';
  };

  const AssistanceDetailsModal = ({ details, onClose }) => {
    const renderStatusContent = () => {
      switch (details.status) {
        case 'Rejected':
          return (
            <div>
              <h4 className="font-semibold mb-2">Rejection Details</h4>
              {details.rejectedDetails?.map((detail, index) => (
                <div key={index} className="bg-red-50 p-3 rounded-lg mb-3 border border-red-200">
                  <p><strong>Department:</strong> {detail.department}</p>
                  <p><strong>Rejected By:</strong> {detail.rejectorName}</p>
                  <p><strong>Date/Time:</strong> {new Date(detail.rejectedDateTime).toLocaleString()}</p>
                  <p><strong>Reason:</strong> {detail.reason}</p>
                  <p><strong>Notes:</strong> {detail.notes || 'N/A'}</p>
                </div>
              ))}
            </div>
          );

        case 'Processing':
        case 'Deployed':
        case 'Completed':
          return (
            <>
              <div>
                <h4 className="font-semibold mb-2">Approval History</h4>
                {details.approvedDetails?.map((detail, index) => (
                  <div key={index} className="bg-blue-50 p-3 rounded-lg mb-3 border border-blue-200 text-black">
                    <p><strong>Department:</strong> {detail.department}</p>
                    <p><strong>Approved By:</strong> {detail.approverName}</p>
                    <p><strong>Date/Time:</strong> {new Date(detail.approvedDateTime).toLocaleString()}</p>
                    <p><strong>Notes:</strong> {detail.notes || 'N/A'}</p>
                  </div>
                ))}
              </div>
              {details.responderDetails?.length > 0 && (
                <div className="mt-4">
                  <h4 className="font-semibold mb-2">Responder Details</h4>
                  {details.responderDetails.map((responder, index) => (
                    <div key={index} className="bg-green-50 p-3 rounded-lg mb-3 border border-green-200 text-black">
                      <p><strong>Department:</strong> {responder.department}</p>
                      <p><strong>Responder Name:</strong> {responder.responderName}</p>
                      <p><strong>Contact:</strong> {responder.responderContact || 'N/A'}</p>
                      <p><strong>Address:</strong> {responder.responderAddress || 'N/A'}</p>
                      <p><strong>Type:</strong> {responder.responderType || 'N/A'}</p>
                      <p><strong>Response Time:</strong> {new Date(responder.responseDateTime).toLocaleString()}</p>
                    </div>
                  ))}
                </div>
              )}
            </>
          );

        default:
          return null;
      }
    };

    return (
      <AnimatePresence>
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black bg-opacity-50 z-[4000] flex items-center justify-center"
          onClick={onClose}
        >
          <motion.div 
            variants={modalVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className={`${isDarkMode ? 'bg-gray-800 text-gray-100' : 'bg-white text-gray-800'} p-6 rounded-xl shadow-2xl w-11/12 max-w-lg relative`}
            onClick={e => e.stopPropagation()}
          >
            <h3 className="text-xl font-bold mb-4 flex items-center">
              <RiInformationLine className={`mr-2 ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`} size={24} />
              Assistance Request Details
            </h3>
            <motion.button
              variants={buttonVariants}
              whileHover="hover"
              whileTap="tap"
              onClick={onClose}
              className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
            >
              <RiCloseLine size={24} />
            </motion.button>
            <motion.div 
              variants={contentVariants}
              initial="hidden"
              animate="visible"
              className="space-y-4 mt-6"
            >
              <motion.div variants={itemVariants} className="flex items-center mb-4">
                <span className="font-semibold text-lg mr-3">Status:</span> 
                <span className={`px-3 py-1 rounded-full font-medium ${renderAssistanceStatus(details.status)}`}>
                  {details.status}
                </span>
              </motion.div>
              {renderStatusContent()}
            </motion.div>
          </motion.div>
        </motion.div>
      </AnimatePresence>
    );
  };

  const renderIncidentDetails = () => {
    if (!selectedIncident) return null;

    const assistanceRequest = assistanceRequests[selectedIncident._id];

    const commonDetails = (
      <motion.div 
        initial={{ opacity: 0, y: 20 }} 
        animate={{ opacity: 1, y: 0 }}
        className={`p-6 rounded-xl ${isDarkMode ? 'bg-gray-800' : 'bg-white'} shadow-lg overflow-y-auto`}
        style={{ maxHeight: mobileView ? 'calc(100vh - 240px)' : '100%' }}
      >
        <div className="space-y-6">
          {/* Incident type and classification */}
          <div>
            <h3 className={`text-xl font-bold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
              {selectedIncident.type}
            </h3>
            <span className={getIncidentTypeBadgeClass(selectedIncident.incidentClassification)}>
              {selectedIncident.incidentClassification || 'Normal Incident'}
            </span>
            
            {/* Show false alarm marker if we're viewing a false alarm */}
            {viewType === 'falseAlarm' && (
              <div className={`mt-3 p-2 rounded-lg ${
                isDarkMode ? 'bg-orange-900 bg-opacity-30 text-orange-300' : 'bg-orange-100 text-orange-800'
              }`}>
                <div className="flex items-center">
                  <FaExclamationTriangle className="mr-2" />
                  <span className="font-semibold">Marked as False Alarm</span>
                </div>
                {selectedIncident.markedByUser && (
                  <div className={`mt-1 text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    by {selectedIncident.markedByUser.firstName} {selectedIncident.markedByUser.lastName} 
                    {selectedIncident.markedAt && ` on ${formatDate(selectedIncident.markedAt)}`}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Location */}
          <DetailItem 
            icon={<FaMapMarkerAlt />} 
            label="Location" 
            value={friendlyLocation || selectedIncident.location}
          />

          {/* Date and Time */}
          <div className="grid grid-cols-2 gap-4">
            <DetailItem 
              icon={<FaCalendarAlt />} 
              label="Date" 
              value={formatDate(selectedIncident.date).split(',')[0]}
            />
            <DetailItem 
              icon={<FaClock />} 
              label="Time" 
              value={selectedIncident.time || 'Not specified'}
            />
          </div>

          {/* Description */}
          <DetailItem 
            icon={<FaFileAlt />} 
            label="Description" 
            value={selectedIncident.description || 'No description provided'} 
            fullWidth={true}
          />

          {/* Reporter Information if available */}
          {selectedIncident.fullName && (
            <div className="space-y-3">
              <h4 className={`font-semibold ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Reporter Information</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <DetailItem 
                  icon={<FaUser />} 
                  label="Name" 
                  value={selectedIncident.fullName}
                />
                {selectedIncident.contactNumber && (
                  <DetailItem 
                    icon={<FaPhone />} 
                    label="Contact" 
                    value={selectedIncident.contactNumber}
                  />
                )}
              </div>
            </div>
          )}
        </div>
      </motion.div>
    );

    // Additional details specific to resolved incidents
    if (viewType === 'resolved') {
      return (
        <>
          {commonDetails}
          {selectedIncident.resolvedAt && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className={`mt-4 p-6 rounded-xl ${isDarkMode ? 'bg-green-900 bg-opacity-20' : 'bg-green-50'} border ${isDarkMode ? 'border-green-800' : 'border-green-200'}`}
            >
              <h3 className={`text-lg font-semibold mb-3 ${isDarkMode ? 'text-green-300' : 'text-green-800'}`}>Resolution Details</h3>
              <div className="space-y-4">
                <DetailItem
                  icon={<FaCheckCircle />}
                  label="Resolved Date"
                  value={formatDate(selectedIncident.resolvedAt)}
                  theme="success"
                />
                {selectedIncident.resolvedByFullName && (
                  <DetailItem
                    icon={<FaUserShield />}
                    label="Resolved By"
                    value={selectedIncident.resolvedByFullName}
                    theme="success"
                  />
                )}
                {selectedIncident.log && (
                  <DetailItem
                    icon={<FaClipboardCheck />}
                    label="Resolution Notes"
                    value={selectedIncident.log}
                    theme="success"
                    fullWidth={true}
                  />
                )}
              </div>
            </motion.div>
          )}
        </>
      );
    }
    
    // Just return common details for false alarms
    return commonDetails;
  };

  const renderMap = () => {
    if (!selectedIncident) return null;

    return (
      <motion.div 
        variants={contentVariants}
        initial="hidden"
        animate="visible"
        className={`w-full ${mobileView ? '' : 'md:w-1/2'} pl-0 ${mobileView ? 'mt-4' : 'md:pl-6'} flex-shrink-0`}
      >
        <motion.div 
          variants={itemVariants}
          className={`${
            isDarkMode 
              ? 'bg-gray-800 border border-gray-700' 
              : 'bg-white border border-gray-100 shadow-lg'
          } rounded-2xl overflow-hidden h-full`}
        >
          {/* Header */}
          <div className={`p-4 flex justify-between items-center ${
            isDarkMode ? 'bg-gray-900' : 'bg-gray-50'
          } border-b ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
            <h3 className="text-lg font-bold flex items-center">
              <RiMapPin2Line className={`mr-2 ${isDarkMode ? 'text-green-400' : 'text-green-600'}`} />
              Incident Location
            </h3>
            <motion.button
              variants={buttonVariants}
              whileHover="hover"
              whileTap="tap"
              onClick={() => mobileView ? setActiveTab('list') : setShowMap(false)}
              className="p-2 rounded-full hover:bg-opacity-20 hover:bg-gray-500"
            >
              <RiCloseLine size={20} />
            </motion.button>
          </div>
          
          {/* Map */}
          <div className="p-4">
            <div className="h-[500px] rounded-xl overflow-hidden shadow-inner">
              <MapContainer
                center={[14.7356, 121.0498]}
                zoom={15}
                style={{ height: '100%', width: '100%' }}
              >
                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                <MapComponent incident={selectedIncident} />
              </MapContainer>
            </div>
            
            {/* Location info beneath the map */}
            <motion.div
              variants={itemVariants} 
              className={`mt-4 p-4 rounded-lg ${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'}`}
            >
              <h4 className="font-medium mb-2 flex items-center">
                <RiMapPin2Line className="mr-2" /> Location Details:
              </h4>
              <p className="text-sm">
                {friendlyLocation || selectedIncident.location}
              </p>
              {selectedIncident.locationNote && (
                <p className={`mt-2 text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                  <span className="font-medium">Note:</span> {selectedIncident.locationNote}
                </p>
              )}
            </motion.div>
          </div>
        </motion.div>
      </motion.div>
    );
  };

  function DetailItem({ icon, label, value, theme = "default", fullWidth = false }) {
    const getThemeColors = () => {
      if (theme === "green") {
        return isDarkMode ? 'text-green-300' : 'text-green-600';
      }
      return isDarkMode ? 'text-blue-300' : 'text-blue-500';
    };
    
    return (
      <div className={`${fullWidth ? 'col-span-1 md:col-span-2' : ''}`}>
        <div className="flex items-center mb-1">
          <span className={`mr-2 ${getThemeColors()}`}>{icon}</span>
          <span className={`text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-500'}`}>{label}:</span>
        </div>
        <div className={`pl-6 ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>{value}</div>
      </div>
    );
  }

  // Mobile navigation tabs
  const MobileNavTabs = () => {
    return (
      <div className={`flex w-full border-t ${isDarkMode ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-white'} py-3`}>
        <motion.button
          variants={buttonVariants}
          whileHover="hover"
          whileTap="tap"
          onClick={() => setActiveTab('list')}
          className={`flex-1 flex flex-col items-center justify-center ${activeTab === 'list' ? 
            isDarkMode ? 'text-blue-400' : 'text-blue-600' : 
            isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}
        >
          <RiFileTextLine size={20} />
          <span className="text-xs mt-1">List</span>
        </motion.button>
        
        {selectedIncident && (
          <motion.button
            variants={buttonVariants}
            whileHover="hover"
            whileTap="tap"
            onClick={() => setActiveTab('details')}
            className={`flex-1 flex flex-col items-center justify-center ${activeTab === 'details' ? 
              isDarkMode ? 'text-blue-400' : 'text-blue-600' : 
              isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}
          >
            <RiInformationLine size={20} />
            <span className="text-xs mt-1">Details</span>
          </motion.button>
        )}
        
        {selectedIncident && (
          <motion.button
            variants={buttonVariants}
            whileHover="hover"
            whileTap="tap"
            onClick={() => {
              const latLngMatch = selectedIncident?.location.match(/Lat:\s*([0-9.-]+),\s*Lon:\s*([0-9.-]+)/);
              if (latLngMatch) {
                setActiveTab('map');
              } else {
                toast.warning("Cannot display location on map. Coordinates not found.");
              }
            }}
            className={`flex-1 flex flex-col items-center justify-center ${activeTab === 'map' ? 
              isDarkMode ? 'text-blue-400' : 'text-blue-600' : 
              isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}
          >
            <RiMapPin2Line size={20} />
            <span className="text-xs mt-1">Map</span>
          </motion.button>
        )}
      </div>
    );
  };

  // Add a toggle component for switching between resolved incidents and false alarms
  const ViewToggle = () => (
    <div className="flex justify-between items-center mb-4">
      <div className={`flex p-1 rounded-lg ${isDarkMode ? 'bg-gray-700' : 'bg-gray-200'}`}>
        <button
          onClick={() => setViewType('resolved')}
          className={`flex-1 py-2 px-4 rounded-lg transition-all duration-200 text-sm font-medium ${
            viewType === 'resolved'
              ? isDarkMode
                ? 'bg-blue-600 text-white'
                : 'bg-blue-500 text-white'
              : isDarkMode
              ? 'text-gray-300 hover:text-white'
              : 'text-gray-700 hover:text-gray-900'
          }`}
        >
          <div className="flex items-center justify-center">
            <FaCheckCircle className="mr-2" />
            Resolved Incidents
          </div>
        </button>
        <button
          onClick={() => setViewType('falseAlarm')}
          className={`flex-1 py-2 px-4 rounded-lg transition-all duration-200 text-sm font-medium ${
            viewType === 'falseAlarm'
              ? isDarkMode
                ? 'bg-orange-600 text-white'
                : 'bg-orange-500 text-white'
              : isDarkMode
              ? 'text-gray-300 hover:text-white'
              : 'text-gray-700 hover:text-gray-900'
          }`}
        >
          <div className="flex items-center justify-center">
            <FaExclamationTriangle className="mr-2" />
            False Alarms
          </div>
        </button>
      </div>
      
      {/* Add Generate Report Button */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setShowPasswordModal(true)}
        className={`py-2 px-4 rounded-lg ${
          isDarkMode 
            ? 'bg-purple-700 hover:bg-purple-600 text-white' 
            : 'bg-purple-600 hover:bg-purple-500 text-white'
        } flex items-center`}
      >
        <FaFilePdf className="mr-2" />
        Generate Report
      </motion.button>
    </div>
  );

  const handleVerificationSuccess = () => {
    setShowPasswordModal(false);
    setShowReportPreview(true);
  };

  const handleDownloadReport = () => {
    setShowPdfPasswordModal(true);
  };

  const handleConfirmDownload = async (password) => {
    try {
      setIsDownloading(true);
      
      // Format date for filename
      const dateStr = new Date().toISOString().split('T')[0];
      const fileName = `Incident_Report_${dateStr}`;
      
      // Import the ResolvedIncidentReport dynamically
      const ResolvedIncidentReport = (await import('./ResolvedIncidentReport')).default;
      
      // Get report configuration data from report preview component
      const reportParams = {
        incidents: resolvedIncidents,
        falseAlarms: falseAlarms,
        generatedDate: new Date().toISOString(),
        dateRange: document.querySelector('input[type="date"]')?.value 
          ? {
              startDate: document.getElementsByName('startDate')[0]?.value,
              endDate: document.getElementsByName('endDate')[0]?.value,
            }
          : undefined,
        reportPeriod: document.getElementsByName('reportPeriod')[0]?.value || 'custom',
        reportType: document.getElementsByName('reportType')[0]?.value || 'all'
      };
      
      // Create and download the encrypted zip file
      const success = await createAndDownloadProtectedZip(
        ResolvedIncidentReport,
        reportParams,
        password,
        fileName
      );
      
      if (success) {
        toast.success('Report downloaded successfully');
        setShowPdfPasswordModal(false);
        // Add a slight delay before closing the report preview
        setTimeout(() => {
          setShowReportPreview(false);
        }, 500);
      }
    } catch (error) {
      console.error('Error downloading report:', error);
      toast.error('Failed to download report');
    } finally {
      setIsDownloading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-[3000]"
      >
        <motion.div 
          variants={modalVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          className={`w-11/12 max-w-7xl rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col ${
            isDarkMode ? 'bg-gray-900' : 'bg-white'
          }`}
        >
          {/* Modal Header */}
          <div className={`px-6 py-4 flex justify-between items-center border-b ${
            isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'
          }`}>
            <div className="flex items-center">
              <motion.div 
                whileHover={{ rotate: 360, transition: { duration: 0.5 } }}
                className={`w-10 h-10 rounded-full flex items-center justify-center mr-3 ${
                  isDarkMode ? 'bg-green-900 text-green-200' : 'bg-green-100 text-green-600'
                }`}
              >
                <RiCheckboxCircleLine size={24} />
              </motion.div>
              <h3 className={`text-lg font-bold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
                {viewType === 'resolved' ? 'Resolved Incidents' : 'False Alarm Reports'}
              </h3>
            </div>
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={handleClose}
              className={`p-2 rounded-full hover:bg-opacity-80 ${
                isDarkMode ? 'hover:bg-gray-700 text-gray-300' : 'hover:bg-gray-200 text-gray-500'
              }`}
            >
              <RiCloseLine size={24} />
            </motion.button>
          </div>

          {/* Modal Body - Responsive Layout */}
          <div className="flex-1 overflow-hidden flex flex-col md:flex-row">
            {/* Left side - Table (always visible in desktop, conditionally in mobile) */}
            {(!mobileView || (mobileView && activeTab === 'list')) && (
              <motion.div 
                variants={contentVariants}
                initial="hidden"
                animate="visible"
                className={`${(showDetails || showMap) && !mobileView ? 'w-1/2' : 'w-full'} overflow-y-auto flex-shrink-0 p-6`}
              >
                {/* View toggle */}
                <ViewToggle />

                {/* Search and Filter Controls */}
                <motion.div 
                  variants={itemVariants}
                  className={`mb-5 p-4 rounded-xl ${isDarkMode ? 'bg-gray-800' : 'bg-gray-50'} shadow-md`}
                >
                  <div className="flex flex-col md:flex-row gap-3 items-center">
                    {/* Search input */}
                    <div className="relative w-full md:w-auto md:flex-grow">
                      <RiSearchLine className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                      <input
                        type="text"
                        placeholder="Search incidents..."
                        className={`w-full pl-10 pr-4 py-2.5 rounded-lg ${
                          isDarkMode 
                            ? 'bg-gray-700 border-gray-600 text-white focus:border-blue-500' 
                            : 'bg-white border-gray-300 text-gray-800 focus:border-blue-500'
                        } border focus:outline-none focus:ring-1 focus:ring-blue-500`}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                      />
                    </div>

                    {/* Filter controls */}
                    <div className="flex flex-wrap md:flex-nowrap gap-3 w-full md:w-auto">
                      <input
                        type="date"
                        className={`px-3 py-2.5 rounded-lg border ${
                          isDarkMode 
                            ? 'bg-gray-700 border-gray-600 text-white' 
                            : 'bg-white border-gray-300 text-gray-800'
                        } focus:outline-none focus:ring-1 focus:ring-blue-500 w-full md:w-auto`}
                        value={dateFilter}
                        onChange={(e) => setDateFilter(e.target.value)}
                      />
                      <select
                        className={`px-3 py-2.5 rounded-lg border ${
                          isDarkMode 
                            ? 'bg-gray-700 border-gray-600 text-white' 
                            : 'bg-white border-gray-300 text-gray-800'
                        } focus:outline-none focus:ring-1 focus:ring-blue-500 w-full md:w-auto`}
                        value={typeFilter}
                        onChange={(e) => setTypeFilter(e.target.value)}
                      >
                        <option value="all">All Types</option>
                        <option value="emergency">Emergency</option>
                        <option value="normal">Normal</option>
                      </select>
                      <motion.button
                        variants={buttonVariants}
                        whileHover="hover"
                        whileTap="tap"
                        onClick={() => {
                          setSearchTerm('');
                          setDateFilter('');
                          setTypeFilter('all');
                        }}
                        className={`flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-lg ${
                          isDarkMode 
                            ? 'bg-gray-700 hover:bg-gray-600 text-gray-300' 
                            : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
                        }`}
                      >
                        <RiDeleteBin7Line size={18} />
                        <span>Clear</span>
                      </motion.button>
                    </div>
                  </div>
                </motion.div>

                {/* Incident Cards (for mobile) or Table (for desktop) */}
                {mobileView ? (
                  <div className="space-y-4">
                    {filteredIncidents.length > 0 ? (
                      filteredIncidents.map((incident) => (
                        <motion.div
                          key={incident._id}
                          variants={itemVariants}
                          className={`p-4 rounded-xl ${
                            isDarkMode ? 'bg-gray-800' : 'bg-white'
                          } shadow-md border ${
                            selectedIncident?._id === incident._id 
                              ? isDarkMode ? 'border-blue-600' : 'border-blue-500'
                              : isDarkMode ? 'border-gray-700' : 'border-gray-100'
                          }`}
                        >
                          <div className="flex justify-between items-start mb-2">
                            <span className={`text-sm font-medium px-2.5 py-1 rounded-full ${
                              incident.incidentClassification === 'Emergency Incident'
                                ? isDarkMode ? 'bg-red-900 text-red-200' : 'bg-red-100 text-red-800'
                                : isDarkMode ? 'bg-blue-900 text-blue-200' : 'bg-blue-100 text-blue-800'
                            }`}>
                              {incident.incidentClassification || 'Normal Incident'}
                            </span>
                            <span className="text-xs text-gray-500">
                              {formatDate(incident.date)}
                            </span>
                          </div>
                          <h4 className="font-medium text-lg mb-2">{incident.type}</h4>
                          <div className="flex flex-wrap gap-2 mt-4">
                            <motion.button
                              variants={buttonVariants}
                              whileHover="hover"
                              whileTap="tap"
                              onClick={() => handleViewDetails(incident)}
                              className={`flex-1 flex items-center justify-center gap-1 py-2 rounded-lg ${
                                isDarkMode 
                                  ? 'bg-blue-800 hover:bg-blue-700 text-white' 
                                  : 'bg-blue-500 hover:bg-blue-600 text-white'
                              }`}
                            >
                              <RiInformationLine />
                              <span>Details</span>
                            </motion.button>
                            <motion.button
                              variants={buttonVariants}
                              whileHover="hover"
                              whileTap="tap"
                              onClick={() => handleViewLocation(incident)}
                              className={`flex-1 flex items-center justify-center gap-1 py-2 rounded-lg ${
                                isDarkMode 
                                  ? 'bg-green-800 hover:bg-green-700 text-white' 
                                  : 'bg-green-500 hover:bg-green-600 text-white'
                              }`}
                            >
                              <RiMapPin2Line />
                              <span>Map</span>
                            </motion.button>
                          </div>
                        </motion.div>
                      ))
                    ) : (
                      <motion.div
                        variants={itemVariants}
                        className={`p-6 text-center rounded-xl ${
                          isDarkMode ? 'bg-gray-800' : 'bg-white'
                        } shadow-md border ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}
                      >
                        <div className={`w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center ${
                          isDarkMode ? 'bg-gray-700' : 'bg-gray-100'
                        }`}>
                          <RiInformationLine size={32} className="text-gray-400" />
                        </div>
                        <h4 className="text-lg font-medium mb-2">No incidents found</h4>
                        <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                          Try adjusting your search or filters
                        </p>
                      </motion.div>
                    )}
                  </div>
                ) : (
                  <motion.div
                    variants={itemVariants} 
                    className={`overflow-hidden rounded-xl border ${
                      isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
                    } shadow-md`}
                  >
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className={isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}>
                          <tr>
                            <th scope="col" className={`px-6 py-3.5 text-left text-xs font-medium ${
                              isDarkMode ? 'text-gray-400' : 'text-gray-500'
                            } uppercase tracking-wider`}>Date</th>
                            <th scope="col" className={`px-6 py-3.5 text-left text-xs font-medium ${
                              isDarkMode ? 'text-gray-400' : 'text-gray-500'
                            } uppercase tracking-wider`}>Incident</th>
                            <th scope="col" className={`px-6 py-3.5 text-left text-xs font-medium ${
                              isDarkMode ? 'text-gray-400' : 'text-gray-500'
                            } uppercase tracking-wider`}>Type</th>
                            <th scope="col" className={`px-6 py-3.5 text-left text-xs font-medium ${
                              isDarkMode ? 'text-gray-400' : 'text-gray-500'
                            } uppercase tracking-wider`}>Actions</th>
                          </tr>
                        </thead>
                        <tbody className={`divide-y ${
                          isDarkMode ? 'divide-gray-700' : 'divide-gray-200'
                        }`}>
                          {filteredIncidents.length > 0 ? (
                            filteredIncidents.map((incident) => (
                              <tr key={incident._id} 
                                  className={`${
                                    selectedIncident?._id === incident._id 
                                      ? isDarkMode ? 'bg-gray-700' : 'bg-blue-50'
                                      : ''
                                  } hover:${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'} transition-colors`}>
                                <td className={`px-6 py-4 whitespace-nowrap text-sm ${
                                  isDarkMode ? 'text-gray-300' : 'text-gray-900'
                                }`}>{formatDate(incident.date)}</td>
                                <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${
                                  isDarkMode ? 'text-gray-300' : 'text-gray-900'
                                }`}>{incident.type}</td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <span className={`inline-flex px-2.5 py-1 text-xs font-medium rounded-full ${
                                    incident.incidentClassification === 'Emergency Incident'
                                      ? isDarkMode ? 'bg-red-900 text-red-200' : 'bg-red-100 text-red-800'
                                      : isDarkMode ? 'bg-blue-900 text-blue-200' : 'bg-blue-100 text-blue-800'
                                  }`}>
                                    {incident.incidentClassification || 'Normal Incident'}
                                  </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                  <div className="flex space-x-2">
                                    <motion.button
                                      variants={buttonVariants}
                                      whileHover="hover"
                                      whileTap="tap"
                                      onClick={() => handleViewDetails(incident)}
                                      className={`inline-flex items-center px-3 py-1.5 rounded-lg ${
                                        selectedIncident?._id === incident._id && showDetails
                                          ? isDarkMode ? 'bg-gray-600 text-white' : 'bg-gray-500 text-white'
                                          : isDarkMode ? 'bg-blue-800 text-white hover:bg-blue-700' : 'bg-blue-500 text-white hover:bg-blue-600'
                                      }`}
                                    >
                                      <RiInformationLine className="mr-1" />
                                      {selectedIncident?._id === incident._id && showDetails ? 'Hide Details' : 'Details'}
                                    </motion.button>
                                    <motion.button
                                      variants={buttonVariants}
                                      whileHover="hover"
                                      whileTap="tap"
                                      onClick={() => handleViewLocation(incident)}
                                      className={`inline-flex items-center px-3 py-1.5 rounded-lg ${
                                        selectedIncident?._id === incident._id && showMap
                                          ? isDarkMode ? 'bg-gray-600 text-white' : 'bg-gray-500 text-white'
                                          : isDarkMode ? 'bg-green-800 text-white hover:bg-green-700' : 'bg-green-500 text-white hover:bg-green-600'
                                      }`}
                                    >
                                      <RiMapPin2Line className="mr-1" />
                                      {selectedIncident?._id === incident._id && showMap ? 'Hide Map' : 'Map'}
                                    </motion.button>
                                  </div>
                                </td>
                              </tr>
                            ))
                          ) : (
                            <tr>
                              <td colSpan="4" className="px-6 py-4 text-center text-sm font-medium">
                                <div className="flex flex-col items-center py-6">
                                  <RiInformationLine size={40} className="text-gray-400 mb-2" />
                                  <p className={isDarkMode ? 'text-gray-300' : 'text-gray-500'}>
                                    No resolved incidents found
                                  </p>
                                  <p className="text-xs text-gray-400 mt-1">
                                    Try adjusting your search or filters
                                  </p>
                                </div>
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </motion.div>
                )}
              </motion.div>
            )}

            {/* Right side - Details or Map */}
            {(!mobileView && (showDetails || showMap)) && (
              showDetails ? renderIncidentDetails() : renderMap()
            )}
            
            {/* Mobile view for details and map */}
            {mobileView && activeTab === 'details' && renderIncidentDetails()}
            {mobileView && activeTab === 'map' && renderMap()}

            {/* Mobile Navigation */}
            {mobileView && <MobileNavTabs />}
          </div>
        </motion.div>

        {showAssistanceDetails && selectedAssistance && (
          <AssistanceDetailsModal
            details={selectedAssistance}
            onClose={() => setShowAssistanceDetails(false)}
          />
        )}

        {/* Add modals for report generation flow - Update z-indices */}
        <PasswordVerificationModal
          isOpen={showPasswordModal}
          onClose={() => setShowPasswordModal(false)}
          onVerified={handleVerificationSuccess}
          isDarkMode={isDarkMode}
          action="generate an incident report"
          zIndex={5000} // Higher z-index than other modals
        />
        
        {showReportPreview && (
          <ResolvedIncidentReportPreview
            isOpen={showReportPreview}
            onClose={() => setShowReportPreview(false)}
            onDownload={handleDownloadReport}
            incidents={resolvedIncidents}
            falseAlarms={falseAlarms}
            isDarkMode={isDarkMode}
          />
        )}
        
        <PDFPasswordModal
          isOpen={showPdfPasswordModal}
          onClose={() => setShowPdfPasswordModal(false)}
          onConfirm={handleConfirmDownload}
          isDarkMode={isDarkMode}
          isLoading={isDownloading}
          zIndex={6000} // Highest z-index to appear above all other modals
        />
      </motion.div>
    </AnimatePresence>
  );
};

export default ResolvedIncidentsModal;

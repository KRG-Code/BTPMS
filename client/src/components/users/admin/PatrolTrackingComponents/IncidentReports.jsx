import React, { useState, useEffect, useCallback, useMemo } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FaExclamationTriangle, FaInfoCircle, FaMapMarkerAlt, FaCalendarAlt, 
  FaClock, FaUserAlt, FaPhone, FaSearch, FaFilter, FaEye, 
  FaVideo, FaTimes, FaCheck, FaSpinner, FaSyncAlt, FaArchive, 
  FaChevronDown, FaChevronUp, FaMapMarked, FaUserShield 
} from 'react-icons/fa';
import ResolvedIncidentsModal from './ResolvedIncidentsModal';
import ViewLocation from './ViewLocation';
import CctvReviewPanel from './CctvReviewPanel';
import { useTheme } from '../../../../contexts/ThemeContext';

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.05, when: "beforeChildren" } }
};

const itemVariants = {
  hidden: { opacity: 0, y: 15 },
  visible: { 
    opacity: 1, 
    y: 0, 
    transition: { type: "spring", stiffness: 300, damping: 24 } 
  },
  exit: { opacity: 0, y: -10, transition: { duration: 0.2 } }
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

const buttonVariants = {
  hover: { scale: 1.05 },
  tap: { scale: 0.95 }
};

// Add slide panel variants for details panel
const panelVariants = {
  hidden: { opacity: 0, x: 100 },
  visible: { opacity: 1, x: 0, transition: { type: "spring", damping: 25, stiffness: 300 } },
  exit: { opacity: 0, x: 100, transition: { duration: 0.2 } }
};

const contentVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: i => ({ opacity: 1, y: 0, transition: { delay: i * 0.1, duration: 0.5 } }),
};

const IncidentReports = ({ 
  setIncidentLocations, 
  selectedReport, 
  setSelectedReport, 
  mapRef, 
  zoomToLocation,
  activePanel,
  setActivePanel
}) => {
  const { isDarkMode } = useTheme();
  const [incidentReports, setIncidentReports] = useState([]);
  const [visibleLocations, setVisibleLocations] = useState({});
  const [showAll, setShowAll] = useState(false);
  const [showResolvedModal, setShowResolvedModal] = useState(false);
  const [resolvedIncidents, setResolvedIncidents] = useState([]);
  const [showCctvReview, setShowCctvReview] = useState(false);
  const [assistanceRequests, setAssistanceRequests] = useState({});
  const [currentUser, setCurrentUser] = useState(null);
  const [showAssistanceModal, setShowAssistanceModal] = useState(false);
  const [selectedAssistance, setSelectedAssistance] = useState(null);
  const [showRejectionModal, setShowRejectionModal] = useState(false);
  const [rejectionData, setRejectionData] = useState({
    reason: '',
    notes: '',
    incidentId: null
  });
  const [friendlyLocation, setFriendlyLocation] = useState('');
  const [loading, setLoading] = useState(true);
  const [filterOptions, setFilterOptions] = useState({
    search: '',
    status: 'all',
    type: 'all',
  });
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const rejectionReasons = [
    'Insufficient details provided',
    'Non-emergency situation',
    'Already being handled by another unit',
    'Outside jurisdiction',
    'False alarm',
    'Duplicate request',
    'Resources not available',
    'Other'
  ];

  // Memoized fetch functions
  const fetchIncidentReports = useCallback(async () => {
    setLoading(true);
    const token = localStorage.getItem('token');
    if (!token) {
      toast.error('Please log in.');
      setLoading(false);
      return;
    }
    try {
      setRefreshing(true);
      const response = await axios.get(`${process.env.REACT_APP_API_URL}/incident-reports`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      // Filter out resolved incidents
      const activeIncidents = response.data.filter(incident => incident.status !== 'Resolved');
      setIncidentReports(activeIncidents);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching incident reports:', error);
      toast.error('Failed to load incident reports.');
      setLoading(false);
    } finally {
      setRefreshing(false);
    }
  }, []);

  const fetchResolvedIncidents = useCallback(async () => {
    const token = localStorage.getItem('token');
    if (!token) return;
    try {
      const response = await axios.get(`${process.env.REACT_APP_API_URL}/incident-reports`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const resolved = response.data.filter(incident => incident.status === 'Resolved');
      setResolvedIncidents(resolved);
    } catch (error) {
      console.error('Error fetching resolved incidents:', error);
      toast.error('Failed to load resolved incidents.');
    }
  }, []);

  const fetchAssistanceRequests = useCallback(async () => {
    const token = localStorage.getItem('token');
    if (!token) return;
    try {
      const response = await axios.get(
        `${process.env.REACT_APP_API_URL}/assistance-requests`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      // Update how we process the assistance requests
      const requests = {};
      response.data.forEach(request => {
        // Convert ObjectId to string for comparison
        const incidentId = request.incidentId._id || request.incidentId;
        requests[incidentId] = request;
      });
      setAssistanceRequests(requests);
    } catch (error) {
      console.error('Error fetching assistance requests:', error);
    }
  }, []);

  const fetchCurrentUser = useCallback(async () => {
    const token = localStorage.getItem('token');
    if (!token) return;
    
    try {
      const response = await axios.get(
        `${process.env.REACT_APP_API_URL}/auth/me`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setCurrentUser(response.data);
    } catch (error) {
      console.error('Error fetching current user:', error);
      toast.error('Error fetching user data');
    }
  }, []);

  useEffect(() => {
    fetchIncidentReports();
    fetchResolvedIncidents();
    fetchAssistanceRequests();
    fetchCurrentUser();
  }, [fetchIncidentReports, fetchResolvedIncidents, fetchAssistanceRequests, fetchCurrentUser]);

  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  const fetchIncidentDetails = async (reportId) => {
    const token = localStorage.getItem('token');
    if (!token) return null;
    try {
      const response = await axios.get(
        `${process.env.REACT_APP_API_URL}/incident-reports/${reportId}/details`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      return response.data;
    } catch (error) {
      console.error('Error fetching incident details:', error);
      return null;
    }
  };

  const reverseGeocode = async (location) => {
    const latLngMatch = location.match(/Lat:\s*([0-9.-]+),\s*Lon:\s*([0-9.-]+)/);
    if (latLngMatch) {
      const [, latitude, longitude] = latLngMatch;
      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&addressdetails=1`
        );
        const data = await response.json();
        return data.display_name;
      } catch (error) {
        console.error("Error getting location details:", error);
        return location; // Return original coordinates if reverse geocoding fails
      }
    }
    return location;
  };

  // ... existing helper functions ...

  const handleViewDetails = async (report) => {
    const details = await fetchIncidentDetails(report._id);
    if (details) {
      const friendlyLocationName = await reverseGeocode(details.location);
      setFriendlyLocation(friendlyLocationName);
      setSelectedReport(details);
      setActivePanel('details');
    } else {
      const friendlyLocationName = await reverseGeocode(report.location);
      setFriendlyLocation(friendlyLocationName);
      setSelectedReport(report);
      setActivePanel('details');
    }
  };

  const handleCctvReview = (report) => {
    setSelectedReport(report);
    setActivePanel('cctv');
    // Clear all other incident locations, only show the selected one
    setIncidentLocations({
      [report._id]: {
        location: report.location,
        type: getIncidentType(report.incidentClassification),
        status: report.status
      }
    });
  };

  const handleCloseDetails = () => {
    setSelectedReport(null);
    setActivePanel(null);
  };

  const getIncidentType = (classification) => {
    return classification === 'Emergency Incident' ? 'Emergency' : 'Normal';
  };

  const handleToggleLocation = (report) => {
    if (!report || !report.location) {
      toast.error('Invalid location data');
      return;
    }

    const latLngMatch = report.location.match(/Lat:\s*([0-9.-]+),\s*Lon:\s*([0-9.-]+)/);
    if (!latLngMatch) {
      toast.warning(
        <div>
          <p>Cannot display location on map</p>
          <p className="text-sm mt-1">Location provided: {report.location}</p>
          <p className="text-sm mt-1">Exact coordinates are required to show on map</p>
        </div>,
        {
          autoClose: 5000,
          icon: '📍',
          position: "top-right",
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true
        }
      );
      return;
    }

    setVisibleLocations((prev) => {
      const newVisibleLocations = { ...prev };
      if (newVisibleLocations[report._id]) {
        delete newVisibleLocations[report._id];
      } else {
        Object.keys(newVisibleLocations).forEach(key => {
          delete newVisibleLocations[key];
        });
        newVisibleLocations[report._id] = {
          location: report.location,
          type: getIncidentType(report.incidentClassification),
          status: report.status
        };
      }
      setIncidentLocations(newVisibleLocations);
      return newVisibleLocations;
    });
    setShowAll(false);
  };

  const handleToggleAllLocations = () => {
    setShowAll(!showAll);
    if (!showAll) {
      const allLocations = {};
      let invalidLocations = 0;

      incidentReports
        // Filter out resolved incidents before showing locations
        .filter(incident => incident.status !== 'Resolved')
        .forEach((report) => {
          const latLngMatch = report.location.match(/Lat:\s*([0-9.-]+),\s*Lon:\s*([0-9.-]+)/);
          if (latLngMatch) {
            allLocations[report._id] = {
              location: report.location,
              type: getIncidentType(report.incidentClassification),
              status: report.status
            };
          } else {
            invalidLocations++;
          }
        });

      if (invalidLocations > 0) {
        toast.info(
          `${invalidLocations} incident${invalidLocations > 1 ? 's' : ''} cannot be shown on map due to missing coordinates`,
          { autoClose: 5000, icon: 'ℹ️' }
        );
      }

      setVisibleLocations(allLocations);
      setIncidentLocations(allLocations);
    } else {
      setVisibleLocations({});
      setIncidentLocations({});
    }
  };

  const getStatusColor = (status) => {
    if (isDarkMode) {
      switch (status) {
        case 'Pending': return 'bg-yellow-700 text-yellow-100';
        case 'In Progress': return 'bg-blue-700 text-blue-100';
        case 'Resolved': return 'bg-green-700 text-green-100';
        default: return 'bg-gray-700 text-gray-100';
      }
    } else {
      switch (status) {
        case 'Pending': return 'bg-yellow-100 text-yellow-800 border border-yellow-200';
        case 'In Progress': return 'bg-blue-100 text-blue-800 border border-blue-200';
        case 'Resolved': return 'bg-green-100 text-green-800 border border-green-200';
        default: return 'bg-gray-100 text-gray-800 border border-gray-200';
      }
    }
  };

  const getStatusColorClass = (status) => {
    switch (status) {
      case 'Pending':
        return isDarkMode ? 'text-yellow-400' : 'text-yellow-500';
      case 'Processing':
        return isDarkMode ? 'text-blue-400' : 'text-blue-500';
      case 'Deployed':
        return isDarkMode ? 'text-indigo-400' : 'text-indigo-500';
      case 'Rejected':
        return isDarkMode ? 'text-red-400' : 'text-red-500';
      case 'Completed':
      case 'Resolved':
        return isDarkMode ? 'text-green-400' : 'text-green-500';
      default:
        return isDarkMode ? 'text-gray-400' : 'text-gray-500';
    }
  };

  // ... existing functions ...

  const sortIncidents = (incidents) => {
    const statusPriority = {
      'In Progress': 1,
      'Pending': 2,
      'Resolved': 3
    };
    return [...incidents].sort((a, b) => {
      const statusA = a.status || 'Pending';
      const statusB = b.status || 'Pending';
      const priorityDiff = statusPriority[statusA] - statusPriority[statusB];
      if (priorityDiff !== 0) return priorityDiff;
      return new Date(b.date) - new Date(a.date);
    });
  };

  // ... additional functions ...

  const handleOpenResolvedModal = () => {
    setSelectedReport(null); // Clear any selected report
    setShowResolvedModal(true);
  };

  const handleCloseResolvedModal = () => {
    setSelectedReport(null); // Clear selected report when closing modal
    setShowResolvedModal(false);
  };

  const handleCloseCctvReview = () => {
    setShowCctvReview(false);
    setActivePanel(null);
    // Clear all incident locations
    setIncidentLocations({});
  };

  const handleAssistanceAction = async (incidentId, action) => {
    const token = localStorage.getItem('token');
    
    if (!token || !currentUser) {
      toast.error('Authentication required');
      return;
    }

    if (action === 'Rejected') {
      setRejectionData({ ...rejectionData, incidentId });
      setShowRejectionModal(true);
      return;
    }

    // Keep the original action for the notes but use 'Processing' for status
    const status = action === 'Approved' ? 'Processing' : action;
    const actionForNotes = action; // Keep original action for notes

    const toastId = toast.info(
      <div className="text-center">
        <p className="mb-2">Are you sure you want to {actionForNotes.toLowerCase()} this assistance request?</p>
        <div className="flex justify-center space-x-2 mt-4">
          <motion.button
            variants={buttonVariants}
            whileHover="hover"
            whileTap="tap"
            onClick={async () => {
              toast.dismiss(toastId);
              try {
                const response = await axios({
                  method: 'put',
                  url: `${process.env.REACT_APP_API_URL}/assistance-requests/${assistanceRequests[incidentId]._id}/status`,
                  headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                  },
                  data: {
                    status: status,
                    notes: `Assistance request ${actionForNotes.toLowerCase()} by ${currentUser.firstName} ${currentUser.lastName}`,
                    approverName: ` ${currentUser.firstName} ${currentUser.lastName}`
                  }
                });

                if (response.data) {
                  toast.success(`Assistance request has been ${actionForNotes.toLowerCase()}`);
                  await fetchAssistanceRequests();
                }
              } catch (error) {
                console.error('Error updating assistance request:', error);
                const errorMessage = error.response?.data?.message || error.message;
                toast.error(`Failed to ${actionForNotes.toLowerCase()} assistance request: ${errorMessage}`);
              }
            }}
            className={`px-4 py-2 text-white rounded ${
              action === 'Approved' ? 
              isDarkMode ? 'bg-green-700 hover:bg-green-600' : 'bg-green-500 hover:bg-green-600' : 
              isDarkMode ? 'bg-red-700 hover:bg-red-600' : 'bg-red-500 hover:bg-red-600'
            }`}
          >
            Yes, {actionForNotes}
          </motion.button>
          <motion.button
            variants={buttonVariants}
            whileHover="hover"
            whileTap="tap"
            onClick={() => toast.dismiss(toastId)}
            className={`px-4 py-2 text-white rounded ${
              isDarkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-500 hover:bg-gray-600'
            }`}
          >
            Cancel
          </motion.button>
        </div>
      </div>,
      {
        autoClose: false,
        closeButton: false,
        closeOnClick: false,
        draggable: false
      }
    );
  };

  const handleRejectionSubmit = async ({ reason, notes }) => {
    const token = localStorage.getItem('token');
    try {
      const response = await axios({
        method: 'put',
        url: `${process.env.REACT_APP_API_URL}/assistance-requests/${assistanceRequests[rejectionData.incidentId]._id}/status`,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        data: {
          status: 'Rejected',
          reason: reason,  
          notes: notes || 'N/A',  
          approverName: `${currentUser.firstName} ${currentUser.lastName}`,
          department: 'BTPMS Admin'
        }
      });

      if (response.data) {
        toast.success('Assistance request has been rejected');
        await fetchAssistanceRequests();
        setShowRejectionModal(false);
      }
    } catch (error) {
      console.error('Error rejecting assistance request:', error);
      toast.error('Failed to reject assistance request');
    }
  };

  // Filter incidents based on search and filter options
  const filteredIncidents = useMemo(() => {
    return incidentReports.filter(incident => {
      // Filter by search term
      const matchesSearch = 
        filterOptions.search === '' ||
        incident.type?.toLowerCase().includes(filterOptions.search.toLowerCase()) ||
        incident.incidentClassification?.toLowerCase().includes(filterOptions.search.toLowerCase()) ||
        incident.description?.toLowerCase().includes(filterOptions.search.toLowerCase());
      
      // Filter by status
      const matchesStatus = 
        filterOptions.status === 'all' || 
        incident.status === filterOptions.status;
      
      // Filter by type
      const matchesType = 
        filterOptions.type === 'all' || 
        (filterOptions.type === 'emergency' && incident.incidentClassification === 'Emergency Incident') ||
        (filterOptions.type === 'normal' && incident.incidentClassification !== 'Emergency Incident');
      
      return matchesSearch && matchesStatus && matchesType;
    });
  }, [incidentReports, filterOptions]);

  // Sort the filtered incidents
  const sortedIncidents = useMemo(() => sortIncidents(filteredIncidents), [filteredIncidents]);

  // Add assistance status click handler
  const handleAssistanceStatusClick = (assistance) => {
    setSelectedAssistance(assistance);
    setShowAssistanceModal(true);
  };

  // Function to get incident type icon
  const getIncidentTypeIcon = (classification) => {
    const isEmergency = classification === 'Emergency Incident';
    return isEmergency ? (
      <FaExclamationTriangle className={isDarkMode ? 'text-red-400' : 'text-red-500'} />
    ) : (
      <FaInfoCircle className={isDarkMode ? 'text-blue-400' : 'text-blue-500'} />
    );
  };

  // Assistance Details Modal Component
  const AssistanceDetailsModal = ({ details, onClose }) => {
    const renderStatusContent = () => {
      switch (details.status) {
        case 'Rejected':
          return (
            <div>
              <h4 className="font-semibold mb-2">Rejection Details</h4>
              {details.rejectedDetails && details.rejectedDetails.length > 0 ? (
                details.rejectedDetails.map((detail, index) => (
                  <div key={index} className={`p-3 rounded-lg mb-3 border ${
                    isDarkMode ? 'bg-red-900 bg-opacity-20 border-red-800 text-red-200' : 'bg-red-50 border-red-200 text-red-900'
                  }`}>
                    <p><strong>Department:</strong> {detail.department}</p>
                    <p><strong>Rejected By:</strong> {detail.rejectorName}</p>
                    <p><strong>Date/Time:</strong> {new Date(detail.rejectedDateTime).toLocaleString()}</p>
                    <p><strong>Reason:</strong> {detail.reason}</p>
                    <p><strong>Additional Notes:</strong> {detail.notes || 'N/A'}</p>
                  </div>
                ))
              ) : (
                <p>No rejection details available</p>
              )}
            </div>
          );

        case 'Processing':
          return (
            <div>
              <h4 className="font-semibold mb-2">Approval History</h4>
              {details.approvedDetails && details.approvedDetails.length > 0 ? (
                details.approvedDetails.map((detail, index) => (
                  <div key={index} className={`p-3 rounded-lg mb-3 border ${
                    isDarkMode ? 'bg-blue-900 bg-opacity-20 border-blue-800 text-blue-200' : 'bg-blue-50 border-blue-200 text-blue-900'
                  }`}>
                    <p><strong>Department:</strong> {detail.department}</p>
                    <p><strong>Approved By:</strong> {detail.approverName}</p>
                    <p><strong>Date/Time:</strong> {new Date(detail.approvedDateTime).toLocaleString()}</p>
                    <p><strong>Notes:</strong> {detail.notes || 'N/A'}</p>
                  </div>
                ))
              ) : (
                <p>No approval details available</p>
              )}
              
              {/* Check if both BTPMS and ERDMS approvals exist */}
              {(() => {
                const hasBtpmsApproval = details.approvedDetails?.some(
                  detail => detail.department === 'BTPMS'
                );
                const hasErdmsApproval = details.approvedDetails?.some(
                  detail => detail.department === 'ERDMS'
                );
                
                if (hasBtpmsApproval && hasErdmsApproval) {
                  return (
                    <div className={`mt-4 p-3 rounded-lg ${
                      isDarkMode ? 'bg-indigo-900 bg-opacity-20 text-indigo-200' : 'bg-indigo-50 border border-indigo-200 text-indigo-800'
                    }`}>
                      <div className="flex items-center">
                        <div className="mr-2">⏳</div>
                        <p><strong>Status:</strong> Waiting for responder deployment</p>
                      </div>
                      <p className="mt-1 text-sm opacity-80">Both departments have approved. A responder will be assigned shortly.</p>
                    </div>
                  );
                } else {
                  return (
                    <div className={`mt-4 p-3 rounded-lg ${
                      isDarkMode ? 'bg-yellow-900 bg-opacity-20 text-yellow-200' : 'bg-yellow-50 border border-yellow-200 text-yellow-800'
                    }`}>
                      <div className="flex items-center">
                        <div className="mr-2">⏳</div>
                        <p><strong>Status:</strong> Waiting for ERDMS approval</p>
                      </div>
                      <p className="mt-1 text-sm opacity-80">Once approved by BTPMS, the request is sent to the Emergency Response Department</p>
                    </div>
                  );
                }
              })()}
            </div>
          );

        case 'Deployed':
          return (
            <div>
              <h4 className="font-semibold mb-2">Approval History</h4>
              {details.approvedDetails && details.approvedDetails.length > 0 ? (
                details.approvedDetails.map((detail, index) => (
                  <div key={index} className={`p-3 rounded-lg mb-3 border ${
                    isDarkMode ? 'bg-blue-900 bg-opacity-20 border-blue-800 text-blue-200' : 'bg-blue-50 border-blue-200 text-blue-900'
                  }`}>
                    <p><strong>Department:</strong> {detail.department}</p>
                    <p><strong>Approved By:</strong> {detail.approverName}</p>
                    <p><strong>Date/Time:</strong> {new Date(detail.approvedDateTime).toLocaleString()}</p>
                    <p><strong>Notes:</strong> {detail.notes || 'N/A'}</p>
                  </div>
                ))
              ) : (
                <p>No approval details available</p>
              )}
              
              {details.responderDetails && details.responderDetails.length > 0 ? (
                <div className="mt-4">
                  <h4 className="font-semibold mb-2">Responder Details</h4>
                  {details.responderDetails.map((responder, index) => (
                    <div key={index} className={`p-3 rounded-lg mb-3 border ${
                      isDarkMode ? 'bg-green-900 bg-opacity-20 border-green-800 text-green-200' : 'bg-green-50 border-green-200 text-green-900'
                    }`}>
                      <p><strong>Department:</strong> {responder.department}</p>
                      <p><strong>Responder Name:</strong> {responder.responderName}</p>
                      <p><strong>Contact:</strong> {responder.responderContact || 'N/A'}</p>
                      <p><strong>Response Time:</strong> {new Date(responder.responseDateTime).toLocaleString()}</p>
                      <p><strong>Estimated Arrival Time:</strong> {responder.estimatedArrivalTime || 'Not specified'}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className={`mt-4 p-3 rounded-lg ${
                  isDarkMode ? 'bg-blue-900 bg-opacity-20 text-blue-200' : 'bg-blue-50 border border-blue-200 text-blue-800'
                }`}>
                  <div className="flex items-center">
                    <div className="mr-2">⏳</div>
                    <p><strong>Status:</strong> Waiting for deployment of responder</p>
                  </div>
                  <p className="mt-1 text-sm opacity-80">The request has been approved by BTPMS and ERDMS and awaiting responder assignment</p>
                </div>
              )}
            </div>
          );

        case 'Completed':
          return (
            <div>
              <h4 className="font-semibold mb-2">Approval History</h4>
              {details.approvedDetails && details.approvedDetails.length > 0 ? (
                details.approvedDetails.map((detail, index) => (
                  <div key={index} className={`p-3 rounded-lg mb-3 border ${
                    isDarkMode ? 'bg-blue-900 bg-opacity-20 border-blue-800 text-blue-200' : 'bg-blue-50 border-blue-200 text-blue-900'
                  }`}>
                    <p><strong>Department:</strong> {detail.department}</p>
                    <p><strong>Approved By:</strong> {detail.approverName}</p>
                    <p><strong>Date/Time:</strong> {new Date(detail.approvedDateTime).toLocaleString()}</p>
                    <p><strong>Notes:</strong> {detail.notes || 'N/A'}</p>
                  </div>
                ))
              ) : (
                <p>No approval details available</p>
              )}
              
              {details.responderDetails && details.responderDetails.length > 0 && (
                <div className="mt-4">
                  <h4 className="font-semibold mb-2">Responder Details</h4>
                  {details.responderDetails.map((responder, index) => (
                    <div key={index} className={`p-3 rounded-lg mb-3 border ${
                      isDarkMode ? 'bg-green-900 bg-opacity-20 border-green-800 text-green-200' : 'bg-green-50 border-green-200 text-green-900'
                    }`}>
                      <p><strong>Department:</strong> {responder.department}</p>
                      <p><strong>Responder Name:</strong> {responder.responderName}</p>
                      <p><strong>Contact:</strong> {responder.responderContact || 'N/A'}</p>
                      <p><strong>Response Time:</strong> {new Date(responder.responseDateTime).toLocaleString()}</p>
                    </div>
                  ))}
                </div>
              )}
              
              {details.completionDetails && (
                <div className="mt-4">
                  <h4 className="font-semibold mb-2">Completion Details</h4>
                  <div className={`p-3 rounded-lg border ${
                    isDarkMode ? 'bg-green-900 bg-opacity-20 border-green-800 text-green-200' : 'bg-green-50 border-green-200 text-green-900'
                  }`}>
                    <p><strong>Completed At:</strong> {new Date(details.completionDetails.completionDateTime).toLocaleString()}</p>
                    <p><strong>Completed By:</strong> {details.completionDetails.completedBy}</p>
                    <p><strong>Resolution Notes:</strong> {details.completionDetails.notes || 'N/A'}</p>
                  </div>
                </div>
              )}
            </div>
          );

        case 'Pending':
          return (
            <div className={`p-4 rounded-lg ${
              isDarkMode ? 'bg-yellow-900 bg-opacity-20 text-yellow-200' : 'bg-yellow-50 text-yellow-600'
            }`}>
              <p>Waiting for approval</p>
              <p className="mt-2"><strong>Requester:</strong> {details.requesterName}</p>
              <p><strong>Requested At:</strong> {new Date(details.dateRequested).toLocaleString()}</p>
              <p><strong>Incident Type:</strong> {details.incidentType}</p>
              <p><strong>Classification:</strong> {details.incidentClassification}</p>
            </div>
          );

        default:
          return null;
      }
    };

    return (
      <motion.div 
        initial={{ opacity: 0 }} 
        animate={{ opacity: 1 }} 
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4 backdrop-blur-sm"
      >
        <motion.div 
          initial={{ scale: 0.9, opacity: 0 }} 
          animate={{ scale: 1, opacity: 1 }} 
          exit={{ scale: 0.9, opacity: 0 }}
          className={`max-w-lg w-full p-6 rounded-xl relative ${
            isDarkMode ? 'bg-gray-800 text-gray-100' : 'bg-white text-gray-800'
          } shadow-xl`}
        >
          <h3 className={`text-xl font-bold mb-4 ${isDarkMode ? 'text-blue-300' : 'text-blue-700'}`}>Assistance Request Details</h3>
          <motion.button 
            variants={buttonVariants}
            whileHover="hover"
            whileTap="tap"
            onClick={onClose} 
            className={`absolute top-4 right-4 p-2 rounded-full ${
              isDarkMode ? 'bg-gray-700 hover:bg-gray-600 text-gray-300' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
            }`}
          >
            <FaTimes />
          </motion.button>
          
          <div className="space-y-4">
            <div className="mb-4">
              <p className="font-semibold text-lg mb-2">
                Current Status: 
                <span className={`ml-2 ${getStatusColorClass(details.status)}`}>
                  {details.status}
                </span>
              </p>
            </div>
            {renderStatusContent()}
          </div>
        </motion.div>
      </motion.div>
    );
  };

  // Rejection Modal Component with dark mode support
  const RejectionModal = ({ onClose, onSubmit }) => {
    const [reason, setReason] = useState('');
    const [notes, setNotes] = useState('');

    const handleSubmit = (e) => {
      e.preventDefault();
      if (!reason) {
        toast.error('Please select a reason for rejection');
        return;
      }
      onSubmit({ reason, notes });
    };

    return (
      <motion.div 
        initial={{ opacity: 0 }} 
        animate={{ opacity: 1 }} 
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4 backdrop-blur-sm"
      >
        <motion.div 
          initial={{ scale: 0.9, opacity: 0 }} 
          animate={{ scale: 1, opacity: 1 }} 
          exit={{ scale: 0.9, opacity: 0 }}
          className={`max-w-lg w-full p-6 rounded-xl ${
            isDarkMode ? 'bg-gray-800 text-gray-100' : 'bg-white text-gray-800'
          } shadow-xl`}
        >
          <h3 className={`text-xl font-bold mb-4 ${isDarkMode ? 'text-red-300' : 'text-red-700'}`}>Reject Assistance Request</h3>
          <motion.button 
            variants={buttonVariants}
            whileHover="hover"
            whileTap="tap"
            onClick={onClose} 
            className={`absolute top-4 right-4 p-2 rounded-full ${
              isDarkMode ? 'bg-gray-700 hover:bg-gray-600 text-gray-300' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
            }`}
          >
            <FaTimes />
          </motion.button>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* ... form fields ... */}
            <div className="flex justify-end space-x-3 pt-3">
              {/* ... form buttons ... */}
            </div>
          </form>
        </motion.div>
      </motion.div>
    );
  };

  // Check if we have incidents to display
  const hasIncidents = sortedIncidents.length > 0;

  return (
    <div className={`w-full ${isDarkMode ? 'text-gray-100' : 'text-gray-800'} relative`}>
      <motion.div 
        initial="hidden"
        animate="visible"
        variants={containerVariants}
        className="space-y-4"
      >
        {/* Header with title, filter toggle and buttons */}
        <div className="flex flex-wrap justify-between items-center gap-3">
          <motion.h3 
            variants={itemVariants}
            className={`text-xl font-bold flex items-center ${
              isDarkMode ? 'text-gray-100' : 'text-gray-800'
            }`}
          >
            <FaExclamationTriangle className={`mr-2 ${
              isDarkMode ? 'text-red-400' : 'text-red-500'
            }`} />
            Incident Reports
            <span className={`ml-3 text-sm px-2.5 py-0.5 rounded-full ${
              isDarkMode ? 'bg-gray-700' : 'bg-gray-200'
            }`}>
              {sortedIncidents.length}
            </span>
          </motion.h3>
          
          <div className="flex flex-wrap gap-2">
            <motion.button
              variants={buttonVariants}
              whileHover="hover"
              whileTap="tap"
              onClick={() => setIsFilterOpen(!isFilterOpen)}
              className={`px-3 py-2 rounded-lg flex items-center ${
                isDarkMode
                ? 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
              }`}
            >
              <FaFilter className="mr-2" />
              Filters
              {isFilterOpen ? <FaChevronUp className="ml-2" /> : <FaChevronDown className="ml-2" />}
            </motion.button>

            <motion.button
              variants={buttonVariants}
              whileHover="hover"
              whileTap="tap" 
              onClick={handleOpenResolvedModal}
              className={`px-3 py-2 rounded-lg flex items-center ${
                isDarkMode
                ? 'bg-green-700 hover:bg-green-600 text-white'
                : 'bg-green-500 hover:bg-green-600 text-white'
              }`}
            >
              <FaArchive className="mr-2" />
              Resolved
            </motion.button>
            
            <motion.button
              variants={buttonVariants}
              whileHover="hover"
              whileTap="tap"
              onClick={handleToggleAllLocations}
              className={`px-3 py-2 rounded-lg flex items-center ${
                isDarkMode
                ? showAll ? 'bg-red-700 hover:bg-red-600' : 'bg-blue-700 hover:bg-blue-600'
                : showAll ? 'bg-red-500 hover:bg-red-600' : 'bg-blue-500 hover:bg-blue-600'
              } text-white`}
            >
              <FaMapMarked className="mr-2" />
              {showAll ? 'Hide Locations' : 'Show Locations'}
            </motion.button>
            
            <motion.button
              variants={buttonVariants}
              whileHover="hover"
              whileTap="tap"
              onClick={fetchIncidentReports}
              disabled={refreshing}
              className={`px-3 py-2 rounded-lg flex items-center ${
                isDarkMode
                ? 'bg-purple-700 hover:bg-purple-600 text-white'
                : 'bg-purple-500 hover:bg-purple-600 text-white'
              }`}
            >
              <FaSyncAlt className={`mr-2 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </motion.button>
          </div>
        </div>

        {/* Filter Panel */}
        <AnimatePresence>
          {isFilterOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className={`overflow-hidden rounded-lg p-4 ${
                isDarkMode ? 'bg-gray-800' : 'bg-white'
              } shadow`}
            >
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className={`block text-sm font-medium mb-2 ${
                    isDarkMode ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    Search
                  </label>
                  <div className="relative">
                    <FaSearch className={`absolute left-3 top-1/2 transform -translate-y-1/2 ${
                      isDarkMode ? 'text-gray-500' : 'text-gray-400'
                    }`} />
                    <input
                      type="text"
                      placeholder="Search incidents..."
                      value={filterOptions.search}
                      onChange={(e) => setFilterOptions({...filterOptions, search: e.target.value})}
                      className={`pl-9 w-full p-2 rounded-lg border ${
                        isDarkMode 
                        ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                        : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                      }`}
                    />
                  </div>
                </div>
                
                <div>
                  <label className={`block text-sm font-medium mb-2 ${
                    isDarkMode ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    Status
                  </label>
                  <select
                    value={filterOptions.status}
                    onChange={(e) => setFilterOptions({...filterOptions, status: e.target.value})}
                    className={`w-full p-2 rounded-lg border ${
                      isDarkMode 
                      ? 'bg-gray-700 border-gray-600 text-white' 
                      : 'bg-white border-gray-300 text-gray-900'
                    }`}
                  >
                    <option value="all" className={isDarkMode ? 'bg-gray-700' : ''}>All Statuses</option>
                    <option value="Pending" className={isDarkMode ? 'bg-gray-700' : ''}>Pending</option>
                    <option value="In Progress" className={isDarkMode ? 'bg-gray-700' : ''}>In Progress</option>
                  </select>
                </div>
                
                <div>
                  <label className={`block text-sm font-medium mb-2 ${
                    isDarkMode ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    Type
                  </label>
                  <select
                    value={filterOptions.type}
                    onChange={(e) => setFilterOptions({...filterOptions, type: e.target.value})}
                    className={`w-full p-2 rounded-lg border ${
                      isDarkMode 
                      ? 'bg-gray-700 border-gray-600 text-white' 
                      : 'bg-white border-gray-300 text-gray-900'
                    }`}
                  >
                    <option value="all" className={isDarkMode ? 'bg-gray-700' : ''}>All Types</option>
                    <option value="emergency" className={isDarkMode ? 'bg-gray-700' : ''}>Emergency</option>
                    <option value="normal" className={isDarkMode ? 'bg-gray-700' : ''}>Normal</option>
                  </select>
                </div>
              </div>
              
              <div className="flex justify-end mt-4">
                <motion.button
                  variants={buttonVariants}
                  whileHover="hover"
                  whileTap="tap"
                  onClick={() => setFilterOptions({
                    search: '',
                    status: 'all',
                    type: 'all'
                  })}
                  className={`px-4 py-2 rounded-lg ${
                    isDarkMode 
                    ? 'bg-gray-700 hover:bg-gray-600 text-gray-300' 
                    : 'bg-gray-200 hover:bg-gray-300 text-gray-800'
                  }`}
                >
                  Reset Filters
                </motion.button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Incidents Table */}
        {loading ? (
          <div className="flex justify-center items-center p-12">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }}
              className="flex flex-col items-center"
            >
              <FaSpinner className={`animate-spin text-4xl mb-4 ${
                isDarkMode ? 'text-blue-400' : 'text-blue-500'
              }`} />
              <p className="text-lg">Loading incidents...</p>
            </motion.div>
          </div>
        ) : !hasIncidents ? (
          <motion.div 
            variants={itemVariants}
            className={`flex flex-col items-center justify-center p-12 rounded-lg ${
              isDarkMode ? 'bg-gray-800' : 'bg-gray-50'
            }`}
          >
            <FaInfoCircle className={`text-5xl mb-4 ${
              isDarkMode ? 'text-blue-400' : 'text-blue-500'
            }`} />
            <h4 className="text-xl font-medium mb-2">No Active Incidents</h4>
            <p className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>
              {filterOptions.search || filterOptions.status !== 'all' || filterOptions.type !== 'all'
                ? 'Try changing your search or filter criteria'
                : 'There are no active incident reports at this time'
              }
            </p>
          </motion.div>
        ) : (
          <div className={`overflow-x-auto rounded-lg ${
            isDarkMode ? 'bg-gray-800' : 'bg-white'
          } shadow`}>
            {/* Add fixed height table container for 5 rows with scrolling */}
            <div className="overflow-y-auto" style={{ 
              maxHeight: sortedIncidents.length > 5 ? '400px' : 'auto' 
            }}>
              <table className="w-full divide-y divide-gray-200">
                <thead className={`sticky top-0 ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
                  <tr>
                    <th scope="col" className={`px-4 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                      isDarkMode ? 'text-gray-400' : 'text-gray-500'
                    }`}>
                      Incident
                    </th>
                    <th scope="col" className={`px-4 py-3 text-center text-xs font-medium uppercase tracking-wider ${
                      isDarkMode ? 'text-gray-400' : 'text-gray-500'
                    }`}>
                      Status
                    </th>
                    <th scope="col" className={`px-4 py-3 text-center text-xs font-medium uppercase tracking-wider ${
                      isDarkMode ? 'text-gray-400' : 'text-gray-500'
                    }`}>
                      Backup Request
                    </th>
                    <th scope="col" className={`px-4 py-3 text-center text-xs font-medium uppercase tracking-wider ${
                      isDarkMode ? 'text-gray-400' : 'text-gray-500'
                    }`}>
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className={isDarkMode ? 'divide-y divide-gray-700' : 'divide-y divide-gray-200'}>
                  <AnimatePresence>
                    {sortedIncidents.map((report, index) => {
                      const assistanceRequest = assistanceRequests[report._id];
                      
                      return (
                        <motion.tr 
                          key={report._id}
                          variants={tableRowVariants}
                          custom={index}
                          initial="hidden"
                          animate="visible"
                          exit="exit"
                          className={isDarkMode ? 'hover:bg-gray-750' : 'hover:bg-gray-50'}
                        >
                          <td className="px-4 py-3">
                            <div className="flex items-start">
                              <div className={`flex-shrink-0 h-10 w-10 rounded-full flex items-center justify-center ${
                                report.incidentClassification === 'Emergency Incident' 
                                ? isDarkMode ? 'bg-red-900 text-red-300' : 'bg-red-100 text-red-600'
                                : isDarkMode ? 'bg-blue-900 text-blue-300' : 'bg-blue-100 text-blue-600'
                              }`}>
                                {getIncidentTypeIcon(report.incidentClassification)}
                              </div>
                              <div className="ml-3">
                                <div className={`font-medium ${isDarkMode ? 'text-gray-200' : 'text-gray-900'}`}>
                                  {report.type}
                                </div>
                                <div className={`text-sm ${
                                  isDarkMode ? 'text-gray-400' : 'text-gray-500'
                                }`}>
                                  {report.incidentClassification || 'Normal Incident'}
                                </div>
                                {/* Added date and time here */}
                                <div className={`mt-1 text-xs flex items-center ${
                                  isDarkMode ? 'text-gray-400' : 'text-gray-500'
                                }`}>
                                  <FaCalendarAlt className="mr-1" />
                                  {formatDate(report.date)}
                                  {report.time && (
                                    <>
                                      <span className="mx-1">•</span>
                                      <FaClock className="mr-1" /> 
                                      {report.time}
                                    </>
                                  )}
                                </div>
                              </div>
                            </div>
                          </td>
                          
                          <td className="px-4 py-3 whitespace-nowrap text-center">
                            <span className={`px-2.5 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              getStatusColor(report.status || 'Pending')
                            }`}>
                              {report.status || 'Pending'}
                            </span>
                          </td>
                          
                          {/* Backup Request Column - Updated with all status handling */}
                          <td className="px-4 py-3">
                            {assistanceRequest ? (
                              <div className="flex flex-col items-center space-y-2">
                                <span 
                                  onClick={() => handleAssistanceStatusClick(assistanceRequest)}
                                  className={`cursor-pointer font-medium ${
                                    getStatusColorClass(assistanceRequest.status)
                                  }`}
                                >
                                  {assistanceRequest.status}
                                </span>
                                
                                {assistanceRequest.status === 'Pending' && (
                                  <div className="flex flex-col space-y-2">
                                    <motion.button
                                      variants={buttonVariants}
                                      whileHover="hover"
                                      whileTap="tap"
                                      onClick={() => handleAssistanceAction(report._id, 'Approved')}
                                      className={`bg-green-500 text-white px-2 py-1 rounded text-xs hover:bg-green-600 transition-colors flex items-center justify-center`}
                                    >
                                      <FaCheck className="mr-1" />
                                      Approve
                                    </motion.button>
                                    <motion.button
                                      variants={buttonVariants}
                                      whileHover="hover"
                                      whileTap="tap"
                                      onClick={() => handleAssistanceAction(report._id, 'Rejected')}
                                      className={`bg-red-500 text-white px-2 py-1 rounded text-xs hover:bg-red-600 transition-colors flex items-center justify-center`}
                                    >
                                      <FaTimes className="mr-1" />
                                      Reject
                                    </motion.button>
                                  </div>
                                )}

                                {/* Processing status */}
                                {assistanceRequest.status === 'Processing' && (
                                  <div className="flex flex-col space-y-2">
                                    <div className={`text-xs ${
                                      isDarkMode ? 'text-blue-300' : 'text-blue-600'
                                    }`}>
                                      <FaSpinner className="inline-block mr-1 animate-spin" />
                                      Processing request...
                                    </div>
                                  </div>
                                )}

                                {/* Deployed status */}
                                {assistanceRequest.status === 'Deployed' && (
                                  <div className="flex flex-col space-y-1">
                                    <div className={`text-xs ${
                                      isDarkMode ? 'text-indigo-300' : 'text-indigo-600'
                                    }`}>
                                      Help is on the way
                                    </div>
                                    {assistanceRequest.responderDetails && 
                                     assistanceRequest.responderDetails.length > 0 && (
                                      <div className={`text-xs ${
                                        isDarkMode ? 'text-gray-300' : 'text-gray-600'
                                      }`}>
                                        {assistanceRequest.responderDetails[0].responderName}
                                      </div>
                                    )}
                                  </div>
                                )}

                                {/* Completed status */}
                                {assistanceRequest.status === 'Completed' && (
                                  <div className="flex flex-col space-y-1">
                                    <div className={`text-xs ${
                                      isDarkMode ? 'text-green-300' : 'text-green-600'
                                    }`}>
                                      <FaCheck className="inline-block mr-1" />
                                      Assistance completed
                                    </div>
                                    {assistanceRequest.completionDetails && (
                                      <div className={`text-xs ${
                                        isDarkMode ? 'text-gray-300' : 'text-gray-600'
                                      }`}>
                                        {new Date(assistanceRequest.completionDetails.completionDateTime).toLocaleString()}
                                      </div>
                                    )}
                                  </div>
                                )}

                                {/* Rejected status */}
                                {assistanceRequest.status === 'Rejected' && (
                                  <div className={`text-xs ${
                                    isDarkMode ? 'text-red-300' : 'text-red-600'
                                  }`}>
                                    <FaTimes className="inline-block mr-1" />
                                    Request rejected
                                  </div>
                                )}
                              </div>
                            ) : (
                              <span className={isDarkMode ? 'text-gray-500' : 'text-gray-400'}>
                                None
                              </span>
                            )}
                          </td>
                          
                          <td className="px-4 py-3">
                            <div className="flex flex-col space-y-2 items-center">
                              <motion.button
                                variants={buttonVariants}
                                whileHover="hover"
                                whileTap="tap"
                                onClick={() => handleViewDetails(report)}
                                className={`bg-blue-500 hover:bg-blue-600 text-white px-2 py-1 rounded text-xs flex items-center justify-center w-full`}
                              >
                                <FaEye className="mr-1" />
                                Details
                              </motion.button>
                              
                              <motion.button
                                variants={buttonVariants}
                                whileHover="hover"
                                whileTap="tap"
                                onClick={() => handleToggleLocation(report)}
                                className={`${
                                  visibleLocations[report._id] 
                                  ? 'bg-red-500 hover:bg-red-600' 
                                  : 'bg-green-500 hover:bg-green-600'
                                } text-white px-2 py-1 rounded text-xs flex items-center justify-center w-full`}
                              >
                                <FaMapMarkerAlt className="mr-1" />
                                {visibleLocations[report._id] ? 'Hide' : 'Map'}
                              </motion.button>
                              
                              <motion.button
                                variants={buttonVariants}
                                whileHover="hover"
                                whileTap="tap"
                                onClick={() => handleCctvReview(report)}
                                className={`bg-purple-500 hover:bg-purple-600 text-white px-2 py-1 rounded text-xs flex items-center justify-center w-full`}
                              >
                                <FaVideo className="mr-1" />
                                CCTV
                              </motion.button>
                            </div>
                          </td>
                        </motion.tr>
                      );
                    })}
                  </AnimatePresence>
                </tbody>
              </table>
            </div>
          </div>
        )}
      </motion.div>

      {/* Resolved Incidents Modal */}
      {showResolvedModal && (
        <ResolvedIncidentsModal
          isOpen={showResolvedModal}
          onClose={handleCloseResolvedModal}
          resolvedIncidents={resolvedIncidents}
        />
      )}
      
      {/* CCTV Review Panel */}
      <AnimatePresence>
        {selectedReport && activePanel === 'cctv' && (
          <CctvReviewPanel 
            incident={selectedReport} 
            onClose={handleCloseCctvReview}
            mapRef={mapRef}
          />
        )}
      </AnimatePresence>
      
      {/* Assistance Details Modal */}
      <AnimatePresence>
        {showAssistanceModal && selectedAssistance && (
          <AssistanceDetailsModal
            details={selectedAssistance}
            onClose={() => setShowAssistanceModal(false)}
          />
        )}
      </AnimatePresence>
      
      {/* Rejection Modal */}
      <AnimatePresence>
        {showRejectionModal && (
          <RejectionModal
            onClose={() => setShowRejectionModal(false)}
            onSubmit={handleRejectionSubmit}
          />
        )}
      </AnimatePresence>

      {/* Details Panel - Modified to slide in from right */}
      <AnimatePresence>
        {selectedReport && activePanel === 'details' && (
          <motion.div
            variants={panelVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className={`fixed right-0 top-0 bottom-0 w-[400px] z-20 shadow-2xl overflow-y-auto ${
              isDarkMode ? 'bg-gray-800 text-gray-100' : 'bg-white text-gray-800'
            }`}
          >
            {/* Header */}
            <div className={`sticky top-0 z-10 px-6 py-4 flex justify-between items-center ${
              isDarkMode ? 'bg-gray-900 border-b border-gray-700' : 'bg-blue-50 border-b border-blue-100'
            }`}>
              <motion.h3 
                className="text-lg font-semibold flex items-center" 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                <FaInfoCircle className={`mr-2 ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`} />
                Incident Details
              </motion.h3>
              <motion.button
                variants={buttonVariants}
                whileHover="hover"
                whileTap="tap"
                onClick={handleCloseDetails}
                className={`p-2 rounded-full ${
                  isDarkMode 
                  ? 'bg-gray-700 hover:bg-gray-600 text-gray-300' 
                  : 'bg-white hover:bg-gray-100 text-gray-700 shadow-sm'
                }`}
              >
                <FaTimes />
              </motion.button>
            </div>
            
            {/* Content */}
            <div className="p-6 space-y-4">
              <motion.div 
                variants={contentVariants}
                custom={0}
                initial="hidden"
                animate="visible"
              >
                <div className={`p-4 rounded-lg ${
                  isDarkMode ? 'bg-gray-700' : 'bg-blue-50'
                }`}>
                  <h4 className={`font-semibold text-lg mb-3 ${
                    isDarkMode ? 'text-blue-300' : 'text-blue-800'
                  }`}>General Information</h4>
                  <div className="space-y-2">
                    <div className="flex">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center mr-3 flex-shrink-0 ${
                        selectedReport.incidentClassification === 'Emergency Incident' 
                        ? isDarkMode ? 'bg-red-900 text-red-200' : 'bg-red-100 text-red-600'
                        : isDarkMode ? 'bg-blue-900 text-blue-200' : 'bg-blue-100 text-blue-600'
                      }`}>
                        {getIncidentTypeIcon(selectedReport.incidentClassification)}
                      </div>
                      <div>
                        <div className="font-medium">{selectedReport.type}</div>
                        <div className={`text-sm ${
                          isDarkMode ? 'text-gray-400' : 'text-gray-600'
                        }`}>{selectedReport.incidentClassification || 'Normal Incident'}</div>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
              
              <motion.div 
                variants={contentVariants}
                custom={1}
                initial="hidden"
                animate="visible"
              >
                <div className={`p-4 rounded-lg ${
                  isDarkMode ? 'bg-gray-700' : 'bg-gray-50'
                }`}>
                  <h4 className={`font-semibold text-lg mb-3 ${
                    isDarkMode ? 'text-gray-200' : 'text-gray-700'
                  }`}>Details</h4>
                  
                  <div className="space-y-3">
                    <div className="flex items-start">
                      <FaCalendarAlt className={`mt-1 mr-3 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`} />
                      <div>
                        <div className="font-medium">Date & Time</div>
                        <div className={isDarkMode ? 'text-gray-300' : 'text-gray-700'}>
                          {formatDate(selectedReport.date)} • {selectedReport.time || 'N/A'}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-start">
                      <FaMapMarkerAlt className={`mt-1 mr-3 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`} />
                      <div>
                        <div className="font-medium">Location</div>
                        <div className={isDarkMode ? 'text-gray-300' : 'text-gray-700'}>
                          {friendlyLocation}
                          {friendlyLocation !== selectedReport.location && (
                            <span className={`block text-xs mt-1 ${
                              isDarkMode ? 'text-gray-400' : 'text-gray-500'
                            }`}>
                              ({selectedReport.location})
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    {selectedReport.locationNote && (
                      <div className="flex items-start">
                        <FaInfoCircle className={`mt-1 mr-3 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`} />
                        <div>
                          <div className="font-medium">Location Note</div>
                          <div className={isDarkMode ? 'text-gray-300' : 'text-gray-700'}>
                            {selectedReport.locationNote}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
              
              <motion.div 
                variants={contentVariants}
                custom={2}
                initial="hidden"
                animate="visible"
              >
                <div className={`p-4 rounded-lg ${
                  isDarkMode ? 'bg-gray-700' : 'bg-gray-50'
                }`}>
                  <h4 className={`font-semibold text-lg mb-3 ${
                    isDarkMode ? 'text-gray-200' : 'text-gray-700'
                  }`}>Status & Reporter</h4>
                  
                  <div className="flex items-center mb-3">
                    <div className={`px-3 py-1 rounded-full ${
                      getStatusColor(selectedReport.status || 'Pending')
                    }`}>
                      {selectedReport.status || 'Pending'}
                    </div>
                  </div>
                  
                  {selectedReport.fullName && (
                    <div className="flex items-start">
                      <FaUserAlt className={`mt-1 mr-3 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`} />
                      <div>
                        <div className="font-medium">Reported By</div>
                        <div className={isDarkMode ? 'text-gray-300' : 'text-gray-700'}>
                          {selectedReport.fullName}
                          {selectedReport.contactNumber && (
                            <div className="flex items-center mt-1 text-sm">
                              <FaPhone className="mr-1" />
                              {selectedReport.contactNumber}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
              
              <motion.div 
                variants={contentVariants}
                custom={3}
                initial="hidden"
                animate="visible"
              >
                <div className={`p-4 rounded-lg ${
                  isDarkMode ? 'bg-gray-700' : 'bg-gray-50'
                }`}>
                  <h4 className={`font-semibold text-lg mb-3 ${
                    isDarkMode ? 'text-gray-200' : 'text-gray-700'
                  }`}>Description</h4>
                  <p className={`whitespace-pre-line ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    {selectedReport.description || 'No description provided'}
                  </p>
                </div>
              </motion.div>
              
              {selectedReport.status === 'In Progress' && (
                <motion.div 
                  variants={contentVariants}
                  custom={4}
                  initial="hidden"
                  animate="visible"
                  className={`p-4 rounded-lg ${
                    isDarkMode ? 'bg-blue-900 bg-opacity-20' : 'bg-blue-50 border border-blue-100'
                  }`}
                >
                  <h4 className={`font-semibold text-lg mb-3 ${
                    isDarkMode ? 'text-blue-300' : 'text-blue-700'
                  }`}>Response Details</h4>
                  <div className="space-y-2">
                    <p className={isDarkMode ? 'text-gray-300' : 'text-gray-700'}>
                      <strong>Responding Officer:</strong> {selectedReport.responderName || 'Unknown'}
                    </p>
                    <p className={isDarkMode ? 'text-gray-300' : 'text-gray-700'}>
                      <strong>Response Started:</strong> {
                        selectedReport.respondedAt 
                        ? new Date(selectedReport.respondedAt).toLocaleString() 
                        : 'N/A'
                      }
                    </p>
                  </div>
                </motion.div>
              )}
              
              {/* Actions */}
              <motion.div 
                variants={contentVariants}
                custom={5}
                initial="hidden"
                animate="visible"
                className="flex justify-end space-x-3 pt-4"
              >
                <motion.button
                  variants={buttonVariants}
                  whileHover="hover"
                  whileTap="tap"
                  onClick={() => {
                    if (selectedReport && selectedReport.location) {
                      handleToggleLocation(selectedReport);
                      handleCloseDetails();
                    }
                  }}
                  className={`px-4 py-2 rounded-lg ${
                    isDarkMode 
                    ? 'bg-green-700 hover:bg-green-600 text-white' 
                    : 'bg-green-500 hover:bg-green-600 text-white'
                  }`}
                >
                  <FaMapMarkerAlt className="inline mr-2" />
                  Show on Map
                </motion.button>
                
                <motion.button
                  variants={buttonVariants}
                  whileHover="hover"
                  whileTap="tap"
                  onClick={() => {
                    handleCctvReview(selectedReport);
                    handleCloseDetails();
                  }}
                  className={`px-4 py-2 rounded-lg ${
                    isDarkMode 
                    ? 'bg-purple-700 hover:bg-purple-600 text-white' 
                    : 'bg-purple-500 hover:bg-purple-600 text-white'
                  }`}
                >
                  <FaVideo className="inline mr-2" />
                  CCTV Review
                </motion.button>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default IncidentReports;

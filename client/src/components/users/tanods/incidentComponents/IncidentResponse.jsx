import React, { useState, useEffect } from "react";
import axios from 'axios';
import { toast } from 'react-toastify';
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "../../../../contexts/ThemeContext";
import { 
  FaClipboardCheck, 
  FaTimes, 
  FaHandsHelping, 
  FaExclamationCircle,
  FaCheckCircle, 
  FaClock, 
  FaSpinner, 
  FaCheck, 
  FaExclamationTriangle,
  FaInfoCircle,
  FaMapMarkerAlt,
  FaFileAlt,
  FaArrowLeft,
  FaUser,
  FaCalendarAlt,
  FaBuilding,
  FaPhone
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

const RespondToIncident = ({ 
  setShowReportIncident,
  selectedIncident,
  setSelectedIncidentForResponse 
}) => {
  const [incidentLog, setIncidentLog] = useState(() => {
    const savedLog = localStorage.getItem(`incident_log_${selectedIncident._id}`);
    return savedLog || "";
  });
  const [assistanceStatus, setAssistanceStatus] = useState(null);
  const [showApprovalDetails, setShowApprovalDetails] = useState(false);
  const [approvalDetails, setApprovalDetails] = useState(null);
  const [assistanceRequest, setAssistanceRequest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [humanReadableLocation, setHumanReadableLocation] = useState('');
  const { isDarkMode } = useTheme();

  // Theme-aware styling
  const cardBg = isDarkMode ? 'bg-gray-800' : 'bg-white';
  const textColor = isDarkMode ? 'text-gray-100' : 'text-gray-800';
  const subTextColor = isDarkMode ? 'text-gray-400' : 'text-gray-600';
  const borderColor = isDarkMode ? 'border-gray-700' : 'border-gray-200';
  const inputBg = isDarkMode ? 'bg-gray-700' : 'bg-white';
  const inputText = isDarkMode ? 'text-white' : 'text-black';
  const inputBorder = isDarkMode ? 'border-gray-600' : 'border-gray-300';
  const panelBg = isDarkMode ? 'bg-gray-700' : 'bg-gray-50';
  const buttonPrimary = isDarkMode ? 'bg-blue-600 hover:bg-blue-700' : 'bg-blue-500 hover:bg-blue-600';
  const buttonDanger = isDarkMode ? 'bg-red-600 hover:bg-red-700' : 'bg-red-500 hover:bg-red-600';

  const handleLogChange = (e) => {
    const newValue = e.target.value;
    setIncidentLog(newValue);
    localStorage.setItem(`incident_log_${selectedIncident._id}`, newValue);
  };

  const handleResolveIncident = async () => {
    if (!incidentLog.trim()) {
      toast.error('Please enter an incident log before resolving');
      return;
    }

    toast.info(
      <div className="flex flex-col">
        <p className="mb-3 font-medium">Do you want to resolve this incident?</p>
        <p className="mb-4 text-sm text-gray-600">This action cannot be undone.</p>
        <div className="flex justify-center space-x-3">
          <motion.button 
            whileHover={{ scale: 1.05 }} 
            whileTap={{ scale: 0.95 }}
            className={`${isDarkMode ? 'bg-green-600 hover:bg-green-700' : 'bg-green-500 hover:bg-green-600'} text-white py-2 px-4 rounded-lg`}
            onClick={async () => {
              toast.dismiss();
              try {
                const token = localStorage.getItem('token');
                const userId = localStorage.getItem('userId');
                
                if (!token || !userId) {
                  toast.error('Authentication required');
                  return;
                }

                const response = await axios.put(
                  `${process.env.REACT_APP_API_URL}/incident-reports/${selectedIncident._id}/status`,
                  {
                    status: 'Resolved',
                    log: incidentLog,
                    userId: userId 
                  },
                  {
                    headers: { Authorization: `Bearer ${token}` }
                  }
                );

                if (response.data) {
                  toast.success('Incident has been resolved and log saved');
                  localStorage.removeItem(`incident_log_${selectedIncident._id}`);
                  setShowReportIncident(false);
                  setSelectedIncidentForResponse(null);
                }
              } catch (error) {
                console.error('Error resolving incident:', error);
                toast.error(error.response?.data?.message || 'Failed to resolve incident');
              }
            }}
          >
            <FaCheckCircle className="mr-2 inline" /> Yes, Resolve Incident
          </motion.button>
          <motion.button 
            whileHover={{ scale: 1.05 }} 
            whileTap={{ scale: 0.95 }}
            className={`${isDarkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-300 hover:bg-gray-400'} ${isDarkMode ? 'text-white' : 'text-gray-800'} py-2 px-4 rounded-lg`}
            onClick={() => toast.dismiss()}
          >
            <FaTimes className="mr-2 inline" /> Cancel
          </motion.button>
        </div>
      </div>,
      { autoClose: false }
    );
  };

  const handleRequestAssistance = async () => {
    try {
      const token = localStorage.getItem('token');
      const userId = localStorage.getItem('userId');
      
      if (!token || !userId) {
        toast.error('Authentication required');
        return;
      }

      toast.info(
        <div className="flex flex-col">
          <p className="mb-3 font-medium">Request assistance for this incident?</p>
          <div className="flex justify-center space-x-3">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={async () => {
                toast.dismiss();
                try {
                  // Get the user profile to ensure we have the responder's name
                  const profileResponse = await axios.get(
                    `${process.env.REACT_APP_API_URL}/auth/me`,
                    { headers: { Authorization: `Bearer ${token}` } }
                  );
                  
                  const responderName = `${profileResponse.data.firstName} ${profileResponse.data.lastName}`;
                  
                  const response = await axios.post(
                    `${process.env.REACT_APP_API_URL}/assistance-requests/create`,
                    {
                      incidentId: selectedIncident._id,
                      requesterId: userId,
                      location: selectedIncident.location,
                      incidentType: selectedIncident.type,
                      incidentClassification: selectedIncident.incidentClassification,
                      dateRequested: new Date(),
                      requesterName: responderName, // Use the name from the user profile
                    },
                    {
                      headers: { Authorization: `Bearer ${token}` }
                    }
                  );

                  if (response.data) {
                    toast.success('Assistance request has been sent');
                    setAssistanceStatus('Pending');
                    setAssistanceRequest(response.data);
                  }
                } catch (error) {
                  console.error('Error requesting assistance:', error);
                  // More descriptive error message
                  const errorMsg = error.response?.data?.message || 'Failed to request assistance';
                  toast.error(`Request failed: ${errorMsg}`);
                }
              }}
              className={`${isDarkMode ? 'bg-blue-600 hover:bg-blue-700' : 'bg-blue-500 hover:bg-blue-600'} text-white py-2 px-4 rounded-lg`}
            >
              <FaHandsHelping className="mr-2 inline" /> Yes, Request Help
            </motion.button>
            
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => toast.dismiss()}
              className={`${isDarkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-300 hover:bg-gray-400'} ${isDarkMode ? 'text-white' : 'text-gray-800'} py-2 px-4 rounded-lg`}
            >
              <FaTimes className="mr-2 inline" /> Cancel
            </motion.button>
          </div>
        </div>,
        { autoClose: false }
      );
    } catch (error) {
      console.error('Error requesting assistance:', error);
      toast.error('Failed to request assistance');
    }
  };

  const handleAssistanceClick = () => {
    if (assistanceRequest) {
      setApprovalDetails(assistanceRequest);
      setShowApprovalDetails(true);
    }
  };

  // Component for status badge with animated icons
  const StatusBadge = ({ status }) => {
    let bgColor, textColor, borderColor, icon;
    
    if (isDarkMode) {
      switch (status) {
        case 'Pending':
          bgColor = 'bg-yellow-900/30';
          textColor = 'text-yellow-300';
          borderColor = 'border-yellow-700';
          icon = <FaClock className="mr-1.5 animate-pulse" />;
          break;
        case 'Processing':
          bgColor = 'bg-blue-900/30';
          textColor = 'text-blue-300';
          borderColor = 'border-blue-700';
          icon = <FaSpinner className="mr-1.5 animate-spin" />;
          break;
        case 'Deployed':
          bgColor = 'bg-indigo-900/30';
          textColor = 'text-indigo-300';
          borderColor = 'border-indigo-700';
          icon = <FaHandsHelping className="mr-1.5" />;
          break;
        case 'Rejected':
          bgColor = 'bg-red-900/30';
          textColor = 'text-red-300';
          borderColor = 'border-red-700';
          icon = <FaExclamationTriangle className="mr-1.5" />;
          break;
        case 'Completed':
          bgColor = 'bg-green-900/30';
          textColor = 'text-green-300';
          borderColor = 'border-green-700';
          icon = <FaCheck className="mr-1.5" />;
          break;
        default:
          bgColor = 'bg-gray-900/30';
          textColor = 'text-gray-300';
          borderColor = 'border-gray-700';
          icon = <FaInfoCircle className="mr-1.5" />;
      }
    } else {
      switch (status) {
        case 'Pending':
          bgColor = 'bg-yellow-100';
          textColor = 'text-yellow-800';
          borderColor = 'border-yellow-200';
          icon = <FaClock className="mr-1.5 animate-pulse" />;
          break;
        case 'Processing':
          bgColor = 'bg-blue-100';
          textColor = 'text-blue-800';
          borderColor = 'border-blue-200';
          icon = <FaSpinner className="mr-1.5 animate-spin" />;
          break;
        case 'Deployed':
          bgColor = 'bg-indigo-100';
          textColor = 'text-indigo-800';
          borderColor = 'border-indigo-200';
          icon = <FaHandsHelping className="mr-1.5" />;
          break;
        case 'Rejected':
          bgColor = 'bg-red-100';
          textColor = 'text-red-800';
          borderColor = 'border-red-200';
          icon = <FaExclamationTriangle className="mr-1.5" />;
          break;
        case 'Completed':
          bgColor = 'bg-green-100';
          textColor = 'text-green-800';
          borderColor = 'border-green-200';
          icon = <FaCheck className="mr-1.5" />;
          break;
        default:
          bgColor = 'bg-gray-100';
          textColor = 'text-gray-800';
          borderColor = 'border-gray-200';
          icon = <FaInfoCircle className="mr-1.5" />;
      }
    }
    
    return (
      <motion.span 
        className={`flex items-center px-3 py-1.5 rounded-full text-sm font-medium border ${bgColor} ${textColor} ${borderColor} cursor-pointer`}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        {icon} Assistance: {status}
      </motion.span>
    );
  };

  const ApprovalDetailsModal = ({ details, onClose }) => {
    if (!details) return null;

    const getStatusStyle = (status) => {
      if (isDarkMode) {
        switch (status) {
          case 'Pending': return 'text-yellow-400';
          case 'Processing': return 'text-blue-400';
          case 'Deployed': return 'text-indigo-400';
          case 'Rejected': return 'text-red-400';
          case 'Completed': return 'text-green-400';
          default: return 'text-gray-400';
        }
      } else {
        switch (status) {
          case 'Pending': return 'text-yellow-600';
          case 'Processing': return 'text-blue-600';
          case 'Deployed': return 'text-indigo-600';
          case 'Rejected': return 'text-red-600';
          case 'Completed': return 'text-green-600';
          default: return 'text-gray-600';
        }
      }
    };

    const renderStatusContent = () => {
      switch (details.status) {
        case 'Rejected':
          return (
            <motion.div 
              variants={containerVariants}
              initial="hidden"
              animate="visible"
            >
              <h4 className={`font-semibold mb-3 ${textColor}`}>Rejection Details</h4>
              {details.rejectedDetails && details.rejectedDetails.length > 0 ? (
                details.rejectedDetails.map((detail, index) => (
                  <motion.div 
                    key={index} 
                    variants={itemVariants}
                    className={`${isDarkMode ? 'bg-red-900/20' : 'bg-red-50'} p-4 rounded-lg mb-3 border ${isDarkMode ? 'border-red-800' : 'border-red-200'}`}
                  >
                    <div className="flex items-center mb-2">
                      <FaBuilding className={`mr-2 ${isDarkMode ? 'text-red-400' : 'text-red-500'}`} />
                      <p className="font-medium">Department: {detail.department}</p>
                    </div>
                    <div className="flex items-center mb-2">
                      <FaUser className={`mr-2 ${isDarkMode ? 'text-red-400' : 'text-red-500'}`} />
                      <p>Rejected By: {detail.rejectorName}</p>
                    </div>
                    <div className="flex items-center mb-2">
                      <FaCalendarAlt className={`mr-2 ${isDarkMode ? 'text-red-400' : 'text-red-500'}`} />
                      <p>Date/Time: {new Date(detail.rejectedDateTime).toLocaleString()}</p>
                    </div>
                    <div className="mt-2 pt-2 border-t border-red-200">
                      <p className="font-medium mb-1">Reason:</p>
                      <p className={isDarkMode ? 'text-red-300' : 'text-red-700'}>{detail.reason}</p>
                      {detail.notes && (
                        <div className="mt-2">
                          <p className="font-medium mb-1">Additional Notes:</p>
                          <p className={isDarkMode ? 'text-red-300/80' : 'text-red-700/80'}>{detail.notes}</p>
                        </div>
                      )}
                    </div>
                  </motion.div>
                ))
              ) : (
                <p className={subTextColor}>No rejection details available</p>
              )}
            </motion.div>
          );

        case 'Processing':
          return (
            <motion.div 
              variants={containerVariants}
              initial="hidden"
              animate="visible"
            >
              <h4 className={`font-semibold mb-3 ${textColor}`}>Approval History</h4>
              {details.approvedDetails && details.approvedDetails.map((detail, index) => (
                <motion.div 
                  key={index} 
                  variants={itemVariants}
                  className={`${isDarkMode ? 'bg-blue-900/20' : 'bg-blue-50'} p-4 rounded-lg mb-3 border ${isDarkMode ? 'border-blue-800' : 'border-blue-200'}`}
                >
                  <div className="flex items-center mb-2">
                    <FaBuilding className={`mr-2 ${isDarkMode ? 'text-blue-400' : 'text-blue-500'}`} />
                    <p className="font-medium">Department: {detail.department}</p>
                  </div>
                  <div className="flex items-center mb-2">
                    <FaUser className={`mr-2 ${isDarkMode ? 'text-blue-400' : 'text-blue-500'}`} />
                    <p>Approved By: {detail.approverName}</p>
                  </div>
                  <div className="flex items-center mb-2">
                    <FaCalendarAlt className={`mr-2 ${isDarkMode ? 'text-blue-400' : 'text-blue-500'}`} />
                    <p>Date/Time: {new Date(detail.approvedDateTime).toLocaleString()}</p>
                  </div>
                  {detail.notes && (
                    <div className="mt-2 pt-2 border-t border-blue-200">
                      <p className="font-medium mb-1">Notes:</p>
                      <p className={isDarkMode ? 'text-blue-300/80' : 'text-blue-700/80'}>{detail.notes}</p>
                    </div>
                  )}
                </motion.div>
              ))}
              <div className={`text-center p-4 rounded-lg mt-4 ${isDarkMode ? 'bg-yellow-900/20' : 'bg-yellow-50'} border ${isDarkMode ? 'border-yellow-800' : 'border-yellow-200'}`}>
                <div className="flex justify-center items-center">
                  <FaSpinner className={`animate-spin mr-2 ${isDarkMode ? 'text-yellow-400' : 'text-yellow-500'}`} />
                  <p className={isDarkMode ? 'text-yellow-300' : 'text-yellow-700'}>
                    {details.approvedDetails?.some(detail => detail.department === "ERDMS")
                      ? "Waiting for assigned responder to deploy..."
                      : "Waiting for emergency response team to process the request..."}
                  </p>
                </div>
              </div>
            </motion.div>
          );

        case 'Deployed':
        case 'Completed':
          return (
            <motion.div 
              variants={containerVariants}
              initial="hidden"
              animate="visible"
            >
              <h4 className={`font-semibold mb-3 ${textColor}`}>Approval History</h4>
              {details.approvedDetails && details.approvedDetails.map((detail, index) => (
                <motion.div 
                  key={index} 
                  variants={itemVariants}
                  className={`${isDarkMode ? 'bg-blue-900/20' : 'bg-blue-50'} p-4 rounded-lg mb-3 border ${isDarkMode ? 'border-blue-800' : 'border-blue-200'}`}
                >
                  <div className="flex items-center mb-2">
                    <FaBuilding className={`mr-2 ${isDarkMode ? 'text-blue-400' : 'text-blue-500'}`} />
                    <p className="font-medium">Department: {detail.department}</p>
                  </div>
                  <div className="flex items-center mb-2">
                    <FaUser className={`mr-2 ${isDarkMode ? 'text-blue-400' : 'text-blue-500'}`} />
                    <p>Approved By: {detail.approverName}</p>
                  </div>
                  <div className="flex items-center mb-2">
                    <FaCalendarAlt className={`mr-2 ${isDarkMode ? 'text-blue-400' : 'text-blue-500'}`} />
                    <p>Date/Time: {new Date(detail.approvedDateTime).toLocaleString()}</p>
                  </div>
                  {detail.notes && (
                    <div className="mt-2 pt-2 border-t border-blue-200">
                      <p className="font-medium mb-1">Notes:</p>
                      <p className={isDarkMode ? 'text-blue-300/80' : 'text-blue-700/80'}>{detail.notes}</p>
                    </div>
                  )}
                </motion.div>
              ))}
              
              {details.responderDetails && details.responderDetails.length > 0 && (
                <>
                  <h4 className={`font-semibold mb-3 mt-6 ${textColor}`}>Responder Details</h4>
                  {details.responderDetails.map((responder, index) => (
                    <motion.div 
                      key={index} 
                      variants={itemVariants}
                      className={`${isDarkMode ? 'bg-green-900/20' : 'bg-green-50'} p-4 rounded-lg mb-3 border ${isDarkMode ? 'border-green-800' : 'border-green-200'}`}
                    >
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-2">
                        <div className="flex items-center">
                          <FaBuilding className={`mr-2 ${isDarkMode ? 'text-green-400' : 'text-green-500'}`} />
                          <p>Department: {responder.department}</p>
                        </div>
                        <div className="flex items-center">
                          <FaUser className={`mr-2 ${isDarkMode ? 'text-green-400' : 'text-green-500'}`} />
                          <p>Name: {responder.responderName}</p>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-2">
                        <div className="flex items-start">
                          <FaPhone className={`mt-1 mr-2 ${isDarkMode ? 'text-green-400' : 'text-green-500'}`} />
                          <p>Contact: {responder.responderContact || 'N/A'}</p>
                        </div>
                        <div className="flex items-center">
                          <FaCalendarAlt className={`mr-2 ${isDarkMode ? 'text-green-400' : 'text-green-500'}`} />
                          <p>Time: {new Date(responder.responseDateTime).toLocaleString()}</p>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 gap-2">
                        <div className="flex items-start">
                          <FaMapMarkerAlt className={`mt-1 mr-2 ${isDarkMode ? 'text-green-400' : 'text-green-500'}`} />
                          <p>Address: {responder.responderAddress || 'N/A'}</p>
                        </div>
                        <div className="flex items-center">
                          <FaInfoCircle className={`mr-2 ${isDarkMode ? 'text-green-400' : 'text-green-500'}`} />
                          <p>Type: {responder.responderType || 'Not specified'}</p>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </>
              )}
              
              {details.status === 'Completed' && (
                <div className={`text-center p-4 rounded-lg mt-4 ${isDarkMode ? 'bg-green-900/20' : 'bg-green-50'} border ${isDarkMode ? 'border-green-800' : 'border-green-200'}`}>
                  <div className="flex justify-center items-center">
                    <FaCheckCircle className={`mr-2 ${isDarkMode ? 'text-green-400' : 'text-green-500'}`} />
                    <p className={isDarkMode ? 'text-green-300' : 'text-green-700'}>
                      Response completed successfully
                    </p>
                  </div>
                </div>
              )}
            </motion.div>
          );

        case 'Pending':
          return (
            <div className={`text-center p-6 rounded-lg ${isDarkMode ? 'bg-yellow-900/20' : 'bg-yellow-50'} border ${isDarkMode ? 'border-yellow-800' : 'border-yellow-200'}`}>
              <FaClock className={`text-4xl mx-auto mb-3 ${isDarkMode ? 'text-yellow-400' : 'text-yellow-500'} animate-pulse`} />
              <p className={`${isDarkMode ? 'text-yellow-300' : 'text-yellow-700'} text-lg font-medium mb-2`}>
                Request Pending
              </p>
              <p className={isDarkMode ? 'text-yellow-400' : 'text-yellow-600'}>
                Your assistance request is waiting for admin approval
              </p>
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
        className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm z-[1060] flex items-center justify-center p-4"
        style={{ touchAction: 'none' }}
        onTouchMove={(e) => e.stopPropagation()}
        onClick={(e) => {
          e.stopPropagation();
          onClose();
        }}
      >
        <motion.div 
          variants={modalVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          className={`max-w-lg w-full rounded-xl shadow-2xl overflow-hidden ${cardBg}`}
          onClick={(e) => e.stopPropagation()}
          onTouchMove={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className={`px-6 py-4 flex justify-between items-center border-b ${borderColor} ${
            details.status === 'Rejected' ? (isDarkMode ? 'bg-red-900/30' : 'bg-red-50') :
            details.status === 'Completed' ? (isDarkMode ? 'bg-green-900/30' : 'bg-green-50') :
            details.status === 'Processing' ? (isDarkMode ? 'bg-blue-900/30' : 'bg-blue-50') :
            details.status === 'Deployed' ? (isDarkMode ? 'bg-indigo-900/30' : 'bg-indigo-50') :
            (isDarkMode ? 'bg-yellow-900/30' : 'bg-yellow-50')
          }`}>
            <h3 className={`text-lg font-bold flex items-center ${textColor}`}>
              <FaHandsHelping className="mr-2" /> Assistance Status Details
            </h3>
            <motion.button
              variants={buttonVariants}
              whileHover="hover"
              whileTap="tap"
              onClick={onClose}
              className={`p-2 rounded-full ${isDarkMode ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-200 text-gray-600'}`}
            >
              <FaTimes />
            </motion.button>
          </div>
          
          {/* Body */}
          <div 
            className="p-6 overflow-y-auto max-h-[calc(85vh-96px)]"
            style={{ touchAction: 'pan-y' }}
            onTouchMove={(e) => e.stopPropagation()}
          >
            <div className="mb-6 flex items-center">
              <div className={`w-3 h-3 rounded-full mr-2 ${
                details.status === 'Rejected' ? (isDarkMode ? 'bg-red-500' : 'bg-red-600') :
                details.status === 'Completed' ? (isDarkMode ? 'bg-green-500' : 'bg-green-600') :
                details.status === 'Processing' ? (isDarkMode ? 'bg-blue-500' : 'bg-blue-600') :
                details.status === 'Deployed' ? (isDarkMode ? 'bg-indigo-500' : 'bg-indigo-600') :
                (isDarkMode ? 'bg-yellow-500' : 'bg-yellow-600')
              } ${
                ['Pending', 'Processing'].includes(details.status) ? 'animate-pulse' : ''
              }`}></div>
              <p className={`font-semibold text-lg ${textColor}`}>
                Current Status: <span className={getStatusStyle(details.status)}>{details.status}</span>
              </p>
            </div>
            
            {renderStatusContent()}
          </div>
          
          {/* Footer */}
          <div className={`border-t ${borderColor} p-4 flex justify-end`}>
            <motion.button
              variants={buttonVariants}
              whileHover="hover"
              whileTap="tap"
              onClick={onClose}
              className={`px-4 py-2 rounded-lg text-sm ${isDarkMode ? 'bg-gray-700 hover:bg-gray-600 text-white' : 'bg-gray-200 hover:bg-gray-300 text-gray-800'}`}
            >
              <FaTimes className="mr-1.5 inline" /> Close
            </motion.button>
          </div>
        </motion.div>
      </motion.div>
    );
  };

  // Function to convert coordinates to human-readable address
  const reverseGeocode = async (locationString) => {
    // Extract latitude and longitude from the location string
    const latLngMatch = locationString.match(/Lat:\s*([0-9.-]+),\s*Lon:\s*([0-9.-]+)/);
    
    if (!latLngMatch) {
      console.log('Could not extract coordinates from location string');
      return null;
    }
    
    const [_, lat, lon] = latLngMatch.map(Number);
    
    try {
      // First, try to use MapQuest's API (requires an API key)
      const apiKey = process.env.REACT_APP_MAPQUEST_API_KEY;
      
      if (apiKey) {
        try {
          const response = await axios.get(
            `https://www.mapquestapi.com/geocoding/v1/reverse?key=${apiKey}&location=${lat},${lon}&outFormat=json`,
            { timeout: 3000 }
          );
          
          if (response.data && response.data.results && response.data.results[0].locations) {
            const location = response.data.results[0].locations[0];
            const address = `${location.street || ''}, ${location.adminArea5 || ''}, ${location.adminArea3 || ''}, ${location.adminArea1 || ''}`;
            
            setHumanReadableLocation(address);
            return address;
          }
        } catch (mqError) {
          console.warn('MapQuest geocoding failed, falling back to alternative method:', mqError);
        }
      }

      // Fallback: Try OpenStreetMap's Nominatim API with a lower timeout
      try {
        const response = await axios.get(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=18&addressdetails=1`,
          { 
            headers: { 
              'Accept-Language': 'en',
              'User-Agent': 'BTPMS-Application'  // Adding a user agent to identify our app
            },
            timeout: 3000
          }
        );
        
        if (response.data && response.data.display_name) {
          setHumanReadableLocation(response.data.display_name);
          return response.data.display_name;
        }
      } catch (nominatimError) {
        console.warn('Nominatim geocoding failed:', nominatimError);
      }
      
      // Final fallback: Use a simple extraction from the coordinates
      const addressFromCoords = `Location at approximately ${Math.abs(lat.toFixed(4))}° ${lat >= 0 ? 'N' : 'S'}, ${Math.abs(lon.toFixed(4))}° ${lon >= 0 ? 'E' : 'W'}`;
      setHumanReadableLocation(addressFromCoords);
      return addressFromCoords;
      
    } catch (error) {
      console.error('Error during reverse geocoding:', error);
      
      // Fallback to raw coordinates in a readable format
      const simpleAddress = `Coordinates: ${lat.toFixed(6)}, ${lon.toFixed(6)}`;
      setHumanReadableLocation(simpleAddress);
      return simpleAddress;
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem('token');
        
        // Fetch incident details
        const incidentResponse = await axios.get(
          `${process.env.REACT_APP_API_URL}/incident-reports/${selectedIncident._id}/details`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        
        if (incidentResponse.data.log) {
          setIncidentLog(incidentResponse.data.log);
          localStorage.setItem(`incident_log_${selectedIncident._id}`, incidentResponse.data.log);
        }

        // Use the address from the incident data if available, otherwise try reverse geocoding
        if (incidentResponse.data.address) {
          setHumanReadableLocation(incidentResponse.data.address);
        } else if (selectedIncident.location) {
          reverseGeocode(selectedIncident.location);
        }

        // Check assistance status and get request details
        const assistanceResponse = await axios.get(
          `${process.env.REACT_APP_API_URL}/assistance-requests/${selectedIncident._id}/status`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        
        if (assistanceResponse.data) {
          setAssistanceStatus(assistanceResponse.data.status);
          setAssistanceRequest(assistanceResponse.data); // Store the full assistance request data
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [selectedIncident._id, selectedIncident.location]);

  const handleClose = () => {
    if (incidentLog.trim()) {
      localStorage.setItem(`incident_log_${selectedIncident._id}`, incidentLog);
    }
    setShowReportIncident(false);
  };

  const getIncidentTypeStyle = () => {
    const isEmergency = selectedIncident.incidentClassification === 'Emergency Incident';
    
    if (isDarkMode) {
      return isEmergency ? 'bg-red-900/30 text-red-300 border-red-700' : 'bg-blue-900/30 text-blue-300 border-blue-700';
    } else {
      return isEmergency ? 'bg-red-100 text-red-800 border-red-200' : 'bg-blue-100 text-blue-800 border-blue-200';
    }
  };

  const getIncidentTypeIcon = () => {
    const isEmergency = selectedIncident.incidentClassification === 'Emergency Incident';
    
    if (isDarkMode) {
      return isEmergency ? 
        <FaExclamationTriangle className="text-red-400" /> : 
        <FaInfoCircle className="text-blue-400" />;
    } else {
      return isEmergency ? 
        <FaExclamationTriangle className="text-red-600" /> : 
        <FaInfoCircle className="text-blue-600" />;
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm z-[1050] flex items-start justify-center overflow-y-auto"
      style={{ touchAction: 'none' }}
      onTouchMove={(e) => e.stopPropagation()}
      onClick={(e) => e.stopPropagation()}
    >
      <motion.div 
        variants={modalVariants}
        initial="hidden"
        animate="visible"
        exit="exit"
        className={`w-full max-w-2xl overflow-hidden rounded-xl shadow-2xl ${cardBg} my-4 mx-4`}
        onClick={(e) => e.stopPropagation()}
        onTouchMove={(e) => e.stopPropagation()}
      >
        {/* Header - fixed at the top */}
        <div className={`px-6 py-4 border-b ${borderColor} flex justify-between items-center bg-gradient-to-r ${
          selectedIncident.incidentClassification === 'Emergency Incident' 
            ? (isDarkMode ? 'from-red-900/30 to-red-800/10' : 'from-red-100 to-red-50') 
            : (isDarkMode ? 'from-blue-900/30 to-blue-800/10' : 'from-blue-100 to-blue-50')
        }`}>
          <div className="flex items-center">
            <div className={`p-2 rounded-lg mr-3 ${getIncidentTypeStyle()}`}>
              {getIncidentTypeIcon()}
            </div>
            <div>
              <h2 className={`text-xl font-bold ${textColor}`}>Respond to Incident</h2>
              <p className={`text-sm ${subTextColor}`}>{selectedIncident.type}</p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {assistanceStatus ? (
              <div onClick={handleAssistanceClick}>
                <StatusBadge status={assistanceStatus} />
              </div>
            ) : (
              <motion.button
                variants={buttonVariants}
                whileHover="hover"
                whileTap="tap"
                onClick={handleRequestAssistance}
                className={`${isDarkMode ? 'bg-yellow-600 hover:bg-yellow-700' : 'bg-yellow-500 hover:bg-yellow-600'} text-white px-3 py-1.5 rounded-lg flex items-center text-sm`}
              >
                <FaHandsHelping className="mr-1.5" /> Request Assistance
              </motion.button>
            )}
            <motion.button
              variants={buttonVariants}
              whileHover="hover"
              whileTap="tap"
              onClick={handleClose}
              className={`${buttonDanger} text-white p-1.5 rounded-lg`}
            >
              <FaTimes />
            </motion.button>
          </div>
        </div>

        {/* Body - scrollable content */}
        <div 
          className="max-h-[calc(100vh-200px)] overflow-y-auto p-6"
          style={{ touchAction: 'pan-y', WebkitOverflowScrolling: 'touch' }}
          onTouchMove={(e) => e.stopPropagation()}
        >
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            {/* Incident Details Section */}
            <motion.div 
              variants={itemVariants}
              className={`mb-6 p-4 rounded-lg border ${borderColor} ${panelBg}`}
            >
              <h3 className={`font-bold mb-3 flex items-center ${textColor}`}>
                <FaFileAlt className="mr-2" /> Incident Details
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <div className="flex items-start mb-3">
                    <FaExclamationCircle className={`mt-1 mr-2 ${subTextColor}`} />
                    <div>
                      <p className={`text-xs font-medium ${subTextColor}`}>Type</p>
                      <p className={textColor}>{selectedIncident.type}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start">
                    <FaMapMarkerAlt className={`mt-1 mr-2 ${subTextColor}`} />
                    <div>
                      <p className={`text-xs font-medium ${subTextColor}`}>Location</p>
                      {selectedIncident.address ? (
                        <p className={textColor}>{selectedIncident.address}</p>
                      ) : (
                        <p className={textColor}>{selectedIncident.location}</p>
                      )}
                      {humanReadableLocation && !selectedIncident.address && (
                        <div className="mt-1">
                          <p className={`text-xs font-medium ${subTextColor}`}>Address</p>
                          <p className={`text-sm ${textColor}`}>{humanReadableLocation}</p>
                        </div>
                      )}
                      {loading && !humanReadableLocation && !selectedIncident.address && (
                        <p className={`text-xs italic mt-1 ${subTextColor}`}>
                          <FaSpinner className="inline-block mr-1 animate-spin" /> Loading address...
                        </p>
                      )}
                    </div>
                  </div>
                </div>
                
                <div>
                  <div className="flex items-start mb-3">
                    <FaFileAlt className={`mt-1 mr-2 ${subTextColor}`} />
                    <div>
                      <p className={`text-xs font-medium ${subTextColor}`}>Description</p>
                      <p className={textColor}>
                        {selectedIncident.description || "No description provided"}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start">
                    <FaInfoCircle className={`mt-1 mr-2 ${subTextColor}`} />
                    <div>
                      <p className={`text-xs font-medium ${subTextColor}`}>Status</p>
                      <p className={`${
                        selectedIncident.status === 'In Progress' ? (isDarkMode ? 'text-yellow-400' : 'text-yellow-600') :
                        selectedIncident.status === 'Resolved' ? (isDarkMode ? 'text-green-400' : 'text-green-600') :
                        selectedIncident.status === 'Pending' ? (isDarkMode ? 'text-blue-400' : 'text-blue-600') :
                        textColor
                      } font-medium`}>
                        {selectedIncident.status}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Log Entry Section */}
            <motion.div variants={itemVariants}>
              <div className="mb-2 flex justify-between items-center">
                <label className={`font-bold flex items-center ${textColor}`}>
                  <FaClipboardCheck className="mr-2" /> Incident Response Log
                </label>
                {loading && (
                  <FaSpinner className="animate-spin text-blue-500" />
                )}
              </div>
              
              <p className={`text-sm mb-2 ${subTextColor}`}>
                Write your incident response details here. The log will be saved when you resolve the incident.
              </p>
              
              <div className="relative">
                <textarea
                  value={incidentLog}
                  onChange={handleLogChange}
                  placeholder="Enter your incident response log here..."
                  className={`border ${inputBorder} p-3 w-full h-36 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${inputBg} ${inputText} resize-none`}
                />
              </div>
            </motion.div>

            {/* Action Buttons */}
            <motion.div 
              variants={itemVariants}
              className="flex justify-end mt-6 space-x-3"
            >
              <motion.button
                variants={buttonVariants}
                whileHover="hover"
                whileTap="tap"
                onClick={handleClose}
                className={`px-4 py-2 rounded-lg text-sm ${isDarkMode ? 'bg-gray-700 hover:bg-gray-600 text-white' : 'bg-gray-200 hover:bg-gray-300 text-gray-800'}`}
              >
                <FaArrowLeft className="mr-1.5 inline" /> Return to Map
              </motion.button>
              
              <motion.button 
                variants={buttonVariants}
                whileHover="hover"
                whileTap="tap"
                onClick={handleResolveIncident}
                className={`${buttonPrimary} text-white px-4 py-2 rounded-lg text-sm`}
              >
                <FaCheckCircle className="mr-1.5 inline" /> Mark as Resolved
              </motion.button>
            </motion.div>
          </motion.div>
        </div>
      </motion.div>

      {/* Approval Details Modal */}
      <AnimatePresence>
        {showApprovalDetails && (
          <ApprovalDetailsModal
            details={approvalDetails}
            onClose={() => setShowApprovalDetails(false)}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default RespondToIncident;
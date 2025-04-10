import React, { useState, useEffect, useRef } from 'react';
import { motion } from "framer-motion";
import axios from "axios";
import { toast, ToastContainer } from "react-toastify";
import {
  FaTimes,
  FaCar,
  FaSync,
  FaCheck,
  FaTimesCircle,
  FaSpinner,
  FaMapMarkedAlt,
  FaCalendarAlt,
  FaRoute,
  FaSortAmountDown,
  FaFilter,
  FaUser,
  FaSearch,
  FaClock,
  FaUserTie
} from "react-icons/fa";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { createPortal } from 'react-dom';
import { useTheme } from '../../../../contexts/ThemeContext';

// Custom Modal Implementation
const Modal = ({ isOpen, onClose, children, className = '' }) => {
  const { isDarkMode } = useTheme();
  
  useEffect(() => {
    // Prevent body scrolling when modal is open
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      
      // Handle ESC key press to close modal
      const handleEsc = (e) => {
        if (e.key === 'Escape') onClose();
      };
      window.addEventListener('keydown', handleEsc);
      return () => {
        window.removeEventListener('keydown', handleEsc);
      };
    }
    
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);
  
  if (!isOpen) return null;
  
  // Base modal styles
  const overlayStyle = `fixed inset-0 flex items-start justify-center z-50 p-4 ${
    isDarkMode ? 'bg-black bg-opacity-70' : 'bg-black bg-opacity-50'
  }`;
  
  const modalBaseStyle = `w-11/12 max-w-4xl mt-20 rounded-lg shadow-lg outline-none ${
    isDarkMode ? 'bg-gray-800 text-white' : 'bg-white'
  } ${className}`;
  
  return createPortal(
    <div className={overlayStyle} onClick={onClose}>
      <div className={modalBaseStyle} onClick={e => e.stopPropagation()}>
        {children}
      </div>
    </div>,
    document.getElementById('modal-root') || document.body
  );
};

// Animation variants
const slideUp = {
  hidden: { y: 50, opacity: 0 },
  visible: { y: 0, opacity: 1, transition: { type: "spring", duration: 0.5 } },
  exit: { y: -20, opacity: 0, transition: { duration: 0.2 } },
};

// Fix the component signature to properly receive props
const VehicleRequestsModal = ({ 
  isOpen, 
  onClose,
  refreshVehicleList, 
}) => {
  // Use the theme context
  const { isDarkMode } = useTheme();

  // Define modalIsOpen state based on isOpen prop
  const [modalIsOpen, setModalIsOpen] = useState(isOpen);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("newest");
  const [showMapModal, setShowMapModal] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [processingRequestId, setProcessingRequestId] = useState(null);
  const [showRejectionInput, setShowRejectionInput] = useState(false);
  const [selectedRequestId, setSelectedRequestId] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [filterStatus, setFilterStatus] = useState("All");
  const wsRef = useRef(null);
  const isConnectedRef = useRef(false);
  const [drivers, setDrivers] = useState([]);

  // Theme-based styling variables
  const headerClass = isDarkMode 
    ? 'bg-gray-900 border-gray-700' 
    : 'bg-gray-100 border-gray-200';
  const buttonClass = isDarkMode
    ? 'bg-blue-600 hover:bg-blue-700 text-white' 
    : 'bg-blue-500 hover:bg-blue-600 text-white';
  
  const inputClass = isDarkMode
    ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400'
    : 'bg-white border-gray-300 text-gray-800 placeholder-gray-500';
    
  const cardBgClass = isDarkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-800';
  
  const statusColors = {
    Pending: isDarkMode ? 'bg-yellow-800 text-yellow-200' : 'bg-yellow-100 text-yellow-800',
    Approved: isDarkMode ? 'bg-green-800 text-green-200' : 'bg-green-100 text-green-800',
    Rejected: isDarkMode ? 'bg-red-800 text-red-200' : 'bg-red-100 text-red-800',
    Completed: isDarkMode ? 'bg-blue-800 text-blue-200' : 'bg-blue-100 text-blue-800'
  };

  // Sync internal state with props
  useEffect(() => {
    setModalIsOpen(isOpen);
  }, [isOpen]);

  useEffect(() => {
    // Only fetch data and connect WebSocket when modal is open
    if (isOpen) {
      fetchRequests();
      setupWebSocket();
      
      // If you need to fetch drivers, do it here
      fetchDrivers();
    }
    
    return () => {
      // Clean up WebSocket when component unmounts or modal closes
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
        isConnectedRef.current = false;
      }
    };
  }, [isOpen]); // Keep isOpen as a dependency

  const fetchDrivers = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(
        `${process.env.REACT_APP_API_URL}/vehicles/drivers`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      
      if (Array.isArray(response.data)) {
        setDrivers(response.data.map(driver => driver._id));
      }
    } catch (error) {
      console.error("Error fetching drivers:", error);
    }
  };

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(
        `${process.env.REACT_APP_API_URL}/vehicles/requests`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      // Sort by creation date (newest first) and by status (pending first)
      const sortedRequests = response.data.sort((a, b) => {
        // First prioritize pending requests
        if (a.status === 'Pending' && b.status !== 'Pending') return -1;
        if (a.status !== 'Pending' && b.status === 'Pending') return 1;
        
        // Then sort by date (newest first)
        return new Date(b.createdAt) - new Date(a.createdAt);
      });
      
      setRequests(sortedRequests);
    } catch (error) {
      console.error("Failed to fetch vehicle requests:", error);
      toast.error("Failed to fetch vehicle requests");
    } finally {
      setLoading(false);
    }
  };

  const setupWebSocket = () => {
    if (!isConnectedRef.current) {
      const token = localStorage.getItem("token");
      const wsUrl = process.env.REACT_APP_WS_URL || 
                   (process.env.REACT_APP_API_URL || "").replace(/^http/, 'ws').replace('/api', '') || 
                   "ws://localhost:5000";
      
      console.log("Connecting to WebSocket at:", wsUrl);
      
      wsRef.current = new WebSocket(`${wsUrl}?token=${token}`);

      wsRef.current.onopen = () => {
        console.log("WebSocket connected successfully for vehicle requests (admin view)");
        isConnectedRef.current = true;
        // Join the vehicle-requests room to receive updates
        wsRef.current.send(JSON.stringify({ type: 'join', room: 'vehicle-requests' }));
      };

      wsRef.current.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log("WebSocket received data:", data);
          
          if (data.type === 'vehicleRequestUpdate') {
            console.log("Received vehicle request update:", data.request);
            updateRequestsList(data.request);
            
            // Show toast notification based on status change
            if (data.request.status === 'Pending' && data.action === 'create') {
              toast.info(`New vehicle request from ${data.request.requesterId?.firstName || 'user'}`);
            }
          }
        } catch (error) {
          console.error("Error processing WebSocket message:", error);
        }
      };

      wsRef.current.onerror = (error) => {
        console.error("WebSocket error:", error);
        isConnectedRef.current = false;
      };

      wsRef.current.onclose = () => {
        console.log("WebSocket disconnected");
        isConnectedRef.current = false;
        
        // Attempt to reconnect if the modal is still open
        if (isOpen) {
          console.log("Attempting to reconnect...");
          setTimeout(setupWebSocket, 3000);
        }
      };
    }
  };

  const updateRequestsList = (updatedRequest) => {
    setRequests(prevRequests => {
      // Check if this request already exists in our list
      const existingIndex = prevRequests.findIndex(req => req._id === updatedRequest._id);
      
      if (existingIndex >= 0) {
        // Update existing request
        const newRequests = [...prevRequests];
        newRequests[existingIndex] = updatedRequest;
        return newRequests;
      } else {
        // Add new request at the beginning
        return [updatedRequest, ...prevRequests];
      }
    });
  };

  // Process approval function with improved real-time handling
  const processApproval = async (requestId) => {
    try {
      setProcessingRequestId(requestId);
      const token = localStorage.getItem("token");
      
      // Use custom toast with higher z-index for approval confirmation
      const loadingToast = toast.loading("Processing approval...", {
        position: "top-center",
        style: { zIndex: 9999 }
      });
      
      await axios.put(
        `${process.env.REACT_APP_API_URL}/vehicles/requests/${requestId}/approve`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      
      toast.dismiss(loadingToast);
      toast.success("Vehicle request approved successfully", {
        position: "top-center", 
        style: { zIndex: 9999 }
      });
      
      // Update the local state immediately for a snappy UI experience
      // WebSocket will also update this, but immediate update feels better
      setRequests(prevRequests =>
        prevRequests.map(req =>
          req._id === requestId ? { ...req, status: 'Approved' } : req
        )
      );
    } catch (error) {
      console.error("Error approving request:", error);
      toast.error(error.response?.data?.message || "Failed to approve request", {
        position: "top-center",
        style: { zIndex: 9999 }
      });
    } finally {
      setProcessingRequestId(null);
    }
  };

  // Handle rejection submit with improved real-time handling
  const handleRejectionSubmit = async (e) => {
    e.preventDefault();
    
    if (!rejectionReason.trim()) {
      toast.error("Please provide a reason for rejection", {
        style: { zIndex: 9999 }
      });
      return;
    }
    
    try {
      setProcessingRequestId(selectedRequestId);
      const token = localStorage.getItem("token");
      
      // Use custom toast with higher z-index for rejection processing
      const loadingToast = toast.loading("Processing rejection...", {
        position: "top-center",
        style: { zIndex: 9999 }
      });
      
      await axios.put(
        `${process.env.REACT_APP_API_URL}/vehicles/requests/${selectedRequestId}/reject`,
        { reason: rejectionReason },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      
      toast.dismiss(loadingToast);
      toast.success("Vehicle request rejected successfully", {
        position: "top-center",
        style: { zIndex: 9999 }
      });
      
      // Close the modal and reset form
      setShowRejectionInput(false);
      setRejectionReason("");
      
      // Update the state immediately for a snappy UI experience
      // WebSocket will also update this, but immediate update feels better
      setRequests(prevRequests =>
        prevRequests.map(req =>
          req._id === selectedRequestId ? { 
            ...req, 
            status: 'Rejected', 
            rejectionReason 
          } : req
        )
      );
      
      setSelectedRequestId(null);
    } catch (error) {
      console.error("Error rejecting request:", error);
      toast.error("Failed to reject request", {
        position: "top-center",
        style: { zIndex: 9999 }
      });
    } finally {
      setProcessingRequestId(null);
    }
  };

  // Update the approval confirmation toast to use higher z-index
  const approveRequest = async (requestId) => {
    // Show confirmation toast before proceeding
    toast.info(
      <div className="flex flex-col space-y-3">
        <p className="font-medium">Approve this vehicle usage request?</p>
        <div className="flex justify-center space-x-3">
          <motion.button 
            whileHover={{ scale: 1.05 }} 
            whileTap={{ scale: 0.95 }}
            onClick={() => {
              toast.dismiss();
              processApproval(requestId);
            }}
            className={`px-3 py-1.5 rounded-lg flex items-center bg-green-500 hover:bg-green-600 text-white`}
          >
            <FaCheck className="mr-1" /> Yes, Approve
          </motion.button>
          <motion.button 
            whileHover={{ scale: 1.05 }} 
            whileTap={{ scale: 0.95 }}
            onClick={() => toast.dismiss()}
            className="px-3 py-1.5 rounded-lg bg-gray-300 hover:bg-gray-400 text-gray-800"
          >
            Cancel
          </motion.button>
        </div>
      </div>,
      { 
        autoClose: false, 
        closeButton: false,
        position: "top-center",
        style: { zIndex: 99999 } // Very high z-index to ensure it's above the modal
      }
    );
  };

  const handleReject = (requestId) => {
    setSelectedRequestId(requestId);
    setShowRejectionInput(true);
  };

  const openMapView = (coordinates) => {
    setSelectedLocation(coordinates);
    setShowMapModal(true);
  };

  // Update modal close handling to properly handle the onClose prop
  const handleCloseModal = () => {
    // Check if onClose is a function before calling it
    if (typeof onClose === 'function') {
      onClose();
    } else {
      // Fallback for when onClose is not provided or not a function
      setModalIsOpen(false);
    }
  };

  // Check if a user is assigned as a driver
  const isDriver = (userId) => {
    return drivers.includes(userId);
  };

  const filteredRequests = requests
    .filter(req => {
      const searchLower = searchTerm.toLowerCase();
      return (
        req.vehicleId?.name?.toLowerCase().includes(searchLower) ||
        req.vehicleId?.licensePlate?.toLowerCase().includes(searchLower) ||
        req.requesterId?.firstName?.toLowerCase().includes(searchLower) ||
        req.requesterId?.lastName?.toLowerCase().includes(searchLower) ||
        req.destination?.toLowerCase().includes(searchLower)
      );
    })
    .filter(req => {
      if (filterStatus === "All") return true;
      return req.status === filterStatus;
    })
    .sort((a, b) => {
      if (sortBy === "newest") {
        return new Date(b.createdAt) - new Date(a.createdAt);
      } else {
        return new Date(a.createdAt) - new Date(b.createdAt);
      }
    });
  
  // Create custom marker icon for map
  const createIcon = () => {
    return new L.Icon({
      iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
      shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34],
      shadowSize: [41, 41]
    });
  };

  return (
    <Modal
      isOpen={modalIsOpen}
      onClose={handleCloseModal}
      contentLabel="Vehicle Requests Modal"
      className={`w-full max-w-6xl m-4 max-h-[90vh] rounded-xl shadow-2xl flex flex-col ${
        isDarkMode ? 'bg-gray-900 text-white' : 'bg-white text-gray-800'
      }`}
      overlayClassName="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm"
      ariaHideApp={false}
    >
      {/* Add this ToastContainer specifically for this modal with higher z-index */}
      <ToastContainer 
        position="top-center"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        style={{ zIndex: 99999 }} // Very high z-index to ensure it's on top
      />
    
      <motion.div
        initial="hidden"
        animate="visible"
        exit="exit"
        variants={slideUp}
        className="w-full h-full flex flex-col overflow-hidden" // Added overflow-hidden to contain scrolling elements
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header - Make sticky */}
        <div className={`${headerClass} px-6 py-4 flex items-center justify-between sticky top-0 z-20`}>
          <div className="flex items-center">
            <FaCar className="text-blue-500 mr-3 text-2xl" />
            <h2 className="text-xl font-bold">Vehicle Usage Requests</h2>
          </div>
          <button
            onClick={handleCloseModal}
            className={`ml-auto p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors focus:outline-none`}
          >
            <FaTimes className="text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        {/* Controls - Make sticky */}
        <div className="p-4 border-b  sticky top-[72px] z-10 ">
          <div className={`flex flex-wrap items-center justify-between gap-2 ${
        isDarkMode ? 'bg-gray-900 text-white' : 'bg-white text-gray-800'}`}>
            <div className="flex space-x-2 flex-1 min-w-[280px]">
              <div className="relative flex-grow ">
                <input
                  type="text"
                  placeholder="Search by name, vehicle or destination..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className={`w-full px-4 py-2 pl-10 pr-4 rounded-lg border ${inputClass}`}
                />
                <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              </div>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setSearchTerm("")}
                className={`px-3 py-2 rounded-lg ${
                  isDarkMode ? 'bg-gray-700 hover:bg-gray-600 text-gray-300' : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
                }`}
              >
                Clear
              </motion.button>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center space-x-1">
                <FaFilter className={isDarkMode ? 'text-gray-400' : 'text-gray-600'} />
                <span className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>Status:</span>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className={`px-3 py-2 rounded-lg border ${inputClass}`}
                >
                  <option value="All">All</option>
                  <option value="Pending">Pending</option>
                  <option value="Approved">Approved</option>
                  <option value="Rejected">Rejected</option>
                  <option value="Completed">Completed</option>
                </select>
              </div>

              <div className="flex items-center space-x-1">
                <FaSortAmountDown className={isDarkMode ? 'text-gray-400' : 'text-gray-600'} />
                <span className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>Sort:</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className={`px-3 py-2 rounded-lg border ${inputClass}`}
                >
                  <option value="newest">Newest First</option>
                  <option value="oldest">Oldest First</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Content - Always enable scrolling */}
        <div className="flex-1 overflow-y-auto p-4 scrollbar-thin">
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <FaSpinner className="animate-spin text-4xl text-blue-500" />
            </div>
          ) : filteredRequests.length === 0 ? (
            <div className="text-center py-12">
              <FaCar className="mx-auto text-6xl mb-4 opacity-20" />
              <h3 className="text-xl font-semibold mb-2">No Vehicle Requests Found</h3>
              <p className={isDarkMode ? 'text-gray-400' : 'text-gray-500'}>
                {searchTerm
                  ? "No results match your search criteria."
                  : filterStatus === "All"
                  ? "There are no vehicle usage requests."
                  : `There are no ${filterStatus.toLowerCase()} vehicle usage requests.`}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredRequests.map((request) => (
                <motion.div
                  key={request._id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className={`rounded-lg shadow-md overflow-hidden border ${
                    isDarkMode ? 'border-gray-700' : 'border-gray-200'
                  } ${cardBgClass}`}
                >
                  <div className={`px-4 py-3 border-b ${
                    isDarkMode ? 'border-gray-700' : 'border-gray-200'
                  } flex justify-between items-center`}>
                    <h3 className="font-semibold flex items-center">
                      <FaCar className="mr-2" /> 
                      {request.vehicleId?.name || "Vehicle"} ({request.vehicleId?.licensePlate || "Unknown"})
                    </h3>
                    <div className={`px-2.5 py-1 text-xs rounded-full font-medium ${statusColors[request.status]}`}>
                      {request.status}
                    </div>
                  </div>

                  <div className="p-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-y-2 gap-x-4 text-sm mb-3">
                      <div className="flex items-start">
                        {isDriver(request.requesterId?._id) ? (
                          <FaUserTie className={`mt-1 mr-2 ${isDarkMode ? 'text-blue-400' : 'text-blue-500'}`} />
                        ) : (
                          <FaUser className={`mt-1 mr-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`} />
                        )}
                        <div>
                          <div className={isDarkMode ? 'text-gray-400' : 'text-gray-500'}>Requested By</div>
                          <div className="font-medium">
                            {request.requesterId?.firstName} {request.requesterId?.lastName}
                            {isDriver(request.requesterId?._id) && (
                              <span className="ml-1 text-xs px-1.5 py-0.5 bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300 rounded">
                                (driver)
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-start">
                        <FaCalendarAlt className={`mt-1 mr-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`} />
                        <div>
                          <div className={isDarkMode ? 'text-gray-400' : 'text-gray-500'}>Date</div>
                          <div className="font-medium">
                            {new Date(request.date).toLocaleDateString()}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-start">
                        <FaRoute className={`mt-1 mr-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`} />
                        <div>
                          <div className={isDarkMode ? 'text-gray-400' : 'text-gray-500'}>Start Mileage</div>
                          <div className="font-medium">{request.startMileage} km</div>
                        </div>
                      </div>
                      
                      <div className="flex items-start">
                        <FaClock className={`mt-1 mr-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`} />
                        <div>
                          <div className={isDarkMode ? 'text-gray-400' : 'text-gray-500'}>Reason</div>
                          <div className="font-medium">{request.reason}</div>
                        </div>
                      </div>

                      <div className="col-span-1 md:col-span-2 flex items-start">
                        <FaMapMarkedAlt className={`mt-1 mr-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`} />
                        <div className="flex-1">
                          <div className={isDarkMode ? 'text-gray-400' : 'text-gray-500'}>Destination</div>
                          <div className="flex justify-between items-center">
                            <div className="font-medium truncate mr-2">{request.destination}</div>
                            {request.destinationCoordinates && (
                              <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => openMapView(request.destinationCoordinates)}
                                className="text-blue-500 px-2 py-1 text-xs rounded hover:bg-blue-100 dark:hover:bg-blue-900"
                              >
                                View Map
                              </motion.button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    {request.status === "Rejected" && request.rejectionReason && (
                      <div className="mb-4 p-3 rounded-md bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-200 text-sm">
                        <strong>Rejection reason:</strong> {request.rejectionReason}
                      </div>
                    )}

                    {request.status === "Completed" && (
                      <div className="mb-4 grid grid-cols-1 md:grid-cols-2 gap-y-2 gap-x-4 text-sm bg-blue-50 dark:bg-blue-900/20 p-3 rounded-md">
                        <div>
                          <span className="text-blue-800 dark:text-blue-300">End Mileage:</span>
                          <span className="ml-2 font-medium">{request.endMileage} km</span>
                        </div>
                        <div>
                          <span className="text-blue-800 dark:text-blue-300">Usage:</span>
                          <span className="ml-2 font-medium">
                            {request.endMileage - request.startMileage} km
                          </span>
                        </div>
                        {request.endDateTime && (
                          <div>
                            <span className="text-blue-800 dark:text-blue-300">End Date/Time:</span>
                            <span className="ml-2 font-medium">
                              {new Date(request.endDateTime).toLocaleString()}
                            </span>
                          </div>
                        )}
                        {request.completionDate && (
                          <div>
                            <span className="text-blue-800 dark:text-blue-300">Completed on:</span>
                            <span className="ml-2 font-medium">
                              {new Date(request.completionDate).toLocaleString()}
                            </span>
                          </div>
                        )}
                        {request.vehicleCondition && (
                          <div className="col-span-2">
                            <span className="text-blue-800 dark:text-blue-300">Condition:</span>
                            <span className="ml-2 font-medium">{request.vehicleCondition}</span>
                          </div>
                        )}
                      </div>
                    )}

                    {request.status === "Pending" && (
                      <div className="flex justify-end space-x-2 mt-2">
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => handleReject(request._id)}
                          disabled={processingRequestId === request._id}
                          className={`px-3 py-1.5 rounded-lg flex items-center ${
                            isDarkMode ? 'bg-red-600 hover:bg-red-700' : 'bg-red-500 hover:bg-red-600'
                          } text-white ${processingRequestId === request._id ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                          {processingRequestId === request._id ? (
                            <FaSpinner className="animate-spin mr-1" />
                          ) : (
                            <FaTimesCircle className="mr-1" />
                          )}
                          Reject
                        </motion.button>
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => approveRequest(request._id)}
                          disabled={processingRequestId === request._id}
                          className={`px-3 py-1.5 rounded-lg flex items-center ${buttonClass} ${
                            processingRequestId === request._id ? 'opacity-50 cursor-not-allowed' : ''
                          }`}
                        >
                          {processingRequestId === request._id ? (
                            <FaSpinner className="animate-spin mr-1" />
                          ) : (
                            <FaCheck className="mr-1" />
                          )}
                          Approve
                        </motion.button>
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </motion.div>

      {/* Map Modal - Add max-height and scrolling */}
      {showMapModal && selectedLocation && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black bg-opacity-70 backdrop-blur-sm overflow-y-auto"
          onClick={() => setShowMapModal(false)}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className={`w-full max-w-2xl m-4 rounded-xl shadow-2xl max-h-[90vh] flex flex-col ${
              isDarkMode ? 'bg-gray-800' : 'bg-white'
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className={`px-6 py-4 border-b ${
              isDarkMode ? 'border-gray-700' : 'border-gray-200'
            } flex justify-between items-center`}>
              <h3 className="font-semibold">Destination Location</h3>
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setShowMapModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <FaTimes />
              </motion.button>
            </div>
            <div className="p-4 overflow-y-auto flex-1">
              <div className="h-[400px]">
                <MapContainer
                  center={[selectedLocation.latitude, selectedLocation.longitude]}
                  zoom={14}
                  style={{ height: "100%", width: "100%" }}
                >
                  <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                  <Marker
                    position={[selectedLocation.latitude, selectedLocation.longitude]}
                    icon={createIcon()}
                  >
                    <Popup>Destination</Popup>
                  </Marker>
                </MapContainer>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* Rejection Reason Modal - Add max-height and scrolling */}
      {showRejectionInput && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black bg-opacity-70 backdrop-blur-sm overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className={`w-full max-w-md rounded-xl shadow-2xl p-6 m-4 ${
              isDarkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-800'
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-xl font-semibold mb-4 flex items-center">
              <FaTimesCircle className={`mr-2 ${isDarkMode ? 'text-red-400' : 'text-red-500'}`} />
              Reject Vehicle Request
            </h3>
            
            <form onSubmit={handleRejectionSubmit}>
              <div className="mb-4">
                <label className={`block text-sm font-medium mb-2 ${
                  isDarkMode ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  Reason for Rejection
                </label>
                <textarea
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  className={`w-full px-3 py-2 rounded-lg border ${inputClass} min-h-[100px]`}
                  placeholder="Please provide a reason for rejecting this request..."
                  required
                />
              </div>
              
              <div className="flex justify-end space-x-3">
                <motion.button
                  type="button"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => {
                    setShowRejectionInput(false);
                    setRejectionReason("");
                    setSelectedRequestId(null);
                  }}
                  className={`px-4 py-2 rounded-lg ${
                    isDarkMode ? 'bg-gray-700 hover:bg-gray-600 text-gray-200' : 'bg-gray-200 hover:bg-gray-300 text-gray-800'
                  }`}
                >
                  Cancel
                </motion.button>
                
                <motion.button
                  type="submit"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  disabled={processingRequestId !== null}
                  className={`px-4 py-2 rounded-lg ${
                    isDarkMode ? 'bg-red-600 hover:bg-red-700' : 'bg-red-500 hover:bg-red-600'
                  } text-white ${processingRequestId ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {processingRequestId ? (
                    <span className="flex items-center">
                      <FaSpinner className="animate-spin mr-2" /> Processing...
                    </span>
                  ) : (
                    <span className="flex items-center">
                      <FaTimesCircle className="mr-2" /> Reject Request
                    </span>
                  )}
                </motion.button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </Modal>
  );
};

export default VehicleRequestsModal;

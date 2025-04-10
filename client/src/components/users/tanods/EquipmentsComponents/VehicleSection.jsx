import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { FaCar, FaHistory, FaPlus, FaInfo, FaArrowLeft, FaCheck, FaTimes, FaExclamationCircle, FaHourglass, FaClock, FaExclamationTriangle, FaTools, FaBan, FaFilter } from 'react-icons/fa';
import axios from 'axios';
import { toast } from 'react-toastify';
import VehicleUsageForm from './VehicleUsageForm';
import VehicleHistory from './VehicleHistory';
import CompleteUsageForm from './CompleteUsageForm';
import VehicleDetail from './VehicleDetail';

const VehicleSection = ({
  assignedVehicles,
  setAssignedVehicles, // Add this missing prop
  selectedVehicle,
  handleVehicleSelect,
  showVehicleForm,
  setShowVehicleForm,
  vehicleUsage,
  handleVehicleUsageChange,
  handleSubmitVehicleUsage,
  vehicleUsageHistory,
  viewingHistory,
  setViewingHistory,
  loadingVehicles,
  fetchVehicleUsageHistory,
  isDarkMode,
  textColor,
  subTextColor,
  borderColor,
  cardBg,
  buttonPrimary,
  buttonSecondary,
  headerClass,
  inputBg,
  inputText
}) => {
  const [pendingRequests, setPendingRequests] = useState([]);
  const [loadingRequests, setLoadingRequests] = useState(true);
  const [activeTab, setActiveTab] = useState('current'); // 'current', 'requests', 'history'
  const [showCompleteForm, setShowCompleteForm] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [viewingDetails, setViewingDetails] = useState(false);
  const wsRef = useRef(null);
  
  // Use a separate reference to track socket connection status
  const socketConnected = useRef(false);

  // Add filter state for showing rejected requests
  const [showRejected, setShowRejected] = useState(false);
  const [requestStatusFilter, setRequestStatusFilter] = useState('active'); // 'active', 'all', 'rejected'

  // Add WebSocket connection for real-time updates
  useEffect(() => {
    // Only create a new connection if one doesn't already exist
    if (!wsRef.current) {
      const token = localStorage.getItem("token");
      const userId = localStorage.getItem("userId");
      
      // Get WebSocket URL from env or fallback
      const wsUrl = process.env.REACT_APP_WS_URL || 
        (process.env.REACT_APP_API_URL || "").replace(/^http/, 'ws').replace('/api', '') || 
        "ws://localhost:5000";
      
      console.log("Connecting to WebSocket at:", wsUrl);
      
      wsRef.current = new WebSocket(`${wsUrl}?token=${token}`);

      wsRef.current.onopen = () => {
        socketConnected.current = true;
        console.log("WebSocket connected for vehicle requests (user view)");
        
        // Join rooms for updates - using consistent format with admin view
        wsRef.current.send(JSON.stringify({ type: "join", room: "vehicle-requests" }));
        wsRef.current.send(JSON.stringify({ type: "join", room: `user-${userId}` }));
      };

      wsRef.current.onmessage = (event) => {
        console.log("WebSocket message received:", event.data);
        try {
          const data = JSON.parse(event.data);
          
          // Handle new or updated vehicle requests - use consistent event naming
          if (data.type === 'vehicleRequestUpdate') {
            console.log("Vehicle request update received:", data);
            const updatedRequest = data.request;
            
            // Check if this request belongs to current user
            if (updatedRequest.requesterId?._id === userId || updatedRequest.requesterId === userId) {
              // Important: Update UI based on the updated request's status
              updatePendingRequests(updatedRequest);
              
              // Immediately switch to appropriate filter based on status change
              if (data.action === 'status-change') {
                if (updatedRequest.status === 'Approved') {
                  setRequestStatusFilter('active');
                  // Set activeTab to 'requests' to make sure the user sees the request tab
                  setActiveTab('requests');
                } else if (updatedRequest.status === 'Rejected') {
                  setRequestStatusFilter('rejected');
                  setActiveTab('requests');
                }
              }
              
              // Also refresh history if the request was completed or rejected
              if (updatedRequest.status === 'Completed' || updatedRequest.status === 'Rejected') {
                if (selectedVehicle && selectedVehicle._id) {
                  fetchVehicleUsageHistory(selectedVehicle._id);
                }
              }
              
              // Show a toast notification for status changes
              if (updatedRequest.status === 'Approved') {
                toast.success(`Your vehicle request for ${updatedRequest.vehicleId?.name} has been approved!`);
              } else if (updatedRequest.status === 'Rejected') {
                toast.error(`Your vehicle request for ${updatedRequest.vehicleId?.name} has been rejected.`);
              } else if (updatedRequest.status === 'Pending' && data.action === 'insert') {
                toast.info(`Your vehicle request for ${updatedRequest.vehicleId?.name} has been submitted.`);
              } else if (updatedRequest.status === 'Completed') {
                toast.success(`Your vehicle usage for ${updatedRequest.vehicleId?.name} has been marked as completed.`);
              }
            }
          }
          
          // Handle vehicle status updates
          if (data.type === 'vehicleStatusUpdate' && selectedVehicle && data.vehicle._id === selectedVehicle._id) {
            const updatedVehicle = data.vehicle;
            // Update the selected vehicle with new status
            handleVehicleSelect(updatedVehicle);
          }
        } catch (error) {
          console.error("Error processing WebSocket message:", error);
        }
      };

      wsRef.current.onerror = (error) => {
        console.error("WebSocket error:", error);
      };

      wsRef.current.onclose = () => {
        socketConnected.current = false;
        // Only log in development environment
        if (process.env.NODE_ENV === 'development') {
          console.log("WebSocket disconnected");
        }
      };
    }

    return () => {
      // Only close the connection if it exists and is open
      if (wsRef.current && socketConnected.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, [selectedVehicle]); // Add selectedVehicle as a dependency
  
  // Function to update pending requests with a new or updated request
  const updatePendingRequests = (updatedRequest) => {
    setPendingRequests(prevRequests => {
      // Find if this request already exists in our pending requests
      const existingIndex = prevRequests.findIndex(req => req._id === updatedRequest._id);
      
      if (existingIndex >= 0) {
        // Update the existing request regardless of status
        const newRequests = [...prevRequests];
        newRequests[existingIndex] = updatedRequest;
        return newRequests;
      } else {
        // Only add if it's a new request
        return [updatedRequest, ...prevRequests];
      }
    });
    
    // If request was approved or rejected, also refresh assigned vehicles
    if (updatedRequest.status === 'Approved' || updatedRequest.status === 'Completed') {
      refreshAssignedVehicles();
    }
  };
  
  // Function to refresh assigned vehicles
  const refreshAssignedVehicles = async () => {
    try {
      const token = localStorage.getItem("token");
      const userId = localStorage.getItem("userId");
      
      const response = await axios.get(
        `${process.env.REACT_APP_API_URL}/vehicles/assigned-to/${userId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      // Update the selected vehicle if it exists in the new list
      if (selectedVehicle && response.data) {
        const updatedSelectedVehicle = response.data.find(v => v._id === selectedVehicle._id);
        if (updatedSelectedVehicle) {
          handleVehicleSelect(updatedSelectedVehicle);
        }
      }
    } catch (error) {
      console.error("Error refreshing assigned vehicles:", error);
    }
  };

  useEffect(() => {
    fetchVehicleRequests();
  }, []);

  // Override the fetchVehicleRequests function to set proper loading state
  const fetchVehicleRequests = async () => {
    setLoadingRequests(true);
    try {
      const token = localStorage.getItem("token");
      const userId = localStorage.getItem("userId");
      const response = await axios.get(
        `${process.env.REACT_APP_API_URL}/vehicles/requests?userId=${userId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      // Include all requests (pending, approved, rejected) for complete history
      setPendingRequests(response.data);
    } catch (error) {
      console.error("Error fetching vehicle requests:", error);
      // Don't show error toast, just set empty array
      setPendingRequests([]);
    } finally {
      setLoadingRequests(false);
    }
  };

  // Add a refresh function that can be passed to child components
  const refreshData = () => {
    // Refresh vehicle requests
    fetchVehicleRequests();
    
    // Refresh vehicle usage history if a vehicle is selected
    if (selectedVehicle && selectedVehicle._id) {
      fetchVehicleUsageHistory(selectedVehicle._id);
    }
    
    // Refresh assigned vehicles to update status
    refreshAssignedVehicles();
  };

  // Filter requests based on status
  const filteredRequests = pendingRequests.filter(request => {
    if (requestStatusFilter === 'active') {
      // Only show approved requests in the active tab
      return request.status === 'Approved';
    } else if (requestStatusFilter === 'pending') {
      // Only show pending (not yet approved or rejected) requests
      return request.status === 'Pending';
    } else if (requestStatusFilter === 'rejected') {
      // Show only rejected requests
      return request.status === 'Rejected';
    } else {
      // Show all requests (pending, approved, rejected)
      return true;
    }
  });

  // Function to handle completing a usage request
  const handleCompleteRequest = (request) => {
    setSelectedRequest(request);
    setShowCompleteForm(true);
  };
  
  // Function to handle viewing vehicle details
  const handleViewVehicleDetails = () => {
    setViewingDetails(!viewingDetails);
  };
  
  // Function to update vehicle condition
  const handleUpdateVehicleCondition = async (vehicleId, condition) => {
    // Show confirmation toast before proceeding
    toast.info(
      <div className="flex flex-col space-y-3">
        <p className="font-medium">Update vehicle condition to {condition}?</p>
        <div className="flex justify-center space-x-3">
          <motion.button 
            whileHover={{ scale: 1.05 }} 
            whileTap={{ scale: 0.95 }}
            onClick={() => {
              toast.dismiss();
              confirmUpdateCondition(vehicleId, condition);
            }}
            className={`py-1.5 px-3 rounded-lg ${buttonPrimary}`}
          >
            Yes, Update
          </motion.button>
          <motion.button 
            whileHover={{ scale: 1.05 }} 
            whileTap={{ scale: 0.95 }}
            onClick={() => toast.dismiss()}
            className={`py-1.5 px-3 rounded-lg ${buttonSecondary}`}
          >
            Cancel
          </motion.button>
        </div>
      </div>,
      { autoClose: false, closeButton: false }
    );
  };

  // Simplified condition update function with direct URL
  const confirmUpdateCondition = async (vehicleId, condition) => {
    try {
      const loadingToast = toast.loading("Updating vehicle condition...");
      const token = localStorage.getItem("token");
      
      // Directly use the environment variable - simplified URL construction
      const apiUrl = process.env.REACT_APP_API_URL.replace(/\/$/, '');
      
      // Get the status based on condition
      const newStatus = getStatusFromCondition(condition);
      console.log(`Setting new status: ${newStatus} based on condition: ${condition}`);
      
      // Include both condition and status in the update request
      const url = `${apiUrl}/vehicles/${vehicleId}/condition`;
      console.log(`Sending condition update to: ${url}`);
      
      const response = await fetch(url, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          condition,
          status: newStatus 
        })
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Server responded with ${response.status}: ${errorText}`);
      }
      
      const data = await response.json();
      toast.dismiss(loadingToast);
      
      // Update the vehicle in state
      if (selectedVehicle && selectedVehicle._id === vehicleId) {
        const updatedVehicle = {
          ...selectedVehicle,
          condition: condition,
          status: newStatus
        };
        
        handleVehicleSelect(updatedVehicle);
        
        // Update assignedVehicles if the setter exists
        if (typeof setAssignedVehicles === 'function') {
          setAssignedVehicles(vehicles => 
            vehicles.map(v => v._id === vehicleId ? {...v, condition, status: newStatus} : v)
          );
        }
      }
      
      toast.success(`Vehicle condition updated to: ${condition}`);
    } catch (error) {
      console.error("Error updating vehicle condition:", error);
      toast.error(`Failed to update vehicle condition: ${error.message}`);
    }
  };

  // Helper function to determine vehicle status based on condition
  const getStatusFromCondition = (condition) => {
    switch(condition) {
      case 'Needs minor maintenance':
      case 'Needs major maintenance':
        return 'Under Maintenance';
      case 'Not operational':
        return 'Out of Service';
      case 'Good condition':
        // If currently in use, keep it as "In Use", otherwise "Available"
        return selectedVehicle && selectedVehicle.status === 'In Use' ? 'In Use' : 'Available';
      default:
        return 'Available';
    }
  };
  
  // Get status badge
  const getStatusBadge = (status) => {
    switch(status) {
      case 'Pending':
        return (
          <span className={`flex items-center text-xs px-2.5 py-0.5 rounded-full ${
            isDarkMode ? 'bg-yellow-900/30 text-yellow-300' : 'bg-yellow-100 text-yellow-800'
          }`}>
            <FaHourglass className="mr-1" /> Pending
          </span>
        );
      case 'Approved':
        return (
          <span className={`flex items-center text-xs px-2.5 py-0.5 rounded-full ${
            isDarkMode ? 'bg-green-900/30 text-green-300' : 'bg-green-100 text-green-800'
          }`}>
            <FaCheck className="mr-1" /> Approved
          </span>
        );
      case 'Rejected':
        return (
          <span className={`flex items-center text-xs px-2.5 py-0.5 rounded-full ${
            isDarkMode ? 'bg-red-900/30 text-red-300' : 'bg-red-100 text-red-800'
          }`}>
            <FaTimes className="mr-1" /> Rejected
          </span>
        );
      case 'Completed':
        return (
          <span className={`flex items-center text-xs px-2.5 py-0.5 rounded-full ${
            isDarkMode ? 'bg-blue-900/30 text-blue-300' : 'bg-blue-100 text-blue-800'
          }`}>
            <FaCheck className="mr-1" /> Completed
          </span>
        );
      default:
        return (
          <span className={`flex items-center text-xs px-2.5 py-0.5 rounded-full ${
            isDarkMode ? 'bg-gray-900/30 text-gray-300' : 'bg-gray-100 text-gray-800'
          }`}>
            {status}
          </span>
        );
    }
  };
  
  // Get vehicle status badge
  const getVehicleStatusBadge = (status, condition) => {
    switch(status) {
      case 'Available':
        return (
          <span className={`flex items-center text-xs px-2.5 py-0.5 rounded-full ${
            isDarkMode ? 'bg-green-900/30 text-green-300 border border-green-700' : 'bg-green-100 text-green-800 border border-green-200'
          }`}>
            <FaCheck className="mr-1" /> Available
          </span>
        );
      case 'In Use':
        return (
          <span className={`flex items-center text-xs px-2.5 py-0.5 rounded-full ${
            isDarkMode ? 'bg-blue-900/30 text-blue-300' : 'bg-blue-100 text-blue-800'
          }`}>
            <FaCar className="mr-1" /> In Use
          </span>
        );
      case 'Under Maintenance':
        return (
          <span className={`flex items-center text-xs px-2.5 py-0.5 rounded-full ${
            isDarkMode ? 'bg-yellow-900/30 text-yellow-300' : 'bg-yellow-100 text-yellow-800'
          }`}>
            <FaTools className="mr-1" /> Under Maintenance
          </span>
        );
      case 'Out of Service':
        return (
          <span className={`flex items-center text-xs px-2.5 py-0.5 rounded-full ${
            isDarkMode ? 'bg-red-900/30 text-red-300' : 'bg-red-100 text-red-800'
          }`}>
            <FaBan className="mr-1" /> Out of Service
          </span>
        );
      default:
        return (
          <span className={`flex items-center text-xs px-2.5 py-0.5 rounded-full ${
            isDarkMode ? 'bg-gray-900/30 text-gray-300' : 'bg-gray-100 text-gray-800'
          }`}>
            {status}
          </span>
        );
    }
  };

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return '';
    
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Function to handle viewing history and set appropriate filters
  const handleViewHistory = (filterType = null) => {
    setViewingHistory(true);
    // You can also pass filter options to the VehicleHistory component
    // For example, automatically set 'completed' or 'rejected' filter
  };

  // Pass refreshData to the child components where needed
  return (
    <div className={`${cardBg} border ${borderColor} rounded-xl shadow-md overflow-hidden`}>
      <div className={`px-6 py-4 flex flex-col md:flex-row justify-between items-start md:items-center ${borderColor} border-b ${headerClass}`}>
        <div className="flex items-center">
          <FaCar className={`mr-3 text-2xl ${isDarkMode ? 'text-blue-400' : 'text-blue-500'}`} />
          <div>
            <h3 className={`text-xl font-semibold ${textColor}`}>Vehicle Management</h3>
            <p className={`text-sm ${subTextColor}`}>{assignedVehicles.length} vehicle(s) assigned to you</p>
          </div>
        </div>
        
        {(!showVehicleForm && !viewingHistory && !showCompleteForm && !viewingDetails) && (
          <div className="mt-4 md:mt-0 flex flex-wrap gap-2">
            <button 
              onClick={() => {
                setActiveTab('current');
              }}
              className={`${activeTab === 'current' ? buttonPrimary : buttonSecondary} py-2 px-4 rounded-lg flex items-center text-sm`}
            >
              <FaCar className="mr-2" /> Assigned Vehicles
            </button>
            
            <button 
              onClick={() => {
                setActiveTab('requests');
              }}
              className={`${activeTab === 'requests' ? buttonPrimary : buttonSecondary} py-2 px-4 rounded-lg flex items-center text-sm`}
            >
              <FaClock className="mr-2" /> Requests {pendingRequests.filter(req => req.status === 'Pending' || req.status === 'Approved').length > 0 && (
                <span className={`ml-1.5 text-xs px-1.5 py-0.5 rounded-full ${
                  isDarkMode ? 'bg-red-500/80' : 'bg-red-500'
                } text-white`}>
                  {pendingRequests.filter(req => req.status === 'Pending' || req.status === 'Approved').length}
                </span>
              )}
            </button>
            
            <button 
              onClick={() => {
                setViewingHistory(true);
              }}
              className={`${buttonSecondary} py-2 px-4 rounded-lg flex items-center text-sm`}
            >
              <FaHistory className="mr-2" /> Usage History
            </button>
          </div>
        )}
        
        {(viewingHistory || showVehicleForm || showCompleteForm || viewingDetails) && (
          <button
            onClick={() => {
              setViewingHistory(false);
              setShowVehicleForm(false);
              setShowCompleteForm(false);
              setViewingDetails(false);
            }}
            className={`${buttonSecondary} py-2 px-4 rounded-lg flex items-center text-sm`}
          >
            <FaArrowLeft className="mr-2" /> Back
          </button>
        )}
      </div>
      
      <div className="p-6">
        {/* Vehicle Request Form */}
        {showVehicleForm && (
          <VehicleUsageForm
            selectedVehicle={selectedVehicle}
            setShowVehicleForm={setShowVehicleForm}
            isDarkMode={isDarkMode}
            cardBg={cardBg}
            borderColor={borderColor}
            textColor={textColor}
            subTextColor={subTextColor}
            inputBg={inputBg}
            inputText={inputText}
            buttonPrimary={buttonPrimary}
            buttonSecondary={buttonSecondary}
            refreshRequests={refreshData} // Pass the refresh function
          />
        )}
        
        {/* Vehicle Details View */}
        {viewingDetails && (
          <div className="space-y-6">
            <VehicleDetail 
              vehicle={selectedVehicle}
              isDarkMode={isDarkMode}
              cardBg={cardBg}
              borderColor={borderColor}
              textColor={textColor}
              subTextColor={subTextColor}
            />
            
            {/* Vehicle Condition Update Section */}
            <div className={`p-4 rounded-lg border ${borderColor}`}>
              <h4 className={`font-semibold ${textColor} mb-3`}>Update Vehicle Condition</h4>
              <div className="flex flex-col space-y-2">
                <p className={`text-sm ${subTextColor} mb-2`}>
                  If you notice any issues with the vehicle, please update its condition accordingly. 
                  This will help in maintaining the vehicle's operational status.
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2">
                  <button
                    onClick={() => handleUpdateVehicleCondition(selectedVehicle._id, 'Good condition')}
                    className={`p-2 rounded-lg flex items-center justify-center ${
                      selectedVehicle.condition === 'Good condition'
                        ? isDarkMode ? 'bg-green-600 text-white' : 'bg-green-500 text-white'
                        : isDarkMode ? 'bg-gray-700 hover:bg-green-700' : 'bg-gray-200 hover:bg-green-100'
                    }`}
                  >
                    <FaCheck className="mr-2" /> Good condition
                  </button>
                  
                  <button
                    onClick={() => handleUpdateVehicleCondition(selectedVehicle._id, 'Needs minor maintenance')}
                    className={`p-2 rounded-lg flex items-center justify-center ${
                      selectedVehicle.condition === 'Needs minor maintenance'
                        ? isDarkMode ? 'bg-yellow-600 text-white' : 'bg-yellow-500 text-white'
                        : isDarkMode ? 'bg-gray-700 hover:bg-yellow-700' : 'bg-gray-200 hover:bg-yellow-100'
                    }`}
                  >
                    <FaTools className="mr-2" /> Minor maintenance
                  </button>
                  
                  <button
                    onClick={() => handleUpdateVehicleCondition(selectedVehicle._id, 'Needs major maintenance')}
                    className={`p-2 rounded-lg flex items-center justify-center ${
                      selectedVehicle.condition === 'Needs major maintenance'
                        ? isDarkMode ? 'bg-orange-600 text-white' : 'bg-orange-500 text-white'
                        : isDarkMode ? 'bg-gray-700 hover:bg-orange-700' : 'bg-gray-200 hover:bg-orange-100'
                    }`}
                  >
                    <FaExclamationTriangle className="mr-2" /> Major maintenance
                  </button>
                  
                  <button
                    onClick={() => handleUpdateVehicleCondition(selectedVehicle._id, 'Not operational')}
                    className={`p-2 rounded-lg flex items-center justify-center ${
                      selectedVehicle.condition === 'Not operational'
                        ? isDarkMode ? 'bg-red-600 text-white' : 'bg-red-500 text-white'
                        : isDarkMode ? 'bg-gray-700 hover:bg-red-700' : 'bg-gray-200 hover:bg-red-100'
                    }`}
                  >
                    <FaBan className="mr-2" /> Not operational
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* Complete Vehicle Usage Form */}
        {showCompleteForm && (
          <CompleteUsageForm
            request={selectedRequest}
            setShowCompleteForm={setShowCompleteForm}
            fetchVehicleRequests={() => {
              // Use the refreshData function for a complete refresh
              refreshData();
            }}
            isDarkMode={isDarkMode}
            cardBg={cardBg}
            borderColor={borderColor}
            textColor={textColor}
            subTextColor={subTextColor}
            inputBg={inputBg}
            inputText={inputText}
            buttonPrimary={buttonPrimary}
            buttonSecondary={buttonSecondary}
          />
        )}
        
        {/* Vehicle History */}
        {viewingHistory && (
          <VehicleHistory
            vehicleUsageHistory={vehicleUsageHistory}
            isDarkMode={isDarkMode}
            borderColor={borderColor}
            textColor={textColor}
            subTextColor={subTextColor}
            refreshHistory={() => fetchVehicleUsageHistory(selectedVehicle?._id)}
          />
        )}
        
        {/* Vehicle List and Requests */}
        {!showVehicleForm && !viewingHistory && !showCompleteForm && !viewingDetails && (
          <>
            {activeTab === 'current' && (
              <>
                {/* Vehicle Selection */}
                <div className="flex flex-wrap gap-4">
                  {assignedVehicles.map((vehicle) => (
                    <motion.div
                      key={vehicle._id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3 }}
                      className={`w-full lg:w-[calc(50%-1rem)] h-auto border ${borderColor} rounded-lg overflow-hidden shadow-sm ${
                        selectedVehicle?._id === vehicle._id ? 
                          (isDarkMode ? 'ring-2 ring-blue-500' : 'ring-2 ring-blue-500') : ''
                      }`}
                      onClick={() => handleVehicleSelect(vehicle)}
                    >
                      <div className="flex p-4">
                        <div className="w-24 h-24 shrink-0 rounded-lg overflow-hidden bg-gray-300 mr-4">
                          {vehicle.imageUrl ? (
                            <img 
                              src={vehicle.imageUrl} 
                              alt={vehicle.name} 
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                e.target.onerror = null;
                                e.target.src = 'https://placehold.co/300x300?text=Vehicle';
                              }}
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <FaCar className="text-4xl text-gray-400" />
                            </div>
                          )}
                        </div>
                        
                        <div className="flex-grow">
                          <h4 className={`font-semibold ${textColor}`}>{vehicle.name}</h4>
                          <div className={`text-sm ${subTextColor} mb-2`}>
                            {vehicle.licensePlate} • {vehicle.model} • {vehicle.color}
                          </div>
                          
                          <div className="flex flex-wrap gap-2 mb-2">
                            {getVehicleStatusBadge(vehicle.status, vehicle.condition)}
                            <span className={`inline-block px-2 py-0.5 text-xs rounded ${
                              isDarkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-700'
                            }`}>
                              {vehicle.type}
                            </span>
                          </div>
                          
                          <div className={`text-sm ${subTextColor}`}>
                            Mileage: {vehicle.currentMileage} km
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
                
                {/* Selected Vehicle Actions */}
                {selectedVehicle && (
                  <div className="mt-6 flex justify-center gap-3 flex-wrap">
                    <motion.button
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.97 }}
                      onClick={handleViewVehicleDetails}
                      className={`${buttonSecondary} py-2 px-6 rounded-lg flex items-center`}
                    >
                      <FaInfo className="mr-2" /> View Details
                    </motion.button>
                    
                    <motion.button
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.97 }}
                      onClick={() => setShowVehicleForm(true)}
                      disabled={selectedVehicle.status !== 'Available'}
                      className={`${
                        selectedVehicle.status === 'Available' 
                          ? buttonPrimary
                          : isDarkMode ? 'bg-gray-700 cursor-not-allowed' : 'bg-gray-300 cursor-not-allowed'
                      } py-2 px-6 rounded-lg flex items-center`}
                    >
                      <FaPlus className="mr-2" /> Request Vehicle Usage
                    </motion.button>

                    {/* Add view history button here for quick access */}
                    <motion.button
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.97 }}
                      onClick={() => handleViewHistory()}
                      className={`${buttonSecondary} py-2 px-6 rounded-lg flex items-center`}
                    >
                      <FaHistory className="mr-2" /> View History
                    </motion.button>
                  </div>
                )}
                
                {/* Status explanation message */}
                {selectedVehicle && selectedVehicle.status !== 'Available' && (
                  <div className={`mt-4 p-4 rounded-lg ${
                    isDarkMode ? 'bg-gray-800 border border-gray-700' : 'bg-gray-100 border border-gray-300'
                  }`}>
                    <div className="flex items-start">
                      <FaExclamationCircle className={`mt-1 mr-3 flex-shrink-0 ${
                        isDarkMode ? 'text-yellow-500' : 'text-yellow-600'
                      }`} />
                      <div>
                        <p className={`font-medium ${textColor}`}>
                          This vehicle is currently {selectedVehicle.status.toLowerCase()}
                        </p>
                        <p className={`text-sm mt-1 ${subTextColor}`}>
                          {selectedVehicle.status === 'In Use' 
                            ? 'The vehicle is currently being used by someone else. Please check back later or request another vehicle.'
                            : selectedVehicle.status === 'Under Maintenance'
                            ? 'The vehicle is currently under maintenance. It will be available once maintenance is completed.'
                            : 'The vehicle is currently out of service and cannot be used. Please select another vehicle.'}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
            
            {/* Requests Tab */}
            {activeTab === 'requests' && (
              <div>
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4">
                  <h4 className={`text-lg font-semibold ${textColor}`}>Vehicle Usage Requests</h4>
                  
                  {/* Add filter controls with refresh button */}
                  <div className="mt-2 md:mt-0 flex items-center space-x-2">
                    <span className={`text-sm ${subTextColor}`}>Show:</span>
                    <div className="flex rounded-lg overflow-hidden border border-gray-300 dark:border-gray-700">
                      <button 
                        onClick={() => setRequestStatusFilter('active')} 
                        className={`px-3 py-1 text-sm ${
                          requestStatusFilter === 'active'
                            ? isDarkMode 
                              ? 'bg-green-600 text-white' 
                              : 'bg-green-500 text-white'
                            : isDarkMode 
                              ? 'bg-gray-800 hover:bg-gray-700' 
                              : 'bg-gray-100 hover:bg-gray-200'
                        }`}
                      >
                        Approved
                      </button>
                      <button 
                        onClick={() => setRequestStatusFilter('pending')} 
                        className={`px-3 py-1 text-sm ${
                          requestStatusFilter === 'pending'
                            ? isDarkMode 
                              ? 'bg-yellow-600 text-white' 
                              : 'bg-yellow-500 text-white'
                            : isDarkMode 
                              ? 'bg-gray-800 hover:bg-gray-700' 
                              : 'bg-gray-100 hover:bg-gray-200'
                        }`}
                      >
                        Pending
                      </button>
                      <button 
                        onClick={() => setRequestStatusFilter('rejected')} 
                        className={`px-3 py-1 text-sm ${
                          requestStatusFilter === 'rejected'
                            ? isDarkMode 
                              ? 'bg-red-600 text-white' 
                              : 'bg-red-500 text-white'
                            : isDarkMode 
                              ? 'bg-gray-800 hover:bg-gray-700' 
                              : 'bg-gray-100 hover:bg-gray-200'
                        }`}
                      >
                        Rejected
                      </button>
                      <button 
                        onClick={() => setRequestStatusFilter('all')} 
                        className={`px-3 py-1 text-sm ${
                          requestStatusFilter === 'all'
                            ? isDarkMode 
                              ? 'bg-gray-600 text-white' 
                              : 'bg-gray-500 text-white'
                            : isDarkMode 
                              ? 'bg-gray-800 hover:bg-gray-700' 
                              : 'bg-gray-100 hover:bg-gray-200'
                        }`}
                      >
                        All
                      </button>
                    </div>
                    
                    {/* Add refresh button */}
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={refreshData}
                      className={`p-1.5 rounded-lg ${buttonSecondary}`}
                      title="Refresh requests"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
                      </svg>
                    </motion.button>
                  </div>
                </div>
                
                {loadingRequests ? (
                  <div className="flex justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
                  </div>
                ) : filteredRequests.length === 0 ? (
                  <div className={`text-center py-8 ${subTextColor}`}>
                    <FaExclamationCircle className="mx-auto text-4xl mb-2 opacity-50" />
                    <p>No {requestStatusFilter === 'active' ? 'approved' : 
                         requestStatusFilter === 'pending' ? 'pending' :
                         requestStatusFilter === 'rejected' ? 'rejected' : ''} vehicle requests</p>
                  </div>
                ) : (
                  <div 
                    className={`space-y-4 ${
                      filteredRequests.length > 3 ? 'max-h-[600px] overflow-y-auto pr-1 scrollbar-thin' : ''
                    }`}
                  >
                    {/* Group requests by status for better organization */}
                    <div>
                      {/* Display requests based on filter instead of hardcoded status */}
                      {filteredRequests.map(request => (
                        <motion.div
                          key={request._id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className={`border ${borderColor} rounded-lg overflow-hidden shadow-sm mb-4`}
                        >
                          <div className={`p-4 ${
                            request.status === 'Approved' ? 
                              isDarkMode ? 'bg-green-900/20' : 'bg-green-50' :
                            request.status === 'Pending' ?
                              isDarkMode ? 'bg-gray-800/50' : 'bg-gray-50' :
                            request.status === 'Rejected' ?
                              isDarkMode ? 'bg-red-900/20' : 'bg-red-50' :
                              isDarkMode ? 'bg-blue-900/20' : 'bg-blue-50'
                          } border-b ${borderColor}`}>
                            <div className="flex justify-between items-center">
                              <div className="flex items-center">
                                <div className={`w-10 h-10 rounded-lg overflow-hidden bg-gray-300 mr-3 flex-shrink-0`}>
                                  {request.vehicleId?.imageUrl ? (
                                    <img 
                                      src={request.vehicleId.imageUrl} 
                                      alt={request.vehicleId.name} 
                                      className="w-full h-full object-cover"
                                    />
                                  ) : (
                                    <div className="w-full h-full flex items-center justify-center">
                                      <FaCar className="text-2xl text-gray-400" />
                                    </div>
                                  )}
                                </div>
                                <div>
                                  <h5 className={`font-semibold ${textColor}`}>
                                    {request.vehicleId?.name || 'Vehicle'} ({request.vehicleId?.licensePlate || 'N/A'})
                                  </h5>
                                  <div className={`text-xs ${subTextColor}`}>
                                    {request.status === 'Approved' ? 'Approved on ' + formatDate(request.approvalDate || request.updatedAt) :
                                     request.status === 'Pending' ? 'Requested on ' + formatDate(request.createdAt) :
                                     request.status === 'Rejected' ? 'Rejected on ' + formatDate(request.rejectionDate || request.updatedAt) :
                                     'Completed on ' + formatDate(request.completionDate || request.updatedAt)}
                                  </div>
                                </div>
                              </div>
                              <div className="ml-4">
                                {getStatusBadge(request.status)}
                              </div>
                            </div>
                          </div>
                          
                          <div className="p-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                              <div>
                                <div className={`text-xs ${subTextColor} mb-1`}>Date</div>
                                <div className={`text-sm ${textColor}`}>{formatDate(request.date)}</div>
                              </div>
                              <div>
                                <div className={`text-xs ${subTextColor} mb-1`}>Reason</div>
                                <div className={`text-sm ${textColor}`}>{request.reason}</div>
                              </div>
                              <div>
                                <div className={`text-xs ${subTextColor} mb-1`}>Start Mileage</div>
                                <div className={`text-sm ${textColor}`}>{request.startMileage} km</div>
                              </div>
                              <div>
                                <div className={`text-xs ${subTextColor} mb-1`}>Destination</div>
                                <div className={`text-sm ${textColor}`}>{request.destination}</div>
                              </div>
                              
                              {/* Show end mileage and distance for completed requests */}
                              {request.status === 'Completed' && (
                                <>
                                  <div>
                                    <div className={`text-xs ${subTextColor} mb-1`}>End Mileage</div>
                                    <div className={`text-sm ${textColor}`}>{request.endMileage} km</div>
                                  </div>
                                  <div>
                                    <div className={`text-xs ${subTextColor} mb-1`}>Distance</div>
                                    <div className={`text-sm ${textColor}`}>{(request.endMileage - request.startMileage).toFixed(1)} km</div>
                                  </div>
                                </>
                              )}
                            </div>
                            
                            {/* Status-specific message boxes */}
                            {request.status === 'Pending' && (
                              <div className={`mt-3 p-3 rounded-md ${
                                isDarkMode ? 'bg-yellow-900/20 text-yellow-300' : 'bg-yellow-50 text-yellow-700'
                              }`}>
                                <div className="font-medium mb-1">Awaiting Approval</div>
                                <div className="text-sm">Your request is pending approval from an administrator. You'll be notified once it's approved.</div>
                              </div>
                            )}
                            
                            {request.status === 'Approved' && (
                              <div className={`mt-3 p-3 rounded-md ${
                                isDarkMode ? 'bg-green-900/20 text-green-300' : 'bg-green-50 text-green-700'
                              }`}>
                                <div className="font-medium mb-1">You're good to go!</div>
                                <div className="text-sm">This request has been approved. You can now use the vehicle. When you're finished, please complete the usage form.</div>
                              </div>
                            )}
                            
                            {request.status === 'Rejected' && request.rejectionReason && (
                              <div className={`mt-3 p-3 rounded-md ${
                                isDarkMode ? 'bg-red-900/20 text-red-300' : 'bg-red-50 text-red-700'
                              }`}>
                                <div className="font-medium mb-1">Rejection Reason:</div>
                                <div className="text-sm">{request.rejectionReason}</div>
                              </div>
                            )}
                            
                            {request.status === 'Completed' && request.vehicleCondition && (
                              <div className={`mt-3 p-3 rounded-md ${
                                request.vehicleCondition === 'Good condition'
                                  ? isDarkMode ? 'bg-green-900/20 text-green-300' : 'bg-green-50 text-green-700'
                                  : isDarkMode ? 'bg-yellow-900/20 text-yellow-300' : 'bg-yellow-50 text-yellow-700'
                              }`}>
                                <div className="font-medium mb-1">Vehicle Condition:</div>
                                <div className={`text-sm flex items-center`}>
                                  {request.vehicleCondition === 'Good condition' ? <FaCheck className="mr-1" /> : 
                                   request.vehicleCondition === 'Needs minor maintenance' ? <FaTools className="mr-1" /> :
                                   <FaExclamationTriangle className="mr-1" />} {request.vehicleCondition}
                                </div>
                              </div>
                            )}
                            
                            {/* Action buttons */}
                            {request.status === 'Approved' && (
                              <div className="mt-4 flex justify-end">
                                <motion.button
                                  whileHover={{ scale: 1.03 }}
                                  whileTap={{ scale: 0.97 }}
                                  onClick={() => handleCompleteRequest(request)}
                                  className={`${buttonPrimary} py-2 px-4 rounded-lg text-sm flex items-center`}
                                >
                                  <FaCheck className="mr-1.5" /> Complete Usage
                                </motion.button>
                              </div>
                            )}
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
            
            {/* ...existing code... */}
          </>
        )}
      </div>
    </div>
  );
};

export default VehicleSection;

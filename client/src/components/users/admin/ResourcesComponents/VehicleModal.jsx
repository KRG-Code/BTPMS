import React, { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";
import { toast } from "react-toastify";
import {
  FaTimes,
  FaCar,
  FaPlus,
  FaEdit,
  FaTrash,
  FaSync,
  FaUserCircle,
  FaUsers,
  FaCloudUploadAlt,
  FaSearch,
  FaUserPlus,
  FaCheck,
  FaExchangeAlt,
  FaClock,
  FaCheckCircle,
  FaTimesCircle,
  FaExclamationCircle,
} from "react-icons/fa";

const slideUp = {
  hidden: { y: 50, opacity: 0 },
  visible: { y: 0, opacity: 1, transition: { type: "spring", duration: 0.5 } },
  exit: { y: -20, opacity: 0, transition: { duration: 0.2 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
};

const generateYearOptions = () => {
  const currentYear = new Date().getFullYear();
  const startYear = 1990; // You can adjust this to a reasonable starting year
  const years = [];
  
  for (let year = currentYear; year >= startYear; year--) {
    years.push(year);
  }
  
  return years;
};

const VehicleModal = ({
  vehicles,
  setVehicles,
  showVehicleModal,
  setShowVehicleModal,
  isDarkMode,
  tanods,
  uploadProfileImage,
  refreshVehicles, // New prop
  baseURL, // New prop
}) => {
  const [newVehicle, setNewVehicle] = useState({
    name: "",
    type: "",
    licensePlate: "",
    model: "",
    year: "",
    color: "",
    currentMileage: "",
    status: "Available",
    assignedDriver: "",
    imageUrl: null,
  });
  const [editMode, setEditMode] = useState(false);
  const [currentVehicleId, setCurrentVehicleId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [imagePreview, setImagePreview] = useState(null);
  const [vehicleImageFile, setVehicleImageFile] = useState(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [discardChangesToastId, setDiscardChangesToastId] = useState(null);
  const [debugMode, setDebugMode] = useState(false);
  
  // Add new states for driver assignment with detailed panel view
  const [showAssignDriverModal, setShowAssignDriverModal] = useState(false);
  const [currentVehicleForDriver, setCurrentVehicleForDriver] = useState(null);
  const [selectedDriverId, setSelectedDriverId] = useState("");
  const [searchDriverTerm, setSearchDriverTerm] = useState("");
  const [previewDriver, setPreviewDriver] = useState(null); // For the right panel preview
  const [driverSearchQuery, setDriverSearchQuery] = useState(""); // Fix: Add the missing state variable
  const [isProcessing, setIsProcessing] = useState(false); // Add state to track processing state

  const [vehicleRequests, setVehicleRequests] = useState([]);
  const [loadingRequests, setLoadingRequests] = useState(false);
  const [activeTab, setActiveTab] = useState('vehicles');

  // Reset form function
  const resetForm = () => {
    setNewVehicle({
      name: "",
      type: "",
      licensePlate: "",
      model: "",
      year: "",
      color: "",
      currentMileage: "",
      status: "Available",
      assignedDriver: "",
      imageUrl: null,
    });
    setEditMode(false);
    setCurrentVehicleId(null);
    setImagePreview(null);
    setVehicleImageFile(null);
    setShowForm(false);
  };

  // Log vehicles data when the component mounts or vehicles changes
  useEffect(() => {
    console.log("VehicleModal received vehicles:", vehicles);
    
    // Check if vehicles array is empty
    if (!vehicles || vehicles.length === 0) {
      console.warn("No vehicles data available. Consider refreshing the data.");
    }
  }, [vehicles]);

  // Toggle form visibility with toast confirmation
  const toggleForm = () => {
    if (showForm && (editMode || Object.values(newVehicle).some((val) => val !== "" && val !== null))) {
      // Use toast for confirmation instead of window.confirm
      if (discardChangesToastId) {
        toast.dismiss(discardChangesToastId);
      }
      
      const id = toast.info(
        <div className="flex flex-col space-y-3">
          <p className="font-medium">Discard changes?</p>
          <div className="flex justify-center space-x-3">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className={`px-3 py-1.5 rounded-md ${isDarkMode ? 'bg-red-600 hover:bg-red-700' : 'bg-red-500 hover:bg-red-600'} text-white`}
              onClick={() => {
                setShowForm(!showForm);
                if (showForm) {
                  resetForm();
                }
                toast.dismiss(id);
                setDiscardChangesToastId(null);
              }}
            >
              Yes, Discard
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className={`px-3 py-1.5 rounded-md ${isDarkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-300 hover:bg-gray-400'} ${isDarkMode ? 'text-white' : 'text-gray-800'}`}
              onClick={() => {
                toast.dismiss(id);
                setDiscardChangesToastId(null);
              }}
            >
              Keep Editing
            </motion.button>
          </div>
        </div>,
        { autoClose: false, closeButton: false, closeOnClick: false }
      );
      
      setDiscardChangesToastId(id);
      return;
    }
    
    setShowForm(!showForm);
    if (showForm) {
      resetForm();
    }
  };

  // Handle image selection for vehicles
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image size should be less than 5MB");
      return;
    }

    if (!file.type.match("image.*")) {
      toast.error("Please select an image file");
      return;
    }

    try {
      const previewURL = URL.createObjectURL(file);
      setImagePreview(previewURL);
      setVehicleImageFile(file);

      toast.info("Image selected. Click Save to upload your new vehicle image.");
    } catch (error) {
      toast.error("Failed to prepare image preview");
    }
  };

  // Handle input change
  const handleChange = (e) => {
    const { name, value } = e.target;
    setNewVehicle({
      ...newVehicle,
      [name]: value,
    });
  };

  // Add or update vehicle
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate required fields
    const requiredFields = ['name', 'type', 'licensePlate', 'model', 'year', 'color', 'currentMileage'];
    const missingFields = requiredFields.filter(field => !newVehicle[field]);
    
    if (missingFields.length > 0) {
      toast.error(`Please fill in all required fields: ${missingFields.join(', ')}`);
      return;
    }

    try {
      setUploadingImage(true);
      let updatedVehicle = { ...newVehicle };

      // Handle image upload if a file was selected
      if (vehicleImageFile) {
        try {
          const uniqueId = Date.now().toString();
          const imageUrl = await uploadProfileImage(vehicleImageFile, `vehicle_${uniqueId}`);

          if (imageUrl) {
            updatedVehicle.imageUrl = imageUrl;
          }
        } catch (uploadError) {
          toast.error("Failed to upload image, but continuing with vehicle update");
        }
      }

      const token = localStorage.getItem("token");
      if (!token) {
        toast.error("Authentication required");
        return;
      }

      if (editMode && currentVehicleId) {
        const response = await axios.put(
          `${process.env.REACT_APP_API_URL}/vehicles/${currentVehicleId}`,
          updatedVehicle,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        setVehicles((prevVehicles) =>
          prevVehicles.map((vehicle) =>
            vehicle._id === currentVehicleId ? response.data : vehicle
          )
        );
        toast.success("Vehicle updated successfully");
      } else {
        const response = await axios.post(
          `${process.env.REACT_APP_API_URL}/vehicles`,
          updatedVehicle,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        setVehicles([...vehicles, response.data]);
        toast.success("Vehicle added successfully");
      }

      resetForm();
    } catch (error) {
      console.error("Error saving vehicle:", error);
      toast.error(error.response?.data?.message || "Failed to save vehicle");
    } finally {
      setUploadingImage(false);
    }
  };

  // Edit vehicle
  const handleEdit = (vehicle) => {
    setEditMode(true);
    setCurrentVehicleId(vehicle._id);
    setNewVehicle({
      name: vehicle.name,
      type: vehicle.type,
      licensePlate: vehicle.licensePlate,
      model: vehicle.model,
      year: vehicle.year,
      color: vehicle.color,
      currentMileage: vehicle.currentMileage,
      status: vehicle.status,
      assignedDriver: vehicle.assignedDriver?._id || "",
      imageUrl: vehicle.imageUrl,
    });
    setImagePreview(vehicle.imageUrl);
    setShowForm(true);
  };

  // Delete vehicle
  const handleDelete = (vehicleId) => {
    setConfirmDelete(vehicleId);
  };

  // Confirm delete
  const confirmDeleteVehicle = async () => {
    if (!confirmDelete) return;

    try {
      const token = localStorage.getItem("token");
      await axios.delete(`${process.env.REACT_APP_API_URL}/vehicles/${confirmDelete}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setVehicles((prevVehicles) =>
        prevVehicles.filter((vehicle) => vehicle._id !== confirmDelete)
      );
      toast.success("Vehicle deleted successfully");
    } catch (error) {
      toast.error("Failed to delete vehicle");
    } finally {
      setConfirmDelete(null);
    }
  };

  // Open the driver assignment modal for a specific vehicle
  const openAssignDriverModal = (vehicle) => {
    setCurrentVehicleForDriver(vehicle);
    setSelectedDriverId(vehicle.assignedDriver?._id || "");
    
    // If there's already a driver assigned, set them as the preview
    if (vehicle.assignedDriver) {
      const currentDriver = tanods.find(t => t._id === vehicle.assignedDriver._id);
      setPreviewDriver(currentDriver || vehicle.assignedDriver);
    } else {
      setPreviewDriver(null);
    }
    
    setShowAssignDriverModal(true);
    setDriverSearchQuery(""); // Fix: Reset search query when opening modal
  };
  
  // Close the driver assignment modal
  const closeAssignDriverModal = () => {
    setShowAssignDriverModal(false);
    setCurrentVehicleForDriver(null);
    setSelectedDriverId("");
    setPreviewDriver(null);
  };
  
  // Handle driver selection in the left panel
  const handleDriverSelect = (driver) => {
    // If selecting the same driver, toggle selection
    if (selectedDriverId === driver._id) {
      setSelectedDriverId("");
      setPreviewDriver(null);
    } else {
      setSelectedDriverId(driver._id);
      setPreviewDriver(driver);
    }
  };
  
  // Handle assigning driver with toast confirmation
  const handleAssignDriver = () => {
    if (!currentVehicleForDriver) return;
    
    // If removing a driver, show confirmation first
    if (currentVehicleForDriver.assignedDriver && !selectedDriverId) {
      toast.info(
        <div className="flex flex-col space-y-3">
          <p>Remove driver from this vehicle?</p>
          <div className="flex justify-center space-x-3">
            <motion.button 
              whileHover={{ scale: 1.05 }} 
              whileTap={{ scale: 0.95 }}
              className={`px-3 py-1.5 rounded-md ${isDarkMode ? 'bg-red-600 hover:bg-red-700' : 'bg-red-500 hover:bg-red-600'} text-white`}
              onClick={confirmAssignDriver}
            >
              Yes, Remove
            </motion.button>
            <motion.button 
              whileHover={{ scale: 1.05 }} 
              whileTap={{ scale: 0.95 }}
              className={`px-3 py-1.5 rounded-md ${isDarkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-300 hover:bg-gray-400'} ${isDarkMode ? 'text-white' : 'text-gray-800'}`}
              onClick={() => toast.dismiss()}
            >
              Cancel
            </motion.button>
          </div>
        </div>,
        { autoClose: false, closeButton: false }
      );
    } else if (selectedDriverId) {
      // If assigning a driver, show confirmation
      const selectedDriver = tanods.find(t => t._id === selectedDriverId);
      toast.info(
        <div className="flex flex-col space-y-3">
          <p>Assign {selectedDriver?.firstName} {selectedDriver?.lastName} to this vehicle?</p>
          <div className="flex justify-center space-x-3">
            <motion.button 
              whileHover={{ scale: 1.05 }} 
              whileTap={{ scale: 0.95 }}
              className={`px-3 py-1.5 rounded-md ${isDarkMode ? 'bg-green-600 hover:bg-green-700' : 'bg-green-500 hover:bg-green-600'} text-white`}
              onClick={confirmAssignDriver}
            >
              Yes, Assign
            </motion.button>
            <motion.button 
              whileHover={{ scale: 1.05 }} 
              whileTap={{ scale: 0.95 }}
              className={`px-3 py-1.5 rounded-md ${isDarkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-300 hover:bg-gray-400'} ${isDarkMode ? 'text-white' : 'text-gray-800'}`}
              onClick={() => toast.dismiss()}
            >
              Cancel
            </motion.button>
          </div>
        </div>,
        { autoClose: false, closeButton: false }
      );
    } else {
      // No action to take
      toast.warning("Please select a driver to assign");
    }
  };
  
  // Confirm driver assignment after toast confirmation - FIX API ENDPOINT
  const confirmAssignDriver = async () => {
    // Dismiss current toast
    toast.dismiss();
    
    if (isProcessing) return; // Prevent multiple submissions
    setIsProcessing(true);
    
    try {
      const loadingToastId = toast.loading("Updating driver assignment...");
      
      const token = localStorage.getItem("token");
      let response;
      
      // FIX: Remove redundant /api prefix since it's already in baseURL
      if (selectedDriverId) {
        // Assigning a driver - use PUT to assign-driver endpoint with the vehicle ID
        response = await axios.put(
          `${baseURL}/vehicles/${currentVehicleForDriver._id}/assign-driver`,
          { driverId: selectedDriverId },
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
      } else {
        // Removing a driver - use PUT to remove-driver endpoint with the vehicle ID
        response = await axios.put(
          `${baseURL}/vehicles/${currentVehicleForDriver._id}/remove-driver`,
          {},
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
      }

      // IMPORTANT: Update the state with the returned vehicle that has the populated driver information
      if (response.data) {
        // Replace the vehicle in the vehicles array with the updated one
        const updatedVehicles = vehicles.map(vehicle => 
          vehicle._id === currentVehicleForDriver._id ? response.data : vehicle
        );
        
        // Update the vehicles state with the new array
        setVehicles(updatedVehicles);
        
        // Also update the currentVehicleForDriver to reflect changes immediately
        setCurrentVehicleForDriver(response.data);
      }
      
      toast.dismiss(loadingToastId);
      
      // Show different success messages for assigning vs removing
      if (selectedDriverId) {
        const driver = tanods.find(t => t._id === selectedDriverId);
        toast.success(`${driver?.firstName} ${driver?.lastName} assigned to ${currentVehicleForDriver.name}`);
      } else {
        toast.success(`Driver removed from ${currentVehicleForDriver.name}`);
      }
      
      // Clear the selected driver state
      setSelectedDriverId("");
      setPreviewDriver(null);
      
      // Automatically close the modal after a short delay
      setTimeout(() => {
        closeAssignDriverModal();
      }, 1500);
      
    } catch (error) {
      console.error("Error assigning driver:", error);
      
      // Show more specific error message
      if (error.response) {
        toast.error(`Failed to update driver assignment: ${error.response.data?.message || error.response.statusText}`);
      } else {
        toast.error("Failed to update driver assignment. Please try again.");
      }
    } finally {
      setIsProcessing(false);
    }
  };

  // Filter drivers based on search term
  const filteredDrivers = useMemo(() => {
    return tanods.filter(driver => {
      const fullName = `${driver.firstName || ''} ${driver.lastName || ''}`.toLowerCase();
      return fullName.includes(driverSearchQuery.toLowerCase());
    });
  }, [tanods, driverSearchQuery]);

  // Filter vehicles based on search term with better error handling
  const filteredVehicles = useMemo(() => {
    try {
      if (!Array.isArray(vehicles)) {
        console.error("vehicles is not an array:", vehicles);
        return [];
      }
      
      return vehicles.filter((vehicle) => {
        if (!vehicle) {
          console.warn("Found null or undefined vehicle in the vehicles array");
          return false;
        }
        
        const searchFields = [
          vehicle.name,
          vehicle.vehicleId,
          vehicle.licensePlate,
          vehicle.model,
          vehicle.type,
          vehicle.color,
          vehicle.status,
          vehicle.assignedDriver?.firstName,
          vehicle.assignedDriver?.lastName,
        ];
        
        return searchFields.some(
          (field) => field && field.toString().toLowerCase().includes(searchTerm.toLowerCase())
        );
      });
    } catch (error) {
      console.error("Error filtering vehicles:", error);
      return [];
    }
  }, [vehicles, searchTerm]);

  // Filter tanods based on search query
  const filteredTanods = useMemo(() => {
    if (!driverSearchQuery.trim()) return tanods;
    
    return tanods.filter(tanod => {
      const fullName = `${tanod.firstName} ${tanod.lastName}`.toLowerCase();
      return fullName.includes(driverSearchQuery.toLowerCase());
    });
  }, [tanods, driverSearchQuery]);

  // Handle manual refresh of vehicle data
  const handleRefreshVehicles = () => {
    if (refreshVehicles) {
      refreshVehicles();
    } else {
      toast.error("Refresh function not available");
    }
  };

  // Theme-based styling
  const modalBgClass = isDarkMode
    ? "bg-gray-900 text-gray-200 border border-gray-700"
    : "bg-white text-gray-800 border border-gray-300";
  const headerClass = isDarkMode
    ? "bg-gray-800 text-gray-200 border-b border-gray-700"
    : "bg-gray-50 text-gray-800 border-b border-gray-200";
  const inputClass = isDarkMode
    ? "bg-gray-700 border-gray-600 text-gray-200 focus:border-blue-500"
    : "bg-white border-gray-300 text-gray-700 focus:border-blue-500";
  const buttonClass = isDarkMode
    ? "bg-blue-600 hover:bg-blue-700 text-white"
    : "bg-blue-500 hover:bg-blue-600 text-white";
  const secondaryButtonClass = isDarkMode
    ? "bg-gray-700 hover:bg-gray-600 text-gray-200"
    : "bg-gray-200 hover:bg-gray-300 text-gray-800";

  // Handle close modal with confirmation
  const handleCloseModal = () => {
    if (showForm && (editMode || Object.values(newVehicle).some((val) => val !== "" && val !== null))) {
      // Use toast for confirmation instead of window.confirm
      if (discardChangesToastId) {
        toast.dismiss(discardChangesToastId);
      }
      
      const id = toast.info(
        <div className="flex flex-col space-y-3">
          <p className="font-medium">Discard changes and close?</p>
          <div className="flex justify-center space-x-3">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className={`px-3 py-1.5 rounded-md ${isDarkMode ? 'bg-red-600 hover:bg-red-700' : 'bg-red-500 hover:bg-red-600'} text-white`}
              onClick={() => {
                setShowVehicleModal(false);
                toast.dismiss(id);
                setDiscardChangesToastId(null);
              }}
            >
              Yes, Close
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className={`px-3 py-1.5 rounded-md ${isDarkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-300 hover:bg-gray-400'} ${isDarkMode ? 'text-white' : 'text-gray-800'}`}
              onClick={() => {
                toast.dismiss(id);
                setDiscardChangesToastId(null);
              }}
            >
              Keep Editing
            </motion.button>
          </div>
        </div>,
        { autoClose: false, closeButton: false, closeOnClick: false }
      );
      
      setDiscardChangesToastId(id);
    } else {
      setShowVehicleModal(false);
    }
  };

  // Modal Footer Section - Update the buttons
  const renderModalFooter = () => (
    <div className={`px-5 py-4 flex justify-end sticky bottom-0 ${isDarkMode ? 'bg-gray-900/50' : 'bg-gray-50'} border-t border-gray-200 dark:border-gray-700`}>
      <button
        onClick={closeAssignDriverModal}
        className={`px-4 py-2 mr-2 rounded-lg ${
          isDarkMode ? 'bg-gray-700 hover:bg-gray-600 text-gray-200' : 'bg-gray-200 hover:bg-gray-300 text-gray-800'
        }`}
      >
        Cancel
      </button>
      <button
        onClick={handleAssignDriver}
        disabled={isProcessing}
        className={`px-4 py-2 rounded-lg ${
          isDarkMode ? 'bg-blue-600 hover:bg-blue-700' : 'bg-blue-500 hover:bg-blue-600'
        } text-white ${isProcessing ? 'opacity-70 cursor-not-allowed' : ''}`}
      >
        Apply
      </button>
    </div>
  );

  // Rendering the right panel content - Update to handle the "Remove Current Driver" button correctly
  const renderRightPanelContent = () => {
    if (previewDriver) {
      return (
        <div className="h-full flex flex-col">
          <div className="text-center mb-6">
            <div className="mx-auto mb-4">
              {previewDriver.profilePicture ? (
                <img
                  src={previewDriver.profilePicture}
                  alt={previewDriver.firstName}
                  className="w-32 h-32 mx-auto rounded-full object-cover border-4 shadow-md
                      border-white dark:border-gray-700"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = 'https://via.placeholder.com/150?text=Driver';
                  }}
                />
              ) : (
                <div className={`w-32 h-32 mx-auto rounded-full flex items-center justify-center ${isDarkMode ? 'bg-gray-700' : 'bg-gray-200'} border-4 ${isDarkMode ? 'border-gray-600' : 'border-gray-100'}`}>
                  <FaUserCircle className={`text-7xl ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`} />
                </div>
              )}
            </div>
            <h3 className="text-xl font-bold mb-1">{previewDriver.firstName} {previewDriver.lastName}</h3>
            <p className={`${isDarkMode ? 'text-blue-400' : 'text-blue-600'} text-sm mb-4 flex items-center justify-center`}>
              <span className={`px-2 py-1 rounded-full text-xs ${
                previewDriver.isTeamLeader 
                  ? isDarkMode ? 'bg-yellow-900/50 text-yellow-300' : 'bg-yellow-100 text-yellow-800' 
                  : isDarkMode ? 'bg-blue-900/50 text-blue-300' : 'bg-blue-100 text-blue-800'
              }`}>
                {previewDriver.isTeamLeader ? 'Team Leader' : 'Tanod'}
              </span>
            </p>
          </div>
          
          <div className={`rounded-lg p-4 mb-4 ${isDarkMode ? 'bg-gray-700/50' : 'bg-gray-100'}`}>
            <h4 className={`text-sm font-semibold mb-3 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              Contact Information
            </h4>
            <div className="space-y-2">
              <div className="flex items-start">
                <span className={`text-sm w-24 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Phone:</span>
                <span className={`text-sm font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  {previewDriver.contactNumber || "Not provided"}
                </span>
              </div>
              <div className="flex items-start">
                <span className={`text-sm w-24 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Email:</span>
                <span className={`text-sm font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  {previewDriver.email || "Not provided"}
                </span>
              </div>
              <div className="flex items-start">
                <span className={`text-sm w-24 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Address:</span>
                <span className={`text-sm font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  {previewDriver.address || "Not provided"}
                </span>
              </div>
            </div>
          </div>
          
          <div className="mt-auto">
            <div className="flex space-x-2">
              {previewDriver._id === currentVehicleForDriver.assignedDriver?._id && (
                <button
                  onClick={() => {
                    setSelectedDriverId("");
                    setPreviewDriver(null);
                  }}
                  className={`flex-1 py-2 px-4 rounded-lg flex items-center justify-center
                    ${isDarkMode ? 'bg-red-600 hover:bg-red-700' : 'bg-red-500 hover:bg-red-600'} text-white`}
                >
                  <FaTimes className="mr-2" /> Remove Driver
                </button>
              )}
              {previewDriver._id !== currentVehicleForDriver.assignedDriver?._id && (
                <button
                  onClick={handleAssignDriver}
                  className={`flex-1 py-2 px-4 rounded-lg flex items-center justify-center
                    ${isDarkMode ? 'bg-green-600 hover:bg-green-700' : 'bg-green-500 hover:bg-green-600'} text-white`}
                >
                  <FaCheck className="mr-2" /> Assign Driver
                </button>
              )}
            </div>
          </div>
        </div>
      );
    } else {
      return (
        <div className="h-full flex flex-col items-center justify-center">
          <FaUserCircle className="text-6xl text-gray-400 mb-4" />
          <p className="text-center text-gray-500 px-4">
            Select a driver from the list on the left to view their details and assign them to this vehicle
          </p>
          
          {/* Only show the Remove Current Driver button if a driver is currently assigned 
              AND no driver is selected in the panel */}
          {currentVehicleForDriver?.assignedDriver && !selectedDriverId && (
            <button
              onClick={() => handleAssignDriver()}
              className={`mt-4 py-2 px-4 rounded-lg flex items-center mx-auto
                ${isDarkMode ? 'bg-red-600 hover:bg-red-700' : 'bg-red-500 hover:bg-red-600'} text-white`}
            >
              <FaTimes className="mr-2" /> Remove Current Driver
            </button>
          )}
        </div>
      );
    }
  };

  // Add this function to handle profile picture errors
  const handleProfilePictureError = (e) => {
    e.target.onerror = null; // Prevent infinite callback loop
    e.target.src = 'https://via.placeholder.com/50?text=Driver'; // Default placeholder image
  };

  // Create a component for displaying the driver info with proper profile picture handling
  const DriverInfo = ({ driver }) => {
    if (!driver) return <span className="text-gray-400">No driver assigned</span>;

    return (
      <div className="flex items-center">
        {/* Profile Picture with Fallback */}
        {driver.profilePicture ? (
          <img
            src={driver.profilePicture}
            alt={`${driver.firstName} ${driver.lastName}`}
            className="w-8 h-8 rounded-full object-cover mr-2"
            onError={handleProfilePictureError}
          />
        ) : (
          <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center mr-2">
            <FaUserCircle className="text-gray-500" />
          </div>
        )}
        
        {/* Driver Name */}
        <span>{driver.firstName} {driver.lastName}</span>
      </div>
    );
  };

  // Update the vehicle list rendering to use the new DriverInfo component
  const renderVehicleList = () => {
    return (
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className={headerClass}>
            <tr>
              <th className="py-3 px-4 text-left">Image</th>
              <th className="py-3 px-4 text-left">Vehicle</th>
              <th className="py-3 px-4 text-left">Assigned Driver</th>
              <th className="py-3 px-4 text-left">Status</th>
              <th className="py-3 px-4 text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {filteredVehicles.map((vehicle) => (
              <motion.tr 
                key={vehicle._id}
                whileHover={{ backgroundColor: isDarkMode ? 'rgba(55, 65, 81, 0.3)' : 'rgba(249, 250, 251, 0.8)' }}
              >
                {/* Vehicle Image */}
                <td className="py-4 px-4 whitespace-nowrap">
                  {vehicle.imageUrl ? (
                    <img 
                      src={vehicle.imageUrl} 
                      alt={vehicle.name} 
                      className="w-12 h-12 rounded-md object-cover"
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = "https://via.placeholder.com/48?text=Vehicle";
                      }}
                    />
                  ) : (
                    <div className={`w-12 h-12 rounded-md bg-gray-300 flex items-center justify-center ${isDarkMode ? 'bg-gray-700' : 'bg-gray-200'}`}>
                      <FaCar className={`text-xl ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`} />
                    </div>
                  )}
                </td>
                
                {/* Vehicle Info */}
                <td className="py-4 px-4">
                  <div className="font-medium">{vehicle.name}</div>
                  <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    {vehicle.licensePlate} · {vehicle.model}
                  </div>
                </td>
                
                {/* Assigned Driver - Using the new component */}
                <td className="py-4 px-4">
                  <DriverInfo driver={vehicle.assignedDriver} />
                </td>
                
                {/* Status */}
                <td className="py-4 px-4">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    vehicle.status === 'Available' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' :
                    vehicle.status === 'In Use' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300' :
                    vehicle.status === 'Maintenance' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300' :
                    'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
                  }`}>
                    {vehicle.status}
                  </span>
                </td>
                
                {/* Actions */}
                <td className="py-4 px-4 text-right space-x-2">
                  <button
                    onClick={() => openAssignDriverModal(vehicle)}
                    className={`px-3 py-1 rounded-md text-sm ${buttonClass}`}
                  >
                    Assign Driver
                  </button>
                  <button
                    onClick={() => handleEdit(vehicle)}
                    className={`px-3 py-1 rounded-md text-sm ${secondaryButtonClass}`}
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(vehicle._id)}
                    className={`px-3 py-1 rounded-md text-sm ${isDarkMode ? 'bg-red-600 hover:bg-red-700 text-white' : 'bg-red-500 hover:bg-red-600 text-white'}`}
                  >
                    Delete
                  </button>
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  // Update the current vehicle for driver modal rendering to use DriverInfo component
  const renderCurrentDriverBanner = () => {
    if (!currentVehicleForDriver?.assignedDriver) return null;
    
    return (
      <div className={`px-5 py-3 ${isDarkMode ? 'bg-blue-900/30 border-y border-blue-800' : 'bg-blue-50 border-y border-blue-100'}`}>
        <div className="flex items-center">
          {/* Use the same profile picture handling */}
          {currentVehicleForDriver.assignedDriver.profilePicture ? (
            <img 
              src={currentVehicleForDriver.assignedDriver.profilePicture} 
              alt="Current Driver" 
              className="w-8 h-8 rounded-full object-cover mr-2"
              onError={handleProfilePictureError}
            />
          ) : (
            <FaUserCircle className="w-8 h-8 mr-2 text-blue-400" />
          )}
          <div>
            <span className={`text-sm ${isDarkMode ? 'text-blue-300' : 'text-blue-700'}`}>Currently assigned to: </span>
            <span className="font-medium">
              {currentVehicleForDriver.assignedDriver.firstName} {currentVehicleForDriver.assignedDriver.lastName}
            </span>
          </div>
        </div>
      </div>
    );
  };

  // Add a function to fetch vehicle requests
  const fetchVehicleRequests = async () => {
    try {
      setLoadingRequests(true);
      const token = localStorage.getItem("token");
      
      const response = await axios.get(
        `${baseURL}/vehicles/requests`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      setVehicleRequests(response.data);
    } catch (error) {
      console.error("Error fetching vehicle requests:", error);
      toast.error("Failed to load vehicle usage requests");
    } finally {
      setLoadingRequests(false);
    }
  };

  // Add this to useEffect to fetch requests
  useEffect(() => {
    if (showVehicleModal) {
      fetchVehicleRequests();
    }
  }, [showVehicleModal]);

  // Add function to process vehicle request
  const handleProcessRequest = async (requestId, status, rejectionReason = '') => {
    try {
      const token = localStorage.getItem("token");
      
      const loadingToast = toast.loading(`${status === 'Approved' ? 'Approving' : 'Rejecting'} request...`);
      
      await axios.put(
        `${baseURL}/vehicles/requests/${requestId}/process`,
        {
          status,
          rejectionReason
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      toast.dismiss(loadingToast);
      toast.success(`Request ${status.toLowerCase()} successfully`);
      
      // Refresh requests
      fetchVehicleRequests();
    } catch (error) {
      console.error("Error processing vehicle request:", error);
      toast.error(error.response?.data?.message || `Failed to ${status.toLowerCase()} request`);
    }
  };

  // Add a function to show reject dialog
  const showRejectDialog = (requestId) => {
    let rejectionReason = '';
    
    const rejectToastId = toast.info(
      <div className="flex flex-col space-y-3">
        <p className="font-medium mb-2">Enter reason for rejection:</p>
        <textarea 
          className={`w-full p-3 rounded border ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`}
          onChange={(e) => { rejectionReason = e.target.value; }}
          rows={3}
        />
        <div className="flex justify-end space-x-2 mt-2">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className={`px-3 py-1.5 rounded-md ${isDarkMode ? 'bg-red-600 hover:bg-red-700' : 'bg-red-500 hover:bg-red-600'} text-white`}
            onClick={() => {
              if (!rejectionReason.trim()) {
                toast.error("Please enter a rejection reason");
                return;
              }
              toast.dismiss(rejectToastId);
              handleProcessRequest(requestId, 'Rejected', rejectionReason);
            }}
          >
            Reject Request
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className={`px-3 py-1.5 rounded-md ${isDarkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-300 hover:bg-gray-400'} ${isDarkMode ? 'text-white' : 'text-gray-800'}`}
            onClick={() => toast.dismiss(rejectToastId)}
          >
            Cancel
          </motion.button>
        </div>
      </div>,
      { autoClose: false, closeButton: false }
    );
  };

  // Format date helper function
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Add a function to get status badge
  const getStatusBadge = (status) => {
    switch(status) {
      case 'Pending':
        return (
          <span className={`flex items-center text-xs px-2.5 py-0.5 rounded-full ${
            isDarkMode ? 'bg-yellow-900/30 text-yellow-300' : 'bg-yellow-100 text-yellow-800'
          }`}>
            <FaClock className="mr-1" /> Pending
          </span>
        );
      case 'Approved':
        return (
          <span className={`flex items-center text-xs px-2.5 py-0.5 rounded-full ${
            isDarkMode ? 'bg-green-900/30 text-green-300' : 'bg-green-100 text-green-800'
          }`}>
            <FaCheckCircle className="mr-1" /> Approved
          </span>
        );
      case 'Rejected':
        return (
          <span className={`flex items-center text-xs px-2.5 py-0.5 rounded-full ${
            isDarkMode ? 'bg-red-900/30 text-red-300' : 'bg-red-100 text-red-800'
          }`}>
            <FaTimesCircle className="mr-1" /> Rejected
          </span>
        );
      case 'Completed':
        return (
          <span className={`flex items-center text-xs px-2.5 py-0.5 rounded-full ${
            isDarkMode ? 'bg-blue-900/30 text-blue-300' : 'bg-blue-100 text-blue-800'
          }`}>
            <FaCheckCircle className="mr-1" /> Completed
          </span>
        );
      default:
        return (
          <span className={`flex items-center text-xs px-2.5 py-0.5 rounded-full ${
            isDarkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-700'
          }`}>
            {status}
          </span>
        );
    }
  };

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm p-4 overflow-y-auto"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          handleCloseModal();
        }
      }}
    >
      <motion.div
        className={`${modalBgClass} rounded-xl shadow-xl w-full max-w-4xl max-h-[90vh] relative flex flex-col`}
        variants={slideUp}
        initial="hidden"
        animate="visible"
        exit="exit"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className={`${headerClass} px-6 py-4 flex items-center justify-between sticky top-0 z-10`}>
          <div className="flex items-center">
            <FaCar className="mr-2" />
            <h2 className="text-xl font-bold">Vehicle Management</h2>
          </div>
          <div className="flex items-center space-x-2">
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={handleRefreshVehicles}
              className={`p-2 rounded-full ${
                isDarkMode ? "bg-blue-700 hover:bg-blue-600 text-white" : "bg-blue-100 hover:bg-blue-200 text-blue-700"
              }`}
              title="Refresh Vehicle Data"
            >
              <FaSync />
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.1, rotate: 90 }}
              whileTap={{ scale: 0.9 }}
              onClick={handleCloseModal}
              className={`p-2 rounded-full ${
                isDarkMode ? "bg-gray-700 hover:bg-gray-600 text-gray-300" : "bg-gray-200 hover:bg-gray-300 text-gray-600"
              }`}
              aria-label="Close"
            >
              <FaTimes />
            </motion.button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1">
          {/* Search Bar and Debug Toggle */}
          <div className="flex items-center mb-4 justify-between">
            <div className="relative flex-grow mr-4">
              <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search vehicles..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={`w-full pl-10 pr-4 py-2 rounded-lg border ${inputClass}`}
              />
            </div>
            <div className="flex space-x-2">
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={toggleForm}
                className={`px-4 py-2 rounded-lg flex items-center ${buttonClass}`}
              >
                {showForm ? <FaTimes className="mr-2" /> : <FaPlus className="mr-2" />}
                {showForm ? "Cancel" : "Add Vehicle"}
              </motion.button>
            </div>
          </div>
          
          {/* Vehicle Form */}
          <AnimatePresence>
            {showForm && (
              <motion.form
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
                onSubmit={handleSubmit}
                className="mb-8 overflow-hidden"
              >
                <div className={`p-4 rounded-lg mb-6 ${isDarkMode ? "bg-gray-800 border border-gray-700" : "bg-gray-50 border border-gray-200"}`}>
                  <h3
                    className={`text-lg font-semibold mb-4 ${isDarkMode ? "text-blue-300" : "text-blue-600"}`}
                  >
                    {editMode ? "Edit Vehicle" : "Add New Vehicle"}
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Left Column */}
                    <div>
                      <div className="mb-4">
                        <label className={`block text-sm font-medium mb-2 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
                          Vehicle Name*
                        </label>
                        <input
                          type="text"
                          name="name"
                          placeholder="Enter vehicle name"
                          value={newVehicle.name}
                          onChange={handleChange}
                          className={`w-full px-3 py-2 border rounded-lg ${inputClass}`}
                          required
                        />
                      </div>
                      
                      {/* Remove Vehicle ID input field, it will be auto-generated */}

                      <div className="mb-4">
                        <label className={`block text-sm font-medium mb-2 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
                          Vehicle Type*
                        </label>
                        <select
                          name="type"
                          value={newVehicle.type}
                          onChange={handleChange}
                          className={`w-full px-3 py-2 border rounded-lg ${inputClass}`}
                          required
                        >
                          <option value="">Select Type</option>
                          <option value="Motorcycles" title="Often used for quick mobility and access to narrow streets or hard-to-reach areas">Motorcycles</option>
                          <option value="Barangay Patrol Cars" title="Typically compact vehicles (sedans or SUVs) used for patrolling the area, responding to emergencies, and transporting personnel">Barangay Patrol Cars</option>
                          <option value="Multicabs (Mini Trucks)" title="Small trucks used for various purposes, including transport of equipment, goods, or even community members in case of emergencies">Multicabs (Mini Trucks)</option>
                          <option value="Pick-up Trucks" title="Used for heavier tasks, transporting larger groups or materials, especially in barangays with more extensive areas to cover">Pick-up Trucks</option>
                          <option value="Service Vans" title="Some barangays may use service vans for administrative duties, moving personnel, or transporting supplies">Service Vans</option>
                          <option value="All-Terrain Vehicles (ATVs)" title="In rural areas or barangays with rough terrain, ATVs may be used for quick movement and patrolling">All-Terrain Vehicles (ATVs)</option>
                          <option value="Utility Vehicles" title="These could be 4x4 vehicles used for various purposes, including transporting barangay tanods to areas that may be difficult to access by regular cars">Utility Vehicles</option>
                        </select>
                      </div>

                      <div className="mb-4">
                        <label className={`block text-sm font-medium mb-2 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
                          License Plate*
                        </label>
                        <input
                          type="text"
                          name="licensePlate"
                          placeholder="Enter license plate"
                          value={newVehicle.licensePlate}
                          onChange={handleChange}
                          className={`w-full px-3 py-2 border rounded-lg ${inputClass}`}
                          required
                        />
                      </div>

                      <div className="mb-4">
                        <label className={`block text-sm font-medium mb-2 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
                          Model*
                        </label>
                        <input
                          type="text"
                          name="model"
                          placeholder="Enter vehicle model"
                          value={newVehicle.model}
                          onChange={handleChange}
                          className={`w-full px-3 py-2 border rounded-lg ${inputClass}`}
                          required
                        />
                      </div>
                      
                      <div className="mb-4">
                        <label className={`block text-sm font-medium mb-2 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
                          Assigned Driver
                        </label>
                        <select
                          name="assignedDriver"
                          value={newVehicle.assignedDriver}
                          onChange={handleChange}
                          className={`w-full px-3 py-2 border rounded-lg ${inputClass}`}
                        >
                          <option value="">No Driver Assigned</option>
                          {tanods.map((tanod) => (
                            <option key={tanod._id} value={tanod._id}>
                              {tanod.firstName} {tanod.lastName}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* Right Column */}
                    <div>
                      <div className="mb-4">
                        <label className={`block text-sm font-medium mb-2 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
                          Year*
                        </label>
                        <select
                          name="year"
                          value={newVehicle.year || ''}
                          onChange={handleChange}
                          className={`w-full px-4 py-2 border rounded-md ${inputClass}`}
                        >
                          <option value="">Select Year</option>
                          {generateYearOptions().map(year => (
                            <option key={year} value={year}>{year}</option>
                          ))}
                        </select>
                      </div>

                      <div className="mb-4">
                        <label className={`block text-sm font-medium mb-2 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
                          Color*
                        </label>
                        <input
                          type="text"
                          name="color"
                          placeholder="Enter vehicle color"
                          value={newVehicle.color}
                          onChange={handleChange}
                          className={`w-full px-3 py-2 border rounded-lg ${inputClass}`}
                          required
                        />
                      </div>

                      <div className="mb-4">
                        <label className={`block text-sm font-medium mb-2 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
                          Current Mileage (km)*
                        </label>
                        <input
                          type="number"
                          name="currentMileage"
                          placeholder="Enter current mileage"
                          value={newVehicle.currentMileage}
                          onChange={handleChange}
                          className={`w-full px-3 py-2 border rounded-lg ${inputClass}`}
                          required
                          min="0"
                        />
                      </div>

                      <div className="mb-4">
                        <label className={`block text-sm font-medium mb-2 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
                          Status
                        </label>
                        <select
                          name="status"
                          value={newVehicle.status}
                          onChange={handleChange}
                          className={`w-full px-3 py-2 border rounded-lg ${inputClass}`}
                        >
                          <option value="Available">Available</option>
                          <option value="In Use">In Use</option>
                          <option value="Maintenance">Maintenance</option>
                          <option value="Out of Service">Out of Service</option>
                        </select>
                      </div>

                      {/* Image Upload */}
                      <div>
                        <label className={`block text-sm font-medium mb-2 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
                          Vehicle Image
                        </label>
                        <div className="flex items-center">
                          <div className={`w-24 h-24 rounded-lg overflow-hidden flex items-center justify-center mr-4 ${
                            isDarkMode ? "bg-gray-700" : "bg-gray-200"
                          }`}>
                            {imagePreview ? (
                              <img
                                src={imagePreview}
                                alt="Vehicle Preview"
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <FaCar className={`w-10 h-10 ${isDarkMode ? "text-gray-600" : "text-gray-400"}`} />
                            )}
                          </div>
                          <label className={`flex items-center justify-center px-4 py-2 rounded-lg cursor-pointer ${
                            isDarkMode
                              ? "bg-gray-700 hover:bg-gray-600 text-gray-200"
                              : "bg-gray-200 hover:bg-gray-300 text-gray-800"
                          }`}>
                            <FaCloudUploadAlt className="mr-2" />
                            {imagePreview ? "Change Image" : "Upload Image"}
                            <input
                              type="file"
                              accept="image/*"
                              onChange={handleImageChange}
                              className="hidden"
                            />
                          </label>
                        </div>
                        {vehicleImageFile && (
                          <p className={`text-sm mt-2 ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>
                            {vehicleImageFile.name}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end space-x-3 mt-6">
                    <motion.button
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.97 }}
                      type="button"
                      onClick={resetForm}
                      className={`px-4 py-2 rounded-lg ${secondaryButtonClass}`}
                    >
                      <FaTimes className="mr-2 inline" />
                      Cancel
                    </motion.button>

                    <motion.button
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.97 }}
                      type="submit"
                      disabled={uploadingImage}
                      className={`px-4 py-2 rounded-lg flex items-center ${
                        editMode
                          ? isDarkMode
                            ? "bg-yellow-600 hover:bg-yellow-700 text-white"
                            : "bg-yellow-500 hover:bg-yellow-600 text-white"
                          : isDarkMode
                          ? "bg-green-600 hover:bg-green-700 text-white"
                          : "bg-green-500 hover:bg-green-600 text-white"
                      } ${uploadingImage ? "opacity-70 cursor-not-allowed" : ""}`}
                    >
                      {uploadingImage ? (
                        <>
                          <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Processing...
                        </>
                      ) : editMode ? (
                        <>
                          <FaEdit className="mr-2" />
                          Update Vehicle
                        </>
                      ) : (
                        <>
                          <FaPlus className="mr-2" />
                          Add Vehicle
                        </>
                      )}
                    </motion.button>
                  </div>
                </div>
              </motion.form>
            )}
          </AnimatePresence>

          {/* Vehicle List */}
          <h3 className={`text-lg font-semibold mb-4 ${isDarkMode ? "text-blue-300" : "text-blue-600"}`}>
            Vehicles ({filteredVehicles.length})
          </h3>

          {/* Display a message if no vehicles are available */}
          {!vehicles || vehicles.length === 0 ? (
            <div className={`p-8 text-center rounded-lg border ${isDarkMode ? "bg-gray-800 border-gray-700" : "bg-gray-50 border-gray-200"}`}>
              <FaCar className={`text-5xl mx-auto mb-4 ${isDarkMode ? "text-gray-600" : "text-gray-400"}`} />
              <p className={`text-lg font-medium ${isDarkMode ? "text-gray-300" : "text-gray-600"}`}>No vehicles found in the database</p>
              <p className={isDarkMode ? "text-gray-500 mb-4" : "text-gray-500 mb-4"}>Add a new vehicle or refresh the data</p>
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={handleRefreshVehicles}
                className={`px-4 py-2 inline-flex items-center rounded-lg ${buttonClass}`}
              >
                <FaSync className="mr-2" /> Refresh Data
              </motion.button>
            </div>
          ) : filteredVehicles.length === 0 ? (
            <div className={`p-8 text-center rounded-lg border ${isDarkMode ? "bg-gray-800 border-gray-700" : "bg-gray-50 border-gray-200"}`}>
              <FaCar className={`text-5xl mx-auto mb-4 ${isDarkMode ? "text-gray-600" : "text-gray-400"}`} />
              <p className={`text-lg font-medium ${isDarkMode ? "text-gray-300" : "text-gray-600"}`}>No vehicles match your search</p>
              <p className={isDarkMode ? "text-gray-500" : "text-gray-500"}>Try a different search term</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {filteredVehicles.map((vehicle) => (
                <motion.div
                  key={vehicle._id}
                  variants={itemVariants}
                  initial="hidden"
                  animate="visible"
                  className={`rounded-lg overflow-hidden shadow border ${
                    isDarkMode ? "border-gray-700" : "border-gray-200"
                  }`}
                >
                  <div className="flex">
                    {/* Vehicle Image */}
                    <div className="w-1/3">
                      {vehicle.imageUrl ? (
                        <img
                          src={vehicle.imageUrl}
                          alt={vehicle.name}
                          className="w-full h-full object-cover"
                          style={{ height: "160px" }}
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = 'https://placehold.co/400x300?text=Vehicle+Image';
                          }}
                        />
                      ) : (
                        <div
                          className={`w-full h-full flex items-center justify-center ${
                            isDarkMode ? "bg-gray-700" : "bg-gray-200"
                          }`}
                          style={{ height: "160px" }}
                        >
                          <FaCar className={`text-5xl ${isDarkMode ? "text-gray-600" : "text-gray-400"}`} />
                        </div>
                      )}
                    </div>

                    {/* Vehicle Details */}
                    <div className="w-2/3 p-4">
                      <div className="flex justify-between items-start">
                        <h3 className="font-bold text-lg">{vehicle.name || "Unnamed Vehicle"}</h3>
                        <div className={`px-2 py-1 text-xs rounded-full ${
                          vehicle.status === "Available"
                            ? isDarkMode ? "bg-green-900 text-green-200" : "bg-green-100 text-green-800"
                            : vehicle.status === "In Use"
                            ? isDarkMode ? "bg-blue-900 text-blue-200" : "bg-blue-100 text-blue-800"
                            : vehicle.status === "Maintenance"
                            ? isDarkMode ? "bg-yellow-900 text-yellow-200" : "bg-yellow-100 text-yellow-800"
                            : isDarkMode ? "bg-red-900 text-red-200" : "bg-red-100 text-red-800"
                        }`}>
                          {vehicle.status || "Unknown Status"}
                        </div>
                      </div>
                      
                      <div className="mt-2 space-y-1">
                        {/* Display auto-generated Vehicle ID (read-only) */}
                        <p className="text-sm">
                          <span className={isDarkMode ? "text-gray-400" : "text-gray-600"}>ID:</span> {vehicle.vehicleId || "Pending"}
                        </p>
                        <p className="text-sm">
                          <span className={isDarkMode ? "text-gray-400" : "text-gray-600"}>Type:</span> {vehicle.type || "Not specified"}
                        </p>
                        <p className="text-sm">
                          <span className={isDarkMode ? "text-gray-400" : "text-gray-600"}>License:</span> {vehicle.licensePlate || "No plate"}
                        </p>
                        <p className="text-sm">
                          <span className={isDarkMode ? "text-gray-400" : "text-gray-600"}>Model:</span> {vehicle.model || "Not specified"} {vehicle.year ? `(${vehicle.year})` : ""}
                        </p>
                        <p className="text-sm">
                          <span className={isDarkMode ? "text-gray-400" : "text-gray-600"}>Mileage:</span> {vehicle.currentMileage ? `${vehicle.currentMileage} km` : "Not specified"}
                        </p>
                      </div>

                      {/* Driver Section */}
                      <div className="mt-3 flex items-center">
                        <span className={`text-sm mr-2 ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>Driver:</span>
                        {vehicle.assignedDriver ? (
                          <div className="flex items-center">
                            {vehicle.assignedDriver.profilePicture ? (
                              <img
                                src={vehicle.assignedDriver.profilePicture}
                                alt={vehicle.assignedDriver.firstName}
                                className="w-6 h-6 rounded-full mr-1 object-cover"
                                onError={(e) => {
                                  e.target.onerror = null;
                                  e.target.src = 'https://placehold.co/100x100?text=User';
                                }}
                              />
                            ) : (
                              <FaUserCircle className="w-6 h-6 mr-1" />
                            )}
                            <span className="text-sm">
                              {vehicle.assignedDriver.firstName} {vehicle.assignedDriver.lastName}
                            </span>
                          </div>
                        ) : (
                          <span className="text-sm italic opacity-75">Not Assigned</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className={`px-4 py-2 flex justify-between items-center ${
                    isDarkMode ? "bg-gray-800 border-t border-gray-700" : "bg-gray-50 border-t border-gray-200"
                  }`}>
                    {/* Replace dropdown with a button to open modal */}
                    <div className="flex-grow">
                      <motion.button
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.97 }}
                        onClick={() => openAssignDriverModal(vehicle)}
                        className={`py-1.5 px-3 rounded-lg text-sm flex items-center ${
                          isDarkMode 
                            ? vehicle.assignedDriver ? "bg-blue-700 hover:bg-blue-600" : "bg-green-700 hover:bg-green-600" 
                            : vehicle.assignedDriver ? "bg-blue-100 hover:bg-blue-200 text-blue-700" : "bg-green-100 hover:bg-green-200 text-green-700"
                        }`}
                      >
                        {vehicle.assignedDriver ? (
                          <>
                            <FaExchangeAlt className="mr-1.5" />
                            Change Driver
                          </>
                        ) : (
                          <>
                            <FaUserPlus className="mr-1.5" />
                            Assign Driver
                          </>
                        )}
                      </motion.button>
                    </div>

                    {/* Edit/Delete Buttons */}
                    <div className="flex">
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => handleEdit(vehicle)}
                        className={`p-2 rounded-full mr-2 ${
                          isDarkMode
                            ? "bg-blue-700 hover:bg-blue-600 text-white"
                            : "bg-blue-100 hover:bg-blue-200 text-blue-700"
                        }`}
                      >
                        <FaEdit />
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => handleDelete(vehicle._id)}
                        className={`p-2 rounded-full ${
                          isDarkMode
                            ? "bg-red-700 hover:bg-red-600 text-white"
                            : "bg-red-100 hover:bg-red-200 text-red-700"
                        }`}
                      >
                        <FaTrash />
                      </motion.button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </motion.div>

      {/* Delete Confirmation Dialog */}
      <AnimatePresence>
        {confirmDelete && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] flex items-center justify-center bg-black bg-opacity-50"
            onClick={(e) => {
              if (e.target === e.currentTarget) setConfirmDelete(null);
            }}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className={`rounded-lg p-6 shadow-xl max-w-sm w-full ${
                isDarkMode ? "bg-gray-800" : "bg-white"
              }`}
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-xl font-bold mb-4">Delete Vehicle</h3>
              <p className="mb-6">Are you sure you want to delete this vehicle? This action cannot be undone.</p>
              <div className="flex justify-end space-x-3">
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => setConfirmDelete(null)}
                  className={`px-4 py-2 rounded-lg ${secondaryButtonClass}`}
                >
                  Cancel
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={confirmDeleteVehicle}
                  className={`px-4 py-2 rounded-lg ${
                    isDarkMode
                      ? "bg-red-600 hover:bg-red-700 text-white"
                      : "bg-red-500 hover:bg-red-600 text-white"
                  }`}
                >
                  Delete
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Driver Assignment Modal */}
      <AnimatePresence>
        {showAssignDriverModal && currentVehicleForDriver && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] flex items-center justify-center bg-black bg-opacity-70 backdrop-blur-sm overflow-y-auto"
            onClick={(e) => {
              if (e.target === e.currentTarget) closeAssignDriverModal();
            }}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: "spring", duration: 0.4 }}
              className={`w-full max-w-5xl m-4 max-h-[90vh] rounded-xl shadow-2xl flex flex-col ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className={`${headerClass} px-5 py-4 flex items-center justify-between sticky top-0 z-10`}>
                <div className="flex items-center">
                  <FaCar className="mr-2" />
                  <div>
                    <h3 className="text-lg font-semibold">Assign Driver</h3>
                    <p className={`text-sm ${isDarkMode ? 'text-blue-300' : 'text-blue-600'}`}>
                      {currentVehicleForDriver.name} ({currentVehicleForDriver.vehicleId || "No ID"}) - {currentVehicleForDriver.model}
                    </p>
                  </div>
                </div>
                <motion.button
                  whileHover={{ scale: 1.1, rotate: 90 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={closeAssignDriverModal}
                  className="p-2 rounded-full bg-gray-700 text-gray-300 hover:bg-gray-600"
                >
                  <FaTimes />
                </motion.button>
              </div>
              
              {/* Current Driver Banner (if any) */}
              {renderCurrentDriverBanner()}
              
              {/* Search Bar */}
              <div className="px-5 py-3 border-b border-gray-200 dark:border-gray-700">
                <div className="relative">
                  <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search drivers by name..."
                    value={driverSearchQuery}
                    onChange={(e) => setDriverSearchQuery(e.target.value)}
                    className={`w-full pl-10 pr-4 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-blue-500 
                      ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-800'}`}
                  />
                </div>
              </div>
              
              <div className="flex flex-col md:flex-row overflow-hidden flex-1">
                {/* Left Panel - Tanod List */}
                <div className={`w-full md:w-1/2 p-4 border-r overflow-y-auto ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                  {filteredDrivers.length === 0 ? (
                    <div className="p-6 text-center">
                      <FaUserCircle className="mx-auto text-4xl text-gray-400 mb-2" />
                      <p className={isDarkMode ? 'text-gray-400' : 'text-gray-500'}>No drivers found</p>
                    </div>
                  ) : (
                    <div className="divide-y divide-gray-200 dark:divide-gray-700">
                      {filteredDrivers.map((driver) => (
                        <motion.div
                          key={driver._id}
                          onClick={() => handleDriverSelect(driver)}
                          whileHover={{ backgroundColor: isDarkMode ? 'rgba(55, 65, 81, 0.5)' : 'rgba(243, 244, 246, 0.8)' }}
                          className={`flex items-center p-4 cursor-pointer ${
                            selectedDriverId === driver._id ? 
                              (isDarkMode ? 'bg-blue-900/40 border-l-4 border-blue-500' : 
                                'bg-blue-50 border-l-4 border-blue-500') :
                              ''
                          }`}
                        >
                          <div className="flex-shrink-0 mr-3">
                            {driver.profilePicture ? (
                              <img
                                src={driver.profilePicture}
                                alt={driver.firstName}
                                className="w-12 h-12 rounded-full object-cover"
                                onError={(e) => {
                                  e.target.onerror = null;
                                  e.target.src = 'https://via.placeholder.com/60?text=Driver';
                                }}
                              />
                            ) : (
                              <div className={`w-12 h-12 rounded-full flex items-center justify-center ${isDarkMode ? 'bg-gray-700' : 'bg-gray-200'}`}>
                                <FaUserCircle className={`text-3xl ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`} />
                              </div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className={`text-sm font-medium truncate ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                              {driver.firstName} {driver.lastName}
                            </p>
                            <p className={`text-sm truncate ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                              {driver.contactNumber || "No contact info"}
                            </p>
                          </div>
                          {selectedDriverId === driver._id && (
                            <div className="flex-shrink-0">
                              <div className={`w-5 h-5 rounded-full ${isDarkMode ? 'bg-blue-500' : 'bg-blue-500'} flex items-center justify-center`}>
                                <FaCheck className="text-white text-xs" />
                              </div>
                            </div>
                          )}
                        </motion.div>
                      ))}
                    </div>
                  )}
                </div>
                
                {/* Right Panel - Selected Tanod Details */}
                <div className={`w-full md:w-1/2 p-4 overflow-y-auto ${isDarkMode ? 'bg-gray-900/50' : 'bg-gray-50'}`}>
                  {renderRightPanelContent()}
                </div>
              </div>
              
              {/* Modal Footer */}
              {renderModalFooter()}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default VehicleModal;

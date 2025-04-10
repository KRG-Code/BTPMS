import React, { useState, useEffect } from "react";
import axios from "axios";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import dayjs from "dayjs";
import customParseFormat from "dayjs/plugin/customParseFormat";
import { motion, AnimatePresence } from "framer-motion";
import { 
  FaUserShield,
  FaBox, 
  FaExchangeAlt,
  FaEye,
  FaUserCircle,
  FaCar,
  FaCarAlt,
  FaClipboardList,
  FaChartBar // Added chart icon
} from "react-icons/fa";
import { useTheme } from "../../../contexts/ThemeContext";
import { uploadProfileImage } from "../../../firebase";

// Import the components
import TanodCard from "./ResourcesComponents/TanodCard";
import InventoryModal from "./ResourcesComponents/InventoryModal";
import EquipmentModal from "./ResourcesComponents/EquipmentModal";
import VehicleModal from "./ResourcesComponents/VehicleModal";
import VehicleRequestsModal from "./ResourcesComponents/VehicleRequestsModal";
// Import new components for report generation
import PasswordVerificationModal from './PersonelsComponents/PasswordVerificationModal';
import ResourcesReportModal from './ResourcesComponents/ResourcesReportModal';

dayjs.extend(customParseFormat);

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: { 
    opacity: 1,
    transition: { 
      when: "beforeChildren",
      staggerChildren: 0.1
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { duration: 0.3 }
  }
};

export default function Resources() {
  const { isDarkMode } = useTheme();
  const [tanods, setTanods] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedTanod, setSelectedTanod] = useState(null);
  const [equipments, setEquipments] = useState([]);
  const [inventoryItems, setInventoryItems] = useState([]);
  const [showInventoryModal, setShowInventoryModal] = useState(false);
  const [showEquipmentModal, setShowEquipmentModal] = useState(false);
  const [showVehicleModal, setShowVehicleModal] = useState(false);
  const [showVehicleRequestsModal, setShowVehicleRequestsModal] = useState(false); // New state for vehicle requests modal
  const [vehicles, setVehicles] = useState([]);
  const [pendingRequests, setPendingRequests] = useState(0); // Track number of pending requests
  const [showReturned, setShowReturned] = useState(false);
  const [filterDate, setFilterDate] = useState("");
  const [loadingEquipments, setLoadingEquipments] = useState(false);
  const [newItem, setNewItem] = useState({ name: "", quantity: "" });
  const [editMode, setEditMode] = useState(false);
  const [currentItemId, setCurrentItemId] = useState(null);
  const [viewMode, setViewMode] = useState("grid");
  const [currentItem, setCurrentItem] = useState(null);
  const [showItemForm, setShowItemForm] = useState(false);
  const [itemImageFile, setItemImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [processingRequestId, setProcessingRequestId] = useState(null);
  const [selectedRequestId, setSelectedRequestId] = useState(null);
  const [showRejectionModal, setShowRejectionModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [vehicleRequests, setVehicleRequests] = useState([]);
  
  // Add new states for report generation
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);

  const baseURL = `${process.env.REACT_APP_API_URL}`;
  let deleteToastId = null;

  // Theme-aware styles
  const cardBgClass = isDarkMode ? 'bg-gray-800 text-gray-200' : 'bg-white text-gray-800';
  const buttonClass = isDarkMode 
    ? 'bg-blue-600 hover:bg-blue-700 text-white' 
    : 'bg-blue-500 hover:bg-blue-600 text-white';
  const secondaryButtonClass = isDarkMode
    ? 'bg-gray-700 hover:bg-gray-600 text-gray-200'
    : 'bg-gray-200 hover:bg-gray-300 text-gray-800';
  const inputClass = isDarkMode
    ? 'bg-gray-700 border-gray-600 text-gray-200 focus:border-blue-500'
    : 'bg-white border-gray-300 text-gray-700 focus:border-blue-500';
  const modalBgClass = isDarkMode
    ? 'bg-gray-900 text-gray-200 border border-gray-700'
    : 'bg-white text-gray-800 border border-gray-300';
  const headerClass = isDarkMode
    ? 'bg-gray-800 text-gray-200 border-b border-gray-700'
    : 'bg-gray-50 text-gray-800 border-b border-gray-200';
  const tableHeaderClass = isDarkMode
    ? 'bg-gray-800 text-gray-200 border-b border-gray-700'
    : 'bg-gray-50 text-gray-700 border-b border-gray-200';

  // WebSocket connection for real-time updates
  useEffect(() => {
    const token = localStorage.getItem("token");
    const socket = new WebSocket(`${process.env.REACT_APP_WS_URL}?token=${token}`);

    socket.onopen = () => {
      console.log("WebSocket connected - Resources");
      socket.send(JSON.stringify({ type: "join", room: "resources" }));
      socket.send(JSON.stringify({ type: "join", room: "vehicle-requests" }));
    };

    socket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      
      if (data.type === 'vehicleRequestUpdate') {
        // Update pending requests count
        checkPendingRequestsCount();
        
        // Show a toast notification
        const vehicle = data.request.vehicleId?.name || 'Vehicle';
        const requesterName = data.request.requesterId?.firstName 
          ? `${data.requesterId.firstName} ${data.requesterId.lastName}`
          : 'A tanod';
          
        toast.info(`New vehicle request: ${vehicle} by ${requesterName}`);
      }
    };

    socket.onerror = (error) => {
      console.error("WebSocket error:", error);
    };

    socket.onclose = () => {
      console.log("WebSocket disconnected");
    };

    return () => {
      if (socket.readyState === WebSocket.OPEN) {
        socket.close();
      }
    };
  }, []);

  // Fetch tanods, inventory data, and vehicles
  useEffect(() => {
    const fetchTanods = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        toast.error("Please log in.");
        return;
      }

      try {
        setLoading(true);
        const response = await axios.get(`${baseURL}/auth/users`, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });

        const tanodsList = response.data.filter(
          (user) => user.userType === "tanod"
        );
        setTanods(tanodsList);
      } catch (error) {
        toast.error("Error fetching Tanods.");
      } finally {
        setLoading(false);
      }
    };

    const fetchInventory = async () => {
      try {
        const response = await axios.get(`${baseURL}/auth/inventory`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        });
        setInventoryItems(response.data);
      } catch (error) {
        toast.error("Failed to load inventory items.");
      }
    };

    fetchTanods();
    fetchInventory();
    fetchVehicles();
    checkPendingRequestsCount(); // Add this to check pending requests
  }, [baseURL]);

  // Check for pending vehicle requests
  const checkPendingRequestsCount = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(
        `${baseURL}/vehicles/requests/count?status=Pending`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      
      setPendingRequests(response.data.count);
    } catch (error) {
      console.error("Error checking pending requests:", error);
    }
  };

  // Add this useEffect to load vehicle requests when the component mounts
  useEffect(() => {
    // Fetch vehicle requests when component mounts
    const fetchVehicleRequests = async () => {
      try {
        const token = localStorage.getItem("token");
        const response = await axios.get(`${process.env.REACT_APP_API_URL}/vehicles/requests`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setVehicleRequests(response.data);
      } catch (error) {
        console.error("Error fetching vehicle requests:", error);
      }
    };

    fetchVehicleRequests();
  }, []);

  // Reset form function
  const resetForm = () => {
    setNewItem({ name: "", quantity: "" });
    setEditMode(false);
    setCurrentItemId(null);
    setCurrentItem(null);
    setItemImageFile(null);
    setImagePreview(null);
    setShowItemForm(false);
  };

  // Add or update inventory item
  const handleAddOrUpdateItem = async (e) => {
    e.preventDefault();
    if (!newItem.name || !newItem.quantity) {
      toast.error("Please provide item name and quantity.");
      return;
    }

    try {
      setUploadingImage(true);
      let updatedItem = { ...newItem };

      // Handle image upload if a file was selected
      if (itemImageFile) {
        try {
          const uniqueId = Date.now().toString();
          const imageUrl = await uploadProfileImage(itemImageFile, `inventory_${uniqueId}`);
          
          if (imageUrl) {
            updatedItem.imageUrl = imageUrl;
          }
        } catch (uploadError) {
          toast.error('Failed to upload image, but continuing with item update');
        }
      }

      if (editMode && currentItemId) {
        const response = await axios.put(
          `${baseURL}/auth/inventory/${currentItemId}`,
          updatedItem,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          }
        );
        
        if (!updatedItem.imageUrl && response.data.imageUrl) {
          response.data.imageUrl = response.data.imageUrl;
        }
        
        setInventoryItems((prevItems) =>
          prevItems.map((item) =>
            item._id === currentItemId ? response.data : item
          )
        );
        toast.success("Item updated successfully.");
      } else {
        const response = await axios.post(
          `${baseURL}/auth/inventory`,
          updatedItem,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          }
        );
        setInventoryItems([...inventoryItems, response.data]);
        toast.success("Item added to inventory.");
      }

      resetForm();
    } catch (error) {
      toast.error("Failed to add or update item.");
    } finally {
      setUploadingImage(false);
    }
  };

  // Handle image selection for items
  const handleItemImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size should be less than 5MB');
      return;
    }

    if (!file.type.match('image.*')) {
      toast.error('Please select an image file');
      return;
    }

    try {
      const previewURL = URL.createObjectURL(file);
      setImagePreview(previewURL);
      setItemImageFile(file);
      
      toast.info('Image selected. Click Save to upload your new item image.');
    } catch (error) {
      toast.error('Failed to prepare image preview');
    }
  };

  // Edit an inventory item
  const handleEditItem = (item) => {
    setEditMode(true);
    setNewItem({ 
      name: item.name, 
      quantity: item.total
    });
    setCurrentItemId(item._id);
    setCurrentItem(item);
    setImagePreview(item.imageUrl || null);
    setShowItemForm(true);
    setItemImageFile(null);
  };

  // Toggle form visibility
  const toggleItemForm = () => {
    if (showItemForm && (editMode || newItem.name || newItem.quantity || itemImageFile)) {
      const confirmed = window.confirm("Discard changes?");
      if (!confirmed) return;
    }
    
    setShowItemForm(!showItemForm);
    
    if (showItemForm) {
      resetForm();
    }
  };

  // Handle delete item action with confirmation
  const handleDeleteItem = (itemId) => {
    deleteToastId = toast.info(
      <div className="flex flex-col space-y-2">
        <p className="text-center mb-2">Are you sure you want to delete this item?</p>
        <div className="flex justify-center space-x-3">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className={`px-3 py-1 rounded-md ${isDarkMode ? 'bg-red-600 hover:bg-red-700' : 'bg-red-500 hover:bg-red-600'} text-white`}
            onClick={() => confirmDeleteItem(itemId)}
          >
            Yes, Delete
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className={`px-3 py-1 rounded-md ${isDarkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300'} text-gray-800`}
            onClick={() => toast.dismiss(deleteToastId)}
          >
            Cancel
          </motion.button>
        </div>
      </div>,
      { autoClose: false, closeButton: false, draggable: false }
    );
  };

  // Confirm deletion of inventory item
  const confirmDeleteItem = async (itemId) => {
    try {
      await axios.delete(`${baseURL}/auth/inventory/${itemId}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      setInventoryItems((prevItems) =>
        prevItems.filter((item) => item._id !== itemId)
      );
      toast.success("Item deleted successfully.");
    } catch (error) {
      toast.error("Failed to delete item.");
    } finally {
      toast.dismiss(deleteToastId);
      deleteToastId = null;
    }
  };

  // Fetch borrowed equipment for a specific tanod
  const fetchEquipment = async (tanodId) => {
    const token = localStorage.getItem("token");
    if (!token) {
      toast.error("Please log in.");
      return;
    }

    try {
      setLoadingEquipments(true);
      const response = await axios.get(
        `${baseURL}/equipments/user/${tanodId}/equipments`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setEquipments(response.data);
    } catch (error) {
      toast.error("No Borrowed Equipments");
      setEquipments([]);
    } finally {
      setLoadingEquipments(false);
    }
  };

  // View equipment borrowed by a tanod
  const handleViewEquipment = (tanod) => {
    setSelectedTanod(tanod);
    setEquipments([]);
    fetchEquipment(tanod._id);
    setShowEquipmentModal(true);
  };

  // Filter items by return status and date
  const filteredItems = equipments.filter(
    (item) =>
      (showReturned
        ? item.returnDate !== "1970-01-01T00:00:00.000Z"
        : item.returnDate === "1970-01-01T00:00:00.000Z") &&
      (!filterDate || dayjs(item.returnDate).isSame(dayjs(filterDate), "day"))
  );

  // Format date display
  const formatDate = (date) => {
    const notReturnedDate = "1970-01-01T00:00:00.000Z";
    return date === notReturnedDate ? (
      <span className={`${isDarkMode ? 'text-red-400' : 'text-red-500'} font-semibold`}>
        Not Yet Returned
      </span>
    ) : (
      dayjs(date).format("MMM DD, YYYY - hh:mm A")
    );
  };

  // Handle reset item total
  const handleResetItemTotal = async (itemId) => {
    try {
      const response = await axios.put(
        `${baseURL}/auth/inventory/${itemId}`,
        { resetTotal: true },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );
      
      setInventoryItems((prevItems) =>
        prevItems.map((item) =>
          item._id === itemId ? response.data : item
        )
      );
      toast.success("Item quantities reset successfully.");
    } catch (error) {
      toast.error("Failed to reset item quantities.");
    }
  };

  // Add a new function to refresh inventory data
  const refreshInventory = async () => {
    try {
      const response = await axios.get(`${baseURL}/auth/inventory`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      
      setInventoryItems(response.data);
      toast.success("Inventory data refreshed successfully.");
    } catch (error) {
      toast.error("Failed to refresh inventory data.");
    }
  };

  // Add a function to properly refresh vehicle data with populated drivers
  const refreshVehicles = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        toast.error("Please log in.");
        return;
      }

      // Show loading notification
      const loadingToast = toast.loading("Refreshing vehicle data...");
      
      // Use axios to fetch vehicles with populate parameter
      const response = await axios.get(`${baseURL}/vehicles?populate=true&t=${Date.now()}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      
      // Process each vehicle to ensure driver images have cache-busting
      const processedVehicles = response.data.map(vehicle => {
        if (vehicle.assignedDriver && vehicle.assignedDriver.profilePicture) {
          // Add cache-busting parameter to driver profile image URLs
          vehicle.assignedDriver.profilePicture = 
            `${vehicle.assignedDriver.profilePicture}?t=${Date.now()}`;
        }
        return vehicle;
      });
      
      // Update state with processed vehicle data
      setVehicles(processedVehicles);
      
      // Success notification
      toast.dismiss(loadingToast);
      toast.success("Vehicle data refreshed successfully");
    } catch (error) {
      toast.error("Failed to refresh vehicles");
      console.error("Vehicle refresh error:", error);
    }
  };

  const handleApproveVehicleRequest = async (requestId) => {
    try {
      setProcessingRequestId(requestId);
      const token = localStorage.getItem("token");
      
      // First show confirmation
      toast.info(
        <div className="flex flex-col">
          <p className="mb-3">Are you sure you want to approve this vehicle request?</p>
          <div className="flex justify-center gap-2">
            <button
              onClick={() => {
                toast.dismiss();
                confirmApproveVehicleRequest(requestId, token);
              }}
              className="bg-green-500 text-white px-3 py-1.5 rounded-lg"
            >
              Yes, Approve
            </button>
            <button
              onClick={() => {
                toast.dismiss();
                setProcessingRequestId(null);
              }}
              className="bg-gray-500 text-white px-3 py-1.5 rounded-lg"
            >
              Cancel
            </button>
          </div>
        </div>,
        { 
          autoClose: false, 
          closeButton: false,
          position: "top-center",
          style: { zIndex: 9999 } 
        }
      );
    } catch (error) {
      console.error("Error handling vehicle request approval:", error);
      toast.error("Failed to prepare approval action");
      setProcessingRequestId(null);
    }
  };

  const confirmApproveVehicleRequest = async (requestId, token) => {
    try {
      // Use a loading toast with higher z-index
      const loadingToast = toast.loading("Approving request...", {
        position: "top-center",
        style: { zIndex: 9999 }
      });
      
      const response = await axios.put(
        `${process.env.REACT_APP_API_URL}/vehicles/requests/${requestId}/approve`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      
      if (response.data) {
        toast.dismiss(loadingToast);
        toast.success("Vehicle request approved successfully", {
          position: "top-center",
          style: { zIndex: 9999 }
        });
        
        // Update the request in state immediately (WebSocket will do this too, but this is faster)
        setVehicleRequests((prev) =>
          prev.map((req) =>
            req._id === requestId ? { ...req, status: 'Approved' } : req
          )
        );
        
        // Refresh vehicle list to reflect status changes
        if (typeof refreshVehicles === 'function') {
          refreshVehicles();
        }
      }
    } catch (error) {
      console.error("Error approving vehicle request:", error);
      toast.error(error.response?.data?.message || "Failed to approve request", {
        position: "top-center",
        style: { zIndex: 9999 }
      });
    } finally {
      setProcessingRequestId(null);
    }
  };

  // Handle vehicle request rejection
  const handleRejectVehicleRequest = async (requestId) => {
    try {
      setProcessingRequestId(requestId);
      setSelectedRequestId(requestId);
      setShowRejectionModal(true);
    } catch (error) {
      console.error("Error preparing vehicle request rejection:", error);
      toast.error("Failed to prepare rejection action");
      setProcessingRequestId(null);
    }
  };

  const confirmRejectVehicleRequest = async (requestId, reason) => {
    try {
      const token = localStorage.getItem("token");
      
      // Use a loading toast with higher z-index
      const loadingToast = toast.loading("Rejecting request...", {
        position: "top-center",
        style: { zIndex: 9999 }
      });
      
      const response = await axios.put(
        `${process.env.REACT_APP_API_URL}/vehicles/requests/${requestId}/reject`,
        { reason },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      
      if (response.data) {
        toast.dismiss(loadingToast);
        toast.success("Vehicle request rejected successfully", {
          position: "top-center",
          style: { zIndex: 9999 }
        });
        
        // Update the request in state to reflect the change immediately
        setVehicleRequests((prev) =>
          prev.map((req) =>
            req._id === requestId ? { ...req, status: 'Rejected', rejectionReason: reason } : req
          )
        );
        
        // Reset UI state
        setShowRejectionModal(false);
        setRejectionReason("");
      }
    } catch (error) {
      console.error("Error rejecting vehicle request:", error);
      toast.error(error.response?.data?.message || "Failed to reject request", {
        position: "top-center",
        style: { zIndex: 9999 }
      });
    } finally {
      setProcessingRequestId(null);
      setSelectedRequestId(null);
    }
  };

  // Add proper onClose function for the VehicleRequestsModal
  const handleCloseVehicleRequestsModal = () => {
    setShowVehicleRequestsModal(false);
  };

  // Enhanced function to fetch vehicles with better error handling
  const fetchVehicles = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;
      
      const response = await axios.get(`${baseURL}/vehicles`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      
      if (response.data && Array.isArray(response.data)) {
        setVehicles(response.data);
      } else {
        toast.error("Failed to load vehicles: Unexpected data format");
      }
    } catch (error) {
      if (error.response) {
        toast.error(`Failed to load vehicles: ${error.response.data.message || 'Server error'}`);
      } else if (error.request) {
        toast.error("Failed to load vehicles: No server response");
      } else {
        toast.error("Failed to load vehicles: Request setup error");
      }
    }
  };

  // Add new handler for password verification success
  const handleVerificationSuccess = () => {
    setShowPasswordModal(false);
    setShowReportModal(true);
  };

  return (
    <motion.div 
      className={`container mx-auto px-4 sm:px-6 lg:px-8 py-6 ${isDarkMode ? 'bg-gray-900' : 'bg-gray-100'}`}
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <ToastContainer 
        position="top-right"
        theme={isDarkMode ? "dark" : "light"}
        closeOnClick
        pauseOnHover
      />
      
      {/* Header Section */}
      <motion.div 
        className="flex flex-col md:flex-row md:items-center md:justify-between mb-8 gap-4"
        variants={itemVariants}
      >
        <div>
          <h1 className={`text-3xl font-bold mb-2 ${isDarkMode ? 'text-gray-100' : 'text-gray-800'}`}>
            Resource Management
          </h1>
          <p className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            Manage personnel and equipment inventory
          </p>
        </div>
        
        <div className="flex flex-wrap gap-3">
          {/* Add report generation button */}
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => setShowPasswordModal(true)}
            className={`px-4 py-2 rounded-lg shadow flex items-center ${
              isDarkMode ? 'bg-purple-600 hover:bg-purple-700' : 'bg-purple-500 hover:bg-purple-600'} text-white`}
          >
            <FaChartBar className="mr-2" />
            Generate Audit Report
          </motion.button>
          
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => setShowInventoryModal(!showInventoryModal)}
            className={`px-4 py-2 rounded-lg shadow flex items-center ${buttonClass}`}
          >
            <FaBox className="mr-2" />
            Manage Inventory
          </motion.button>
          
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => setShowVehicleModal(!showVehicleModal)}
            className={`px-4 py-2 rounded-lg shadow flex items-center ${
              isDarkMode ? 'bg-green-600 hover:bg-green-700' : 'bg-green-500 hover:bg-green-600'} text-white`}
          >
            <FaCar className="mr-2" />
            Manage Vehicles
          </motion.button>
          
          {/* Vehicle Requests Button */}
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => setShowVehicleRequestsModal(true)}
            className={`px-4 py-2 rounded-lg shadow flex items-center ${
              isDarkMode ? 'bg-amber-600 hover:bg-amber-700' : 'bg-amber-500 hover:bg-amber-600'} text-white`}
          >
            <FaClipboardList className="mr-2" />
            Vehicle Requests
            {pendingRequests > 0 && (
              <span className="ml-2 px-2 py-0.5 text-xs bg-red-600 rounded-full text-white">
                {pendingRequests}
              </span>
            )}
          </motion.button>
          
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => setViewMode(viewMode === 'grid' ? 'table' : 'grid')}
            className={`px-4 py-2 rounded-lg shadow flex items-center ${secondaryButtonClass}`}
          >
            <FaExchangeAlt className="mr-2" />
            {viewMode === 'grid' ? 'Table View' : 'Grid View'}
          </motion.button>
        </div>
      </motion.div>
      
      {/* Tanod Personnel Section */}
      <motion.div
        variants={itemVariants}
        className={`rounded-xl shadow-lg overflow-hidden mb-8 ${cardBgClass}`}
      >
        <div className={`${headerClass} px-6 py-4 flex items-center`}>
          <FaUserShield className="mr-2" />
          <h2 className="text-xl font-bold">Tanod Personnel</h2>
          <span className={`ml-3 px-3 py-1 text-sm rounded-full ${
            isDarkMode ? 'bg-blue-900 text-blue-200' : 'bg-blue-100 text-blue-800'
          }`}>
            {tanods.length}
          </span>
        </div>
        
        {loading ? (
          <div className="flex justify-center items-center p-12">
            <div className="loader">
              <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500"></div>
              <p className="mt-4">Loading personnel data...</p>
            </div>
          </div>
        ) : tanods.length === 0 ? (
          <div className="p-12 text-center">
            <p className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'} mb-4`}>No tanod personnel found</p>
          </div>
        ) : (
          <>
            {viewMode === 'grid' ? (
              <div className="p-6 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {tanods.map((tanod) => (
                  <TanodCard 
                    key={tanod._id} 
                    tanod={tanod} 
                    handleViewEquipment={handleViewEquipment} 
                    isDarkMode={isDarkMode}
                    buttonClass={buttonClass}
                  />
                ))}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead className={tableHeaderClass}>
                    <tr>
                      <th className="py-3 px-6 text-left">Profile</th>
                      <th className="py-3 px-6 text-left">Full Name</th>
                      <th className="py-3 px-6 text-left">Contact</th>
                      <th className="py-3 px-6 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className={isDarkMode ? 'divide-y divide-gray-700' : 'divide-y divide-gray-200'}>
                    {tanods.map((tanod) => (
                      <motion.tr 
                        key={tanod._id} 
                        className={isDarkMode ? 'hover:bg-gray-750' : 'hover:bg-gray-50'}
                        whileHover={{ backgroundColor: isDarkMode ? 'rgba(55, 65, 81, 0.3)' : 'rgba(249, 250, 251, 0.8)' }}
                      >
                        <td className="py-4 px-6 whitespace-nowrap">
                          <div className="flex items-center">
                            {/* ...existing code for tanod profile image... */}
                            {tanod.profilePicture ? (
                              <img
                                src={tanod.profilePicture}
                                alt={tanod.firstName}
                                className="w-10 h-10 rounded-full object-cover"
                              />
                            ) : (
                              <div className="w-10 h-10 rounded-full flex items-center justify-center bg-gray-200">
                                <FaUserCircle className="w-8 h-8 text-gray-400" />
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="py-4 px-6">
                          {`${tanod.firstName} ${tanod.middleName || ""} ${tanod.lastName}`}
                        </td>
                        <td className="py-4 px-6">
                          {tanod.contactNumber || "N/A"}
                        </td>
                        <td className="py-4 px-6 text-center">
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => handleViewEquipment(tanod)}
                            className={`px-3 py-1.5 rounded flex items-center justify-center mx-auto ${buttonClass}`}
                          >
                            <FaEye className="mr-1.5" />
                            View Equipment
                          </motion.button>
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </motion.div>
      
      {/* Inventory Modal */}
      <AnimatePresence>
        {showInventoryModal && (
          <InventoryModal
            inventoryItems={inventoryItems}
            showItemForm={showItemForm}
            toggleItemForm={toggleItemForm}
            resetForm={resetForm}
            handleEditItem={handleEditItem}
            handleDeleteItem={handleDeleteItem}
            handleResetItemTotal={handleResetItemTotal}
            refreshInventory={refreshInventory}
            editMode={editMode}
            newItem={newItem}
            setNewItem={setNewItem}
            handleAddOrUpdateItem={handleAddOrUpdateItem}
            handleItemImageChange={handleItemImageChange}
            imagePreview={imagePreview}
            itemImageFile={itemImageFile}
            uploadingImage={uploadingImage}
            currentItem={currentItem}
            setShowInventoryModal={setShowInventoryModal}
            isDarkMode={isDarkMode}
            modalBgClass={modalBgClass}
            headerClass={headerClass}
            tableHeaderClass={tableHeaderClass}
            secondaryButtonClass={secondaryButtonClass}
            inputClass={inputClass}
          />
        )}
      </AnimatePresence>

      {/* Equipment Modal */}
      <AnimatePresence>
        {showEquipmentModal && selectedTanod && (
          <EquipmentModal
            selectedTanod={selectedTanod}
            filteredItems={filteredItems}
            showReturned={showReturned}
            setShowReturned={setShowReturned}
            filterDate={filterDate}
            setFilterDate={setFilterDate}
            loadingEquipments={loadingEquipments}
            setShowEquipmentModal={setShowEquipmentModal}
            formatDate={formatDate}
            isDarkMode={isDarkMode}
            modalBgClass={modalBgClass}
            headerClass={headerClass}
            inputClass={inputClass}
          />
        )}
      </AnimatePresence>

      {/* Vehicle Modal */}
      <AnimatePresence>
        {showVehicleModal && (
          <VehicleModal
            vehicles={vehicles}
            setVehicles={setVehicles}
            showVehicleModal={showVehicleModal}
            setShowVehicleModal={setShowVehicleModal}
            isDarkMode={isDarkMode}
            tanods={tanods}
            uploadProfileImage={uploadProfileImage}
            refreshVehicles={refreshVehicles} // Pass the refresh function
            baseURL={baseURL} // Pass the baseURL for API calls
          />
        )}
      </AnimatePresence>
      
      {/* New Vehicle Requests Modal */}
      <AnimatePresence>
        {showVehicleRequestsModal && (
          <VehicleRequestsModal
            isOpen={showVehicleRequestsModal}
            onClose={handleCloseVehicleRequestsModal} // Pass proper close handler
            refreshVehicles={fetchVehicles} // Pass the fetchVehicles function
          />
        )}
      </AnimatePresence>

      {/* Password Verification Modal */}
      <PasswordVerificationModal 
        isOpen={showPasswordModal}
        onClose={() => setShowPasswordModal(false)}
        onVerified={handleVerificationSuccess}
        isDarkMode={isDarkMode}
        action="generate resources audit report"
      />
      
      {/* Resources Audit Report Modal */}
      <ResourcesReportModal 
        isOpen={showReportModal} 
        onClose={() => setShowReportModal(false)} 
        isDarkMode={isDarkMode} 
      />
    </motion.div>
  );
}

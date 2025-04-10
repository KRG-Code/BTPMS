import React, { useState, useEffect } from "react";
import axios from "axios";
import { storage } from "../../../firebase";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import dayjs from "dayjs";
import customParseFormat from "dayjs/plugin/customParseFormat";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "../../../contexts/ThemeContext";
import {
  FaPlus,
  FaTimes,
  FaFilter,
  FaCar,
  FaExclamationTriangle
} from "react-icons/fa";

// Import component files
import EquipmentFilter from "./EquipmentsComponents/EquipmentFilter";
import EquipmentForm from "./EquipmentsComponents/EquipmentForm";
import EquipmentList from "./EquipmentsComponents/EquipmentList";
import VehicleSection from "./EquipmentsComponents/VehicleSection";

dayjs.extend(customParseFormat);

// Animation variants
const fadeIn = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.4 } }
};

const slideUp = {
  hidden: { y: 20, opacity: 0 },
  visible: i => ({
    y: 0, 
    opacity: 1, 
    transition: { delay: i * 0.1, duration: 0.4 }
  })
};

const formVariants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.3 } },
  exit: { opacity: 0, scale: 0.95, transition: { duration: 0.2 } }
};

const Equipment = () => {
  const [items, setItems] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [selectedItem, setSelectedItem] = useState("");
  const [selectedInventoryItem, setSelectedInventoryItem] = useState(null);
  const [alreadyBorrowed, setAlreadyBorrowed] = useState(false);
  const [showReturned, setShowReturned] = useState(false);
  const [filterDate, setFilterDate] = useState("");
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const { isDarkMode } = useTheme();
  const [assignedVehicles, setAssignedVehicles] = useState([]);
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [showVehicleForm, setShowVehicleForm] = useState(false);
  const [vehicleUsage, setVehicleUsage] = useState({
    startMileage: "",
    endMileage: "",
    date: new Date().toISOString().split('T')[0],
    destination: "",
    notes: "",
    status: "Good condition"
  });
  const [vehicleUsageHistory, setVehicleUsageHistory] = useState([]);
  const [loadingVehicles, setLoadingVehicles] = useState(false);
  const [viewingHistory, setViewingHistory] = useState(false);
  const [viewingVehicles, setViewingVehicles] = useState(false);

  // Make sure baseURL is set correctly and consistent with server configuration
  // Remove any trailing slash to avoid path construction issues
  const baseURL = process.env.REACT_APP_API_URL.replace(/\/$/, '');

  // Theme-aware styles
  const cardBg = isDarkMode ? 'bg-gray-800' : 'bg-white';
  const textColor = isDarkMode ? 'text-gray-100' : 'text-gray-800';
  const subTextColor = isDarkMode ? 'text-gray-400' : 'text-gray-600';
  const borderColor = isDarkMode ? 'border-gray-700' : 'border-gray-200';
  const hoverBg = isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-50';
  const inputBg = isDarkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-200';
  const inputText = isDarkMode ? 'text-white placeholder:text-gray-400' : 'text-black placeholder:text-gray-500';
  const buttonPrimary = isDarkMode ? 'bg-blue-600 hover:bg-blue-700' : 'bg-blue-500 hover:bg-blue-600';
  const buttonSecondary = isDarkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300';
  const buttonDanger = isDarkMode ? 'bg-red-600 hover:bg-red-700' : 'bg-red-500 hover:bg-red-600';
  const pageBg = isDarkMode ? 'bg-gray-900' : 'bg-gray-50';
  // Define headerClass that was missing
  const headerClass = isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200';

  useEffect(() => {
    const fetchEquipments = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem("token");
        const response = await axios.get(`${baseURL}/equipments`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setItems(response.data);
      } catch (error) {
        toast.error("Error fetching equipment. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    const fetchInventory = async () => {
      try {
        const token = localStorage.getItem("token");
        const response = await axios.get(`${baseURL}/auth/inventory`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setInventory(response.data.filter((item) => item.quantity > 0));
      } catch (error) {
        toast.error("Failed to load inventory items.");
      }
    };
    
    const fetchAssignedVehicles = async () => {
      setLoadingVehicles(true);
      try {
        const token = localStorage.getItem("token");
        if (!token) return;
        
        const userId = localStorage.getItem("userId");
        if (!userId) return;
        
        const apiUrl = `${baseURL}/vehicles/assigned-to/${userId}`;
        const response = await axios.get(apiUrl, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        if (response.data && Array.isArray(response.data)) {
          setAssignedVehicles(response.data);
          
          if (response.data.length > 0) {
            setSelectedVehicle(response.data[0]);
            setViewingVehicles(true);
            fetchVehicleUsageHistory(response.data[0]._id);
          } else {
            // Try alternative API path (without /api prefix)
            const altApiUrl = baseURL.includes('/api') 
              ? baseURL.replace('/api', '') + '/vehicles/assigned-to/' + userId
              : baseURL + '/vehicles/assigned-to/' + userId;
            
            try {
              const altResponse = await axios.get(altApiUrl, {
                headers: { Authorization: `Bearer ${token}` }
              });
              
              if (altResponse.data && Array.isArray(altResponse.data) && altResponse.data.length > 0) {
                setAssignedVehicles(altResponse.data);
                setSelectedVehicle(altResponse.data[0]);
                setViewingVehicles(true);
                fetchVehicleUsageHistory(altResponse.data[0]._id);
              }
            } catch (altError) {
              // Silent fallback failure
            }
          }
        }
      } catch (error) {
        if (error.response) {
          // Try direct API endpoint as another fallback option
          try {
            const userId = localStorage.getItem("userId");
            const token = localStorage.getItem("token");
            const directUrl = `${process.env.REACT_APP_API_URL.replace(/\/$/, '')}/vehicles/assigned-to/${userId}`;
            
            const directResponse = await axios.get(directUrl, {
              headers: { Authorization: `Bearer ${token}` }
            });
            
            if (directResponse.data && Array.isArray(directResponse.data) && directResponse.data.length > 0) {
              setAssignedVehicles(directResponse.data);
              setSelectedVehicle(directResponse.data[0]);
              setViewingVehicles(true);
              fetchVehicleUsageHistory(directResponse.data[0]._id);
            }
          } catch (directError) {
            // Silent fallback failure
          }
        }
      } finally {
        setLoadingVehicles(false);
      }
    };

    // Set up WebSocket connection for real-time updates
    const setupWebSocket = () => {
      const token = localStorage.getItem("token");
      const userId = localStorage.getItem("userId");
      if (!token || !userId) return;
      
      // Get WebSocket URL from env or fallback
      const wsUrl = process.env.REACT_APP_WS_URL || 
        (process.env.REACT_APP_API_URL || "").replace(/^http/, 'ws').replace('/api', '') || 
        "ws://localhost:5000";
      
      const ws = new WebSocket(`${wsUrl}?token=${token}`);
      
      ws.onopen = () => {
        console.log("WebSocket connected in Equipment component");
        
        // Join user-specific room for updates
        ws.send(JSON.stringify({ type: 'join', room: `user-${userId}` }));
        
        // Also join general room for vehicle requests
        ws.send(JSON.stringify({ type: 'join', room: 'vehicle-requests' }));
      };
      
      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log("WebSocket message received in Equipment:", data);
          
          // Handle vehicle request updates
          if (data.type === 'vehicleRequestUpdate') {
            const updatedRequest = data.request;
            
            // Check if the request belongs to this user
            if (updatedRequest.requesterId?._id === userId || updatedRequest.requesterId === userId) {
              // If request was approved, refresh assigned vehicles
              if (updatedRequest.status === 'Approved') {
                fetchAssignedVehicles();
              }
            }
          }
        } catch (error) {
          console.error("Error processing WebSocket message:", error);
        }
      };
      
      ws.onerror = (error) => {
        console.error("WebSocket error:", error);
      };
      
      ws.onclose = () => {
        console.log("WebSocket disconnected");
      };
      
      return ws;
    };
    
    const ws = setupWebSocket();

    fetchEquipments();
    fetchInventory();
    fetchAssignedVehicles();
    
    return () => {
      if (ws) ws.close();
    };
  }, [baseURL]);

  // Add this function to check if the user has already borrowed this item
  const checkAlreadyBorrowed = (itemName) => {
    // Find non-returned items with the same name
    const unreturned = items.filter(item => 
      item.name.toLowerCase() === itemName.toLowerCase() && 
      item.returnDate === "1970-01-01T00:00:00.000Z"
    );
    
    return unreturned.length > 0;
  };

  const handleItemSelection = (itemId) => {
    setSelectedItem(itemId);
    const selected = inventory.find(item => item._id === itemId);
    
    if (selected) {
      setSelectedInventoryItem(selected);
      
      // Check if already borrowed
      const isBorrowed = checkAlreadyBorrowed(selected.name);
      setAlreadyBorrowed(isBorrowed);
      
      if (isBorrowed) {
        toast.warning(`You already have a ${selected.name} checked out. Please return it before borrowing another one.`);
      }
    } else {
      setSelectedInventoryItem(null);
      setAlreadyBorrowed(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedInventoryItem) {
      toast.error("Please select a valid item.");
      return;
    }

    if (alreadyBorrowed) {
      toast.error(`You already have a ${selectedInventoryItem.name} checked out. Please return it first.`);
      return;
    }

    try {
      toast.info("Borrowing equipment... Please wait.", { autoClose: false, toastId: "borrow" });

      const imageUrl = selectedInventoryItem.imageUrl || 'https://placehold.co/100x100?text=No+Image';

      const formData = {
        name: selectedInventoryItem.name,
        borrowDate: new Date().toISOString(),
        returnDate: "1970-01-01T00:00:00.000Z",
        imageUrl,
      };

      const token = localStorage.getItem("token");
      const response = await axios.post(`${baseURL}/equipments`, formData, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setInventory(inventory.map((item) =>
        item._id === selectedInventoryItem._id
          ? { ...item, quantity: item.quantity - 1 }
          : item
      ));
      setItems([...items, response.data]);
      setShowForm(false);
      setSelectedItem("");
      setSelectedInventoryItem(null);
      toast.dismiss("borrow");
      toast.success("Item borrowed successfully!");
    } catch (error) {
      toast.dismiss("borrow");
      toast.error("Error borrowing equipment. Please try again.");
    }
  };

  const handleReturn = (itemId) => {
    toast.info(
      <div className="flex flex-col">
        <p className="mb-3 font-medium">Do you want to return this item?</p>
        <div className="flex justify-center space-x-3">
          <motion.button 
            whileHover={{ scale: 1.05 }} 
            whileTap={{ scale: 0.95 }}
            className={`${isDarkMode ? 'bg-green-600 hover:bg-green-700' : 'bg-green-500 hover:bg-green-600'} text-white py-2 px-4 rounded-lg`}
            onClick={() => confirmReturn(itemId)}
          >
            Yes, Return Item
          </motion.button>
          <motion.button 
            whileHover={{ scale: 1.05 }} 
            whileTap={{ scale: 0.95 }}
            className={`${buttonSecondary} py-2 px-4 rounded-lg`}
            onClick={() => toast.dismiss()}
          >
            Cancel
          </motion.button>
        </div>
      </div>,
      { autoClose: false }
    );
  };

  const confirmReturn = async (itemId) => {
    try {
      const itemToReturn = items.find(item => item._id === itemId);
      const currentDateTime = new Date().toISOString();
      const updatedItem = { returnDate: currentDateTime };
      const token = localStorage.getItem("token");

      const response = await axios.put(`${baseURL}/equipments/${itemId}`, updatedItem, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const inventoryItem = inventory.find(item => item.name === itemToReturn.name);
      if (inventoryItem) {
        const updatedInventory = inventory.map(item => 
          item._id === inventoryItem._id 
            ? { ...item, quantity: item.quantity + 1 } 
            : item
        );
        setInventory(updatedInventory);
      }

      setItems(items.map((item) =>
        item._id === itemId ? response.data : item
      ));
      toast.dismiss();
      toast.success("Item returned successfully!");
    } catch (error) {
      toast.error("Error returning equipment. Please try again.");
    }
  };

  const formatDate = (date) => {
    const notReturnedDate = "1970-01-01T00:00:00.000Z";
    return date === notReturnedDate 
      ? null
      : dayjs(date).format("hh:mm A DD-MM-YYYY");
  };

  const getStatusBadgeClass = (returnDate) => {
    const notReturnedDate = "1970-01-01T00:00:00.000Z";
    if (returnDate === notReturnedDate) {
      return isDarkMode 
        ? 'bg-red-900/30 text-red-300 border-red-700' 
        : 'bg-red-100 text-red-800 border-red-200';
    } else {
      return isDarkMode 
        ? 'bg-green-900/30 text-green-300 border-green-700' 
        : 'bg-green-100 text-green-800 border-green-200';
    }
  };

  // Filter items based on search, date and returned status
  const filteredItems = items.filter(item => {
    const matchesReturnStatus = showReturned 
      ? item.returnDate !== "1970-01-01T00:00:00.000Z" 
      : item.returnDate === "1970-01-01T00:00:00.000Z";
    
    const matchesDate = !filterDate || dayjs(item.borrowDate).format('YYYY-MM-DD') === filterDate;
    
    const matchesSearch = !searchQuery || 
      item.name.toLowerCase().includes(searchQuery.toLowerCase());
    
    return matchesReturnStatus && matchesDate && matchesSearch;
  });

  // Function to fetch vehicle usage history
  const fetchVehicleUsageHistory = async (vehicleId) => {
    if (!vehicleId) return;
  
    try {
      // Initialize as empty array to avoid 'filter is not a function' error
      setVehicleUsageHistory([]);
      
      const token = localStorage.getItem("token");
      // Use correct endpoint for getting vehicle usage history
      const response = await axios.get(`${baseURL}/vehicles/${vehicleId}/usage`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Ensure we always set an array, even if the API returns something else
      if (Array.isArray(response.data)) {
        setVehicleUsageHistory(response.data);
      } else if (response.data && Array.isArray(response.data.history)) {
        // If the API returns an object with a history property that's an array
        setVehicleUsageHistory(response.data.history);
      } else {
        console.warn("Unexpected data structure from API:", response.data);
        setVehicleUsageHistory([]); // Set empty array if data is not as expected
      }
    } catch (error) {
      console.error("Failed to load vehicle usage history:", error);
      setVehicleUsageHistory([]); // Set empty array in case of error
      toast.error("Failed to load vehicle history");
    }
  };

  // Function to handle vehicle selection
  const handleVehicleSelect = (vehicle) => {
    setSelectedVehicle(vehicle);
    fetchVehicleUsageHistory(vehicle._id);
    setViewingHistory(false);
  };

  // Handle vehicle usage form changes
  const handleVehicleUsageChange = (e) => {
    const { name, value } = e.target;
    setVehicleUsage(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Submit vehicle usage
  const handleSubmitVehicleUsage = async (e) => {
    e.preventDefault();
    
    if (!vehicleUsage.startMileage || !vehicleUsage.endMileage || !vehicleUsage.destination) {
      toast.error("Please fill in all required fields");
      return;
    }
    
    const startMileage = parseFloat(vehicleUsage.startMileage);
    const endMileage = parseFloat(vehicleUsage.endMileage);
    
    if (isNaN(startMileage) || isNaN(endMileage)) {
      toast.error("Mileage must be a number");
      return;
    }
    
    if (endMileage <= startMileage) {
      toast.error("End mileage must be greater than start mileage");
      return;
    }
    
    if (selectedVehicle.currentMileage && startMileage < selectedVehicle.currentMileage) {
      toast.error(`Start mileage cannot be less than vehicle's current mileage (${selectedVehicle.currentMileage})`);
      return;
    }
    
    try {
      const token = localStorage.getItem("token");
      
      const loadingToast = toast.loading("Recording vehicle usage...");
      
      const response = await axios.post(
        `${baseURL}/vehicles/${selectedVehicle._id}/usage`,
        {
          ...vehicleUsage,
          mileageUsed: endMileage - startMileage
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      
      setAssignedVehicles(vehicles => 
        vehicles.map(v => 
          v._id === selectedVehicle._id 
            ? { ...v, currentMileage: endMileage } 
            : v
        )
      );
      
      setSelectedVehicle(prev => ({
        ...prev,
        currentMileage: endMileage
      }));
      
      setVehicleUsage({
        startMileage: endMileage.toString(),
        endMileage: "",
        date: new Date().toISOString().split('T')[0],
        destination: "",
        notes: "",
        status: "Good condition"
      });
      
      fetchVehicleUsageHistory(selectedVehicle._id);
      
      setShowVehicleForm(false);
      
      toast.dismiss(loadingToast);
      toast.success("Vehicle usage recorded successfully");
    } catch (error) {
      console.error("Error recording vehicle usage:", error);
      toast.error("Failed to record vehicle usage");
    }
  };

  return (
    <motion.div 
      initial="hidden"
      animate="visible"
      variants={fadeIn}
      className={`container mx-auto px-4 py-6 ${pageBg} min-h-screen`}
    >
      <ToastContainer 
        position="top-right" 
        theme={isDarkMode ? "dark" : "light"} 
        style={{ zIndex: 9999 }}
        toastStyle={{ zIndex: 9999 }}
        closeButton={true}
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop={true}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
      />
      
      {/* Page Header with Equipment Management title and Filter/Borrow/Vehicle buttons */}
      <motion.div variants={slideUp} custom={0}>
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
          <h1 className={`text-2xl font-bold mb-4 md:mb-0 ${textColor}`}>Equipment Management</h1>
          
          <div className="flex flex-wrap gap-2">
            {/* Toggle Filters Button */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`px-4 py-2 rounded-lg flex items-center text-sm ${
                isDarkMode ? 'bg-gray-800 hover:bg-gray-700' : 'bg-white hover:bg-gray-100'
              } ${borderColor} shadow-sm`}
            >
              <FaFilter className="mr-2" />
              {showFilters ? 'Hide Filters' : 'Show Filters'}
            </button>
            
            {/* Vehicle Button - Make sure it properly toggles the viewingVehicles state */}
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => setViewingVehicles(!viewingVehicles)}
              className={`px-4 py-2 rounded-lg flex items-center ${
                assignedVehicles.length > 0
                  ? isDarkMode ? 'bg-green-600 hover:bg-green-700' : 'bg-green-500 hover:bg-green-600'
                  : isDarkMode ? 'bg-yellow-600 hover:bg-yellow-700' : 'bg-yellow-500 hover:bg-yellow-600'
              } text-white shadow-sm relative`}
            >
              <FaCar className="mr-2" />
              Vehicles
              {assignedVehicles.length > 0 && (
                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {assignedVehicles.length}
                </span>
              )}
            </motion.button>
            
            {/* Get Equipment Button (renamed from Borrow Equipment) */}
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => setShowForm(!showForm)}
              className={`${buttonPrimary} text-white font-medium py-2 px-4 rounded-lg flex items-center`}
            >
              {showForm ? <><FaTimes className="mr-2" /> Cancel</> : <><FaPlus className="mr-2" /> Get Equipment</>}
            </motion.button>
          </div>
        </div>
      </motion.div>

      {/* Vehicle Section - Always show when toggled */}
      <AnimatePresence>
        {viewingVehicles && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-6 overflow-hidden"
          >
            {loadingVehicles ? (
              <div className="animate-pulse">
                <div className={`h-40 ${isDarkMode ? 'bg-gray-700' : 'bg-gray-200'} rounded-xl mb-4`}></div>
              </div>
            ) : assignedVehicles.length === 0 ? (
              <motion.div 
                className={`${cardBg} rounded-xl shadow-md border ${borderColor} overflow-hidden p-6 text-center`}
              >
                <FaCar className={`text-5xl mx-auto mb-4 ${subTextColor}`} />
                <h3 className={`text-xl font-semibold mb-2 ${textColor}`}>No Vehicle Assigned</h3>
                <p className={`${subTextColor} mb-6`}>You don't have any vehicles assigned to you at the moment.</p>
                <div className="flex justify-center items-center">
                  <FaExclamationTriangle className={`text-xl mr-2 ${
                    isDarkMode ? 'text-yellow-400' : 'text-yellow-600'
                  }`} />
                  <p className={`${subTextColor}`}>If you need a vehicle for your duties, please contact your administrator.</p>
                </div>
              </motion.div>
            ) : (
              <VehicleSection 
                assignedVehicles={assignedVehicles}
                setAssignedVehicles={setAssignedVehicles} // Add this line to pass the setter
                selectedVehicle={selectedVehicle}
                handleVehicleSelect={handleVehicleSelect}
                showVehicleForm={showVehicleForm}
                setShowVehicleForm={setShowVehicleForm}
                vehicleUsage={vehicleUsage}
                handleVehicleUsageChange={handleVehicleUsageChange}
                handleSubmitVehicleUsage={handleSubmitVehicleUsage}
                vehicleUsageHistory={vehicleUsageHistory}
                viewingHistory={viewingHistory}
                setViewingHistory={setViewingHistory}
                loadingVehicles={loadingVehicles}
                fetchVehicleUsageHistory={fetchVehicleUsageHistory}
                isDarkMode={isDarkMode}
                textColor={textColor}
                subTextColor={subTextColor}
                borderColor={borderColor}
                cardBg={cardBg}
                buttonPrimary={buttonPrimary}
                buttonSecondary={buttonSecondary}
                headerClass={headerClass}
                inputBg={inputBg}
                inputText={inputText}
              />
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Filters Section */}
      <EquipmentFilter 
        showFilters={showFilters}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        filterDate={filterDate}
        setFilterDate={setFilterDate}
        showReturned={showReturned}
        setShowReturned={setShowReturned}
        isDarkMode={isDarkMode}
        inputBg={inputBg}
        inputText={inputText}
        cardBg={cardBg}
        borderColor={borderColor}
        textColor={textColor}
        subTextColor={subTextColor}
        buttonPrimary={buttonPrimary}
        buttonSecondary={buttonSecondary}
      />

      {/* Borrow Equipment Form */}
      <EquipmentForm 
        showForm={showForm}
        handleSubmit={handleSubmit}
        selectedItem={selectedItem}
        handleItemSelection={handleItemSelection}
        inventory={inventory}
        alreadyBorrowed={alreadyBorrowed}
        selectedInventoryItem={selectedInventoryItem}
        setShowForm={setShowForm}
        setSelectedItem={setSelectedItem}
        setSelectedInventoryItem={setSelectedInventoryItem}
        setAlreadyBorrowed={setAlreadyBorrowed}
        isDarkMode={isDarkMode}
        cardBg={cardBg}
        borderColor={borderColor}
        textColor={textColor}
        subTextColor={subTextColor}
        inputBg={inputBg}
        inputText={inputText}
        buttonPrimary={buttonPrimary}
        buttonSecondary={buttonSecondary}
        formVariants={formVariants}
      />

      {/* Equipment List Section */}
      <EquipmentList 
        loading={loading}
        filteredItems={filteredItems}
        showReturned={showReturned}
        textColor={textColor}
        subTextColor={subTextColor}
        handleReturn={handleReturn}
        formatDate={formatDate}
        getStatusBadgeClass={getStatusBadgeClass}
        isDarkMode={isDarkMode}
        cardBg={cardBg}
        borderColor={borderColor}
        hoverBg={hoverBg}
        buttonDanger={buttonDanger}
      />
    </motion.div>
  );
};

export default Equipment;
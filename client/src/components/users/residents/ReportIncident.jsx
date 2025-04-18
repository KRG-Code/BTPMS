import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { FaExclamationTriangle, FaMapMarkerAlt, FaClock, FaCalendarAlt, FaInfoCircle, FaChevronRight, FaTicketAlt, FaCheck, FaSearch, FaUser, FaIdCard, FaSpinner, FaCheckCircle, FaPhone, FaEnvelope, FaMapPin, FaLock } from "react-icons/fa";
import { useTheme } from "../../../contexts/ThemeContext";
// Add Leaflet imports
import { MapContainer, TileLayer, Polygon, Marker, useMapEvents, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix for Leaflet marker icon issue
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerIconShadow from "leaflet/dist/images/marker-shadow.png";

// Set up the default icon for Leaflet markers
let DefaultIcon = L.icon({
  iconUrl: markerIcon,
  shadowUrl: markerIconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

// Set default icon for all markers
L.Marker.prototype.options.icon = DefaultIcon;

const ReportIncidents = ({ onClose, setShowEmergencyForm, setShowReportModal }) => {
  const { isDarkMode } = useTheme();
  const [formData, setFormData] = useState({
    type: "",
    otherType: "", // New field for custom type
    location: "",
    locationNote: "",
    address: "", // Add address field
    description: "",
    date: "",
    time: "",
    incidentClassification: "Normal Incident",
    residentId: "", // New field for resident ID
    password: "", // Add password field
    // Add new fields for map coordinates
    latitude: null,
    longitude: null,
    isInBoundary: false
  });

  // Add state for polygon data instead of hardcoding it
  const [polygons, setPolygons] = useState([]);
  const [loadingPolygons, setLoadingPolygons] = useState(false); // Changed to false initially
  
  // Add state for authentication token
  const [authToken, setAuthToken] = useState(localStorage.getItem("token") || "");

  // Add state for map visibility
  const [showMap, setShowMap] = useState(false);
  
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 3; // Changed from 4 to 3 steps
  const [submitting, setSubmitting] = useState(false);
  const [showTicketConfirmation, setShowTicketConfirmation] = useState(false);
  const [ticketInfo, setTicketInfo] = useState(null);
  const [residentVerified, setResidentVerified] = useState(false);
  const [residentInfo, setResidentInfo] = useState(null);
  const [searchingResident, setSearchingResident] = useState(false);
  const [searchError, setSearchError] = useState("");
  const [locationLoading, setLocationLoading] = useState(false); // Add new state for location loading
  const [markerPosition, setMarkerPosition] = useState(null); // For the map marker
  const [locationError, setLocationError] = useState("");
  const [locationType, setLocationType] = useState("text"); // "text", "current", or "map"
  const mapRef = useRef(null);
  const [passwordError, setPasswordError] = useState(""); // Add state for password error
  const [showPasswordVerification, setShowPasswordVerification] = useState(false);
  const pinInputRef = useRef(null); // Add ref for PIN input

  // Add new state and functions for forgot PIN functionality
  const [showForgotPinModal, setShowForgotPinModal] = useState(false);
  const [forgotPinEmail, setForgotPinEmail] = useState('');
  const [isRequestingReset, setIsRequestingReset] = useState(false);
  const [resetRequestSuccess, setResetRequestSuccess] = useState(false);

  // Function to fetch polygons from database - Only fetch when needed (when showing map)
  // Modify the fetchPolygons function to not require authentication
  const fetchPolygons = async () => {
    try {
      setLoadingPolygons(true);
      
      // Remove the authentication headers to allow public access
      const response = await fetch(`${process.env.REACT_APP_API_URL}/polygons/public`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch polygon data');
      }
      
      const data = await response.json();
      console.log("Fetched polygon data:", data); // Debug log
      setPolygons(data);
    } catch (error) {
      console.error("Error fetching polygons:", error);
      if (showMap) {
        toast.error("Could not load map boundaries. Please try again later.");
      }
    } finally {
      setLoadingPolygons(false);
    }
  };

  // Only fetch polygons when the map becomes visible or when the auth token changes
  useEffect(() => {
    if (showMap) { // Changed this line to remove authToken dependency
      fetchPolygons();
    }
  }, [showMap]); // Remove authToken from dependency array

  // Get San Agustin polygon from the fetched polygons
  // Improve getSanAgustinPolygon to handle the specific polygon ID
  const getSanAgustinPolygon = () => {
    if (polygons.length > 0) {
      // First try exact ID match for San Agustin polygon
      const specificPolygon = polygons.find(polygon => 
        polygon._id === "67f254b04615c73cdb3e7ee6" || 
        polygon.id === "67f254b04615c73cdb3e7ee6"
      );
      
      if (specificPolygon) {
        console.log("Found specific San Agustin polygon by ID");
        return {
          _id: specificPolygon._id,
          legend: specificPolygon.legend,
          color: specificPolygon.color,
          coordinates: specificPolygon.coordinates
        };
      }
      
      // Fallback to finding by name
      const sanAgustin = polygons.find(polygon => 
        polygon.legend === "San Agustin" || polygon.name === "San Agustin"
      );
      
      if (sanAgustin) {
        console.log("Found San Agustin polygon by name");
        return {
          _id: sanAgustin._id,
          legend: sanAgustin.legend || sanAgustin.name,
          color: sanAgustin.color || "#2bff00",
          coordinates: sanAgustin.coordinates
        };
      }
    }
    
    console.log("No polygon found, returning default");
    // Return a default empty polygon if not found
    return {
      _id: "",
      legend: "San Agustin",
      color: "#2bff00",
      coordinates: []
    };
  };

  // Function to check if a point is inside the polygon
  const isPointInPolygon = (point, polygon) => {
    if (!polygon || !polygon.coordinates || !polygon.coordinates.length) {
      return false;
    }
    
    let inside = false;
    const x = point.lat;
    const y = point.lng;

    for (let i = 0, j = polygon.coordinates.length - 1; i < polygon.coordinates.length; j = i++) {
      const xi = polygon.coordinates[i].lat;
      const yi = polygon.coordinates[i].lng;
      const xj = polygon.coordinates[j].lat;
      const yj = polygon.coordinates[j].lng;

      const intersect = ((yi > y) !== (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
      if (intersect) inside = !inside;
    }

    return inside;
  };

  // Function to toggle map visibility
  // Update toggleMapVisibility to always fetch polygons
  const toggleMapVisibility = () => {
    const newMapVisibility = !showMap;
    setShowMap(newMapVisibility);
    
    // Always fetch polygons when map becomes visible, no authentication required
    if (newMapVisibility) {
      fetchPolygons();
    }
  };

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0, scale: 0.9 },
    visible: { 
      opacity: 1, 
      scale: 1,
      transition: {
        duration: 0.3,
        type: "spring",
        stiffness: 300,
        damping: 30
      }
    },
    exit: { opacity: 0, scale: 0.9, transition: { duration: 0.2 } }
  };

  const slideVariants = {
    enter: (direction) => {
      return {
        x: direction > 0 ? 500 : -500,
        opacity: 0
      };
    },
    center: {
      x: 0,
      opacity: 1
    },
    exit: (direction) => {
      return {
        x: direction < 0 ? 500 : -500,
        opacity: 0
      };
    }
  };

  // Theme-aware colors
  const bgColor = isDarkMode ? "bg-gray-800" : "bg-white";
  const textColor = isDarkMode ? "text-white" : "text-gray-800";
  const inputBgColor = isDarkMode ? "bg-gray-700" : "bg-white";
  const inputBorderColor = isDarkMode ? "border-gray-600" : "border-gray-300";
  const inputTextColor = isDarkMode ? "text-white" : "text-gray-800";
  const inputPlaceholderColor = isDarkMode ? "placeholder-gray-400" : "placeholder-gray-500";

  // Step 1: Add function to auto-fill verified resident information
  const autoFillResidentInfo = (residentData) => {
    setResidentInfo(residentData);
    setResidentVerified(true);
    
    // Auto-fill form fields with resident information
    setFormData(prev => ({
      ...prev,
      fullName: `${residentData.firstName} ${residentData.lastName}`,
      contactNumber: residentData.contactNumber,
      email: residentData.email
    }));
    
    // Store token if available
    if (residentData.token) {
      localStorage.setItem("token", residentData.token);
      setAuthToken(residentData.token);
    }
    
    toast.success("Resident verified successfully!");
  };

  // Modify verifyResidentId to store token
  const verifyResidentId = async () => {
    if (!formData.residentId.trim()) {
      toast.error("Please enter your Resident ID");
      return;
    }
    
    setSearchingResident(true);
    setSearchError("");
    
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/residents/verify/${formData.residentId}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });
      
      const data = await response.json();
      
      if (response.ok && data.resident) {
        // Update with token handling
        if (data.token) {
          localStorage.setItem("token", data.token);
          setAuthToken(data.token);
        }
        
        autoFillResidentInfo(data.resident);
        
        // Immediately fetch polygons after successful verification
        fetchPolygons();
      } else {
        setSearchError(data.message || "Resident ID not found. Please check and try again.");
        toast.error(data.message || "Resident ID not found. Please check and try again.");
      }
    } catch (error) {
      console.error("Error verifying resident:", error);
      setSearchError("Error verifying resident. Please try again.");
      toast.error("Error verifying resident. Please try again.");
    } finally {
      setSearchingResident(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // Special handling for date field to prevent future dates
    if (name === "date") {
      const selectedDate = new Date(value);
      const today = new Date();
      today.setHours(0, 0, 0, 0); // Reset time part for comparison
      
      if (selectedDate > today) {
        toast.error("Cannot select a future date");
        return;
      }
    }
    
    setFormData({ ...formData, [name]: value });
  };

  const nextStep = () => {
    if (currentStep === 1) {
      // Validate step 1 (only resident verification now)
      if (!residentVerified) {
        toast.error("Please verify your Resident ID first");
        return;
      }
      // No longer check for incident type in step 1
    } else if (currentStep === 2) {
      // Updated validation for step 2 - now includes incident type, date, time, and location
      if (!formData.type) {
        toast.error("Please select an incident type");
        return;
      }
      // Check if Other is selected and otherType is empty
      if (formData.type === "Other" && !formData.otherType.trim()) {
        toast.error("Please specify the incident type");
        return;
      }
      if (!formData.description) {
        toast.error("Please enter a description");
        return;
      }
      if (!formData.date) {
        toast.error("Please select the date of the incident");
        return;
      }
      if (!formData.time) {
        toast.error("Please select the time of the incident");
        return;
      }
      if (!formData.location) {
        toast.error("Please enter or select a location");
        return;
      }
      if (!formData.isInBoundary) {
        toast.error("Location must be within San Agustin area");
        return;
      }
    } 
    // Step 3 has no specific validations since it's just review
    
    setCurrentStep(prev => Math.min(prev + 1, totalSteps));
  };

  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1)); // Don't go below 1
  };

  // Modify handleSubmit to first show password verification instead of submitting directly
  const handleSubmit = (e) => {
    e.preventDefault(); // Explicitly prevent form submission
    
    // Final validations before showing password verification
    if (!formData.type || !formData.location || !formData.description || !formData.date || !formData.time) {
      toast.error("Please fill in all required fields");
      return;
    }

    // Check if Other is selected and otherType is empty
    if (formData.type === "Other" && !formData.otherType.trim()) {
      toast.error("Please specify the incident type");
      return;
    }

    // Show password verification instead of submitting directly
    setShowPasswordVerification(true);
    
    // Focus the PIN input field when the modal opens
    setTimeout(() => {
      if (pinInputRef.current) {
        pinInputRef.current.focus();
      }
    }, 100);
  };

  // Add new function to handle actual form submission after password verification
  const confirmSubmit = async () => {
    // First verify password
    const isValid = await verifyPassword();
    if (isValid) {
      toast.info(
        <div>
          <p>Are you sure you want to submit this report?</p>
          <div className="flex justify-end space-x-2 mt-2">
            <button
              onClick={() => {
                submitReport();
                toast.dismiss();
              }}
              className={`px-3 py-1 rounded-md ${isDarkMode ? 'bg-green-600 hover:bg-green-700' : 'bg-green-500 hover:bg-green-600'} text-white font-medium text-sm`}
            >
              Yes
            </button>
            <button
              onClick={() => toast.dismiss()}
              className={`px-3 py-1 rounded-md ${isDarkMode ? 'bg-red-600 hover:bg-red-700' : 'bg-red-500 hover:bg-red-600'} text-white font-medium text-sm ml-2`}
            >
              No
            </button>
          </div>
        </div>,
        { 
          autoClose: false,
          closeOnClick: false,
          draggable: false,
        }
      );
    }
  };

  // Add function to verify resident password
  const verifyPassword = async () => {
    setPasswordError("");
    
    if (!formData.password) {
      toast.error("Please enter your PIN");
      setPasswordError("PIN is required");
      return false;
    }
    
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/residents/verify-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          residentId: formData.residentId,
          password: formData.password
        }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        setPasswordError(data.message || "Invalid PIN. Please try again.");
        toast.error(data.message || "Invalid PIN. Please try again.");
        return false;
      }
      
      // If verification successful, store token
      if (data.token) {
        localStorage.setItem("token", data.token);
        setAuthToken(data.token);
      }
      
      return true;
    } catch (error) {
      console.error("Error verifying PIN:", error);
      setPasswordError("Error verifying PIN. Please try again.");
      toast.error("Error verifying PIN. Please try again.");
      return false;
    }
  };

  const generateTicketId = () => {
    const timestamp = new Date().getTime();
    const randomPart = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    return `IR-${timestamp.toString().slice(-6)}-${randomPart}`;
  };

  const submitReport = async () => {
    try {
      setSubmitting(true);
      
      // Create the final data object to submit
      const finalFormData = {
        ...formData,
        // If "Other" is selected, use the otherType value as the actual type
        type: formData.type === "Other" ? `Other: ${formData.otherType}` : formData.type,
        location: formData.rawLocation || formData.location, // Use coordinates for database
        address: formData.address, // Include the human-readable address
        fullName: `${residentInfo?.firstName || ''} ${residentInfo?.lastName || ''}`,
        contactNumber: residentInfo?.contactNumber || '',
        email: residentInfo?.email || '',
      };

      // Generate a ticket ID
      const ticketId = generateTicketId();
      finalFormData.ticketId = ticketId;
      
      console.log("Submitting report data:", finalFormData); // Debug log
      
      const response = await fetch(`${process.env.REACT_APP_API_URL}/incident-reports`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${authToken}`,
        },
        body: JSON.stringify(finalFormData),
      });

      const responseData = await response.json();
      
      if (response.ok) {
        // Store ticket information and show confirmation screen
        setTicketInfo({
          id: ticketId,
          type: finalFormData.type,
          location: formData.location,
          date: formData.date,
          time: formData.time,
          submittedAt: new Date().toLocaleString(),
        });
        
        // Clear localStorage after successful submission (keep only necessary items)
        // We keep the token so the user remains logged in
        const token = localStorage.getItem('token');
        const userId = localStorage.getItem('userId');
        localStorage.clear();
        
        // Restore only the essential authentication items
        if (token) localStorage.setItem('token', token);
        if (userId) localStorage.setItem('userId', userId);
        
        setShowTicketConfirmation(true);
      } else {
        console.error("Server error:", responseData);
        toast.error(`Error: ${responseData.message || "Failed to submit report. Please try again."}`);
      }
    } catch (error) {
      console.error("Submission error:", error);
      toast.error("An error occurred. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const setCurrentLocation = () => {
    setLocationLoading(true);
    
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(async (position) => {
        const { latitude, longitude } = position.coords;
        const point = { lat: latitude, lng: longitude };
        const rawLocation = `Lat: ${latitude.toFixed(6)}, Lon: ${longitude.toFixed(6)}`;
        
        // Check if user's current location is inside the San Agustin polygon
        const sanAgustinPolygon = getSanAgustinPolygon();
        const inside = isPointInPolygon(point, sanAgustinPolygon);
        
        if (inside) {
          // Valid location - clear any errors
          setLocationError("");
          setMarkerPosition([latitude, longitude]);
          
          try {
            const response = await fetch(
              `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&addressdetails=1`,
              {
                headers: {
                  'User-Agent': 'BTPMS_App/1.0'
                }
              }
            );
            
            if (!response.ok) {
              throw new Error(`Error: ${response.status}`);
            }
            
            const data = await response.json();
            
            setFormData((prevData) => ({
              ...prevData,
              location: data.display_name || rawLocation,
              address: data.display_name,
              rawLocation: rawLocation,
              latitude: latitude,
              longitude: longitude,
              isInBoundary: true
            }));
            
            setLocationType("current");
          } catch (error) {
            console.error("Error getting location details:", error);
            setFormData((prevData) => ({
              ...prevData,
              location: rawLocation,
              address: "Location in San Agustin",
              rawLocation: rawLocation,
              latitude: latitude,
              longitude: longitude,
              isInBoundary: true
            }));
          }
        } else {
          // Invalid location - show error but don't update form
          toast.error("Your current location is outside San Agustin area. Please select a different location within the boundary.");
          setLocationError("Your location must be within San Agustin area");
          
          // Keep previous valid location data if any
          setFormData(prev => ({
            ...prev,
            isInBoundary: false
          }));
        }
        setLocationLoading(false);
      }, (error) => {
        console.error("Error getting location:", error);
        toast.error("Could not get your current location. Please check your device settings and permissions.");
        setLocationLoading(false);
      }, {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      });
    } else {
      toast.error("Geolocation is not supported by this browser. Please enter your location manually.");
      setLocationLoading(false);
    }
  };

  const setCurrentDateTime = () => {
    const now = new Date();
    const dateString = now.toISOString().split('T')[0]; // Get current date in YYYY-MM-DD format
    const timeString = now.toTimeString().split(' ')[0].slice(0, 5); // Get current time in HH:mm format
    setFormData((prevData) => ({
      ...prevData,
      date: dateString,
      time: timeString,
    }));
  };

  const handleEmergencyClick = () => {
    setShowReportModal(false);
    setShowEmergencyForm(true);
  };

  // Step titles and descriptions
  const steps = [
    {
      number: 1,
      title: "Resident Verification",
      description: "Verify your identity"
    },
    {
      number: 2,
      title: "Incident Details & Location",
      description: "Provide incident information"
    },
    {
      number: 3,
      title: "Review & Submit",
      description: "Review and submit your report"
    }
  ];

  // Map click handler component - Updated to handle invalid locations
  const MapClickHandler = () => {
    useMapEvents({
      click: (e) => {
        const { lat, lng } = e.latlng;
        const point = { lat, lng };
        
        // Check if the clicked point is inside the San Agustin polygon
        const sanAgustinPolygon = getSanAgustinPolygon();
        const inside = isPointInPolygon(point, sanAgustinPolygon);
        
        if (inside) {
          // Clear any previous errors since location is valid
          setLocationError("");
          setMarkerPosition([lat, lng]);
          
          // Update form data with the valid location
          setFormData((prev) => ({
            ...prev,
            latitude: lat,
            longitude: lng,
            rawLocation: `Lat: ${lat.toFixed(6)}, Lon: ${lng.toFixed(6)}`,
            isInBoundary: true
          }));
          
          // Try to get human-readable address using reverse geocoding
          fetchAddressFromCoordinates(lat, lng);
          
          setLocationType("map");
        } else {
          // Invalid location outside polygon - keep previous valid selection if it exists
          toast.error("Selected location is outside San Agustin area. Please select a location within the highlighted boundary.");
          setLocationError("Location must be within San Agustin area");
          
          // Do NOT update marker position or form data
          // This ensures we keep the previous valid selection
        }
      },
    });
    return null;
  };

  // Function to fetch address from coordinates - improved error handling
  const fetchAddressFromCoordinates = async (lat, lng) => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1`,
        {
          headers: {
            'User-Agent': 'BTPMS_App/1.0' // Comply with usage policy
          }
        }
      );
      
      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }
      
      const data = await response.json();
      
      setFormData((prevData) => ({
        ...prevData,
        location: data.display_name || `Location in San Agustin (${lat.toFixed(6)}, ${lng.toFixed(6)})`,
        address: data.display_name || "Location in San Agustin",
      }));
    } catch (error) {
      console.error("Error getting location details:", error);
      // Still mark as valid location since it's inside the polygon
      setFormData((prevData) => ({
        ...prevData,
        location: `Location in San Agustin (${lat.toFixed(6)}, ${lng.toFixed(6)})`,
        address: "Location in San Agustin"
      }));
    }
  };

  // Calculate center coordinates for the map
  const calculateCenterCoordinates = () => {
    const sanAgustinPolygon = getSanAgustinPolygon();
    if (!sanAgustinPolygon.coordinates || !sanAgustinPolygon.coordinates.length) {
      return [14.730, 121.035]; // Default center if no coordinates
    }
    
    let totalLat = 0;
    let totalLng = 0;
    const coords = sanAgustinPolygon.coordinates;
    
    for (const coord of coords) {
      totalLat += coord.lat;
      totalLng += coord.lng;
    }
    
    return [totalLat / coords.length, totalLng / coords.length];
  };

  // Fit map to polygon bounds
  const MapBoundsAdjuster = () => {
    const map = useMap();
    const sanAgustinPolygon = getSanAgustinPolygon();
    
    useEffect(() => {
      if (map && sanAgustinPolygon.coordinates && sanAgustinPolygon.coordinates.length > 0) {
        const points = sanAgustinPolygon.coordinates.map(coord => [coord.lat, coord.lng]);
        const bounds = L.latLngBounds(points);
        map.fitBounds(bounds, { padding: [20, 20], maxZoom: 16 });
        mapRef.current = map;
      }
    }, [map, sanAgustinPolygon]);
    
    return null;
  };

  // Get current date for date input max attribute
  const today = new Date().toISOString().split('T')[0]; // Format: YYYY-MM-DD

  // Render the appropriate step content with map visibility check
  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <motion.div
            key="step1"
            custom={1}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ type: "tween", ease: "easeInOut", duration: 0.3 }}
            className="space-y-5"
          >
            {/* Resident Verification Section - Only keep verification part here */}
            <div className="mb-4">
              <h3 className="text-lg font-semibold mb-3">Verify Your Identity</h3>
              
              <div className="mb-4">
                <label htmlFor="residentId" className="block mb-2 font-medium">
                  Resident ID <span className="text-red-500">*</span>
                </label>
                <div className="flex">
                  <input
                    type="text"
                    id="residentId"
                    name="residentId"
                    value={formData.residentId}
                    onChange={handleChange}
                    placeholder="Enter your Resident ID (e.g., BSA123456)"
                    className={`flex-grow px-3 py-2 rounded-l-lg border ${inputBgColor} ${inputBorderColor} ${inputTextColor} ${inputPlaceholderColor} focus:outline-none focus:ring-2 focus:ring-blue-500`}
                  />
                  <button
                    type="button"
                    onClick={verifyResidentId}
                    disabled={searchingResident}
                    className={`px-3 py-2 ${searchingResident ? 'bg-gray-500' : 'bg-blue-600 hover:bg-blue-700'} text-white rounded-r-lg flex items-center justify-center`}
                  >
                    {searchingResident ? (
                      <FaSpinner className="animate-spin" />
                    ) : (
                      <FaSearch />
                    )}
                  </button>
                </div>
                {searchError && (
                  <p className="mt-2 text-sm text-red-500">{searchError}</p>
                )}
              </div>
              
              {residentVerified && residentInfo && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                  className={`border ${isDarkMode ? 'border-gray-700' : 'border-gray-300'} rounded-lg overflow-hidden mb-4`}
                >
                  <div className={`${isDarkMode ? 'bg-blue-900' : 'bg-blue-100'} p-2 flex items-center`}>
                    <FaIdCard className={`mr-2 ${isDarkMode ? 'text-blue-300' : 'text-blue-600'}`} />
                    <h3 className={`font-semibold ${isDarkMode ? 'text-blue-100' : 'text-blue-700'} text-sm`}>Resident Information</h3>
                  </div>
                  
                  <div className="p-3 flex flex-col md:flex-row">
                    <div className="w-full md:w-1/4 mb-3 md:mb-0">
                      <div className="w-16 h-16 rounded-full overflow-hidden mx-auto border-2 border-blue-500">
                        <img 
                          src={residentInfo.profilePicture || '/default-avatar.png'}
                          alt={`${residentInfo.firstName}'s profile`}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.target.src = '/default-avatar.png';
                          }}
                        />
                      </div>
                      <div className="mt-2 text-center">
                        <p className={`font-semibold text-sm ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>{residentInfo.residentId}</p>
                      </div>
                    </div>
                    
                    <div className="w-full md:w-3/4 space-y-1">
                      <div>
                        <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Full Name</p>
                        <p className="font-medium text-base">{`${residentInfo.firstName} ${residentInfo.middleName || ''} ${residentInfo.lastName}`}</p>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Contact</p>
                          <p className="font-medium text-sm">{residentInfo.contactNumber || 'Not provided'}</p>
                        </div>
                        <div>
                          <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Email</p>
                          <p className="font-medium text-sm truncate">{residentInfo.email || 'Not provided'}</p>
                        </div>
                      </div>
                      
                      {/* Add new details - age and gender */}
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Age</p>
                          <p className="font-medium text-sm">{residentInfo.age || 'Not provided'} years</p>
                        </div>
                        <div>
                          <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Gender</p>
                          <p className="font-medium text-sm">{residentInfo.gender || 'Not provided'}</p>
                        </div>
                      </div>
                      
                      {/* Add address */}
                      <div>
                        <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Address</p>
                        <p className="font-medium text-sm">{residentInfo.address || 'Not provided'}</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className={`p-2 ${isDarkMode ? 'bg-green-900/30 text-green-300' : 'bg-green-100 text-green-800'} flex items-center`}>
                    <FaCheck className="mr-2 text-sm" />
                    <p className="text-sm">Resident verified successfully</p>
                  </div>
                </motion.div>
              )}
            </div>
            
            <div className="bg-blue-50 dark:bg-blue-900/30 rounded-lg p-3">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <FaInfoCircle className="h-4 w-4 text-blue-500" />
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-blue-800 dark:text-blue-300">Information:</h3>
                  <p className="text-sm text-blue-700 dark:text-blue-400">
                    Please verify your identity first. This helps us ensure that reports come from actual residents.
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        );

      case 2:
        return (
          <motion.div
            key="step2"
            custom={1}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ type: "tween", ease: "easeInOut", duration: 0.3 }}
            className="space-y-4"
          >
            {/* Incident Type Section */}
            <div>
              <h3 className="text-base font-semibold mb-2">Incident Details</h3>
              <label htmlFor="type" className="block font-medium mb-2 text-sm">
                Incident Type <span className="text-red-500">*</span>
              </label>
              <select
                name="type"
                id="type"
                value={formData.type}
                onChange={handleChange}
                className={`w-full p-2 border rounded-lg 
                  ${inputBgColor} ${inputTextColor} ${inputBorderColor} ${inputPlaceholderColor} 
                  focus:ring-2 focus:ring-blue-500 focus:border-blue-500`}
                required
              >
                <option value="">Select Incident Type</option>
                <option value="Robbery">Robbery</option>
                <option value="Vandalism">Vandalism</option>
                <option value="Noise Disturbance">Noise Disturbance</option>
                <option value="Public Intoxication">Public Intoxication</option>
                <option value="Traffic Violation">Traffic Violation</option>
                <option value="Trespassing">Trespassing</option>
                <option value="Other">Other</option>
              </select>
              
              <AnimatePresence>
                {formData.type === "Other" && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="mt-2"
                  >
                    <label htmlFor="otherType" className="block font-medium mb-1 text-sm">
                      Please specify incident type <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      id="otherType"
                      name="otherType"
                      value={formData.otherType}
                      onChange={handleChange}
                      className={`w-full p-2 border rounded-lg 
                        ${inputBgColor} ${inputTextColor} ${inputBorderColor} ${inputPlaceholderColor}
                        focus:ring-2 focus:ring-blue-500 focus:border-blue-500`}
                      placeholder="Please specify the incident type"
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Date and Time fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label htmlFor="date" className="block font-medium mb-1 text-sm flex items-center">
                  <FaCalendarAlt className="mr-1 text-blue-500" />
                  Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  name="date"
                  id="date"
                  value={formData.date}
                  onChange={handleChange}
                  className={`w-full p-2 border rounded-lg 
                    ${inputBgColor} ${inputTextColor} ${inputBorderColor}
                    focus:ring-1 focus:ring-blue-500 focus:border-blue-500`}
                  max={today} // Prevent future dates
                  required
                />
                <p className="text-xs mt-1 text-gray-500">
                  Cannot be future date
                </p>
              </div>

              <div>
                <label htmlFor="time" className="block font-medium mb-1 text-sm flex items-center">
                  <FaClock className="mr-1 text-blue-500" />
                  Time <span className="text-red-500">*</span>
                </label>
                <input
                  type="time"
                  name="time"
                  id="time"
                  value={formData.time}
                  onChange={handleChange}
                  className={`w-full p-2 border rounded-lg 
                    ${inputBgColor} ${inputTextColor} ${inputBorderColor}
                    focus:ring-1 focus:ring-blue-500 focus:border-blue-500`}
                  required
                />
              </div>
            </div>

            <div className="flex justify-center">
              <button
                type="button"
                onClick={setCurrentDateTime}
                className={`text-xs flex items-center px-3 py-1.5 rounded-lg
                  ${isDarkMode ? 'bg-blue-800 text-blue-200 hover:bg-blue-700' : 'bg-blue-100 text-blue-700 hover:bg-blue-200'}`}
              >
                <FaClock className="mr-1.5" /> Set Current Date & Time
              </button>
            </div>
            
            <div>
              <label htmlFor="description" className="block font-medium mb-1 text-sm">
                Description <span className="text-red-500">*</span>
              </label>
              <textarea
                name="description"
                id="description"
                value={formData.description}
                onChange={handleChange}
                rows="3"
                className={`w-full p-2 border rounded-lg resize-none
                  ${inputBgColor} ${inputTextColor} ${inputBorderColor} ${inputPlaceholderColor}
                  focus:ring-2 focus:ring-blue-500 focus:border-blue-500`}
                placeholder="Please provide detailed information about the incident"
                required
              ></textarea>
              <p className={`text-xs mt-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                {formData.description.length}/1000 characters
              </p>
            </div>

            {/* Move location fields from step 3 to here */}
            <div>
              <label htmlFor="location" className="block font-medium mb-2 text-sm flex items-center">
                <FaMapMarkerAlt className="mr-1.5 text-red-500" />
                Location <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  name="location"
                  id="location"
                  value={formData.location}
                  onChange={handleChange}
                  className={`w-full p-2 border rounded-lg 
                    ${inputBgColor} ${inputTextColor} ${inputBorderColor} ${inputPlaceholderColor}
                    ${locationError ? "border-red-500" : ""}
                    focus:ring-1 focus:ring-blue-500 focus:border-blue-500`}
                  placeholder="Enter the incident location or use the map below"
                  required
                />
                <button
                  type="button"
                  onClick={setCurrentLocation}
                  disabled={locationLoading}
                  className={`absolute right-2 top-1/2 transform -translate-y-1/2 text-xs px-2 py-1 rounded
                    ${isDarkMode ? 'bg-blue-800 text-blue-200 hover:bg-blue-700' : 'bg-blue-100 text-blue-700 hover:bg-blue-200'}
                    ${locationLoading ? 'opacity-70 cursor-wait' : ''}`}
                >
                  {locationLoading ? (
                    <><FaSpinner className="inline mr-1 animate-spin" /> Getting...</>
                  ) : (
                    <><FaMapMarkerAlt className="inline mr-1" /> Use Current</>
                  )}
                </button>
              </div>
              {locationError && (
                <p className="mt-1 text-sm text-red-500">{locationError}</p>
              )}
              
              {/* Map Toggle Button */}
              <div className="mt-3 flex justify-center">
                <button
                  type="button"
                  onClick={toggleMapVisibility}
                  className={`flex items-center justify-center px-3 py-1.5 rounded-lg text-sm transition-colors
                    ${isDarkMode 
                      ? 'bg-blue-800 hover:bg-blue-700 text-white' 
                      : 'bg-blue-600 hover:bg-blue-700 text-white'
                    }`}
                >
                  <FaMapPin className="mr-1.5" />
                  {showMap ? "Hide Map" : "Mark on Map"}
                </button>
              </div>
              
              {/* Conditionally render the map */}
              {showMap && (
                <div className="mt-3">
                  <label className="block font-medium mb-1 text-sm flex items-center">
                    <FaMapPin className="mr-1.5 text-blue-500" />
                    Select Location <span className="text-xs text-gray-500 ml-1">(Click within San Agustin area)</span>
                  </label>
                  <div className={`border ${isDarkMode ? 'border-gray-700' : 'border-gray-300'} rounded-lg overflow-hidden h-[300px] relative`}>
                    {loadingPolygons ? (
                      <div className="h-full flex items-center justify-center bg-gray-100 dark:bg-gray-800">
                        <FaSpinner className="animate-spin text-xl text-blue-500 mr-2" />
                        <span className="text-sm">Loading map data...</span>
                      </div>
                    ) : (
                      <MapContainer
                        center={calculateCenterCoordinates()}
                        zoom={15}
                        style={{ height: "100%", width: "100%" }}
                        scrollWheelZoom={true}
                        className={isDarkMode ? 'dark-map' : ''}
                      >
                        <TileLayer
                          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        />
                        
                        {getSanAgustinPolygon().coordinates.length > 0 && (
                          <Polygon
                            positions={getSanAgustinPolygon().coordinates.map(coord => [coord.lat, coord.lng])}
                            pathOptions={{
                              color: getSanAgustinPolygon().color,
                              fillColor: getSanAgustinPolygon().color,
                              fillOpacity: 0.2,
                              weight: 2
                            }}
                          />
                        )}
                        
                        {markerPosition && (
                          <Marker position={markerPosition}></Marker>
                        )}
                        
                        <MapClickHandler />
                        <MapBoundsAdjuster />
                      </MapContainer>
                    )}
                    
                    {/* Map instructions overlay */}
                    <div className={`absolute bottom-0 left-0 right-0 ${
                      isDarkMode ? 'bg-gray-800 bg-opacity-70' : 'bg-white bg-opacity-70'
                    } p-1.5 text-xs text-center`}>
                      Click anywhere within the highlighted area to set incident location
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div>
              <label htmlFor="locationNote" className="block font-medium mb-1 text-sm">
                Additional Location Details
              </label>
              <textarea
                name="locationNote"
                id="locationNote"
                value={formData.locationNote}
                onChange={handleChange}
                rows="2"
                className={`w-full p-2 border rounded-lg resize-none
                  ${inputBgColor} ${inputTextColor} ${inputBorderColor} ${inputPlaceholderColor}
                  focus:ring-1 focus:ring-blue-500 focus:border-blue-500`}
                placeholder="Landmarks, building name, floor, etc."
              ></textarea>
            </div>
          </motion.div>
        );

      case 3:
        return (
          <motion.div
            key="step3"
            custom={1}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ type: "tween", ease: "easeInOut", duration: 0.3 }}
            className="space-y-4"
          >
            {/* Report Summary - Expanded summary since this is now purely a review step */}
            <div>
              <h3 className="text-lg font-semibold mb-3">Report Summary</h3>
              
              {/* Add resident information card with the same design as step 1 */}
              {residentVerified && residentInfo && (
                <motion.div
                  initial={{ opacity: 1 }}
                  animate={{ opacity: 1 }}
                  className={`border ${isDarkMode ? 'border-gray-700' : 'border-gray-300'} rounded-lg overflow-hidden mb-4`}
                >
                  <div className={`${isDarkMode ? 'bg-blue-900' : 'bg-blue-100'} p-2 flex items-center`}>
                    <FaIdCard className={`mr-2 ${isDarkMode ? 'text-blue-300' : 'text-blue-600'}`} />
                    <h3 className={`font-semibold ${isDarkMode ? 'text-blue-100' : 'text-blue-700'} text-sm`}>Resident Information</h3>
                  </div>
                  
                  <div className="p-3 flex flex-col md:flex-row">
                    <div className="w-full md:w-1/4 mb-3 md:mb-0">
                      <div className="w-16 h-16 rounded-full overflow-hidden mx-auto border-2 border-blue-500">
                        <img 
                          src={residentInfo.profilePicture || '/default-avatar.png'}
                          alt={`${residentInfo.firstName}'s profile`}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.target.src = '/default-avatar.png';
                          }}
                        />
                      </div>
                      <div className="mt-2 text-center">
                        <p className={`font-semibold text-sm ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>{residentInfo.residentId}</p>
                      </div>
                    </div>
                    
                    <div className="w-full md:w-3/4 space-y-1">
                      <div>
                        <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Full Name</p>
                        <p className="font-medium text-base">{`${residentInfo.firstName} ${residentInfo.middleName || ''} ${residentInfo.lastName}`}</p>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Contact</p>
                          <p className="font-medium text-sm">{residentInfo.contactNumber || 'Not provided'}</p>
                        </div>
                        <div>
                          <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Email</p>
                          <p className="font-medium text-sm truncate">{residentInfo.email || 'Not provided'}</p>
                        </div>
                      </div>
                      
                      {/* Add new details - age and gender */}
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Age</p>
                          <p className="font-medium text-sm">{residentInfo.age || 'Not provided'} years</p>
                        </div>
                        <div>
                          <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Gender</p>
                          <p className="font-medium text-sm">{residentInfo.gender || 'Not provided'}</p>
                        </div>
                      </div>
                      
                      {/* Add address */}
                      <div>
                        <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Address</p>
                        <p className="font-medium text-sm">{residentInfo.address || 'Not provided'}</p>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
              
              <div className={`p-4 rounded-lg mb-4 ${isDarkMode ? 'bg-gray-700' : 'bg-gray-100'} text-sm`}>
                <h4 className="font-medium mb-2">Incident Information</h4>
                <div className="space-y-2">
                  <p className="flex justify-between">
                    <span className="font-medium">Type:</span>
                    <span className="text-right">{formData.type === "Other" ? `${formData.otherType}` : formData.type}</span>
                  </p>
                  <p className="flex justify-between">
                    <span className="font-medium">Date & Time:</span>
                    <span className="text-right">{formData.date} at {formData.time}</span>
                  </p>
                  <p className="flex flex-col">
                    <span className="font-medium">Description:</span>
                    <span className="mt-1 break-words text-justify">{formData.description}</span>
                  </p>
                </div>
              </div>
              
              <div className={`p-4 rounded-lg mb-4 ${isDarkMode ? 'bg-gray-700' : 'bg-gray-100'} text-sm`}>
                <h4 className="font-medium mb-2">Location Details</h4>
                <div className="space-y-2">
                  <p className="flex flex-col">
                    <span className="font-medium">Location:</span>
                    <span className="mt-1 break-words">{formData.location || 'Not specified'}</span>
                  </p>
                  {formData.locationNote && (
                    <p className="flex flex-col">
                      <span className="font-medium">Additional Details:</span>
                      <span className="mt-1 break-words">{formData.locationNote}</span>
                    </p>
                  )}
                </div>
              </div>
              
              <div className={`p-3 rounded-lg ${isDarkMode ? 'bg-blue-900/20 text-blue-200' : 'bg-blue-50 text-blue-700'} text-xs`}>
                <div className="flex items-start">
                  <FaInfoCircle className="mt-0.5 mr-1.5 flex-shrink-0" />
                  <p>
                    Please review all details before submitting. You will need to verify your PIN to complete submission.
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        );

      default:
        return null;
    }
  };

  // Add PIN Verification Modal component
  const renderPinVerificationModal = () => {
    if (!showPasswordVerification) return null;
    
    return (
      <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black bg-opacity-60">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          className={`${bgColor} ${textColor} rounded-xl shadow-2xl p-6 max-w-md w-full mx-auto m-4`}
        >
          <h3 className="text-xl font-semibold mb-4 flex items-center text-center">
            <FaLock className="mr-2 text-blue-500" /> PIN Verification Required
          </h3>
          
          <p className="mb-4 text-center">Please enter your PIN to submit this incident report.</p>
          
          <div className="mb-4">
            <label htmlFor="password" className="block font-medium mb-2">
              Resident PIN <span className="text-red-500">*</span>
            </label>
            <input
              type="password"
              id="password"
              name="password"
              ref={pinInputRef}
              value={formData.password}
              onChange={handleChange}
              className={`w-full p-4 text-center text-lg font-mono border rounded-lg ${inputBgColor} ${inputBorderColor} focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                passwordError ? "border-red-500" : ""
              }`}
              placeholder="Enter your PIN"
              autoFocus
              maxLength="20"
            />
            {passwordError && (
              <p className="mt-1 text-sm text-red-500 text-center">{passwordError}</p>
            )}
          </div>
          
          <div className={`p-3 mb-4 rounded-lg ${isDarkMode ? 'bg-yellow-800/30 text-yellow-200' : 'bg-yellow-50 text-yellow-700'} text-sm`}>
            <div className="flex items-start">
              <FaInfoCircle className="mt-1 mr-2 flex-shrink-0" />
              <p>
                <strong>Note:</strong> If you haven't changed your PIN, your default PIN is your initials followed by @ and your birthday (DDMMYY). <br />
                Example: For "Juan Miguel Cruz" born on May 12, 1995 → JMC@120595
              </p>
            </div>
          </div>
          
          {/* Add the "Forgot PIN" link here */}
          <div className="text-center mb-4">
            <button
              type="button"
              onClick={() => {
                setShowPasswordVerification(false);
                setShowForgotPinModal(true);
              }}
              className={`text-sm ${isDarkMode ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-500'}`}
            >
              Forgot your PIN or haven't changed it?
            </button>
          </div>
          
          <div className="flex justify-center space-x-3">
            <button
              type="button"
              onClick={() => setShowPasswordVerification(false)}
              className={`px-5 py-2 rounded-lg border ${isDarkMode 
                ? 'border-gray-600 text-gray-300 hover:bg-gray-700' 
                : 'border-gray-300 text-gray-700 hover:bg-gray-100'}`}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={confirmSubmit}
              className={`px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium flex items-center`}
            >
              <FaLock className="mr-2" /> Verify & Submit
            </button>
          </div>
        </motion.div>
      </div>
    );
  };

  // Function to handle PIN reset request
  const handlePinResetRequest = async (e) => {
    e.preventDefault();
    
    if (!forgotPinEmail) {
      toast.error('Please enter your email address');
      return;
    }
    
    setIsRequestingReset(true);
    
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/residents/reset-pin-request`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          email: forgotPinEmail,
          residentId: formData.residentId 
        }),
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setResetRequestSuccess(true);
        toast.success('PIN reset instructions sent to your email');
        setTimeout(() => {
          setShowForgotPinModal(false);
        }, 3000); // Close the modal after 3 seconds
      } else {
        // Display the error message from the server
        toast.error(data.message || 'Failed to process your request');
        // Don't close the modal so the user can try again
      }
    } catch (error) {
      console.error('Error requesting PIN reset:', error);
      toast.error('An error occurred. Please try again later.');
    } finally {
      setIsRequestingReset(false);
    }
  };

  // Add a function to render the forgot PIN modal
  const renderForgotPinModal = () => {
    if (!showForgotPinModal) return null;
    
    return (
      <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black bg-opacity-70">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          className={`${bgColor} ${textColor} rounded-lg shadow-2xl p-5 max-w-md w-full mx-auto m-4`}
        >
          {!resetRequestSuccess ? (
            <>
              <h3 className="text-lg font-semibold mb-3 text-center">
                Reset Your PIN
              </h3>
              
              <p className="mb-3 text-sm text-center">
                Enter your email address associated with your resident account, and we'll send you instructions to reset your PIN.
              </p>
              
              <form onSubmit={handlePinResetRequest}>
                <div className="mb-4">
                  <label htmlFor="forgotPinEmail" className="block font-medium mb-1 text-sm">
                    Email Address <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <FaEnvelope className={`h-5 w-5 ${isDarkMode ? 'text-blue-400' : 'text-blue-500'}`} />
                    </div>
                    <input
                      type="email"
                      id="forgotPinEmail"
                      value={forgotPinEmail}
                      onChange={(e) => setForgotPinEmail(e.target.value)}
                      className={`w-full pl-10 p-2.5 border rounded-lg ${inputBgColor} ${inputBorderColor} focus:ring-2 focus:ring-blue-500 focus:border-blue-500`}
                      placeholder="Enter your email address"
                      required
                    />
                  </div>
                </div>
                
                <div className="flex justify-center space-x-3">
                  <button
                    type="button"
                    onClick={() => setShowForgotPinModal(false)}
                    className={`px-3 py-1.5 rounded-lg border text-sm ${isDarkMode 
                      ? 'border-gray-600 text-gray-300 hover:bg-gray-700' 
                      : 'border-gray-300 text-gray-700 hover:bg-gray-100'}`}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isRequestingReset}
                    className={`px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium flex items-center text-sm ${
                      isRequestingReset ? 'opacity-70 cursor-not-allowed' : ''
                    }`}
                  >
                    {isRequestingReset ? (
                      <>
                        <FaSpinner className="animate-spin mr-1.5" />
                        Sending...
                      </>
                    ) : (
                      'Send Reset Link'
                    )}
                  </button>
                </div>
              </form>
            </>
          ) : (
            <div className="text-center">
              <FaCheckCircle className={`mx-auto h-10 w-10 ${isDarkMode ? 'text-green-400' : 'text-green-500'} mb-3`} />
              <h3 className="text-lg font-bold mb-2">Reset Link Sent</h3>
              <p className="mb-3 text-sm">
                We've sent PIN reset instructions to your email. Please check your inbox and follow the instructions to reset your PIN.
              </p>
              <p className="text-xs mb-4 italic">
                If you don't see the email, please check your spam folder.
              </p>
              <button
                onClick={() => {
                  setShowForgotPinModal(false);
                  setResetRequestSuccess(false);
                }}
                className={`px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium text-sm`}
              >
                Close
              </button>
            </div>
          )}
        </motion.div>
      </div>
    );
  };

  // Ticket confirmation screen
if (showTicketConfirmation) {
  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      className={`${bgColor} ${textColor} rounded-xl shadow-2xl overflow-hidden max-w-xl w-full mx-auto max-h-[90vh] flex flex-col`}
    >
      <div className="bg-gradient-to-r from-green-600 to-green-700 text-white p-6 flex-shrink-0">
        <div className="flex items-center justify-center mb-4">
          <div className="h-16 w-16 rounded-full bg-white flex items-center justify-center">
            <FaCheck className="text-green-600 text-3xl" />
          </div>
        </div>
        <h2 className="text-2xl font-bold text-center">Report Submitted Successfully!</h2>
      </div>
      
      <div className="p-6 overflow-y-auto">
        <div className="mb-6">
          <div className="flex items-center justify-center mb-4">
            <FaTicketAlt className="text-2xl mr-2 text-green-500" />
            <h3 className="text-xl font-semibold">Your Ticket Reference</h3>
          </div>
          
          <div className={`p-4 mb-4 rounded-lg ${isDarkMode ? 'bg-yellow-800/30 border border-yellow-700' : 'bg-yellow-50 border border-yellow-200'}`}>
            <div className="flex items-start">
              <FaInfoCircle className={`mt-1 mr-2 ${isDarkMode ? 'text-yellow-400' : 'text-yellow-500'}`} />
              <p className={`text-sm ${isDarkMode ? 'text-yellow-200' : 'text-yellow-700'}`}>
                <strong>Important:</strong> Please save or take a screenshot of this ticket information. 
                You'll need this ticket ID to check the status of your report.
              </p>
            </div>
          </div>
          
          <div className={`p-4 mb-3 rounded-lg text-center ${isDarkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
            <p className="text-2xl font-mono font-bold select-all cursor-pointer" 
               onClick={() => {
                 navigator.clipboard.writeText(ticketInfo.id);
                 toast.success("Ticket ID copied to clipboard!", {
                  position: "top-center",
                  autoClose: 3000
                });
               }}
               title="Click to copy">{ticketInfo.id}</p>
          </div>
          
          <div className="flex justify-center mb-6 space-x-2">
            <button 
              onClick={() => {
                navigator.clipboard.writeText(ticketInfo.id);
                toast.success("Ticket ID copied to clipboard!", {
                  position: "top-center",
                  autoClose: 3000
                });
              }}
              className={`text-sm px-3 py-1.5 rounded flex items-center ${
                isDarkMode 
                  ? 'bg-gray-700 hover:bg-gray-600 text-white' 
                  : 'bg-gray-200 hover:bg-gray-300 text-gray-800'
              }`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 00-2 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2z" />
              </svg>
              Copy Ticket
            </button>
            
            <button 
              onClick={() => {
                // Create content for the text file
                const content = `Incident Report Ticket
---------------------
Ticket ID: ${ticketInfo.id}
Type: ${ticketInfo.type}
Location: ${ticketInfo.location}
Date & Time: ${ticketInfo.date} at ${ticketInfo.time}
Submitted: ${ticketInfo.submittedAt}`;
                
                // Create a Blob with the content
                const blob = new Blob([content], { type: 'text/plain' });
                // Create a URL for the Blob
                const url = URL.createObjectURL(blob);
                
                // Create an anchor element to trigger download
                const a = document.createElement('a');
                a.href = url;
                a.download = `Ticket-${ticketInfo.id}.txt`;
                document.body.appendChild(a);
                a.click();
                
                // Clean up
                setTimeout(() => {
                  document.body.removeChild(a);
                  URL.revokeObjectURL(url);
                }, 0);
                
                // Show success message with explicit options
                toast.success("Ticket information downloaded successfully!", {
                  position: "top-center",
                  autoClose: 3000
                });
              }}
              className={`text-sm px-3 py-1.5 rounded flex items-center ${
                isDarkMode 
                  ? 'bg-gray-700 hover:bg-gray-600 text-white' 
                  : 'bg-gray-200 hover:bg-gray-300 text-gray-800'
              }`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Download as .txt
            </button>
          </div>
        </div>
        
        <div className={`rounded-lg ${isDarkMode ? 'bg-gray-700' : 'bg-gray-100'} p-4 mb-6`}>
          <h4 className="font-medium mb-3">Incident Details:</h4>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className={isDarkMode ? 'text-gray-400' : 'text-gray-500'}>Type:</span>
              <span className="font-medium">{ticketInfo.type}</span>
            </div>
            <div className="flex justify-between">
              <span className={isDarkMode ? 'text-gray-400' : 'text-gray-500'}>Location:</span>
              <span className="font-medium truncate max-w-[70%] text-right">{ticketInfo.location}</span>
            </div>
            <div className="flex justify-between">
              <span className={isDarkMode ? 'text-gray-400' : 'text-gray-500'}>Date & Time:</span>
              <span className="font-medium">{ticketInfo.date} at {ticketInfo.time}</span>
            </div>
            <div className="flex justify-between">
              <span className={isDarkMode ? 'text-gray-400' : 'text-gray-500'}>Submitted At:</span>
              <span className="font-medium">{ticketInfo.submittedAt}</span>
            </div>
          </div>
        </div>
        
        <div className={`p-4 rounded-lg mb-6 ${isDarkMode ? 'bg-blue-900/20 text-blue-200' : 'bg-blue-50 text-blue-700'}`}>
          <div className="flex items-start">
            <FaInfoCircle className="mt-1 mr-2 flex-shrink-0" />
            <div>
              <p className="text-sm">
                Thank you for reporting this incident. Our team will review your submission and take appropriate action.
              </p>
              <p className="text-sm mt-2">
                You can check the status of your report anytime using the "Track Ticket Status" feature with your ticket ID.
              </p>
            </div>
          </div>
        </div>
        
        <div className="flex justify-center">
          <motion.button
            onClick={onClose}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className={`px-6 py-3 rounded-lg font-medium ${
              isDarkMode 
                ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                : 'bg-blue-500 hover:bg-blue-600 text-white'
            }`}
          >
            Close
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
}

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      className={`${bgColor} ${textColor} rounded-lg shadow-xl overflow-hidden max-w-lg w-full mx-auto max-h-[85vh] flex flex-col`}
    >
      <div className="relative flex-shrink-0">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white p-4">
          <div className="flex justify-between items-center mb-3">
            <h1 className="text-lg font-bold flex items-center">
              <FaExclamationTriangle className="mr-2" /> Report an Incident
            </h1>
            <button 
              onClick={onClose}
              className="text-white hover:text-gray-200 focus:outline-none"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          {/* Progress bar */}
          <div className="w-full bg-white/20 rounded-full h-2 mb-1.5">
            <div 
              className="bg-white h-2 rounded-full transition-all"
              style={{ width: `${(currentStep / totalSteps) * 100}%` }}
            ></div>
          </div>
          
          <div className="flex justify-between text-xs text-white/80">
            <span>Step {currentStep} of {totalSteps}</span>
            <span>{currentStep <= steps.length ? steps[currentStep - 1].title : "Review"}</span>
          </div>
        </div>
        
        {/* Emergency Button - Keep outside of scrollable area but make smaller */}
        <div className="px-4 pt-3 flex-shrink-0">
          <button
            type="button"
            onClick={handleEmergencyClick}
            className="w-full flex items-center justify-center bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded-lg font-medium transition-colors duration-150 text-sm"
          >
            <FaExclamationTriangle className="mr-1.5" />
            Emergency Report (Immediate Attention)
          </button>
          
          <div className="relative overflow-hidden h-5 mt-1">
            <p className="absolute text-red-500 text-xs flex items-center animate-slide-infinite whitespace-nowrap">
              <span role="img" aria-label="warning" className="mr-1">⚠️</span>
              Use this button to report an emergency situation that requires immediate attention.
            </p>
          </div>
        </div>
      </div>
      
      {/* Form Content - Scrollable area */}
      <div className="p-4 overflow-y-auto" style={{ maxHeight: "calc(85vh - 170px)" }}>
        {/* Change from form to div to prevent automatic submission */}
        <div className="space-y-4">
          <AnimatePresence initial={false} custom={currentStep}>
            {renderStepContent()}
          </AnimatePresence>
          
          {/* Updated Navigation buttons - Aligned with Cancel | Back Next layout */}
          <div className="flex justify-between pt-3 border-t border-gray-200 dark:border-gray-700">
            <button
              type="button"
              onClick={onClose}
              className={`px-3 py-1.5 rounded-lg border text-sm ${isDarkMode 
                ? 'border-gray-600 text-gray-300 hover:bg-gray-700' 
                : 'border-gray-300 text-gray-700 hover:bg-gray-100'}`}
            >
              Cancel
            </button>
            
            <div className="flex space-x-2">
              {currentStep > 1 && (
                <button
                  type="button"
                  onClick={prevStep}
                  className={`px-3 py-1.5 rounded-lg border text-sm ${isDarkMode 
                    ? 'border-gray-600 text-gray-300 hover:bg-gray-700' 
                    : 'border-gray-300 text-gray-700 hover:bg-gray-100'}`}
                >
                  Back
                </button>
              )}

              {currentStep < totalSteps ? (
                <button
                  type="button"
                  onClick={nextStep}
                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium flex items-center text-sm"
                >
                  Next <FaChevronRight className="ml-1" />
                </button>
              ) : (
                <button
                  type="button" // Change from submit to button
                  onClick={handleSubmit}
                  disabled={showPasswordVerification || submitting}
                  className={`px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium text-sm ${
                    (showPasswordVerification || submitting) ? 'opacity-75 cursor-not-allowed' : ''
                  }`}
                >
                  {submitting ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white inline" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Submitting...
                    </>
                  ) : (
                    'Submit Report'
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Add PIN verification modal */}
      <AnimatePresence>
        {showPasswordVerification && renderPinVerificationModal()}
      </AnimatePresence>

      {/* Add forgot PIN modal */}
      <AnimatePresence>
        {showForgotPinModal && renderForgotPinModal()}
      </AnimatePresence>

      <style jsx>{`
        @keyframes slide-infinite {
          0% { transform: translateX(100%); }
          100% { transform: translateX(-100%); }
        }
        .animate-slide-infinite {
          animation: slide-infinite 10s linear infinite;
        }
      `}</style>
      
      <ToastContainer 
        position="top-center"
        theme={isDarkMode ? "dark" : "light"}
      />
    </motion.div>
  );

};

export default ReportIncidents;

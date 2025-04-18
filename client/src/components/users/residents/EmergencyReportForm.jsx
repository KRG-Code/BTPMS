import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { FaTimes, FaExclamationTriangle, FaMapMarkerAlt, FaPhone, FaUser, FaInfoCircle, FaSpinner, FaTicketAlt, FaCheck, FaSearch, FaIdCard, FaCheckCircle, FaEnvelope, FaMapPin, FaLock } from "react-icons/fa";
import { useTheme } from "../../../contexts/ThemeContext";
import { MapContainer, TileLayer, Polygon, Marker, useMapEvents, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerIconShadow from "leaflet/dist/images/marker-shadow.png";

let DefaultIcon = L.icon({
  iconUrl: markerIcon,
  shadowUrl: markerIconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

const backdropVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
  exit: { opacity: 0 }
};

const modalVariants = {
  hidden: { opacity: 0, scale: 0.8 },
  visible: { 
    opacity: 1, 
    scale: 1,
    transition: { type: "spring", duration: 0.5, bounce: 0.3 }
  },
  exit: { 
    opacity: 0, 
    scale: 0.8,
    transition: { duration: 0.2 }
  }
};

const inputVariants = {
  focus: { scale: 1.02, boxShadow: "0 0 0 2px rgba(66, 153, 225, 0.5)" }
};

const EmergencyReportForm = ({ onClose }) => {
  const { isDarkMode } = useTheme();
  const [formData, setFormData] = useState({
    fullName: "",
    contactNumber: "",
    location: "",
    rawLocation: "",
    address: "",
    type: "",
    otherType: "",
    description: "",
    date: "",
    time: "",
    incidentClassification: "Emergency Incident",
    residentId: "",
    password: "",
    latitude: null,
    longitude: null,
    isInBoundary: false
  });

  const [polygons, setPolygons] = useState([]);
  const [loadingPolygons, setLoadingPolygons] = useState(false);
  const [authToken, setAuthToken] = useState(localStorage.getItem("token") || "");
  const [showMap, setShowMap] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 3;

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [locationLoading, setLocationLoading] = useState(false);
  const [showTicketConfirmation, setShowTicketConfirmation] = useState(false);
  const [ticketInfo, setTicketInfo] = useState(null);
  const [verificationStep, setVerificationStep] = useState(false);
  const [searchingResident, setSearchingResident] = useState(false);
  const [residentVerified, setResidentVerified] = useState(false);
  const [residentInfo, setResidentInfo] = useState(null);
  const [searchError, setSearchError] = useState("");
  const [markerPosition, setMarkerPosition] = useState(null);
  const [locationError, setLocationError] = useState("");
  const [locationType, setLocationType] = useState("text");
  const mapRef = useRef(null);
  const [passwordError, setPasswordError] = useState("");
  const [showPasswordVerification, setShowPasswordVerification] = useState(false);
  const pinInputRef = useRef(null);

  const [showForgotPinModal, setShowForgotPinModal] = useState(false);
  const [forgotPinEmail, setForgotPinEmail] = useState('');
  const [isRequestingReset, setIsRequestingReset] = useState(false);
  const [resetRequestSuccess, setResetRequestSuccess] = useState(false);

  const fetchPolygons = async () => {
    try {
      if (polygons.length > 0) return;
      
      setLoadingPolygons(true);
      const response = await fetch(`${process.env.REACT_APP_API_URL}/polygons/public`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch polygon data');
      }
      
      const data = await response.json();
      console.log("Fetched polygon data:", data);
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

  useEffect(() => {
    if (showMap) {
      fetchPolygons();
    }
  }, [showMap]);

  const getSanAgustinPolygon = () => {
    if (polygons.length > 0) {
      const specificPolygon = polygons.find(polygon => 
        polygon._id === "67f254b04615c73cdb3e7ee6" || 
        polygon.id === "67f254b04615c73cdb3e7ee6"
      );
      
      if (specificPolygon) {
        console.log("Found specific San Agustin polygon by ID");
        return {
          _id: specificPolygon._id,
          legend: specificPolygon.legend,
          color: "#ff0000",
          coordinates: specificPolygon.coordinates
        };
      }
      
      const sanAgustin = polygons.find(polygon => 
        polygon.legend === "San Agustin" || polygon.name === "San Agustin"
      );
      
      if (sanAgustin) {
        console.log("Found San Agustin polygon by name");
        return {
          _id: sanAgustin._id,
          legend: sanAgustin.legend || sanAgustin.name,
          color: "#ff0000",
          coordinates: sanAgustin.coordinates
        };
      }
    }
    
    console.log("No polygon found, returning default");
    return {
      _id: "",
      legend: "San Agustin",
      color: "#ff0000",
      coordinates: []
    };
  };

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

  const fetchAddressFromCoordinates = async (lat, lng) => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1`,
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
        location: data.display_name || `Location in San Agustin (${lat.toFixed(6)}, ${lng.toFixed(6)})`,
        address: data.display_name || "Location in San Agustin",
      }));
    } catch (error) {
      console.error("Error getting location details:", error);
      setFormData((prevData) => ({
        ...prevData,
        location: `Location in San Agustin (${lat.toFixed(6)}, ${lng.toFixed(6)})`,
        address: "Location in San Agustin"
      }));
    }
  };

  const MapClickHandler = () => {
    useMapEvents({
      click: (e) => {
        const { lat, lng } = e.latlng;
        const point = { lat, lng };
        
        const sanAgustinPolygon = getSanAgustinPolygon();
        const inside = isPointInPolygon(point, sanAgustinPolygon);
        
        if (inside) {
          setLocationError("");
          setMarkerPosition([lat, lng]);
          
          setFormData((prevData) => ({
            ...prevData,
            latitude: lat,
            longitude: lng,
            rawLocation: `Lat: ${lat.toFixed(6)}, Lon: ${lng.toFixed(6)}`,
            isInBoundary: true
          }));
          
          fetchAddressFromCoordinates(lat, lng);
        } else {
          toast.error("Location must be within San Agustin area. Please select a location inside the highlighted boundary.");
          setLocationError("Please select a location within San Agustin area");
        }
      },
    });
    return null;
  };

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

  const setCurrentLocation = () => {
    setLocationLoading(true);
    
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(async (position) => {
        const { latitude, longitude } = position.coords;
        const point = { lat: latitude, lng: longitude };
        const rawLocation = `Lat: ${latitude.toFixed(6)}, Lon: ${longitude.toFixed(6)}`;
        
        const sanAgustinPolygon = getSanAgustinPolygon();
        const inside = isPointInPolygon(point, sanAgustinPolygon);
        
        if (inside) {
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
              address: data.display_name || "Location in San Agustin",
              rawLocation: rawLocation,
              latitude: latitude,
              longitude: longitude,
              isInBoundary: true
            }));
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
          toast.error("Your current location is outside San Agustin area. Please select a different location within the boundary.");
          setLocationError("Your location must be within San Agustin area");
          
          setFormData(prev => ({
            ...prev,
            isInBoundary: false
          }));
        }
        setLocationLoading(false);
      }, (error) => {
        console.error("Error getting location:", error);
        toast.error("Could not access your location. Please check your device settings and permissions.");
        setLocationLoading(false);
      }, {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      });
    } else {
      toast.error("Geolocation is not supported by your browser. Please enter your location manually.");
      setLocationLoading(false);
    }
  };

  useEffect(() => {
    const style = document.createElement("style");
    style.textContent = `
      .dark-map .leaflet-tile {
        filter: brightness(0.6) invert(1) contrast(3) hue-rotate(200deg) saturate(0.3) brightness(0.7);
      }
      .dark-map .leaflet-container {
        background: #303030;
      }
    `;
    
    if (isDarkMode) {
      document.head.appendChild(style);
    }
    
    return () => {
      if (style.parentNode === document.head) {
        document.head.removeChild(style);
      }
    };
  }, [isDarkMode]);

  const bgColor = isDarkMode ? "bg-gray-900" : "bg-white";
  const textColor = isDarkMode ? "text-white" : "text-gray-800";
  const inputBgColor = isDarkMode ? "bg-gray-800" : "bg-white";
  const inputBorderColor = isDarkMode ? "border-gray-700" : "border-gray-300";
  const headerBgColor = isDarkMode ? "bg-red-900" : "bg-red-600";

  const steps = [
    {
      title: "Verify Identity",
      description: "Confirm your resident information"
    },
    {
      title: "Emergency Details",
      description: "Describe the emergency situation"
    },
    {
      title: "Location & Submit",
      description: "Specify location and review details"
    }
  ];

  const autoFillResidentInfo = (residentData) => {
    setResidentInfo(residentData);
    setResidentVerified(true);
    
    setFormData(prev => ({
      ...prev,
      fullName: `${residentData.firstName} ${residentData.lastName}`,
      contactNumber: residentData.contactNumber ? residentData.contactNumber.replace('+63', '') : '',
      email: residentData.email || '', // Ensure email is populated
    }));
    
    if (residentData.token) {
      localStorage.setItem("token", residentData.token);
      setAuthToken(residentData.token);
    }
    
    toast.success("Resident verified successfully!");
  };

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
        if (data.token) {
          localStorage.setItem("token", data.token);
          setAuthToken(data.token);
        }
        
        autoFillResidentInfo(data.resident);
        
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
    
    if (name === "date") {
      const selectedDate = new Date(value);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      if (selectedDate > today) {
        toast.error("Cannot select a future date");
        return;
      }
    }
    
    setFormData({
      ...formData,
      [name]: value,
    });
    
    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: null
      });
    }
  };

  const handleContactNumberChange = (e) => {
    const value = e.target.value.replace(/\D/g, "");
    setFormData({
      ...formData,
      contactNumber: value,
    });
    
    if (errors.contactNumber) {
      setErrors({
        ...errors,
        contactNumber: null
      });
    }
  };

  const generateTicketId = () => {
    const timestamp = new Date().getTime();
    const randomPart = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    return `ER-${timestamp.toString().slice(-6)}-${randomPart}`;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (currentStep !== totalSteps) {
      return;
    }

    if (validateForm()) {
      setShowPasswordVerification(true);
      
      setTimeout(() => {
        if (pinInputRef.current) {
          pinInputRef.current.focus();
        }
      }, 100);
    }
  };

  const confirmSubmit = async () => {
    const isPasswordValid = await verifyPassword();
    if (!isPasswordValid) {
      return;
    }
    
    // Add confirmation toast with Yes/No buttons, just like in ReportIncident.jsx
    toast.info(
      <div>
        <p>Are you sure you want to submit this emergency report?</p>
        <div className="flex justify-end space-x-2 mt-2">
          <button
            onClick={() => {
              submitEmergencyReport();
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
  };

  const submitEmergencyReport = async () => {
    setIsSubmitting(true);

    const now = new Date();
    const dateString = now.toISOString().split('T')[0];
    const timeString = now.toTimeString().split(' ')[0].slice(0, 5);

    const ticketId = generateTicketId();

    const reportData = {
      ...formData,
      type: formData.type === "Other" ? `Other: ${formData.otherType}` : formData.type,
      location: formData.rawLocation || formData.location,
      address: formData.address,
      date: dateString,
      time: timeString,
      description: formData.description || "Not provided",
      ticketId: ticketId,
      incidentClassification: "Emergency Incident"
    };

    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/incident-reports`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${authToken}`,
        },
        body: JSON.stringify(reportData),
      });

      let responseData;
      try {
        responseData = await response.json();
      } catch (e) {
        responseData = { message: "Could not parse server response" };
        console.error("Failed to parse response:", e);
      }

      if (response.ok) {
        toast.success("Emergency report submitted successfully!");

        setTicketInfo({
          id: ticketId,
          type: reportData.type,
          location: formData.location,
          contactNumber: formData.contactNumber ? `+63${formData.contactNumber}` : 'Not provided',
          fullName: formData.fullName,
          submittedAt: new Date().toLocaleString()
        });

        setShowPasswordVerification(false);
        setShowTicketConfirmation(true);
      } else {
        console.error("Server error:", responseData);
        toast.error(`Error: ${responseData.message || "Failed to submit emergency report. Please try again."}`, {
          position: "top-center",
          autoClose: 5000
        });
      }
    } catch (error) {
      console.error("Submission error:", error);
      toast.error(`Network error: ${error.message || "Failed to connect to server. Please check your connection."}`, {
        position: "top-center",
        autoClose: 5000
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const validateCurrentStep = () => {
    const newErrors = {};
    let isValid = true;

    if (currentStep === 1) {
    } else if (currentStep === 2) {
      if (!formData.fullName?.trim()) {
        newErrors.fullName = "Full Name is required";
        isValid = false;
      }
      
      if (!formData.contactNumber) {
        newErrors.contactNumber = "Contact Number is required";
        isValid = false;
      } else if (formData.contactNumber.length !== 10) {
        newErrors.contactNumber = "Contact number must be exactly 10 digits";
        isValid = false;
      }
      
      if (!formData.type) {
        newErrors.type = "Emergency Type is required";
        isValid = false;
      } else if (formData.type === "Other" && !formData.otherType?.trim()) {
        newErrors.otherType = "Please specify the emergency type";
        isValid = false;
      }
      
      if (!formData.description || formData.description.trim() === "") {
        newErrors.description = "Description is required";
        isValid = false;
      }
      
      if (!formData.location) {
        newErrors.location = "Location is required";
        isValid = false;
      }
    }
    
    setErrors(newErrors);
    
    if (!isValid) {
      const firstError = Object.values(newErrors)[0];
      toast.error(firstError);
    }
    
    return isValid;
  };

  const validateForm = () => {
    const newErrors = {};
    console.log("Validating form data:", formData);
    
    if (!formData.fullName) {
      newErrors.fullName = "Full Name is required";
    }
    
    if (!formData.contactNumber) {
      newErrors.contactNumber = "Contact Number is required";
    } else if (formData.contactNumber.length !== 10) {
      newErrors.contactNumber = "Contact number must be exactly 10 digits";
    }
    
    if (!formData.location) {
      newErrors.location = "Location is required";
    }
    
    if (!formData.type) {
      newErrors.type = "Emergency Type is required";
    } else if (formData.type === "Other" && !formData.otherType?.trim()) {
      newErrors.otherType = "Please specify the emergency type";
    }
    
    if (!formData.description || formData.description.trim() === "") {
      newErrors.description = "Description is required";
    }
    
    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) {
      console.log("Validation errors:", newErrors);
      const firstError = Object.values(newErrors)[0];
      toast.error(firstError);
      return false;
    }
    
    return true;
  };

  const nextStep = () => {
    if (validateCurrentStep()) {
      setCurrentStep(prev => Math.min(prev + 1, totalSteps));
    }
  };

  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const toggleMapVisibility = () => {
    const newMapVisibility = !showMap;
    setShowMap(newMapVisibility);
    
    if (newMapVisibility) {
      fetchPolygons();
    }
  };

  const calculateCenterCoordinates = () => {
    const sanAgustinPolygon = getSanAgustinPolygon();
    if (!sanAgustinPolygon.coordinates || !sanAgustinPolygon.coordinates.length) {
      return [14.730, 121.035];
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

  const today = new Date().toISOString().split('T')[0];

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return renderResidentVerificationStep();
      case 2:
        return renderEmergencyDetailsStep();
      case 3:
        return renderLocationAndSubmitStep();
      default:
        return null;
    }
  };

  const renderResidentVerificationStep = () => {
    return (
      <div className="space-y-4">
        <div className="mb-4">
          <label htmlFor="residentId" className="block font-medium mb-2">
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
              className={`flex-grow px-4 py-2 rounded-l-lg border ${inputBgColor} ${inputBorderColor} ${textColor} focus:outline-none focus:ring-2 focus:ring-red-500`}
            />
            <button
              onClick={verifyResidentId}
              disabled={searchingResident}
              className={`px-4 py-2 ${searchingResident ? 'bg-gray-500' : 'bg-red-600 hover:bg-red-700'} text-white rounded-r-lg flex items-center justify-center`}
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
            className={`border ${isDarkMode ? 'border-gray-700' : 'border-gray-300'} rounded-xl overflow-hidden mb-4`}
          >
            <div className={`${isDarkMode ? 'bg-red-900' : 'bg-red-100'} p-3 flex items-center`}>
              <FaIdCard className={`mr-2 ${isDarkMode ? 'text-red-300' : 'text-red-600'}`} />
              <h3 className={`font-semibold ${isDarkMode ? 'text-red-100' : 'text-red-700'}`}>Resident Information</h3>
            </div>
            
            <div className="p-4 flex flex-col md:flex-row">
              <div className="w-full md:w-1/3 mb-4 md:mb-0">
                <div className="w-24 h-24 rounded-full overflow-hidden mx-auto border-2 border-red-500">
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
                  <p className={`font-semibold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>{residentInfo.residentId}</p>
                  <div className={`text-xs inline-flex items-center px-2.5 py-0.5 rounded-full ${
                    isDarkMode ? 'bg-green-900 text-green-200' : 'bg-green-100 text-green-800'
                  }`}>
                    <FaCheckCircle className="mr-1" /> Verified
                  </div>
                </div>
              </div>
              
              <div className="w-full md:w-2/3 space-y-2">
                <div>
                  <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Full Name</p>
                  <p className="font-medium text-lg">{`${residentInfo.firstName} ${residentInfo.middleName || ''} ${residentInfo.lastName}`}</p>
                </div>
                
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Age</p>
                    <p className="font-medium">{residentInfo.age} years</p>
                  </div>
                  <div>
                    <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Gender</p>
                    <p className="font-medium">{residentInfo.gender || 'Not specified'}</p>
                  </div>
                </div>
                
                <div>
                  <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Contact</p>
                  <p className="font-medium flex items-center">
                    <FaPhone className="mr-2 text-sm" /> {residentInfo.contactNumber || 'Not provided'}
                  </p>
                </div>
                
                <div>
                  <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Email</p>
                  <p className="font-medium flex items-center">
                    <FaEnvelope className="mr-2 text-sm" /> {residentInfo.email || 'Not provided'}
                  </p>
                </div>
                
                <div>
                  <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Address</p>
                  <p className="font-medium flex items-center">
                    <FaMapMarkerAlt className="mr-2 text-sm" /> {residentInfo.address || 'Not provided'}
                  </p>
                </div>
              </div>
            </div>
            
            <div className={`p-3 ${isDarkMode ? 'bg-green-900/30 text-green-300' : 'bg-green-100 text-green-800'} flex items-center`}>
              <FaCheck className="mr-2" />
              <p className="text-sm">Resident verified successfully</p>
            </div>
          </motion.div>
        )}
        
        <div className={`p-3 rounded-lg ${isDarkMode ? 'bg-red-900/20 text-red-200' : 'bg-red-50 text-red-700'} mb-4`}>
          <div className="flex items-start">
            <FaInfoCircle className="mt-1 mr-2 flex-shrink-0" />
            <p className="text-sm">
              Verify your identity using your resident ID before submitting an emergency report. This helps responders identify and reach you.
            </p>
          </div>
        </div>
      </div>
    );
  };

  const renderEmergencyDetailsStep = () => {
    return (
      <div className="space-y-4">
        <div>
          <label htmlFor="fullName" className="block font-medium mb-1 flex items-center">
            <FaUser className="mr-2 text-red-500" /> Full Name <span className="text-red-500">*</span>
          </label>
          <motion.input
            type="text"
            id="fullName"
            name="fullName"
            value={formData.fullName}
            onChange={handleChange}
            className={`w-full p-3 border rounded-lg ${inputBgColor} ${inputBorderColor} focus:ring-2 focus:ring-red-500 focus:border-red-500 ${
              errors.fullName ? "border-red-500" : ""
            }`}
            placeholder="Your full name"
            whileFocus="focus"
            variants={inputVariants}
          />
          {errors.fullName && (
            <p className="mt-1 text-sm text-red-500">{errors.fullName}</p>
          )}
        </div>

        <div>
          <label htmlFor="contactNumber" className="block font-medium mb-1 flex items-center">
            <FaPhone className="mr-2 text-red-500" /> Contact Number <span className="text-red-500">*</span>
          </label>
          <div className="flex">
            <div className={`flex items-center justify-center px-3 border ${inputBorderColor} rounded-l-lg ${isDarkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-50 text-gray-600'}`}>
              +63
            </div>
            <motion.input
              type="text"
              id="contactNumber"
              name="contactNumber"
              value={formData.contactNumber}
              onChange={handleContactNumberChange}
              className={`w-full p-3 border rounded-r-lg ${inputBgColor} ${inputBorderColor} focus:ring-2 focus:ring-red-500 focus:border-red-500 ${
                errors.contactNumber ? "border-red-500" : ""
              }`}
              placeholder="10-digit number"
              maxLength="10"
              whileFocus="focus"
              variants={inputVariants}
            />
          </div>
          {errors.contactNumber && (
            <p className="mt-1 text-sm text-red-500">{errors.contactNumber}</p>
          )}
        </div>

        <div>
          <label htmlFor="type" className="block font-medium mb-1 flex items-center">
            <FaExclamationTriangle className="mr-2 text-red-500" /> Emergency Type <span className="text-red-500">*</span>
          </label>
          <motion.select
            id="type"
            name="type"
            value={formData.type}
            onChange={handleChange}
            className={`w-full p-3 border rounded-lg ${inputBgColor} ${inputBorderColor} focus:ring-2 focus:ring-red-500 focus:border-red-500 ${
              errors.type ? "border-red-500" : ""
            }`}
            whileFocus="focus"
            variants={inputVariants}
          >
            <option value="">Select Emergency Type</option>
            <option value="Fire">Fire</option>
            <option value="Medical Emergency">Medical Emergency</option>
            <option value="Crime in Progress">Crime in Progress</option>
            <option value="Natural Disaster">Natural Disaster</option>
            <option value="Accident">Accident</option>
            <option value="Other">Other</option>
          </motion.select>
          {errors.type && (
            <p className="mt-1 text-sm text-red-500">{errors.type}</p>
          )}

          <AnimatePresence>
            {formData.type === "Other" && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="mt-3"
              >
                <label htmlFor="otherType" className="block font-medium mb-1 text-sm">
                  Please specify emergency type <span className="text-red-500">*</span>
                </label>
                <motion.input
                  type="text"
                  id="otherType"
                  name="otherType"
                  value={formData.otherType}
                  onChange={handleChange}
                  className={`w-full p-3 border rounded-lg ${inputBgColor} ${inputBorderColor} focus:ring-2 focus:ring-red-500 focus:border-red-500 ${
                    errors.otherType ? "border-red-500" : ""
                  }`}
                  placeholder="Please specify the type of emergency"
                  whileFocus="focus"
                  variants={inputVariants}
                />
                {errors.otherType && (
                  <p className="mt-1 text-sm text-red-500">{errors.otherType}</p>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div>
          <label htmlFor="description" className="block font-medium mb-1 flex items-center">
            <FaInfoCircle className="mr-2 text-red-500" /> Emergency Description <span className="text-red-500">*</span>
          </label>
          <motion.textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            rows="3"
            className={`w-full p-3 border rounded-lg resize-none ${inputBgColor} ${inputBorderColor} focus:ring-2 focus:ring-red-500 focus:border-red-500 ${
              errors.description ? "border-red-500" : ""
            }`}
            placeholder="Please provide detailed information about the emergency situation (what happened, how many people are involved, any injuries, etc.)"
            whileFocus="focus"
            variants={inputVariants}
          />
          {errors.description && (
            <p className="mt-1 text-sm text-red-500">{errors.description}</p>
          )}
          <p className={`text-xs mt-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
            {formData.description.length}/500 characters
          </p>
        </div>

        <div>
          <label htmlFor="location" className="block font-medium mb-1 flex items-center">
            <FaMapMarkerAlt className="mr-2 text-red-500" /> Location <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <motion.input
              type="text"
              id="location"
              name="location"
              value={formData.location}
              onChange={handleChange}
              className={`w-full p-3 pr-28 border rounded-lg ${inputBgColor} ${inputBorderColor} focus:ring-2 focus:ring-red-500 focus:border-red-500 ${
                errors.location ? "border-red-500" : ""
              }`}
              placeholder="Enter location of emergency"
              whileFocus="focus"
              variants={inputVariants}
            />
            <motion.button
              type="button"
              onClick={setCurrentLocation}
              disabled={locationLoading}
              className={`absolute right-2 top-1/2 transform -translate-y-1/2 px-2 py-1 rounded-md text-xs font-medium 
                ${isDarkMode 
                  ? 'bg-red-900 hover:bg-red-800 text-red-100' 
                  : 'bg-red-100 hover:bg-red-200 text-red-700'
                } flex items-center ${locationLoading ? 'opacity-70 cursor-wait' : ''}`}
              whileHover={{ scale: locationLoading ? 1.0 : 1.05 }}
              whileTap={{ scale: locationLoading ? 1.0 : 0.95 }}
            >
              {locationLoading ? (
                <FaSpinner className="animate-spin mr-1" />
              ) : (
                <>
                  <FaMapMarkerAlt className="mr-1" />
                  Current Location
                </>
              )}
            </motion.button>
          </div>
          {errors.location && (
            <p className="mt-1 text-sm text-red-500">{errors.location}</p>
          )}
          {locationError && (
            <p className="mt-1 text-sm text-red-500">{locationError}</p>
          )}
        </div>

        <div className="flex justify-center">
          <motion.button
            type="button"
            onClick={toggleMapVisibility}
            className={`flex items-center justify-center px-4 py-2 rounded-lg transition-colors 
              ${isDarkMode 
                ? 'bg-red-800 hover:bg-red-700 text-white' 
                : 'bg-red-600 hover:bg-red-700 text-white'
              }`}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <FaMapPin className="mr-2" /> {showMap ? "Hide Map" : "Mark on Map"}
          </motion.button>
        </div>

        {showMap && (
          <div className="mt-4 border border-gray-300 dark:border-gray-700 rounded-lg overflow-hidden h-[300px]">
            <MapContainer
              center={calculateCenterCoordinates()}
              zoom={15}
              scrollWheelZoom={true}
              style={{ height: "100%", width: "100%" }}
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
          </div>
        )}

        {showMap && !authToken && !residentVerified && (
          <div className="mt-4 p-4 bg-yellow-100 dark:bg-yellow-800 border border-yellow-300 dark:border-yellow-700 rounded-lg text-center">
            <FaExclamationTriangle className="text-yellow-500 dark:text-yellow-400 text-xl inline-block mb-2" />
            <p className="text-yellow-800 dark:text-yellow-200">
              Please verify your resident account to use the map feature.
            </p>
          </div>
        )}
      </div>
    );
  };

  const renderLocationAndSubmitStep = () => {
    return (
      <div className="space-y-4">
        <div className="mt-2 border-t pt-4 border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold mb-4">Emergency Report Summary</h3>
          
          {residentVerified && residentInfo && (
            <motion.div
              initial={{ opacity: 1 }}
              animate={{ opacity: 1 }}
              className={`border ${isDarkMode ? 'border-gray-700' : 'border-gray-300'} rounded-xl overflow-hidden mb-4`}
            >
              <div className={`${isDarkMode ? 'bg-red-900' : 'bg-red-100'} p-3 flex items-center`}>
                <FaIdCard className={`mr-2 ${isDarkMode ? 'text-red-300' : 'text-red-600'}`} />
                <h3 className={`font-semibold ${isDarkMode ? 'text-red-100' : 'text-red-700'}`}>Resident Information</h3>
              </div>
              
              <div className="p-4 flex flex-col md:flex-row">
                <div className="w-full md:w-1/3 mb-4 md:mb-0">
                  <div className="w-24 h-24 rounded-full overflow-hidden mx-auto border-2 border-red-500">
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
                    <p className={`font-semibold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>{residentInfo.residentId}</p>
                    <div className={`text-xs inline-flex items-center px-2.5 py-0.5 rounded-full ${
                      isDarkMode ? 'bg-green-900 text-green-200' : 'bg-green-100 text-green-800'
                    }`}>
                      <FaCheckCircle className="mr-1" /> Verified
                    </div>
                  </div>
                </div>
                
                <div className="w-full md:w-2/3 space-y-2">
                  <div>
                    <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Full Name</p>
                    <p className="font-medium text-lg">{`${residentInfo.firstName} ${residentInfo.middleName || ''} ${residentInfo.lastName}`}</p>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Age</p>
                      <p className="font-medium">{residentInfo.age} years</p>
                    </div>
                    <div>
                      <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Gender</p>
                      <p className="font-medium">{residentInfo.gender || 'Not specified'}</p>
                    </div>
                  </div>
                  
                  <div>
                    <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Contact</p>
                    <p className="font-medium flex items-center">
                      <FaPhone className="mr-2 text-sm" /> {residentInfo.contactNumber || 'Not provided'}
                    </p>
                  </div>
                  
                  <div>
                    <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Email</p>
                    <p className="font-medium flex items-center">
                      <FaEnvelope className="mr-2 text-sm" /> {residentInfo.email || 'Not provided'}
                    </p>
                  </div>
                  
                  <div>
                    <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Address</p>
                    <p className="font-medium flex items-center">
                      <FaMapMarkerAlt className="mr-2 text-sm" /> {residentInfo.address || 'Not provided'}
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
          
          <div className={`p-4 rounded-lg mb-4 ${isDarkMode ? 'bg-gray-700' : 'bg-red-50'}`}>
            <h4 className="font-medium mb-2 flex items-center">
              <FaExclamationTriangle className="mr-2 text-red-500" /> Emergency Details
            </h4>
            <div className="grid grid-cols-1 gap-x-4 gap-y-2 text-sm">
              <div>
                <p className={isDarkMode ? 'text-gray-400' : 'text-gray-500'}>Emergency Type:</p>
                <p className="font-medium">
                  {formData.type === "Other" ? `${formData.type}: ${formData.otherType}` : formData.type || 'Not specified'}
                </p>
              </div>
              <div>
                <p className={isDarkMode ? 'text-gray-400' : 'text-gray-500'}>Location:</p>
                <p className="font-medium break-words">{formData.location || 'Not specified'}</p>
              </div>
              <div>
                <p className={isDarkMode ? 'text-gray-400' : 'text-gray-500'}>Description:</p>
                <p className="font-medium break-words">{formData.description || 'Not provided'}</p>
              </div>
              <div>
                <p className={isDarkMode ? 'text-gray-400' : 'text-gray-500'}>Date & Time:</p>
                <p className="font-medium">{new Date().toLocaleString()}</p>
                <p className="text-xs mt-1 italic text-red-400">
                  Emergency reports are timestamped with the current date and time
                </p>
              </div>
            </div>
          </div>

          <div className={`p-3 rounded-lg ${isDarkMode ? 'bg-red-900/20 text-red-200' : 'bg-red-50 text-red-700'} mb-6`}>
            <div className="flex items-start">
              <FaInfoCircle className="mt-1 mr-2 flex-shrink-0" />
              <p className="text-sm">
                Please review the information above carefully. Emergency reports receive priority response.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  };

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
        // Keep the modal open so the user can correct their email
      }
    } catch (error) {
      console.error('Error requesting PIN reset:', error);
      toast.error('An error occurred. Please try again later.');
    } finally {
      setIsRequestingReset(false);
    }
  };

  const renderPinVerificationModal = () => {
    if (!showPasswordVerification) return null;
    
    return (
      <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black bg-opacity-60">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          className={`${bgColor} ${textColor} rounded-lg shadow-2xl p-4 max-w-sm w-full mx-auto m-4`}
        >
          <h3 className="text-base font-semibold mb-3 flex items-center text-center">
            <FaLock className="mr-2 text-red-500" /> PIN Verification Required
          </h3>
          
          <p className="mb-3 text-sm text-center">Please enter your PIN to submit this emergency report.</p>
          
          <div className="mb-3">
            <label htmlFor="password" className="block font-medium mb-1 text-sm">
              Resident PIN <span className="text-red-500">*</span>
            </label>
            <input
              type="password"
              id="password"
              name="password"
              ref={pinInputRef}
              value={formData.password}
              onChange={handleChange}
              className={`w-full p-3 text-center text-base font-mono border rounded-lg ${inputBgColor} ${inputBorderColor} focus:ring-2 focus:ring-red-500 focus:border-red-500 ${
                passwordError ? "border-red-500" : ""
              }`}
              placeholder="Enter your PIN"
              autoFocus
              maxLength="20"
            />
            {passwordError && (
              <p className="mt-1 text-xs text-red-500 text-center">{passwordError}</p>
            )}
          </div>
          
          <div className={`p-2 mb-3 rounded-lg ${isDarkMode ? 'bg-yellow-800/30 text-yellow-200' : 'bg-yellow-50 text-yellow-700'} text-xs`}>
            <div className="flex items-start">
              <FaInfoCircle className="mt-0.5 mr-1.5 flex-shrink-0" />
              <p>
                <strong>Note:</strong> If you haven't changed your PIN, your default PIN is your initials followed by @ and your birthday (DDMMYY). <br />
                Example: For "Juan Miguel Cruz" born on May 12, 1995 → JMC@120595
              </p>
            </div>
          </div>
          
          <div className="text-center mb-3">
            <button
              type="button"
              onClick={() => setShowForgotPinModal(true)}
              className={`text-xs ${isDarkMode ? 'text-red-400 hover:text-red-300' : 'text-red-600 hover:text-red-700'}`}
            >
              Forgot your PIN or haven't changed it?
            </button>
          </div>
          
          <div className="flex justify-center space-x-3">
            <button
              type="button"
              onClick={() => setShowPasswordVerification(false)}
              className={`px-4 py-1.5 rounded-lg border text-sm ${isDarkMode 
                ? 'border-gray-600 text-gray-300 hover:bg-gray-700' 
                : 'border-gray-300 text-gray-700 hover:bg-gray-100'}`}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={confirmSubmit}
              className={`px-4 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium flex items-center text-sm`}
            >
              <FaLock className="mr-1.5" /> Verify & Submit
            </button>
          </div>
        </motion.div>
      </div>
    );
  };

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
                      <FaEnvelope className={`h-5 w-5 ${isDarkMode ? 'text-red-400' : 'text-red-500'}`} />
                    </div>
                    <input
                      type="email"
                      id="forgotPinEmail"
                      value={forgotPinEmail}
                      onChange={(e) => setForgotPinEmail(e.target.value)}
                      className={`w-full pl-10 p-2.5 border rounded-lg ${inputBgColor} ${inputBorderColor} focus:ring-2 focus:ring-red-500 focus:border-red-500`}
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
                    className={`px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium flex items-center text-sm ${
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
                className={`px-4 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium text-sm`}
              >
                Close
              </button>
            </div>
          )}
        </motion.div>
      </div>
    );
  };

  const renderTicketConfirmation = () => {
    if (!showTicketConfirmation || !ticketInfo) return null;
    
    return (
      <div className="fixed inset-0 flex items-center justify-center z-[60] bg-black bg-opacity-60">
        <motion.div 
          variants={modalVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          className={`w-full max-w-lg rounded-lg shadow-2xl overflow-hidden ${bgColor} ${textColor} max-h-[85vh] flex flex-col`}
        >
          <div className="bg-gradient-to-r from-green-600 to-green-700 text-white p-6 flex-shrink-0">
            <div className="flex items-center justify-center mb-4">
              <div className="h-16 w-16 rounded-full bg-white flex items-center justify-center">
                <FaCheck className="text-green-600 text-3xl" />
              </div>
            </div>
            <h2 className="text-2xl font-bold text-center">Emergency Report Submitted!</h2>
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
                    Emergency responders will use this to identify your report.
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
                  Copy Ticket ID
                </button>
                
                <button 
                  onClick={() => {
                    const content = `Emergency Report Ticket
---------------------
Ticket ID: ${ticketInfo.id}
Type: ${ticketInfo.type}
Location: ${ticketInfo.location}
Reported by: ${ticketInfo.fullName}
Contact: ${ticketInfo.contactNumber}
Submitted: ${ticketInfo.submittedAt}`;
                    
                    const blob = new Blob([content], { type: 'text/plain' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `EmergencyTicket-${ticketInfo.id}.txt`;
                    document.body.appendChild(a);
                    a.click();
                    
                    setTimeout(() => {
                      document.body.removeChild(a);
                      URL.revokeObjectURL(url);
                    }, 0);
                    
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
              <h4 className="font-medium mb-3">Emergency Details:</h4>
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
                  <span className={isDarkMode ? 'text-gray-400' : 'text-gray-500'}>Reported By:</span>
                  <span className="font-medium">{ticketInfo.fullName}</span>
                </div>
                <div className="flex justify-between">
                  <span className={isDarkMode ? 'text-gray-400' : 'text-gray-500'}>Contact:</span>
                  <span className="font-medium">{ticketInfo.contactNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className={isDarkMode ? 'text-gray-400' : 'text-gray-500'}>Submitted At:</span>
                  <span className="font-medium">{ticketInfo.submittedAt}</span>
                </div>
              </div>
            </div>
            
            <div className={`p-4 rounded-lg ${isDarkMode ? 'bg-red-900/20 text-red-200' : 'bg-red-50 text-red-700'} mb-6`}>
              <div className="flex items-start">
                <FaExclamationTriangle className="mt-1 mr-2 flex-shrink-0" />
                <div>
                  <p className="text-sm">
                    <strong>Emergency responders have been notified.</strong> Please keep your phone available for possible contact.
                  </p>
                  <p className="text-sm mt-2">
                    For life-threatening situations, also call emergency services directly.
                  </p>
                </div>
              </div>
            </div>
            
            <div className="flex justify-center">
              <motion.button
                onClick={() => {
                  const token = localStorage.getItem('token');
                  const userId = localStorage.getItem('userId');
                  localStorage.clear();
                  if (token) localStorage.setItem('token', token);
                  if (userId) localStorage.setItem('userId', userId);

                  setShowTicketConfirmation(false);
                  onClose();
                }}
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
      </div>
    );
  };

  return (
    <motion.div
      className="fixed inset-0 flex items-center justify-center z-50 overflow-y-auto p-3"
      variants={backdropVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
    >
      {!showTicketConfirmation && (
        <motion.div 
          className={`w-full max-w-lg rounded-lg shadow-xl overflow-hidden ${bgColor} ${textColor} max-h-[85vh] flex flex-col`}
          variants={modalVariants}
        >
          <div className={`${headerBgColor} text-white p-4 relative flex-shrink-0`}>
            <div className="flex items-center gap-2">
              <FaExclamationTriangle className="text-xl" />
              <h2 className="text-lg font-bold">Emergency Report</h2>
            </div>
            <motion.button
              className="absolute top-4 right-4 text-white hover:text-gray-200 focus:outline-none"
              onClick={onClose}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              <FaTimes size={18} />
            </motion.button>
            <p className="text-xs text-white/80 mt-1">
              Step {currentStep} of {totalSteps}
            </p>
            <p className="text-xs text-white/80 mt-0.5">
              {steps[currentStep - 1].title}
            </p>
          </div>
          
          <div className="w-full flex mt-3 mb-1 px-4">
            {[1, 2, 3].map((step) => (
              <div key={step} className="flex-1 flex items-center">
                <div 
                  className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold
                    ${currentStep === step 
                      ? 'bg-white text-red-600' 
                      : currentStep > step 
                        ? 'bg-green-500 text-white' 
                        : 'bg-white/30 text-white'
                    }`}
                >
                  {step}
                </div>
                {step < 3 && (
                  <div 
                    className={`flex-1 h-1 mx-1 
                      ${currentStep > step 
                        ? 'bg-green-500' 
                        : 'bg-white/30'
                      }`}
                  ></div>
                )}
              </div>
            ))}
          </div>

          {currentStep > 1 && residentVerified && (
            <div className={`px-4 py-2 ${isDarkMode ? 'bg-blue-900/30' : 'bg-blue-50'} flex items-center flex-shrink-0 text-xs`}>
              <FaUser className={`mr-1.5 ${isDarkMode ? 'text-blue-300' : 'text-blue-600'}`} />
              <div>
                <p className={`${isDarkMode ? 'text-blue-300' : 'text-blue-700'}`}>
                  Reporting as: <span className="font-medium">{formData.fullName}</span>
                </p>
                <p className={`${isDarkMode ? 'text-blue-200' : 'text-blue-600'} text-xs`}>
                  {residentInfo?.residentId}
                </p>
              </div>
            </div>
          )}
          
          <div className="p-4 overflow-y-auto" style={{ maxHeight: "calc(85vh - 180px)" }}>
            <div className="space-y-3">
              {renderStepContent()}
              
              <div className="flex justify-between space-x-2 pt-3 mt-3 border-t border-gray-200 dark:border-gray-700">
                {currentStep > 1 ? (
                  <motion.button
                    type="button"
                    onClick={prevStep}
                    className={`px-3 py-1.5 rounded-lg font-medium text-sm
                      ${isDarkMode 
                        ? 'bg-gray-700 hover:bg-gray-600 text-white' 
                        : 'bg-gray-200 hover:bg-gray-300 text-gray-800'
                      }`}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    Back
                  </motion.button>
                ) : (
                  <motion.button
                    type="button"
                    onClick={onClose}
                    className={`px-3 py-1.5 rounded-lg font-medium text-sm
                      ${isDarkMode 
                        ? 'bg-gray-700 hover:bg-gray-600 text-white' 
                        : 'bg-gray-200 hover:bg-gray-300 text-gray-800'
                      }`}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    Cancel
                  </motion.button>
                )}
                
                {currentStep < totalSteps ? (
                  <motion.button
                    type="button"
                    onClick={nextStep}
                    className={`px-4 py-1.5 rounded-lg font-medium text-sm
                      ${isDarkMode 
                        ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                        : 'bg-blue-600 hover:bg-blue-700 text-white'
                      }`}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    Next
                  </motion.button>
                ) : (
                  <motion.button
                    type="button"
                    onClick={(e) => handleSubmit(e)}
                    className={`px-4 py-1.5 rounded-lg font-medium flex items-center justify-center text-sm
                      ${isDarkMode 
                        ? 'bg-red-700 hover:bg-red-800 text-white' 
                        : 'bg-red-600 hover:bg-red-700 text-white'
                      } ${isSubmitting ? 'opacity-70 cursor-not-allowed' : ''}`}
                    disabled={isSubmitting || showPasswordVerification}
                    whileHover={!(isSubmitting || showPasswordVerification) ? { scale: 1.02 } : {}}
                    whileTap={!(isSubmitting || showPasswordVerification) ? { scale: 0.98 } : {}}
                  >
                    {isSubmitting ? (
                      <>
                        <FaSpinner className="animate-spin mr-1.5" />
                        Submitting...
                      </>
                    ) : (
                      'Submit Report'
                    )}
                  </motion.button>
                )}
              </div>
            </div>
          </div>

          <div className={`px-4 py-2 ${isDarkMode ? 'bg-red-900/20' : 'bg-red-50'} text-center text-xs ${isDarkMode ? 'text-red-200' : 'text-red-600'} flex-shrink-0`}>
            <div className="relative overflow-hidden h-5">
              <p className="absolute text-center flex items-center animate-slide-infinite whitespace-nowrap">
                <span role="img" aria-label="warning" className="mr-1">⚠️</span>
                For life-threatening emergencies, please also call emergency services directly.
              </p>
            </div>
          </div>
        </motion.div>
      )}
      
      <AnimatePresence>
        {showPasswordVerification && renderPinVerificationModal()}
      </AnimatePresence>
      
      <AnimatePresence>
        {showForgotPinModal && renderForgotPinModal()}
      </AnimatePresence>
      
      {renderTicketConfirmation()}

      <style jsx="true">{`
        @keyframes slide-infinite {
          0% { transform: translateX(100%); }
          100% { transform: translateX(-100%); }
        }
        .animate-slide-infinite {
          animation: slide-infinite 15s linear infinite;
        }
      `}</style>

      <ToastContainer 
        position="top-center"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop={true}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme={isDarkMode ? "dark" : "light"}
      />
    </motion.div>
  );
};

export default EmergencyReportForm;
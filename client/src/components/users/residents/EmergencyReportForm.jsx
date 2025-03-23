import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { FaTimes, FaExclamationTriangle, FaMapMarkerAlt, FaPhone, FaUser, FaInfoCircle, FaSpinner, FaTicketAlt, FaCheck } from "react-icons/fa";
import { useTheme } from "../../../contexts/ThemeContext";

// Animation variants
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
    address: "", // Add address field
    type: "",
    otherType: "", // New field for custom type
    description: "N/A",
    date: "",
    time: "",
    incidentClassification: "Emergency Incident",
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [locationLoading, setLocationLoading] = useState(false);
  const [showTicketConfirmation, setShowTicketConfirmation] = useState(false);
  const [ticketInfo, setTicketInfo] = useState(null);

  // Theme-aware styling
  const bgColor = isDarkMode ? "bg-gray-900" : "bg-white";
  const textColor = isDarkMode ? "text-white" : "text-gray-800";
  const inputBgColor = isDarkMode ? "bg-gray-800" : "bg-white";
  const inputBorderColor = isDarkMode ? "border-gray-700" : "border-gray-300";
  const headerBgColor = isDarkMode ? "bg-red-900" : "bg-red-600";

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
    
    // Clear error when user types
    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: null
      });
    }
  };

  const handleContactNumberChange = (e) => {
    const value = e.target.value.replace(/\D/g, ""); // Remove non-numeric characters
    setFormData({
      ...formData,
      contactNumber: value,
    });
    
    // Clear error when user types
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
    return `ER-${timestamp.toString().slice(-6)}-${randomPart}`; // ER for Emergency Reports
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (validateForm()) {
      toast.info(
        <div className="text-center">
          <p className="font-medium mb-3">Submit emergency report?</p>
          <div className="flex justify-center space-x-3">
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                submitEmergencyReport();
                toast.dismiss();
              }}
              className={`px-4 py-2 rounded-md ${isDarkMode ? 'bg-green-700 hover:bg-green-800' : 'bg-green-600 hover:bg-green-700'} text-white font-medium`}
            >
              Yes, Submit
            </motion.button>
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => toast.dismiss()}
              className={`px-4 py-2 rounded-md ${isDarkMode ? 'bg-gray-600 hover:bg-gray-700' : 'bg-gray-500 hover:bg-gray-600'} text-white font-medium`}
            >
              Cancel
            </motion.button>
          </div>
        </div>,
        { 
          autoClose: false,
          closeOnClick: false,
          draggable: false,
          className: isDarkMode ? "bg-gray-800 text-white" : ""
        }
      );
    }
  };

  const submitEmergencyReport = async () => {
    setIsSubmitting(true);
    
    const now = new Date();
    const dateString = now.toISOString().split('T')[0]; // Get current date in YYYY-MM-DD format
    const timeString = now.toTimeString().split(' ')[0].slice(0, 5); // Get current time in HH:mm format

    // Generate a ticket ID for the emergency report
    const ticketId = generateTicketId();

    const reportData = {
      ...formData,
      // If "Other" is selected, use the otherType value as the actual type
      type: formData.type === "Other" ? `Other: ${formData.otherType}` : formData.type,
      location: formData.rawLocation || formData.location, // Use coordinates if available
      address: formData.address, // Include the human-readable address
      date: dateString,
      time: timeString,
      description: formData.description || "N/A", // Default to "N/A" if empty
      ticketId: ticketId // Add ticket ID to the report
    };

    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/incident-reports`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(reportData),
      });

      if (response.ok) {
        // Store ticket information and show the confirmation screen
        setTicketInfo({
          id: ticketId,
          type: reportData.type,
          location: formData.location,
          fullName: formData.fullName,
          contactNumber: formData.contactNumber ? `+63${formData.contactNumber}` : 'Not provided',
          submittedAt: new Date().toLocaleString()
        });
        setShowTicketConfirmation(true);
      } else {
        const errorData = await response.json();
        toast.error(`Error: ${errorData.message}`, {
          position: "top-center"
        });
        setIsSubmitting(false);
      }
    } catch (error) {
      toast.error("An error occurred. Please try again.", {
        position: "top-center"
      });
      setIsSubmitting(false);
    }
  };

  const setCurrentLocation = () => {
    setLocationLoading(true);
    
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(async (position) => {
        const { latitude, longitude } = position.coords;
        const rawLocation = `Lat: ${latitude}, Lon: ${longitude}`;
        
        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&addressdetails=1`
          );
          const data = await response.json();
          
          // Save both display name and address
          setFormData((prevData) => ({
            ...prevData,
            location: data.display_name, // Show friendly address to user
            address: data.display_name, // Store human-readable address
            rawLocation: rawLocation // Keep coordinates for database
          }));

          // Clear location error if it exists
          if (errors.location) {
            setErrors({
              ...errors,
              location: null
            });
          }
        } catch (error) {
          console.error("Error getting location details:", error);
          // Fallback to coordinates if reverse geocoding fails
          setFormData((prevData) => ({
            ...prevData,
            location: rawLocation,
            address: "Unknown location" // Set default address
          }));
          toast.warn("Could not get detailed location. Using coordinates instead.");
        } finally {
          setLocationLoading(false);
        }
      }, (error) => {
        console.error("Error getting location:", error);
        toast.error("Could not get current location.");
        setLocationLoading(false);
      });
    } else {
      toast.error("Geolocation is not supported by this browser.");
      setLocationLoading(false);
    }
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.fullName) newErrors.fullName = "Full Name is required";
    if (!formData.contactNumber) newErrors.contactNumber = "Contact Number is required";
    if (formData.contactNumber && (formData.contactNumber.length < 10 || formData.contactNumber.length > 10)) 
      newErrors.contactNumber = "Contact number must be exactly 10 digits";
    if (!formData.location) newErrors.location = "Location is required";
    if (!formData.type) newErrors.type = "Incident Type is required";
    
    // Check if "Other" is selected but no custom type provided
    if (formData.type === "Other" && !formData.otherType.trim()) {
      newErrors.otherType = "Please specify the incident type";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Render the ticket confirmation screen if submission was successful
  if (showTicketConfirmation) {
    return (
      <motion.div
        className="fixed inset-0 flex items-center justify-center z-50 overflow-y-auto p-4"
        variants={backdropVariants}
        initial="hidden"
        animate="visible"
        exit="exit"
      >
        <motion.div 
          className={`w-full max-w-md rounded-xl shadow-2xl overflow-hidden ${bgColor} ${textColor}`}
          variants={modalVariants}
        >
          <div className="bg-gradient-to-r from-red-700 to-red-600 text-white p-6 text-center">
            <div className="flex justify-center mb-4">
              <div className="h-16 w-16 rounded-full bg-white flex items-center justify-center">
                <FaCheck className="text-red-600 text-3xl" />
              </div>
            </div>
            <h2 className="text-2xl font-bold">Emergency Report Submitted</h2>
            <p className="mt-2 text-sm">Our team has been notified and will respond as soon as possible</p>
          </div>
          
          <div className="p-6">
            <div className="mb-6">
              <div className="flex items-center justify-center mb-4">
                <FaTicketAlt className="text-2xl mr-2 text-red-500" />
                <h3 className="text-xl font-semibold">Your Emergency Ticket</h3>
              </div>
              <p className="text-center mb-4">
                Please keep this information for your reference.
              </p>
              <div className={`p-4 mb-6 rounded-lg text-center ${isDarkMode ? 'bg-gray-700 border border-gray-600' : 'bg-gray-100 border border-gray-200'}`}>
                <p className="text-2xl font-mono font-bold tracking-wider">{ticketInfo.id}</p>
              </div>
            </div>
            
            <div className={`rounded-lg ${isDarkMode ? 'bg-gray-700' : 'bg-gray-100'} p-4 mb-6`}>
              <h4 className="font-medium mb-3">Report Details:</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className={isDarkMode ? 'text-gray-400' : 'text-gray-500'}>Name:</span>
                  <span className="font-medium">{ticketInfo.fullName}</span>
                </div>
                <div className="flex justify-between">
                  <span className={isDarkMode ? 'text-gray-400' : 'text-gray-500'}>Contact:</span>
                  <span className="font-medium">{ticketInfo.contactNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className={isDarkMode ? 'text-gray-400' : 'text-gray-500'}>Type:</span>
                  <span className="font-medium max-w-[60%] text-right">{ticketInfo.type}</span>
                </div>
                <div className="flex justify-between">
                  <span className={isDarkMode ? 'text-gray-400' : 'text-gray-500'}>Location:</span>
                  <span className="font-medium truncate max-w-[60%] text-right">{ticketInfo.location}</span>
                </div>
                <div className="flex justify-between">
                  <span className={isDarkMode ? 'text-gray-400' : 'text-gray-500'}>Submitted At:</span>
                  <span className="font-medium">{ticketInfo.submittedAt}</span>
                </div>
              </div>
            </div>
            
            <div className={`p-4 rounded-lg ${isDarkMode ? 'bg-red-900/20 text-red-200' : 'bg-red-50 text-red-700'} mb-6`}>
              <div className="flex items-start">
                <FaExclamationTriangle className="mt-1 mr-3 flex-shrink-0" />
                <p className="text-sm">
                  For life-threatening emergencies, please also contact emergency services directly.
                </p>
              </div>
            </div>
            
            <div className="flex justify-center">
              <motion.button
                onClick={onClose}
                className={`px-6 py-3 rounded-lg font-medium 
                  ${isDarkMode 
                    ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                    : 'bg-blue-500 hover:bg-blue-600 text-white'
                  }`}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Close
              </motion.button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    );
  }

  return (
    <motion.div
      className="fixed inset-0 flex items-center justify-center z-50 overflow-y-auto p-4"
      variants={backdropVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
    >
      <motion.div 
        className={`w-full max-w-md rounded-xl shadow-2xl overflow-hidden ${bgColor} ${textColor} max-h-[90vh] flex flex-col`}
        variants={modalVariants}
      >
        {/* Modal Header - Fixed */}
        <div className={`${headerBgColor} text-white p-5 relative flex-shrink-0`}>
          <div className="flex items-center gap-3">
            <FaExclamationTriangle className="text-2xl" />
            <h2 className="text-xl font-bold">Emergency Report</h2>
          </div>
          <motion.button
            className="absolute top-5 right-5 text-white hover:text-gray-200 focus:outline-none"
            onClick={onClose}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            <FaTimes size={20} />
          </motion.button>
          <p className="mt-2 text-sm text-red-100">This form is for immediate assistance in emergency situations only.</p>
        </div>
        
        {/* Emergency Alert - Fixed */}
        <div className={`${isDarkMode ? 'bg-red-900/30' : 'bg-red-50'} p-4 border-l-4 border-red-500 flex-shrink-0`}>
          <div className="flex">
            <div className="flex-shrink-0">
              <FaInfoCircle className={`h-5 w-5 ${isDarkMode ? 'text-red-300' : 'text-red-500'}`} />
            </div>
            <div className="ml-3">
              <h3 className={`text-sm font-medium ${isDarkMode ? 'text-red-300' : 'text-red-800'}`}>
                Important
              </h3>
              <p className={`text-sm mt-1 ${isDarkMode ? 'text-red-200' : 'text-red-700'}`}>
                Submit this form only for situations requiring immediate action. Your report will be prioritized.
              </p>
            </div>
          </div>
        </div>
        
        {/* Form - Scrollable */}
        <div className="p-6 overflow-y-auto" style={{ maxHeight: "calc(90vh - 180px)" }}>
          <form onSubmit={handleSubmit} className="space-y-4">
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
                    } flex items-center`}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  {locationLoading ? (
                    <FaSpinner className="animate-spin mr-1" />
                  ) : (
                    <FaMapMarkerAlt className="mr-1" />
                  )}
                  Current Location
                </motion.button>
              </div>
              {errors.location && (
                <p className="mt-1 text-sm text-red-500">{errors.location}</p>
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
              
              {/* Conditional field for "Other" type */}
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
            
            {/* Submit Button */}
            <div className="flex justify-center space-x-3 pt-4">
              <motion.button
                type="submit"
                className={`px-6 py-3 rounded-lg font-bold w-full flex items-center justify-center
                  ${isDarkMode 
                    ? 'bg-red-700 hover:bg-red-800 text-white' 
                    : 'bg-red-600 hover:bg-red-700 text-white'
                  } ${isSubmitting ? 'opacity-70 cursor-not-allowed' : ''}`}
                disabled={isSubmitting}
                whileHover={!isSubmitting ? { scale: 1.02 } : {}}
                whileTap={!isSubmitting ? { scale: 0.98 } : {}}
              >
                {isSubmitting ? (
                  <>
                    <FaSpinner className="animate-spin mr-2" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <FaExclamationTriangle className="mr-2" />
                    Submit Emergency Report
                  </>
                )}
              </motion.button>
              <motion.button
                type="button"
                onClick={onClose}
                className={`px-6 py-3 rounded-lg font-medium 
                  ${isDarkMode 
                    ? 'bg-gray-700 hover:bg-gray-600 text-white' 
                    : 'bg-gray-200 hover:bg-gray-300 text-gray-800'
                  }`}
                disabled={isSubmitting}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                Cancel
              </motion.button>
            </div>
          </form>
        </div>
        
        <div className={`mt-2 p-3 ${isDarkMode ? 'bg-red-900/20' : 'bg-red-50'} text-center text-sm ${isDarkMode ? 'text-red-200' : 'text-red-600'} flex-shrink-0`}>
          <div className="relative overflow-hidden h-6">
            <p className="absolute text-center flex items-center animate-slide-infinite whitespace-nowrap">
              <span role="img" aria-label="warning" className="mr-1">⚠️</span>
              In life-threatening emergencies, please also call emergency services directly.
              <span className="mx-4">•</span>
              Your report will be prioritized for immediate response.
              <span className="mx-4">•</span>
              Help is on the way!
            </p>
          </div>
        </div>
      </motion.div>
      
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
        theme={isDarkMode ? "dark" : "light"}
      />
    </motion.div>
  );
};

export default EmergencyReportForm;
import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { FaExclamationTriangle, FaMapMarkerAlt, FaClock, FaCalendarAlt, FaInfoCircle, FaChevronRight, FaTicketAlt, FaCheck } from "react-icons/fa";
import { useTheme } from "../../../contexts/ThemeContext";

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
  });

  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 3;
  const [submitting, setSubmitting] = useState(false);
  const [showTicketConfirmation, setShowTicketConfirmation] = useState(false);
  const [ticketInfo, setTicketInfo] = useState(null);

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

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const nextStep = () => {
    if (currentStep === 1) {
      // Validate step 1
      if (!formData.type) {
        toast.error("Please select an incident type");
        return;
      }
    } else if (currentStep === 2) {
      // Validate step 2
      if (!formData.location) {
        toast.error("Please enter the location");
        return;
      }
      if (!formData.description) {
        toast.error("Please enter a description");
        return;
      }
    }
    
    setCurrentStep(prev => Math.min(prev + 1, totalSteps));
  };

  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Final validations before submission
    if (!formData.type || !formData.location || !formData.description || !formData.date || !formData.time) {
      toast.error("Please fill in all required fields");
      return;
    }

    // Check if Other is selected and otherType is empty
    if (formData.type === "Other" && !formData.otherType.trim()) {
      toast.error("Please specify the incident type");
      return;
    }

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
        address: formData.address // Include the human-readable address
      };

      // Generate a ticket ID
      const ticketId = generateTicketId();
      finalFormData.ticketId = ticketId;
      
      const response = await fetch(`${process.env.REACT_APP_API_URL}/incident-reports`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify(finalFormData),
      });

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
        setShowTicketConfirmation(true);
      } else {
        const errorData = await response.json();
        toast.error(`Error: ${errorData.message}`);
      }
    } catch (error) {
      toast.error("An error occurred. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const setCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(async (position) => {
        const { latitude, longitude } = position.coords;
        const rawLocation = `Lat: ${latitude}, Lon: ${longitude}`;
        
        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&addressdetails=1`
          );
          const data = await response.json();
          
          // Store both the display name for UI and the human-readable address for the database
          setFormData((prevData) => ({
            ...prevData,
            location: data.display_name, // Show friendly address to user
            address: data.display_name, // Store human-readable address 
            rawLocation: rawLocation // Keep coordinates for database
          }));
        } catch (error) {
          console.error("Error getting location details:", error);
          // Fallback to coordinates if reverse geocoding fails
          setFormData((prevData) => ({
            ...prevData,
            location: rawLocation,
            address: "Unknown location" // Set default address
          }));
          toast.warn("Could not get detailed location. Using coordinates instead.");
        }
      }, (error) => {
        console.error("Error getting location:", error);
        toast.error("Could not get current location.");
      });
    } else {
      toast.error("Geolocation is not supported by this browser.");
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
    setShowEmergencyForm(true);
    setShowReportModal(false);
  };

  // Step titles and descriptions
  const steps = [
    {
      number: 1,
      title: "Incident Type",
      description: "Select the type of incident you want to report"
    },
    {
      number: 2,
      title: "Location & Details",
      description: "Provide information about where and what happened"
    },
    {
      number: 3,
      title: "Date & Time",
      description: "When did this incident occur?"
    }
  ];

  // Ticket confirmation screen
  if (showTicketConfirmation) {
    return (
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        exit="exit"
        className={`${bgColor} ${textColor} rounded-xl shadow-2xl overflow-hidden max-w-xl w-full mx-auto`}
      >
        <div className="bg-gradient-to-r from-green-600 to-green-700 text-white p-6">
          <div className="flex items-center justify-center mb-4">
            <div className="h-16 w-16 rounded-full bg-white flex items-center justify-center">
              <FaCheck className="text-green-600 text-3xl" />
            </div>
          </div>
          <h2 className="text-2xl font-bold text-center">Report Submitted Successfully!</h2>
        </div>
        
        <div className="p-6">
          <div className="mb-6">
            <div className="flex items-center justify-center mb-4">
              <FaTicketAlt className="text-2xl mr-2 text-green-500" />
              <h3 className="text-xl font-semibold">Your Ticket Reference</h3>
            </div>
            <p className="text-center mb-4">
              Keep this information for your reference. You can use this ID to follow up on your report.
            </p>
            <div className={`p-4 mb-6 rounded-lg text-center ${isDarkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
              <p className="text-2xl font-mono font-bold">{ticketInfo.id}</p>
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
          
          <p className={`text-sm text-center mb-6 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            Thank you for reporting this incident. Our team will review your submission and take appropriate action.
          </p>
          
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
      className={`${bgColor} ${textColor} rounded-xl shadow-2xl overflow-hidden max-w-xl w-full mx-auto`}
    >
      <div className="relative">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white p-6">
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-2xl font-bold flex items-center">
              <FaExclamationTriangle className="mr-2" /> Report an Incident
            </h1>
            <button 
              onClick={onClose}
              className="text-white hover:text-gray-200 focus:outline-none"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          {/* Progress bar */}
          <div className="w-full bg-white/20 rounded-full h-2.5 mb-2">
            <div 
              className="bg-white h-2.5 rounded-full transition-all"
              style={{ width: `${(currentStep / totalSteps) * 100}%` }}
            ></div>
          </div>
          
          <div className="flex justify-between text-xs text-white/80">
            <span>Step {currentStep} of {totalSteps}</span>
            <span>{steps[currentStep-1].title}</span>
          </div>
        </div>
        
        {/* Emergency Button */}
        <div className="px-6 pt-4">
          <button
            type="button"
            onClick={handleEmergencyClick}
            className="w-full flex items-center justify-center bg-red-600 hover:bg-red-700 text-white px-4 py-3 rounded-lg font-medium transition-colors duration-150"
          >
            <FaExclamationTriangle className="mr-2" />
            Emergency Report (Immediate Attention)
          </button>
          
          <div className="relative overflow-hidden h-6 mt-2">
            <p className="absolute text-red-500 text-sm flex items-center animate-slide-infinite whitespace-nowrap">
              <span role="img" aria-label="warning" className="mr-2">⚠️</span>
              Use this button to report an emergency situation that requires immediate attention.
              If the situation does not require immediate action, please use the form below.
            </p>
          </div>
        </div>
        
        {/* Form Content */}
        <div className="p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <AnimatePresence initial={false} custom={currentStep}>
              {currentStep === 1 && (
                <motion.div
                  key="step1"
                  custom={1}
                  variants={slideVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{ type: "tween", ease: "easeInOut", duration: 0.3 }}
                  className="space-y-4"
                >
                  <div>
                    <label htmlFor="type" className="block font-medium mb-2">
                      Incident Type <span className="text-red-500">*</span>
                    </label>
                    <select
                      name="type"
                      id="type"
                      value={formData.type}
                      onChange={handleChange}
                      className={`w-full p-3 border rounded-lg 
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
                    
                    {/* Conditional input field for "Other" type */}
                    <AnimatePresence>
                      {formData.type === "Other" && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.3 }}
                          className="mt-3"
                        >
                          <label htmlFor="otherType" className="block font-medium mb-2 text-sm">
                            Please specify incident type <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="text"
                            id="otherType"
                            name="otherType"
                            value={formData.otherType}
                            onChange={handleChange}
                            className={`w-full p-3 border rounded-lg 
                              ${inputBgColor} ${inputTextColor} ${inputBorderColor} ${inputPlaceholderColor}
                              focus:ring-2 focus:ring-blue-500 focus:border-blue-500`}
                            placeholder="Please specify the incident type"
                          />
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                  
                  <div className="bg-blue-50 dark:bg-blue-900/30 rounded-lg p-4">
                    <div className="flex items-start">
                      <div className="flex-shrink-0">
                        <FaInfoCircle className="h-5 w-5 text-blue-500" />
                      </div>
                      <div className="ml-3">
                        <h3 className="text-sm font-medium text-blue-800 dark:text-blue-300">Information:</h3>
                        <p className="text-sm text-blue-700 dark:text-blue-400">
                          Select the most appropriate category for your incident. This helps us direct your report to the right personnel.
                        </p>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {currentStep === 2 && (
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
                  <div>
                    <label htmlFor="location" className="block font-medium mb-2 flex items-center">
                      <FaMapMarkerAlt className="mr-2 text-red-500" />
                      Location <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        name="location"
                        id="location"
                        value={formData.location}
                        onChange={handleChange}
                        className={`w-full p-3 border rounded-lg 
                          ${inputBgColor} ${inputTextColor} ${inputBorderColor} ${inputPlaceholderColor}
                          focus:ring-2 focus:ring-blue-500 focus:border-blue-500`}
                        placeholder="Enter the incident location"
                        required
                      />
                      <button
                        type="button"
                        onClick={setCurrentLocation}
                        className={`absolute right-2 top-1/2 transform -translate-y-1/2 text-sm px-2 py-1 rounded
                          ${isDarkMode ? 'bg-blue-800 text-blue-200 hover:bg-blue-700' : 'bg-blue-100 text-blue-700 hover:bg-blue-200'}`}
                      >
                        <FaMapMarkerAlt className="inline mr-1" /> Use Current
                      </button>
                    </div>
                  </div>

                  <div>
                    <label htmlFor="locationNote" className="block font-medium mb-2">
                      Additional Location Details
                    </label>
                    <textarea
                      name="locationNote"
                      id="locationNote"
                      value={formData.locationNote}
                      onChange={handleChange}
                      rows="2"
                      className={`w-full p-3 border rounded-lg resize-none
                        ${inputBgColor} ${inputTextColor} ${inputBorderColor} ${inputPlaceholderColor}
                        focus:ring-2 focus:ring-blue-500 focus:border-blue-500`}
                      placeholder="Landmarks, building name, floor, etc."
                    ></textarea>
                  </div>

                  <div>
                    <label htmlFor="description" className="block font-medium mb-2">
                      Description <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      name="description"
                      id="description"
                      value={formData.description}
                      onChange={handleChange}
                      rows="3"
                      className={`w-full p-3 border rounded-lg resize-none
                        ${inputBgColor} ${inputTextColor} ${inputBorderColor} ${inputPlaceholderColor}
                        focus:ring-2 focus:ring-blue-500 focus:border-blue-500`}
                      placeholder="Please provide detailed information about the incident"
                      required
                    ></textarea>
                    <p className={`text-xs mt-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                      {formData.description.length}/1000 characters
                    </p>
                  </div>
                </motion.div>
              )}

              {currentStep === 3 && (
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
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="date" className="block font-medium mb-2 flex items-center">
                        <FaCalendarAlt className="mr-2 text-blue-500" />
                        Date <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="date"
                        name="date"
                        id="date"
                        value={formData.date}
                        onChange={handleChange}
                        className={`w-full p-3 border rounded-lg 
                          ${inputBgColor} ${inputTextColor} ${inputBorderColor}
                          focus:ring-2 focus:ring-blue-500 focus:border-blue-500`}
                        required
                      />
                    </div>

                    <div>
                      <label htmlFor="time" className="block font-medium mb-2 flex items-center">
                        <FaClock className="mr-2 text-blue-500" />
                        Time <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="time"
                        name="time"
                        id="time"
                        value={formData.time}
                        onChange={handleChange}
                        className={`w-full p-3 border rounded-lg 
                          ${inputBgColor} ${inputTextColor} ${inputBorderColor}
                          focus:ring-2 focus:ring-blue-500 focus:border-blue-500`}
                        required
                      />
                    </div>
                  </div>

                  <div className="flex justify-center">
                    <button
                      type="button"
                      onClick={setCurrentDateTime}
                      className={`text-sm flex items-center px-4 py-2 rounded-lg
                        ${isDarkMode ? 'bg-blue-800 text-blue-200 hover:bg-blue-700' : 'bg-blue-100 text-blue-700 hover:bg-blue-200'}`}
                    >
                      <FaClock className="mr-2" /> Set Current Date & Time
                    </button>
                  </div>
                  
                  <div className="mt-4">
                    <h3 className="font-medium mb-3">Report Summary:</h3>
                    <div className={`p-4 rounded-lg ${isDarkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>
                          <p className={isDarkMode ? 'text-gray-400' : 'text-gray-500'}>Incident Type:</p>
                          <p className="font-medium">{formData.type || 'Not specified'}</p>
                        </div>
                        <div>
                          <p className={isDarkMode ? 'text-gray-400' : 'text-gray-500'}>Location:</p>
                          <p className="font-medium truncate">{formData.location || 'Not specified'}</p>
                        </div>
                        <div className="col-span-2">
                          <p className={isDarkMode ? 'text-gray-400' : 'text-gray-500'}>Date & Time:</p>
                          <p className="font-medium">
                            {formData.date && formData.time 
                              ? `${formData.date} at ${formData.time}` 
                              : 'Not specified'}
                          </p>
                        </div>
                        <div className="col-span-2">
                          <p className={isDarkMode ? 'text-gray-400' : 'text-gray-500'}>Description:</p>
                          <p className="font-medium">{formData.description || 'Not provided'}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
            
            {/* Navigation buttons */}
            <div className="flex justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
              {currentStep > 1 ? (
                <button
                  type="button"
                  onClick={prevStep}
                  className={`px-4 py-2 rounded-lg border ${isDarkMode 
                    ? 'border-gray-600 text-gray-300 hover:bg-gray-700' 
                    : 'border-gray-300 text-gray-700 hover:bg-gray-100'}`}
                >
                  Back
                </button>
              ) : (
                <button
                  type="button"
                  onClick={onClose}
                  className={`px-4 py-2 rounded-lg border ${isDarkMode 
                    ? 'border-gray-600 text-gray-300 hover:bg-gray-700' 
                    : 'border-gray-300 text-gray-700 hover:bg-gray-100'}`}
                >
                  Cancel
                </button>
              )}

              {currentStep < totalSteps ? (
                <button
                  type="button"
                  onClick={nextStep}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium flex items-center"
                >
                  Next <FaChevronRight className="ml-1" />
                </button>
              ) : (
                <button
                  type="submit"
                  className={`px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium ${submitting ? 'opacity-75 cursor-not-allowed' : ''}`}
                  disabled={submitting}
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
          </form>
        </div>
      </div>

      <style>
        {`
          @keyframes slide-infinite {
            0% { transform: translateX(100%); }
            100% { transform: translateX(-100%); }
          }
          .animate-slide-infinite {
            animation: slide-infinite 10s linear infinite;
          }
        `}
      </style>
      
      <ToastContainer 
        position="top-center"
        theme={isDarkMode ? "dark" : "light"}
      />
    </motion.div>
  );
};

export default ReportIncidents;

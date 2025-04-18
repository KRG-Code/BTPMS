import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FaSearch, FaTicketAlt, FaSpinner, FaClipboardCheck, FaUserClock, FaTimesCircle, FaCheckCircle, FaClock, FaMapMarkerAlt, FaCalendarAlt, FaStar, FaComment, FaUpload, FaFileAlt } from "react-icons/fa";
import { useTheme } from "../../../contexts/ThemeContext";
import { toast } from "react-toastify";
import { v4 as uuidv4 } from 'uuid'; // Import UUID for visitor ID

const TicketLookup = ({ onClose }) => {
  const { isDarkMode } = useTheme();
  const [ticketId, setTicketId] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [ticketData, setTicketData] = useState(null);
  const [error, setError] = useState(null);
  const [isFileUploading, setIsFileUploading] = useState(false); // New state for file upload
  const fileInputRef = useRef(null); // Reference for file input
  
  // Add states for rating system
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState("");
  const [isSubmittingRating, setIsSubmittingRating] = useState(false);
  const [showRatingForm, setShowRatingForm] = useState(true);
  const [ratingSubmitted, setRatingSubmitted] = useState(false);
  const [hasSubmittedRating, setHasSubmittedRating] = useState(false);
  
  // Add visitorId like in TanodCard
  const [visitorId, setVisitorId] = useState("");

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

  // Theme-aware styling
  const bgColor = isDarkMode ? "bg-gray-800" : "bg-white";
  const textColor = isDarkMode ? "text-white" : "text-gray-800";
  const inputBgColor = isDarkMode ? "bg-gray-700" : "bg-white";
  const inputBorderColor = isDarkMode ? "border-gray-600" : "border-gray-300";
  const cardBgColor = isDarkMode ? "bg-gray-700" : "bg-gray-100";

  // Generate or retrieve visitor ID on component mount (like in TanodCard)
  useEffect(() => {
    // Get existing visitor ID from localStorage or create new one
    const storedVisitorId = localStorage.getItem("visitorId");
    if (!storedVisitorId) {
      const newVisitorId = uuidv4();
      localStorage.setItem("visitorId", newVisitorId);
      setVisitorId(newVisitorId);
    } else {
      setVisitorId(storedVisitorId);
    }
  }, []);

  // Function to handle file upload and extract ticket ID
  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Check if file is text file
    if (!file.type.match('text/plain') && !file.name.endsWith('.txt')) {
      toast.error("Please upload a .txt file");
      return;
    }

    setIsFileUploading(true);
    setError(null);

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target.result;
        
        // Try to extract ticket ID from content
        const ticketIdMatch = content.match(/Ticket ID: ([A-Z0-9-]+)/i) || 
                              content.match(/Ticket[\s-]*[Rr]eference:?\s*([A-Z0-9-]+)/i) ||
                              content.match(/Ticket:?\s*([A-Z0-9-]+)/i) ||
                              content.match(/ID:?\s*([A-Z0-9-]+)/i);
        
        if (ticketIdMatch && ticketIdMatch[1]) {
          const extractedTicketId = ticketIdMatch[1].trim();
          setTicketId(extractedTicketId);
          // Automatically search with the extracted ticket ID
          searchWithTicketId(extractedTicketId);
          toast.success("Ticket ID extracted from file");
        } else {
          toast.error("Could not find a valid ticket ID in the file");
        }
      } catch (error) {
        console.error("Error reading file:", error);
        toast.error("Error reading file");
      } finally {
        setIsFileUploading(false);
      }
    };

    reader.onerror = () => {
      toast.error("Error reading file");
      setIsFileUploading(false);
    };

    reader.readAsText(file);
  };

  // Modified search function to be reusable
  const searchWithTicketId = async (idToSearch) => {
    if (!idToSearch.trim()) {
      toast.error("Please enter a ticket ID");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/incident-reports/ticket/${idToSearch}`);
      
      if (!response.ok) {
        throw new Error(
          response.status === 404
            ? "Ticket not found. Please check the ID and try again."
            : "Error fetching ticket information."
        );
      }

      const data = await response.json();
      setTicketData(data);
      
      // Check if this ticket has already been rated
      if (data.status === "Resolved" && data.responder) {
        checkIfAlreadyRated(data.ticketId);
      }
    } catch (err) {
      setError(err.message);
      setTicketData(null);
    } finally {
      setIsLoading(false);
    }
  };

  // Update the original search function to use the reusable one
  const searchTicket = () => {
    searchWithTicketId(ticketId);
  };

  // Add function to check if user already rated this incident
  const checkIfAlreadyRated = async (ticketId) => {
    try {
      // First check using ticket ID as identifier
      const ticketIdentifier = `ticket-${ticketId}`;
      const response = await fetch(`${process.env.REACT_APP_API_URL}/auth/public/rating-check/${ticketIdentifier}`);
      
      if (response.ok) {
        const data = await response.json();
        if (data.hasRated) {
          setRatingSubmitted(true);
          setShowRatingForm(false);
          setHasSubmittedRating(true);
          return;
        }
        
        // If not found with ticket ID, also check with visitor ID
        if (visitorId) {
          const visitorResponse = await fetch(`${process.env.REACT_APP_API_URL}/auth/public/rating-check/visitor-${visitorId}-ticket-${ticketId}`);
          if (visitorResponse.ok) {
            const visitorData = await visitorResponse.json();
            if (visitorData.hasRated) {
              setRatingSubmitted(true);
              setShowRatingForm(false);
              setHasSubmittedRating(true);
            }
          }
        }
      }
    } catch (error) {
      console.error("Error checking rating status:", error);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "Pending":
        return <FaClock className="text-yellow-500" />;
      case "In Progress":
        return <FaUserClock className="text-blue-500" />;
      case "Resolved":
        return <FaCheckCircle className="text-green-500" />;
      case "Rejected":
        return <FaTimesCircle className="text-red-500" />;
      default:
        return <FaTicketAlt className="text-gray-500" />;
    }
  };

  const getStatusClass = (status) => {
    switch (status) {
      case "Pending":
        return isDarkMode ? "bg-yellow-900/30 text-yellow-200 border-yellow-700" : "bg-yellow-50 text-yellow-800 border-yellow-200";
      case "In Progress":
        return isDarkMode ? "bg-blue-900/30 text-blue-200 border-blue-700" : "bg-blue-50 text-blue-800 border-blue-200";
      case "Resolved":
        return isDarkMode ? "bg-green-900/30 text-green-200 border-green-700" : "bg-green-50 text-green-800 border-green-200";
      case "Rejected":
        return isDarkMode ? "bg-red-900/30 text-red-200 border-red-700" : "bg-red-50 text-red-800 border-red-200";
      default:
        return isDarkMode ? "bg-gray-700 text-gray-200" : "bg-gray-100 text-gray-800";
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  // Update rating submission function to be consistent with TanodCard
  const submitRating = async () => {
    if (rating === 0) {
      toast.error("Please select a rating");
      return;
    }

    if (!comment.trim()) {
      toast.error("Please provide feedback");
      return;
    }

    if (!ticketData.responder) {
      toast.error("Cannot identify responder to rate");
      return;
    }

    setIsSubmittingRating(true);

    try {
      // Make sure responder is a string (MongoDB ObjectId)
      const responderId = typeof ticketData.responder === 'object' && ticketData.responder._id 
        ? ticketData.responder._id 
        : ticketData.responder;
      
      // Create two identifiers - one based on ticket and one based on visitor+ticket
      const ticketIdentifier = `ticket-${ticketData.ticketId}`;
      const visitorTicketIdentifier = `visitor-${visitorId}-ticket-${ticketData.ticketId}`;

      // Submit rating using the public endpoint - same as TanodCard
      const response = await fetch(`${process.env.REACT_APP_API_URL}/auth/public/tanods/${responderId}/rate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          rating,
          comment,
          fullName: ticketData.fullName || "Anonymous",
          // Include both identifiers to prevent duplicate ratings
          identifier: ticketIdentifier,
          visitorIdentifier: visitorTicketIdentifier
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to submit rating");
      }

      const responseData = await response.json();
      
      // Check if already rated
      if (responseData.alreadyRated) {
        toast.info("You've already submitted feedback for this incident");
      } else {
        toast.success("Thank you! Your feedback has been submitted");
      }
      
      setRatingSubmitted(true);
      setShowRatingForm(false);
      setHasSubmittedRating(true);
    } catch (error) {
      console.error("Rating submission error:", error);
      toast.error("Error submitting feedback. Please try again.");
    } finally {
      setIsSubmittingRating(false);
    }
  };

  // Star rating component - Use the same styling as TanodCard
  const StarRating = () => {
    return (
      <div className="flex mb-2 justify-center">
        {[1, 2, 3, 4, 5].map((star) => (
          <motion.div
            key={star}
            whileHover={{ scale: 1.2 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => setRating(star)}
            onMouseEnter={() => setHoverRating(star)}
            onMouseLeave={() => setHoverRating(0)}
            className="cursor-pointer p-1"
          >
            <FaStar
              className={`text-2xl ${
                (hoverRating || rating) >= star
                  ? "text-yellow-500"
                  : isDarkMode
                  ? "text-gray-600"
                  : "text-gray-300"
              }`}
            />
          </motion.div>
        ))}
      </div>
    );
  };

  // Reset file input when closed
  const handleFileInputClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.value = null;
    }
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      className={`${bgColor} ${textColor} rounded-xl shadow-2xl overflow-hidden max-w-xl w-full mx-auto max-h-[90vh] flex flex-col`}
    >
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6 flex-shrink-0">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-bold flex items-center">
            <FaTicketAlt className="mr-3" /> Ticket Status Lookup
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
        <p className="text-white/80">
          Enter your ticket ID or upload your saved ticket file to check status.
        </p>
      </div>

      <div className="p-6 overflow-y-auto" style={{ maxHeight: "calc(90vh - 130px)" }}>
        <div className="mb-6">
          <label htmlFor="ticketId" className="block font-medium mb-2">
            Ticket ID
          </label>
          <div className="flex">
            <input
              type="text"
              id="ticketId"
              value={ticketId}
              onChange={(e) => setTicketId(e.target.value)}
              placeholder="Enter your ticket ID (e.g., IR-123456-7890)"
              className={`w-full p-3 border rounded-l-lg
                ${inputBgColor} ${textColor} ${inputBorderColor}
                focus:ring-2 focus:ring-blue-500 focus:border-blue-500`}
            />
            <button
              onClick={searchTicket}
              disabled={isLoading}
              className={`px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-r-lg flex items-center justify-center ${isLoading ? 'opacity-70 cursor-not-allowed' : ''}`}
            >
              {isLoading ? <FaSpinner className="animate-spin" /> : <FaSearch />}
            </button>
          </div>
          
          {/* Add file upload section */}
          <div className="mt-4">
            <p className="text-sm font-medium mb-2 flex items-center">
              <FaFileAlt className="mr-1" /> Or upload your ticket file (.txt)
            </p>
            <div className="flex items-center">
              <input
                type="file"
                accept=".txt"
                className="hidden"
                ref={fileInputRef}
                onChange={handleFileUpload}
                onClick={handleFileInputClick}
              />
              <button
                onClick={() => fileInputRef.current.click()}
                disabled={isFileUploading}
                className={`flex items-center justify-center px-4 py-2 w-full border rounded-lg ${
                  isDarkMode 
                    ? 'bg-gray-700 border-gray-600 text-gray-200 hover:bg-gray-600' 
                    : 'bg-gray-100 border-gray-300 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {isFileUploading ? (
                  <>
                    <FaSpinner className="animate-spin mr-2" />
                    Processing file...
                  </>
                ) : (
                  <>
                    <FaUpload className="mr-2" />
                    Upload ticket file
                  </>
                )}
              </button>
            </div>
            <p className={`text-xs mt-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              We'll extract the ticket ID from your saved ticket file
            </p>
          </div>
          
          {error && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-3 p-3 rounded-lg bg-red-500/10 text-red-500 border border-red-500/20"
            >
              <p>{error}</p>
            </motion.div>
          )}
        </div>

        <AnimatePresence>
          {ticketData && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className="space-y-6"
            >
              {/* Ticket Header */}
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold">{ticketData.ticketId}</h2>
                  <p className={isDarkMode ? "text-gray-400" : "text-gray-600"}>
                    {ticketData.incidentClassification}
                  </p>
                </div>
                <div className={`px-4 py-2 rounded-full border flex items-center space-x-2 ${getStatusClass(ticketData.status)}`}>
                  {getStatusIcon(ticketData.status)}
                  <span className="font-medium">{ticketData.status}</span>
                </div>
              </div>
              
              {/* Incident Details */}
              <div className={`${cardBgColor} p-4 rounded-lg space-y-3`}>
                <h3 className="font-semibold text-lg">Incident Details</h3>
                
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>Type</p>
                    <p className="font-medium">{ticketData.type}</p>
                  </div>
                  <div>
                    <p className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>Reported On</p>
                    <p className="font-medium">{formatDate(ticketData.createdAt)}</p>
                  </div>
                </div>
                
                <div>
                  <p className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>Location</p>
                  <div className="flex items-start">
                    <FaMapMarkerAlt className={`mr-1 mt-1 ${isDarkMode ? "text-gray-400" : "text-gray-500"}`} />
                    <p className="font-medium">
                      {ticketData.address || ticketData.location}
                      {ticketData.locationNote && <span className="block text-sm mt-1 italic">{ticketData.locationNote}</span>}
                    </p>
                  </div>
                </div>
                
                <div>
                  <p className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>Date & Time of Incident</p>
                  <div className="flex items-center">
                    <FaCalendarAlt className={`mr-1 ${isDarkMode ? "text-gray-400" : "text-gray-500"}`} />
                    <p className="font-medium">{ticketData.date ? new Date(ticketData.date).toLocaleDateString() : 'N/A'} at {ticketData.time}</p>
                  </div>
                </div>
                
                <div>
                  <p className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>Description</p>
                  <p className="font-medium">{ticketData.description}</p>
                </div>
              </div>
              
              {/* Status Specific Information */}
              {ticketData.status !== "Pending" && (
                <div className={`${cardBgColor} p-4 rounded-lg`}>
                  {ticketData.status === "In Progress" && (
                    <div className="space-y-3">
                      <h3 className="font-semibold text-lg">Response Information</h3>
                      <div>
                        <p className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>Responder</p>
                        <p className="font-medium">{ticketData.responderName || "Assigned Tanod"}</p>
                      </div>
                      <div>
                        <p className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>Responded On</p>
                        <p className="font-medium">{formatDate(ticketData.respondedAt)}</p>
                      </div>
                    </div>
                  )}
                  
                  {ticketData.status === "Resolved" && (
                    <div className="space-y-3">
                      <h3 className="font-semibold text-lg">Resolution Information</h3>
                      <div>
                        <p className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>Resolved By</p>
                        <p className="font-medium">{ticketData.resolvedByFullName}</p>
                      </div>
                      <div>
                        <p className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>Resolved On</p>
                        <p className="font-medium">{formatDate(ticketData.resolvedAt)}</p>
                      </div>
                      {ticketData.log && (
                        <div>
                          <p className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>Resolution Notes</p>
                          <p className="font-medium">{ticketData.log}</p>
                        </div>
                      )}
                    </div>
                  )}
                  
                  {ticketData.status === "Rejected" && (
                    <div className="space-y-3">
                      <h3 className="font-semibold text-lg">Rejection Information</h3>
                      {ticketData.log && (
                        <div>
                          <p className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>Reason for Rejection</p>
                          <p className="font-medium">{ticketData.log}</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
              
              {/* Status Timeline */}
              <div className="pt-2">
                <h3 className="font-semibold text-lg mb-3">Status Timeline</h3>
                <div className="space-y-0">
                  <div className={`ml-3 pb-6 border-l-2 ${isDarkMode ? "border-gray-600" : "border-gray-300"} relative`}>
                    <div className={`absolute w-4 h-4 rounded-full -left-[9px] border-2 ${isDarkMode ? "border-gray-800 bg-blue-400" : "border-white bg-blue-500"}`}></div>
                    <div className="ml-6">
                      <p className="font-medium">Incident Reported</p>
                      <p className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
                        {formatDate(ticketData.createdAt)}
                      </p>
                    </div>
                  </div>
                  
                  {ticketData.respondedAt && (
                    <div className={`ml-3 pb-6 border-l-2 ${isDarkMode ? "border-gray-600" : "border-gray-300"} relative`}>
                      <div className={`absolute w-4 h-4 rounded-full -left-[9px] border-2 ${isDarkMode ? "border-gray-800 bg-blue-400" : "border-white bg-blue-500"}`}></div>
                      <div className="ml-6">
                        <p className="font-medium">Response Initiated</p>
                        <p className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
                          {formatDate(ticketData.respondedAt)}
                        </p>
                        {ticketData.responderName && (
                          <p className={`text-sm ${isDarkMode ? "text-gray-300" : "text-gray-600"}`}>
                            by {ticketData.responderName}
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                  
                  {ticketData.resolvedAt && (
                    <div className={`ml-3 relative`}>
                      <div className={`absolute w-4 h-4 rounded-full -left-[9px] border-2 ${isDarkMode ? "border-gray-800 bg-green-400" : "border-white bg-green-500"}`}></div>
                      <div className="ml-6">
                        <p className="font-medium">Incident Resolved</p>
                        <p className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
                          {formatDate(ticketData.resolvedAt)}
                        </p>
                        {ticketData.resolvedByFullName && (
                          <p className={`text-sm ${isDarkMode ? "text-gray-300" : "text-gray-600"}`}>
                            by {ticketData.resolvedByFullName}
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Add Rating Section for Resolved tickets - FIXED JSX STRUCTURE */}
              {ticketData.status === "Resolved" && ticketData.responder && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className={`${cardBgColor} p-4 rounded-lg mt-6`}
                >
                  {ratingSubmitted ? (
                    <div className="text-center py-4">
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: "spring", stiffness: 200 }}
                        className="mb-4"
                      >
                        <FaCheckCircle className={`h-12 w-12 mx-auto ${isDarkMode ? "text-green-400" : "text-green-500"}`} />
                      </motion.div>
                      <h3 className="text-xl font-bold mb-2">Thank You!</h3>
                      <p className={isDarkMode ? "text-gray-300" : "text-gray-600"}>
                        {hasSubmittedRating ? "You've already provided feedback for this incident." : "Your feedback helps us improve our service."}
                      </p>
                    </div>
                  ) : showRatingForm ? (
                    <>
                      <h3 className="text-lg font-semibold mb-3 flex items-center justify-center">
                        <FaStar className={`mr-2 ${isDarkMode ? "text-yellow-400" : "text-yellow-500"}`} />
                        Rate Your Experience
                      </h3>
                      <p className={`mb-4 text-center ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>
                        Please rate the service provided by {ticketData.responderName || "the tanod"} for this incident:
                      </p>
                      
                      <StarRating />
                      
                      <div className="mb-4">
                        <label htmlFor="feedback" className="block text-sm font-medium mb-1">
                          Your Feedback
                        </label>
                        <textarea
                          id="feedback"
                          value={comment}
                          onChange={(e) => setComment(e.target.value)}
                          rows="3"
                          className={`w-full p-3 border rounded-lg ${inputBgColor} ${textColor} ${inputBorderColor} focus:ring-2 focus:ring-blue-500`}
                          placeholder="Please share your experience with the tanod who resolved your incident..."
                        />
                      </div>
                      
                      <div className="flex justify-center">
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={submitRating}
                          disabled={isSubmittingRating}
                          className={`px-4 py-2 ${isSubmittingRating ? "opacity-70" : ""} bg-green-600 hover:bg-green-700 text-white rounded-lg flex items-center`}
                        >
                          {isSubmittingRating ? (
                            <>
                              <FaSpinner className="animate-spin mr-2" />
                              Submitting...
                            </>
                          ) : (
                            <>
                              <FaStar className="mr-2" />
                              Submit Rating
                            </>
                          )}
                        </motion.button>
                      </div>
                    </>
                  ) : (
                    <div className="text-center py-4">
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setShowRatingForm(true)}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center justify-center mx-auto"
                      >
                        <FaComment className="mr-2" />
                        Rate This Response
                      </motion.button>
                    </div>
                  )}
                </motion.div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
        
        {!ticketData && !isLoading && !error && (
          <div className="text-center py-8">
            <div className="flex justify-center mb-4">
              <FaClipboardCheck className={`text-5xl ${isDarkMode ? "text-gray-600" : "text-gray-300"}`} />
            </div>
            <h3 className="text-xl font-medium mb-2">No Ticket Information</h3>
            <p className={isDarkMode ? "text-gray-400" : "text-gray-500"}>
              Enter your ticket ID above to check the status of your reported incident.
            </p>
          </div>
        )}
        
        <div className="mt-6 flex justify-center">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg"
          >
            Close
          </button>
        </div>
      </div>
    </motion.div>
  );
};

export default TicketLookup;

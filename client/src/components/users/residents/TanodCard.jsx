import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FaStar, FaStarHalfAlt, FaUserCircle, FaComment, FaTimes, FaCheckCircle } from "react-icons/fa";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { v4 as uuidv4 } from 'uuid';

// Animation variants
const modalVariants = {
  hidden: { opacity: 0, scale: 0.8 },
  visible: { 
    opacity: 1, 
    scale: 1,
    transition: { duration: 0.3, ease: "easeOut" }
  },
  exit: { 
    opacity: 0, 
    scale: 0.8, 
    transition: { duration: 0.2 }
  }
};

const backdropVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
  exit: { opacity: 0 }
};

const TanodCard = ({ tanod, isDarkMode }) => {
  const [ratings, setRatings] = useState([]);
  const [averageRating, setAverageRating] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);
  const [visitorName, setVisitorName] = useState("");
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [successAnimation, setSuccessAnimation] = useState(false);

  // Generate or retrieve visitor ID on component mount
  useEffect(() => {
    if (!localStorage.getItem("visitorId")) {
      localStorage.setItem("visitorId", uuidv4());
    }
  }, []);

  const fetchRatings = async () => {
    try {
      // The existing endpoint works without authentication
      const response = await fetch(
        `${process.env.REACT_APP_API_URL}/auth/${tanod._id}/rating`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        console.error(`Fetch error: ${response.status} ${response.statusText}`);
        throw new Error(`Network response was not ok: ${response.statusText}`);
      }

      const data = await response.json();
      
      // Sort comments by date in descending order (newest first)
      const sortedComments = data.comments.sort((a, b) => 
        new Date(b.createdAt) - new Date(a.createdAt)
      );
      
      setRatings(sortedComments);

      // Calculate the average rating
      const totalRating = data.comments.reduce((sum, rating) => sum + rating.rating, 0);
      const avgRating = data.comments.length ? totalRating / data.comments.length : 0;
      setAverageRating(Number(avgRating.toFixed(1))); // Ensure averageRating is a number
    } catch (error) {
      console.error("Error fetching ratings:", error);
    }
  };

  useEffect(() => {
    fetchRatings();
  }, [tanod._id]);

  const renderStars = () => {
    const fullStars = Math.floor(averageRating);
    const hasHalfStar = averageRating % 1 !== 0;
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);

    return (
      <>
        {[...Array(fullStars)].map((_, index) => (
          <FaStar key={`full-${index}`} className={isDarkMode ? "text-yellow-400" : "text-yellow-500"} />
        ))}
        {hasHalfStar && <FaStarHalfAlt className={isDarkMode ? "text-yellow-400" : "text-yellow-500"} />}
        {[...Array(emptyStars)].map((_, index) => (
          <FaStar key={`empty-${index}`} className={isDarkMode ? "text-gray-600" : "text-gray-300"} />
        ))}
      </>
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (rating === 0 || comment.trim() === "") {
      toast.error("Please provide both rating and comment");
      return;
    }

    // Only validate name if not anonymous
    if (!isAnonymous && !visitorName.trim()) {
      toast.error("Please provide your name or select anonymous");
      return;
    }

    setLoading(true);
    try {
      // Fix the endpoint URL to include /api/auth/ prefix
      const response = await fetch(
        `${process.env.REACT_APP_API_URL}/auth/public/tanods/${tanod._id}/rate`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ 
            rating, 
            comment,
            fullName: isAnonymous ? "Anonymous" : visitorName,
            identifier: localStorage.getItem("visitorId") // Include visitor ID for tracking
          }),
        }
      );

      if (response.ok) {
        // Show success animation
        setSuccessAnimation(true);
        
        // Reset form after delay
        setTimeout(() => {
          setIsModalOpen(false);
          setRating(0);
          setComment("");
          setVisitorName("");
          setIsAnonymous(false);
          setSuccessAnimation(false);
          
          // Refresh ratings
          fetchRatings();
          
          toast.success("Feedback submitted successfully");
        }, 1500);
      } else {
        toast.error("Failed to submit feedback");
      }
    } catch (error) {
      toast.error("An error occurred");
    } finally {
      if (!successAnimation) {
        setLoading(false);
      }
    }
  };

  return (
    <>
      <motion.div
        whileHover={{ y: -5 }}
        whileTap={{ scale: 0.98 }}
        className={`${
          isDarkMode 
            ? "bg-gray-800 border-gray-700" 
            : "bg-white border-gray-200"
        } shadow-lg rounded-xl p-6 border transition-all duration-300 hover:shadow-xl relative overflow-hidden`}
      >
        {/* Colored accent header */}
        <div className={`absolute top-0 left-0 right-0 h-2 ${
          isDarkMode ? "bg-blue-600" : "bg-blue-500"
        }`}></div>
        
        <div className="relative pt-4">
          {tanod.profilePicture ? (
            <motion.img
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              src={tanod.profilePicture}
              alt={`${tanod.firstName} ${tanod.lastName}`}
              className="w-32 h-32 rounded-full mx-auto mb-4 border-4 border-blue-100 object-cover shadow-md"
            />
          ) : (
            <motion.div 
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              className={`w-32 h-32 rounded-full mx-auto mb-4 flex items-center justify-center ${
                isDarkMode ? "bg-gray-700" : "bg-gray-100"
              }`}
            >
              <FaUserCircle className={`w-full h-full ${
                isDarkMode ? "text-gray-600" : "text-gray-400"
              }`} />
            </motion.div>
          )}
        </div>
        
        <h3 className={`text-xl font-bold text-center mb-2 ${
          isDarkMode ? "text-white" : "text-gray-800"
        }`}>
          {tanod.firstName} {tanod.lastName}
        </h3>
        
        <div className="flex justify-center items-center gap-2 mb-4">
          {renderStars()}
          <span className={`${
            isDarkMode ? "text-gray-300" : "text-gray-600"
          } font-medium`}>({averageRating})</span>
        </div>

        <div className="space-y-4">
          <div className={`${
            isDarkMode ? "bg-gray-700" : "bg-gray-50"
          } rounded-lg p-4 max-h-40 overflow-y-auto`}>
            <h4 className={`text-md font-semibold ${
              isDarkMode ? "text-gray-200" : "text-gray-700"
            } mb-2`}>
              Recent Feedback:
            </h4>
            {ratings.length > 0 ? (
              <ul className="space-y-2">
                {/* Display up to 4 most recent ratings */}
                {ratings.slice(0, 4).map((rating, index) => (
                  <li 
                    key={index} 
                    className={`text-sm ${
                      isDarkMode ? "text-gray-300 border-blue-600" : "text-gray-600 border-blue-200"
                    } border-l-2 pl-3`}
                  >
                    <p className="italic">{rating.comment}</p>
                    <div className={`flex items-center gap-2 mt-1 text-xs ${
                      isDarkMode ? "text-gray-400" : "text-gray-500"
                    }`}>
                      <span>
                        {[...Array(rating.rating)].map((_, i) => (
                          <span key={i} className="text-yellow-500">★</span>
                        ))}
                      </span>
                      <span>•</span>
                      <span>from {rating.fullName || "Anonymous"}</span>
                      <span>•</span>
                      <span>{new Date(rating.createdAt).toLocaleDateString()}</span>
                    </div>
                    
                    {/* Show ticket ID if present (from ticket-based ratings) */}
                    {rating.identifier && rating.identifier.startsWith('ticket-') && (
                      <div className={`mt-1 text-xs ${isDarkMode ? "text-blue-400" : "text-blue-600"}`}>
                        via Incident Report
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            ) : (
              <p className={`text-sm ${
                isDarkMode ? "text-gray-400" : "text-gray-500"
              }`}>
                No feedback yet. Be the first to rate!
              </p>
            )}
          </div>

          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => setIsModalOpen(true)}
            className={`w-full ${
              isDarkMode 
                ? "bg-blue-600 hover:bg-blue-500" 
                : "bg-blue-500 hover:bg-blue-600"
            } text-white py-2.5 px-4 rounded-lg transition-colors duration-300 flex items-center justify-center gap-2 shadow-md`}
          >
            <FaComment />
            Send Feedback
          </motion.button>
        </div>
      </motion.div>

      {/* Feedback Modal with AnimatePresence */}
      <AnimatePresence>
        {isModalOpen && (
          <motion.div 
            className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            variants={backdropVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            onClick={() => setIsModalOpen(false)}
          >
            <motion.div 
              className={`${
                isDarkMode ? "bg-gray-800 text-white" : "bg-white text-gray-800"
              } rounded-xl shadow-2xl overflow-hidden max-w-md w-full`}
              variants={modalVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              onClick={(e) => e.stopPropagation()}
            >
              {successAnimation ? (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="p-8 flex flex-col items-center justify-center text-center"
                >
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.2, duration: 0.5, type: "spring" }}
                    className="w-20 h-20 rounded-full bg-green-500 flex items-center justify-center mb-6"
                  >
                    <FaCheckCircle className="text-white text-4xl" />
                  </motion.div>
                  <h3 className="text-2xl font-bold mb-2">Thank You!</h3>
                  <p className={isDarkMode ? "text-gray-300" : "text-gray-600"}>
                    Your feedback has been submitted successfully.
                  </p>
                </motion.div>
              ) : (
                <>
                  {/* Header */}
                  <div className={`${
                    isDarkMode 
                      ? "bg-gradient-to-r from-blue-900 to-blue-700" 
                      : "bg-gradient-to-r from-blue-600 to-blue-500"
                  } px-6 py-4 text-white flex justify-between items-center`}>
                    <h2 className="text-xl font-bold">Rate {tanod.firstName} {tanod.lastName}</h2>
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => setIsModalOpen(false)}
                      className="text-white hover:text-gray-100"
                    >
                      <FaTimes />
                    </motion.button>
                  </div>
                  
                  <div className="p-6">
                    <form onSubmit={handleSubmit} className="space-y-6">
                      {/* Name field with anonymous option */}
                      <div>
                        <label className="block text-sm font-medium mb-2">
                          Your Name 
                          <span className={`ml-1 text-xs ${
                            isDarkMode ? "text-gray-400" : "text-gray-500"
                          }`}>
                            (optional)
                          </span>
                        </label>
                        <div className="space-y-3">
                          <input
                            type="text"
                            value={visitorName}
                            onChange={(e) => setVisitorName(e.target.value)}
                            disabled={isAnonymous}
                            className={`w-full border rounded-lg p-2.5 ${
                              isDarkMode 
                                ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400" 
                                : "bg-white border-gray-300 text-gray-900"
                            } ${isAnonymous ? "opacity-50" : ""}`}
                            placeholder="Enter your name"
                          />
                          
                          <div className="flex items-center">
                            <input
                              id="anonymous-checkbox"
                              type="checkbox"
                              checked={isAnonymous}
                              onChange={() => {
                                setIsAnonymous(!isAnonymous);
                                if (!isAnonymous) setVisitorName("");
                              }}
                              className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                            />
                            <label htmlFor="anonymous-checkbox" className={`ml-2 text-sm ${
                              isDarkMode ? "text-gray-300" : "text-gray-700"
                            }`}>
                              Submit anonymously
                            </label>
                          </div>
                        </div>
                      </div>
                      
                      {/* Rating stars */}
                      <div>
                        <label className="block text-sm font-medium mb-2">Rating</label>
                        <div className="flex gap-2">
                          {[1, 2, 3, 4, 5].map((value) => (
                            <motion.button
                              key={value}
                              type="button"
                              whileHover={{ scale: 1.2 }}
                              whileTap={{ scale: 0.9 }}
                              onClick={() => setRating(value)}
                              className={`text-2xl ${
                                value <= rating 
                                  ? isDarkMode ? 'text-yellow-400' : 'text-yellow-400'
                                  : isDarkMode ? 'text-gray-600' : 'text-gray-300'
                              } transition-colors`}
                            >
                              ★
                            </motion.button>
                          ))}
                        </div>
                      </div>
                      
                      {/* Comment field */}
                      <div>
                        <label className="block text-sm font-medium mb-2">Comment</label>
                        <textarea
                          value={comment}
                          onChange={(e) => setComment(e.target.value)}
                          className={`w-full border rounded-lg p-2.5 ${
                            isDarkMode 
                              ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400" 
                              : "bg-white border-gray-300 text-gray-900"
                          }`}
                          placeholder="Write your feedback here..."
                          rows="4"
                          required
                        />
                      </div>

                      {/* Form buttons */}
                      <div className="flex gap-2 justify-end">
                        <motion.button
                          type="button"
                          whileHover={{ scale: 1.03 }}
                          whileTap={{ scale: 0.97 }}
                          onClick={() => setIsModalOpen(false)}
                          className={`px-4 py-2 rounded-lg ${
                            isDarkMode 
                              ? "bg-gray-700 hover:bg-gray-600 text-white" 
                              : "bg-gray-200 hover:bg-gray-300 text-gray-800"
                          } transition-colors`}
                        >
                          Cancel
                        </motion.button>
                        <motion.button
                          type="submit"
                          whileHover={{ scale: 1.03 }}
                          whileTap={{ scale: 0.97 }}
                          disabled={loading}
                          className={`px-4 py-2 rounded-lg ${
                            isDarkMode 
                              ? "bg-blue-600 hover:bg-blue-700 text-white" 
                              : "bg-blue-500 hover:bg-blue-600 text-white"
                          } transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2`}
                        >
                          {loading ? (
                            <>
                              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                              </svg>
                              Submitting...
                            </>
                          ) : "Submit Feedback"}
                        </motion.button>
                      </div>
                    </form>
                  </div>
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default TanodCard;

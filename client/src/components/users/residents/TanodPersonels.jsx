import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast, ToastContainer } from "react-toastify";
import { motion, AnimatePresence } from "framer-motion";
import { FaArrowLeft, FaSearch, FaUserShield, FaStar } from "react-icons/fa";
import "react-toastify/dist/ReactToastify.css";
import TanodCard from "./TanodCard";
import { useTheme } from "../../../contexts/ThemeContext";

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: { 
    opacity: 1,
    transition: {
      when: "beforeChildren",
      staggerChildren: 0.1,
      duration: 0.5
    }
  },
  exit: {
    opacity: 0,
    transition: { duration: 0.3 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4 }
  }
};

const headerVariants = {
  hidden: { opacity: 0, y: -20 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { 
      duration: 0.6,
      ease: "easeOut"
    }
  }
};

export default function TanodPersonels() {
  const [tanods, setTanods] = useState([]);
  const [filteredTanods, setFilteredTanods] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { isDarkMode } = useTheme();

  // Fetch tanods list using public endpoint
  useEffect(() => {
    const fetchTanods = async () => {
      setLoading(true);
      try {
        // Use public endpoint that doesn't require authentication
        const response = await fetch(`${process.env.REACT_APP_API_URL}/auth/user`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        });

        if (!response.ok) {
          throw new Error("Network response was not ok");
        }

        const users = await response.json();

        if (Array.isArray(users)) {
          const tanods = users.filter((user) => user.userType === "tanod");
          setTanods(tanods);
          setFilteredTanods(tanods);
        } else {
          toast.error("Unexpected response format.");
        }
      } catch (error) {
        console.error("Error fetching tanods:", error);
        toast.error("Error fetching Tanods.");
      } finally {
        setLoading(false);
      }
    };
    fetchTanods();
  }, []);

  // Filter tanods based on search term
  useEffect(() => {
    if (searchTerm.trim() === "") {
      setFilteredTanods(tanods);
    } else {
      const filtered = tanods.filter(
        (tanod) =>
          tanod.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          tanod.lastName.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredTanods(filtered);
    }
  }, [searchTerm, tanods]);

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      exit="exit"
      variants={containerVariants}
      className={`min-h-screen ${
        isDarkMode ? "bg-gray-900" : "bg-gradient-to-r from-blue-50 to-indigo-50"
      } p-6 md:p-8`}
    >
      <ToastContainer position="top-right" theme={isDarkMode ? "dark" : "light"} />
      
      <div className="container mx-auto">
        <motion.div 
          className="flex justify-between items-center mb-8" 
          variants={headerVariants}
        >
          <motion.button
            onClick={() => navigate('/Home')}
            className={`${
              isDarkMode 
                ? "bg-gray-800 text-blue-400 hover:bg-gray-700" 
                : "bg-white text-blue-600 hover:bg-blue-50"
            } px-4 py-2 rounded-lg shadow-md flex items-center gap-2 transition-colors duration-300`}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <FaArrowLeft /> Back to Home
          </motion.button>
          
          <motion.div 
            className={`relative ${
              isDarkMode ? "text-white" : "text-gray-700"
            }`}
            whileHover={{ scale: 1.02 }}
          >
            <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search tanods..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={`pl-10 pr-4 py-2 rounded-full ${
                isDarkMode
                  ? "bg-gray-800 border-gray-700 text-white placeholder-gray-500"
                  : "bg-white border-gray-200 text-gray-800"
              } border focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none w-full md:w-64`}
            />
          </motion.div>
        </motion.div>

        <motion.div 
          className={`rounded-2xl ${
            isDarkMode ? "bg-gray-800" : "bg-white"
          } shadow-xl p-8 mb-12`}
          variants={itemVariants}
        >
          <motion.div className="flex items-center gap-3 mb-6">
            <FaUserShield className={`text-3xl ${
              isDarkMode ? "text-blue-400" : "text-blue-600"
            }`}/>
            <h1 className={`text-4xl font-bold ${
              isDarkMode ? "text-white" : "text-blue-600"
            }`}>
              Our Tanod Personnel
            </h1>
          </motion.div>

          <div className={`max-w-3xl mx-auto text-center ${
            isDarkMode ? "text-gray-300" : "text-gray-600"
          } space-y-4`}>
            <p>
              Our dedicated Tanod Personnel serve as the backbone of community safety and security. 
              These trained individuals work tirelessly to maintain peace and order in our community.
            </p>
            <p>
              Available 24/7, they respond to various situations from emergency calls to routine patrols, 
              ensuring the safety and well-being of all residents.
            </p>
            <motion.div 
              className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-8 text-center"
              variants={containerVariants}
            >
              <motion.div 
                className={`${
                  isDarkMode ? "bg-gray-700 text-gray-100" : "bg-blue-50 text-blue-800"
                } p-4 rounded-lg shadow-md`}
                whileHover={{ scale: 1.03 }}
                variants={itemVariants}
              >
                <h3 className={`font-bold ${
                  isDarkMode ? "text-blue-400" : "text-blue-600"
                } text-xl mb-2`}>24/7 Service</h3>
                <p>Round-the-clock availability for emergency response</p>
              </motion.div>
              
              <motion.div 
                className={`${
                  isDarkMode ? "bg-gray-700 text-gray-100" : "bg-blue-50 text-blue-800"
                } p-4 rounded-lg shadow-md`}
                whileHover={{ scale: 1.03 }}
                variants={itemVariants}
              >
                <h3 className={`font-bold ${
                  isDarkMode ? "text-blue-400" : "text-blue-600"
                } text-xl mb-2`}>Trained Professionals</h3>
                <p>Certified in emergency response and community safety</p>
              </motion.div>
            </motion.div>
          </div>
        </motion.div>

        <motion.div variants={containerVariants} className="mb-6">
          <div className="flex items-center gap-2 mb-4">
            <FaStar className={isDarkMode ? "text-yellow-400" : "text-yellow-500"} />
            <h2 className={`text-xl font-semibold ${
              isDarkMode ? "text-white" : "text-gray-800"
            }`}>
              Rate & Review Our Tanod Personnel
            </h2>
          </div>
          <p className={`${
            isDarkMode ? "text-gray-400" : "text-gray-600"
          } mb-8`}>
            Your feedback helps us improve our community safety services.
          </p>
        </motion.div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[...Array(8)].map((_, index) => (
              <motion.div
                key={index}
                variants={itemVariants}
                className={`rounded-xl ${
                  isDarkMode ? "bg-gray-800" : "bg-white"
                } shadow-lg h-96 animate-pulse`}
              >
                <div className="flex flex-col items-center p-6">
                  <div className={`w-32 h-32 rounded-full mb-4 ${
                    isDarkMode ? "bg-gray-700" : "bg-gray-200"
                  }`}></div>
                  <div className={`h-6 w-32 ${
                    isDarkMode ? "bg-gray-700" : "bg-gray-200"
                  } mb-3 rounded`}></div>
                  <div className={`h-4 w-24 ${
                    isDarkMode ? "bg-gray-700" : "bg-gray-200"
                  } mb-6 rounded`}></div>
                  <div className={`h-4 w-full ${
                    isDarkMode ? "bg-gray-700" : "bg-gray-200"
                  } mb-2 rounded`}></div>
                  <div className={`h-4 w-full ${
                    isDarkMode ? "bg-gray-700" : "bg-gray-200"
                  } mb-2 rounded`}></div>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <>
            {filteredTanods.length === 0 ? (
              <motion.div
                variants={itemVariants}
                className={`text-center py-16 ${
                  isDarkMode ? "bg-gray-800" : "bg-white"
                } rounded-lg shadow-md`}
              >
                <FaSearch className={`mx-auto text-5xl mb-4 ${
                  isDarkMode ? "text-gray-600" : "text-gray-400"
                }`} />
                <h3 className={`text-xl font-medium ${
                  isDarkMode ? "text-white" : "text-gray-800"
                }`}>
                  No tanod personnel found matching your search
                </h3>
                <p className={`mt-2 ${
                  isDarkMode ? "text-gray-400" : "text-gray-600"
                }`}>
                  Try a different search term or clear your search
                </p>
                <button
                  onClick={() => setSearchTerm("")}
                  className={`mt-4 px-4 py-2 rounded-lg ${
                    isDarkMode
                      ? "bg-blue-600 hover:bg-blue-700 text-white"
                      : "bg-blue-500 hover:bg-blue-600 text-white"
                  } transition-colors`}
                >
                  Clear Search
                </button>
              </motion.div>
            ) : (
              <motion.div 
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
                variants={containerVariants}
              >
                <AnimatePresence>
                  {filteredTanods.map((tanod) => (
                    <motion.div
                      key={tanod._id}
                      variants={itemVariants}
                      layout
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      transition={{ duration: 0.3 }}
                    >
                      <TanodCard tanod={tanod} isDarkMode={isDarkMode} />
                    </motion.div>
                  ))}
                </AnimatePresence>
              </motion.div>
            )}
          </>
        )}
      </div>
    </motion.div>
  );
}

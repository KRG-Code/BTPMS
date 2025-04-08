import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { FaTimes, FaLock, FaEye, FaEyeSlash } from 'react-icons/fa';
import axios from 'axios';

// Animation variants
const backdropVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
  exit: { opacity: 0 }
};

const modalVariants = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: { 
    opacity: 1,
    scale: 1,
    transition: { duration: 0.3 }
  },
  exit: { 
    opacity: 0,
    scale: 0.9,
    transition: { duration: 0.2 }
  }
};

const PasswordVerificationModal = ({ isOpen, onClose, onVerified, isDarkMode, action = "generate report" }) => {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `${process.env.REACT_APP_API_URL}/auth/verify-password`,
        { password },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      if (response.data.verified) {
        // Password is verified, proceed with the action
        onVerified();
      } else {
        setError('Incorrect password');
      }
    } catch (error) {
      console.error('Password verification error:', error);
      setError(error.response?.data?.message || 'Failed to verify password');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setPassword('');
    setError(null);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <motion.div
      className={`fixed inset-0 flex items-center justify-center z-50 p-4 ${isDarkMode ? 'bg-black' : 'bg-gray-800'} bg-opacity-70 backdrop-blur-sm`}
      variants={backdropVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
    >
      <motion.div
        className={`w-full max-w-md rounded-xl shadow-2xl overflow-hidden ${isDarkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-800'}`}
        variants={modalVariants}
        initial="hidden"
        animate="visible"
        exit="exit"
      >
        <div className={`px-6 py-4 flex justify-between items-center ${isDarkMode ? 'bg-blue-900' : 'bg-blue-600'} text-white`}>
          <h2 className="text-xl font-bold flex items-center">
            <FaLock className="mr-2" />
            Security Verification
          </h2>
          <button onClick={handleClose} className="text-white hover:text-gray-200 transition-colors">
            <FaTimes size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          <p className={`mb-4 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
            Please enter your admin password to {action}.
          </p>

          {error && (
            <div className="mb-4 p-3 rounded bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
              {error}
            </div>
          )}

          <div className="mb-4">
            <label className={`block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'} mb-2`}>
              Admin Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={`w-full pl-3 pr-10 py-2 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 ${
                  isDarkMode 
                    ? 'bg-gray-700 text-white border-gray-600' 
                    : 'bg-white text-gray-900 border-gray-300'
                }`}
                required
              />
              <button
                type="button"
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? (
                  <FaEyeSlash className={isDarkMode ? 'text-gray-400' : 'text-gray-500'} />
                ) : (
                  <FaEye className={isDarkMode ? 'text-gray-400' : 'text-gray-500'} />
                )}
              </button>
            </div>
          </div>

          <div className="flex justify-end space-x-3 mt-6">
            <button
              type="button"
              onClick={handleClose}
              className={`px-4 py-2 rounded-md ${
                isDarkMode 
                  ? 'bg-gray-700 hover:bg-gray-600 text-white' 
                  : 'bg-gray-200 hover:bg-gray-300 text-gray-800'
              }`}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className={`px-4 py-2 rounded-md ${
                isDarkMode 
                  ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                  : 'bg-blue-500 hover:bg-blue-600 text-white'
              } ${loading ? 'opacity-75 cursor-not-allowed' : ''}`}
            >
              {loading ? "Verifying..." : "Verify & Continue"}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
};

export default PasswordVerificationModal;

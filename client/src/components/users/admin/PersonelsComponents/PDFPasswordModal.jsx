import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FaTimes, FaLock, FaEye, FaEyeSlash, FaRandom } from 'react-icons/fa';

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

const PDFPasswordModal = ({ isOpen, onClose, onConfirm, isDarkMode }) => {
  const [pdfPassword, setPdfPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [generatePassword, setGeneratePassword] = useState(true);

  // Generate a random password
  const generateRandomPassword = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
    let result = '';
    for (let i = 0; i < 8; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  };

  // When component mounts or when generatePassword changes, update pdfPassword
  useEffect(() => {
    if (generatePassword) {
      setPdfPassword(generateRandomPassword());
    } else {
      setPdfPassword('');
    }
  }, [generatePassword]);

  const handleConfirm = () => {
    onConfirm(pdfPassword);
  };

  const handleGenerateNewPassword = () => {
    setPdfPassword(generateRandomPassword());
  };

  if (!isOpen) return null;

  return (
    <motion.div
      className={`fixed inset-0 flex items-center justify-center z-50 p-4 ${isDarkMode ? 'bg-black' : 'bg-gray-800'} bg-opacity-70 backdrop-blur-sm`}
      variants={backdropVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      onClick={onClose}
    >
      <motion.div
        className={`w-full max-w-md rounded-xl shadow-2xl overflow-hidden ${isDarkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-800'}`}
        variants={modalVariants}
        initial="hidden"
        animate="visible"
        exit="exit"
        onClick={(e) => e.stopPropagation()}
      >
        <div className={`px-6 py-4 flex justify-between items-center ${isDarkMode ? 'bg-blue-900' : 'bg-blue-600'} text-white`}>
          <h2 className="text-xl font-bold flex items-center">
            <FaLock className="mr-2" />
            Secure ZIP Archive
          </h2>
          <button onClick={onClose} className="text-white hover:text-gray-200 transition-colors">
            <FaTimes size={20} />
          </button>
        </div>

        <div className="p-6">
          <p className={`mb-4 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
            Your report will be encrypted in a ZIP file. You'll need this password to extract the contents.
          </p>

          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <label className={`block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                ZIP Password
              </label>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="generatePassword"
                  checked={generatePassword}
                  onChange={() => setGeneratePassword(!generatePassword)}
                  className={`mr-2 h-4 w-4 rounded ${
                    isDarkMode ? 'bg-gray-700 border-gray-500' : 'bg-white border-gray-300'
                  }`}
                />
                <label htmlFor="generatePassword" className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Auto-generate
                </label>
              </div>
            </div>
            
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={pdfPassword}
                onChange={(e) => setPdfPassword(e.target.value)}
                readOnly={generatePassword}
                className={`w-full pl-3 pr-20 py-2 rounded-md shadow-sm ${
                  isDarkMode 
                    ? 'bg-gray-700 text-white border-gray-600' 
                    : 'bg-white text-gray-900 border-gray-300'
                } ${generatePassword ? 'cursor-not-allowed' : ''}`}
                placeholder={generatePassword ? '' : 'Enter ZIP password'}
              />
              <div className="absolute inset-y-0 right-0 flex items-center">
                {generatePassword && (
                  <button
                    type="button"
                    onClick={handleGenerateNewPassword}
                    className={`mr-1 px-2 py-1 rounded-md ${
                      isDarkMode ? 'text-blue-300 hover:text-blue-200' : 'text-blue-500 hover:text-blue-600'
                    }`}
                  >
                    <FaRandom />
                  </button>
                )}
                <button
                  type="button"
                  className="pr-3"
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
            <p className={`mt-1 text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              {generatePassword 
                ? 'This password will be required to extract the ZIP contents. Please save it.' 
                : 'Enter a password to encrypt your ZIP file. You will need this to access the report.'}
            </p>
          </div>

          <div className="flex justify-end space-x-3 mt-6">
            <button
              type="button"
              onClick={onClose}
              className={`px-4 py-2 rounded-md ${
                isDarkMode 
                  ? 'bg-gray-700 hover:bg-gray-600 text-white' 
                  : 'bg-gray-200 hover:bg-gray-300 text-gray-800'
              }`}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              className={`px-4 py-2 rounded-md ${
                isDarkMode 
                  ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                  : 'bg-blue-500 hover:bg-blue-600 text-white'
              }`}
            >
              Download Encrypted ZIP
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default PDFPasswordModal;

import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FaExclamationTriangle, FaHome, FaArrowLeft } from 'react-icons/fa';
import { useTheme } from '../../contexts/ThemeContext';

const NotFound = () => {
  const { isDarkMode } = useTheme();
  
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { duration: 0.5 }
    }
  };
  
  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { 
      y: 0, 
      opacity: 1,
      transition: { duration: 0.5, delay: 0.2 }
    }
  };
  
  const buttonVariants = {
    hover: { scale: 1.05 },
    tap: { scale: 0.95 }
  };
  
  // Theme-aware styles
  const bgColor = isDarkMode ? 'bg-gray-900' : 'bg-gray-50';
  const textColor = isDarkMode ? 'text-white' : 'text-gray-900';
  const cardBg = isDarkMode ? 'bg-gray-800' : 'bg-white';
  const borderColor = isDarkMode ? 'border-gray-700' : 'border-gray-200';
  
  return (
    <motion.div 
      className={`min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 ${bgColor} ${textColor}`}
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <motion.div 
        className={`max-w-md w-full ${cardBg} shadow-xl rounded-lg overflow-hidden p-8 border ${borderColor}`}
        variants={itemVariants}
      >
        <div className="text-center">
          <FaExclamationTriangle className={`mx-auto h-16 w-16 ${isDarkMode ? 'text-yellow-400' : 'text-yellow-500'} mb-4`} />
          <h1 className="text-3xl font-bold mb-2">404</h1>
          <h2 className="text-xl font-semibold mb-4">Page Not Found</h2>
          <p className={`mb-8 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
            Oops! The page you're looking for doesn't exist or has been moved.
          </p>
          
          <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-3 justify-center">
            <motion.button
              onClick={() => window.history.back()}
              variants={buttonVariants}
              whileHover="hover"
              whileTap="tap"
              className={`inline-flex items-center justify-center px-5 py-2 border border-transparent rounded-md shadow-sm text-base font-medium ${
                isDarkMode 
                  ? 'bg-gray-700 hover:bg-gray-600 text-white' 
                  : 'bg-gray-200 hover:bg-gray-300 text-gray-800'
              }`}
            >
              <FaArrowLeft className="mr-2 -ml-1" />
              Go Back
            </motion.button>
            
            <motion.button
              variants={buttonVariants}
              whileHover="hover"
              whileTap="tap"
              className={`inline-flex items-center justify-center px-5 py-2 border border-transparent rounded-md shadow-sm text-base font-medium ${
                isDarkMode 
                  ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                  : 'bg-blue-500 hover:bg-blue-600 text-white'
              }`}
            >
              <FaHome className="mr-2 -ml-1" />
              <Link to="/" className="text-white">
                Go Home
              </Link>
            </motion.button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default NotFound;

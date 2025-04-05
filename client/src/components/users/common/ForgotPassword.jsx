import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { FaEnvelope, FaArrowLeft } from 'react-icons/fa';
import { motion } from 'framer-motion';
import { useTheme } from '../../../contexts/ThemeContext';

// Animation variants
const formVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { 
      duration: 0.6,
      when: "beforeChildren",
      staggerChildren: 0.2
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } }
};

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const { isDarkMode } = useTheme();

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!email) {
      toast.error('Please enter your email address');
      return;
    }
    
    setLoading(true);
    
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setEmailSent(true);
        toast.success(data.message || 'Password reset instructions sent to your email');
      } else {
        toast.error(data.message || 'Failed to process your request');
      }
    } catch (error) {
      toast.error('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`min-h-screen flex items-center justify-center bg-${isDarkMode ? 'gray-900' : 'gray-100'}`}>
      <ToastContainer theme={isDarkMode ? "dark" : "light"} />
      
      <div className={`max-w-md w-full p-8 rounded-lg shadow-lg ${
        isDarkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-800'
      }`}>
        <div className="text-center mb-6">
          <img src="/icon.png" alt="BTPMS Logo" className="mx-auto w-20 h-20 mb-2" />
          <h2 className={`text-2xl font-bold ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`}>
            Forgot Your Password?
          </h2>
          <p className={`mt-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
            {emailSent 
              ? "We've sent you an email with password reset instructions." 
              : "Enter your email and we'll send you instructions to reset your password."}
          </p>
        </div>
        
        {!emailSent ? (
          <motion.form 
            onSubmit={handleSubmit}
            className="space-y-6"
            initial="hidden"
            animate="visible"
            variants={formVariants}
          >
            <motion.div variants={itemVariants}>
              <label htmlFor="email" className="block text-sm font-medium mb-1">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FaEnvelope className={`h-5 w-5 ${isDarkMode ? 'text-blue-400' : 'text-blue-500'}`} />
                </div>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={`block w-full pl-10 pr-3 py-2 border ${
                    isDarkMode ? 'border-gray-600 bg-gray-700' : 'border-gray-300 bg-white'
                  } rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                  placeholder="Enter your email address"
                  required
                />
              </div>
            </motion.div>
            
            <motion.button
              type="submit"
              className={`w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-white font-medium ${
                isDarkMode 
                  ? 'bg-blue-600 hover:bg-blue-700' 
                  : 'bg-blue-500 hover:bg-blue-600'
              } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500`}
              disabled={loading}
              variants={itemVariants}
            >
              {loading ? 'Sending...' : 'Send Reset Link'}
            </motion.button>
            
            <motion.div className="text-center mt-4" variants={itemVariants}>
              <Link 
                to="/tanod-login" 
                className={`inline-flex items-center text-sm font-medium ${
                  isDarkMode ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-700'
                }`}
              >
                <FaArrowLeft className="mr-2" /> Back to Login
              </Link>
            </motion.div>
          </motion.form>
        ) : (
          <motion.div 
            className="text-center mt-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            <div className={`mb-4 p-3 rounded-lg ${
              isDarkMode ? 'bg-blue-900 text-blue-200' : 'bg-blue-50 text-blue-800'
            }`}>
              <p>If your email is registered, you will receive a password reset link shortly. Please check your inbox.</p>
              <p className="mt-2 text-sm italic">
                If you don't see the email, check your spam folder.
              </p>
            </div>
            
            <Link 
              to="/tanod-login" 
              className={`inline-flex items-center text-sm font-medium ${
                isDarkMode ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-700'
              }`}
            >
              <FaArrowLeft className="mr-2" /> Back to Login
            </Link>
          </motion.div>
        )}
      </div>
    </div>
  );
}

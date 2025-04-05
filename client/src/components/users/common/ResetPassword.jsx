import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { FaLock, FaEye, FaEyeSlash, FaCheckCircle } from 'react-icons/fa';
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

export default function ResetPassword() {
  const { token } = useParams();
  const navigate = useNavigate();
  const { isDarkMode } = useTheme();
  
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [confirmPasswordVisible, setConfirmPasswordVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);
  const [tokenValid, setTokenValid] = useState(true);
  const [passwordStrength, setPasswordStrength] = useState({
    score: 0,
    message: '',
    color: 'gray'
  });

  // Check token validity on load
  useEffect(() => {
    if (!token) {
      setTokenValid(false);
      toast.error('Invalid password reset link');
    }
  }, [token]);

  // Password strength checker
  useEffect(() => {
    if (!password) {
      setPasswordStrength({ score: 0, message: '', color: 'gray' });
      return;
    }

    let score = 0;
    
    // Length check
    if (password.length >= 8) score += 1;
    
    // Uppercase check
    if (/[A-Z]/.test(password)) score += 1;
    
    // Lowercase check
    if (/[a-z]/.test(password)) score += 1;
    
    // Number check
    if (/[0-9]/.test(password)) score += 1;
    
    // Special character check
    if (/[^A-Za-z0-9]/.test(password)) score += 1;
    
    let message, color;
    
    if (score === 0 || score === 1) {
      message = 'Weak';
      color = 'red';
    } else if (score === 2) {
      message = 'Fair';
      color = 'orange';
    } else if (score === 3) {
      message = 'Good';
      color = 'yellow';
    } else if (score === 4) {
      message = 'Strong';
      color = 'green';
    } else {
      message = 'Very Strong';
      color = 'green';
    }
    
    setPasswordStrength({ score, message, color });
  }, [password]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Form validation
    if (!password || !confirmPassword) {
      toast.error('Please fill out all fields');
      return;
    }
    
    if (password.length < 6) {
      toast.error('Password must be at least 6 characters long');
      return;
    }
    
    if (password !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    
    setLoading(true);
    
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token,
          password
        }),
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setResetSuccess(true);
        toast.success(data.message || 'Password reset successful!');
      } else {
        toast.error(data.message || 'Failed to reset password');
      }
    } catch (error) {
      toast.error('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Redirect to login after successful reset
  useEffect(() => {
    let timer;
    if (resetSuccess) {
      timer = setTimeout(() => {
        navigate('/tanod-login');
      }, 5000); // Redirect after 5 seconds
    }
    
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [resetSuccess, navigate]);

  // Define color classes based on password strength
  const getStrengthColorClass = () => {
    const { color } = passwordStrength;
    if (isDarkMode) {
      return {
        red: 'text-red-500 bg-red-900 bg-opacity-20',
        orange: 'text-orange-500 bg-orange-900 bg-opacity-20',
        yellow: 'text-yellow-500 bg-yellow-900 bg-opacity-20',
        green: 'text-green-500 bg-green-900 bg-opacity-20',
        gray: 'text-gray-500 bg-gray-800'
      }[color] || 'text-gray-500 bg-gray-800';
    } else {
      return {
        red: 'text-red-700 bg-red-100',
        orange: 'text-orange-700 bg-orange-100',
        yellow: 'text-yellow-700 bg-yellow-100',
        green: 'text-green-700 bg-green-100',
        gray: 'text-gray-700 bg-gray-100'
      }[color] || 'text-gray-700 bg-gray-100';
    }
  };

  if (!tokenValid) {
    return (
      <div className={`min-h-screen flex items-center justify-center bg-${isDarkMode ? 'gray-900' : 'gray-100'}`}>
        <div className={`max-w-md w-full p-8 rounded-lg shadow-lg text-center ${
          isDarkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-800'
        }`}>
          <h2 className="text-2xl font-bold text-red-500 mb-4">Invalid Reset Link</h2>
          <p className="mb-6">This password reset link is invalid or has expired.</p>
          <Link 
            to="/tanod-login" 
            className={`inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm font-medium ${
              isDarkMode ? 'bg-blue-600 text-white hover:bg-blue-700' : 'bg-blue-500 text-white hover:bg-blue-600'
            }`}
          >
            Return to Login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen flex items-center justify-center bg-${isDarkMode ? 'gray-900' : 'gray-100'}`}>
      <ToastContainer theme={isDarkMode ? "dark" : "light"} />
      
      <div className={`max-w-md w-full p-8 rounded-lg shadow-lg ${
        isDarkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-800'
      }`}>
        <div className="text-center mb-6">
          <img src="/icon.png" alt="BTPMS Logo" className="mx-auto w-20 h-20 mb-2" />
          <h2 className={`text-2xl font-bold ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`}>
            Reset Your Password
          </h2>
          <p className={`mt-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
            {resetSuccess 
              ? "Your password has been reset successfully." 
              : "Create a new password for your account."}
          </p>
        </div>
        
        {!resetSuccess ? (
          <motion.form 
            onSubmit={handleSubmit}
            className="space-y-6"
            initial="hidden"
            animate="visible"
            variants={formVariants}
          >
            <motion.div variants={itemVariants}>
              <label htmlFor="password" className="block text-sm font-medium mb-1">
                New Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FaLock className={`h-5 w-5 ${isDarkMode ? 'text-blue-400' : 'text-blue-500'}`} />
                </div>
                <input
                  id="password"
                  type={passwordVisible ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={`block w-full pl-10 pr-10 py-2 border ${
                    isDarkMode ? 'border-gray-600 bg-gray-700' : 'border-gray-300 bg-white'
                  } rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                  placeholder="Enter new password"
                  required
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setPasswordVisible(!passwordVisible)}
                >
                  {passwordVisible ? (
                    <FaEyeSlash className="h-5 w-5 text-gray-500" />
                  ) : (
                    <FaEye className="h-5 w-5 text-gray-500" />
                  )}
                </button>
              </div>
              
              {/* Password strength indicator */}
              {password && (
                <div className={`mt-2 p-2 rounded ${getStrengthColorClass()}`}>
                  <div className="flex items-center">
                    <div className="flex-1 h-2 bg-gray-300 rounded-full overflow-hidden">
                      <div 
                        className={`h-full ${
                          passwordStrength.color === 'red' ? 'bg-red-500' :
                          passwordStrength.color === 'orange' ? 'bg-orange-500' :
                          passwordStrength.color === 'yellow' ? 'bg-yellow-500' :
                          passwordStrength.color === 'green' ? 'bg-green-500' : 'bg-gray-500'
                        }`}
                        style={{ width: `${(passwordStrength.score / 5) * 100}%` }}
                      ></div>
                    </div>
                    <span className="ml-2 text-sm">
                      {passwordStrength.message}
                    </span>
                  </div>
                </div>
              )}
            </motion.div>
            
            <motion.div variants={itemVariants}>
              <label htmlFor="confirmPassword" className="block text-sm font-medium mb-1">
                Confirm Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FaLock className={`h-5 w-5 ${isDarkMode ? 'text-blue-400' : 'text-blue-500'}`} />
                </div>
                <input
                  id="confirmPassword"
                  type={confirmPasswordVisible ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className={`block w-full pl-10 pr-10 py-2 border ${
                    isDarkMode ? 'border-gray-600 bg-gray-700' : 'border-gray-300 bg-white'
                  } rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                  placeholder="Confirm new password"
                  required
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setConfirmPasswordVisible(!confirmPasswordVisible)}
                >
                  {confirmPasswordVisible ? (
                    <FaEyeSlash className="h-5 w-5 text-gray-500" />
                  ) : (
                    <FaEye className="h-5 w-5 text-gray-500" />
                  )}
                </button>
              </div>
              
              {/* Password match indicator */}
              {password && confirmPassword && (
                <div className="mt-2">
                  {password === confirmPassword ? (
                    <p className="text-green-500 flex items-center">
                      <FaCheckCircle className="mr-1" /> Passwords match
                    </p>
                  ) : (
                    <p className="text-red-500">Passwords don't match</p>
                  )}
                </div>
              )}
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
              {loading ? 'Resetting...' : 'Reset Password'}
            </motion.button>
          </motion.form>
        ) : (
          <motion.div 
            className="text-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            <div className={`mb-6 p-4 rounded-lg ${
              isDarkMode ? 'bg-green-900 text-green-200' : 'bg-green-50 text-green-800'
            }`}>
              <FaCheckCircle className="mx-auto mb-2 text-3xl" />
              <p className="font-medium">Your password has been reset successfully!</p>
              <p className="mt-2">You will be redirected to the login page shortly.</p>
            </div>
            
            <Link 
              to="/tanod-login" 
              className={`inline-flex items-center justify-center w-full py-3 px-4 rounded-lg ${
                isDarkMode 
                  ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                  : 'bg-blue-500 hover:bg-blue-600 text-white'
              } font-medium`}
            >
              Go to Login
            </Link>
          </motion.div>
        )}
      </div>
    </div>
  );
}

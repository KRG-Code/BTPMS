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

export default function ResetPin() {
  const { token } = useParams();
  const navigate = useNavigate();
  const { isDarkMode } = useTheme();
  
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [pinVisible, setPinVisible] = useState(false);
  const [confirmPinVisible, setConfirmPinVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);
  const [tokenValid, setTokenValid] = useState(true);
  
  // Add state for PIN strength
  const [pinStrength, setPinStrength] = useState({
    score: 0,
    message: '',
    color: 'gray',
    suggestions: []
  });

  // Check token validity on load
  useEffect(() => {
    if (!token) {
      setTokenValid(false);
      toast.error('Invalid PIN reset link');
    }
  }, [token]);

  // PIN strength checker
  useEffect(() => {
    if (!pin) {
      setPinStrength({ score: 0, message: '', color: 'gray', suggestions: [] });
      return;
    }

    let score = 0;
    const suggestions = [];
    
    // Length check (at least 8 characters)
    if (pin.length >= 8) {
      score += 1;
    } else {
      suggestions.push("PIN should be at least 8 characters long");
    }
    
    // Uppercase check
    if (/[A-Z]/.test(pin)) {
      score += 1;
    } else {
      suggestions.push("Include at least one uppercase letter");
    }
    
    // Lowercase check
    if (/[a-z]/.test(pin)) {
      score += 1;
    } else {
      suggestions.push("Include at least one lowercase letter");
    }
    
    // Number check
    if (/[0-9]/.test(pin)) {
      score += 1;
    } else {
      suggestions.push("Include at least one number");
    }
    
    // Special character check
    if (/[^A-Za-z0-9]/.test(pin)) {
      score += 1;
    } else {
      suggestions.push("Include at least one special character (e.g., @#$%)");
    }
    
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
    
    setPinStrength({ score, message, color, suggestions });
  }, [pin]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Form validation
    if (!pin || !confirmPin) {
      toast.error('Please fill out all fields');
      return;
    }
    
    if (pin.length < 8) {
      toast.error('PIN must be at least 8 characters long');
      return;
    }
    
    if (pinStrength.score < 3) {
      toast.error('PIN is too weak. Please create a stronger PIN.');
      return;
    }
    
    if (pin !== confirmPin) {
      toast.error('PINs do not match');
      return;
    }
    
    setLoading(true);
    
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/residents/reset-pin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token,
          newPin: pin
        }),
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setResetSuccess(true);
        toast.success(data.message || 'PIN reset successful!');
      } else {
        toast.error(data.message || 'Failed to reset PIN');
      }
    } catch (error) {
      toast.error('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Redirect to home after successful reset
  useEffect(() => {
    let timer;
    if (resetSuccess) {
      timer = setTimeout(() => {
        navigate('/');
      }, 5000); // Redirect after 5 seconds
    }
    
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [resetSuccess, navigate]);

  // Define color classes based on PIN strength
  const getStrengthColorClass = () => {
    const { color } = pinStrength;
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
          <p className="mb-6">This PIN reset link is invalid or has expired.</p>
          <Link 
            to="/" 
            className={`inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm font-medium ${
              isDarkMode ? 'bg-blue-600 text-white hover:bg-blue-700' : 'bg-blue-500 text-white hover:bg-blue-600'
            }`}
          >
            Return to Home
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
            Reset Your PIN
          </h2>
          <p className={`mt-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
            {resetSuccess 
              ? "Your PIN has been reset successfully." 
              : "Create a new PIN for your resident account."}
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
              <label htmlFor="pin" className="block text-sm font-medium mb-1">
                New PIN
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FaLock className={`h-5 w-5 ${isDarkMode ? 'text-blue-400' : 'text-blue-500'}`} />
                </div>
                <input
                  id="pin"
                  type={pinVisible ? "text" : "password"}
                  value={pin}
                  onChange={(e) => setPin(e.target.value)}
                  className={`block w-full pl-10 pr-10 py-2 border ${
                    isDarkMode ? 'border-gray-600 bg-gray-700' : 'border-gray-300 bg-white'
                  } rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                  placeholder="Enter new PIN"
                  required
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setPinVisible(!pinVisible)}
                >
                  {pinVisible ? (
                    <FaEyeSlash className="h-5 w-5 text-gray-500" />
                  ) : (
                    <FaEye className="h-5 w-5 text-gray-500" />
                  )}
                </button>
              </div>

              {/* PIN strength indicator */}
              {pin && (
                <div className={`mt-2 p-2 rounded ${getStrengthColorClass()}`}>
                  <div className="flex items-center">
                    <div className="flex-1 h-2 bg-gray-300 rounded-full overflow-hidden">
                      <div 
                        className={`h-full ${
                          pinStrength.color === 'red' ? 'bg-red-500' :
                          pinStrength.color === 'orange' ? 'bg-orange-500' :
                          pinStrength.color === 'yellow' ? 'bg-yellow-500' :
                          pinStrength.color === 'green' ? 'bg-green-500' : 'bg-gray-500'
                        }`}
                        style={{ width: `${(pinStrength.score / 5) * 100}%` }}
                      ></div>
                    </div>
                    <span className="ml-2 text-sm">
                      {pinStrength.message}
                    </span>
                  </div>
                  
                  {/* PIN strength suggestions */}
                  {pinStrength.suggestions.length > 0 && (
                    <div className="mt-2 text-xs">
                      <p className="font-medium mb-1">Suggestions to improve your PIN:</p>
                      <ul className="list-disc pl-5 space-y-0.5">
                        {pinStrength.suggestions.map((suggestion, index) => (
                          <li key={index}>{suggestion}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </motion.div>
            
            <motion.div variants={itemVariants}>
              <label htmlFor="confirmPin" className="block text-sm font-medium mb-1">
                Confirm PIN
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FaLock className={`h-5 w-5 ${isDarkMode ? 'text-blue-400' : 'text-blue-500'}`} />
                </div>
                <input
                  id="confirmPin"
                  type={confirmPinVisible ? "text" : "password"}
                  value={confirmPin}
                  onChange={(e) => setConfirmPin(e.target.value)}
                  className={`block w-full pl-10 pr-10 py-2 border ${
                    isDarkMode ? 'border-gray-600 bg-gray-700' : 'border-gray-300 bg-white'
                  } rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                  placeholder="Confirm new PIN"
                  required
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setConfirmPinVisible(!confirmPinVisible)}
                >
                  {confirmPinVisible ? (
                    <FaEyeSlash className="h-5 w-5 text-gray-500" />
                  ) : (
                    <FaEye className="h-5 w-5 text-gray-500" />
                  )}
                </button>
              </div>
              
              {/* PIN match indicator */}
              {pin && confirmPin && (
                <div className="mt-2">
                  {pin === confirmPin ? (
                    <p className="text-green-500 flex items-center">
                      <FaCheckCircle className="mr-1" /> PINs match
                    </p>
                  ) : (
                    <p className="text-red-500">PINs don't match</p>
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
              {loading ? 'Resetting...' : 'Reset PIN'}
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
              <p className="font-medium">Your PIN has been reset successfully!</p>
              <p className="mt-2">You will be redirected to the home page shortly.</p>
            </div>
            
            <Link 
              to="/" 
              className={`inline-flex items-center justify-center w-full py-3 px-4 rounded-lg ${
                isDarkMode 
                  ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                  : 'bg-blue-500 hover:bg-blue-600 text-white'
              } font-medium`}
            >
              Go to Home
            </Link>
          </motion.div>
        )}
      </div>
    </div>
  );
}

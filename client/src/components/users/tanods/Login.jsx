// src/pages/LoginTanod.js
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { loginFieldsTanod } from "../../constants/formFields";
import { useNavigate } from 'react-router-dom';
import FormAction from "../../forms/FormAction";
import FormExtra from "../../forms/FormExtra";
import Input from "../residents/singupComponents/Input";
import { validateLoginTanod } from '../../../utils/validation';
import { toast, ToastContainer } from 'react-toastify'; 
import 'react-toastify/dist/ReactToastify.css'; 
import { useCombinedContext } from "../../../contexts/useContext";
import Loading from "../../../utils/Loading";
import { FaUserShield, FaLock, FaShieldAlt, FaArrowLeft } from 'react-icons/fa';
import { useTheme } from '../../../contexts/ThemeContext';

const fieldsState = loginFieldsTanod.reduce((acc, field) => {
  acc[field.id] = '';
  return acc;
}, {});

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

export default function LoginTanod() {
  const [loginState, setLoginState] = useState(fieldsState);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const { login } = useCombinedContext();
  const navigate = useNavigate();
  const { isDarkMode } = useTheme();
  
  // MFA related states
  const [showMfaInput, setShowMfaInput] = useState(false);
  const [mfaCode, setMfaCode] = useState(['', '', '', '', '', '']);
  const [mfaError, setMfaError] = useState('');
  const [tempUserId, setTempUserId] = useState(null);
  const [tempUserType, setTempUserType] = useState(null);
  const [verificationLoading, setVerificationLoading] = useState(false);

  // Add these new state variables for the cooldown timer
  const [cooldownActive, setCooldownActive] = useState(false);
  const [cooldownTime, setCooldownTime] = useState(0);

  const handleChange = e => {
    setLoginState({ ...loginState, [e.target.id]: e.target.value });
    setErrors({ ...errors, [e.target.id]: '' });
  };

  const handleSubmit = async e => {
    e.preventDefault();

    const { valid, errors: validationErrors } = validateLoginTanod(loginState);
    if (!valid) {
      setErrors(validationErrors);
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/auth/login/tanod/initiate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(loginState),
      });
      const data = await response.json();

      if (response.ok) {
        setTempUserId(data.userId);
        setTempUserType(data.userType);
        setShowMfaInput(true);
        toast.success('Verification code sent to your email.');
      } else {
        toast.error(data.message || 'Invalid login credentials');
      }
    } catch (error) {
      toast.error('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Handle MFA input changes
  const handleMfaChange = (index, value) => {
    const newMfaCode = [...mfaCode];
    
    // Only allow digits
    if (value === '' || /^[0-9]$/.test(value)) {
      newMfaCode[index] = value;
      setMfaCode(newMfaCode);
      
      // Auto-focus next input if a digit was entered
      if (value !== '' && index < 5) {
        const nextInput = document.getElementById(`mfa-input-${index + 1}`);
        if (nextInput) nextInput.focus();
      }
    }
  };

  // Handle key down for backspace
  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && index > 0 && mfaCode[index] === '') {
      const prevInput = document.getElementById(`mfa-input-${index - 1}`);
      if (prevInput) prevInput.focus();
    }
  };

  // Handle MFA verification
  const handleVerifyMfa = async (e) => {
    e.preventDefault();
    
    const verificationCode = mfaCode.join('');
    if (verificationCode.length !== 6) {
      setMfaError('Please enter the complete 6-digit verification code.');
      return;
    }
    
    setVerificationLoading(true);
    
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/auth/login/tanod/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: tempUserId,
          verificationCode
        }),
      });
      
      const data = await response.json();
      
      if (response.ok) {
        await login(data.token);
        localStorage.setItem("userType", tempUserType);
        localStorage.setItem("userId", tempUserId);
        
        // Set tracking to enabled automatically
        localStorage.setItem("isTracking", "true");
        localStorage.setItem("isTrackingVisible", "true");
        
        toast.success('Login successful!');
        
        if (tempUserType === 'admin') {
          navigate('/admindashboard');
        } else if (tempUserType === 'tanod') {
          navigate('/dashboard');
        }
      } else {
        setMfaError(data.message || 'Invalid verification code.');
      }
    } catch (error) {
      setMfaError('An error occurred during verification.');
    } finally {
      setVerificationLoading(false);
    }
  };

  // Handle back to login
  const handleBackToLogin = () => {
    setShowMfaInput(false);
    setMfaCode(['', '', '', '', '', '']);
    setMfaError('');
    setTempUserId(null);
    setTempUserType(null);
  };

  // Add this useEffect for the cooldown timer
  useEffect(() => {
    let timer;
    if (cooldownActive && cooldownTime > 0) {
      timer = setTimeout(() => {
        setCooldownTime(prevTime => prevTime - 1);
      }, 1000);
    } else if (cooldownTime === 0) {
      setCooldownActive(false);
    }
    
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [cooldownActive, cooldownTime]);

  // Modify the resend code function to include cooldown
  const handleResendCode = async () => {
    if (!tempUserId || cooldownActive) return;
    
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/auth/login/tanod/resend`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: tempUserId }),
      });
      
      if (response.ok) {
        toast.success('Verification code resent to your email.');
        // Start cooldown timer (60 seconds)
        setCooldownTime(60);
        setCooldownActive(true);
      } else {
        const data = await response.json();
        toast.error(data.message || 'Failed to resend code.');
      }
    } catch (error) {
      toast.error('An error occurred. Please try again.');
    }
  };

  return (
    <>
      <ToastContainer theme={isDarkMode ? "dark" : "light"} />
      
      {!showMfaInput ? (
        <motion.form 
          className={`mt-8 space-y-6 ${isDarkMode ? 'text-white' : 'text-gray-800'}`} 
          onSubmit={handleSubmit}
          initial="hidden"
          animate="visible"
          variants={formVariants}
        >
          {/* Normal login form - existing code */}
          <motion.div className="space-y-4" variants={itemVariants}>
            {/* Username field */}
            <div>
              <label htmlFor="username" className="block text-sm font-medium mb-1">
                Username
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FaUserShield className={`h-5 w-5 ${isDarkMode ? 'text-blue-400' : 'text-blue-500'}`} />
                </div>
                <input
                  id="username"
                  name="username"
                  type="text"
                  value={loginState.username}
                  onChange={handleChange}
                  className={`block w-full pl-10 pr-3 py-2 border ${errors.username ? 'border-red-500' : isDarkMode ? 'border-gray-600' : 'border-gray-300'} 
                    rounded-lg shadow-sm focus:outline-none focus:ring-2 ${isDarkMode ? 'focus:ring-blue-600 bg-gray-800' : 'focus:ring-blue-500 bg-white'}
                    focus:border-transparent transition duration-200`}
                  placeholder="Enter your username"
                />
              </div>
              {errors.username && <p className="mt-1 text-sm text-red-500">{errors.username}</p>}
            </div>

            {/* Password field */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium mb-1">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FaLock className={`h-5 w-5 ${isDarkMode ? 'text-blue-400' : 'text-blue-500'}`} />
                </div>
                <input
                  id="password"
                  name="password"
                  type="password"
                  value={loginState.password}
                  onChange={handleChange}
                  className={`block w-full pl-10 pr-3 py-2 border ${errors.password ? 'border-red-500' : isDarkMode ? 'border-gray-600' : 'border-gray-300'} 
                    rounded-lg shadow-sm focus:outline-none focus:ring-2 ${isDarkMode ? 'focus:ring-blue-600 bg-gray-800' : 'focus:ring-blue-500 bg-white'}
                    focus:border-transparent transition duration-200`}
                  placeholder="Enter your password"
                />
              </div>
              {errors.password && <p className="mt-1 text-sm text-red-500">{errors.password}</p>}
            </div>
          </motion.div>

          {loading && <Loading type="bar" />}
          
          <motion.div variants={itemVariants}>
            <FormExtra isDarkMode={isDarkMode} />
          </motion.div>
          
          <motion.div variants={itemVariants}>
            <FormAction 
              handleSubmit={handleSubmit} 
              text={loading ? "Verifying..." : "Continue"} 
              loading={loading}
              isDarkMode={isDarkMode}
            />
          </motion.div>

          <motion.div variants={itemVariants} className="mt-4 text-center text-sm">
            <p className={isDarkMode ? "text-gray-400" : "text-gray-600"}>
              Don't have an account? Contact your administrator.
            </p>
          </motion.div>
        </motion.form>
      ) : (
        <motion.div 
          className={`mt-8 space-y-6 ${isDarkMode ? 'text-white' : 'text-gray-800'}`}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
        >
          <div className="text-center mb-6">
            <button
              onClick={handleBackToLogin}
              className={`inline-flex items-center text-sm font-medium ${isDarkMode ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-700'}`}
            >
              <FaArrowLeft className="mr-2" /> Back to login
            </button>
            
            <div className="mt-4">
              <FaShieldAlt className={`mx-auto h-12 w-12 ${isDarkMode ? 'text-blue-400' : 'text-blue-500'} mb-4`} />
              <h2 className="text-xl font-bold mb-2">Verification Required</h2>
              <div className={`${isDarkMode ? 'text-gray-300' : 'text-gray-600'} mb-4 text-left`}>
                <p className="mb-2">We've sent a 6-digit code to your email. Please follow these steps to find it:</p>
                <ol className="list-decimal pl-5 space-y-1">
                  <li>Open your Gmail app or visit <a href="https://mail.google.com" target="_blank" rel="noreferrer" className={`${isDarkMode ? 'text-blue-400' : 'text-blue-600'} underline`}>mail.google.com</a></li>
                  <li>Look for a new email from "BTPMS Security"</li>
                  <li>Open the email to see your 6-digit verification code</li>
                  <li>The code appears as large numbers in the middle of the email</li>
                  <li>Type the 6-digit code in the boxes below</li>
                </ol>
                <p className="mt-2 text-sm italic">Tip: If you don't see the email, check your Spam or Junk folder.</p>
              </div>
            </div>
            
            <form onSubmit={handleVerifyMfa}>
              <div className="flex justify-center space-x-2 mb-4">
                {mfaCode.map((digit, index) => (
                  <input
                    key={index}
                    id={`mfa-input-${index}`}
                    type="text"
                    maxLength="1"
                    value={digit}
                    onChange={(e) => handleMfaChange(index, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(index, e)}
                    className={`w-12 h-14 text-center text-xl font-semibold border ${
                      mfaError ? 'border-red-500' : isDarkMode ? 'border-gray-600' : 'border-gray-300'
                    } rounded-lg shadow-sm focus:outline-none focus:ring-2 ${
                      isDarkMode ? 'focus:ring-blue-600 bg-gray-800 text-white' : 'focus:ring-blue-500 bg-white text-gray-800'
                    } focus:border-transparent transition-all`}
                    autoFocus={index === 0}
                  />
                ))}
              </div>
              
              {mfaError && (
                <p className="text-red-500 text-sm mb-4">{mfaError}</p>
              )}
              
              <button
                type="submit"
                disabled={verificationLoading}
                className={`w-full py-3 px-4 rounded-lg ${
                  isDarkMode 
                    ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                    : 'bg-blue-500 hover:bg-blue-600 text-white'
                } font-medium transition-colors ${verificationLoading ? 'opacity-70 cursor-not-allowed' : ''}`}
              >
                {verificationLoading ? 'Verifying...' : 'Verify & Login'}
              </button>
              
              <div className="mt-4 text-sm">
                <button
                  type="button"
                  onClick={handleResendCode}
                  disabled={cooldownActive}
                  className={`${isDarkMode ? 'text-gray-300 hover:text-gray-100' : 'text-gray-600 hover:text-gray-800'} 
                             ${cooldownActive ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  Didn't receive the code? {cooldownActive ? (
                    <span className={isDarkMode ? 'text-blue-400' : 'text-blue-600'}>
                      Resend in {cooldownTime}s
                    </span>
                  ) : (
                    <span className={isDarkMode ? 'text-blue-400' : 'text-blue-600'}>Resend</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </motion.div>
      )}
    </>
  );
}

// src/pages/LoginTanod.js
import { useState } from 'react';
import { motion } from 'framer-motion';
import { loginFieldsTanod } from "../../constants/formFields";
import { useNavigate } from 'react-router-dom';
import FormAction from "../../forms/FormAction";
import FormExtra from "../../forms/FormExtra";
import Input from "../../inputs/Input";
import { validateLoginTanod } from '../../../utils/validation';
import { toast, ToastContainer } from 'react-toastify'; 
import 'react-toastify/dist/ReactToastify.css'; 
import { useCombinedContext } from "../../../contexts/useContext";
import Loading from "../../../utils/Loading";
import { FaUserShield, FaLock } from 'react-icons/fa';
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
      const response = await fetch(`${process.env.REACT_APP_API_URL}/auth/login/tanod`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(loginState),
      });
      const data = await response.json();

      if (response.ok) {
        await login(data.token);
        localStorage.setItem("userType", data.userType);
        localStorage.setItem("userId", data._id);
        
        // Set tracking to enabled automatically
        localStorage.setItem("isTracking", "true");
        localStorage.setItem("isTrackingVisible", "true");
        
        if (data.userType === 'admin') {
          toast.success('Logged in as Admin!');
          navigate('/admindashboard');
        } else if (data.userType === 'tanod') {
          toast.success('Logged in successfully as Tanod!');
          navigate('/dashboard');
        } else {
          toast.error('Unauthorized user type');
        }
      } else {
        toast.error(data.message || 'Invalid login credentials');
      }
    } catch (error) {
      toast.error('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <ToastContainer theme={isDarkMode ? "dark" : "light"} />
      <motion.form 
        className={`mt-8 space-y-6 ${isDarkMode ? 'text-white' : 'text-gray-800'}`} 
        onSubmit={handleSubmit}
        initial="hidden"
        animate="visible"
        variants={formVariants}
      >
        <motion.div 
          className="space-y-4"
          variants={itemVariants}
        >
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
            text={loading ? "Logging in..." : "Login"} 
            loading={loading}
            isDarkMode={isDarkMode}
          />
        </motion.div>

        <motion.div 
          variants={itemVariants} 
          className="mt-4 text-center text-sm"
        >
          <p className={isDarkMode ? "text-gray-400" : "text-gray-600"}>
            Don't have an account? Contact your administrator.
          </p>
        </motion.div>
      </motion.form>
    </>
  );
}

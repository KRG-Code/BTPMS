import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaUser, FaEnvelope, FaLock, FaIdCard, FaTimes, FaEye, FaEyeSlash } from 'react-icons/fa';
import Loading from '../../../../utils/Loading';
import { useTheme } from '../../../../contexts/ThemeContext'; // Import useTheme hook

const backdropVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 }
};

const modalVariants = {
  hidden: { opacity: 0, y: -50, scale: 0.9 },
  visible: { 
    opacity: 1, 
    y: 0, 
    scale: 1,
    transition: { duration: 0.3, type: 'spring', damping: 25 }
  },
  exit: {
    opacity: 0,
    y: -50,
    scale: 0.9,
    transition: { duration: 0.2 }
  }
};

export default function AddTanodModal({ showModal, closeModal, handleAddTanod, loading }) {
  const { isDarkMode } = useTheme(); // Use theme context
  
  const [formData, setFormData] = useState({
    firstName: "",
    middleName: "",
    lastName: "",
    email: "",
    username: "",
    password: "",
    confirmPassword: "",
  });
  
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    
    // Clear error when user types
    if (errors[e.target.name]) {
      setErrors({ ...errors, [e.target.name]: "" });
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.firstName.trim()) newErrors.firstName = "First name is required";
    if (!formData.lastName.trim()) newErrors.lastName = "Last name is required";
    if (!formData.username.trim()) newErrors.username = "Username is required";
    
    if (formData.email && !/^\S+@\S+\.\S+$/.test(formData.email))
      newErrors.email = "Valid email is required";
    
    if (!formData.password) {
      newErrors.password = "Password is required";
    } else if (formData.password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
    }
    
    if (formData.password !== formData.confirmPassword)
      newErrors.confirmPassword = "Passwords do not match";
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validateForm()) {
      handleAddTanod(formData);
    }
  };

  return (
    <AnimatePresence>
      {showModal && (
        <motion.div
          className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4"
          variants={backdropVariants}
          initial="hidden"
          animate="visible"
          exit="hidden"
        >
          <motion.div
            className={`rounded-lg shadow-xl max-w-md w-full overflow-hidden ${
              isDarkMode ? 'bg-[#0e1022]' : 'bg-white'
            }`}
            variants={modalVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            {/* Modal Header */}
            <div className={`${
              isDarkMode 
                ? 'bg-gradient-to-r from-[#191f8a] to-[#4750eb]' 
                : 'bg-gradient-to-r from-[#191d67] to-[#141db8]'
              } px-6 py-4 flex justify-between items-center`}>
              <h3 className="text-xl font-bold text-white flex items-center">
                <FaUser className="mr-2" /> Add New Tanod
              </h3>
              <button
                onClick={closeModal}
                className="text-white hover:text-gray-200 focus:outline-none"
              >
                <FaTimes className="h-5 w-5" />
              </button>
            </div>
            
            {/* Modal Body */}
            <div className={`p-6 ${isDarkMode ? 'text-[#e7e8f4]' : 'text-gray-800'}`}>
              <form onSubmit={handleSubmit}>
                <div className="space-y-4">
                  {/* Name Fields - Grid for First, Middle, Last name */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="firstName">
                        First Name*
                      </label>
                      <div className={`relative rounded-md shadow-sm ${errors.firstName ? 'ring-1 ring-red-500' : ''}`}>
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <FaIdCard className="h-4 w-4 text-gray-400" />
                        </div>
                        <input
                          type="text"
                          name="firstName"
                          id="firstName"
                          value={formData.firstName}
                          onChange={handleChange}
                          className={`focus:ring-blue-500 focus:border-blue-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-md py-2 ${
                            errors.firstName ? 'border-red-500' : ''
                          }`}
                          placeholder="John"
                        />
                      </div>
                      {errors.firstName && <p className="mt-1 text-sm text-red-600">{errors.firstName}</p>}
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="middleName">
                        Middle Name
                      </label>
                      <div className="relative rounded-md shadow-sm">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <FaIdCard className="h-4 w-4 text-gray-400" />
                        </div>
                        <input
                          type="text"
                          name="middleName"
                          id="middleName"
                          value={formData.middleName}
                          onChange={handleChange}
                          className="focus:ring-blue-500 focus:border-blue-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-md py-2"
                          placeholder="M."
                        />
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="lastName">
                        Last Name*
                      </label>
                      <div className={`relative rounded-md shadow-sm ${errors.lastName ? 'ring-1 ring-red-500' : ''}`}>
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <FaIdCard className="h-4 w-4 text-gray-400" />
                        </div>
                        <input
                          type="text"
                          name="lastName"
                          id="lastName"
                          value={formData.lastName}
                          onChange={handleChange}
                          className={`focus:ring-blue-500 focus:border-blue-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-md py-2 ${
                            errors.lastName ? 'border-red-500' : ''
                          }`}
                          placeholder="Doe"
                        />
                      </div>
                      {errors.lastName && <p className="mt-1 text-sm text-red-600">{errors.lastName}</p>}
                    </div>
                  </div>
                  
                  {/* Username */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="username">
                      Username*
                    </label>
                    <div className={`relative rounded-md shadow-sm ${errors.username ? 'ring-1 ring-red-500' : ''}`}>
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <FaUser className="h-4 w-4 text-gray-400" />
                      </div>
                      <input
                        type="text"
                        name="username"
                        id="username"
                        value={formData.username}
                        onChange={handleChange}
                        className={`focus:ring-blue-500 focus:border-blue-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-md py-2 ${
                          errors.username ? 'border-red-500' : ''
                        }`}
                        placeholder="johndoe"
                      />
                    </div>
                    {errors.username && <p className="mt-1 text-sm text-red-600">{errors.username}</p>}
                  </div>
                  
                  {/* Email */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="email">
                      Email
                    </label>
                    <div className={`relative rounded-md shadow-sm ${errors.email ? 'ring-1 ring-red-500' : ''}`}>
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <FaEnvelope className="h-4 w-4 text-gray-400" />
                      </div>
                      <input
                        type="email"
                        name="email"
                        id="email"
                        value={formData.email}
                        onChange={handleChange}
                        className={`focus:ring-blue-500 focus:border-blue-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-md py-2 ${
                          errors.email ? 'border-red-500' : ''
                        }`}
                        placeholder="john@example.com"
                      />
                    </div>
                    {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email}</p>}
                  </div>
                  
                  {/* Password */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="password">
                      Password*
                    </label>
                    <div className={`relative rounded-md shadow-sm ${errors.password ? 'ring-1 ring-red-500' : ''}`}>
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <FaLock className="h-4 w-4 text-gray-400" />
                      </div>
                      <input
                        type={showPassword ? "text" : "password"}
                        name="password"
                        id="password"
                        value={formData.password}
                        onChange={handleChange}
                        className={`focus:ring-blue-500 focus:border-blue-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-md py-2 ${
                          errors.password ? 'border-red-500' : ''
                        }`}
                        placeholder="••••••"
                      />
                      <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="text-gray-400 hover:text-gray-500 focus:outline-none"
                        >
                          {showPassword ? <FaEyeSlash className="h-4 w-4" /> : <FaEye className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>
                    {errors.password && <p className="mt-1 text-sm text-red-600">{errors.password}</p>}
                    <p className="mt-1 text-xs text-gray-500">Password must be at least 6 characters</p>
                  </div>
                  
                  {/* Confirm Password */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="confirmPassword">
                      Confirm Password*
                    </label>
                    <div className={`relative rounded-md shadow-sm ${errors.confirmPassword ? 'ring-1 ring-red-500' : ''}`}>
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <FaLock className="h-4 w-4 text-gray-400" />
                      </div>
                      <input
                        type={showConfirmPassword ? "text" : "password"}
                        name="confirmPassword"
                        id="confirmPassword"
                        value={formData.confirmPassword}
                        onChange={handleChange}
                        className={`focus:ring-blue-500 focus:border-blue-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-md py-2 ${
                          errors.confirmPassword ? 'border-red-500' : ''
                        }`}
                        placeholder="••••••"
                      />
                      <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="text-gray-400 hover:text-gray-500 focus:outline-none"
                        >
                          {showConfirmPassword ? <FaEyeSlash className="h-4 w-4" /> : <FaEye className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>
                    {errors.confirmPassword && <p className="mt-1 text-sm text-red-600">{errors.confirmPassword}</p>}
                  </div>
                </div>
                
                {/* Form Actions */}
                <div className="mt-6 flex justify-end space-x-3">
                  <motion.button
                    type="button"
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    className={`px-4 py-2 border ${
                      isDarkMode
                        ? 'border-[#1e2048] text-[#e7e8f4] bg-[#080917] hover:bg-[#0e1022]'
                        : 'border-gray-300 text-gray-700 bg-white hover:bg-gray-50'
                    } rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors duration-200`}
                    onClick={closeModal}
                    disabled={loading}
                  >
                    Cancel
                  </motion.button>
                  <motion.button
                    type="submit"
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    className={`px-4 py-2 ${
                      isDarkMode
                        ? 'bg-[#4750eb] hover:bg-[#191f8a]'
                        : 'bg-[#141db8] hover:bg-[#191d67]'
                    } text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors duration-200 flex items-center ${
                      loading ? 'opacity-70 cursor-not-allowed' : ''
                    }`}
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <Loading type="spinner" size="sm" color="white" className="mr-2" /> 
                        Adding...
                      </>
                    ) : (
                      'Add Tanod'
                    )}
                  </motion.button>
                </div>
              </form>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
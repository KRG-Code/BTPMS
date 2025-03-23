import React, { useState, useEffect } from 'react';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import axios from 'axios';
import { FaCloudUploadAlt, FaEdit, FaSave, FaTimes, FaKey, FaEye, FaEyeSlash } from 'react-icons/fa';
import { motion } from 'framer-motion';
import { useTheme } from '../../../contexts/ThemeContext'; // Import useTheme hook
import { useNavigate } from 'react-router-dom'; // Import useNavigate hook

export default function MyAcc() {
  const { isDarkMode } = useTheme(); // Use theme context
  const navigate = useNavigate(); // Initialize navigation
  const [user, setUser] = useState({
    firstName: '',
    middleName: '',
    lastName: '',
    email: '',
    username: '',
    contactNumber: '',
    address: '',
    birthday: '',
    gender: '',
    profilePicture: null
  });

  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwords, setPasswords] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [passwordErrors, setPasswordErrors] = useState({});

  // Add password visibility states
  const [currentPasswordVisible, setCurrentPasswordVisible] = useState(false);
  const [newPasswordVisible, setNewPasswordVisible] = useState(false);
  const [confirmPasswordVisible, setConfirmPasswordVisible] = useState(false);

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { duration: 0.5 } }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { duration: 0.5 } }
  };

  useEffect(() => {
    const fetchUserData = async () => {
      const token = localStorage.getItem('token');
      try {
        const response = await axios.get(`${process.env.REACT_APP_API_URL}/auth/me`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setUser(response.data);
      } catch (error) {
        toast.error('Failed to load user data');
        console.error('Error loading user data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setUser(prevUser => ({
      ...prevUser,
      [name]: value
    }));
  };

  const handleProfilePictureChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Check file size (limit to 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size should be less than 5MB');
      return;
    }

    // Check file type
    if (!file.type.match('image.*')) {
      toast.error('Please select an image file');
      return;
    }

    try {
      // Create a form data object
      const formData = new FormData();
      formData.append('profilePicture', file);
      
      // Display loading toast
      const loadingToast = toast.loading('Uploading image...');
      
      // Upload to your server or a storage service
      // This is a placeholder - implement your actual upload logic
      // For example, if using Firebase Storage:
      /*
      const storageRef = ref(storage, `profilePictures/${user._id}`);
      const snapshot = await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(snapshot.ref);
      */
      
      // For now, let's create a local object URL as a placeholder
      const imageUrl = URL.createObjectURL(file);
      
      // Update user state with the new profile picture URL
      setUser(prev => ({
        ...prev,
        profilePicture: imageUrl
      }));
      
      // Dismiss loading toast and show success
      toast.dismiss(loadingToast);
      toast.success('Profile picture updated');
    } catch (error) {
      console.error('Error uploading image:', error);
      toast.error('Failed to upload image');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        toast.error('Authentication required');
        return;
      }
      
      // Display loading toast and store its ID
      const loadingToastId = toast.loading('Saving changes...');
      
      // Send update request to the backend
      const response = await axios.put(
        `${process.env.REACT_APP_API_URL}/auth/update`,
        user,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      
      // Update user state with the response data
      setUser(response.data);
      
      // Exit edit mode
      setEditing(false);
      
      // Dismiss loading toast and show success
      toast.dismiss(loadingToastId);
      toast.success('Profile updated successfully');
    } catch (error) {
      console.error('Error updating profile:', error);
      
      // Make sure to dismiss any loading toast
      toast.dismiss();
      
      // Show more specific error messages
      if (error.response) {
        const status = error.response.status;
        const errorMessage = error.response.data?.message || 'Unknown server error';
        
        if (status === 400) {
          toast.error(`Validation error: ${errorMessage}`);
        } else if (status === 401) {
          toast.error('Authentication expired. Please login again.');
        } else if (status === 500) {
          toast.error(`Server error: ${errorMessage}. Please try again later.`);
        } else {
          toast.error(`Error: ${errorMessage}`);
        }
      } else if (error.request) {
        toast.error('No response from server. Please check your connection.');
      } else {
        toast.error('Failed to update profile. Please try again.');
      }
    }
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswords(prevPasswords => ({
      ...prevPasswords,
      [name]: value
    }));
  };

  const validatePasswords = () => {
    const errors = {};
    
    // Check if current password is provided
    if (!passwords.currentPassword) {
      errors.currentPassword = 'Current password is required';
    }
    
    // Check if new password is provided and meets requirements
    if (!passwords.newPassword) {
      errors.newPassword = 'New password is required';
    } else if (passwords.newPassword.length < 6) {
      errors.newPassword = 'Password must be at least 6 characters long';
    }
    
    // Check if confirmation matches new password
    if (!passwords.confirmPassword) {
      errors.confirmPassword = 'Please confirm your new password';
    } else if (passwords.newPassword !== passwords.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }
    
    setPasswordErrors(errors);
    return Object.keys(errors).length === 0; // Return true if no errors
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    
    // Validate passwords before submission
    if (!validatePasswords()) {
      return;
    }
    
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        toast.error('Authentication required');
        return;
      }
      
      // Display loading toast
      const loadingToast = toast.loading('Updating password...');
      
      // Send password change request
      await axios.put(
        `${process.env.REACT_APP_API_URL}/auth/change-password`,
        {
          currentPassword: passwords.currentPassword,
          newPassword: passwords.newPassword
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      
      // Reset password form
      setPasswords({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
      
      // Close modal
      setShowPasswordModal(false);
      
      // Dismiss loading toast and show success
      toast.dismiss(loadingToast);
      toast.success('Password updated successfully! Please login again.', { autoClose: 3000 });
      
      // Log the user out
      try {
        await axios.post(
          `${process.env.REACT_APP_API_URL}/auth/logout`, 
          {}, 
          { headers: { Authorization: `Bearer ${token}` }}
        );
      } catch (logoutError) {
        console.error('Error during logout:', logoutError);
      }
      
      // Clear local storage
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      
      // Redirect after a brief delay to allow the user to see the success message
      setTimeout(() => {
        navigate('/tanod-login');
      }, 3000);
      
    } catch (error) {
      console.error('Error changing password:', error);
      
      // Show appropriate error message
      if (error.response?.status === 401) {
        setPasswordErrors({
          ...passwordErrors,
          currentPassword: 'Current password is incorrect'
        });
        toast.error('Current password is incorrect');
      } else {
        toast.error(error.response?.data?.message || 'Failed to change password');
      }
    }
  };

  // Theme-aware styles
  const cardClasses = `max-w-4xl mx-auto rounded-lg shadow-xl overflow-hidden 
    ${isDarkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-800'}`;
  
  const headerClasses = `py-6 px-8 
    ${isDarkMode ? 'bg-gradient-to-r from-indigo-900 to-purple-900' : 'bg-gradient-to-r from-blue-600 to-indigo-600'} 
    text-white`;
  
  const inputClasses = `block w-full p-3 mt-1 rounded-lg 
    ${isDarkMode 
      ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
      : 'bg-gray-50 border-gray-300 text-gray-800 placeholder-gray-500'}
    border focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200`;
  
  const buttonClasses = {
    primary: `py-3 px-6 rounded-lg font-medium shadow-md
      ${isDarkMode 
        ? 'bg-blue-600 hover:bg-blue-700 text-white' 
        : 'bg-blue-600 hover:bg-blue-700 text-white'}
      transition-colors duration-200`,
    secondary: `py-3 px-6 rounded-lg font-medium shadow-md
      ${isDarkMode 
        ? 'bg-gray-700 hover:bg-gray-600 text-white' 
        : 'bg-gray-200 hover:bg-gray-300 text-gray-800'}
      transition-colors duration-200`
  };
  
  const labelClasses = `font-medium ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`;

  return (
    <motion.div 
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className="p-6"
    >
      <ToastContainer position="top-right" autoClose={5000} />
      
      <motion.div 
        className={cardClasses}
        variants={itemVariants}
      >
        <div className={headerClasses}>
          <h2 className="text-2xl font-semibold">My Account</h2>
          <p className="text-blue-100">Manage your personal information</p>
        </div>
        
        <div className="p-8">
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              {/* Profile Picture */}
              <div className="flex flex-col md:flex-row">
                <div className="w-full md:w-1/3 flex flex-col items-center mb-6 md:mb-0">
                  <div className="relative">
                    <img
                      src={user.profilePicture || '/default-avatar.png'}
                      alt="Profile"
                      className="w-40 h-40 rounded-full object-cover border-4 border-white shadow-lg"
                    />
                    
                    {editing && (
                      <label className="absolute bottom-0 right-0 bg-blue-600 text-white p-2 rounded-full cursor-pointer hover:bg-blue-700 transition">
                        <FaCloudUploadAlt size={20} />
                        <input 
                          type="file" 
                          accept="image/*" 
                          onChange={handleProfilePictureChange} 
                          className="hidden" 
                        />
                      </label>
                    )}
                  </div>

                  <div className="mt-4">
                    {!editing ? (
                      <button
                        type="button"
                        onClick={() => setEditing(true)}
                        className={`flex items-center ${buttonClasses.secondary}`}
                      >
                        <FaEdit className="mr-2" /> Edit Profile
                      </button>
                    ) : (
                      <div className="flex space-x-2">
                        <button
                          type="submit"
                          className={`flex items-center ${buttonClasses.primary}`}
                        >
                          <FaSave className="mr-2" /> Save
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditing(false)}
                          className={`flex items-center ${buttonClasses.secondary}`}
                        >
                          <FaTimes className="mr-2" /> Cancel
                        </button>
                      </div>
                    )}

                    {!editing && (
                      <button
                        type="button"
                        onClick={() => setShowPasswordModal(true)}
                        className={`flex items-center mt-4 ${buttonClasses.secondary}`}
                      >
                        <FaKey className="mr-2" /> Change Password
                      </button>
                    )}
                  </div>
                </div>

                {/* Form Fields */}
                <div className="w-full md:w-2/3 md:pl-8">
                  <div className="mb-6">
                    <h3 className={`text-lg font-semibold mb-4 ${isDarkMode ? 'text-blue-300' : 'text-blue-600'}`}>
                      Personal Information
                    </h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* First Name */}
                      <div>
                        <label className={labelClasses}>First Name</label>
                        <input
                          type="text"
                          name="firstName"
                          value={user.firstName || ''}
                          onChange={handleChange}
                          disabled={!editing}
                          className={inputClasses}
                        />
                      </div>

                      {/* Middle Name */}
                      <div>
                        <label className={labelClasses}>Middle Name</label>
                        <input
                          type="text"
                          name="middleName"
                          value={user.middleName || ''}
                          onChange={handleChange}
                          disabled={!editing}
                          className={inputClasses}
                        />
                      </div>

                      {/* Last Name */}
                      <div>
                        <label className={labelClasses}>Last Name</label>
                        <input
                          type="text"
                          name="lastName"
                          value={user.lastName || ''}
                          onChange={handleChange}
                          disabled={!editing}
                          className={inputClasses}
                        />
                      </div>

                      {/* Gender */}
                      <div>
                        <label className={labelClasses}>Gender</label>
                        <select
                          name="gender"
                          value={user.gender || ''}
                          onChange={handleChange}
                          disabled={!editing}
                          className={inputClasses}
                        >
                          <option value="">Select Gender</option>
                          <option value="Male">Male</option>
                          <option value="Female">Female</option>
                          <option value="Others">Others</option>
                          <option value="None">None</option>
                        </select>
                      </div>

                      {/* Birthday */}
                      <div>
                        <label className={labelClasses}>Birthday</label>
                        <input
                          type="date"
                          name="birthday"
                          value={user.birthday ? user.birthday.split('T')[0] : ''}
                          onChange={handleChange}
                          disabled={!editing}
                          className={inputClasses}
                        />
                      </div>

                      {/* Email */}
                      <div>
                        <label className={labelClasses}>Email</label>
                        <input
                          type="email"
                          name="email"
                          value={user.email || ''}
                          onChange={handleChange}
                          disabled={!editing}
                          className={inputClasses}
                        />
                      </div>

                      {/* Contact Number */}
                      <div>
                        <label className={labelClasses}>Contact Number</label>
                        <input
                          type="tel"
                          name="contactNumber"
                          value={user.contactNumber || ''}
                          onChange={handleChange}
                          disabled={!editing}
                          className={inputClasses}
                        />
                      </div>

                      {/* Username */}
                      <div>
                        <label className={labelClasses}>Username</label>
                        <input
                          type="text"
                          name="username"
                          value={user.username || ''}
                          onChange={handleChange}
                          disabled={!editing}
                          className={inputClasses}
                        />
                      </div>
                    </div>

                    {/* Address - Full Width */}
                    <div className="mt-6">
                      <label className={labelClasses}>Address</label>
                      <textarea
                        name="address"
                        value={user.address || ''}
                        onChange={handleChange}
                        disabled={!editing}
                        rows={3}
                        className={inputClasses}
                      ></textarea>
                    </div>
                  </div>
                </div>
              </div>
            </form>
          )}
        </div>
      </motion.div>

      {/* Password Change Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`w-full max-w-md p-6 rounded-lg shadow-xl ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}
          >
            <h3 className={`text-xl font-semibold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
              Change Password
            </h3>
            
            <form onSubmit={handlePasswordSubmit}>
              <div className="mb-4">
                <label className={labelClasses}>Current Password</label>
                <div className="relative">
                  <input
                    type={currentPasswordVisible ? "text" : "password"}
                    name="currentPassword"
                    value={passwords.currentPassword}
                    onChange={handlePasswordChange}
                    className={inputClasses}
                  />
                  <button
                    type="button"
                    onClick={() => setCurrentPasswordVisible(!currentPasswordVisible)}
                    className={`absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none`}
                  >
                    {currentPasswordVisible ? <FaEyeSlash size={18} /> : <FaEye size={18} />}
                  </button>
                </div>
                {passwordErrors.currentPassword && (
                  <p className="text-red-500 text-sm mt-1">{passwordErrors.currentPassword}</p>
                )}
              </div>
              
              <div className="mb-4">
                <label className={labelClasses}>New Password</label>
                <div className="relative">
                  <input
                    type={newPasswordVisible ? "text" : "password"}
                    name="newPassword"
                    value={passwords.newPassword}
                    onChange={handlePasswordChange}
                    className={inputClasses}
                  />
                  <button
                    type="button"
                    onClick={() => setNewPasswordVisible(!newPasswordVisible)}
                    className={`absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none`}
                  >
                    {newPasswordVisible ? <FaEyeSlash size={18} /> : <FaEye size={18} />}
                  </button>
                </div>
                {passwordErrors.newPassword && (
                  <p className="text-red-500 text-sm mt-1">{passwordErrors.newPassword}</p>
                )}
              </div>
              
              <div className="mb-6">
                <label className={labelClasses}>Confirm New Password</label>
                <div className="relative">
                  <input
                    type={confirmPasswordVisible ? "text" : "password"}
                    name="confirmPassword"
                    value={passwords.confirmPassword}
                    onChange={handlePasswordChange}
                    className={inputClasses}
                  />
                  <button
                    type="button"
                    onClick={() => setConfirmPasswordVisible(!confirmPasswordVisible)}
                    className={`absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none`}
                  >
                    {confirmPasswordVisible ? <FaEyeSlash size={18} /> : <FaEye size={18} />}
                  </button>
                </div>
                {passwordErrors.confirmPassword && (
                  <p className="text-red-500 text-sm mt-1">{passwordErrors.confirmPassword}</p>
                )}
              </div>
              
              <div className="flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowPasswordModal(false)}
                  className={buttonClasses.secondary}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={buttonClasses.primary}
                >
                  Update Password
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </motion.div>
  );
}

import React, { useState, useEffect } from 'react';
import { FaEye, FaEyeSlash, FaUserCircle } from "react-icons/fa";
import { toast } from "react-toastify";
import { useTheme } from '../../../../contexts/ThemeContext'; // Import useTheme hook

export default function EditTanodModal({ showModal, closeModal, handleEditTanod, loading, tanodData }) {
  const { isDarkMode } = useTheme(); // Use theme context
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [confirmPasswordVisible, setConfirmPasswordVisible] = useState(false);
  const [showPasswordFields, setShowPasswordFields] = useState(false);
  const [editTanod, setEditTanod] = useState(tanodData || {});

  // Reset states when modal opens/closes or tanod changes
  useEffect(() => {
    if (showModal && tanodData) {
      setEditTanod(tanodData);
      setShowPasswordFields(false); // Reset password fields visibility
      setPasswordVisible(false);
      setConfirmPasswordVisible(false);
    }
  }, [showModal, tanodData]);

  const handleClose = () => {
    setShowPasswordFields(false); // Reset password fields visibility when closing
    setPasswordVisible(false);
    setConfirmPasswordVisible(false);
    closeModal();
  };

  const handleInputChange = (e) => {
    setEditTanod({ ...editTanod, [e.target.name]: e.target.value });
  };

  const handleResetPassword = () => {
    toast.info(
      <div>
        <p>Are you sure you want to reset this user's password?</p>
        <div className="mt-2">
          <button
            className="bg-red-500 text-white px-2 py-1 rounded mr-2"
            onClick={() => {
              setShowPasswordFields(true);
              toast.dismiss();
            }}
          >
            Yes
          </button>
          <button
            className="bg-gray-500 text-white px-2 py-1 rounded"
            onClick={() => toast.dismiss()}
          >
            No
          </button>
        </div>
      </div>,
      {
        closeButton: false,
        autoClose: false,
      }
    );
  };

  const onSubmit = (e) => {
    e.preventDefault();
    if (showPasswordFields && editTanod.password !== editTanod.confirmPassword) {
      toast.error("Passwords do not match!");
      return;
    }
    
    // Remove password fields if not being reset
    const submitData = { ...editTanod };
    if (!showPasswordFields) {
      delete submitData.password;
      delete submitData.confirmPassword;
    }
    
    handleEditTanod(submitData);
  };

  if (!showModal) return null;

  return (
    <div
      className={`fixed inset-0 flex items-center justify-center z-50 ${
        showModal ? "visible" : "hidden"
      }`}
    >
      <div className="absolute inset-0 bg-black bg-opacity-50" onClick={handleClose}></div>
      
      <div className={`relative w-full max-w-lg mx-4 ${
        isDarkMode ? 'bg-[#0e1022] text-[#e7e8f4]' : 'bg-white text-gray-800'
      } rounded-lg shadow-lg overflow-hidden`}>
        <div className={`${
          isDarkMode 
            ? 'bg-gradient-to-r from-[#191f8a] to-[#4750eb]' 
            : 'bg-gradient-to-r from-[#191d67] to-[#141db8]'
          } text-white p-4 flex justify-between items-center`}>
          <h2 className="text-xl font-semibold">Edit Tanod</h2>
          <button
            onClick={handleClose}
            className="text-white hover:text-gray-200 focus:outline-none"
          >
            ✕
          </button>
        </div>
        
        <form onSubmit={onSubmit} className="p-6 space-y-4">
          {/* Profile Picture */}
          <div className="flex justify-center mb-4">
            {editTanod.profilePicture ? (
              <img 
                src={editTanod.profilePicture} 
                alt="Profile" 
                className="w-24 h-24 rounded-full object-cover border-4 border-white shadow-md" 
              />
            ) : (
              <div className={`w-24 h-24 rounded-full flex items-center justify-center ${
                isDarkMode ? 'bg-[#080917] border-4 border-[#0e1022]' : 'bg-gray-100 border-4 border-white'
              } shadow-md`}>
                <FaUserCircle className={`h-16 w-16 ${isDarkMode ? 'text-[#1e2048]' : 'text-gray-300'}`} />
              </div>
            )}
          </div>

          {/* Form Fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block font-medium mb-1">First Name</label>
              <input
                type="text"
                name="firstName"
                value={editTanod.firstName || ''}
                onChange={handleInputChange}
                className={`w-full p-2 rounded ${
                  isDarkMode 
                    ? 'bg-[#080917] border-[#1e2048] text-[#e7e8f4]' 
                    : 'bg-white border-gray-300 text-black'
                }`}
                required
              />
            </div>
            <div>
              <label className="block font-medium mb-1">Middle Name</label>
              <input
                type="text"
                name="middleName"
                value={editTanod.middleName || ''}
                onChange={handleInputChange}
                className={`w-full p-2 rounded ${
                  isDarkMode 
                    ? 'bg-[#080917] border-[#1e2048] text-[#e7e8f4]' 
                    : 'bg-white border-gray-300 text-black'
                }`}
              />
            </div>
            <div>
              <label className="block font-medium mb-1">Last Name</label>
              <input
                type="text"
                name="lastName"
                value={editTanod.lastName || ''}
                onChange={handleInputChange}
                className={`w-full p-2 rounded ${
                  isDarkMode 
                    ? 'bg-[#080917] border-[#1e2048] text-[#e7e8f4]' 
                    : 'bg-white border-gray-300 text-black'
                }`}
                required
              />
            </div>
            <div>
              <label className="block font-medium mb-1">Email</label>
              <input
                type="email"
                name="email"
                value={editTanod.email || ''}
                onChange={handleInputChange}
                className={`w-full p-2 rounded ${
                  isDarkMode 
                    ? 'bg-[#080917] border-[#1e2048] text-[#e7e8f4]' 
                    : 'bg-white border-gray-300 text-black'
                }`}
                required
              />
            </div>
            <div>
              <label className="block font-medium mb-1">Username</label>
              <input
                type="text"
                name="username"
                value={editTanod.username || ''}
                onChange={handleInputChange}
                className={`w-full p-2 rounded ${
                  isDarkMode 
                    ? 'bg-[#080917] border-[#1e2048] text-[#e7e8f4]' 
                    : 'bg-white border-gray-300 text-black'
                }`}
                required
              />
            </div>
          </div>

          {!showPasswordFields ? (
            <div className="mb-4">
              <button
                type="button"
                onClick={handleResetPassword}
                className="bg-yellow-500 text-white px-4 py-2 rounded hover:bg-yellow-600"
              >
                Reset Password
              </button>
            </div>
          ) : (
            <>
              <div className="mb-4 relative">
                <label htmlFor="password" className="block text-lg font-semibold mb-2">
                  New Password:
                </label>
                <input
                  type={passwordVisible ? "text" : "password"}
                  name="password"
                  id="password"
                  value={editTanod.password || ''}
                  onChange={handleInputChange}
                  className={`w-full p-2 rounded ${
                    isDarkMode 
                      ? 'bg-[#080917] border-[#1e2048] text-[#e7e8f4]' 
                      : 'bg-white border-gray-300 text-black'
                  }`}
                  required
                />
                <button
                  type="button"
                  onClick={() => setPasswordVisible(!passwordVisible)}
                  className="absolute right-2 top-1/2 transform -translate-y-0 text-gray-600"
                >
                  {passwordVisible ? <FaEyeSlash /> : <FaEye />}
                </button>
              </div>

              <div className="mb-4 relative">
                <label htmlFor="confirmPassword" className="block text-lg font-semibold mb-2">
                  Confirm New Password:
                </label>
                <input
                  type={confirmPasswordVisible ? "text" : "password"}
                  name="confirmPassword"
                  id="confirmPassword"
                  value={editTanod.confirmPassword || ''}
                  onChange={handleInputChange}
                  className={`w-full p-2 rounded ${
                    isDarkMode 
                      ? 'bg-[#080917] border-[#1e2048] text-[#e7e8f4]' 
                      : 'bg-white border-gray-300 text-black'
                  }`}
                  required
                />
                <button
                  type="button"
                  onClick={() => setConfirmPasswordVisible(!confirmPasswordVisible)}
                  className="absolute right-2 top-1/2 transform -translate-y-0 text-gray-600"
                >
                  {confirmPasswordVisible ? <FaEyeSlash /> : <FaEye />}
                </button>
              </div>
            </>
          )}

          <div className="flex justify-end">
            <button
              type="submit"
              className={`px-4 py-2 rounded ${
                isDarkMode
                  ? 'bg-[#4750eb] hover:bg-[#191f8a]'
                  : 'bg-blue-500 hover:bg-blue-600'
              } text-white mr-2`}
              disabled={loading}
            >
              {loading ? "Saving..." : "Save Changes"}
            </button>
            <button
              type="button"
              onClick={handleClose}
              className={`px-4 py-2 rounded ${
                isDarkMode
                  ? 'bg-gray-700 hover:bg-gray-600'
                  : 'bg-gray-500 hover:bg-gray-600'
              } text-white`}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

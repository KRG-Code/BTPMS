import React, { useState, useEffect } from 'react';
import { FaEye, FaEyeSlash } from "react-icons/fa";
import { toast } from "react-toastify";

export default function EditTanodModal({ showModal, closeModal, handleEditTanod, loading, tanodData }) {
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
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
      <div className="bg-white p-6 rounded-lg shadow-lg w-96 TopNav">
        <h2 className="text-xl font-bold mb-4">Edit Tanod</h2>
        <form onSubmit={onSubmit}>
          <div className="mb-4">
            <label htmlFor="firstName" className="block text-lg font-semibold mb-2">
              First Name:
            </label>
            <input
              type="text"
              name="firstName"
              id="firstName"
              value={editTanod.firstName || ''}
              onChange={handleInputChange}
              className="border border-gray-300 p-2 rounded w-full text-black"
              required
            />
          </div>

          <div className="mb-4">
            <label htmlFor="middleName" className="block text-lg font-semibold mb-2">
              Middle Name:
            </label>
            <input
              type="text"
              name="middleName"
              id="middleName"
              value={editTanod.middleName || ''}
              onChange={handleInputChange}
              className="border border-gray-300 p-2 rounded w-full text-black"
            />
          </div>

          <div className="mb-4">
            <label htmlFor="lastName" className="block text-lg font-semibold mb-2">
              Last Name:
            </label>
            <input
              type="text"
              name="lastName"
              id="lastName"
              value={editTanod.lastName || ''}
              onChange={handleInputChange}
              className="border border-gray-300 p-2 rounded w-full text-black"
              required
            />
          </div>

          <div className="mb-4">
            <label htmlFor="email" className="block text-lg font-semibold mb-2">
              Email:
            </label>
            <input
              type="email"
              name="email"
              id="email"
              value={editTanod.email || ''}
              onChange={handleInputChange}
              className="border border-gray-300 p-2 rounded w-full text-black"
              required
            />
          </div>

          <div className="mb-4">
            <label htmlFor="username" className="block text-lg font-semibold mb-2">
              Username:
            </label>
            <input
              type="text"
              name="username"
              id="username"
              value={editTanod.username || ''}
              onChange={handleInputChange}
              className="border border-gray-300 p-2 rounded w-full text-black"
              required
            />
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
                  className="border border-gray-300 p-2 rounded w-full text-black"
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
                  className="border border-gray-300 p-2 rounded w-full text-black"
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
              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 mr-2"
              disabled={loading}
            >
              {loading ? "Saving..." : "Save Changes"}
            </button>
            <button
              type="button"
              onClick={handleClose}
              className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

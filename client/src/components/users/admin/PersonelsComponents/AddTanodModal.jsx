import React, { useState } from 'react';
import { FaEye, FaEyeSlash } from "react-icons/fa";

export default function AddTanodModal({ showModal, closeModal, handleAddTanod, loading }) {
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [confirmPasswordVisible, setConfirmPasswordVisible] = useState(false);
  const [newTanod, setNewTanod] = useState({
    firstName: "",
    middleName: "",
    lastName: "",
    email: "",
    username: "",
    password: "",
    confirmPassword: "",
  });

  const handleInputChange = (e) => {
    setNewTanod({ ...newTanod, [e.target.name]: e.target.value });
  };

  const onSubmit = (e) => {
    e.preventDefault();
    handleAddTanod(newTanod);
  };

  if (!showModal) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
      <div className="bg-white p-6 rounded-lg shadow-lg w-96 TopNav">
        <h2 className="text-xl font-bold mb-4">Add New Tanod</h2>
        <form onSubmit={onSubmit}>
          <div className="mb-4">
            <label
              htmlFor="firstName"
              className="block text-lg font-semibold mb-2"
            >
              First Name:
            </label>
            <input
              type="text"
              name="firstName"
              id="firstName"
              value={newTanod.firstName}
              onChange={handleInputChange}
              className="border border-gray-300 p-2 rounded w-full text-black"
              required
            />
          </div>

          <div className="mb-4">
            <label
              htmlFor="middleName"
              className="block text-lg font-semibold mb-2"
            >
              Middle Name:
            </label>
            <input
              type="text"
              name="middleName"
              id="middleName"
              value={newTanod.middleName}
              onChange={handleInputChange}
              className="border border-gray-300 p-2 rounded w-full text-black"
            />
          </div>

          <div className="mb-4">
            <label
              htmlFor="lastName"
              className="block text-lg font-semibold mb-2"
            >
              Last Name:
            </label>
            <input
              type="text"
              name="lastName"
              id="lastName"
              value={newTanod.lastName}
              onChange={handleInputChange}
              className="border border-gray-300 p-2 rounded w-full text-black"
              required
            />
          </div>

          <div className="mb-4">
            <label
              htmlFor="email"
              className="block text-lg font-semibold mb-2"
            >
              Email:
            </label>
            <input
              type="email"
              name="email"
              id="email"
              value={newTanod.email}
              onChange={handleInputChange}
              className="border border-gray-300 p-2 rounded w-full text-black"
              required
            />
          </div>

          <div className="mb-4">
            <label
              htmlFor="username"
              className="block text-lg font-semibold mb-2"
            >
              Username:
            </label>
            <input
              type="text"
              name="username"
              id="username"
              value={newTanod.username}
              onChange={handleInputChange}
              className="border border-gray-300 p-2 rounded w-full text-black"
              required
            />
          </div>

          {/* Password Field */}
          <div className="mb-4 relative">
            <label
              htmlFor="password"
              className="block text-lg font-semibold mb-2"
            >
              Password:
            </label>
            <input
              type={passwordVisible ? "text" : "password"}
              name="password"
              id="password"
              value={newTanod.password}
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

          {/* Confirm Password Field */}
          <div className="mb-4 relative">
            <label
              htmlFor="confirmPassword"
              className="block text-lg font-semibold mb-2"
            >
              Confirm Password:
            </label>
            <input
              type={confirmPasswordVisible ? "text" : "password"}
              name="confirmPassword"
              id="confirmPassword"
              value={newTanod.confirmPassword}
              onChange={handleInputChange}
              className="border border-gray-300 p-2 rounded w-full text-black"
              required
            />
            <button
              type="button"
              onClick={() =>
                setConfirmPasswordVisible(!confirmPasswordVisible)
              }
              className="absolute right-2 top-1/2 transform -translate-y-0.5 text-gray-600"
            >
              {confirmPasswordVisible ? <FaEyeSlash /> : <FaEye />}
            </button>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 mr-2"
              disabled={loading}
            >
              {loading ? "Adding..." : "Add Tanod"}
            </button>
            <button
              type="button"
              onClick={closeModal}
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
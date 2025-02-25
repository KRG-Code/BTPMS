import React, { useState } from "react";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const EmergencyReportForm = ({ onClose }) => {
  const [formData, setFormData] = useState({
    fullName: "",
    contactNumber: "",
    location: "",
  });

  const [message, setMessage] = useState("");
  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const setCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((position) => {
        const { latitude, longitude } = position.coords;
        setFormData((prevData) => ({
          ...prevData,
          location: `Lat: ${latitude}, Lon: ${longitude}`,
        }));
      }, (error) => {
        console.error("Error getting location:", error);
        setMessage("Could not get current location.");
      });
    } else {
      setMessage("Geolocation is not supported by this browser.");
    }
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.fullName) newErrors.fullName = "Full Name is required";
    if (!formData.contactNumber) newErrors.contactNumber = "Contact Number is required";
    if (!formData.location) newErrors.location = "Location is required";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validateForm()) {
      toast.info(
        <div>
          <p>Are you sure you want to submit this emergency report?</p>
          <button
            onClick={() => {
              setMessage("Emergency report submitted successfully! (Dummy)");
              toast.dismiss();
              toast.success("Emergency report submitted successfully!");
              onClose(); // Close the modal
            }}
            className="bg-green-500 text-white font-bold py-1 px-2 rounded-md hover:bg-green-600"
          >
            Yes
          </button>
          <button
            onClick={() => toast.dismiss()}
            className="bg-red-500 text-white font-bold py-1 px-2 rounded-md hover:bg-red-600 ml-2"
          >
            No
          </button>
        </div>,
        { 
          autoClose: false,
          closeOnClick: false,
          draggable: false,
        }
      );
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white p-6 rounded-lg shadow-md w-full max-w-md">
        <h2 className="text-2xl font-bold mb-4">Emergency Report</h2>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="fullName" className="block font-bold mb-2">
              Full Name
            </label>
            <input
              type="text"
              name="fullName"
              value={formData.fullName}
              onChange={handleChange}
              className="w-full p-3 border rounded-md text-black"
              required
            />
            {errors.fullName && (
              <p className="text-red-500 text-sm">{errors.fullName}</p>
            )}
          </div>
          <div className="mb-4">
            <label htmlFor="contactNumber" className="block font-bold mb-2">
              Contact Number
            </label>
            <input
              type="text"
              name="contactNumber"
              value={formData.contactNumber}
              onChange={handleChange}
              className="w-full p-3 border rounded-md text-black"
              required
            />
            {errors.contactNumber && (
              <p className="text-red-500 text-sm">{errors.contactNumber}</p>
            )}
          </div>
          <div className="mb-4">
            <label htmlFor="location" className="block font-bold mb-2">
              Location
            </label>
            <input
              type="text"
              name="location"
              value={formData.location}
              onChange={handleChange}
              className="w-full p-3 border rounded-md text-black"
              placeholder="Enter the location"
              required
            />
            {errors.location && (
              <p className="text-red-500 text-sm">{errors.location}</p>
            )}
            <button
              type="button"
              onClick={setCurrentLocation}
              className="mt-2 text-blue-500 hover:underline"
            >
              Use Current Location
            </button>
          </div>
          <div className="flex justify-center">
            <button
              type="submit"
              className="bg-red-500 text-white font-bold py-2 px-4 rounded-md hover:bg-red-600"
            >
              Submit Emergency Report
            </button>
            <button
              type="button"
              onClick={onClose}
              className="ml-4 bg-gray-500 text-white font-bold py-2 px-4 rounded-md hover:bg-gray-600"
            >
              Cancel
            </button>
          </div>
          {message && (
            <p className="mt-4 text-center text-green-500 font-semibold">
              {message}
            </p>
          )}
        </form>
      </div>
    </div>
  );
};

export default EmergencyReportForm;
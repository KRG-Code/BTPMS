import React, { useState } from "react";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const EmergencyReportForm = ({ onClose }) => {
  const [formData, setFormData] = useState({
    fullName: "",
    contactNumber: "",
    location: "",
    type: "", // Added type state
    description: "N/A", // Default description to "N/A"
    date: "", // Added date state
    time: "", // Added time state
    incidentClassification: "Emergency Incident", // Added incident classification
  });

  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleContactNumberChange = (e) => {
    const value = e.target.value.replace(/\D/g, ""); // Remove non-numeric characters
    setFormData({
      ...formData,
      contactNumber: value,
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (validateForm()) {
      toast.info(
        <div>
          <p>Are you sure you want to submit this emergency report?</p>
          <button
            onClick={() => {
              submitEmergencyReport();
              toast.dismiss();
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

  const submitEmergencyReport = async () => {
    const now = new Date();
    const dateString = now.toISOString().split('T')[0]; // Get current date in YYYY-MM-DD format
    const timeString = now.toTimeString().split(' ')[0].slice(0, 5); // Get current time in HH:mm format

    const reportData = {
      ...formData,
      date: dateString,
      time: timeString,
      description: formData.description || "N/A", // Default to "N/A" if empty
      incidentClassification: formData.incidentClassification, // Ensure incidentClassification is included
    };

    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/incident-reports`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(reportData),
      });

      if (response.ok) {
        toast.success("Emergency report submitted successfully!");
        setFormData({
          fullName: "",
          contactNumber: "",
          location: "",
          type: "",
          description: "N/A",
          date: "",
          time: "",
          incidentClassification: "Emergency Incident",
        });
        onClose(); // Close the modal
      } else {
        const errorData = await response.json();
        toast.error(`Error: ${errorData.message}`);
      }
    } catch (error) {
      toast.error("An error occurred. Please try again.");
    }
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
        toast.error("Could not get current location.");
      });
    } else {
      toast.error("Geolocation is not supported by this browser.");
    }
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.fullName) newErrors.fullName = "Full Name is required";
    if (!formData.contactNumber) newErrors.contactNumber = "Contact Number is required";
    if (!formData.location) newErrors.location = "Location is required";
    if (!formData.type) newErrors.type = "Incident Type is required";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white p-6 rounded-lg shadow-md w-full max-w-md TopNav">
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
            <div className="flex">
              <span className="bg-gray-200 p-3 rounded-l-md">+63</span>
              <input
                type="text"
                name="contactNumber"
                value={formData.contactNumber}
                onChange={handleContactNumberChange}
                className="w-full p-3 border rounded-r-md text-black"
                maxLength="10"
                required
              />
            </div>
            {errors.contactNumber && (
              <p className="text-red-500 text-sm">{errors.contactNumber}</p>
            )}
          </div>
          <div className="mb-4">
            <label htmlFor="location" className="block font-bold mb-2">
              Location / Address
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
          <div className="mb-4">
            <label htmlFor="type" className="block font-bold mb-2">
              Incident Type
            </label>
            <select
              name="type"
              value={formData.type}
              onChange={handleChange}
              className="w-full p-3 border rounded-md text-black"
              required
            >
              <option value="">Select Type</option>
              <option value="Fire">Fire</option>
              <option value="Murder">Murder</option>
              <option value="Medical Emergency">Medical Emergency</option>
              <option value="Crime in Progress">Crime in Progress</option>
              <option value="Natural Disaster">Natural Disaster</option>
              <option value="Other">Other</option>
            </select>
            {errors.type && (
              <p className="text-red-500 text-sm">{errors.type}</p>
            )}
          </div>
          <div className="relative overflow-hidden h-6 mt-2">
            <p className="absolute text-red-500 text-sm flex items-center animate-slide-infinite whitespace-nowrap">
              <span role="img" aria-label="warning" className="mr-2">⚠️</span>
              This form is for reporting emergency situations that require immediate attention only.
            </p>
          </div>
          <div className="flex justify-center mt-4">
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
        </form>
      </div>
      <style>
        {`
          @keyframes slide-infinite {
            0% {
              transform: translateX(100%);
            }
            100% {
              transform: translateX(-100%);
            }
          }

          .animate-slide-infinite {
            animation: slide-infinite 10s linear infinite;
          }
        `}
      </style>
    </div>
  );
};

export default EmergencyReportForm;
import React, { useState } from "react";
import EmergencyReportForm from "./EmergencyReportForm"; // Import the new component
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const ReportIncidents = () => {
  const [formData, setFormData] = useState({
    type: "",
    location: "",
    locationNote: "", // Added location note state
    description: "",
    date: "",
    time: "",
    incidentClassification: "Normal Incident", // Added incident classification
  });

  const [showEmergencyForm, setShowEmergencyForm] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    toast.info(
      <div>
        <p>Are you sure you want to submit this report?</p>
        <button
          onClick={() => {
            submitReport();
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
  };

  const submitReport = async () => {
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/incident-reports`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        toast.success("Incident reported successfully!");
        setFormData({
          type: "",
          location: "",
          locationNote: "",
          description: "",
          date: "",
          time: "",
          incidentClassification: "Normal Incident",
        });
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
          location: `Lat: ${latitude}, Lon: ${longitude}`, // Update the location field
        }));
      }, (error) => {
        console.error("Error getting location:", error);
        toast.error("Could not get current location.");
      });
    } else {
      toast.error("Geolocation is not supported by this browser.");
    }
  };

  const setCurrentDateTime = () => {
    const now = new Date();
    const dateString = now.toISOString().split('T')[0]; // Get current date in YYYY-MM-DD format
    const timeString = now.toTimeString().split(' ')[0].slice(0, 5); // Get current time in HH:mm format
    setFormData((prevData) => ({
      ...prevData,
      date: dateString,
      time: timeString,
    }));
  };

  const handleEmergencyClick = () => {
    setShowEmergencyForm(true);
  };

  const handleEmergencyClose = () => {
    setShowEmergencyForm(false);
  };

  return (
    <div className="p-8 min-h-screen">
      <h1 className="text-4xl font-bold  mb-8 text-center">
        Report an Incident
      </h1>
      <div className="max-w-lg mx-auto bg-white p-6 rounded-lg shadow-md TopNav">
        <form onSubmit={handleSubmit}>
        <button
              type="button"
              onClick={handleEmergencyClick}
              className="mt-2 bg-red-500 text-white font-bold py-2 px-4 rounded-md hover:bg-red-600 w-full"
            >
              Emergency Report
            </button>
        <div className="relative overflow-hidden h-6 mt-2">
              <p className="absolute text-red-500 text-sm flex items-center animate-slide-infinite whitespace-nowrap">
                <span role="img" aria-label="warning" className="mr-2">⚠️</span>
                Use this button to report an emergency situation that requires immediate attention.
                If the situation does not require immediate action, please use the form below.
              </p>
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
              <option value="Robbery">Robbery</option>
              <option value="Vandalism">Vandalism</option>
              <option value="Noise Disturbance">Noise Disturbance</option>
              <option value="Public Intoxication">Public Intoxication</option>
              <option value="Traffic Violation">Traffic Violation</option>
              <option value="Trespassing">Trespassing</option>
              <option value="Other">Other</option>
            </select>
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
            <button
              type="button"
              onClick={setCurrentLocation}
              className="mt-2 text-blue-500 hover:underline"
            >
              Use Current Location
            </button>
          </div>

          <div className="mb-4">
            <label htmlFor="locationNote" className="block font-bold mb-2">
              Location Note
            </label>
            <textarea
              name="locationNote"
              value={formData.locationNote}
              onChange={handleChange}
              className="w-full p-3 border rounded-md text-black"
              rows="2"
              placeholder="Provide additional details to help find the location"
            ></textarea>
          </div>

          <div className="mb-4">
            <label htmlFor="description" className="block font-bold mb-2">
              Description
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              className="w-full p-3 border rounded-md text-black"
              rows="4"
              placeholder="Provide a detailed description of the incident"
              required
            ></textarea>
          </div>

          <div className="mb-4">
            <label htmlFor="date" className="block font-bold mb-2">
              Date
            </label>
            <input
              type="date"
              name="date"
              value={formData.date}
              onChange={handleChange}
              className="w-full p-3 border rounded-md text-black"
              required
            />
            <button
              type="button"
              onClick={setCurrentDateTime}
              className="mt-2 text-blue-500 hover:underline"
            >
              Set Current Date & Time
            </button>
          </div>

          <div className="mb-4">
            <label htmlFor="time" className="block font-bold mb-2">
              Time
            </label>
            <input
              type="time"
              name="time"
              value={formData.time}
              onChange={handleChange}
              className="w-full p-3 border rounded-md text-black"
              required
            />
          </div>

          <div className="flex justify-center">
            <button
              type="submit"
              className="bg-blue-500 text-white font-bold py-2 px-4 rounded-md hover:bg-blue-600"
            >
              Submit Report
            </button>
          </div>
        </form>
      </div>
      {showEmergencyForm && (
        <EmergencyReportForm onClose={handleEmergencyClose} />
      )}
      <ToastContainer />
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

export default ReportIncidents;

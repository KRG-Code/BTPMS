import React, { useState } from "react";

const ReportIncidents = () => {
  const [formData, setFormData] = useState({
    type: "",
    location: "",
    description: "",
    date: "",
    time: "",
    file: null, // Added file state
  });

  const [message, setMessage] = useState("");

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleFileChange = (e) => {
    setFormData({
      ...formData,
      file: e.target.files[0], // Set the selected file
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    // Here you can call the backend API to submit the form data
    // Example API call (you can replace this with your actual API):
    /*
    const formDataToSend = new FormData();
    for (const key in formData) {
      formDataToSend.append(key, formData[key]);
    }

    fetch("/api/report-incident", {
      method: "POST",
      body: formDataToSend,
    })
      .then((response) => response.json())
      .then((data) => {
        setMessage("Incident reported successfully!");
      })
      .catch((error) => {
        setMessage("An error occurred. Please try again.");
      });
    */

    setMessage("Incident reported successfully! (Dummy)");
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
        setMessage("Could not get current location.");
      });
    } else {
      setMessage("Geolocation is not supported by this browser.");
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

  return (
    <div className="p-8 min-h-screen">
      <h1 className="text-4xl font-bold  mb-8 text-center">
        Report an Incident
      </h1>
      <div className="max-w-lg mx-auto bg-white p-6 rounded-lg shadow-md TopNav">
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="type" className="block font-bold mb-2">
              Incident Type
            </label>
            <select
              name="type"
              value={formData.type}
              onChange={handleChange}
              className="w-full p-3 border rounded-md"
              required
            >
              <option value="">Select Type</option>
              <option value="Robbery">Robbery</option>
              <option value="Vandalism">Vandalism</option>
              <option value="Assault">Assault</option>
              <option value="Noise Disturbance">Noise Disturbance</option>
              <option value="Fire">Fire</option>
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
              className="w-full p-3 border rounded-md"
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
            <label htmlFor="description" className="block font-bold mb-2">
              Description
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              className="w-full p-3 border rounded-md"
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
              className="w-full p-3 border rounded-md"
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
              className="w-full p-3 border rounded-md"
              required
            />
          </div>

          <div className="mb-4">
            <label htmlFor="file" className="block font-bold mb-2">
              Upload Picture/Document
            </label>
            <input
              type="file"
              name="file"
              onChange={handleFileChange}
              className="w-full p-3 border rounded-md"
              accept="image/*,.pdf,.doc,.docx" // Accepts images and document files
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

export default ReportIncidents;

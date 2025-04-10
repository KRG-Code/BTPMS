import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { FaArrowLeft, FaMapMarkerAlt, FaCalendarAlt, FaClock } from 'react-icons/fa';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import axios from 'axios';
import { toast } from 'react-toastify';
import { reverseGeocode } from '../../../../utils/geocodingService';

// Reasons for vehicle usage
const USAGE_REASONS = [
  'Patrol',
  'Emergency Response',
  'Transport',
  'Maintenance',
  'Official Business',
  'Other'
];

const VehicleUsageForm = ({
  selectedVehicle,
  setShowVehicleForm,
  isDarkMode,
  cardBg,
  borderColor,
  textColor,
  subTextColor,
  inputBg,
  inputText,
  buttonPrimary,
  buttonSecondary,
  refreshRequests // Add this new prop
}) => {
  // Initialize form with all required fields explicitly set
  const [vehicleUsage, setVehicleUsage] = useState({
    startMileage: selectedVehicle?.currentMileage?.toString() || '0',
    date: new Date().toISOString().split('T')[0], // Ensure date is in YYYY-MM-DD format
    startTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }),
    destination: '',
    reason: '', // Required field - must be one of the enum values
    customReason: '', // For when "Other" is selected
    notes: ''
  });
  
  // Get today's date in YYYY-MM-DD format for min attribute on date input
  const today = new Date().toISOString().split('T')[0];

  const [markerPosition, setMarkerPosition] = useState(null);
  const [mapCenter, setMapCenter] = useState([14.7356, 121.0498]); // Default to Manila
  const [isSubmitting, setIsSubmitting] = useState(false);
  const mapRef = useRef(null);

  // Create custom marker icon
  const createCustomIcon = () => {
    return L.divIcon({
      className: 'custom-div-icon',
      html: `<div style="background-color: ${isDarkMode ? '#3b82f6' : '#2563eb'}; 
                    width: 22px; 
                    height: 22px; 
                    border-radius: 50%; 
                    border: 3px solid white;
                    box-shadow: 0 0 10px rgba(0,0,0,0.5);"></div>`,
      iconSize: [25, 25],
      iconAnchor: [12, 12]
    });
  };

  // Map component that handles clicks for setting destination
  const MapClickHandler = () => {
    useMapEvents({
      click: async (e) => {
        const { lat, lng } = e.latlng;
        setMarkerPosition([lat, lng]);
        
        try {
          // Get human-readable address from coordinates
          const address = await reverseGeocode(lat, lng);
          
          setVehicleUsage(prev => ({
            ...prev,
            destination: address || `Lat: ${lat.toFixed(6)}, Lng: ${lng.toFixed(6)}`
          }));

          toast.info("Location selected on map", { autoClose: 1500 });
        } catch (error) {
          console.error("Error with geocoding:", error);
          setVehicleUsage(prev => ({
            ...prev,
            destination: `Lat: ${lat.toFixed(6)}, Lng: ${lng.toFixed(6)}`
          }));
        }
      }
    });
    return null;
  };

  const handleVehicleUsageChange = (e) => {
    const { name, value } = e.target;
    setVehicleUsage(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmitVehicleUsage = async (e) => {
    e.preventDefault();
    
    try {
      setIsSubmitting(true);
      
      // Basic validations
      if (!vehicleUsage.startMileage) {
        toast.error("Start mileage is required");
        return;
      }
      if (!vehicleUsage.destination) {
        toast.error("Destination is required");
        return;
      }
      if (!vehicleUsage.reason) {
        toast.error("Reason is required");
        return;
      }
      if (!vehicleUsage.date) {
        toast.error("Date is required");
        return;
      }
      if (!vehicleUsage.startTime) {
        toast.error("Start time is required");
        return;
      }
      
      // Validate date is not in the past
      const selectedDate = new Date(vehicleUsage.date);
      const today = new Date();
      today.setHours(0, 0, 0, 0); // Set to beginning of day for proper comparison
      
      if (selectedDate < today) {
        toast.error("Cannot select a past date");
        return;
      }
      
      const startMileage = parseFloat(vehicleUsage.startMileage);
      if (isNaN(startMileage)) {
        toast.error("Start mileage must be a valid number");
        return;
      }
      
      if (selectedVehicle.currentMileage && startMileage < selectedVehicle.currentMileage) {
        toast.error(`Start mileage cannot be less than vehicle's current mileage (${selectedVehicle.currentMileage})`);
        return;
      }
      
      const token = localStorage.getItem("token");
      const userId = localStorage.getItem("userId");
      
      if (!userId) {
        toast.error("User ID not found. Please log in again.");
        return;
      }
      
      const loadingToast = toast.loading("Submitting vehicle usage request...");
      
      // Create request data object - explicitly WITHOUT endTime
      const data = {
        vehicleId: selectedVehicle._id,
        requesterId: userId,
        startMileage: parseFloat(vehicleUsage.startMileage),
        date: new Date(vehicleUsage.date).toISOString(),
        startTime: new Date(`${vehicleUsage.date}T${vehicleUsage.startTime}`).toISOString(),
        destination: vehicleUsage.destination.trim(),
        reason: vehicleUsage.reason === "Other" && vehicleUsage.customReason 
          ? vehicleUsage.customReason 
          : vehicleUsage.reason,
        notes: vehicleUsage.notes || ""
      };
      
      // Add coordinates if available
      if (markerPosition) {
        data.destinationCoordinates = {
          latitude: markerPosition[0],
          longitude: markerPosition[1]
        };
      }
      
      console.log("Submitting request with data:", data);
      
      // Use axios with proper error handling
      try {
        const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
        const response = await axios({
          method: 'post',
          url: `${apiUrl}/vehicles/requests`,
          data: data,
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          timeout: 10000 // Add a timeout of 10 seconds
        });
        
        console.log("Request successful:", response.data);
        
        toast.dismiss(loadingToast);
        toast.success("Vehicle usage request submitted successfully!");
        
        // Always refresh requests after a successful API response, regardless of WebSocket status
        setTimeout(() => {
          if (typeof refreshRequests === 'function') {
            refreshRequests();
          }
          setShowVehicleForm(false);
        }, 500);
      } catch (axiosError) {
        toast.dismiss(loadingToast);
        
        // More detailed error handling
        if (axiosError.response) {
          // The request was made and the server responded with a status code
          // that falls out of the range of 2xx
          console.error("Error response:", axiosError.response.data);
          toast.error(axiosError.response.data.message || "Request submission failed");
        } else if (axiosError.request) {
          // The request was made but no response was received
          console.error("No response received:", axiosError.request);
          toast.error("No response from server. The request may have been processed - please check your requests list");
          
          // Since we didn't get a response but the request might have gone through,
          // let's refresh requests anyway after a delay
          setTimeout(() => {
            if (typeof refreshRequests === 'function') {
              refreshRequests();
            }
            setShowVehicleForm(false);
          }, 2000);
        } else {
          // Something happened in setting up the request that triggered an Error
          console.error("Request error:", axiosError.message);
          toast.error(`Error creating request: ${axiosError.message}`);
        }
      }
    } catch (error) {
      console.error("Error submitting vehicle request:", error);
      toast.error("An unexpected error occurred - please try again");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={`${cardBg} rounded-xl shadow-md border ${borderColor} overflow-hidden mb-6`}>
      <div className={`px-4 py-3 ${isDarkMode ? 'bg-gray-900/50' : 'bg-gray-50'} border-b ${borderColor}`}>
        <h3 className={`text-lg font-semibold ${textColor}`}>Request Vehicle Usage</h3>
      </div>
      
      <form onSubmit={handleSubmitVehicleUsage} className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className={`block text-sm font-medium mb-1 ${subTextColor}`}>
              Vehicle
            </label>
            <input
              type="text"
              value={`${selectedVehicle.name} (${selectedVehicle.licensePlate})`}
              disabled
              className={`w-full px-3 py-2 border rounded-lg bg-opacity-50 ${inputBg} ${inputText}`}
            />
          </div>
          
          <div>
            <label className={`block text-sm font-medium mb-1 ${subTextColor}`}>
              Date*
            </label>
            <div className="relative">
              <input
                type="date"
                name="date"
                value={vehicleUsage.date}
                min={today} /* Prevent selecting past dates */
                onChange={handleVehicleUsageChange}
                required
                className={`w-full px-3 py-2 pl-9 border rounded-lg ${inputBg} ${inputText}`}
              />
              <FaCalendarAlt className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            </div>
          </div>
          
          <div>
            <label className={`block text-sm font-medium mb-1 ${subTextColor}`}>
              Start Time*
            </label>
            <div className="relative">
              <input
                type="time"
                name="startTime"
                value={vehicleUsage.startTime}
                onChange={handleVehicleUsageChange}
                required
                className={`w-full px-3 py-2 pl-9 border rounded-lg ${inputBg} ${inputText}`}
              />
              <FaClock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            </div>
          </div>
          
          <div>
            <label className={`block text-sm font-medium mb-1 ${subTextColor}`}>
              Start Mileage (km)*
            </label>
            <input
              type="number"
              name="startMileage"
              value={vehicleUsage.startMileage}
              onChange={handleVehicleUsageChange}
              min={selectedVehicle.currentMileage}
              step="0.1"
              required
              className={`w-full px-3 py-2 border rounded-lg ${inputBg} ${inputText}`}
            />
            <p className={`text-xs mt-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              Current vehicle mileage: {selectedVehicle.currentMileage || 0} km
            </p>
          </div>
          
          <div>
            <label className={`block text-sm font-medium mb-1 ${subTextColor}`}>
              Reason for Usage*
            </label>
            <select
              name="reason"
              value={vehicleUsage.reason}
              onChange={handleVehicleUsageChange}
              required
              className={`w-full px-3 py-2 border rounded-lg ${inputBg} ${inputText}`}
            >
              <option value="">Select reason</option>
              {USAGE_REASONS.map(reason => (
                <option key={reason} value={reason}>{reason}</option>
              ))}
            </select>
            
            {/* Show custom reason field when "Other" is selected */}
            {vehicleUsage.reason === "Other" && (
              <input
                type="text"
                name="customReason"
                value={vehicleUsage.customReason}
                onChange={handleVehicleUsageChange}
                placeholder="Please specify reason"
                className={`w-full px-3 py-2 border rounded-lg mt-2 ${inputBg} ${inputText}`}
                required
              />
            )}
          </div>
          
          <div className="md:col-span-2">
            <label className={`block text-sm font-medium mb-1 ${subTextColor}`}>
              Destination*
            </label>
            <div className="relative">
              <input
                type="text"
                name="destination"
                value={vehicleUsage.destination}
                onChange={handleVehicleUsageChange}
                required
                placeholder="Click on map to set destination"
                className={`w-full px-3 py-2 pl-3 pr-9 border rounded-lg ${inputBg} ${inputText}`}
              />
              <FaMapMarkerAlt className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            </div>
          </div>
          
          <div className="md:col-span-2">
            <div className={`p-2 rounded-md mb-2 ${
              isDarkMode ? 'bg-amber-900/20 text-amber-300 border border-amber-600' 
                         : 'bg-amber-50 text-amber-800 border border-amber-200'
            }`}>
              <p className="text-sm flex items-center">
                ⚠️ Please select a destination on the map below
              </p>
            </div>
            
            <div className="h-[300px] w-full rounded-lg overflow-hidden border border-gray-300 shadow-sm">
              <MapContainer 
                center={mapCenter} 
                zoom={13} 
                style={{ height: '100%', width: '100%' }}
                ref={mapRef}
              >
                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                <MapClickHandler />
                {markerPosition && (
                  <Marker 
                    position={markerPosition}
                    icon={createCustomIcon()}
                  />
                )}
              </MapContainer>
            </div>
          </div>
          
          <div className="md:col-span-2 mt-2">
            <div className={`p-2 rounded-md ${
              !markerPosition && 
              isDarkMode ? 'bg-amber-900/20 text-amber-300 border border-amber-600' 
                         : 'bg-amber-50 text-amber-800 border border-amber-200'
            }`}>
              <p className="text-sm">
                {!markerPosition ? "⚠️ Please select a destination on the map below" : 
                                  "✅ Destination location selected"}
              </p>
            </div>
          </div>
          
          <div className="md:col-span-2">
            <label className={`block text-sm font-medium mb-1 ${subTextColor}`}>
              Notes
            </label>
            <textarea
              name="notes"
              value={vehicleUsage.notes}
              onChange={handleVehicleUsageChange}
              rows={3}
              placeholder="Any additional notes about the purpose of your trip"
              className={`w-full px-3 py-2 border rounded-lg ${inputBg} ${inputText}`}
            />
          </div>
        </div>
        
        <div className="mt-6 flex justify-end">
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            type="button"
            onClick={() => setShowVehicleForm(false)}
            className={`mr-3 px-4 py-2 rounded-lg flex items-center ${buttonSecondary}`}
            disabled={isSubmitting}
          >
            <FaArrowLeft className="mr-2" /> Cancel
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            type="submit"
            className={`px-4 py-2 rounded-lg flex items-center ${buttonPrimary}`}
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Submitting...' : 'Submit Request'}
          </motion.button>
        </div>
      </form>
    </div>
  );
};

export default VehicleUsageForm;

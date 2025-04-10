import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { FaArrowLeft, FaSave, FaTachometerAlt, FaCarAlt, FaMapMarkedAlt, FaCalendarAlt, FaClock, FaTools, FaClipboardCheck } from 'react-icons/fa';
import axios from 'axios';
import { toast } from 'react-toastify';

// Vehicle conditions enum
const VEHICLE_CONDITIONS = [
  'Good condition',
  'Needs minor maintenance',
  'Needs major maintenance',
  'Not operational'
];

const CompleteUsageForm = ({ 
  request,
  setShowCompleteForm,
  fetchVehicleRequests,
  isDarkMode,
  cardBg,
  borderColor,
  textColor,
  subTextColor,
  inputBg,
  inputText,
  buttonPrimary,
  buttonSecondary
}) => {
  // Get current date and time for default values
  const now = new Date();
  const currentDate = now.toISOString().split('T')[0];
  const currentTime = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
  
  // Initialize form data with default values including end date and time
  const [formData, setFormData] = useState({
    endMileage: '',
    vehicleCondition: 'Good condition',
    notes: '',
    endDate: currentDate,
    endTime: currentTime
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Handle form field changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate form data
    if (!formData.endMileage) {
      toast.error("Please enter the end mileage");
      return;
    }
    
    if (!formData.endDate) {
      toast.error("Please enter the end date");
      return;
    }
    
    if (!formData.endTime) {
      toast.error("Please enter the end time");
      return;
    }
    
    const startMileage = parseFloat(request.startMileage);
    const endMileage = parseFloat(formData.endMileage);
    
    if (isNaN(endMileage)) {
      toast.error("End mileage must be a number");
      return;
    }
    
    if (endMileage <= startMileage) {
      toast.error("End mileage must be greater than start mileage");
      return;
    }
    
    // Validate end date is not before the request date
    const requestDate = new Date(request.date);
    const endDate = new Date(`${formData.endDate}T${formData.endTime}`);
    
    if (endDate < requestDate) {
      toast.error("End date and time cannot be before the request date and time");
      return;
    }
    
    try {
      setIsSubmitting(true);
      
      const token = localStorage.getItem("token");
      
      // Directly use the environment variable - simplified URL construction
      const apiUrl = process.env.REACT_APP_API_URL.replace(/\/$/, '');
      
      // Prepare complete payload with vehicle condition to update Vehicle model
      const completePayload = {
        endMileage: endMileage,
        vehicleCondition: formData.vehicleCondition,
        notes: formData.notes,
        // Include derived status based on condition
        vehicleStatus: getStatusFromCondition(formData.vehicleCondition),
        // Add end date and time
        endDateTime: new Date(`${formData.endDate}T${formData.endTime}`).toISOString(),
        // Include submission time (current time)
        submissionTime: new Date().toISOString()
      };
      
      console.log("Completing request with ID:", request._id);
      console.log("Complete payload:", JSON.stringify(completePayload));
      
      // Use URL with /vehicles/requests/{id}/complete endpoint
      const url = `${apiUrl}/vehicles/requests/${request._id}/complete`;
      console.log(`Sending completion request to: ${url}`);
      
      const response = await fetch(url, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(completePayload)
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Server responded with ${response.status}: ${errorText}`);
      }
      
      // Show success message and refresh data
      toast.success("Vehicle usage completed successfully!");
      
      // Refresh the request list
      fetchVehicleRequests();
      
      // Close the form
      setShowCompleteForm(false);
    } catch (error) {
      console.error("Error completing vehicle usage:", error);
      toast.error(error.message || "Failed to complete vehicle usage");
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Helper function to determine vehicle status based on condition
  const getStatusFromCondition = (condition) => {
    switch(condition) {
      case 'Needs minor maintenance':
      case 'Needs major maintenance':
        return 'Under Maintenance';
      case 'Not operational':
        return 'Out of Service';
      default:
        return 'Available'; // Always set to Available by default when completing usage
    }
  };

  // Helper function to format date time
  const formatDateTime = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  return (
    <div className={`${cardBg} border ${borderColor} rounded-lg shadow overflow-hidden max-h-[90vh] flex flex-col`}>
      <div className={`p-4 ${isDarkMode ? 'bg-gray-800/50' : 'bg-gray-50'} border-b ${borderColor}`}>
        <h3 className={`text-lg font-semibold ${textColor}`}>Complete Vehicle Usage</h3>
      </div>
      
      <form onSubmit={handleSubmit} className="p-4 overflow-y-auto">
        {/* Request details summary */}
        <div className={`mb-6 p-4 rounded-lg ${
          isDarkMode ? 'bg-gray-800/30' : 'bg-gray-50'
        } border ${borderColor}`}>
          <h4 className={`font-medium mb-3 ${textColor}`}>Request Details</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <span className={`${subTextColor}`}>Start Mileage:</span>
              <span className={`ml-2 font-medium ${textColor}`}>{request.startMileage} km</span>
            </div>
            <div>
              <span className={`${subTextColor}`}>Start Date & Time:</span>
              <span className={`ml-2 font-medium ${textColor}`}>
                {formatDateTime(request.startTime || request.date)}
              </span>
            </div>
            <div>
              <span className={`${subTextColor}`}>Destination:</span>
              <span className={`ml-2 font-medium ${textColor}`}>{request.destination}</span>
            </div>
            <div>
              <span className={`${subTextColor}`}>Reason:</span>
              <span className={`ml-2 font-medium ${textColor}`}>{request.reason}</span>
            </div>
            <div>
              <span className={`${subTextColor}`}>Approved Date:</span>
              <span className={`ml-2 font-medium ${textColor}`}>
                {new Date(request.approvalDate || request.updatedAt).toLocaleString()}
              </span>
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* End date field */}
          <div>
            <label className={`block text-sm font-medium mb-1 ${subTextColor}`}>
              <FaCalendarAlt className="inline mr-1.5" /> End Date *
            </label>
            <input
              type="date"
              name="endDate"
              value={formData.endDate}
              onChange={handleChange}
              required
              min={new Date(request.date).toISOString().split('T')[0]} // Can't be before request date
              className={`w-full px-3 py-2 border rounded-lg ${inputBg} ${inputText}`}
            />
          </div>
          
          {/* End time field */}
          <div>
            <label className={`block text-sm font-medium mb-1 ${subTextColor}`}>
              <FaClock className="inline mr-1.5" /> End Time *
            </label>
            <input
              type="time"
              name="endTime"
              value={formData.endTime}
              onChange={handleChange}
              required
              className={`w-full px-3 py-2 border rounded-lg ${inputBg} ${inputText}`}
            />
          </div>
          
          <div>
            <label className={`block text-sm font-medium mb-1 ${subTextColor}`}>
              <FaTachometerAlt className="inline mr-1.5" /> End Mileage (km) *
            </label>
            <input
              type="number"
              name="endMileage"
              value={formData.endMileage}
              onChange={handleChange}
              required
              step="0.1"
              min={request.startMileage}
              placeholder="Enter vehicle end mileage"
              className={`w-full px-3 py-2 border rounded-lg ${inputBg} ${inputText}`}
            />
            <p className={`mt-1 text-xs ${subTextColor}`}>
              Must be greater than start mileage ({request.startMileage} km)
            </p>
          </div>
          
          <div>
            <label className={`block text-sm font-medium mb-1 ${subTextColor}`}>
              <FaClipboardCheck className="inline mr-1.5" /> Vehicle Condition
            </label>
            <select
              name="vehicleCondition"
              value={formData.vehicleCondition}
              onChange={handleChange}
              className={`w-full px-3 py-2 border rounded-lg ${inputBg} ${inputText}`}
            >
              {VEHICLE_CONDITIONS.map(condition => (
                <option key={condition} value={condition}>{condition}</option>
              ))}
            </select>
          </div>
          
          <div className="md:col-span-2">
            <label className={`block text-sm font-medium mb-1 ${subTextColor}`}>
              Notes
            </label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              rows={3}
              placeholder="Any additional notes about the vehicle condition or trip"
              className={`w-full px-3 py-2 border rounded-lg ${inputBg} ${inputText}`}
            />
          </div>
        </div>
        
        <div className="mt-6 flex justify-end">
          <motion.button 
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            type="button"
            onClick={() => setShowCompleteForm(false)}
            className={`py-2 px-4 rounded-lg ${buttonSecondary} mr-3`}
            disabled={isSubmitting}
          >
            <FaArrowLeft className="inline mr-2" /> 
            Cancel
          </motion.button>
          
          <motion.button 
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            type="submit"
            className={`py-2 px-5 rounded-lg ${buttonPrimary}`}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Processing...
              </>
            ) : (
              <>
                <FaSave className="mr-2" /> Complete Usage
              </>
            )}
          </motion.button>
        </div>
      </form>
    </div>
  );
};

export default CompleteUsageForm;

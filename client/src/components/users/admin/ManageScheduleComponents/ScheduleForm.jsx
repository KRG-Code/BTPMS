import React, { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { motion, AnimatePresence } from "framer-motion";
import { FaUserCircle, FaTimes, FaCalendarPlus, FaCalendarAlt, FaUsers, FaUserPlus, FaUserMinus, FaClock, FaSun, FaMoon } from 'react-icons/fa';
import TanodModal from "./TanodModal";

const overlayVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.3 } },
  exit: { opacity: 0, transition: { duration: 0.3 } }
};

const modalVariants = {
  hidden: { opacity: 0, y: 50 },
  visible: { opacity: 1, y: 0, transition: { type: "spring", damping: 25, stiffness: 500 } },
  exit: { opacity: 0, y: 50, transition: { duration: 0.3 } }
};

const ScheduleForm = ({
  isEditing,
  currentScheduleId,
  unit,
  setUnit,
  selectedTanods,
  setSelectedTanods,
  startTime,
  setStartTime,
  endTime,
  setEndTime,
  originalStartTime,
  setOriginalStartTime,
  resetForm,
  fetchSchedules,
  schedules,
  setSchedules,
  setShowForm,
  tanods,
  isDarkMode
}) => {
  const [scheduleStatus, setScheduleStatus] = useState("Upcoming");
  const [showAddTanodModal, setShowAddTanodModal] = useState(false);
  const [showRemoveTanodModal, setShowRemoveTanodModal] = useState(false);
  const [checkedTanods, setCheckedTanods] = useState([]);
  const [shiftType, setShiftType] = useState("Day Shift"); // Default to Day Shift
  const [startDate, setStartDate] = useState(""); // New state for start date
  const [endDate, setEndDate] = useState(""); // New state for end date
  const [scheduleID, setScheduleID] = useState(""); // New state for schedule ID

  useEffect(() => {
    if (isEditing && currentScheduleId) {
      const schedule = schedules.find((s) => s._id === currentScheduleId);
      if (schedule) {
        setScheduleStatus(schedule.status);
        
        // Determine shift type based on schedule time
        const startHour = new Date(schedule.startTime).getHours();
        if (startHour >= 8 && startHour < 17) {
          setShiftType("Day Shift");
        } else {
          setShiftType("Night Shift");
        }
        
        // Set dates from the schedule
        setStartDate(new Date(schedule.startTime).toISOString().split('T')[0]);
        setEndDate(new Date(schedule.endTime).toISOString().split('T')[0]);
        
        // Set the scheduleID from existing schedule if available
        setScheduleID(schedule.scheduleID || "");
      }
    } else {
      // Generate a new schedule ID for new schedules
      generateScheduleID();
    }
  }, [isEditing, currentScheduleId, schedules]);

  // Set default start date when component mounts
  useEffect(() => {
    if (!isEditing && !startDate) {
      // Set default to today's date
      const today = new Date().toISOString().split('T')[0];
      setStartDate(today);
    }
  }, []);

  // Handle shift type change and automatically adjust times - but now as a suggestion only
  useEffect(() => {
    if (!startDate) return;
    
    const date = new Date(startDate);
    let newStartTime, newEndTime;
    
    if (shiftType === "Day Shift") {
      // Set Day Shift times (8am to 5pm)
      newStartTime = new Date(date);
      newStartTime.setHours(8, 0, 0);
      
      newEndTime = new Date(date);
      newEndTime.setHours(17, 0, 0);
      
      // Ensure end date is same as start date for day shift
      setEndDate(startDate);
    } else {
      // Set Night Shift times (5pm to 6am next day)
      newStartTime = new Date(date);
      newStartTime.setHours(17, 0, 0);
      
      // Calculate the next day for end date
      const nextDay = new Date(date);
      nextDay.setDate(nextDay.getDate() + 1);
      
      // Set end time on next day
      newEndTime = new Date(nextDay);
      newEndTime.setHours(6, 0, 0);
      
      // Update the end date to be the next day for night shift
      setEndDate(nextDay.toISOString().split('T')[0]);
    }
    
    setStartTime(newStartTime.toISOString());
    setEndTime(newEndTime.toISOString());
  }, [shiftType, startDate]);

  // Also update end date when start date changes
  useEffect(() => {
    if (!startDate) return;
    
    if (shiftType === "Night Shift") {
      // For night shift, end date should be next day
      const nextDay = new Date(startDate);
      nextDay.setDate(nextDay.getDate() + 1);
      setEndDate(nextDay.toISOString().split('T')[0]);
    } else {
      // For day shift, end date should be same as start date
      setEndDate(startDate);
    }
  }, [startDate, shiftType]);

  // Add event handler for end date changes to enforce the night shift rule
  const handleEndDateChange = (e) => {
    const newEndDate = e.target.value;
    
    // For night shift, validate that end date is after start date
    if (shiftType === "Night Shift" && startDate) {
      const startDateObj = new Date(startDate);
      const endDateObj = new Date(newEndDate);
      
      // Compare the dates (ignoring time)
      const startDay = new Date(startDateObj.getFullYear(), startDateObj.getMonth(), startDateObj.getDate());
      const endDay = new Date(endDateObj.getFullYear(), endDateObj.getMonth(), endDateObj.getDate());
      
      // Calculate difference in days
      const diffTime = endDay - startDay;
      const diffDays = diffTime / (1000 * 60 * 60 * 24);
      
      if (diffDays < 1) {
        // If end date is same as or before start date, set it to next day
        const nextDay = new Date(startDate);
        nextDay.setDate(nextDay.getDate() + 1);
        setEndDate(nextDay.toISOString().split('T')[0]);
        
        // Show a toast to inform the user
        toast.info("For night shift, end date must be the next day after start date.");
        return;
      }
    }
    
    // If validation passes, update the end date
    setEndDate(newEndDate);
  };

  // Generate a unique schedule ID
  const generateScheduleID = () => {
    const timestamp = new Date().getTime().toString().slice(-6); // Last 6 digits of timestamp
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0'); // 4-digit random number
    const newID = `SCH-${timestamp}-${random}`;
    setScheduleID(newID);
  };

  const handleCreateOrUpdateSchedule = async (e) => {
    e.preventDefault();

    // Validate that at least two Tanods are selected
    if (selectedTanods.length < 2) {
      toast.error("Please select at least two Tanods for the schedule.");
      return;
    }
    
    // Validate dates
    if (!startDate || !endDate) {
      toast.error("Please select both start and end dates.");
      return;
    }

    try {
      // Get time values from input fields directly
      const startTimeInput = document.querySelector('input[type="time"][value="' + formatTimeForInput(startTime) + '"]').value;
      const endTimeInput = document.querySelector('input[type="time"][value="' + formatTimeForInput(endTime) + '"]').value;
      
      // Parse user-provided time values
      const [startHours, startMinutes] = startTimeInput.split(':').map(Number);
      const [endHours, endMinutes] = endTimeInput.split(':').map(Number);
      
      // Create date objects with user-selected dates and times
      const startDateTime = new Date(startDate);
      startDateTime.setHours(startHours, startMinutes, 0, 0);
      
      const endDateTime = new Date(endDate);
      endDateTime.setHours(endHours, endMinutes, 0, 0);
      
      // Validate that end time is after start time
      if (endDateTime <= startDateTime) {
        toast.error("End time must be after start time.");
        return;
      }

      const token = localStorage.getItem("token");
      const url = isEditing
        ? `${process.env.REACT_APP_API_URL}/auth/schedule/${currentScheduleId}`
        : `${process.env.REACT_APP_API_URL}/auth/schedule`;

      const response = await axios({
        method: isEditing ? "put" : "post",
        url,
        data: { 
          unit: shiftType,
          tanods: selectedTanods, 
          startTime: startDateTime.toISOString(), 
          endTime: endDateTime.toISOString(),
          scheduleID
        },
        headers: { Authorization: `Bearer ${token}` },
      });

      if (isEditing) {
        setSchedules(
          schedules.map((schedule) =>
            schedule._id === currentScheduleId
              ? response.data.schedule
              : schedule
          )
        );
        fetchSchedules();
        toast.success("Schedule updated successfully!");
      } else {
        fetchSchedules();
        setSchedules([...schedules, response.data.schedule]);
        toast.success("Schedule created successfully!");
      }
      resetForm();
    } catch (error) {
      console.error("Error creating/updating schedule:", error);
      toast.error(`Error ${isEditing ? "updating" : "creating"} schedule. Please try again.`);
    }
  };

  const getMinDateTime = () => {
    const now = new Date();
    return now.toISOString().slice(0, 16);
  };

  const handleAddSelectedTanods = () => {
    setSelectedTanods((prev) => [...prev, ...checkedTanods]);
    setCheckedTanods([]);
    setShowAddTanodModal(false);
  };

  const handleRemoveSelectedTanods = () => {
    setSelectedTanods((prev) =>
      prev.filter((id) => !checkedTanods.includes(id))
    );
    setCheckedTanods([]);
    setShowRemoveTanodModal(false);
  };

  const handleToggleCheckbox = (tanodId) => {
    setCheckedTanods((prev) =>
      prev.includes(tanodId)
        ? prev.filter((id) => id !== tanodId)
        : [...prev, tanodId]
    );
  };

  // Format time for display (12-hour format with AM/PM)
  const formatTimeForDisplay = (isoString) => {
    if (!isoString) return "--:-- --";
    try {
      const date = new Date(isoString);
      if (isNaN(date.getTime())) {
        return "--:-- --";
      }
      return date.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: true
      });
    } catch (error) {
      console.error("Error formatting time:", error);
      return "--:-- --";
    }
  };

  // Convert ISO time to a format suitable for time input field
  const formatTimeForInput = (isoString) => {
    if (!isoString) return "";
    try {
      const date = new Date(isoString);
      if (isNaN(date.getTime())) {
        return "";
      }
      // Format in HH:MM format for the time input
      return date.toTimeString().slice(0, 5);
    } catch (error) {
      console.error("Error formatting time for input:", error);
      return "";
    }
  };

  // Handle time input changes
  const handleStartTimeChange = (e) => {
    const timeValue = e.target.value;
    if (!timeValue || !startDate) return;
    
    // Create a new date object using the startDate but with the new time
    const [hours, minutes] = timeValue.split(':').map(Number);
    const newStartTime = new Date(startDate);
    newStartTime.setHours(hours, minutes, 0, 0);
    
    // Check if this makes sense with the end time
    if (endTime) {
      const endDateTime = new Date(endTime);
      if (endDateTime <= newStartTime) {
        // If end time is now before or equal to start time, adjust end time to be 1 hour after start time
        const adjustedEndTime = new Date(newStartTime);
        adjustedEndTime.setHours(newStartTime.getHours() + 1);
        setEndTime(adjustedEndTime.toISOString());
      }
    }
    
    setStartTime(newStartTime.toISOString());
  };

  // Handle end time changes
  const handleEndTimeChange = (e) => {
    const timeValue = e.target.value;
    if (!timeValue || !endDate) return;
    
    // Create a new date object using the endDate but with the new time
    const [hours, minutes] = timeValue.split(':').map(Number);
    const newEndTime = new Date(endDate);
    newEndTime.setHours(hours, minutes, 0, 0);
    
    // Check if this time is after the start time
    if (startTime) {
      const startDateTime = new Date(startTime);
      if (newEndTime <= startDateTime) {
        toast.info("End time must be after start time.");
        return;
      }
    }
    
    setEndTime(newEndTime.toISOString());
  };

  return (
    <motion.div 
      className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4 backdrop-blur-sm"
      variants={overlayVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
    >
      <motion.form
        onSubmit={handleCreateOrUpdateSchedule}
        className={`rounded-xl shadow-xl w-full max-w-xl relative overflow-hidden ${
          isDarkMode ? 'bg-[#0e1022] text-[#e7e8f4]' : 'bg-white text-[#0b0c18]'
        }`}
        variants={modalVariants}
      >
        {/* Header */}
        <div className={`bg-gradient-to-r ${
            isDarkMode 
            ? 'from-[#191f8a] to-[#4750eb]' 
            : 'from-[#191d67] to-[#141db8]'
          } px-6 py-4 text-white flex justify-between items-center`}>
          <h2 className="text-xl font-bold flex items-center">
            {isEditing ? <FaCalendarAlt className="mr-2" /> : <FaCalendarPlus className="mr-2" />}
            {isEditing ? "Edit Schedule" : "Create Schedule"}
          </h2>
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => setShowForm(false)}
            className="text-white hover:text-gray-200 focus:outline-none"
            type="button"
          >
            <FaTimes className="h-5 w-5" />
          </motion.button>
        </div>

        {/* Form Body - Add max height and scrolling styles */}
        <div className="px-6 py-5 overflow-y-auto max-h-[calc(90vh-100px)] scrollbar-thin">
          {/* Schedule ID Display */}
          <div className="mb-5">
            <label className={`block mb-2 font-semibold ${isDarkMode ? 'text-[#e7e8f4]' : 'text-gray-700'}`}>
              Schedule ID:
            </label>
            <input
              type="text"
              value={scheduleID}
              readOnly
              className={`w-full px-4 py-2 rounded-lg border ${
                isDarkMode 
                ? 'bg-[#080917] border-[#1e2048] text-[#e7e8f4]' 
                : 'bg-gray-100 border-gray-300 text-gray-900'
              } focus:ring-2 cursor-not-allowed`}
            />
          </div>
          
          {/* Shift Type Selection */}
          <div className="mb-5">
            <label className={`block mb-2 font-semibold ${isDarkMode ? 'text-[#e7e8f4]' : 'text-gray-700'}`}>
              Shift Type:
            </label>
            <div className="grid grid-cols-2 gap-4">
              <motion.button
                type="button"
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => setShiftType("Day Shift")}
                className={`p-3 rounded-lg flex items-center justify-center ${
                  shiftType === "Day Shift"
                    ? isDarkMode 
                      ? 'bg-[#4750eb] text-white' 
                      : 'bg-[#141db8] text-white'
                    : isDarkMode 
                      ? 'bg-[#080917] border border-[#1e2048]' 
                      : 'bg-gray-100 text-gray-800'
                } ${scheduleStatus !== "Upcoming" ? 'opacity-60 cursor-not-allowed' : ''}`}
                disabled={scheduleStatus !== "Upcoming"}
              >
                <FaSun className="mr-2" /> Day Shift
              </motion.button>
              <motion.button
                type="button"
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => setShiftType("Night Shift")}
                className={`p-3 rounded-lg flex items-center justify-center ${
                  shiftType === "Night Shift"
                    ? isDarkMode 
                      ? 'bg-[#4750eb] text-white' 
                      : 'bg-[#141db8] text-white'
                    : isDarkMode 
                      ? 'bg-[#080917] border border-[#1e2048]' 
                      : 'bg-gray-100 text-gray-800'
                } ${scheduleStatus !== "Upcoming" ? 'opacity-60 cursor-not-allowed' : ''}`}
                disabled={scheduleStatus !== "Upcoming"}
              >
                <FaMoon className="mr-2" /> Night Shift
              </motion.button>
            </div>
            <div className="mt-2 text-sm">
              <span className={isDarkMode ? 'text-gray-400' : 'text-gray-500'}>
                {shiftType === "Day Shift" ? "8:00 AM - 5:00 PM" : "5:00 PM - 6:00 AM"}
              </span>
            </div>
          </div>

          {/* Date Selection */}
          <div className="grid grid-cols-2 gap-4 mb-5">
            <div>
              <label className={`block mb-2 font-semibold ${isDarkMode ? 'text-[#e7e8f4]' : 'text-gray-700'}`}>
                <FaCalendarAlt className="inline mr-2" />
                Start Date:
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className={`w-full px-4 py-2 rounded-lg border ${
                  isDarkMode 
                  ? 'bg-[#080917] border-[#1e2048] text-[#e7e8f4]' 
                  : 'bg-white border-gray-300 text-gray-900'
                } focus:ring-2 ${
                  isDarkMode ? 'focus:ring-[#4750eb]' : 'focus:ring-[#141db8]'
                } focus:border-transparent transition duration-200 ${
                  scheduleStatus !== "Upcoming" ? 'opacity-60 cursor-not-allowed' : ''
                }`}
                min={new Date().toISOString().split('T')[0]}
                required
                disabled={scheduleStatus !== "Upcoming"}
              />
            </div>
            <div>
              <label className={`block mb-2 font-semibold ${isDarkMode ? 'text-[#e7e8f4]' : 'text-gray-700'}`}>
                <FaCalendarAlt className="inline mr-2" />
                End Date:
              </label>
              <input
                type="date"
                value={endDate}
                onChange={handleEndDateChange}
                className={`w-full px-4 py-2 rounded-lg border ${
                  isDarkMode 
                  ? 'bg-[#080917] border-[#1e2048] text-[#e7e8f4]' 
                  : 'bg-white border-gray-300 text-gray-900'
                } focus:ring-2 ${
                  isDarkMode ? 'focus:ring-[#4750eb]' : 'focus:ring-[#141db8]'
                } focus:border-transparent transition duration-200 ${
                  scheduleStatus !== "Upcoming" ? 'opacity-60 cursor-not-allowed' : ''
                }`}
                min={shiftType === "Night Shift" ? 
                  // For night shift, min date is next day after start date
                  startDate ? new Date(new Date(startDate).setDate(new Date(startDate).getDate() + 1)).toISOString().split('T')[0] : 
                  // If no start date, use tomorrow
                  new Date(new Date().setDate(new Date().getDate() + 1)).toISOString().split('T')[0]
                  : 
                  // For day shift, min date is start date
                  startDate || new Date().toISOString().split('T')[0]
                }
                required
                disabled={scheduleStatus !== "Upcoming"}
              />
            </div>
          </div>

          {/* Time Input Fields - Now editable */}
          <div className="grid grid-cols-2 gap-4 mb-5">
            <div>
              <label className={`block mb-2 font-semibold ${isDarkMode ? 'text-[#e7e8f4]' : 'text-gray-700'}`}>
                <FaClock className="inline mr-2" />
                Start Time:
              </label>
              <input
                type="time"
                value={formatTimeForInput(startTime)}
                onChange={handleStartTimeChange}
                className={`w-full px-4 py-2 rounded-lg border ${
                  isDarkMode 
                  ? 'bg-[#080917] border-[#1e2048] text-[#e7e8f4]' 
                  : 'bg-white border-gray-300 text-gray-900'
                } ${scheduleStatus !== "Upcoming" ? 'opacity-60 cursor-not-allowed' : ''}`}
                disabled={scheduleStatus !== "Upcoming"}
              />
            </div>
            <div>
              <label className={`block mb-2 font-semibold ${isDarkMode ? 'text-[#e7e8f4]' : 'text-gray-700'}`}>
                <FaClock className="inline mr-2" />
                End Time:
              </label>
              <input
                type="time"
                value={formatTimeForInput(endTime)}
                onChange={handleEndTimeChange}
                className={`w-full px-4 py-2 rounded-lg border ${
                  isDarkMode 
                  ? 'bg-[#080917] border-[#1e2048] text-[#e7e8f4]' 
                  : 'bg-white border-gray-300 text-gray-900'
                } ${scheduleStatus !== "Upcoming" ? 'opacity-60 cursor-not-allowed' : ''}`}
                disabled={scheduleStatus !== "Upcoming"}
              />
            </div>
          </div>

          {/* Tanod Selection */}
          <div className="mb-5">
            <label className={`block mb-2 font-semibold ${isDarkMode ? 'text-[#e7e8f4]' : 'text-gray-700'}`}>
              <FaUsers className="inline mr-2" />
              Selected Tanods: {selectedTanods.length > 0 && <span className="ml-1 text-sm font-normal">({selectedTanods.length})</span>}
            </label>
            {/* Action buttons for adding/removing tanods */}
            <div className="flex space-x-3 mb-3"> 
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                type="button"
                onClick={() => setShowAddTanodModal(true)}
                className={`flex-1 py-2 px-4 rounded-lg flex items-center justify-center ${
                  isDarkMode 
                  ? 'bg-green-800 hover:bg-green-700 text-green-100' 
                  : 'bg-green-500 hover:bg-green-600 text-white'
                }`}
              >
                <FaUserPlus className="mr-2" />
                Add Tanods
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                type="button"
                onClick={() => setShowRemoveTanodModal(true)}
                className={`flex-1 py-2 px-4 rounded-lg flex items-center justify-center ${
                  isDarkMode 
                  ? 'bg-red-900 hover:bg-red-800 text-red-100' 
                  : 'bg-red-500 hover:bg-red-600 text-white'
                }`}
                disabled={selectedTanods.length === 0}
              >
                <FaUserMinus className="mr-2" />
                Remove Tanods
              </motion.button>
            </div>

            {/* Display selected tanods */}
            {selectedTanods.length > 0 ? (
              <div className={`p-3 rounded-lg border mb-2 max-h-40 overflow-y-auto ${
                isDarkMode 
                ? 'border-[#1e2048] bg-[#080917]' 
                : 'border-gray-200 bg-gray-50'
              }`}>
                <ul className="grid grid-cols-2 gap-2">
                  {selectedTanods.map((tanodId) => {
                    const tanod = tanods.find((t) => t._id === tanodId);
                    return tanod && (
                      <li key={tanodId} className="flex items-center">
                        {tanod?.profilePicture ? (
                          <img
                            src={tanod.profilePicture}
                            alt={tanod.firstName}
                            className="w-8 h-8 rounded-full mr-2 object-cover"
                          />
                        ) : (
                          <FaUserCircle className="w-8 h-8 text-gray-400 mr-2" />
                        )}
                        <span className="truncate text-sm">{tanod.firstName} {tanod.lastName}</span>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ) : (
              <div className={`flex flex-col items-center justify-center p-5 rounded-lg border mb-2 ${
                isDarkMode 
                ? 'border-[#1e2048] bg-[#080917] text-gray-500' 
                : 'border-gray-200 bg-gray-50 text-gray-400'
              }`}>
                <FaUsers className="text-3xl mb-2" />
                <p>No tanods selected</p>
                <p className="text-xs mt-1">Click "Add Tanods" to select personnel</p>
              </div>
            )}
          </div>

          {/* Form Action Buttons */}
          <div className="flex justify-end space-x-3 mt-8">
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              type="button"
              className={`px-5 py-2 rounded-lg ${
                isDarkMode 
                ? 'bg-[#080917] hover:bg-[#0d111f] text-[#989ce6] border border-[#1e2048]' 
                : 'bg-gray-200 hover:bg-gray-300 text-gray-800'
              }`}
              onClick={() => setShowForm(false)}
            >
              Cancel
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              type="submit"
              className={`px-5 py-2 rounded-lg ${
                isDarkMode 
                ? 'bg-[#4750eb] hover:bg-[#191f8a] text-white' 
                : 'bg-[#141db8] hover:bg-[#191d67] text-white'
              }`}
            >
              {isEditing ? "Update Schedule" : "Create Schedule"}
            </motion.button>
          </div>
        </div>
      </motion.form>
      <TanodModal
        showAddTanodModal={showAddTanodModal}
        setShowAddTanodModal={setShowAddTanodModal}
        showRemoveTanodModal={showRemoveTanodModal}
        setShowRemoveTanodModal={setShowRemoveTanodModal}
        tanods={tanods}
        selectedTanods={selectedTanods}
        handleToggleCheckbox={handleToggleCheckbox}
        handleAddSelectedTanods={handleAddSelectedTanods}
        handleRemoveSelectedTanods={handleRemoveSelectedTanods}
        checkedTanods={checkedTanods}
        isDarkMode={isDarkMode}
      />
    </motion.div>
  );
};

export default ScheduleForm;


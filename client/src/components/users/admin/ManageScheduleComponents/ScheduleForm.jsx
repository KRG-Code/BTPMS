import React, { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { motion, AnimatePresence } from "framer-motion";
import { FaUserCircle, FaTimes, FaCalendarPlus, FaCalendarAlt, FaUsers, FaUserPlus, FaUserMinus, FaClock } from 'react-icons/fa';
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

  useEffect(() => {
    if (isEditing && currentScheduleId) {
      const schedule = schedules.find((s) => s._id === currentScheduleId);
      if (schedule) {
        setScheduleStatus(schedule.status);
      }
    }
  }, [isEditing, currentScheduleId, schedules]);

  const handleCreateOrUpdateSchedule = async (e) => {
    e.preventDefault();

    // Validate that at least one Tanod is selected
    if (selectedTanods.length === 0) {
      toast.error("Please select at least one Tanod.");
      return; // Prevent form submission if no Tanod is selected
    }

    const token = localStorage.getItem("token");
    const url = isEditing
      ? `${process.env.REACT_APP_API_URL}/auth/schedule/${currentScheduleId}`
      : `${process.env.REACT_APP_API_URL}/auth/schedule`;

    try {
      const response = await axios({
        method: isEditing ? "put" : "post",
        url,
        data: { unit, tanods: selectedTanods, startTime, endTime },
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
      toast.error("Error creating/updating schedule.");
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
        <div className={`${
            isDarkMode 
            ? 'bg-gradient-to-r from-[#191f8a] to-[#4750eb]' 
            : 'bg-gradient-to-r from-[#191d67] to-[#141db8]'
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

        {/* Form Body */}
        <div className="px-6 py-5">
          {/* Unit Selection */}
          <div className="mb-5">
            <label className={`block mb-2 font-semibold ${isDarkMode ? 'text-[#e7e8f4]' : 'text-gray-700'}`}>
              Unit:
            </label>
            <select
              value={unit}
              onChange={(e) => setUnit(e.target.value)}
              className={`w-full px-4 py-2 rounded-lg border ${
                isDarkMode 
                ? 'bg-[#080917] border-[#1e2048] text-[#e7e8f4]' 
                : 'bg-white border-gray-300 text-gray-900'
              } focus:ring-2 ${
                isDarkMode ? 'focus:ring-[#4750eb]' : 'focus:ring-[#141db8]'
              } focus:border-transparent transition duration-200`}
            >
              <option value="Unit 1">Unit 1</option>
              <option value="Unit 2">Unit 2</option>
              <option value="Unit 3">Unit 3</option>
            </select>
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

          {/* Time Inputs */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
            <div>
              <label className={`block mb-2 font-semibold ${isDarkMode ? 'text-[#e7e8f4]' : 'text-gray-700'}`}>
                <FaClock className="inline mr-2" />
                Start Time:
              </label>
              <input
                type="datetime-local"
                value={
                  startTime
                    ? new Date(startTime).toLocaleString("sv").slice(0, 16)
                    : ""
                }
                onChange={(e) => setStartTime(e.target.value)}
                className={`w-full px-4 py-2 rounded-lg border ${
                  isDarkMode 
                  ? 'bg-[#080917] border-[#1e2048] text-[#e7e8f4]' 
                  : 'bg-white border-gray-300 text-gray-900'
                } focus:ring-2 ${
                  isDarkMode ? 'focus:ring-[#4750eb]' : 'focus:ring-[#141db8]'
                } focus:border-transparent transition duration-200 ${
                  scheduleStatus !== "Upcoming" ? 'opacity-60 cursor-not-allowed' : ''
                }`}
                min={isEditing ? originalStartTime : getMinDateTime()}
                required
                disabled={scheduleStatus !== "Upcoming"}
              />
            </div>
            <div>
              <label className={`block mb-2 font-semibold ${isDarkMode ? 'text-[#e7e8f4]' : 'text-gray-700'}`}>
                <FaClock className="inline mr-2" />
                End Time:
              </label>
              <input
                type="datetime-local"
                value={
                  endTime
                    ? new Date(endTime).toLocaleString("sv").slice(0, 16)
                    : ""
                }
                onChange={(e) => setEndTime(e.target.value)}
                className={`w-full px-4 py-2 rounded-lg border ${
                  isDarkMode 
                  ? 'bg-[#080917] border-[#1e2048] text-[#e7e8f4]' 
                  : 'bg-white border-gray-300 text-gray-900'
                } focus:ring-2 ${
                  isDarkMode ? 'focus:ring-[#4750eb]' : 'focus:ring-[#141db8]'
                } focus:border-transparent transition duration-200 ${
                  scheduleStatus !== "Upcoming" ? 'opacity-60 cursor-not-allowed' : ''
                }`}
                min={startTime || getMinDateTime()}
                required
                disabled={scheduleStatus !== "Upcoming"}
              />
            </div>
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


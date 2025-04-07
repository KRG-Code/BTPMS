import React, { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-toastify';
import axios from 'axios';
import { motion } from 'framer-motion';
import { FaMapMarkedAlt, FaCalendarAlt, FaSyncAlt, FaUsers, FaCheckCircle } from 'react-icons/fa';

const fadeIn = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.4 } }
};

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { 
    opacity: 1,
    transition: { 
      staggerChildren: 0.1,
      when: "beforeChildren"
    }
  }
};

const slideUp = {
  hidden: { y: 20, opacity: 0 },
  visible: i => ({ 
    y: 0, 
    opacity: 1, 
    transition: { delay: i * 0.1, duration: 0.5 } 
  })
};

const buttonScale = {
  hover: { scale: 1.05, transition: { duration: 0.2 } },
  tap: { scale: 0.95, transition: { duration: 0.1 } }
};

const PatrolScheduleManager = ({ polygons, isDarkMode }) => {
  const [schedules, setSchedules] = useState([]);
  const [selectedSchedule, setSelectedSchedule] = useState('');
  const [selectedArea, setSelectedArea] = useState('');
  const [loading, setLoading] = useState(false);
  const API_URL = process.env.REACT_APP_API_URL;

  // Memoize the fetchData function using useCallback
  const fetchData = useCallback(async () => {
    setLoading(true);
    const token = localStorage.getItem('token');
    if (!token) {
      toast.error('User is not authenticated.');
      setLoading(false);
      return;
    }

    try {
      // Corrected endpoint
      const scheduleResponse = await axios.get(`${API_URL}/auth/schedules`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const schedulesWithStatus = scheduleResponse.data.map((schedule) => {
        const currentTime = new Date();
        const startTime = new Date(schedule.startTime);
        const endTime = new Date(schedule.endTime);
        
        if (startTime > currentTime) {
          schedule.status = 'Upcoming';
        } else if (endTime < currentTime) {
          schedule.status = 'Completed';
        } else {
          schedule.status = 'Ongoing';
        }
        
        return schedule;
      });
      setSchedules(schedulesWithStatus);  // Store fetched schedules with status
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load schedules.');
    } finally {
      setLoading(false);
    }
  }, [API_URL]); // Add API_URL as dependency

  useEffect(() => {
    fetchData(); // Fetch schedules on initial load
  }, [fetchData]); 

  // Format the date and time (e.g., 2025-01-21T08:00:00Z to January 21, 2025, 08:00 AM)
  const formatDateTime = (dateTime) => {
    const date = new Date(dateTime);
    return {
      date: date.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }),
      time: date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
  };

  const handleAssignPatrolArea = async () => {
    if (!selectedSchedule || !selectedArea) {
      toast.error('Please select both a schedule and a patrol area.');
      return;
    }
  
    toast.info(
      <div>
        <p>Are you sure you want to assign this patrol area to the selected schedule?</p>
        <div className="flex justify-center mt-3 space-x-3">
          <button
            className={`px-4 py-2 rounded-lg ${isDarkMode ? 'bg-green-700 text-white' : 'bg-green-500 text-white'}`}
            onClick={() => confirmAssignPatrolArea()}
          >
            Yes
          </button>
          <button
            className={`px-4 py-2 rounded-lg ${isDarkMode ? 'bg-red-700 text-white' : 'bg-red-500 text-white'}`}
            onClick={() => toast.dismiss()}
          >
            No
          </button>
        </div>
      </div>,
      { autoClose: false }
    );
  };
  
  const confirmAssignPatrolArea = async () => {
    setLoading(true);
    const token = localStorage.getItem('token');
    if (!token) {
      toast.error('User is not authenticated.');
      setLoading(false);
      return;
    }
  
    try {
      const response = await axios.put(
        `${API_URL}/auth/schedule/${selectedSchedule}/patrol-area`,
        { patrolArea: selectedArea },
        { headers: { Authorization: `Bearer ${token}` } }
      );
  
      setSchedules((prev) =>
        prev.map((schedule) =>
          schedule._id === selectedSchedule ? { ...schedule, patrolArea: response.data.schedule.patrolArea } : schedule
        )
      );
  
      toast.dismiss();
      toast.success('Patrol area assigned successfully.');
      setSelectedSchedule('');
      setSelectedArea('');
      fetchData(); // Refresh the schedule list table
    } catch (error) {
      console.error('Error assigning patrol area:', error);
      toast.error('Failed to assign patrol area.');
    } finally {
      setLoading(false);
    }
  };

  const isAreaAvailable = (areaId, startTime, endTime) => {
    if (!startTime || !endTime) return true;
    return !schedules.some(schedule => 
      schedule.patrolArea && schedule.patrolArea._id === areaId &&
      ((new Date(schedule.startTime) < new Date(endTime) && new Date(schedule.endTime) > new Date(startTime)))
    );
  };

  // Get the selected schedule details
  const selectedScheduleDetails = selectedSchedule 
    ? schedules.find(schedule => schedule._id === selectedSchedule)
    : null;

  const getStatusBadgeColor = (status) => {
    if (isDarkMode) {
      switch(status) {
        case 'Upcoming': return 'bg-blue-900 text-blue-100';
        case 'Ongoing': return 'bg-green-900 text-green-100';
        case 'Completed': return 'bg-gray-700 text-gray-100';
        default: return 'bg-gray-700 text-gray-100';
      }
    } else {
      switch(status) {
        case 'Upcoming': return 'bg-blue-100 text-blue-800';
        case 'Ongoing': return 'bg-green-100 text-green-800';
        case 'Completed': return 'bg-gray-100 text-gray-800';
        default: return 'bg-gray-100 text-gray-800';
      }
    }
  };

  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className={`w-full h-full rounded-xl shadow-lg overflow-hidden border ${
        isDarkMode ? 'border-[#1e2048]' : 'border-gray-200'
      }`}
      style={{ display: 'flex', flexDirection: 'column', maxHeight: '100%' }}
    >
      <div className={`${
        isDarkMode 
          ? 'bg-gradient-to-r from-[#191f8a] to-[#4750eb]' 
          : 'bg-gradient-to-r from-[#191d67] to-[#141db8]'} px-6 py-4 text-white flex justify-between items-center flex-shrink-0`}>
        <h3 className="text-xl font-semibold flex items-center">
          <FaMapMarkedAlt className="mr-2" />
          Patrol Area Assignment
        </h3>
        <motion.button
          variants={buttonScale}
          whileHover="hover"
          whileTap="tap"
          onClick={fetchData}
          className={`p-2 rounded-full ${isDarkMode ? 'bg-[#080917] bg-opacity-30' : 'bg-white bg-opacity-20'}`}
          disabled={loading}
        >
          <FaSyncAlt className={`${loading ? 'animate-spin' : ''}`} />
        </motion.button>
      </div>

      <div 
        className="p-6 space-y-5 overflow-y-auto flex-grow"
        style={{ height: 'calc(100% - 64px)' }}
      >
        {/* Schedule Dropdown */}
        <motion.div 
          variants={slideUp} 
          custom={0}
          className="space-y-2"
        >
          <label className={`block font-medium ${isDarkMode ? 'text-[#e7e8f4]' : 'text-gray-700'}`}>
            <FaCalendarAlt className="inline mr-2" />
            Select Schedule:
          </label>
          <select
            value={selectedSchedule}
            onChange={(e) => setSelectedSchedule(e.target.value)}
            className={`w-full px-4 py-3 rounded-lg border ${
              isDarkMode 
              ? 'bg-[#080917] border-[#1e2048] text-[#e7e8f4]' 
              : 'bg-white border-gray-300 text-gray-800'
            } focus:ring-2 ${isDarkMode ? 'focus:ring-[#4750eb]' : 'focus:ring-blue-500'}`}
            disabled={loading}
          >
            <option value="" className={isDarkMode ? 'bg-[#080917] text-[#e7e8f4]' : ''}>-- Select a schedule --</option>
            {schedules.length > 0 ? (
              schedules
                .filter((schedule) => !schedule.patrolArea) // Exclude schedules with assigned patrol areas
                .map((schedule) => {
                  return (
                    <option 
                      key={schedule._id} 
                      value={schedule._id}
                      className={isDarkMode ? 'bg-[#080917] text-[#e7e8f4]' : ''}
                    >
                      {schedule.scheduleID} - {schedule.unit}
                    </option>
                  );
                })
            ) : null}
          </select>
        </motion.div>

        {/* Patrol Area Dropdown */}
        <motion.div 
          variants={slideUp} 
          custom={1}
          className="space-y-2"
        >
          <label className={`block font-medium ${isDarkMode ? 'text-[#e7e8f4]' : 'text-gray-700'}`}>
            <FaMapMarkedAlt className="inline mr-2" />
            Select Patrol Area:
          </label>
          <select
            value={selectedArea}
            onChange={(e) => setSelectedArea(e.target.value)}
            className={`w-full px-4 py-3 rounded-lg border ${
              isDarkMode 
              ? 'bg-[#080917] border-[#1e2048] text-[#e7e8f4]' 
              : 'bg-white border-gray-300 text-gray-800'
            } focus:ring-2 ${isDarkMode ? 'focus:ring-[#4750eb]' : 'focus:ring-blue-500'}`}
            disabled={!selectedSchedule || loading}
          >
            <option value="" className={isDarkMode ? 'bg-[#080917] text-[#e7e8f4]' : ''}>-- Select a patrol area --</option>
            {polygons.length > 0 ? (
              polygons
                .filter((polygon) => isAreaAvailable(
                  polygon._id,
                  selectedScheduleDetails?.startTime,
                  selectedScheduleDetails?.endTime
                ))
                .map((polygon) => (
                  <option 
                    key={polygon._id} 
                    value={polygon._id}
                    className={isDarkMode ? 'bg-[#080917] text-[#e7e8f4]' : ''}
                  >
                    {polygon.legend || 'Unnamed Area'}
                  </option>
                ))
            ) : null}
          </select>
        </motion.div>

        {/* Selected Schedule Details */}
        {selectedScheduleDetails && (
          <motion.div 
            variants={slideUp} 
            custom={2}
            className={`mt-4 p-4 rounded-lg ${
              isDarkMode ? 'bg-[#080917] border border-[#1e2048]' : 'bg-blue-50'
            }`}
          >
            <div className="flex items-center justify-between mb-3">
              <h4 className={`font-medium ${isDarkMode ? 'text-[#e7e8f4]' : 'text-blue-800'}`}>
                Schedule Details
              </h4>
              <span className={`px-3 py-1 text-xs font-medium rounded-full ${getStatusBadgeColor(selectedScheduleDetails.status)}`}>
                {selectedScheduleDetails.status}
              </span>
            </div>
            
            <div className={`space-y-2 ${isDarkMode ? 'text-[#989ce6]' : 'text-gray-700'}`}>
              <div className="flex items-center">
                <span className="font-medium w-24">Unit:</span>
                <span>{selectedScheduleDetails.unit}</span>
              </div>
              
              <div className="flex items-start">
                <span className="font-medium w-24">Members:</span>
                <div className="flex-1">
                  <div className="flex items-center">
                    <FaUsers className="mr-1" />
                    <span>{selectedScheduleDetails.tanods?.length || 0} members</span>
                  </div>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {selectedScheduleDetails.tanods?.map(tanod => (
                      <span key={tanod._id} className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded ${
                        isDarkMode ? 'bg-[#191f8a] text-[#e7e8f4]' : 'bg-blue-100 text-blue-800'
                      }`}>
                        {tanod.firstName} {tanod.lastName}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
              
              <div className="flex items-center">
                <span className="font-medium w-24">Time:</span>
                <div>
                  <div>
                    {formatDateTime(selectedScheduleDetails.startTime).date}
                  </div>
                  <div>
                    {formatDateTime(selectedScheduleDetails.startTime).time} - {formatDateTime(selectedScheduleDetails.endTime).time}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Assign Button */}
        <motion.div 
          variants={slideUp} 
          custom={3}
          className="flex justify-center pt-4"
        >
          <motion.button
            variants={buttonScale}
            whileHover="hover"
            whileTap="tap"
            onClick={handleAssignPatrolArea}
            disabled={!selectedSchedule || !selectedArea || loading}
            className={`px-5 py-2.5 rounded-lg flex items-center justify-center ${
              isDarkMode 
              ? 'bg-[#4750eb] hover:bg-[#191f8a] text-white' 
              : 'bg-[#141db8] hover:bg-[#191d67] text-white'
            } ${(!selectedSchedule || !selectedArea || loading) ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {loading ? (
              <>
                <FaSyncAlt className="animate-spin mr-2" />
                Processing...
              </>
            ) : (
              <>
                <FaCheckCircle className="mr-2" />
                Assign Patrol Area
              </>
            )}
          </motion.button>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default PatrolScheduleManager;

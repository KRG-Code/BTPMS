import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import { motion } from "framer-motion";
import { FaSearch, FaCalendarAlt, FaFilter, FaSyncAlt, FaEdit, FaTrash, FaUsers, FaMapMarkedAlt } from "react-icons/fa";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { 
    opacity: 1,
    transition: { 
      duration: 0.5,
      when: "beforeChildren",
      staggerChildren: 0.1
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0 }
};

const ScheduleList = ({
  schedules,
  setSchedules,
  setUnit,
  setSelectedTanods,
  setStartTime,
  setEndTime,
  setOriginalStartTime,
  setCurrentScheduleId,
  setIsEditing,
  setShowForm,
  fetchSchedules,
  handleViewMembers,
  handleDeleteSchedule,
  loadingSchedules,
  isDarkMode,
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterDate, setFilterDate] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [error, setError] = useState(null);

  const filteredSchedules = schedules.filter((schedule) => {
    const matchesSearchTerm = schedule.unit
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    const matchesFilterDate = filterDate
      ? new Date(schedule.startTime).toLocaleDateString() ===
        new Date(filterDate).toLocaleDateString()
      : true;
    const matchesFilterStatus = filterStatus
      ? schedule.status === filterStatus
      : true;
    return matchesSearchTerm && matchesFilterDate && matchesFilterStatus;
  });

  const handleRefresh = async () => {
    setError(null);
    try {
      await fetchSchedules();
    } catch (err) {
      setError("Failed to fetch schedules. Please try again later.");
    }
  };

  useEffect(() => {
    handleRefresh();
  }, []);

  // Status badge component
  const StatusBadge = ({ status }) => {
    let bgColor, textColor;
    
    if (isDarkMode) {
      switch (status) {
        case 'Upcoming':
          bgColor = 'bg-blue-900 text-blue-200';
          break;
        case 'Ongoing':
          bgColor = 'bg-green-900 text-green-200';
          break;
        case 'Completed':
          bgColor = 'bg-gray-800 text-gray-300';
          break;
        default:
          bgColor = 'bg-gray-800 text-gray-300';
      }
    } else {
      switch (status) {
        case 'Upcoming':
          bgColor = 'bg-blue-100 text-blue-800';
          break;
        case 'Ongoing':
          bgColor = 'bg-green-100 text-green-800';
          break;
        case 'Completed':
          bgColor = 'bg-gray-100 text-gray-800';
          break;
        default:
          bgColor = 'bg-gray-100 text-gray-800';
      }
    }
    
    return (
      <span className={`px-3 py-1 rounded-full text-xs font-medium ${bgColor}`}>
        {status}
      </span>
    );
  };

  // Add or update this function to properly format both start and end dates
  const formatScheduleDateRange = (schedule) => {
    const startDate = new Date(schedule.startTime);
    const endDate = new Date(schedule.endTime);
    
    // Format options for date display
    const dateOptions = { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    };
    
    const timeOptions = { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true
    };
    
    // Check if start and end dates are the same day
    const sameDay = startDate.toDateString() === endDate.toDateString();
    
    if (sameDay) {
      // Same day - show date once with start and end times
      return `${startDate.toLocaleDateString(undefined, dateOptions)}, ${startDate.toLocaleTimeString(undefined, timeOptions)} - ${endDate.toLocaleTimeString(undefined, timeOptions)}`;
    } else {
      // Different days - show full date and time for both start and end
      return `${startDate.toLocaleDateString(undefined, dateOptions)}, ${startDate.toLocaleTimeString(undefined, timeOptions)} - ${endDate.toLocaleDateString(undefined, dateOptions)}, ${endDate.toLocaleTimeString(undefined, timeOptions)}`;
    }
  };

  // Define the minimum number of schedules before enabling scrolling
  const MIN_SCHEDULES_FOR_SCROLL = 3;

  return (
    <motion.div 
      className="container mx-auto relative h-full flex flex-col"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <motion.div 
        className={`p-6 rounded-xl shadow-lg flex flex-col h-full ${
          isDarkMode ? 'bg-[#0e1022]' : 'bg-white'
        }`}
        variants={itemVariants}
      >
        <div className="flex flex-col md:flex-row justify-between items-end md:items-center gap-4 mb-6 flex-shrink-0">
          <motion.h2 
            className="text-xl font-bold"
            variants={itemVariants}
          >
            <FaCalendarAlt className={`inline mr-2 ${isDarkMode ? 'text-[#989ce6]' : 'text-[#141db8]'}`} />
            Schedule List
          </motion.h2>
          
          <div className="flex flex-wrap gap-3 md:flex-nowrap w-full md:w-auto">
            {/* Search Input */}
            <div className="relative w-full md:w-64">
              <FaSearch className={`absolute left-3 top-1/2 transform -translate-y-1/2 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`} />
              <input
                type="text"
                placeholder="Search by shift type or ID"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={`w-full py-2 pl-10 pr-4 rounded-lg border ${
                  isDarkMode 
                  ? 'bg-[#080917] border-[#1e2048] text-[#e7e8f4] placeholder-gray-500' 
                  : 'bg-white border-gray-200 text-black placeholder-gray-400'
                }`}
              />
            </div>

            {/* Date Filter */}
            <div className="relative w-full md:w-auto">
              <input
                type="date"
                value={filterDate}
                onChange={(e) => setFilterDate(e.target.value)}
                className={`w-full py-2 px-3 rounded-lg border ${
                  isDarkMode 
                  ? 'bg-[#080917] border-[#1e2048] text-[#e7e8f4]' 
                  : 'bg-white border-gray-200 text-black'
                }`}
              />
            </div>

            {/* Status Filter */}
            <div className="relative w-full md:w-auto">
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className={`w-full py-2 px-3 pr-8 rounded-lg border appearance-none ${
                  isDarkMode 
                  ? 'bg-[#080917] border-[#1e2048] text-[#e7e8f4]' 
                  : 'bg-white border-gray-200 text-black'
                }`}
              >
                <option value="">All Statuses</option>
                <option value="Upcoming">Upcoming</option>
                <option value="Ongoing">Ongoing</option>
                <option value="Completed">Completed</option>
              </select>
              <FaFilter className={`absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`} />
            </div>

            {/* Refresh Button */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleRefresh}
              className={`px-4 py-2 rounded-lg flex items-center ${
                isDarkMode 
                ? 'bg-[#191f8a] text-white hover:bg-[#4750eb]' 
                : 'bg-[#141db8] text-white hover:bg-[#191d67]'
              }`}
            >
              <FaSyncAlt className={`mr-2 ${loadingSchedules ? 'animate-spin' : ''}`} />
              Refresh
            </motion.button>
          </div>
        </div>

        <div className={`overflow-hidden rounded-lg border flex-grow ${
          isDarkMode ? 'border-[#1e2048]' : 'border-gray-200'
        }`}>
          <div 
            className={`overflow-x-auto ${filteredSchedules.length > MIN_SCHEDULES_FOR_SCROLL ? 'overflow-y-auto' : 'overflow-y-hidden'}`} 
            style={{ 
              maxHeight: filteredSchedules.length > MIN_SCHEDULES_FOR_SCROLL ? "calc(100vh - 200px)" : "none",
              height: "100%"
            }}
          >
            <table className="min-w-full divide-y divide-gray-200">
              <thead className={`${
                isDarkMode 
                ? 'bg-[#191f8a]' 
                : 'bg-[#191d67]'
              } text-white sticky top-0 z-10`}>
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                    Schedule ID
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                    Shift Type
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                    Period
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                    Patrol Area
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                    Status
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className={`${
                isDarkMode ? 'bg-[#0e1022] divide-y divide-[#1e2048]' : 'bg-white divide-y divide-gray-200'
              }`}>
                {loadingSchedules ? (
                  <tr>
                    <td colSpan="6" className="px-6 py-10 text-center">
                      <div className="flex justify-center">
                        <FaSyncAlt className={`animate-spin text-xl ${isDarkMode ? 'text-[#989ce6]' : 'text-[#141db8]'}`} />
                      </div>
                      <p className={`mt-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Loading schedules...</p>
                    </td>
                  </tr>
                ) : error ? (
                  <tr>
                    <td colSpan="6" className={`px-6 py-10 text-center ${isDarkMode ? 'text-red-400' : 'text-red-500'}`}>
                      {error}
                    </td>
                  </tr>
                ) : filteredSchedules.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="px-6 py-10 text-center">
                      <div className="flex flex-col items-center">
                        <FaCalendarAlt className={`text-5xl mb-2 ${isDarkMode ? 'text-gray-600' : 'text-gray-300'}`} />
                        <p className={`${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>No schedules found.</p>
                        {(searchTerm || filterDate || filterStatus) && (
                          <p className={`text-sm ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>Try adjusting your filters</p>
                        )}
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredSchedules.map((schedule) => (
                    <motion.tr 
                      key={schedule._id}
                      variants={itemVariants}
                      whileHover={{ backgroundColor: isDarkMode ? 'rgba(30, 32, 72, 0.3)' : 'rgba(243, 244, 246, 0.5)' }}
                      className="hover:shadow-sm transition-all"
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="font-semibold">{schedule.scheduleID || 'Not assigned'}</div>
                        <div className={`text-xs mt-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                          {schedule.tanods?.length || 0} members
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {schedule.unit}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {formatScheduleDateRange(schedule)}
                      </td>
                      <td className="px-6 py-4">
                        {schedule.patrolArea ? (
                          <div className="flex items-center">
                            <FaMapMarkedAlt className={`mr-2 ${isDarkMode ? 'text-[#989ce6]' : 'text-[#141db8]'}`} />
                            <span>{schedule.patrolArea.legend}</span>
                          </div>
                        ) : (
                          <span className={`${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>Not assigned</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <StatusBadge status={schedule.status} />
                      </td>
                      <td className="px-6 py-4 space-y-2 md:space-y-0 md:space-x-2 md:flex">
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          className={`px-3 py-1 rounded-lg flex items-center justify-center w-full md:w-auto ${
                            isDarkMode 
                              ? 'bg-blue-900 hover:bg-blue-800 text-blue-100' 
                              : 'bg-blue-100 hover:bg-blue-200 text-blue-800'
                          }`}
                          onClick={() => {
                            setCurrentScheduleId(schedule._id);
                            handleViewMembers(schedule);
                          }}
                        >
                          <FaUsers className="mr-1" />
                          Members
                        </motion.button>
                        
                        {schedule.status === 'Upcoming' && (
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            className={`px-3 py-1 rounded-lg flex items-center justify-center w-full md:w-auto ${
                              isDarkMode 
                                ? 'bg-amber-900 hover:bg-amber-800 text-amber-100' 
                                : 'bg-amber-100 hover:bg-amber-200 text-amber-800'
                            }`}
                            onClick={() => {
                              setUnit(schedule.unit);
                              setSelectedTanods(
                                schedule.tanods.map((tanod) => tanod._id)
                              );
                              setStartTime(schedule.startTime);
                              setEndTime(schedule.endTime);
                              setOriginalStartTime(
                                new Date(schedule.startTime)
                                  .toLocaleString("sv")
                                  .slice(0, 16)
                              );
                              setCurrentScheduleId(schedule._id);
                              setIsEditing(true);
                              setShowForm(true);
                            }}
                          >
                            <FaEdit className="mr-1" />
                            Edit
                          </motion.button>
                        )}
                        
                        {/* Removed Delete Button */}
                      </td>
                    </motion.tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default ScheduleList;

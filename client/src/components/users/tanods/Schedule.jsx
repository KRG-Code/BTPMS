import React, { useState, useEffect } from "react";
import axios from "axios";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "../../../contexts/ThemeContext";
import Loading from "../../../utils/Loading";
import {
  FaUserCircle,
  FaFilter,
  FaCalendarAlt,
  FaUsers,
  FaSearch,
  FaTimes,
  FaMapMarkerAlt,
  FaClock,
  FaCheckCircle,
  FaExclamationCircle,
  FaSpinner
} from "react-icons/fa";

// Animation variants
const fadeIn = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.4 } }
};

const slideUp = {
  hidden: { y: 20, opacity: 0 },
  visible: i => ({
    y: 0, 
    opacity: 1, 
    transition: { delay: i * 0.1, duration: 0.4 }
  })
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05
    }
  }
};

const tableRowVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3 } }
};

export default function TanodSchedule() {
  const [schedules, setSchedules] = useState([]);
  const [filteredSchedules, setFilteredSchedules] = useState([]);
  const [scheduleMembers, setScheduleMembers] = useState([]);
  const [showMembersTable, setShowMembersTable] = useState(false);
  const [userId, setUserId] = useState(null);
  const [loadingSchedules, setLoadingSchedules] = useState(false);
  const [loadingMembers, setLoadingMembers] = useState(false);
  
  // Filter states
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const { isDarkMode } = useTheme();
  const [showFilters, setShowFilters] = useState(false);
  const [selectedSchedule, setSelectedSchedule] = useState(null);

  // Theme-aware styles
  const cardBg = isDarkMode ? 'bg-gray-800' : 'bg-white';
  const textColor = isDarkMode ? 'text-gray-100' : 'text-gray-800';
  const subTextColor = isDarkMode ? 'text-gray-400' : 'text-gray-600';
  const borderColor = isDarkMode ? 'border-gray-700' : 'border-gray-200';
  const hoverBg = isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-50';
  const inputBg = isDarkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-200';
  const inputText = isDarkMode ? 'text-white placeholder:text-gray-400' : 'text-black placeholder:text-gray-500';
  const buttonPrimary = isDarkMode ? 'bg-blue-600 hover:bg-blue-700' : 'bg-blue-500 hover:bg-blue-600';
  const buttonSecondary = isDarkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300';
  const modalBg = isDarkMode ? 'bg-gray-900' : 'bg-white';

  const fetchUserProfile = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      toast.error("Please log in.");
      return null;
    }

    try {
      const response = await axios.get(`${process.env.REACT_APP_API_URL}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUserId(response.data._id);
      return response.data._id;
    } catch (error) {
      console.error("Error fetching user profile:", error);
      toast.error("Error fetching user profile.");
      return null;
    }
  };

  const sortSchedules = (schedules) => {
    const statusPriority = {
      'Ongoing': 1,
      'Upcoming': 2,
      'Completed': 3
    };

    return schedules.sort((a, b) => {
      // First, compare by status priority
      const statusDiff = statusPriority[a.status] - statusPriority[b.status];
      if (statusDiff !== 0) return statusDiff;

      // If same status, compare by date
      const dateA = new Date(a.startTime);
      const dateB = new Date(b.startTime);
      if (dateA !== dateB) return dateA - dateB;

      // If same date, compare by unit number
      const unitNumberA = parseInt(a.unit.split(' ')[1]);
      const unitNumberB = parseInt(b.unit.split(' ')[1]);
      return unitNumberA - unitNumberB;
    });
  };

  useEffect(() => {
    const fetchSchedules = async () => {
      const token = localStorage.getItem("token");
      const userId = await fetchUserProfile();
      if (!token || !userId) return;

      setLoadingSchedules(true);
      try {
        const response = await axios.get(
          `${process.env.REACT_APP_API_URL}/auth/tanod-schedules/${userId}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        const schedulesWithPatrolArea = await Promise.all(
          response.data.map(async (schedule) => {
            if (schedule.patrolArea && typeof schedule.patrolArea === 'object' && schedule.patrolArea._id) {
              const patrolAreaResponse = await axios.get(
                `${process.env.REACT_APP_API_URL}/polygons/${schedule.patrolArea._id}`,
                {
                  headers: { Authorization: `Bearer ${token}` },
                }
              );
              schedule.patrolArea = patrolAreaResponse.data;
            } else if (schedule.patrolArea) {
              const patrolAreaResponse = await axios.get(
                `${process.env.REACT_APP_API_URL}/polygons/${schedule.patrolArea}`,
                {
                  headers: { Authorization: `Bearer ${token}` },
                }
              );
              schedule.patrolArea = patrolAreaResponse.data;
            }
            return schedule;
          })
        );
        
        // Sort schedules with new sorting function
        const sortedSchedules = sortSchedules(schedulesWithPatrolArea);
        setSchedules(sortedSchedules);
        setFilteredSchedules(sortedSchedules);
        
      } catch (error) {
        console.error("Error fetching schedules:", error);
        toast.error("Error fetching schedules.");
      } finally {
        setLoadingSchedules(false);
      }
    };

    fetchSchedules();
  }, []);

  const handleViewMembers = async (scheduleId) => {
    const token = localStorage.getItem("token");
    
    setLoadingMembers(true);
    setShowMembersTable(true); // First show the modal with loading indicator
    
    try {
      // Find the schedule that was clicked
      const scheduleToShow = schedules.find(s => s._id === scheduleId);
      setSelectedSchedule(scheduleToShow);
      
      console.log("Fetching members for schedule:", scheduleId);
      
      // Fetch members data
      const response = await axios.get(
        `${process.env.REACT_APP_API_URL}/auth/schedule/${scheduleId}/members`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      console.log("API Response:", response.data);
      
      if (response.data && response.data.tanods) {
        setScheduleMembers(response.data.tanods);
        console.log("Members loaded:", response.data.tanods.length);
      } else {
        console.error("Invalid response format:", response.data);
        setScheduleMembers([]);
        toast.error("Invalid response format from server");
      }
    } catch (error) {
      console.error("Error fetching members:", error);
      toast.error("Error fetching team members.");
      setScheduleMembers([]);
    } finally {
      setLoadingMembers(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...schedules];

    // Apply date filter
    if (startDate && endDate) {
      filtered = filtered.filter(schedule => {
        const scheduleDate = new Date(schedule.startTime);
        const filterStartDate = new Date(startDate);
        const filterEndDate = new Date(endDate);
        return scheduleDate >= filterStartDate && scheduleDate <= filterEndDate;
      });
    }

    // Apply status filter
    if (statusFilter) {
      filtered = filtered.filter(schedule => schedule.status === statusFilter);
    }

    // Apply search query
    if (searchQuery) {
      filtered = filtered.filter(schedule => 
        schedule.unit.toLowerCase().includes(searchQuery.toLowerCase()) ||
        schedule.patrolArea?.legend.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Apply the new sorting
    filtered = sortSchedules(filtered);
    setFilteredSchedules(filtered);
  };

  useEffect(() => {
    applyFilters();
  }, [startDate, endDate, statusFilter, searchQuery]);

  const clearFilters = () => {
    setStartDate('');
    setEndDate('');
    setStatusFilter('');
    setSearchQuery('');
    setFilteredSchedules(schedules);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Upcoming':
        return isDarkMode ? 'text-blue-400' : 'text-blue-600';
      case 'Ongoing':
        return isDarkMode ? 'text-green-400' : 'text-green-600';
      case 'Completed':
        return isDarkMode ? 'text-gray-400' : 'text-gray-600';
      default:
        return isDarkMode ? 'text-gray-100' : 'text-black';
    }
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'Upcoming':
        return isDarkMode 
          ? 'bg-blue-900/30 text-blue-300 border-blue-700' 
          : 'bg-blue-100 text-blue-800 border-blue-200';
      case 'Ongoing':
        return isDarkMode 
          ? 'bg-green-900/30 text-green-300 border-green-700' 
          : 'bg-green-100 text-green-800 border-green-200';
      case 'Completed':
        return isDarkMode 
          ? 'bg-gray-700 text-gray-300 border-gray-600' 
          : 'bg-gray-100 text-gray-700 border-gray-200';
      default:
        return isDarkMode 
          ? 'bg-gray-700 text-gray-300 border-gray-600' 
          : 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'Upcoming':
        return <FaClock className="mr-1.5" />;
      case 'Ongoing':
        return <FaSpinner className="mr-1.5 animate-spin" />;
      case 'Completed':
        return <FaCheckCircle className="mr-1.5" />;
      default:
        return <FaExclamationCircle className="mr-1.5" />;
    }
  };

  // Mobile schedule card component
  const ScheduleCard = ({ schedule, onViewMembers }) => {
    return (
      <motion.div 
        variants={tableRowVariants}
        whileHover={{ scale: 1.01 }}
        className={`${cardBg} shadow-md rounded-xl overflow-hidden border ${borderColor} mb-4`}
      >
        <div className={`px-4 py-3 border-b ${borderColor} flex justify-between items-center`}>
          <div className="flex items-center">
            <span className={`font-medium ${textColor}`}>{schedule.unit}</span>
          </div>
          <span className={`px-3 py-1 rounded-full text-sm font-medium flex items-center ${getStatusBadgeClass(schedule.status)}`}>
            {getStatusIcon(schedule.status)} {schedule.status}
          </span>
        </div>
        
        <div className="p-4">
          <div className="mb-3">
            <div className="flex items-center mb-1">
              <FaCalendarAlt className={`mr-2 ${subTextColor}`} />
              <span className={`text-sm font-medium ${subTextColor}`}>Start Time</span>
            </div>
            <p className={`${textColor}`}>{formatDateTime(schedule.startTime)}</p>
          </div>
          
          <div className="mb-3">
            <div className="flex items-center mb-1">
              <FaClock className={`mr-2 ${subTextColor}`} />
              <span className={`text-sm font-medium ${subTextColor}`}>End Time</span>
            </div>
            <p className={`${textColor}`}>{formatDateTime(schedule.endTime)}</p>
          </div>
          
          <div className="mb-4">
            <div className="flex items-center mb-1">
              <FaMapMarkerAlt className={`mr-2 ${subTextColor}`} />
              <span className={`text-sm font-medium ${subTextColor}`}>Patrol Area</span>
            </div>
            <p className={`${textColor}`}>{schedule.patrolArea ? schedule.patrolArea.legend : "N/A"}</p>
          </div>
          
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onViewMembers(schedule._id)}
            className={`w-full py-2.5 px-4 rounded-lg ${buttonPrimary} text-white flex items-center justify-center`}
          >
            <FaUsers className="mr-2" /> View Members
          </motion.button>
        </div>
      </motion.div>
    );
  };

  // Loading skeleton for table
  const TableSkeleton = () => (
    <div className="animate-pulse">
      <div className={`h-10 ${isDarkMode ? 'bg-gray-700' : 'bg-gray-200'} rounded mb-4`}></div>
      {[...Array(3)].map((_, i) => (
        <div key={i} className={`h-16 ${isDarkMode ? 'bg-gray-700' : 'bg-gray-200'} rounded mb-3`}></div>
      ))}
    </div>
  );

  // Loading skeleton for cards
  const CardSkeleton = () => (
    <div className="animate-pulse">
      {[...Array(3)].map((_, i) => (
        <div key={i} className={`${isDarkMode ? 'bg-gray-700' : 'bg-gray-200'} rounded-xl h-44 mb-4`}></div>
      ))}
    </div>
  );

  const formatDateTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  return (
    <motion.div 
      initial="hidden"
      animate="visible"
      variants={fadeIn}
      className={`container mx-auto px-4 py-6 ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}`}
    >
      <ToastContainer position="top-right" theme={isDarkMode ? "dark" : "light"} />
      
      <motion.div variants={slideUp} custom={0}>
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
          <h1 className={`text-2xl font-bold mb-4 md:mb-0 ${textColor}`}>Your Patrol Schedule</h1>
          
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`px-4 py-2 rounded-lg flex items-center text-sm ${
              isDarkMode ? 'bg-gray-800 hover:bg-gray-700' : 'bg-white hover:bg-gray-100'
            } ${borderColor} shadow-sm`}
          >
            <FaFilter className="mr-2" />
            {showFilters ? 'Hide Filters' : 'Show Filters'}
          </button>
        </div>
      </motion.div>

      {/* Expandable Filters Section */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <motion.div 
              variants={staggerContainer}
              initial="hidden"
              animate="visible"
              className={`p-4 rounded-xl mb-6 ${cardBg} border ${borderColor} shadow-md`}
            >
              <motion.h2 
                variants={slideUp} 
                custom={0} 
                className={`text-lg font-semibold mb-4 flex items-center ${textColor}`}
              >
                <FaFilter className="mr-2" /> Filter Schedules
              </motion.h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <motion.div variants={slideUp} custom={1} className="flex flex-col">
                  <label className={`text-sm font-medium mb-1.5 ${subTextColor}`}>Search</label>
                  <div className="relative">
                    <FaSearch className="absolute left-3 top-2.5 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Unit or patrol area..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className={`w-full pl-9 pr-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${inputBg} ${inputText}`}
                    />
                  </div>
                </motion.div>
                
                <motion.div variants={slideUp} custom={2} className="flex flex-col">
                  <label className={`text-sm font-medium mb-1.5 ${subTextColor}`}>From Date</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${inputBg} ${inputText}`}
                  />
                </motion.div>
                
                <motion.div variants={slideUp} custom={3} className="flex flex-col">
                  <label className={`text-sm font-medium mb-1.5 ${subTextColor}`}>To Date</label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${inputBg} ${inputText}`}
                  />
                </motion.div>
                
                <motion.div variants={slideUp} custom={4} className="flex flex-col">
                  <label className={`text-sm font-medium mb-1.5 ${subTextColor}`}>Status</label>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${inputBg} ${inputText}`}
                  >
                    <option value="">All Status</option>
                    <option value="Upcoming">Upcoming</option>
                    <option value="Ongoing">Ongoing</option>
                    <option value="Completed">Completed</option>
                  </select>
                </motion.div>
              </div>
              
              <motion.div variants={slideUp} custom={5} className="flex justify-end mt-4">
                <button
                  onClick={clearFilters}
                  className={`px-4 py-2 rounded-lg text-sm flex items-center ${buttonSecondary} ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}
                >
                  <FaTimes className="mr-2" />
                  Clear Filters
                </button>
              </motion.div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Results section */}
      <motion.div variants={slideUp} custom={1}>
        <div className="flex items-center justify-between mb-4">
          <h2 className={`text-xl font-bold ${textColor}`}>Scheduled Patrols</h2>
          <span className={`text-sm ${subTextColor}`}>
            {filteredSchedules.length} {filteredSchedules.length === 1 ? 'schedule' : 'schedules'} found
          </span>
        </div>
      </motion.div>

      {/* Desktop Table View (hidden on mobile) */}
      <motion.div 
        variants={fadeIn}
        className="hidden md:block"
      >
        {loadingSchedules ? (
          <TableSkeleton />
        ) : filteredSchedules.length === 0 ? (
          <motion.div 
            variants={slideUp} 
            custom={3}
            className={`flex flex-col items-center justify-center p-8 rounded-xl ${cardBg} border ${borderColor}`}
          >
            <FaCalendarAlt size={48} className={`${subTextColor} mb-4`} />
            <p className={`${textColor} text-lg font-medium mb-2`}>No schedules found</p>
            <p className={`${subTextColor}`}>Try adjusting your filters or check back later</p>
          </motion.div>
        ) : (
          <motion.div 
            variants={staggerContainer}
            className={`overflow-hidden rounded-xl shadow-lg border ${borderColor}`}
          >
            <div className="overflow-x-auto">
              <table className={`min-w-full ${cardBg}`}>
                <thead className={`${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'} border-b ${borderColor}`}>
                  <tr>
                    <th className={`py-3.5 px-4 text-left text-sm font-medium ${subTextColor}`}>Unit</th>
                    <th className={`py-3.5 px-4 text-left text-sm font-medium ${subTextColor}`}>Start Time</th>
                    <th className={`py-3.5 px-4 text-left text-sm font-medium ${subTextColor}`}>End Time</th>
                    <th className={`py-3.5 px-4 text-left text-sm font-medium ${subTextColor}`}>Patrol Area</th>
                    <th className={`py-3.5 px-4 text-left text-sm font-medium ${subTextColor}`}>Status</th>
                    <th className={`py-3.5 px-4 text-right text-sm font-medium ${subTextColor}`}>Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  <AnimatePresence>
                    {filteredSchedules.map((schedule, index) => (
                      <motion.tr 
                        key={schedule._id}
                        variants={tableRowVariants}
                        initial="hidden"
                        animate="visible"
                        exit="hidden"
                        custom={index}
                        className={`${hoverBg} transition-colors`}
                      >
                        <td className={`py-4 px-4 whitespace-nowrap ${textColor}`}>{schedule.unit}</td>
                        <td className={`py-4 px-4 whitespace-nowrap ${textColor}`}>{formatDateTime(schedule.startTime)}</td>
                        <td className={`py-4 px-4 whitespace-nowrap ${textColor}`}>{formatDateTime(schedule.endTime)}</td>
                        <td className={`py-4 px-4 whitespace-nowrap ${textColor}`}>
                          {schedule.patrolArea ? schedule.patrolArea.legend : "N/A"}
                        </td>
                        <td className={`py-4 px-4 whitespace-nowrap`}>
                          <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${getStatusBadgeClass(schedule.status)}`}>
                            {getStatusIcon(schedule.status)} {schedule.status}
                          </span>
                        </td>
                        <td className="py-4 px-4 whitespace-nowrap text-right">
                          <motion.button
                            whileHover={{ scale: 1.03 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => handleViewMembers(schedule._id)}
                            className={`inline-flex items-center px-3 py-1.5 rounded-lg ${buttonPrimary} text-white text-sm`}
                          >
                            <FaUsers className="mr-1.5" /> View Members
                          </motion.button>
                        </td>
                      </motion.tr>
                    ))}
                  </AnimatePresence>
                </tbody>
              </table>
            </div>
          </motion.div>
        )}
      </motion.div>

      {/* Mobile Card View (hidden on desktop) */}
      <motion.div 
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
        className="md:hidden"
      >
        {loadingSchedules ? (
          <CardSkeleton />
        ) : filteredSchedules.length === 0 ? (
          <motion.div 
            variants={slideUp} 
            custom={3}
            className={`flex flex-col items-center justify-center p-8 rounded-xl ${cardBg} border ${borderColor}`}
          >
            <FaCalendarAlt size={40} className={`${subTextColor} mb-3`} />
            <p className={`${textColor} text-base font-medium mb-1`}>No schedules found</p>
            <p className={`${subTextColor} text-sm text-center`}>Try adjusting your filters or check back later</p>
          </motion.div>
        ) : (
          filteredSchedules.map((schedule, index) => (
            <ScheduleCard 
              key={schedule._id} 
              schedule={schedule} 
              onViewMembers={handleViewMembers}
            />
          ))
        )}
      </motion.div>

      {/* Modal for Viewing Members */}
      <AnimatePresence>
        {showMembersTable && selectedSchedule && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={(e) => {
              // Only close if the backdrop is clicked, not the modal itself
              if (e.target === e.currentTarget) {
                setShowMembersTable(false);
              }
            }}
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className={`${modalBg} rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden`}
            >
              {/* Modal Header */}
              <div className={`border-b ${borderColor} p-4`}>
                <div className="flex justify-between items-center">
                  <div>
                    <h2 className={`text-xl font-bold ${textColor}`}>Team Members</h2>
                    <p className={`${subTextColor} text-sm mt-1`}>
                      {selectedSchedule.unit} - {selectedSchedule.patrolArea?.legend || 'No area assigned'}
                    </p>
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setShowMembersTable(false)}
                    className={`rounded-full p-2 ${isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'} ${subTextColor}`}
                    aria-label="Close"
                  >
                    <FaTimes size={18} />
                  </motion.button>
                </div>
              </div>
              
              {/* Modal Body */}
              <div className={`p-4 overflow-y-auto max-h-[calc(90vh-120px)]`}>
                {loadingMembers ? (
                  <div className="flex flex-col items-center justify-center p-8">
                    <Loading type="spinner" />
                    <p className={`mt-4 ${textColor}`}>Loading team members...</p>
                  </div>
                ) : !scheduleMembers || scheduleMembers.length === 0 ? (
                  <div className="flex flex-col items-center justify-center p-8">
                    <FaUsers size={40} className={`${subTextColor} mb-3`} />
                    <p className={`${textColor} text-lg font-medium`}>No team members found</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {scheduleMembers.map((member, index) => (
                      <motion.div 
                        key={member._id || index}
                        variants={tableRowVariants}
                        initial="hidden"
                        animate="visible"
                        className={`${cardBg} rounded-xl overflow-hidden border ${borderColor} flex p-3`}
                      >
                        <div className="flex-shrink-0 mr-3">
                          {member.profilePicture ? (
                            <img
                              src={member.profilePicture}
                              alt={`${member.firstName}`}
                              className="w-14 h-14 rounded-full object-cover" 
                            />
                          ) : (
                            <div className={`w-14 h-14 rounded-full bg-gray-700 flex items-center justify-center`}>
                              <FaUserCircle className="w-10 h-10 text-gray-400" />
                            </div>
                          )}
                        </div>
                        <div>
                          <h3 className={`font-medium ${textColor}`}>{`${member.firstName || ''} ${member.lastName || ''}`}</h3>
                          <p className={`${subTextColor} text-sm mt-1`}>
                            {member.contactNumber || "No contact information"}
                          </p>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
              
              {/* Modal Footer */}
              <div className={`border-t ${borderColor} p-4 flex justify-end`}>
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setShowMembersTable(false)}
                  className={`${buttonSecondary} px-5 py-2 rounded-lg ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}
                >
                  Close
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

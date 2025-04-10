import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FaCarAlt, FaCalendarAlt, FaClock, FaMapMarkedAlt, FaRoute, FaSortAmountDown, FaFilter, FaCheck, FaTimes, FaRegClock, FaExclamationTriangle } from 'react-icons/fa';
import axios from 'axios';

const VehicleHistory = ({ 
  vehicleUsageHistory = [], // Default to empty array if undefined
  isDarkMode, 
  borderColor,
  textColor,
  subTextColor,
  refreshHistory 
}) => {
  // Add state for direct fetching of completed usages
  const [usageHistory, setUsageHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Add filter state
  const [statusFilter, setStatusFilter] = useState('all'); // 'all', 'completed', 'rejected'
  const [sortOrder, setSortOrder] = useState('desc'); // 'asc', 'desc'
  const [dateFilter, setDateFilter] = useState('');

  // Directly fetch completed vehicle usages on component mount
  useEffect(() => {
    fetchVehicleUsageHistory();
  }, []);
  
  // Function to fetch vehicle usage history directly
  const fetchVehicleUsageHistory = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const token = localStorage.getItem("token");
      const userId = localStorage.getItem("userId");
      
      if (!token || !userId) {
        throw new Error("Authentication required");
      }
      
      // Directly fetch from VehicleUsage table using the correct endpoint
      const apiUrl = process.env.REACT_APP_API_URL.replace(/\/$/, '');
      const response = await axios.get(
        `${apiUrl}/vehicles/usages/user/${userId}`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      
      if (Array.isArray(response.data)) {
        setUsageHistory(response.data);
      } else {
        console.warn("Unexpected data format:", response.data);
        setUsageHistory([]);
      }
    } catch (error) {
      console.error("Error fetching vehicle usage history:", error);
      setError("Failed to load vehicle usage history. Please try again.");
      setUsageHistory([]);
    } finally {
      setLoading(false);
    }
  };
  
  // Combine vehicleUsageHistory (passed as prop) with directly fetched usageHistory
  const combinedHistory = [
    ...(Array.isArray(vehicleUsageHistory) ? vehicleUsageHistory : []), 
    ...usageHistory
  ].reduce((acc, current) => {
    // Deduplicate by _id
    const exists = acc.find(item => item._id === current._id);
    if (!exists) {
      acc.push(current);
    }
    return acc;
  }, []);
  
  // Apply filters to history
  const filteredHistory = combinedHistory.filter(item => {
    // Only show completed usages - this is crucial
    if (item.status !== 'Completed') return false;
    
    // Apply date filter if present
    if (dateFilter) {
      const itemDate = new Date(item.date);
      const filterDate = new Date(dateFilter);
      if (itemDate.toDateString() !== filterDate.toDateString()) return false;
    }
    
    // Include the item if it passes all filters
    return true;
  });

  // Apply sorting
  const sortedHistory = [...filteredHistory].sort((a, b) => {
    const dateA = new Date(a.date || a.createdAt);
    const dateB = new Date(b.date || b.createdAt);
    return sortOrder === 'asc' ? dateA - dateB : dateB - dateA;
  });

  // Format date
  const formatDate = (date) => {
    if (!date) return 'N/A';
    const formattedDate = new Date(date);
    return formattedDate.toLocaleDateString() + ' ' + formattedDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };
  
  // Format duration between two dates
  const formatDuration = (startDate, endDate) => {
    if (!startDate || !endDate) return 'N/A';
    
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffMs = end - start;
    
    if (diffMs < 0) return 'Invalid time range';
    
    // Calculate hours, minutes
    const diffHrs = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMins = Math.round((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    
    if (diffHrs === 0) {
      return `${diffMins} minutes`;
    }
    
    return `${diffHrs} hr${diffHrs !== 1 ? 's' : ''} ${diffMins} min${diffMins !== 1 ? 's' : ''}`;
  };

  // Get status badge
  const getStatusBadge = (status) => {
    switch(status) {
      case 'Completed':
        return (
          <span className={`flex items-center text-xs px-2 py-0.5 rounded-full ${
            isDarkMode ? 'bg-green-900/30 text-green-300' : 'bg-green-100 text-green-800'
          }`}>
            <FaCheck className="mr-1" /> Completed
          </span>
        );
      default:
        return (
          <span className={`flex items-center text-xs px-2 py-0.5 rounded-full ${
            isDarkMode ? 'bg-gray-900/30 text-gray-300' : 'bg-gray-100 text-gray-800'
          }`}>
            {status || 'Unknown'}
          </span>
        );
    }
  };

  // Add a refresh button that will call the refresh function and also refresh directly
  const handleRefresh = () => {
    if (typeof refreshHistory === 'function') {
      refreshHistory();
    }
    fetchVehicleUsageHistory();
  };

  // Calculate mileage difference
  const getMileageDifference = (usage) => {
    if (!usage.startMileage || !usage.endMileage) return 'N/A';
    const difference = parseFloat(usage.endMileage) - parseFloat(usage.startMileage);
    return `${difference.toFixed(1)} km`;
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h3 className={`text-xl font-semibold ${textColor}`}>Vehicle Usage History</h3>
        
        <button 
          onClick={handleRefresh}
          className={`p-2 rounded-lg ${
            isDarkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300'
          }`}
          title="Refresh history"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
          </svg>
        </button>
      </div>
      
      {/* Filter controls */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <div className={`flex items-center border ${borderColor} rounded-lg overflow-hidden`}>
          <div className={`px-3 py-2 ${isDarkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
            <FaSortAmountDown className={subTextColor} />
          </div>
          <select 
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value)}
            className={`px-3 py-2 ${isDarkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-800'} border-0 focus:ring-0 focus:outline-none`}
          >
            <option value="desc">Newest First</option>
            <option value="asc">Oldest First</option>
          </select>
        </div>
        
        <div className={`flex items-center border ${borderColor} rounded-lg overflow-hidden`}>
          <div className={`px-3 py-2 ${isDarkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
            <FaCalendarAlt className={subTextColor} />
          </div>
          <input 
            type="date"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className={`px-3 py-2 ${isDarkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-800'} border-0 focus:ring-0 focus:outline-none`}
          />
        </div>
        
        {dateFilter && (
          <button
            onClick={() => {
              setDateFilter('');
            }}
            className={`px-3 py-2 rounded-lg text-sm ${
              isDarkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300'
            }`}
          >
            Clear Filters
          </button>
        )}
      </div>
      
      {loading ? (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : error ? (
        <div className={`p-6 text-center border ${borderColor} rounded-lg ${
          isDarkMode ? 'bg-red-900/30 text-red-300' : 'bg-red-50 text-red-700'
        }`}>
          <FaExclamationTriangle className="mx-auto text-4xl mb-2" />
          <p>{error}</p>
        </div>
      ) : sortedHistory.length === 0 ? (
        <div className={`p-6 text-center border ${borderColor} rounded-lg ${
          isDarkMode ? 'bg-gray-800' : 'bg-white'
        }`}>
          <FaCarAlt className={`mx-auto text-4xl mb-2 ${subTextColor}`} />
          <p className={subTextColor}>
            No completed vehicle usages found
          </p>
        </div>
      ) : (
        <div className="space-y-4 max-h-[600px] overflow-y-auto pr-1 scrollbar-thin">
          {sortedHistory.map((usage, index) => (
            <motion.div
              key={usage._id || index}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className={`border ${borderColor} rounded-lg overflow-hidden shadow-sm ${
                isDarkMode ? 'bg-gray-800' : 'bg-white'
              }`}
            >
              <div className={`p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 border-b ${borderColor}`}>
                <div className="flex items-center">
                  <div className={`w-10 h-10 rounded-lg overflow-hidden bg-gray-300 mr-3 flex-shrink-0 flex items-center justify-center`}>
                    {usage.vehicleId?.imageUrl ? (
                      <img 
                        src={usage.vehicleId.imageUrl} 
                        alt={usage.vehicleId.name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = 'https://placehold.co/40x40?text=Vehicle';
                        }}
                      />
                    ) : (
                      <FaCarAlt className={`text-xl ${isDarkMode ? 'text-gray-600' : 'text-gray-500'}`} />
                    )}
                  </div>
                  <div>
                    <h4 className={`font-medium ${textColor}`}>
                      {usage.vehicleId?.name || 'Vehicle'} ({usage.vehicleId?.licensePlate || 'N/A'})
                    </h4>
                    <div className="flex items-center text-xs mt-1">
                      <FaCalendarAlt className={`mr-1 ${subTextColor}`} />
                      <span className={subTextColor}>{formatDate(usage.date || usage.createdAt)}</span>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center">
                  {getStatusBadge('Completed')}
                </div>
              </div>
              
              <div className="p-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <div className={`text-xs ${subTextColor} mb-1 flex items-center`}>
                      <FaRoute className="mr-1" /> Destination
                    </div>
                    <div className={`text-sm ${textColor}`}>{usage.destination || 'N/A'}</div>
                  </div>
                  
                  <div>
                    <div className={`text-xs ${subTextColor} mb-1 flex items-center`}>
                      <FaMapMarkedAlt className="mr-1" /> Purpose
                    </div>
                    <div className={`text-sm ${textColor}`}>{usage.reason || 'N/A'}</div>
                  </div>
                  
                  <div>
                    <div className={`text-xs ${subTextColor} mb-1 flex items-center`}>
                      <FaRoute className="mr-1" /> Mileage Used
                    </div>
                    <div className={`text-sm ${textColor}`}>
                      {getMileageDifference(usage)}
                    </div>
                  </div>
                  
                  <div>
                    <div className={`text-xs ${subTextColor} mb-1 flex items-center`}>
                      <FaClock className="mr-1" /> Duration
                    </div>
                    <div className={`text-sm ${textColor}`}>
                      {formatDuration(usage.startTime || usage.date, usage.endDateTime || usage.completionDate)}
                    </div>
                  </div>
                  
                  <div>
                    <div className={`text-xs ${subTextColor} mb-1 flex items-center`}>
                      <FaCalendarAlt className="mr-1" /> Start Time
                    </div>
                    <div className={`text-sm ${textColor}`}>
                      {formatDate(usage.startTime || usage.date)}
                    </div>
                  </div>
                  
                  <div>
                    <div className={`text-xs ${subTextColor} mb-1 flex items-center`}>
                      <FaCalendarAlt className="mr-1" /> End Time
                    </div>
                    <div className={`text-sm ${textColor}`}>
                      {formatDate(usage.endDateTime || usage.completionDate)}
                    </div>
                  </div>
                  
                  {usage.notes && (
                    <div className="sm:col-span-2">
                      <div className={`text-xs ${subTextColor} mb-1 flex items-center`}>
                        <FaCheck className="mr-1" /> Notes
                      </div>
                      <div className={`text-sm p-2 rounded ${
                        isDarkMode ? 'bg-gray-700/50' : 'bg-gray-50'
                      } ${textColor}`}>
                        {usage.notes}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};

export default VehicleHistory;

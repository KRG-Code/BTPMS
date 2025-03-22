import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast, ToastContainer } from 'react-toastify'; 
import 'react-toastify/dist/ReactToastify.css'; 
import Loading from "../../../utils/Loading";
import { motion } from 'framer-motion';
import { useTheme } from "../../../contexts/ThemeContext"; // Import useTheme hook

// Animation variants
const fadeIn = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.6 } }
};

const slideUp = {
  hidden: { y: 20, opacity: 0 },
  visible: i => ({ 
    y: 0, 
    opacity: 1, 
    transition: { delay: i * 0.1, duration: 0.5 } 
  })
};

// Default stats object
const defaultStats = {
  totalPatrols: 0,
  completedPatrols: 0,
  ongoingPatrols: 0,
  totalIncidentResponses: 0,
  resolvedIncidents: 0,
  responseRate: 0,
  averageResponseTime: 0,
  lastPatrolDate: null,
  monthlyPatrols: [
    { name: 'Jan', count: 0 },
    { name: 'Feb', count: 0 },
    { name: 'Mar', count: 0 },
    { name: 'Apr', count: 0 },
    { name: 'May', count: 0 },
    { name: 'Jun', count: 0 }
  ],
  areasPatrolled: [],
};

// Header Component
function Header() {
  const { isDarkMode } = useTheme();
  
  return (
    <div className="flex justify-between items-center mb-8">
      <motion.h1 
        variants={slideUp}
        custom={0}
        className={`text-3xl font-bold ${isDarkMode ? 'text-gray-100' : 'text-gray-800'}`}
      >
        Performance Dashboard
      </motion.h1>
      <motion.div 
        variants={slideUp}
        custom={1}
        className={`text-sm ${isDarkMode ? 'bg-blue-700' : 'bg-blue-500'} text-white px-3 py-1 rounded-full shadow-md`}
      >
        Tanod
      </motion.div>
    </div>
  );
}

// User Profile Component
function UserProfile({ user, tanod, loadingUserProfile, loadingRatings, stats }) {
  const { isDarkMode } = useTheme();
  
  return (
    <motion.div 
      variants={slideUp} 
      custom={2}
      className={`rounded-xl ${isDarkMode ? 'bg-gray-800 shadow-gray-900/50' : 'bg-white'} shadow-lg overflow-hidden mb-8 transform transition-all duration-300 hover:shadow-xl`}
    >
      <div className={`${isDarkMode 
        ? 'bg-gradient-to-r from-blue-800 to-indigo-900' 
        : 'bg-gradient-to-r from-blue-500 to-indigo-600'} p-6 text-white`}>
        <div className="flex flex-col md:flex-row items-center gap-6">
          {/* Profile Picture with Ring Animation */}
          <div className="relative">
            {loadingUserProfile ? (
              <div className="w-28 h-28 rounded-full bg-blue-300 animate-pulse flex items-center justify-center">
                <Loading type="spinner" color="white" />
              </div>
            ) : (
              <img
                src={user.profilePicture || "/default-user-icon.png"}
                alt="User Profile"
                className="rounded-full w-28 h-28 object-cover border-4 border-white shadow-md"
              />
            )}
            <div className="absolute inset-0 rounded-full border-4 border-t-transparent border-blue-300 animate-spin opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          </div>
          
          {/* User Info */}
          <div className="flex-1">
            <h2 className="text-2xl font-bold tracking-tight">
              {loadingUserProfile ? "Loading..." : user.fullName}
            </h2>
            <p className="text-blue-100">Barangay Tanod</p>
            
            {/* Badges */}
            <div className="flex gap-2 mt-2">
              <span className={`${isDarkMode ? 'bg-blue-900' : 'bg-blue-700'} text-xs px-2 py-1 rounded-full`}>Active</span>
              {stats.totalPatrols > 10 && (
                <span className={`${isDarkMode ? 'bg-green-800' : 'bg-green-600'} text-xs px-2 py-1 rounded-full`}>Experienced</span>
              )}
              {tanod.overallRating >= 4 && (
                <span className={`${isDarkMode ? 'bg-yellow-700' : 'bg-yellow-500'} text-xs px-2 py-1 rounded-full`}>Highly Rated</span>
              )}
            </div>
          </div>
          
          {/* Rating Summary */}
          <div className="flex flex-col md:flex-row gap-6 items-center mt-4 md:mt-0">
            {/* Overall Rating */}
            <div className="text-center">
              <div className="inline-flex items-center justify-center bg-white text-blue-600 rounded-full w-16 h-16 text-xl font-bold shadow-md">
                {loadingRatings ? "..." : tanod.overallRating}
              </div>
              <p className="text-sm mt-1">Overall Rating</p>
            </div>
            
            {/* Rating Distribution */}
            <div className="w-52">
              <h3 className="text-sm font-semibold mb-1">Rating Distribution</h3>
              {tanod.ratingCounts.map((count, index) => (
                <div key={index} className="flex items-center mb-1">
                  <span className="text-xs w-4">{index + 1}</span>
                  <div className="flex-1 mx-2 bg-blue-200 rounded-full h-2">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${(count / Math.max(...tanod.ratingCounts, 1)) * 100}%` }}
                      transition={{ duration: 1, delay: index * 0.1 }}
                      className="bg-white h-full rounded-full"
                    ></motion.div>
                  </div>
                  <span className="text-xs font-medium w-4">
                    {loadingRatings ? "..." : count}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// Performance Comparison Component
function PerformanceComparison({ comparisonData }) {
  const { isDarkMode } = useTheme();
  
  return (
    <motion.section 
      variants={slideUp}
      custom={3}
      className="mb-8"
    >
      <h2 className={`text-xl font-bold mb-4 ${isDarkMode ? 'text-gray-100' : 'text-gray-800'} flex items-center`}>
        <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 mr-2 ${isDarkMode ? 'text-blue-400' : 'text-blue-500'}`} viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M3 3a1 1 0 000 2h10a1 1 0 100-2H3zm0 4a1 1 0 000 2h6a1 1 0 100-2H3zm0 4a1 1 0 100 2h8a1 1 0 100-2H3z" clipRule="evenodd" />
        </svg>
        Performance Ranking
      </h2>
      <div className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow duration-300`}>
        <div className="flex flex-wrap items-center mb-4 gap-4">
          <div className={`text-lg font-medium ${isDarkMode ? 'text-gray-100' : 'text-gray-800'}`}>Comparing against</div>
          <div className={`px-4 py-2 ${isDarkMode ? 'bg-blue-900 text-blue-100' : 'bg-blue-100 text-blue-800'} rounded-full font-semibold`}>
            {comparisonData.totalTanods} active tanods
          </div>
        </div>
        
        <div className="space-y-6">
          {/* Patrol Activity Ranking */}
          <ComparisonItem
            title="Patrol Activity"
            rank={comparisonData.patrolsRank}
            percentile={comparisonData.patrolsPercentile}
            iconColor="blue"
            icon={<svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>}
          />
          
          {/* Incident Response Ranking */}
          <ComparisonItem
            title="Incident Response"
            rank={comparisonData.incidentsRank}
            percentile={comparisonData.incidentsPercentile}
            iconColor="green"
            icon={<svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 ${isDarkMode ? 'text-green-400' : 'text-green-600'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>}
            delay={0.2}
          />
          
          {/* Resident Ratings Ranking */}
          <ComparisonItem
            title="Resident Ratings"
            rank={comparisonData.ratingRank}
            percentile={comparisonData.ratingPercentile}
            iconColor="yellow"
            icon={<svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 ${isDarkMode ? 'text-yellow-400' : 'text-yellow-600'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
            </svg>}
            delay={0.4}
          />
        </div>
      </div>
    </motion.section>
  );
}

function ComparisonItem({ title, rank, percentile, iconColor, icon, delay = 0 }) {
  const { isDarkMode } = useTheme();
  
  const getIconBgColor = (color) => {
    const colorMap = {
      blue: isDarkMode ? 'bg-blue-900/50' : 'bg-blue-100',
      green: isDarkMode ? 'bg-green-900/50' : 'bg-green-100',
      yellow: isDarkMode ? 'bg-yellow-900/50' : 'bg-yellow-100',
    };
    return colorMap[color] || colorMap.blue;
  };
  
  const getProgressBarColor = (color) => {
    const colorMap = {
      blue: isDarkMode ? 'bg-blue-500' : 'bg-blue-600',
      green: isDarkMode ? 'bg-green-500' : 'bg-green-600',
      yellow: isDarkMode ? 'bg-yellow-500' : 'bg-yellow-600',
    };
    return colorMap[color] || colorMap.blue;
  };
  
  return (
    <div>
      <div className="flex justify-between mb-2">
        <div className="flex items-center">
          <div className={`h-10 w-10 ${getIconBgColor(iconColor)} rounded-full flex items-center justify-center mr-3`}>
            {icon}
          </div>
          <span className={`font-semibold ${isDarkMode ? 'text-gray-100' : 'text-gray-800'}`}>{title}</span>
        </div>
        <span className={`py-1 px-3 ${isDarkMode ? 'bg-gray-700' : 'bg-gray-100'} rounded-full text-sm font-medium`}>
          Rank: #{rank}
        </span>
      </div>
      <div className={`w-full ${isDarkMode ? 'bg-gray-700' : 'bg-gray-200'} rounded-full h-2.5 overflow-hidden`}>
        <motion.div 
          initial={{ width: 0 }}
          animate={{ width: `${percentile}%` }}
          transition={{ duration: 1.5, delay }}
          className={`${getProgressBarColor(iconColor)} h-2.5 rounded-full`}
        />
      </div>
      <div className={`text-xs text-right mt-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
        Better than {percentile}% of tanods
      </div>
    </div>
  );
}

// Attendance Stats Component
function AttendanceStats({ attendanceStats }) {
  const { isDarkMode } = useTheme();
  
  return (
    <motion.section 
      variants={slideUp}
      custom={4}
    >
      <h2 className={`text-xl font-bold mb-4 ${isDarkMode ? 'text-gray-100' : 'text-gray-800'} flex items-center`}>
        <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 mr-2 ${isDarkMode ? 'text-indigo-400' : 'text-indigo-500'}`} viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
        </svg>
        Patrol Attendance
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        {/* Attendance Rate Card */}
        <AttendanceCard 
          title="Attendance Rate"
          value={`${attendanceStats.attendanceRate}%`}
          subtitle={`${attendanceStats.attended} of ${attendanceStats.totalScheduled} patrols`}
          iconColor="indigo"
          icon={
            <svg xmlns="http://www.w3.org/2000/svg" className={`h-6 w-6 ${isDarkMode ? 'text-indigo-400' : 'text-indigo-600'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        />
        
        {/* On-Time Rate Card */}
        <AttendanceCard 
          title="On-Time Rate"
          value={`${attendanceStats.onTimeRate}%`}
          subtitle="Arrived on schedule"
          iconColor="green"
          icon={
            <svg xmlns="http://www.w3.org/2000/svg" className={`h-6 w-6 ${isDarkMode ? 'text-green-400' : 'text-green-600'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        />
        
        {/* Average Delay Card */}
        <AttendanceCard 
          title="Avg. Delay"
          value={`${attendanceStats.averageDelay} min`}
          subtitle="When arriving late"
          iconColor="red"
          icon={
            <svg xmlns="http://www.w3.org/2000/svg" className={`h-6 w-6 ${isDarkMode ? 'text-red-400' : 'text-red-600'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        />
      </div>
    </motion.section>
  );
}

function AttendanceCard({ title, value, subtitle, iconColor, icon }) {
  const { isDarkMode } = useTheme();
  
  const getIconBgColor = (color) => {
    const colorMap = {
      indigo: isDarkMode ? 'bg-indigo-900/30' : 'bg-indigo-100',
      green: isDarkMode ? 'bg-green-900/30' : 'bg-green-100',
      red: isDarkMode ? 'bg-red-900/30' : 'bg-red-100'
    };
    return colorMap[color] || colorMap.indigo;
  };
  
  return (
    <motion.div 
      whileHover={{ y: -5 }}
      className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} p-6 rounded-xl shadow-md flex items-center`}
    >
      <div className={`w-12 h-12 ${getIconBgColor(iconColor)} rounded-full flex items-center justify-center mr-4`}>
        {icon}
      </div>
      <div>
        <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>{title}</p>
        <p className={`text-2xl font-bold ${isDarkMode ? 'text-gray-100' : 'text-gray-800'}`}>{value}</p>
        <p className={`text-xs ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}>{subtitle}</p>
      </div>
    </motion.div>
  );
}

// Patrol Stats Component
function PatrolStats({ stats, loadingStats }) {
  const { isDarkMode } = useTheme();
  
  return (
    <motion.section 
      variants={slideUp}
      custom={5}
    >
      <h2 className={`text-xl font-bold mb-4 ${isDarkMode ? 'text-gray-100' : 'text-gray-800'} flex items-center`}>
        <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 mr-2 ${isDarkMode ? 'text-blue-400' : 'text-blue-500'}`} viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
        </svg>
        Patrol Performance
      </h2>
      {loadingStats ? (
        <div className="flex justify-center my-8">
          <Loading type="spinner" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <PatrolCard 
            title="Total Patrols" 
            value={stats.totalPatrols} 
            subtitle="All time"
            color="blue"
            icon={
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
              </svg>
            }
          />
          
          <PatrolCard 
            title="Completed" 
            value={stats.completedPatrols} 
            subtitle={`${((stats.completedPatrols / stats.totalPatrols) * 100).toFixed(1)}% completion`}
            color="green"
            icon={
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            }
          />
          
          <PatrolCard 
            title="Current" 
            value={stats.ongoingPatrols} 
            subtitle="In progress"
            color="purple"
            icon={
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            }
          />
          
          <PatrolCard 
            title="Last Patrol" 
            value={stats.lastPatrolDate ? new Date(stats.lastPatrolDate).toLocaleDateString() : 'N/A'} 
            subtitle="Most recent"
            color="amber"
            icon={
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            }
          />
        </div>
      )}
    </motion.section>
  );
}

function PatrolCard({ title, value, subtitle, color, icon }) {
  const { isDarkMode } = useTheme();
  
  const getCardBgClass = (color) => {
    const colorMap = {
      blue: isDarkMode ? 'from-blue-700 to-blue-900' : 'from-blue-500 to-blue-600',
      green: isDarkMode ? 'from-green-700 to-green-900' : 'from-green-500 to-green-600',
      purple: isDarkMode ? 'from-purple-700 to-purple-900' : 'from-purple-500 to-purple-600',
      amber: isDarkMode ? 'from-amber-700 to-amber-900' : 'from-amber-500 to-amber-600'
    };
    return colorMap[color] || colorMap.blue;
  };
  
  const getTextClass = (color) => {
    const colorMap = {
      blue: isDarkMode ? 'text-blue-200' : 'text-blue-100',
      green: isDarkMode ? 'text-green-200' : 'text-green-100',
      purple: isDarkMode ? 'text-purple-200' : 'text-purple-100',
      amber: isDarkMode ? 'text-amber-200' : 'text-amber-100'
    };
    return colorMap[color] || colorMap.blue;
  };
  
  return (
    <motion.div 
      whileHover={{ scale: 1.03 }}
      className={`bg-gradient-to-br ${getCardBgClass(color)} p-6 rounded-xl shadow-md text-white`}
    >
      <div className="flex justify-between items-start">
        <div>
          <p className={getTextClass(color)}>{title}</p>
          <p className="text-3xl font-bold">{value}</p>
          <p className={`text-xs mt-1 ${getTextClass(color)}`}>{subtitle}</p>
        </div>
        <div className="bg-white bg-opacity-20 p-2 rounded-lg">
          {icon}
        </div>
      </div>
    </motion.div>
  );
}

// Incident Stats Component
function IncidentStats({ stats }) {
  const { isDarkMode } = useTheme();
  
  return (
    <motion.section 
      variants={slideUp}
      custom={6}
      className="mb-8"
    >
      <h2 className={`text-xl font-bold mb-4 ${isDarkMode ? 'text-gray-100' : 'text-gray-800'} flex items-center`}>
        <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 mr-2 ${isDarkMode ? 'text-red-400' : 'text-red-500'}`} viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
        </svg>
        Incident Response
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {/* Total Responses Card */}
        <StatCard 
          title="Total Responses" 
          value={stats.totalIncidentResponses} 
          subtitle="Incidents handled all time"
          iconColor="red"
          icon={
            <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 ${isDarkMode ? 'text-red-400' : 'text-red-600'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          }
        />
        
        {/* Response Rate Card */}
        <StatCard 
          title="Response Rate" 
          value={`${stats.responseRate}%`} 
          subtitle="Average success rate"
          iconColor="blue"
          icon={
            <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          }
        />
        
        {/* Response Time Card */}
        <StatCard 
          title="Response Time" 
          value={`${stats.averageResponseTime} min`} 
          subtitle="Average time to respond"
          iconColor="green"
          icon={
            <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 ${isDarkMode ? 'text-green-400' : 'text-green-600'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        />
      </div>
    </motion.section>
  );
}

function StatCard({ title, value, subtitle, iconColor, icon }) {
  const { isDarkMode } = useTheme();
  
  const getIconBgColor = (color) => {
    const colorMap = {
      red: isDarkMode ? 'bg-red-900/30' : 'bg-red-100',
      blue: isDarkMode ? 'bg-blue-900/30' : 'bg-blue-100',
      green: isDarkMode ? 'bg-green-900/30' : 'bg-green-100',
    };
    return colorMap[color] || colorMap.blue;
  };
  
  return (
    <motion.div 
      whileHover={{ y: -5 }}
      className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl overflow-hidden shadow-md`}
    >
      <div className={`px-6 py-5 border-b ${isDarkMode ? 'border-gray-700' : 'border-gray-100'}`}>
        <div className="flex items-center">
          <div className={`w-10 h-10 ${getIconBgColor(iconColor)} rounded-full flex items-center justify-center mr-3`}>
            {icon}
          </div>
          <div>
            <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>{title}</p>
            <p className={`text-2xl font-bold ${isDarkMode ? 'text-gray-100' : 'text-gray-800'}`}>{value}</p>
          </div>
        </div>
      </div>
      <div className={`px-6 py-4 ${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
        <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>{subtitle}</p>
      </div>
    </motion.div>
  );
}

// Incident Type Breakdown Component
function IncidentTypeBreakdown({ incidentTypeData }) {
  const { isDarkMode } = useTheme();
  
  return (
    <motion.div 
      variants={slideUp}
      custom={7}
      className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} p-6 rounded-xl shadow-md mb-8`}
    >
      <h3 className={`text-lg font-semibold mb-6 flex items-center ${isDarkMode ? 'text-gray-100' : 'text-gray-800'}`}>
        <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 mr-2 ${isDarkMode ? 'text-indigo-400' : 'text-indigo-500'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
        </svg>
        Incident Type Breakdown
      </h3>
      <div className="space-y-4">
        {incidentTypeData.labels.map((label, index) => (
          <div key={index} className="flex items-center">
            <span className={`w-32 text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>{label}</span>
            <div className="flex-1 mx-4">
              <div className={`${isDarkMode ? 'bg-gray-700' : 'bg-gray-200'} rounded-full h-3`}>
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${(incidentTypeData.counts[index] / Math.max(...incidentTypeData.counts)) * 100}%` }}
                  transition={{ duration: 1, delay: 0.1 * index }}
                  className={`${isDarkMode ? 'bg-indigo-500' : 'bg-indigo-500'} h-full rounded-full`}
                />
              </div>
            </div>
            <span className={`w-8 text-right font-semibold ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>{incidentTypeData.counts[index]}</span>
          </div>
        ))}
      </div>
    </motion.div>
  );
}

// Monthly Activity Component
function MonthlyActivity({ monthlyPatrols }) {
  const { isDarkMode } = useTheme();
  
  return (
    <motion.div 
      variants={slideUp}
      custom={8}
      className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} p-6 rounded-xl shadow-md mb-8`}
    >
      <h3 className={`text-lg font-semibold mb-6 flex items-center ${isDarkMode ? 'text-gray-100' : 'text-gray-800'}`}>
        <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 mr-2 ${isDarkMode ? 'text-blue-400' : 'text-blue-500'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
        Monthly Patrol Activity
      </h3>
      <div className="space-y-4">
        {monthlyPatrols.map((month, index) => (
          <div key={index} className="flex items-center">
            <span className={`w-12 text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>{month.name}</span>
            <div className="flex-1 mx-4">
              <div className={`${isDarkMode ? 'bg-gray-700' : 'bg-gray-200'} rounded-full h-3`}>
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${(month.count / Math.max(...monthlyPatrols.map(m => m.count), 1)) * 100}%` }}
                  transition={{ duration: 1, delay: 0.1 * index }}
                  className={`${isDarkMode ? 'bg-blue-600' : 'bg-blue-500'} h-full rounded-full`}
                />
              </div>
            </div>
            <span className={`w-8 text-right font-semibold ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>{month.count}</span>
          </div>
        ))}
      </div>
    </motion.div>
  );
}

// Areas Patrolled Component
function AreasPatrolled({ areasPatrolled }) {
  const { isDarkMode } = useTheme();
  
  return (
    <motion.div 
      variants={slideUp}
      custom={9}
      className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} p-6 rounded-xl shadow-md mb-8`}
    >
      <h3 className={`text-lg font-semibold mb-6 flex items-center ${isDarkMode ? 'text-gray-100' : 'text-gray-800'}`}>
        <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 mr-2 ${isDarkMode ? 'text-green-400' : 'text-green-500'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
        </svg>
        Areas Patrolled
      </h3>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {areasPatrolled.map((area, index) => (
          <motion.div 
            key={index}
            whileHover={{ scale: 1.05 }}
            className={`p-4 rounded-lg ${isDarkMode 
              ? 'bg-gradient-to-br from-green-900/20 to-blue-900/20 border border-gray-700' 
              : 'bg-gradient-to-br from-green-50 to-blue-50 border border-blue-100'} flex flex-col`}
          >
            <h4 className={`font-medium ${isDarkMode ? 'text-gray-100' : 'text-gray-800'} mb-2 truncate`}>{area.name}</h4>
            <div className="mt-auto flex items-center">
              <div className={`${isDarkMode 
                ? 'bg-blue-900/50 text-blue-200' 
                : 'bg-blue-100 text-blue-800'} text-xs font-medium px-2.5 py-0.5 rounded-full`}>
                {area.patrolCount} {area.patrolCount === 1 ? 'patrol' : 'patrols'}
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}

// Equipment Stats Component
function EquipmentStats({ equipmentStats }) {
  const { isDarkMode } = useTheme();
  
  return (
    <motion.section 
      variants={slideUp}
      custom={10}
      className="mb-8"
    >
      <h2 className={`text-xl font-bold mb-4 ${isDarkMode ? 'text-gray-100' : 'text-gray-800'} flex items-center`}>
        <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 mr-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
        Equipment Management
      </h2>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {/* Equipment Stats Cards */}
        <EquipmentCard
          title="Total Equipment"
          value={equipmentStats.totalBorrowed}
          subtitle="Items borrowed all time"
          bgColor={isDarkMode ? "bg-gray-700" : "bg-gray-800"}
        />
        
        <EquipmentCard
          title="Currently Borrowed"
          value={equipmentStats.currentlyBorrowed}
          subtitle="Items not yet returned"
          bgColor={isDarkMode ? "bg-yellow-800" : "bg-yellow-600"}
        />
        
        <EquipmentCard
          title="Return Rate"
          value={`${equipmentStats.returnRate}%`}
          subtitle="Returned on time"
          bgColor={isDarkMode ? "bg-green-800" : "bg-green-600"}
        />
      </div>

      {/* Recent Equipment Table */}
      {equipmentStats.recentEquipment.length > 0 && (
        <EquipmentTable recentEquipment={equipmentStats.recentEquipment} />
      )}
    </motion.section>
  );
}

function EquipmentCard({ title, value, subtitle, bgColor }) {
  const { isDarkMode } = useTheme();
  
  return (
    <motion.div 
      whileHover={{ y: -5 }}
      className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl overflow-hidden shadow-md`}
    >
      <div className={`${bgColor} text-white px-6 py-4`}>
        <p className="font-semibold">{title}</p>
      </div>
      <div className="p-6">
        <p className={`text-3xl font-bold ${isDarkMode ? 'text-gray-100' : 'text-gray-800'}`}>{value}</p>
        <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'} mt-1`}>{subtitle}</p>
      </div>
    </motion.div>
  );
}

function EquipmentTable({ recentEquipment }) {
  const { isDarkMode } = useTheme();
  
  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6 }}
      className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl overflow-hidden shadow-md`}
    >
      <div className={`px-6 py-4 ${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'} border-b ${isDarkMode ? 'border-gray-600' : 'border-gray-200'}`}>
        <h3 className={`font-semibold ${isDarkMode ? 'text-gray-100' : 'text-gray-700'}`}>Recent Equipment Activity</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full">
          <thead>
            <tr className={isDarkMode ? 'bg-gray-700' : 'bg-gray-50'}>
              <th className={`px-6 py-3 text-left text-xs font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-500'} uppercase tracking-wider`}>Equipment</th>
              <th className={`px-6 py-3 text-left text-xs font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-500'} uppercase tracking-wider`}>Borrowed</th>
              <th className={`px-6 py-3 text-left text-xs font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-500'} uppercase tracking-wider`}>Status</th>
            </tr>
          </thead>
          <tbody className={`divide-y ${isDarkMode ? 'divide-gray-700' : 'divide-gray-200'}`}>
            {recentEquipment.map((item, index) => (
              <motion.tr 
                key={index}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ backgroundColor: isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.01)' }}
              >
                <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${isDarkMode ? 'text-gray-100' : 'text-gray-800'}`}>{item.name}</td>
                <td className={`px-6 py-4 whitespace-nowrap text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                  {new Date(item.borrowDate).toLocaleDateString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {item.returnDate ? (
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${isDarkMode 
                      ? 'bg-green-900/30 text-green-200'
                      : 'bg-green-100 text-green-800'}`}>
                      Returned {new Date(item.returnDate).toLocaleDateString()}
                    </span>
                  ) : (
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${isDarkMode 
                      ? 'bg-yellow-900/30 text-yellow-200'
                      : 'bg-yellow-100 text-yellow-800'}`}>
                      Not yet returned
                    </span>
                  )}
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>
    </motion.div>
  );
}

// Feedback Section Component
function FeedbackSection({ tanod, loadingComments }) {
  const { isDarkMode } = useTheme();
  
  return (
    <motion.section 
      variants={slideUp}
      custom={11}
      className="mb-8"
    >
      <h2 className={`text-xl font-bold mb-4 ${isDarkMode ? 'text-gray-100' : 'text-gray-800'} flex items-center`}>
        <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 mr-2 ${isDarkMode ? 'text-indigo-400' : 'text-indigo-500'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
        </svg>
        Residents' Feedback
      </h2>
      
      <div className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl shadow-md overflow-hidden`}>
        <div className={`${isDarkMode ? 'bg-indigo-900' : 'bg-indigo-600'} text-white py-4 px-6`}>
          <h3 className="text-lg font-semibold">Community Feedback</h3>
        </div>
        
        <div className="p-6">
          {loadingComments ? (
            <div className="flex justify-center py-8">
              <Loading type="spinner" />
            </div>
          ) : tanod.comments.length === 0 ? (
            <div className={`flex flex-col items-center justify-center py-12 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              <svg xmlns="http://www.w3.org/2000/svg" className={`h-16 w-16 mb-4 ${isDarkMode ? 'text-gray-600' : 'text-gray-300'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              <p className="text-center">No ratings and feedback yet.</p>
              <p className="text-sm mt-2 text-center">Feedback will appear here when residents rate your service.</p>
            </div>
          ) : (
            <ul className={`divide-y ${isDarkMode ? 'divide-gray-700' : 'divide-gray-200'}`}>
              {tanod.comments.map((commentData, index) => {
                const userName = commentData.fullName || "Anonymous";
                const ratingStars = "★".repeat(commentData.rating) + "☆".repeat(5 - commentData.rating);
                
                return (
                  <motion.li 
                    key={index}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="py-4"
                  >
                    <div className="flex space-x-3">
                      <div className="flex-shrink-0">
                        <div className={`h-10 w-10 rounded-full ${isDarkMode ? 'bg-indigo-900/60 text-indigo-300' : 'bg-indigo-100 text-indigo-500'} flex items-center justify-center font-medium`}>
                          {userName.charAt(0)}
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-medium ${isDarkMode ? 'text-gray-100' : 'text-gray-900'}`}>{userName}</p>
                        <p className="text-sm text-yellow-500">{ratingStars}</p>
                        <p className={`mt-1 text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>{commentData.comment}</p>
                        {commentData.createdAt && (
                          <p className={`mt-1 text-xs ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                            {new Date(commentData.createdAt).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                    </div>
                  </motion.li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </motion.section>
  );
}

// Main Performance Component
export default function Performance() {
  const { isDarkMode } = useTheme();
  const navigate = useNavigate();
  // User state
  const [user, setUser] = useState({
    profilePicture: null,
    fullName: "",
    userId: null,
  });
  
  // Tanod ratings state
  const [tanod, setTanod] = useState({
    profilePicture: null,
    overallRating: 0,
    ratingCounts: [0, 0, 0, 0, 0],
    comments: [],
  });

  // Loading states
  const [loadingRatings, setLoadingRatings] = useState(false);
  const [loadingUserProfile, setLoadingUserProfile] = useState(true);
  const [loadingComments, setLoadingComments] = useState(true);
  const [loadingStats, setLoadingStats] = useState(true);
  
  // Performance data states
  const [stats, setStats] = useState(defaultStats);
  const [incidentTypeData, setIncidentTypeData] = useState({
    labels: [],
    counts: []
  });
  const [attendanceStats, setAttendanceStats] = useState({
    totalScheduled: 0,
    attended: 0,
    attendanceRate: 0,
    onTimeRate: 0,
    averageDelay: 0
  });
  const [equipmentStats, setEquipmentStats] = useState({
    totalBorrowed: 0,
    currentlyBorrowed: 0,
    returnedOnTime: 0,
    returnRate: 0,
    recentEquipment: []
  });
  const [assistanceStats, setAssistanceStats] = useState({
    totalRequests: 0,
    approved: 0,
    rejected: 0,
    approvalRate: 0,
    avgResponseTime: 0
  });
  const [comparisonData, setComparisonData] = useState({
    patrolsRank: 0,
    patrolsPercentile: 0,
    incidentsRank: 0,
    incidentsPercentile: 0,
    ratingRank: 0,
    ratingPercentile: 0,
    totalTanods: 0
  });

  useEffect(() => {
    const fetchUserData = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        navigate("/login");
        return;
      }

      try {
        const response = await fetch(`${process.env.REACT_APP_API_URL}/auth/me`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const data = await response.json();
        if (response.ok) {
          setUser({
            profilePicture: data.profilePicture || null,
            fullName: `${data.firstName} ${data.lastName}`,
            userId: data._id,
          });
          setLoadingUserProfile(false);

          // Fetch user's performance data
          fetchTanodRatings(data._id);
          fetchPatrolStats(data._id);
          fetchIncidentStats(data._id);
          fetchIncidentTypeBreakdown(data._id);
          fetchAttendanceStats(data._id);
          fetchEquipmentStats(data._id);
          fetchAssistanceStats(data._id);
          fetchComparisonData(data._id);
        } else {
          toast.error(data.message || "Failed to load user data");
        }
      } catch (error) {
        toast.error("An error occurred while fetching user data.");
      }
    };
    
    fetchUserData();
  }, [navigate]);

  // Data fetching functions
  const fetchTanodRatings = async (tanodId) => {
    const token = localStorage.getItem("token");
    setLoadingRatings(true);

    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/auth/${tanodId}/ratings`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();
      if (response.ok) {
        setTanod(data);
      } else {
        toast.error(data.message || "Failed to load Tanod ratings");
      }
    } catch (error) {
      toast.error("An error occurred while fetching Tanod ratings.");
    } finally {
      setLoadingRatings(false);
      setLoadingComments(false); // Ensure loadingComments is set to false here
    }
  };

  const fetchPatrolStats = async (userId) => {
    const token = localStorage.getItem("token");
    setLoadingStats(true);
    
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/auth/${userId}/patrol-stats`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      if (response.ok) {
        const data = await response.json();
        setStats(prevStats => ({
          ...prevStats,
          ...data
        }));
      } else {
        toast.error("Failed to load patrol statistics");
      }
    } catch (error) {
      console.error("Error fetching patrol stats:", error);
      toast.error("Failed to load patrol statistics");
    } finally {
      setLoadingStats(false);
    }
  };

  const fetchIncidentStats = async (userId) => {
    const token = localStorage.getItem("token");
    
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/auth/${userId}/incident-stats`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      if (response.ok) {
        const data = await response.json();
        setStats(prevStats => ({
          ...prevStats,
          ...data
        }));
      } else {
        toast.error("Failed to load incident statistics");
      }
    } catch (error) {
      console.error("Error fetching incident stats:", error);
      toast.error("Failed to load incident statistics");
    }
  };

  const fetchIncidentTypeBreakdown = async (userId) => {
    const token = localStorage.getItem("token");
    
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/auth/${userId}/incident-types`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      if (response.ok) {
        const data = await response.json();
        setIncidentTypeData(data);
      } else {
        console.error("Failed to load incident type data");
        setIncidentTypeData({ labels: [], counts: [] });
      }
    } catch (error) {
      console.error("Error fetching incident type data:", error);
    }
  };

  const fetchAttendanceStats = async (userId) => {
    const token = localStorage.getItem("token");
    
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/auth/${userId}/attendance-stats`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      if (response.ok) {
        const data = await response.json();
        setAttendanceStats(data);
      } else {
        console.error("Failed to load attendance data");
        setAttendanceStats({
          totalScheduled: 0,
          attended: 0,
          attendanceRate: 0,
          onTimeRate: 0,
          averageDelay: 0
        });
      }
    } catch (error) {
      console.error("Error fetching attendance stats:", error);
    }
  };

  const fetchEquipmentStats = async (userId) => {
    const token = localStorage.getItem("token");
    
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/auth/${userId}/equipment-stats`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      if (response.ok) {
        const data = await response.json();
        setEquipmentStats(data);
      } else {
        console.error("Failed to load equipment data");
        setEquipmentStats({
          totalBorrowed: 0,
          currentlyBorrowed: 0,
          returnedOnTime: 0,
          returnRate: 0,
          recentEquipment: []
        });
      }
    } catch (error) {
      console.error("Error fetching equipment stats:", error);
    }
  };

  const fetchAssistanceStats = async (userId) => {
    const token = localStorage.getItem("token");
    
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/auth/${userId}/assistance-stats`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      if (response.ok) {
        const data = await response.json();
        setAssistanceStats(data);
      } else {
        console.error("Failed to load assistance request data");
        setAssistanceStats({
          totalRequests: 0,
          approved: 0,
          rejected: 0,
          approvalRate: 0,
          avgResponseTime: 0
        });
      }
    } catch (error) {
      console.error("Error fetching assistance stats:", error);
    }
  };

  const fetchComparisonData = async (userId) => {
    const token = localStorage.getItem("token");
    
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/auth/${userId}/performance-comparison`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      if (response.ok) {
        const data = await response.json();
        setComparisonData(data);
      } else {
        console.error("Failed to load performance comparison data");
        setComparisonData({
          patrolsRank: 0,
          patrolsPercentile: 0,
          incidentsRank: 0,
          incidentsPercentile: 0,
          ratingRank: 0,
          ratingPercentile: 0,
          totalTanods: 0
        });
      }
    } catch (error) {
      console.error("Error fetching comparison data:", error);
    }
  };

  return (
    <motion.div 
      initial="hidden"
      animate="visible"
      variants={fadeIn}
      className={`container mx-auto p-4 space-y-6 ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}`}
    >
      <ToastContainer position="top-right" theme={isDarkMode ? "dark" : "light"} />
      <Header />
      
      <UserProfile 
        user={user} 
        tanod={tanod} 
        loadingUserProfile={loadingUserProfile} 
        loadingRatings={loadingRatings}
        stats={stats}
      />
      
      <PerformanceComparison comparisonData={comparisonData} />
      
      <AttendanceStats attendanceStats={attendanceStats} />
      
      <PatrolStats stats={stats} loadingStats={loadingStats} />
      
      <IncidentStats stats={stats} />
      
      {incidentTypeData.labels.length > 0 && (
        <IncidentTypeBreakdown incidentTypeData={incidentTypeData} />
      )}
      
      <MonthlyActivity monthlyPatrols={stats.monthlyPatrols} />
      
      {stats.areasPatrolled && stats.areasPatrolled.length > 0 && (
        <AreasPatrolled areasPatrolled={stats.areasPatrolled} />
      )}
      
      <EquipmentStats equipmentStats={equipmentStats} />
      
      <FeedbackSection 
        tanod={tanod} 
        loadingComments={loadingComments} 
      />
    </motion.div>
  );
}
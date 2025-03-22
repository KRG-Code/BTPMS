import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import { FaTimes, FaShieldAlt, FaExclamationTriangle, FaTools, FaStar, FaCheckCircle, FaCalendarAlt, FaClock, FaChartPie, FaMapMarkedAlt, FaComments } from 'react-icons/fa';
import { toast } from 'react-toastify';
import axios from 'axios';

// Animation variants
const backdropVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
  exit: { opacity: 0 }
};

const modalVariants = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: { 
    opacity: 1,
    scale: 1,
    transition: { duration: 0.3 }
  },
  exit: { 
    opacity: 0,
    scale: 0.9,
    transition: { duration: 0.2 }
  }
};

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { 
    opacity: 1,
    transition: {
      when: "beforeChildren",
      staggerChildren: 0.1
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.3 }
  }
};

const TanodPerformance = ({ tanod, onClose, isDarkMode }) => {
  const [loading, setLoading] = useState(true);
  const [performanceData, setPerformanceData] = useState({
    patrolStats: {},
    incidentStats: {},
    attendanceStats: {},
    equipmentStats: {},
    incidentTypeBreakdown: { labels: [], counts: [] },
    performanceComparison: {}
  });
  const [ratingsData, setRatingsData] = useState({
    overallRating: "0.0",
    ratingCounts: [0, 0, 0, 0, 0],
    comments: []
  });

  // Fetch performance data for this tanod
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      try {
        // Fetch all the performance data in parallel
        const [
          patrolStats,
          incidentStats,
          attendanceStats,
          equipmentStats,
          incidentTypeBreakdown,
          performanceComparison,
          ratings
        ] = await Promise.all([
          axios.get(`${process.env.REACT_APP_API_URL}/auth/${tanod._id}/patrol-stats`, {
            headers: { Authorization: `Bearer ${token}` }
          }),
          axios.get(`${process.env.REACT_APP_API_URL}/auth/${tanod._id}/incident-stats`, {
            headers: { Authorization: `Bearer ${token}` }
          }),
          axios.get(`${process.env.REACT_APP_API_URL}/auth/${tanod._id}/attendance-stats`, {
            headers: { Authorization: `Bearer ${token}` }
          }),
          axios.get(`${process.env.REACT_APP_API_URL}/auth/${tanod._id}/equipment-stats`, {
            headers: { Authorization: `Bearer ${token}` }
          }),
          axios.get(`${process.env.REACT_APP_API_URL}/auth/${tanod._id}/incident-types`, {
            headers: { Authorization: `Bearer ${token}` }
          }),
          axios.get(`${process.env.REACT_APP_API_URL}/auth/${tanod._id}/performance-comparison`, {
            headers: { Authorization: `Bearer ${token}` }
          }),
          axios.get(`${process.env.REACT_APP_API_URL}/auth/${tanod._id}/rating`, {
            headers: { Authorization: `Bearer ${token}` }
          })
        ]);

        setPerformanceData({
          patrolStats: patrolStats.data,
          incidentStats: incidentStats.data,
          attendanceStats: attendanceStats.data,
          equipmentStats: equipmentStats.data,
          incidentTypeBreakdown: incidentTypeBreakdown.data,
          performanceComparison: performanceComparison.data
        });
        
        setRatingsData(ratings.data);
      } catch (error) {
        console.error('Error fetching performance data:', error);
        toast.error('Failed to load performance data');
      } finally {
        setLoading(false);
      }
    };

    if (tanod && tanod._id) {
      fetchData();
    }
  }, [tanod]);

  // Chart configuration for incident types
  const incidentTypeChartData = {
    labels: performanceData.incidentTypeBreakdown.labels,
    datasets: [
      {
        label: 'Incidents by Type',
        data: performanceData.incidentTypeBreakdown.counts,
        backgroundColor: [
          'rgba(255, 99, 132, 0.7)',
          'rgba(54, 162, 235, 0.7)',
          'rgba(255, 206, 86, 0.7)',
          'rgba(75, 192, 192, 0.7)',
          'rgba(153, 102, 255, 0.7)',
          'rgba(255, 159, 64, 0.7)',
          'rgba(199, 199, 199, 0.7)'
        ],
        borderWidth: 1
      }
    ]
  };

  // Chart configuration for monthly patrols
  const monthlyPatrolsData = {
    labels: (performanceData.patrolStats.monthlyPatrols || []).map(m => m.name),
    datasets: [
      {
        label: 'Patrols Completed',
        data: (performanceData.patrolStats.monthlyPatrols || []).map(m => m.count),
        backgroundColor: isDarkMode ? 'rgba(99, 102, 241, 0.7)' : 'rgba(54, 162, 235, 0.7)',
        borderColor: isDarkMode ? 'rgb(99, 102, 241)' : 'rgb(54, 162, 235)',
        borderWidth: 1
      }
    ]
  };

  // Ratings chart data
  const ratingsChartData = {
    labels: ['5 Stars', '4 Stars', '3 Stars', '2 Stars', '1 Star'],
    datasets: [
      {
        data: ratingsData.ratingCounts.slice().reverse(), // Reverse to have 5 stars first
        backgroundColor: [
          'rgba(16, 185, 129, 0.7)',  // 5 stars - green
          'rgba(59, 130, 246, 0.7)',   // 4 stars - blue
          'rgba(250, 204, 21, 0.7)',   // 3 stars - yellow
          'rgba(249, 115, 22, 0.7)',   // 2 stars - orange
          'rgba(239, 68, 68, 0.7)',    // 1 star - red
        ],
        borderColor: isDarkMode 
          ? ['#10b981', '#3b82f6', '#facc15', '#f97316', '#ef4444'] 
          : ['#059669', '#2563eb', '#eab308', '#ea580c', '#dc2626'],
        borderWidth: 1
      }
    ]
  };

  // Card component for displaying stats
  const StatCard = ({ title, value, subtitle, icon }) => {
    const getIconClass = () => {
      switch (title) {
        case 'Patrols':
          return isDarkMode ? 'text-blue-400' : 'text-blue-500';
        case 'Incidents':
          return isDarkMode ? 'text-orange-400' : 'text-orange-500';
        case 'Attendance':
          return isDarkMode ? 'text-green-400' : 'text-green-500';
        case 'Equipment':
          return isDarkMode ? 'text-purple-400' : 'text-purple-500';
        default:
          return isDarkMode ? 'text-indigo-400' : 'text-indigo-500';
      }
    };
    
    return (
      <motion.div
        variants={itemVariants}
        className={`rounded-xl shadow-lg p-6 ${isDarkMode ? 'bg-gray-800 text-white' : 'bg-white'}`}
      >
        <div className="flex items-center gap-4">
          <div className={`p-3 rounded-full ${isDarkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
            {icon}
          </div>
          <div>
            <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>{title}</p>
            <p className="text-2xl font-bold">{value}</p>
            {subtitle && <p className={`text-xs ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>{subtitle}</p>}
          </div>
        </div>
      </motion.div>
    );
  };

  // Component for ranking visualization
  const RankingIndicator = ({ rank, total, percentile }) => {
    const percentage = (rank / total) * 100;
    
    return (
      <div className="mb-4">
        <div className="flex justify-between mb-1 text-sm">
          <span>Rank: {rank} of {total}</span>
          <span className="font-medium">Top {percentile}%</span>
        </div>
        <div className={`w-full h-2 rounded-full ${isDarkMode ? 'bg-gray-700' : 'bg-gray-200'}`}>
          <div 
            className="h-full rounded-full bg-blue-500" 
            style={{ width: `${100 - percentage}%` }}
          />
        </div>
      </div>
    );
  };

  // Theme-aware styling
  const bgColor = isDarkMode ? 'bg-gray-900' : 'bg-gray-50';
  const textColor = isDarkMode ? 'text-white' : 'text-gray-800';
  const modalBgColor = isDarkMode ? 'bg-gray-800' : 'bg-white';
  const borderColor = isDarkMode ? 'border-gray-700' : 'border-gray-200';
  
  return (
    <motion.div
      className={`fixed inset-0 z-50 flex items-center justify-center p-4 ${bgColor} bg-opacity-80 backdrop-blur-sm overflow-y-auto`}
      variants={backdropVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
    >
      <motion.div
        className={`w-full max-w-5xl rounded-xl shadow-2xl overflow-hidden ${modalBgColor} ${textColor}`}
        variants={modalVariants}
        initial="hidden"
        animate="visible"
        exit="exit"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className={`px-6 py-4 border-b ${borderColor} flex justify-between items-center ${
          isDarkMode 
            ? 'bg-gradient-to-r from-[#191f8a] to-[#4750eb]' 
            : 'bg-gradient-to-r from-blue-600 to-blue-400'
        } text-white`}>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <FaChartPie />
            Performance Dashboard: {tanod.firstName} {tanod.lastName}
          </h2>
          <button
            onClick={onClose}
            className="text-white hover:text-gray-200 transition-colors"
          >
            <FaTimes size={20} />
          </button>
        </div>
        
        {/* Modal Body */}
        <div className="p-6 max-h-[80vh] overflow-y-auto">
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
          ) : (
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="space-y-8"
            >
              {/* Stats Overview */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard 
                  title="Patrols"
                  value={performanceData.patrolStats.totalPatrols || 0}
                  subtitle={`${performanceData.patrolStats.completedPatrols || 0} completed`}
                  icon={<FaShieldAlt className={isDarkMode ? 'text-blue-400' : 'text-blue-500'} size={20} />}
                />
                <StatCard 
                  title="Incidents"
                  value={performanceData.incidentStats.totalIncidentResponses || 0}
                  subtitle={`${performanceData.incidentStats.resolvedIncidents || 0} resolved`}
                  icon={<FaExclamationTriangle className={isDarkMode ? 'text-orange-400' : 'text-orange-500'} size={20} />}
                />
                <StatCard 
                  title="Attendance"
                  value={`${performanceData.attendanceStats.attendanceRate || 0}%`}
                  subtitle={`On-time rate: ${performanceData.attendanceStats.onTimeRate || 0}%`}
                  icon={<FaCalendarAlt className={isDarkMode ? 'text-green-400' : 'text-green-500'} size={20} />}
                />
                <StatCard 
                  title="Equipment"
                  value={performanceData.equipmentStats.totalBorrowed || 0}
                  subtitle={`${performanceData.equipmentStats.currentlyBorrowed || 0} current`}
                  icon={<FaTools className={isDarkMode ? 'text-purple-400' : 'text-purple-500'} size={20} />}
                />
              </div>
              
              {/* Performance Rankings */}
              <motion.div 
                variants={itemVariants} 
                className={`rounded-xl shadow-lg p-6 ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}
              >
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <FaCheckCircle className={isDarkMode ? 'text-green-400' : 'text-green-500'} />
                  Performance Rankings
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <h4 className={`text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                      Patrol Performance
                    </h4>
                    <RankingIndicator 
                      rank={performanceData.performanceComparison.patrolsRank || 0}
                      total={performanceData.performanceComparison.totalTanods || 0}
                      percentile={performanceData.performanceComparison.patrolsPercentile || 0}
                    />
                  </div>
                  
                  <div>
                    <h4 className={`text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                      Incident Response
                    </h4>
                    <RankingIndicator 
                      rank={performanceData.performanceComparison.incidentsRank || 0}
                      total={performanceData.performanceComparison.totalTanods || 0}
                      percentile={performanceData.performanceComparison.incidentsPercentile || 0}
                    />
                  </div>
                  
                  <div>
                    <h4 className={`text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                      Rating Performance
                    </h4>
                    <RankingIndicator 
                      rank={performanceData.performanceComparison.ratingRank || 0}
                      total={performanceData.performanceComparison.totalTanods || 0}
                      percentile={performanceData.performanceComparison.ratingPercentile || 0}
                    />
                  </div>
                </div>
              </motion.div>
              
              {/* Charts Row */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Incident Types Chart */}
                <motion.div 
                  variants={itemVariants} 
                  className={`rounded-xl shadow-lg p-6 ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}
                >
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <FaChartPie className={isDarkMode ? 'text-orange-400' : 'text-orange-500'} />
                    Incidents by Type
                  </h3>
                  
                  <div className="h-64">
                    {performanceData.incidentTypeBreakdown.labels?.length > 0 ? (
                      <Doughnut 
                        data={incidentTypeChartData}
                        options={{
                          responsive: true,
                          maintainAspectRatio: false,
                          plugins: {
                            legend: {
                              position: 'bottom',
                              labels: {
                                color: isDarkMode ? '#e5e7eb' : '#374151',
                                padding: 20
                              }
                            }
                          }
                        }}
                      />
                    ) : (
                      <div className="h-full flex items-center justify-center">
                        <p className={isDarkMode ? 'text-gray-400' : 'text-gray-500'}>No incident data available</p>
                      </div>
                    )}
                  </div>
                </motion.div>
                
                {/* Monthly Patrols Chart */}
                <motion.div 
                  variants={itemVariants} 
                  className={`rounded-xl shadow-lg p-6 ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}
                >
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <FaCalendarAlt className={isDarkMode ? 'text-blue-400' : 'text-blue-500'} />
                    Monthly Patrol Activity
                  </h3>
                  
                  <div className="h-64">
                    {performanceData.patrolStats.monthlyPatrols?.length > 0 ? (
                      <Bar 
                        data={monthlyPatrolsData}
                        options={{
                          responsive: true,
                          maintainAspectRatio: false,
                          plugins: {
                            legend: {
                              display: false
                            }
                          },
                          scales: {
                            y: {
                              beginAtZero: true,
                              ticks: {
                                color: isDarkMode ? '#e5e7eb' : '#374151',
                                precision: 0
                              },
                              grid: {
                                color: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'
                              }
                            },
                            x: {
                              ticks: {
                                color: isDarkMode ? '#e5e7eb' : '#374151'
                              },
                              grid: {
                                color: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'
                              }
                            }
                          }
                        }}
                      />
                    ) : (
                      <div className="h-full flex items-center justify-center">
                        <p className={isDarkMode ? 'text-gray-400' : 'text-gray-500'}>No patrol data available</p>
                      </div>
                    )}
                  </div>
                </motion.div>
              </div>
              
              {/* Detailed Stats */}
              <motion.div 
                variants={itemVariants} 
                className={`rounded-xl shadow-lg p-6 ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}
              >
                <h3 className="text-lg font-semibold mb-4">Detailed Performance Metrics</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {/* Attendance Stats */}
                  <div className={`p-4 rounded-lg ${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                    <h4 className="font-medium mb-3 flex items-center gap-2">
                      <FaCalendarAlt className={isDarkMode ? 'text-green-400' : 'text-green-500'} />
                      Attendance
                    </h4>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className={isDarkMode ? 'text-gray-400' : 'text-gray-500'}>Total Scheduled:</span>
                        <span className="font-medium">{performanceData.attendanceStats.totalScheduled || 0}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className={isDarkMode ? 'text-gray-400' : 'text-gray-500'}>Attended:</span>
                        <span className="font-medium">{performanceData.attendanceStats.attended || 0}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className={isDarkMode ? 'text-gray-400' : 'text-gray-500'}>Attendance Rate:</span>
                        <span className="font-medium">{performanceData.attendanceStats.attendanceRate || 0}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className={isDarkMode ? 'text-gray-400' : 'text-gray-500'}>On-Time Rate:</span>
                        <span className="font-medium">{performanceData.attendanceStats.onTimeRate || 0}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className={isDarkMode ? 'text-gray-400' : 'text-gray-500'}>Avg. Delay:</span>
                        <span className="font-medium">{performanceData.attendanceStats.averageDelay || 0} min</span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Incident Stats */}
                  <div className={`p-4 rounded-lg ${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                    <h4 className="font-medium mb-3 flex items-center gap-2">
                      <FaExclamationTriangle className={isDarkMode ? 'text-orange-400' : 'text-orange-500'} />
                      Incident Response
                    </h4>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className={isDarkMode ? 'text-gray-400' : 'text-gray-500'}>Total Responses:</span>
                        <span className="font-medium">{performanceData.incidentStats.totalIncidentResponses || 0}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className={isDarkMode ? 'text-gray-400' : 'text-gray-500'}>Resolved:</span>
                        <span className="font-medium">{performanceData.incidentStats.resolvedIncidents || 0}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className={isDarkMode ? 'text-gray-400' : 'text-gray-500'}>Response Rate:</span>
                        <span className="font-medium">{performanceData.incidentStats.responseRate || 0}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className={isDarkMode ? 'text-gray-400' : 'text-gray-500'}>Avg. Response Time:</span>
                        <span className="font-medium">{performanceData.incidentStats.averageResponseTime || 0} min</span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Equipment Stats */}
                  <div className={`p-4 rounded-lg ${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                    <h4 className="font-medium mb-3 flex items-center gap-2">
                      <FaTools className={isDarkMode ? 'text-purple-400' : 'text-purple-500'} />
                      Equipment
                    </h4>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className={isDarkMode ? 'text-gray-400' : 'text-gray-500'}>Total Borrowed:</span>
                        <span className="font-medium">{performanceData.equipmentStats.totalBorrowed || 0}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className={isDarkMode ? 'text-gray-400' : 'text-gray-500'}>Currently Borrowed:</span>
                        <span className="font-medium">{performanceData.equipmentStats.currentlyBorrowed || 0}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className={isDarkMode ? 'text-gray-400' : 'text-gray-500'}>Returned On Time:</span>
                        <span className="font-medium">{performanceData.equipmentStats.returnedOnTime || 0}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className={isDarkMode ? 'text-gray-400' : 'text-gray-500'}>Return Rate:</span>
                        <span className="font-medium">{performanceData.equipmentStats.returnRate || 0}%</span>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
              
              {/* Areas Patrolled section */}
              {performanceData.patrolStats.areasPatrolled?.length > 0 && (
                <motion.div 
                  variants={itemVariants} 
                  className={`rounded-xl shadow-lg p-6 ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}
                >
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <FaMapMarkedAlt className={isDarkMode ? 'text-indigo-400' : 'text-indigo-500'} />
                    Areas Patrolled
                  </h3>
                  
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {performanceData.patrolStats.areasPatrolled.map((area, index) => (
                      <div 
                        key={index}
                        className={`p-3 rounded-lg ${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'} text-center`}
                      >
                        <p className="text-lg font-bold">{area.patrolCount}</p>
                        <p className={`text-sm truncate ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                          {area.name || "Unnamed Area"}
                        </p>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* New Ratings & Comments Section */}
              <motion.div 
                variants={itemVariants} 
                className={`rounded-xl shadow-lg p-6 ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}
              >
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <FaComments className={isDarkMode ? 'text-yellow-400' : 'text-yellow-500'} />
                  Ratings & Feedback
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Overall Rating */}
                  <div className="flex flex-col items-center justify-center p-6 border rounded-lg bg-opacity-50 bg-yellow-50 dark:bg-opacity-10 dark:bg-yellow-900 border-yellow-200 dark:border-yellow-800">
                    <div className="text-4xl font-bold mb-2 text-yellow-500">{ratingsData.overallRating}</div>
                    <div className="flex gap-1 mb-2">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <FaStar
                          key={star}
                          className={parseFloat(ratingsData.overallRating) >= star 
                            ? "text-yellow-500" 
                            : parseFloat(ratingsData.overallRating) >= star - 0.5 
                              ? "text-yellow-300" 
                              : "text-gray-300 dark:text-gray-600"}
                          size={20}
                        />
                      ))}
                    </div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {ratingsData.comments.length} {ratingsData.comments.length === 1 ? 'rating' : 'ratings'}
                    </p>
                  </div>
                  
                  {/* Rating Distribution */}
                  <div className="md:col-span-2">
                    <h4 className="text-sm font-medium mb-4">Rating Distribution</h4>
                    
                    {ratingsData.ratingCounts.reduce((a, b) => a + b, 0) > 0 ? (
                      <div className="md:w-3/4 mx-auto h-48">
                        <Doughnut
                          data={ratingsChartData}
                          options={{
                            responsive: true,
                            maintainAspectRatio: false,
                            cutout: '60%',
                            plugins: {
                              legend: {
                                position: 'right',
                                labels: {
                                  color: isDarkMode ? '#e5e7eb' : '#374151',
                                  padding: 20,
                                  font: {
                                    size: 12
                                  }
                                }
                              },
                              tooltip: {
                                callbacks: {
                                  label: (context) => {
                                    const label = context.label || '';
                                    const value = context.raw || 0;
                                    const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                    const percentage = Math.round((value / total) * 100);
                                    return `${label}: ${value} (${percentage}%)`;
                                  }
                                }
                              }
                            }
                          }}
                        />
                      </div>
                    ) : (
                      <div className="h-48 flex items-center justify-center">
                        <p className="text-gray-500 dark:text-gray-400">No ratings yet</p>
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Recent Comments */}
                <div className="mt-8">
                  <h4 className="text-md font-medium mb-4">Recent Comments</h4>
                  
                  {ratingsData.comments.length > 0 ? (
                    <div className="space-y-4 max-h-80 overflow-y-auto pr-2">
                      {ratingsData.comments.map((comment, index) => (
                        <div 
                          key={index} 
                          className={`p-4 rounded-lg shadow-sm ${
                            isDarkMode ? 'bg-gray-700' : 'bg-gray-50'
                          }`}
                        >
                          <div className="flex justify-between items-start">
                            <div className="flex gap-1 text-yellow-500 mb-1">
                              {Array.from({ length: 5 }).map((_, i) => (
                                <FaStar
                                  key={i}
                                  className={i < comment.rating ? "text-yellow-500" : "text-gray-300 dark:text-gray-600"}
                                  size={16}
                                />
                              ))}
                            </div>
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              {new Date(comment.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                          <p className={`mt-1 ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
                            {comment.comment}
                          </p>
                          <p className="mt-2 text-sm font-medium text-blue-500 dark:text-blue-400">
                            - {comment.fullName || "Anonymous"}
                          </p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="h-40 flex items-center justify-center border border-dashed rounded-lg border-gray-300 dark:border-gray-700">
                      <div className="text-center">
                        <FaComments className="mx-auto text-gray-400 dark:text-gray-600 mb-2" size={30} />
                        <p className="text-gray-500 dark:text-gray-400">No comments yet</p>
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            </motion.div>
          )}
        </div>
        
        {/* Modal Footer */}
        <div className={`border-t ${borderColor} p-4 flex justify-end`}>
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={onClose}
            className={`px-4 py-2 rounded-lg ${
              isDarkMode 
                ? 'bg-gray-700 hover:bg-gray-600 text-white' 
                : 'bg-gray-200 hover:bg-gray-300 text-gray-800'
            }`}
          >
            Close
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default TanodPerformance;

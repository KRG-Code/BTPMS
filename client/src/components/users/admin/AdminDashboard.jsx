import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Tooltip, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import 'chart.js/auto';
import { Line } from 'react-chartjs-2';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import { FaTrash, FaStar, FaStarHalfAlt, FaRegStar, FaUserCheck, FaMapMarkedAlt, FaUsers, FaUserClock, FaShieldAlt, FaRoute, FaExclamationTriangle, FaRegCalendarCheck } from 'react-icons/fa';
import axios from 'axios';
import { io } from 'socket.io-client';
import { toast } from 'react-toastify';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '../../../contexts/ThemeContext'; // Import useTheme hook

// Set the default icon for Leaflet markers
import L from 'leaflet';
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
  iconUrl: require('leaflet/dist/images/marker-icon.png'),
  shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
});

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
  }),
  hover: { 
    scale: 1.03, 
    boxShadow: "0 10px 20px rgba(0,0,0,0.1)",
    transition: { duration: 0.3 }
  }
};

// AdminDashboard component
const AdminDashboard = () => {
  const { isDarkMode } = useTheme(); // Use theme context
  const [mapCenter, setMapCenter] = useState([14.6760, 121.0453]);
  const [incidents, setIncidents] = useState([]);
  const [date, setDate] = useState(new Date());
  const [notes, setNotes] = useState([]);
  const [currentNote, setCurrentNote] = useState('');
  const [filterType, setFilterType] = useState('month');
  const [patrolAreas, setPatrolAreas] = useState([]);

  const [dashboardData, setDashboardData] = useState({
    patrolsScheduled: 0,
    incidentsResponded: 0, 
    totalPatrols: 0,
    activePatrols: 0,
    onlineTanods: 0,
    tanodsOnPatrol: 0,
    totalTanods: 0,
    availableTanods: 0,
    topPerformers: [],
    incidentStats: []
  });

  const [isLoading, setIsLoading] = useState(true);
  const [chartData, setChartData] = useState({
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
    datasets: []
  });

  // Update chart options with theme-aware colors
  const getChartOptions = () => ({
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          usePointStyle: true,
          boxWidth: 6,
          color: isDarkMode ? 'var(--text)' : 'var(--text)'
        }
      },
      tooltip: {
        backgroundColor: isDarkMode ? 'var(--secondary)' : 'var(--primary)',
        titleColor: 'var(--text-light)',
        bodyColor: 'var(--text-light)',
        padding: 10,
        cornerRadius: 6
      }
    },
    scales: {
      y: {
        grid: {
          drawBorder: false,
          color: isDarkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)'
        },
        ticks: {
          padding: 10,
          color: isDarkMode ? 'var(--text)' : 'var(--text)'
        }
      },
      x: {
        grid: {
          display: false,
        },
        ticks: {
          padding: 5,
          color: isDarkMode ? 'var(--text)' : 'var(--text)'
        }
      }
    }
  });

  // Existing fetchDashboardStats function
  const fetchDashboardStats = async () => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem('token');
      
      // Fetch users to get online tanods count
      const [statsRes, incidentsRes, usersRes] = await Promise.all([
        axios.get(
          `${process.env.REACT_APP_API_URL}/dashboard/stats`,
          { headers: { Authorization: `Bearer ${token}` } }
        ),
        axios.get(
          `${process.env.REACT_APP_API_URL}/incident-reports`,
          { headers: { Authorization: `Bearer ${token}` } }
        ),
        axios.get(
          `${process.env.REACT_APP_API_URL}/auth/users`,
          { headers: { Authorization: `Bearer ${token}` } }
        )
      ]);

      // Count online tanods
      const onlineTanods = usersRes.data.filter(user => 
        user.userType === 'tanod' && user.isOnline
      ).length;

      // Process incident data for chart
      const incidents = incidentsRes.data;
      const monthlyStats = {};
      incidents.forEach(incident => {
        const month = new Date(incident.date).getMonth();
        const type = incident.type;
        if (!monthlyStats[type]) {
          monthlyStats[type] = Array(12).fill(0);
        }
        monthlyStats[type][month]++;
      });

      // Update dashboard data with correct online tanods count
      setDashboardData(prev => ({
        ...prev,
        ...statsRes.data.data,
        onlineTanods,
        incidentsResolved: incidents.filter(i => i.status === 'Resolved').length,
        monthlyIncidents: monthlyStats
      }));

      // Update chart data with theme-aware colors
      setChartData({
        labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
        datasets: Object.entries(monthlyStats).map(([type, counts], index) => ({
          label: type,
          data: counts,
          backgroundColor: isDarkMode 
            ? `hsla(${index * 45}, 70%, 40%, 0.2)`
            : `hsla(${index * 45}, 70%, 60%, 0.2)`,
          borderColor: isDarkMode 
            ? `hsla(${index * 45}, 70%, 60%, 1)`
            : `hsla(${index * 45}, 70%, 50%, 1)`,
          borderWidth: 1,
          fill: true
        }))
      });

    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setIsLoading(false);
    }
  };

  // Existing useEffect for socket connections and data fetching
  useEffect(() => {
    const token = localStorage.getItem('token');
    const socket = io(process.env.REACT_APP_API_URL, {
      auth: { token },
      withCredentials: true
    });

    socket.on('connect', () => {
      console.log('Connected to socket');
      socket.emit('joinDashboard');
    });

    // Update when a user's online status changes
    socket.on('userStatusUpdate', ({ userId, isOnline, userType }) => {
      if (userType === 'tanod') {
        setDashboardData(prev => ({
          ...prev,
          onlineTanods: isOnline ? prev.onlineTanods + 1 : Math.max(0, prev.onlineTanods - 1)
        }));
      }
    });

    // Initial fetch
    fetchDashboardStats();

    // Refresh every 30 seconds
    const interval = setInterval(fetchDashboardStats, 30000);

    return () => {
      clearInterval(interval);
      socket.disconnect();
    };
  }, [isDarkMode]); // Add isDarkMode to dependencies to update chart colors on theme change

  // Function to handle date change on the calendar
  const handleDateChange = (newDate) => {
    setDate(newDate);
  };

  // Existing fetchNotes function
  const fetchNotes = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `${process.env.REACT_APP_API_URL}/notes`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setNotes(response.data);
    } catch (error) {
      console.error('Error fetching notes:', error);
      toast.error('Failed to fetch notes');
    }
  };

  // Existing fetchPatrolAreas function
  const fetchPatrolAreas = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `${process.env.REACT_APP_API_URL}/polygons`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setPatrolAreas(response.data);
    } catch (error) {
      console.error('Error fetching patrol areas:', error);
      toast.error('Failed to load patrol areas');
    }
  };

  // Existing useEffects for fetching notes and patrol areas
  useEffect(() => {
    fetchNotes();
  }, []);

  useEffect(() => {
    fetchPatrolAreas();
  }, []);

  // Existing addNote function
  const addNote = async () => {
    const formattedDate = date.toLocaleDateString();
    if (currentNote.trim()) {
      try {
        const token = localStorage.getItem('token');
        const response = await axios.post(
          `${process.env.REACT_APP_API_URL}/notes`,
          {
            date: formattedDate,
            note: currentNote
          },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        
        setNotes(response.data); // Update with the new notes array
        setCurrentNote('');
        toast.success('Note added successfully');
      } catch (error) {
        console.error('Error saving note:', error);
        toast.error('Failed to save note');
      }
    }
  };

  // Existing deleteNote function
  const deleteNote = async (noteId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.delete(
        `${process.env.REACT_APP_API_URL}/notes/${noteId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      setNotes(response.data); // Update with the new notes array
      toast.success('Note deleted successfully');
    } catch (error) {
      console.error('Error deleting note:', error);
      toast.error('Failed to delete note');
    }
  };

  // Existing MapEvents component
  const MapEvents = () => {
    const map = useMap();
    
    useEffect(() => {
      if (map && patrolAreas.length > 0) {
        // Clear existing polygons
        map.eachLayer((layer) => {
          if (layer instanceof L.Polygon) {
            map.removeLayer(layer);
          }
        });

        // Add new polygons
        patrolAreas.forEach(area => {
          if (area && area.coordinates && area.coordinates.length > 0) {
            const polygon = L.polygon(
              area.coordinates.map(({lat, lng}) => [lat, lng]),
              { 
                color: area.color || '#3388ff',
                fillOpacity: 0.2,
                weight: 2
              }
            );
            
            polygon.bindTooltip(area.legend || 'Patrol Area', {
              permanent: true,
              direction: 'center',
              className: `polygon-tooltip ${isDarkMode ? 'dark' : ''}`
            });
            
            polygon.addTo(map);
          }
        });

        // Fit map bounds to show all polygons if there are any
        if (patrolAreas.length > 0) {
          const bounds = L.latLngBounds(
            patrolAreas.flatMap(area => 
              area.coordinates.map(({lat, lng}) => [lat, lng])
            )
          );
          map.fitBounds(bounds, { padding: [50, 50] });
        }
      }
    }, [map, patrolAreas, isDarkMode]);

    return null;
  };

  // Existing renderStars helper function
  const renderStars = (rating) => {
    if (!rating || isNaN(rating)) return null;
    
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = (rating % 1) >= 0.5;
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);
    
    // Add full stars
    for (let i = 0; i < fullStars; i++) {
      stars.push(<FaStar key={`full-${i}`} className="text-yellow-400" />);
    }
    
    // Add half star if needed
    if (hasHalfStar) {
      stars.push(<FaStarHalfAlt key="half" className="text-yellow-400" />);
    }
    
    // Add empty stars
    for (let i = 0; i < emptyStars; i++) {
      stars.push(<FaRegStar key={`empty-${i}`} className="text-yellow-400" />);
    }
    
    return <div className="flex items-center">{stars}</div>;
  };

  // Skeleton loader for cards - updated with theme awareness
  const CardSkeleton = () => (
    <div className={`p-6 rounded-xl shadow-lg text-center animate-pulse ${isDarkMode ? 'bg-[#0e1022] bg-opacity-30' : 'bg-white bg-opacity-30'}`}>
      <div className={`h-5 w-28 ${isDarkMode ? 'bg-[#1e2048]' : 'bg-gray-200'} rounded mx-auto mb-3`}></div>
      <div className={`h-8 w-16 ${isDarkMode ? 'bg-[#1e2048]' : 'bg-gray-300'} rounded mx-auto`}></div>
    </div>
  );

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={fadeIn}
      className={`p-4 md:p-8 ${isDarkMode ? 'bg-[#080917]' : 'bg-[#e8e9f7]'} min-h-screen`}
    >
      <motion.h1 
        className={`text-3xl font-extrabold mb-6 ${isDarkMode ? 'text-[#e7e8f4]' : 'text-[#0b0c18]'} border-b pb-4 ${isDarkMode ? 'border-[#1e2048]' : 'border-gray-200'}`}
        variants={slideUp}
        custom={0}
      >
        Admin Dashboard
      </motion.h1>

      {/* Patrol and Incidents Overview */}
      <div className="mb-8">
        <motion.h2 
          className={`text-xl font-bold mb-4 ${isDarkMode ? 'text-[#e7e8f4]' : 'text-[#0b0c18]'} flex items-center`}
          variants={slideUp}
          custom={1}
        >
          <FaShieldAlt className={`mr-2 ${isDarkMode ? 'text-[#4750eb]' : 'text-[#141db8]'}`} />
          Patrols & Incidents Overview
        </motion.h2>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {isLoading ? (
            Array(4).fill(0).map((_, index) => (
              <CardSkeleton key={`stat-skeleton-${index}`} />
            ))
          ) : (
            <>
              <motion.div 
                className={`rounded-xl shadow-md transform transition-all duration-300 ${isDarkMode 
                  ? 'bg-gradient-to-br from-[#191f8a] to-[#090c33] text-[#e7e8f4]' 
                  : 'bg-gradient-to-br from-[#191d67] to-[#0d0f33] text-white'}`}
                variants={slideUp}
                custom={2}
                whileHover="hover"
              >
                <div className="flex items-center justify-between mb-4 p-6">
                  <h2 className="text-lg font-semibold">Patrols Scheduled</h2>
                  <div className={`${isDarkMode ? 'bg-[#4750eb] bg-opacity-20' : 'bg-[#141db8] bg-opacity-20'} p-2 rounded-full`}>
                    <FaRegCalendarCheck className="w-6 h-6" />
                  </div>
                </div>
                <p className="text-3xl font-bold px-6">{dashboardData.patrolsScheduled}</p>
                <p className={`${isDarkMode ? 'text-[#989ce6]' : 'text-[#757be6]'} text-sm mt-2 pb-4 px-6`}>Today</p>
              </motion.div>

              <motion.div 
                className={`rounded-xl shadow-md ${isDarkMode 
                  ? 'bg-gradient-to-br from-green-900 to-green-800 text-[#e7e8f4]' 
                  : 'bg-gradient-to-br from-green-600 to-green-700 text-white'}`}
                variants={slideUp}
                custom={3}
                whileHover="hover"
              >
                <div className="flex items-center justify-between mb-4 p-6">
                  <h2 className="text-lg font-semibold">Incidents Responded</h2>
                  <div className={`${isDarkMode ? 'bg-green-700' : 'bg-green-500'} bg-opacity-20 p-2 rounded-full`}>
                    <FaExclamationTriangle className="w-6 h-6" />
                  </div>
                </div>
                <p className="text-3xl font-bold px-6">{dashboardData.incidentsResponded}</p>
                <p className={`${isDarkMode ? 'text-green-300' : 'text-green-200'} text-sm mt-2 pb-4 px-6`}>Resolved cases</p>
              </motion.div>

              <motion.div 
                className={`rounded-xl shadow-md ${isDarkMode 
                  ? 'bg-gradient-to-br from-amber-900 to-amber-800 text-[#e7e8f4]' 
                  : 'bg-gradient-to-br from-amber-600 to-amber-700 text-white'}`}
                variants={slideUp}
                custom={4}
                whileHover="hover"
              >
                <div className="flex items-center justify-between mb-4 p-6">
                  <h2 className="text-lg font-semibold">Total Patrols</h2>
                  <div className={`${isDarkMode ? 'bg-amber-700' : 'bg-amber-500'} bg-opacity-20 p-2 rounded-full`}>
                    <FaRoute className="w-6 h-6" />
                  </div>
                </div>
                <p className="text-3xl font-bold px-6">{dashboardData.totalPatrols}</p>
                <p className={`${isDarkMode ? 'text-amber-300' : 'text-amber-200'} text-sm mt-2 pb-4 px-6`}>This month</p>
              </motion.div>

              <motion.div 
                className={`rounded-xl shadow-md ${isDarkMode 
                  ? 'bg-gradient-to-br from-red-900 to-red-800 text-[#e7e8f4]' 
                  : 'bg-gradient-to-br from-red-600 to-red-700 text-white'}`}
                variants={slideUp}
                custom={5}
                whileHover="hover"
              >
                <div className="flex items-center justify-between mb-4 p-6">
                  <h2 className="text-lg font-semibold">Active Patrols</h2>
                  <div className={`${isDarkMode ? 'bg-red-700' : 'bg-red-500'} bg-opacity-20 p-2 rounded-full`}>
                    <FaMapMarkedAlt className="w-6 h-6" />
                  </div>
                </div>
                <p className="text-3xl font-bold px-6">{dashboardData.activePatrols}</p>
                <p className={`${isDarkMode ? 'text-red-300' : 'text-red-200'} text-sm mt-2 pb-4 px-6`}>In progress now</p>
              </motion.div>
            </>
          )}
        </div>
      </div>

      {/* Tanods Overview */}
      <div className="mb-8">
        <motion.h2 
          className={`text-xl font-bold mb-4 ${isDarkMode ? 'text-[#e7e8f4]' : 'text-[#0b0c18]'} flex items-center`}
          variants={slideUp}
          custom={6}
        >
          <FaUsers className={`mr-2 ${isDarkMode ? 'text-[#4750eb]' : 'text-[#141db8]'}`} />
          Tanods Status
        </motion.h2>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {isLoading ? (
            Array(4).fill(0).map((_, index) => (
              <CardSkeleton key={`tanod-skeleton-${index}`} />
            ))
          ) : (
            <>
              <motion.div 
                className={`rounded-xl shadow-md relative ${isDarkMode 
                  ? 'bg-gradient-to-br from-[#191f8a] to-[#090c33] text-[#e7e8f4]' 
                  : 'bg-gradient-to-br from-[#191d67] to-[#0d0f33] text-white'}`}
                variants={slideUp}
                custom={7}
                whileHover="hover"
              >
                <div className="flex items-center justify-between mb-4 p-6">
                  <h2 className="text-lg font-semibold">Online Tanods</h2>
                  <div className={`${isDarkMode ? 'bg-[#4750eb] bg-opacity-20' : 'bg-[#141db8] bg-opacity-20'} p-2 rounded-full`}>
                    <FaUserCheck className="w-6 h-6" />
                  </div>
                </div>
                <p className="text-3xl font-bold px-6">{dashboardData.onlineTanods}</p>
                <div className={`${isDarkMode ? 'text-[#989ce6]' : 'text-[#757be6]'} text-sm mt-2 flex items-center pb-4 px-6`}>
                  <span className="inline-block w-2 h-2 bg-green-400 rounded-full mr-2 animate-pulse"></span>
                  Currently active
                </div>
              </motion.div>

              <motion.div 
                className={`rounded-xl shadow-md ${isDarkMode 
                  ? 'bg-gradient-to-br from-teal-900 to-teal-800 text-[#e7e8f4]' 
                  : 'bg-gradient-to-br from-teal-600 to-teal-700 text-white'}`}
                variants={slideUp}
                custom={8}
                whileHover="hover"
              >
                <div className="flex items-center justify-between mb-4 p-6">
                  <h2 className="text-lg font-semibold">Tanods on Patrol</h2>
                  <div className={`${isDarkMode ? 'bg-teal-700' : 'bg-teal-500'} bg-opacity-20 p-2 rounded-full`}>
                    <FaMapMarkedAlt className="w-6 h-6" />
                  </div>
                </div>
                <p className="text-3xl font-bold px-6">{dashboardData.tanodsOnPatrol}</p>
                <p className={`${isDarkMode ? 'text-teal-300' : 'text-teal-200'} text-sm mt-2 pb-4 px-6`}>Actively patrolling</p>
              </motion.div>

              <motion.div 
                className={`rounded-xl shadow-md ${isDarkMode 
                  ? 'bg-gradient-to-br from-cyan-900 to-cyan-800 text-[#e7e8f4]' 
                  : 'bg-gradient-to-br from-cyan-600 to-cyan-700 text-white'}`}
                variants={slideUp}
                custom={9}
                whileHover="hover"
              >
                <div className="flex items-center justify-between mb-4 p-6">
                  <h2 className="text-lg font-semibold">Total Tanods</h2>
                  <div className={`${isDarkMode ? 'bg-cyan-700' : 'bg-cyan-500'} bg-opacity-20 p-2 rounded-full`}>
                    <FaUsers className="w-6 h-6" />
                  </div>
                </div>
                <p className="text-3xl font-bold px-6">{dashboardData.totalTanods}</p>
                <p className={`${isDarkMode ? 'text-cyan-300' : 'text-cyan-200'} text-sm mt-2 pb-4 px-6`}>Registered in system</p>
              </motion.div>

              <motion.div 
                className={`rounded-xl shadow-md ${isDarkMode 
                  ? 'bg-gradient-to-br from-purple-900 to-purple-800 text-[#e7e8f4]' 
                  : 'bg-gradient-to-br from-purple-600 to-purple-700 text-white'}`}
                variants={slideUp}
                custom={10}
                whileHover="hover"
              >
                <div className="flex items-center justify-between mb-4 p-6">
                  <h2 className="text-lg font-semibold">Available Tanods</h2>
                  <div className={`${isDarkMode ? 'bg-purple-700' : 'bg-purple-500'} bg-opacity-20 p-2 rounded-full`}>
                    <FaUserClock className="w-6 h-6" />
                  </div>
                </div>
                <p className="text-3xl font-bold px-6">{dashboardData.availableTanods}</p>
                <p className={`${isDarkMode ? 'text-purple-300' : 'text-purple-200'} text-sm mt-2 pb-4 px-6`}>Ready for assignment</p>
              </motion.div>
            </>
          )}
        </div>
      </div>

      {/* Map, Chart, and Side Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Side Panel with Calendar and Notes */}
        <motion.div 
          className="lg:col-span-3 order-2 lg:order-1"
          variants={slideUp}
          custom={11}
        >
          <motion.div 
            className={`${isDarkMode ? 'bg-[#0e1022]' : 'bg-white'} rounded-xl shadow-lg mb-6 overflow-hidden`}
            whileHover={{ boxShadow: isDarkMode ? "0 10px 25px -5px rgba(0, 0, 0, 0.3)" : "0 10px 25px -5px rgba(59, 130, 246, 0.1)" }}
          >
            <div className={`${isDarkMode 
              ? 'bg-gradient-to-r from-[#191f8a] to-[#4750eb]' 
              : 'bg-gradient-to-r from-[#191d67] to-[#141db8]'} px-4 py-3 text-white`}>
              <h2 className="text-lg font-semibold">Calendar</h2>
            </div>
            <div className="p-4">
              <Calendar 
                onChange={handleDateChange} 
                value={date} 
                className={`border-0 shadow-none w-full ${isDarkMode ? 'react-calendar--dark' : ''}`} 
              />
            </div>
          </motion.div>
          
          <motion.div 
            className={`${isDarkMode ? 'bg-[#0e1022]' : 'bg-white'} rounded-xl shadow-lg overflow-hidden`}
            whileHover={{ boxShadow: isDarkMode ? "0 10px 25px -5px rgba(0, 0, 0, 0.3)" : "0 10px 25px -5px rgba(59, 130, 246, 0.1)" }}
          >
            <div className={`${isDarkMode 
              ? 'bg-gradient-to-r from-[#191f8a] to-[#4750eb]' 
              : 'bg-gradient-to-r from-[#191d67] to-[#141db8]'} px-4 py-3 text-white flex justify-between items-center`}>
              <h2 className="text-lg font-semibold">Notes</h2>
              <span className={`${isDarkMode ? 'bg-[#080917]' : 'bg-white'} ${isDarkMode ? 'text-[#989ce6]' : 'text-[#141db8]'} text-xs rounded-full px-2 py-1 font-medium`}>
                {notes.length}
              </span>
            </div>
            
            <div className="p-4">
              <div className="overflow-y-auto max-h-64 mb-4">
                <AnimatePresence>
                  {notes.length === 0 ? (
                    <motion.div 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className={`text-center ${isDarkMode ? 'text-[#989ce6]' : 'text-gray-500'} py-8`}
                    >
                      No notes yet
                    </motion.div>
                  ) : (
                    <ul className={`divide-y ${isDarkMode ? 'divide-[#1e2048]' : 'divide-gray-100'}`}>
                      {notes.map((note) => (
                        <motion.li
                          key={note._id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.3 }}
                          className="py-3 flex justify-between items-center group"
                        >
                          <div className="flex-grow">
                            <span className={`text-sm font-medium ${isDarkMode ? 'text-[#e7e8f4]' : 'text-gray-900'}`}>{note.date}: </span>
                            <span className={`text-sm ${isDarkMode ? 'text-[#989ce6]' : 'text-gray-600'}`}>{note.content}</span>
                          </div>
                          <motion.button
                            onClick={() => deleteNote(note._id)}
                            whileHover={{ scale: 1.2, color: '#f43f5e' }}
                            whileTap={{ scale: 0.95 }}
                            className={`${isDarkMode ? 'text-[#989ce6]' : 'text-gray-400'} opacity-0 group-hover:opacity-100 ml-2 transition-opacity`}
                          >
                            <FaTrash />
                          </motion.button>
                        </motion.li>
                      ))}
                    </ul>
                  )}
                </AnimatePresence>
              </div>
              
              <div className={`flex items-center mt-3 border-t ${isDarkMode ? 'border-[#1e2048]' : 'border-gray-100'} pt-3`}>
                <input
                  type="text"
                  value={currentNote}
                  onChange={(e) => setCurrentNote(e.target.value)}
                  placeholder="Add a note..."
                  className={`${
                    isDarkMode 
                      ? 'bg-[#080917] border-[#1e2048] text-[#e7e8f4] placeholder-gray-500' 
                      : 'bg-white border-gray-200 text-gray-800'
                  } border p-2 rounded-lg flex-grow text-sm focus:ring-2 focus:ring-[${isDarkMode ? '#4750eb' : '#141db8'}] focus:border-transparent outline-none transition-all duration-200`}
                />
                <motion.button 
                  onClick={addNote}
                  whileHover={{ scale: 1.05 }} 
                  whileTap={{ scale: 0.95 }}
                  className={`${
                    isDarkMode 
                      ? 'bg-[#4750eb] hover:bg-[#191f8a]' 
                      : 'bg-[#141db8] hover:bg-[#191d67]'
                  } text-white ml-2 px-3 py-2 rounded-lg text-sm font-medium`}
                  disabled={!currentNote.trim()}
                >
                  Add
                </motion.button>
              </div>
            </div>
          </motion.div>
        </motion.div>

        {/* Main Content Area */}
        <div className="lg:col-span-9 order-1 lg:order-2 space-y-6">
          {/* Chart Section */}
          <motion.div 
            className={`${isDarkMode ? 'bg-[#0e1022]' : 'bg-white'} p-5 rounded-xl shadow-lg`}
            variants={slideUp}
            custom={12}
            whileHover={{ boxShadow: isDarkMode ? "0 15px 30px -5px rgba(0, 0, 0, 0.5)" : "0 15px 30px -5px rgba(0, 0, 0, 0.1)" }}
          >
            <h2 className={`text-lg font-semibold mb-4 ${isDarkMode ? 'text-[#e7e8f4]' : 'text-gray-800'} flex items-center`}>
              <FaExclamationTriangle className={`mr-2 ${isDarkMode ? 'text-amber-500' : 'text-amber-500'}`} />
              Incident Tracker
            </h2>
            {isLoading ? (
              <div className={`animate-pulse h-64 ${isDarkMode ? 'bg-[#080917]' : 'bg-gray-200'} rounded-lg`}></div>
            ) : (
              <div className="h-64">
                <Line 
                  data={chartData} 
                  options={getChartOptions()}
                />
              </div>
            )}
          </motion.div>
          
          {/* Map Section */}
          <motion.div 
            className={`${isDarkMode ? 'bg-[#0e1022]' : 'bg-white'} p-5 rounded-xl shadow-lg`}
            variants={slideUp}
            custom={13}
            whileHover={{ boxShadow: isDarkMode ? "0 15px 30px -5px rgba(0, 0, 0, 0.5)" : "0 15px 30px -5px rgba(0, 0, 0, 0.1)" }}
          >
            <h2 className={`text-lg font-semibold mb-4 ${isDarkMode ? 'text-[#e7e8f4]' : 'text-gray-800'} flex items-center`}>
              <FaMapMarkedAlt className={`mr-2 ${isDarkMode ? 'text-[#4750eb]' : 'text-[#141db8]'}`} />
              Patrol Area Map
            </h2>
            <div className={`h-[400px] rounded-lg overflow-hidden border ${isDarkMode ? 'border-[#1e2048]' : 'border-gray-100'}`}>
              <MapContainer center={mapCenter} zoom={13} style={{ height: '100%', width: '100%' }} className={isDarkMode ? 'dark-map' : ''}>
                <TileLayer
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                />
                {incidents.map((incident, index) => (
                  <Marker key={incident.id} position={incident.position}>
                    <Popup className={isDarkMode ? 'dark-popup' : ''}>
                      {incident.details}
                    </Popup>
                    <Tooltip className={isDarkMode ? 'dark-tooltip' : ''}>
                      {`Marker ${index + 1}`}
                    </Tooltip>
                  </Marker>
                ))}
                <MapEvents />
              </MapContainer>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Top Performers Section */}
      <motion.div 
        className="mt-6"
        variants={slideUp}
        custom={14}
      >
        <h2 className={`text-xl font-bold mb-4 ${isDarkMode ? 'text-[#e7e8f4]' : 'text-[#0b0c18]'} flex items-center`}>
          <FaStar className={`mr-2 ${isDarkMode ? 'text-yellow-400' : 'text-yellow-500'}`} />
          Top Performing Tanods
        </h2>
        
        <div className={`${isDarkMode ? 'bg-[#0e1022]' : 'bg-white'} rounded-xl shadow-lg overflow-hidden`}>
          {isLoading ? (
            <div className="p-6 animate-pulse space-y-4">
              {Array(5).fill(0).map((_, index) => (
                <div key={`performer-skeleton-${index}`} className="flex justify-between">
                  <div className="flex items-center">
                    <div className={`w-10 h-10 ${isDarkMode ? 'bg-[#1e2048]' : 'bg-gray-200'} rounded-full mr-3`}></div>
                    <div className={`h-4 w-40 ${isDarkMode ? 'bg-[#1e2048]' : 'bg-gray-200'} rounded`}></div>
                  </div>
                  <div className={`h-4 w-20 ${isDarkMode ? 'bg-[#1e2048]' : 'bg-gray-200'} rounded`}></div>
                </div>
              ))}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className={`min-w-full ${isDarkMode ? 'bg-[#0e1022]' : 'bg-white'}`}>
                <thead className={`${isDarkMode 
                  ? 'bg-gradient-to-r from-[#191f8a] to-[#4750eb]' 
                  : 'bg-gradient-to-r from-[#191d67] to-[#141db8]'} text-white`}>
                  <tr>
                    <th className="py-3 px-6 text-left">Rank</th>
                    <th className="py-3 px-6 text-left">Name</th>
                    <th className="py-3 px-6 text-center">Rating</th>
                  </tr>
                </thead>
                <tbody className={`divide-y ${isDarkMode ? 'divide-[#1e2048]' : 'divide-gray-100'}`}>
                  {dashboardData.topPerformers.map((performer, index) => (
                    <motion.tr 
                      key={index}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1 * index }}
                      whileHover={{ backgroundColor: isDarkMode ? "#191f8a20" : "#f9fafb" }}
                      className={`${isDarkMode ? 'hover:bg-[#191f8a20]' : 'hover:bg-gray-50'} transition-colors`}
                    >
                      <td className="py-4 px-6">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                          index === 0 ? 'bg-yellow-400 text-white' :
                          index === 1 ? 'bg-gray-400 text-white' :
                          index === 2 ? 'bg-amber-700 text-white' :
                          isDarkMode ? 'bg-[#4750eb] text-white' : 'bg-blue-100 text-blue-600'
                        } font-bold`}>
                          {index + 1}
                        </div>
                      </td>
                      <td className={`py-4 px-6 font-medium ${isDarkMode ? 'text-[#e7e8f4]' : 'text-gray-800'}`}>{performer.name}</td>
                      <td className="py-4 px-6">
                        <div className="flex justify-center items-center gap-1">
                          {renderStars(Number(performer.rating))}
                          <span className={`text-sm ml-2 ${isDarkMode ? 'text-[#989ce6]' : 'text-gray-600'}`}>({performer.rating?.toFixed(1)})</span>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </motion.div>

      {/* CSS for dark mode map if needed */}
      <style jsx>{`
        .dark-map .leaflet-tile {
          filter: brightness(0.6) invert(1) contrast(3) hue-rotate(200deg) saturate(0.3) brightness(0.7);
        }
        
        .dark-popup .leaflet-popup-content-wrapper,
        .dark-popup .leaflet-popup-tip {
          background-color: #0e1022;
          color: #e7e8f4;
          border: 1px solid #1e2048;
        }
        
        .dark-tooltip .leaflet-tooltip {
          background-color: #0e1022;
          color: #e7e8f4;
          border: 1px solid #1e2048;
        }
        
        .polygon-tooltip.dark {
          background-color: rgba(14, 16, 34, 0.7);
          color: #e7e8f4;
          border: none;
        }
      `}</style>
    </motion.div>
  );
};

export default AdminDashboard;

import React, { useState, useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import "chart.js/auto";
import { Line, Doughnut } from "react-chartjs-2";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "../../../contexts/ThemeContext";
import axios from "axios";
import { toast, ToastContainer } from "react-toastify";
import io from "socket.io-client";
import L from "leaflet";

// Import icons
import { 
  FaTrash, FaMapMarkedAlt, FaCalendarAlt, FaChartLine, 
  FaClipboardList, FaStar, FaPlus, FaExclamationTriangle,
  FaShieldAlt, FaTools, FaClipboardCheck, FaUserCheck
} from "react-icons/fa";

// Set Leaflet icon paths for markers
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require("leaflet/dist/images/marker-icon-2x.png"),
  iconUrl: require("leaflet/dist/images/marker-icon.png"),
  shadowUrl: require("leaflet/dist/images/marker-shadow.png"),
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
  })
};

const hoverEffect = {
  hover: { scale: 1.03, transition: { duration: 0.2 } }
};

// TanodDashboard component
const TanodDashboard = () => {
  const { isDarkMode } = useTheme();
  const [equipment, setEquipment] = useState([]);
  const [currentScheduleId, setCurrentScheduleId] = useState(null);
  const [patrolLogs, setPatrolLogs] = useState([]);
  const [patrolAreas, setPatrolAreas] = useState([]);
  const [incidents, setIncidents] = useState([]);
  const [patrolSchedule, setPatrolSchedule] = useState([]);
  const [date, setDate] = useState(new Date());
  const [notes, setNotes] = useState([]);
  const [currentNote, setCurrentNote] = useState("");
  const [activeTab, setActiveTab] = useState('notes'); // 'notes' or 'calendar'
  const [loading, setLoading] = useState(true);
  // Add missing state variables
  const [showAllRatings, setShowAllRatings] = useState(false);

  // Dashboard data state
  const [dashboardData, setDashboardData] = useState({
    patrolsCompleted: 0,
    incidentsResolved: 0,
    ratings: {
      average: 0,
      total: 0,
      comments: []
    },
    monthlyIncidents: Array(12).fill(0),
    recentIncidents: []
  });

  // Fetch dashboard data from the server
  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const userId = localStorage.getItem('userId');

      // Get patrol data
      const patrolRes = await axios.get(
        `${process.env.REACT_APP_API_URL}/auth/tanod-schedules/${userId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Get incident reports
      const incidentRes = await axios.get(
        `${process.env.REACT_APP_API_URL}/incident-reports`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Filter incidents for this tanod
      const myIncidents = incidentRes.data.filter(
        incident => incident.responder === userId
      );

      // Get ratings data
      const ratingsRes = await axios.get(
        `${process.env.REACT_APP_API_URL}/auth/${userId}/rating`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Update dashboard data
      setDashboardData({
        patrolsCompleted: patrolRes.data.filter(p => p.status === 'Completed').length,
        incidentsResolved: myIncidents.filter(i => i.status === 'Resolved').length,
        ratings: {
          average: parseFloat(ratingsRes.data.overallRating || 0),
          total: ratingsRes.data.comments?.length || 0,
          comments: ratingsRes.data.comments || []
        },
        monthlyIncidents: getMonthlyIncidentCounts(myIncidents),
        upcomingPatrols: patrolRes.data
          .filter(p => new Date(p.startTime) > new Date())
          .slice(0, 3),
        recentIncidents: myIncidents
          .sort((a, b) => new Date(b.date) - new Date(a.date))
          .slice(0, 5)
      });

      // Set incidents for chart data
      setIncidents(myIncidents);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast.error('Failed to load dashboard data');
      setLoading(false);
    }
  };

  // Helper function to get monthly incident counts
  const getMonthlyIncidentCounts = (incidents) => {
    const monthlyCounts = new Array(12).fill(0);
    incidents.forEach(incident => {
      const month = new Date(incident.date).getMonth();
      monthlyCounts[month]++;
    });
    return monthlyCounts;
  };

  // Fetch patrol areas
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

  // Fetch equipment data
  const fetchEquipment = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `${process.env.REACT_APP_API_URL}/auth/equipments`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      // Filter equipment with default date or no return date
      const currentlyBorrowed = response.data.filter(item => {
        const returnDate = new Date(item.returnDate);
        return !item.returnDate || returnDate.getFullYear() === 1970;
      });
      setEquipment(currentlyBorrowed);
    } catch (error) {
      console.error('Error fetching equipment:', error);
      toast.error('Failed to load equipment data');
    }
  };

  // Initial data fetch
  useEffect(() => {
    fetchDashboardData();
    fetchEquipment();
    fetchPatrolAreas();
    fetchNotes();
    
    const interval = setInterval(() => {
      fetchDashboardData();
      fetchEquipment();
    }, 60000); // Refresh every minute

    // Initialize WebSocket connection
    const socket = io(process.env.REACT_APP_API_URL, {
      auth: { token: localStorage.getItem('token') }
    });

    socket.on('incidentUpdate', (data) => {
      setDashboardData(prev => ({
        ...prev,
        incidentsResolved: data.resolvedCount,
        recentIncidents: data.recentIncidents
      }));
    });

    return () => {
      clearInterval(interval);
      socket.disconnect();
    };
  }, []);

  // Chart data for incidents
  const chartData = {
    labels: [
      "Jan", "Feb", "Mar", "Apr", "May", "Jun", 
      "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
    ],
    datasets: [
      {
        label: "Incidents Responded To",
        data: dashboardData.monthlyIncidents,
        backgroundColor: isDarkMode 
          ? 'rgba(99, 102, 241, 0.2)' 
          : 'rgba(54, 162, 235, 0.2)',
        borderColor: isDarkMode 
          ? 'rgba(99, 102, 241, 1)' 
          : 'rgba(54, 162, 235, 1)',
        borderWidth: 2,
        tension: 0.4,
        fill: true,
        pointBackgroundColor: isDarkMode 
          ? 'rgba(99, 102, 241, 1)' 
          : 'rgba(54, 162, 235, 1)',
        pointRadius: 4,
        pointHoverRadius: 6
      },
    ],
  };

  // Chart options
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        labels: {
          color: isDarkMode ? '#e2e8f0' : '#334155',
          font: {
            size: 14
          }
        }
      },
      tooltip: {
        backgroundColor: isDarkMode ? '#1e293b' : '#ffffff',
        titleColor: isDarkMode ? '#e2e8f0' : '#334155',
        bodyColor: isDarkMode ? '#e2e8f0' : '#334155',
        borderColor: isDarkMode ? '#475569' : '#e2e8f0',
        borderWidth: 1,
        padding: 12,
        boxPadding: 6,
        usePointStyle: true,
        callbacks: {
          title: function(context) {
            return `${context[0].label} - Incidents`;
          }
        }
      }
    },
    scales: {
      x: {
        grid: {
          color: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
        },
        ticks: {
          color: isDarkMode ? '#e2e8f0' : '#334155'
        }
      },
      y: {
        beginAtZero: true,
        grid: {
          color: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
        },
        ticks: {
          precision: 0,
          color: isDarkMode ? '#e2e8f0' : '#334155'
        }
      }
    }
  };

  // Doughnut chart data for ratings
  const ratingData = {
    labels: ['5 Star', '4 Star', '3 Star', '2 Star', '1 Star'],
    datasets: [
      {
        data: dashboardData.ratings.comments?.reduce((acc, comment) => {
          acc[5 - comment.rating]++; // 5 star is index 0
          return acc;
        }, [0, 0, 0, 0, 0]) || [0, 0, 0, 0, 0],
        backgroundColor: [
          '#10B981', // 5 star - green
          '#60A5FA', // 4 star - blue
          '#FBBF24', // 3 star - yellow
          '#F97316', // 2 star - orange
          '#EF4444'  // 1 star - red
        ],
        borderColor: isDarkMode ? '#1e1e1e' : '#ffffff',
        borderWidth: 2,
      }
    ]
  };

  // Doughnut chart options
  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          color: isDarkMode ? '#e2e8f0' : '#334155',
          padding: 20,
          usePointStyle: true,
          font: {
            size: 12
          }
        }
      },
      tooltip: {
        backgroundColor: isDarkMode ? '#1e293b' : '#ffffff',
        titleColor: isDarkMode ? '#e2e8f0' : '#334155',
        bodyColor: isDarkMode ? '#e2e8f0' : '#334155',
        borderColor: isDarkMode ? '#475569' : '#e2e8f0',
        borderWidth: 1,
      }
    },
    cutout: '70%',
    animation: {
      animateScale: true,
      animateRotate: true
    }
  };

  // Add note functionality
  const addNote = async () => {
    if (!currentNote.trim()) return;

    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `${process.env.REACT_APP_API_URL}/notes`,
        {
          date: date.toLocaleDateString(),
          note: currentNote
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      setNotes(response.data);
      setCurrentNote('');
      toast.success('Note added successfully');
    } catch (error) {
      console.error('Error saving note:', error);
      toast.error('Failed to save note');
    }
  };

  // Delete note functionality
  const deleteNote = async (noteId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.delete(
        `${process.env.REACT_APP_API_URL}/notes/${noteId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      setNotes(response.data);
      toast.success('Note deleted successfully');
    } catch (error) {
      console.error('Error deleting note:', error);
      toast.error('Failed to delete note');
    }
  };

  // Fetch notes
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

  // Map component to display patrol areas
  const MapDisplay = () => {
    const map = useMap();

    useEffect(() => {
      if (map && patrolAreas.length > 0) {
        // Clear existing polygons
        map.eachLayer((layer) => {
          if (layer instanceof L.Polygon) {
            map.removeLayer(layer);
          }
        });

        // Add patrol area polygons
        patrolAreas.forEach(area => {
          if (area.coordinates && area.coordinates.length > 0) {
            const polygon = L.polygon(
              area.coordinates.map(coord => [coord.lat, coord.lng]),
              {
                color: area.color || '#3388ff',
                fillOpacity: 0.2,
                weight: 2
              }
            );

            polygon.bindTooltip(area.legend || 'Patrol Area', {
              permanent: false,
              direction: 'center',
              className: 'polygon-tooltip'
            });

            polygon.addTo(map);
          }
        });

        // Fit map to show all polygons
        if (patrolAreas.length > 0) {
          const bounds = L.latLngBounds(
            patrolAreas.flatMap(area => 
              area.coordinates.map(({lat, lng}) => [lat, lng])
            )
          );
          map.fitBounds(bounds, { padding: [50, 50] });
        }
      }
    }, [map, patrolAreas]);

    return null;
  };

  // Format date for display
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric'
    });
  };

  // Theme-aware styles
  const cardClass = isDarkMode 
    ? "bg-gray-800 border border-gray-700 text-gray-100 shadow-lg" 
    : "bg-white border border-gray-200 text-gray-800 shadow-lg";
  
  const headerClass = isDarkMode
    ? "text-2xl font-bold text-gray-100 mb-6"
    : "text-2xl font-bold text-gray-800 mb-6";

  const statCardClass = (color) => {
    if (isDarkMode) {
      return `bg-gray-800 border-l-4 border-${color}-500 shadow-lg`;
    }
    return `bg-white border-l-4 border-${color}-500 shadow-lg`;
  };

  // Update the section where ratings are displayed to properly show the name
  const RatingsList = ({ ratings }) => {
    return (
      <div className="space-y-3 mt-4">
        {ratings.length > 0 ? (
          ratings.map((rating, index) => (
            <div 
              key={index} 
              className={`p-4 rounded-lg ${isDarkMode 
                ? 'bg-gray-800 border-gray-700' 
                : 'bg-white border-gray-200'} border shadow-sm`}
            >
              <div className="flex justify-between items-start">
                <div>
                  <div className="flex items-center gap-1 mb-1">
                    {Array(5).fill(0).map((_, i) => (
                      <span key={i} className={`text-sm ${
                        i < rating.rating 
                          ? 'text-yellow-400' 
                          : isDarkMode ? 'text-gray-600' : 'text-gray-300'
                      }`}>★</span>
                    ))}
                  </div>
                  <p className="text-sm italic mb-2">{rating.comment}</p>
                  <div className="text-xs flex items-center gap-1">
                    <span className={isDarkMode ? 'text-blue-400' : 'text-blue-600'}>
                      {/* Display the name as provided in API response */}
                      {rating.fullName || "Anonymous"}
                    </span>
                    <span className={isDarkMode ? 'text-gray-400' : 'text-gray-500'}>•</span>
                    <span className={isDarkMode ? 'text-gray-400' : 'text-gray-500'}>
                      {new Date(rating.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))
        ) : (
          <p className={`text-center py-4 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
            No ratings yet
          </p>
        )}
      </div>
    );
  };

  // Add the missing renderStars helper function
  const renderStars = (rating) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);
    
    // Add full stars
    for (let i = 0; i < fullStars; i++) {
      stars.push(
        <FaStar 
          key={`full-${i}`} 
          className={isDarkMode ? "text-yellow-400" : "text-yellow-500"} 
        />
      );
    }
    
    // Add half star if needed
    if (hasHalfStar) {
      stars.push(
        <FaStar 
          key="half" 
          className={`text-gradient-half ${
            isDarkMode ? "text-yellow-400" : "text-yellow-500"
          }`} 
        />
      );
    }
    
    // Add empty stars
    for (let i = 0; i < emptyStars; i++) {
      stars.push(
        <FaStar 
          key={`empty-${i}`} 
          className={isDarkMode ? "text-gray-600" : "text-gray-300"} 
        />
      );
    }
    
    return stars;
  };

  // Update the Ratings Card component to fix undefined variables
  const RatingsCard = () => {
    // Get the ratings data from the dashboard state
    const ratings = dashboardData.ratings.comments || [];
    const averageRating = dashboardData.ratings.average || 0;

    return (
      <div className={`rounded-xl shadow-lg overflow-hidden ${
        isDarkMode ? 'bg-gray-800' : 'bg-white'
      }`}>
        <div className={`px-6 py-4 ${
          isDarkMode 
            ? 'bg-gradient-to-r from-blue-900 to-blue-700' 
            : 'bg-gradient-to-r from-blue-600 to-blue-400'
        } text-white`}>
          <h3 className="text-lg font-semibold">Recent Ratings & Feedback</h3>
        </div>
        <div className="p-6">
          {loading ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <div 
                  key={i} 
                  className={`animate-pulse p-4 rounded-lg ${
                    isDarkMode ? 'bg-gray-700' : 'bg-gray-100'
                  }`}
                >
                  <div className="h-4 w-32 bg-gray-400 rounded mb-3"></div>
                  <div className="h-3 w-full bg-gray-400 rounded mb-2"></div>
                  <div className="h-3 w-2/3 bg-gray-400 rounded"></div>
                </div>
              ))}
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                  <div className="text-3xl font-bold mr-2 text-yellow-500">{averageRating}</div>
                  <div className="flex items-center">
                    {renderStars(averageRating)}
                  </div>
                </div>
                <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  {ratings.length} {ratings.length === 1 ? 'rating' : 'ratings'}
                </div>
              </div>
              
              <div className="mb-6">
                <h4 className={`text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                  Rating Distribution
                </h4>
                {/* ...existing rating distribution code... */}
              </div>
              
              <h4 className={`text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                Recent Comments
              </h4>
              
              {/* Use the updated RatingsList component */}
              <RatingsList ratings={ratings.slice(0, 3)} />
              
              {ratings.length > 3 && (
                <button
                  className={`text-sm mt-4 ${isDarkMode ? 'text-blue-400' : 'text-blue-600'} hover:underline focus:outline-none`}
                  onClick={() => setShowAllRatings(true)}
                >
                  View all {ratings.length} ratings
                </button>
              )}
            </>
          )}
        </div>
        
        {/* Modal for showing all ratings */}
        {showAllRatings && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className={`rounded-lg shadow-xl max-w-lg w-full mx-4 ${
              isDarkMode ? 'bg-gray-900' : 'bg-white'
            }`}>
              <div className={`px-6 py-4 border-b ${
                isDarkMode 
                  ? 'border-gray-700 bg-gray-800' 
                  : 'border-gray-200'
              } flex justify-between items-center`}>
                <h3 className={`font-semibold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
                  All Ratings & Feedback
                </h3>
                <button
                  className={`text-lg ${isDarkMode ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-black'}`}
                  onClick={() => setShowAllRatings(false)}
                >
                  ×
                </button>
              </div>
              <div className={`p-6 max-h-[70vh] overflow-y-auto ${isDarkMode ? 'bg-gray-900' : 'bg-white'}`}>
                <RatingsList ratings={ratings} />
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <motion.div 
      initial="hidden"
      animate="visible"
      variants={fadeIn}
      className={`p-4 md:p-8 ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'} min-h-screen`}
    >
      <ToastContainer position="top-right" theme={isDarkMode ? 'dark' : 'light'} />
      
      <motion.h1 
        variants={slideUp}
        custom={0}
        className={headerClass}
      >
        Tanod Dashboard
      </motion.h1>

      {/* Stats Overview Cards */}
      <motion.div 
        variants={slideUp}
        custom={1}
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8"
      >
        <motion.div 
          variants={hoverEffect}
          whileHover="hover"
          className={`${cardClass} rounded-lg p-5 flex items-center`}
        >
          <div className={`p-4 rounded-full bg-blue-100 text-blue-600 mr-4`}>
            <FaShieldAlt size={24} />
          </div>
          <div>
            <h2 className="text-lg font-medium opacity-80">Patrols Completed</h2>
            <p className="text-2xl font-bold">{dashboardData.patrolsCompleted}</p>
          </div>
        </motion.div>

        <motion.div 
          variants={hoverEffect}
          whileHover="hover"
          className={`${cardClass} rounded-lg p-5 flex items-center`}
        >
          <div className={`p-4 rounded-full bg-green-100 text-green-600 mr-4`}>
            <FaClipboardCheck size={24} />
          </div>
          <div>
            <h2 className="text-lg font-medium opacity-80">Incidents Resolved</h2>
            <p className="text-2xl font-bold">{dashboardData.incidentsResolved}</p>
          </div>
        </motion.div>

        <motion.div 
          variants={hoverEffect}
          whileHover="hover"
          className={`${cardClass} rounded-lg p-5 flex items-center`}
        >
          <div className={`p-4 rounded-full bg-yellow-100 text-yellow-600 mr-4`}>
            <FaTools size={24} />
          </div>
          <div>
            <h2 className="text-lg font-medium opacity-80">Equipment Borrowed</h2>
            <p className="text-2xl font-bold">{equipment.length}</p>
          </div>
        </motion.div>

        <motion.div 
          variants={hoverEffect}
          whileHover="hover"
          className={`${cardClass} rounded-lg p-5 flex items-center`}
        >
          <div className={`p-4 rounded-full bg-purple-100 text-purple-600 mr-4`}>
            <FaStar size={24} />
          </div>
          <div>
            <h2 className="text-lg font-medium opacity-80">Average Rating</h2>
            <p className="text-2xl font-bold">
              {dashboardData.ratings.average.toFixed(1)} 
              <span className="text-yellow-500 ml-1">★</span>
            </p>
          </div>
        </motion.div>
      </motion.div>

      {/* Charts & Map Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Incident Response Chart */}
        <motion.div 
          variants={slideUp}
          custom={2}
          className={`${cardClass} rounded-lg p-5 col-span-1 lg:col-span-2`}
        >
          <div className="flex justify-between items-center mb-5">
            <h2 className="text-xl font-semibold flex items-center">
              <FaChartLine className={`mr-2 ${isDarkMode ? 'text-blue-400' : 'text-blue-500'}`} />
              Incident Response Trends
            </h2>
          </div>
          <div className="h-[300px]">
            <Line data={chartData} options={chartOptions} />
          </div>
        </motion.div>

        {/* Rating Distribution */}
        <motion.div 
          variants={slideUp}
          custom={3}
          className={`${cardClass} rounded-lg p-5`}
        >
          <div className="flex justify-between items-center mb-5">
            <h2 className="text-xl font-semibold flex items-center">
              <FaStar className={`mr-2 ${isDarkMode ? 'text-yellow-400' : 'text-yellow-500'}`} />
              Rating Distribution
            </h2>
            <span className="text-xl font-bold">
              {dashboardData.ratings.average.toFixed(1)} 
              <span className="text-yellow-500 ml-1">★</span>
            </span>
          </div>
          <div className="h-[300px] flex items-center justify-center">
            {dashboardData.ratings.total > 0 ? (
              <Doughnut data={ratingData} options={doughnutOptions} />
            ) : (
              <div className="text-center opacity-70">
                <FaStar size={40} className="mx-auto mb-3 opacity-30" />
                <p>No ratings yet</p>
              </div>
            )}
          </div>
        </motion.div>
      </div>

      {/* Map, Schedule, & Notes Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Map Section */}
        <motion.div 
          variants={slideUp}
          custom={4}
          className={`${cardClass} rounded-lg overflow-hidden lg:col-span-2`}
        >
          <div className="p-5 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
            <h2 className="text-xl font-semibold flex items-center">
              <FaMapMarkedAlt className={`mr-2 ${isDarkMode ? 'text-green-400' : 'text-green-500'}`} />
              Patrol Areas
            </h2>
          </div>
          <div className="h-[400px]">
            <MapContainer
              center={[14.7356, 121.0498]}
              zoom={15}
              style={{ width: "100%", height: "100%" }}
              zoomControl={false}
              attributionControl={false}
            >
              <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
              <MapDisplay />
            </MapContainer>
          </div>
        </motion.div>

        {/* Notes & Calendar Column */}
        <motion.div 
          variants={slideUp}
          custom={5}
          className="space-y-6"
        >
          {/* Notes/Calendar tabs */}
          <div className={`${cardClass} rounded-lg overflow-hidden`}>
            <div className="flex border-b border-gray-200 dark:border-gray-700">
              <button 
                onClick={() => setActiveTab('notes')} 
                className={`flex-1 py-3 px-4 text-center font-medium ${
                  activeTab === 'notes' 
                    ? isDarkMode 
                      ? 'bg-gray-700 text-white' 
                      : 'bg-blue-50 text-blue-600'
                    : ''
                }`}
              >
                <span className="flex items-center justify-center">
                  <FaClipboardList className="mr-2" />
                  Notes
                </span>
              </button>
              <button 
                onClick={() => setActiveTab('calendar')} 
                className={`flex-1 py-3 px-4 text-center font-medium ${
                  activeTab === 'calendar' 
                    ? isDarkMode 
                      ? 'bg-gray-700 text-white' 
                      : 'bg-blue-50 text-blue-600'
                    : ''
                }`}
              >
                <span className="flex items-center justify-center">
                  <FaCalendarAlt className="mr-2" />
                  Calendar
                </span>
              </button>
            </div>

            <div className="p-4">
              <AnimatePresence mode="wait">
                {activeTab === 'notes' ? (
                  <motion.div 
                    key="notes"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    <div className="mb-4">
                      <div className="flex">
                        <input
                          type="text"
                          value={currentNote}
                          onChange={(e) => setCurrentNote(e.target.value)}
                          placeholder="Add a note..."
                          className={`border rounded-l p-2 flex-grow ${
                            isDarkMode 
                              ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                              : 'bg-white border-gray-300 text-gray-800'
                          }`}
                          onKeyDown={(e) => e.key === 'Enter' && addNote()}
                        />
                        <button
                          onClick={addNote}
                          className={`px-4 rounded-r flex items-center justify-center ${
                            isDarkMode
                              ? 'bg-blue-600 hover:bg-blue-700 text-white'
                              : 'bg-blue-500 hover:bg-blue-600 text-white'
                          }`}
                        >
                          <FaPlus />
                        </button>
                      </div>
                    </div>
                    <div className={`overflow-y-auto max-h-[250px] ${
                      isDarkMode ? 'scrollbar-dark' : 'scrollbar-light'
                    }`}>
                      {notes.length === 0 ? (
                        <div className="text-center py-8">
                          <FaClipboardList size={32} className="mx-auto mb-2 opacity-30" />
                          <p className="opacity-70">No notes yet</p>
                        </div>
                      ) : (
                        <ul className="space-y-2">
                          {notes.map((note) => (
                            <motion.li
                              key={note._id}
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: -10 }}
                              className={`p-3 rounded-lg flex justify-between items-start ${
                                isDarkMode ? 'bg-gray-700' : 'bg-gray-50'
                              }`}
                            >
                              <div>
                                <p className="text-xs opacity-70 mb-1">{note.date}</p>
                                <p>{note.content}</p>
                              </div>
                              <button
                                onClick={() => deleteNote(note._id)}
                                className={`p-1.5 rounded-full hover:bg-opacity-20 ${
                                  isDarkMode 
                                    ? 'hover:bg-red-900 text-gray-400 hover:text-red-400' 
                                    : 'hover:bg-red-100 text-gray-500 hover:text-red-500'
                                }`}
                              >
                                <FaTrash size={14} />
                              </button>
                            </motion.li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </motion.div>
                ) : (
                  <motion.div 
                    key="calendar"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex justify-center"
                  >
                    <Calendar 
                      onChange={setDate} 
                      value={date}
                      className={`${isDarkMode ? 'react-calendar--dark' : ''} border-0`}
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Equipment Borrowed */}
          <div className={`${cardClass} rounded-lg overflow-hidden`}>
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-lg font-semibold flex items-center">
                <FaTools className={`mr-2 ${isDarkMode ? 'text-yellow-400' : 'text-yellow-500'}`} />
                Equipment Borrowed
              </h2>
            </div>
            <div className="p-4">
              {equipment.length === 0 ? (
                <div className="text-center py-6">
                  <FaTools size={32} className="mx-auto mb-2 opacity-30" />
                  <p className="opacity-70">No equipment currently borrowed</p>
                </div>
              ) : (
                <ul className="space-y-3">
                  {equipment.map((item, index) => (
                    <motion.li 
                      key={item._id || index}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0, transition: { delay: index * 0.1 } }}
                      className={`p-3 rounded-lg ${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'}`}
                    >
                      <div className="flex justify-between">
                        <span className="font-medium">{item.name}</span>
                      </div>
                      <p className="text-xs opacity-70 mt-1">
                        Borrowed on {formatDate(item.borrowDate)}
                      </p>
                    </motion.li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </motion.div>
      </div>

      {/* Recent Incidents & Feedback Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Recent Incidents */}
        <motion.div 
          variants={slideUp}
          custom={6}
          className={`${cardClass} rounded-lg overflow-hidden`}
        >
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-semibold flex items-center">
              <FaExclamationTriangle className={`mr-2 ${isDarkMode ? 'text-orange-400' : 'text-orange-500'}`} />
              Recent Incidents
            </h2>
          </div>
          <div className="p-4">
            {dashboardData.recentIncidents.length === 0 ? (
              <div className="text-center py-8">
                <FaExclamationTriangle size={32} className="mx-auto mb-2 opacity-30" />
                <p className="opacity-70">No recent incidents</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className={isDarkMode ? 'text-gray-400' : 'text-gray-500'}>
                      <th className="px-2 py-2 text-left text-xs font-medium uppercase tracking-wider">Date</th>
                      <th className="px-2 py-2 text-left text-xs font-medium uppercase tracking-wider">Type</th>
                      <th className="px-2 py-2 text-left text-xs font-medium uppercase tracking-wider">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {dashboardData.recentIncidents.map((incident, index) => (
                      <motion.tr 
                        key={incident._id || index}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0, transition: { delay: index * 0.1 } }}
                      >
                        <td className="px-2 py-3 whitespace-nowrap text-sm">
                          {formatDate(incident.date)}
                        </td>
                        <td className="px-2 py-3 whitespace-nowrap text-sm">
                          {incident.type}
                        </td>
                        <td className="px-2 py-3 whitespace-nowrap text-sm">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            incident.status === 'Resolved' 
                              ? isDarkMode ? 'bg-green-900 text-green-200' : 'bg-green-100 text-green-800'
                              : incident.status === 'In Progress'
                                ? isDarkMode ? 'bg-blue-900 text-blue-200' : 'bg-blue-100 text-blue-800'
                                : isDarkMode ? 'bg-yellow-900 text-yellow-200' : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {incident.status}
                          </span>
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </motion.div>

        {/* Resident Feedback */}
        <motion.div 
          variants={slideUp}
          custom={7}
          className={`${cardClass} rounded-lg overflow-hidden`}
        >
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-semibold flex items-center">
              <FaUserCheck className={`mr-2 ${isDarkMode ? 'text-indigo-400' : 'text-indigo-500'}`} />
              Recent Feedback
            </h2>
          </div>
          <div className="p-4">
            {dashboardData.ratings.comments?.length === 0 ? (
              <div className="text-center py-8">
                <FaStar size={32} className="mx-auto mb-2 opacity-30" />
                <p className="opacity-70">No feedback yet</p>
              </div>
            ) : (
              <ul className="space-y-3">
                {dashboardData.ratings.comments?.slice(0, 3).map((comment, index) => (
                  <motion.li 
                    key={index}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0, transition: { delay: index * 0.1 } }}
                    className={`p-4 rounded-lg ${
                      isDarkMode ? 'bg-gray-700' : 'bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center mb-2">
                      <div className="text-yellow-500 mr-2">
                        {"★".repeat(comment.rating) + "☆".repeat(5 - comment.rating)}
                      </div>
                      <span className="text-xs opacity-70">
                        {comment.createdAt ? formatDate(comment.createdAt) : 'Unknown date'}
                      </span>
                    </div>
                    {/* Add commenter name here */}
                    <p className={`text-sm ${isDarkMode ? 'text-blue-400' : 'text-blue-600'} mb-1`}>
                      From: {comment.fullName || "Anonymous"}
                    </p>
                    <p>{comment.comment}</p>
                  </motion.li>
                ))}
              </ul>
            )}
          </div>
        </motion.div>
      </div>

      {/* Add custom styling for dark mode calendar */}
      {isDarkMode && (
        <style jsx="true">{`
          .react-calendar--dark {
            background-color: #1f2937;
            color: #e5e7eb;
            border-color: #374151;
          }
          .react-calendar--dark .react-calendar__tile {
            color: #e5e7eb;
          }
          .react-calendar--dark .react-calendar__month-view__days__day--weekend {
            color: #f87171;
          }
          .react-calendar--dark .react-calendar__tile--now {
            background-color: #374151;
          }
          .react-calendar--dark .react-calendar__tile--active {
            background-color: #3b82f6;
            color: white;
          }
          .react-calendar--dark .react-calendar__navigation button:enabled:hover,
          .react-calendar--dark .react-calendar__navigation button:enabled:focus {
            background-color: #374151;
          }
          .react-calendar--dark .react-calendar__tile:enabled:hover,
          .react-calendar--dark .react-calendar__tile:enabled:focus {
            background-color: #374151;
          }
          
          /* Custom scrollbar for dark mode */
          .scrollbar-dark::-webkit-scrollbar {
            width: 8px;
          }
          .scrollbar-dark::-webkit-scrollbar-track {
            background: #1f2937;
          }
          .scrollbar-dark::-webkit-scrollbar-thumb {
            background-color: #4b5563;
            border-radius: 20px;
          }
          
          /* Custom scrollbar for light mode */
          .scrollbar-light::-webkit-scrollbar {
            width: 8px;
          }
          .scrollbar-light::-webkit-scrollbar-track {
            background: #f3f4f6;
          }
          .scrollbar-light::-webkit-scrollbar-thumb {
            background-color: #d1d5db;
            border-radius: 20px;
          }
        `}</style>
      )}
    </motion.div>
  );
};

export default TanodDashboard;

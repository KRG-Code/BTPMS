import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Tooltip, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css'; // Correct CSS import
import 'chart.js/auto';
import { Line } from 'react-chartjs-2';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import { FaTrash, FaStar, FaStarHalfAlt, FaRegStar } from 'react-icons/fa';
import axios from 'axios';
import { io } from 'socket.io-client';
import { toast } from 'react-toastify';

// Set the default icon for Leaflet markers
import L from 'leaflet';
delete L.Icon.Default.prototype._getIconUrl; // Remove default icon URLs
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
  iconUrl: require('leaflet/dist/images/marker-icon.png'),
  shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
});

// AdminDashboard component
const AdminDashboard = () => {
  const [mapCenter, setMapCenter] = useState([14.6760, 121.0453]); // Fairview, Quezon City coordinates
  const [incidents, setIncidents] = useState([]);
  const [date, setDate] = useState(new Date()); // State for calendar date
  const [notes, setNotes] = useState([]); // State for notes
  const [currentNote, setCurrentNote] = useState(''); // State for current note input
  const [filterType, setFilterType] = useState('month'); // Default to month
  const [patrolAreas, setPatrolAreas] = useState([]); // Add missing patrolAreas state

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

  const [isLoading, setIsLoading] = useState(false);
  const [chartData, setChartData] = useState({
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
    datasets: []
  });

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

      // Update chart data
      setChartData({
        labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
        datasets: Object.entries(monthlyStats).map(([type, counts], index) => ({
          label: type,
          data: counts,
          backgroundColor: `hsla(${index * 45}, 70%, 50%, 0.2)`,
          borderColor: `hsla(${index * 45}, 70%, 50%, 1)`,
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
  }, []);

  // Function to handle date change on the calendar
  const handleDateChange = (newDate) => {
    setDate(newDate);
  };

  // Add function to fetch notes
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

  // Add this function near the other fetch functions
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

  // Add useEffect to fetch notes on component mount
  useEffect(() => {
    fetchNotes();
  }, []);

  // Add this useEffect after the other useEffects
  useEffect(() => {
    fetchPatrolAreas();
  }, []);

  // Update addNote function
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

  // Update deleteNote function
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

  // Add patrol areas render to map section
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
              className: 'polygon-tooltip'
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
    }, [map, patrolAreas]);

    return null;
  };

  // Add this helper function before the return statement
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

  return (
    <div className="p-4 md:p-8">
      <h1 className="text-3xl font-bold mb-8">Admin Dashboard</h1>

      {/* Patrol and Incidents Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-blue-500 text-white p-4 rounded shadow-lg text-center">
          <h2 className="text-lg font-semibold">Patrols Scheduled</h2>
          <p className="text-2xl">{dashboardData.patrolsScheduled}</p>
        </div>
        <div className="bg-green-500 text-white p-4 rounded shadow-lg text-center">
          <h2 className="text-lg font-semibold">Incidents Responded</h2>
          <p className="text-2xl">{dashboardData.incidentsResponded}</p>
        </div>
        <div className="bg-yellow-500 text-white p-4 rounded shadow-lg text-center">
          <h2 className="text-lg font-semibold">Total Patrols</h2>
          <p className="text-2xl">{dashboardData.totalPatrols}</p>
        </div>
        <div className="bg-red-500 text-white p-4 rounded shadow-lg text-center">
          <h2 className="text-lg font-semibold">Active Patrols</h2>
          <p className="text-2xl">{dashboardData.activePatrols}</p>
        </div>
      </div>

      {/* Tanods Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-indigo-500 text-white p-4 rounded shadow-lg text-center relative">
          <h2 className="text-lg font-semibold">Online Tanods</h2>
          {isLoading ? (
            <div className="animate-pulse">
              <div className="h-8 bg-indigo-400 rounded w-16 mx-auto"></div>
            </div>
          ) : (
            <p className="text-2xl">{dashboardData.onlineTanods}</p>
          )}
        </div>
        <div className="bg-teal-500 text-white p-4 rounded shadow-lg text-center">
          <h2 className="text-lg font-semibold">Tanods on Patrol</h2>
          <p className="text-2xl">{dashboardData.tanodsOnPatrol}</p>
        </div>
        <div className="bg-orange-500 text-white p-4 rounded shadow-lg text-center">
          <h2 className="text-lg font-semibold">Total Tanods</h2>
          <p className="text-2xl">{dashboardData.totalTanods}</p>
        </div>
        <div className="bg-pink-500 text-white p-4 rounded shadow-lg text-center">
          <h2 className="text-lg font-semibold">Available Tanods</h2>
          <p className="text-2xl">{dashboardData.availableTanods}</p>
        </div>
      </div>

      {/* Notes and Calendar Section */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-white p-4 rounded shadow-lg col-span-1 TopNav">
          {/* Calendar */}
          <div className="mt-4">
            <h2 className="text-lg font-semibold mb-4">Calendar</h2>
            <Calendar className="TopNav" onChange={handleDateChange} value={date} />
          </div>

          {/* Notes */}
          <div className="flex flex-col mt-2">
            <h2 className="text-lg font-semibold mb-4">Notes</h2>
            <div className="flex-1 overflow-y-auto max-h-64">
              <ul>
                {notes.map((note) => (
                  <li
                    key={note._id}
                    className="border-b py-2 flex justify-between items-center"
                  >
                    <div className="flex-grow">
                      <span className="font-bold">{note.date}: </span>
                      <span>{note.content}</span>
                    </div>
                    <button
                      onClick={() => deleteNote(note._id)}
                      className="text-red-600 ml-2 hover:text-red-800"
                    >
                      <FaTrash />
                    </button>
                  </li>
                ))}
              </ul>
            </div>
            <div className="flex items-center mt-4">
              <input
                type="text"
                value={currentNote}
                onChange={(e) => setCurrentNote(e.target.value)}
                placeholder="Add a note..."
                className="border p-2 rounded mr-2 flex-grow text-black"
              />
              <button onClick={addNote} className="bg-blue-500 text-white p-2 rounded">
                Add
              </button>
            </div>
          </div>
        </div>

        {/* Chart Section */}
        <div className="bg-white p-4 rounded shadow-lg col-span-3 TopNav">
          <h2 className="text-lg font-semibold mb-4">Incident Chart</h2>
          <Line data={chartData} />
        </div>
      </div>

      {/* Map and Top Performers Section */}
      <div className="flex flex-col lg:flex-row space-y-4 lg:space-y-0 lg:space-x-4">
        {/* Map Section */}
        <div className="bg-white p-4 rounded shadow-lg w-full lg:w-3/4 TopNav">
          <h2 className="text-lg font-semibold mb-4">Map</h2>
          <MapContainer center={mapCenter} zoom={13} style={{ height: '400px', width: '100%' }}>
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            />
            {incidents.map((incident, index) => (
              <Marker key={incident.id} position={incident.position}>
                <Popup>{incident.details}</Popup>
                <Tooltip>{`Marker ${index + 1}`}</Tooltip>
              </Marker>
            ))}
            <MapEvents />
          </MapContainer>
        </div>

        {/* Top Performers Section */}
        <div className="bg-white p-4 rounded shadow-lg w-full lg:w-1/4 TopNav">
          <h2 className="text-lg font-semibold mb-4">Tanod Performance Ranking</h2>
          <div className="overflow-y-auto max-h-[340px] text-black"> {/* Add scroll for many items */}
            <ul className="space-y-3">
              {dashboardData.topPerformers.map((performer, index) => (
                <li 
                  key={index} 
                  className={`flex justify-between items-center p-3 rounded-lg ${
                    index === 0 ? 'bg-yellow-100 border-2 border-yellow-400' :
                    index === 1 ? 'bg-gray-100 border-2 border-gray-400' :
                    index === 2 ? 'bg-orange-100 border-2 border-orange-400' :
                    'bg-white border border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center">
                    <span className={`w-8 h-8 rounded-full flex items-center justify-center mr-3 ${
                      index === 0 ? 'bg-yellow-400 text-white' :
                      index === 1 ? 'bg-gray-400 text-white' :
                      index === 2 ? 'bg-orange-400 text-white' :
                      'bg-blue-100 text-blue-600'
                    }`}>
                      {index + 1}
                    </span>
                    <span className={index < 3 ? 'font-semibold' : 'text-gray-600'}>
                      {performer.name}
                    </span>
                  </div>
                  <span className={index < 3 ? 'font-bold' : 'text-gray-600'}>
                    <div className="flex items-center gap-1">
                      {renderStars(Number(performer.rating))}
                      <span className="text-sm ml-1">({performer.rating?.toFixed(1)})</span>
                    </div>
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;

import React, { useState, useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import "chart.js/auto";
import { Line } from "react-chartjs-2";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
import { FaTrash } from "react-icons/fa";
import L from "leaflet";
import { useMap } from "react-leaflet";
import axios from "axios";
import { toast } from "react-toastify";
import io from "socket.io-client";

// Set Leaflet icon paths for markers
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require("leaflet/dist/images/marker-icon-2x.png"),
  iconUrl: require("leaflet/dist/images/marker-icon.png"),
  shadowUrl: require("leaflet/dist/images/marker-shadow.png"),
});

// TanodDashboard component
const TanodDashboard = () => {
  // Add equipment state
  const [equipment, setEquipment] = useState([]);

  // Add these new state declarations at the top with other state variables
  const [currentScheduleId, setCurrentScheduleId] = useState(null);
  const [patrolLogs, setPatrolLogs] = useState([]);
  const [patrolAreas, setPatrolAreas] = useState([]);

  const [incidents, setIncidents] = useState([]);
  const [patrolSchedule, setPatrolSchedule] = useState([]);
  const [ratingFeedbacks, setRatingFeedbacks] = useState([]); // Dummy feedback data
  const [assignments, setAssignments] = useState([]); // Dummy patrol assignments/logs
  const [date, setDate] = useState(new Date());
  const [notes, setNotes] = useState([]);
  const [currentNote, setCurrentNote] = useState("");

  const [dashboardData, setDashboardData] = useState({
    patrolsCompleted: 0,
    incidentsResolved: 0,
    ratings: {
      average: 0,
      total: 0,
      comments: [] // Add comments array to store rating comments
    },
    upcomingPatrols: [],
    recentIncidents: []
  });

  const fetchDashboardData = async () => {
    try {
      const token = localStorage.getItem('token');
      const userId = localStorage.getItem('userId');

      // Get current schedule ID and patrol data
      const patrolRes = await axios.get(
        `${process.env.REACT_APP_API_URL}/auth/tanod-schedules/${userId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Get incident reports for this tanod
      const incidentRes = await axios.get(
        `${process.env.REACT_APP_API_URL}/incident-reports`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Filter incidents where this tanod is the responder
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
          comments: ratingsRes.data.comments || [] // Store the comments array
        },
        monthlyIncidents: getMonthlyIncidentCounts(myIncidents),
        recentIncidents: myIncidents.slice(0, 5)
      });

      // Set incidents for chart data
      setIncidents(myIncidents);

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast.error('Failed to load dashboard data');
    }
  };

  // Add this helper function
  const getMonthlyIncidentCounts = (incidents) => {
    const monthlyCounts = new Array(12).fill(0);
    incidents.forEach(incident => {
      const month = new Date(incident.date).getMonth();
      monthlyCounts[month]++;
    });
    return monthlyCounts;
  };

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

  // Modify equipment fetch function to check for default date
  const fetchEquipment = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `${process.env.REACT_APP_API_URL}/auth/equipments`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      // Filter equipment with default date (1970-01-01) or no return date
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

  useEffect(() => {
    fetchDashboardData();
    fetchEquipment(); // Add this line
    const interval = setInterval(() => {
      fetchDashboardData();
      fetchEquipment(); // Add this line
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

  useEffect(() => {
    fetchPatrolAreas();
  }, []);

  // Chart data for incidents Tanod responded to
  const chartData = {
    labels: [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ],
    datasets: [
      {
        label: "Incidents Responded To",
        data: dashboardData.monthlyIncidents || Array(12).fill(0),
        backgroundColor: "rgba(54, 162, 235, 0.2)",
        borderColor: "rgba(54, 162, 235, 1)",
        borderWidth: 1,
        fill: true,
      },
    ],
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
      
      setNotes(response.data); // Update with the new notes array
      setCurrentNote('');
      toast.success('Note added successfully');
    } catch (error) {
      console.error('Error saving note:', error);
      toast.error('Failed to save note');
    }
  };

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

  useEffect(() => {
    fetchNotes();
  }, []);

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
              permanent: true,
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

  const MapEvents = () => {
    const map = useMap();

    useEffect(() => {
      if (map) {
        patrolAreas.forEach(area => {
          if (area.coordinates) {
            const polygon = L.polygon(
              area.coordinates.map(coord => [coord.lat, coord.lng]),
              {
                color: area.color,
                fillOpacity: 0.2,
                weight: 2
              }
            );

            polygon.bindTooltip(area.legend, {
              permanent: true,
              direction: 'center'
            });

            polygon.addTo(map);
          }
        });
      }
    }, [map, patrolAreas]);

    return null;
  };

  return (
    <div className="p-4 md:p-8">
      <h1 className="text-3xl font-bold mb-8">Tanod Dashboard</h1>

      {/* Patrols Overview - Now with 3 cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div className="bg-blue-500 text-white p-4 rounded shadow-lg text-center">
          <h2 className="text-lg font-semibold">Patrols Completed</h2>
          <p className="text-2xl">{dashboardData.patrolsCompleted}</p>
        </div>

        <div className="bg-green-500 text-white p-4 rounded shadow-lg text-center">
          <h2 className="text-lg font-semibold">Incidents Resolved</h2>
          <p className="text-2xl">{dashboardData.incidentsResolved}</p>
        </div>

        <div className="bg-yellow-500 text-white p-4 rounded shadow-lg text-center">
          <h2 className="text-lg font-semibold">Currently Borrowed Equipment</h2>
          <p className="text-2xl">{equipment.length}</p>
        </div>
      </div>

      {/* Notes and Calendar Section */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-white p-4 rounded shadow-lg col-span-1 TopNav">
          {/* Calendar */}
          <div className="mt-4">
            <h2 className="text-lg font-semibold mb-4">Calendar</h2>
            <Calendar className="TopNav" onChange={setDate} value={date} />
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
              <button
                onClick={addNote}
                className="bg-blue-500 text-white p-2 rounded"
              >
                Add
              </button>
            </div>
          </div>
        </div>

        {/* Chart Section */}
        <div className="bg-white p-4 rounded shadow-lg col-span-3 TopNav">
          <h2 className="text-lg font-semibold mb-4">
            Incident Response Chart
          </h2>
          <Line data={chartData} />
        </div>
      </div>
      {/* Map and Rating Feedback Section */}
      <div className="flex flex-col lg:flex-row space-y-4 lg:space-y-0 lg:space-x-4 mb-8">
        {/* Map Section */}
        <div
          className="bg-white p-4 rounded shadow-lg w-full lg:w-3/4 TopNav"
          style={{ height: "500px" }}
        >
          <h2 className="text-lg font-semibold mb-4">Patrol Map</h2>
          <div style={{ height: "calc(100% - 40px)" }}>
            {" "}
            {/* Adjusts height to fill remaining space */}
            <MapContainer
              center={[14.7356, 121.0498]} // Center on your default location
              zoom={15}
              style={{ width: "100%", height: "100%" }} // Map will take full height of its container
            >
              <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
              <MapDisplay />
            </MapContainer>
          </div>
        </div>

        {/* Rating/Feedback Section - Now with comments */}
        <div className="bg-white p-4 rounded shadow-lg w-full lg:w-1/4 TopNav">
          <h2 className="text-lg font-semibold mb-4">Rating Feedback</h2>
          <div className="flex flex-col space-y-4">
            <div className="text-center">
              <p className="text-3xl font-bold">{dashboardData.ratings.average.toFixed(1)} ⭐</p>
              <p className="text-gray-600">Average Rating</p>
            </div>
            <div className="text-center mb-4">
              <p className="text-2xl font-semibold">{dashboardData.ratings.total}</p>
              <p className="text-gray-600">Total Ratings</p>
            </div>
            
            {/* Comments Section */}
            <div className="mt-4">
              <h3 className="text-md font-semibold mb-2">Recent Comments</h3>
              <div className="overflow-y-auto max-h-64 text-black">
                <ul className="space-y-2">
                  {dashboardData.ratings.comments?.map((rating, index) => (
                    <li key={index} className="text-sm p-2 bg-gray-50 rounded">
                      <div>
                        <p className="text-gray-600 mb-1">Rating: {"⭐".repeat(rating.rating)}</p>
                        <p>"{rating.comment}"</p>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TanodDashboard;

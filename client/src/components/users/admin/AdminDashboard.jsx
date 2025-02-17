import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Tooltip } from 'react-leaflet';
import 'leaflet/dist/leaflet.css'; // Correct CSS import
import 'chart.js/auto';
import { Line } from 'react-chartjs-2';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import { FaTrash } from 'react-icons/fa';

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

  // Dummy patrol data
  const patrolData = {
    patrolsScheduled: 25,
    incidentsResponded: 12,
    totalPatrols: 150,
    activePatrols: 3,
    onlineTanods: 18,
    tanodsOnPatrol: 15,
    totalTanods: 20,
    availableTanods: 5,
  };

  // Dummy top performers data
  const topPerformers = [
    { name: 'Tanod 1', rating: 4.8 },
    { name: 'Tanod 2', rating: 4.5 },
    { name: 'Tanod 3', rating: 4.7 },
    { name: 'Tanod 4', rating: 4.9 },
  ];

  // Complex chart data for incidents happening over time
  const chartData = {
    labels: [
      'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
    ],
    datasets: [
      {
        label: 'Robbery',
        data: [3, 1, 2, 4, 5, 2, 6, 4, 3, 2, 1, 2],
        backgroundColor: 'rgba(255, 99, 132, 0.2)',
        borderColor: 'rgba(255, 99, 132, 1)',
        borderWidth: 1,
        fill: true, // Enable filling for area chart
      },
      {
        label: 'Fire',
        data: [1, 0, 1, 2, 1, 3, 1, 0, 2, 2, 3, 1],
        backgroundColor: 'rgba(54, 162, 235, 0.2)',
        borderColor: 'rgba(54, 162, 235, 1)',
        borderWidth: 1,
        fill: true, // Enable filling for area chart
      },
      {
        label: 'Burglary',
        data: [2, 3, 4, 2, 1, 3, 2, 1, 4, 3, 5, 4],
        backgroundColor: 'rgba(75, 192, 192, 0.2)',
        borderColor: 'rgba(75, 192, 192, 1)',
        borderWidth: 1,
        fill: true, // Enable filling for area chart
      },
      {
        label: 'Assault',
        data: [4, 5, 3, 2, 6, 3, 4, 2, 1, 2, 4, 5],
        backgroundColor: 'rgba(153, 102, 255, 0.2)',
        borderColor: 'rgba(153, 102, 255, 1)',
        borderWidth: 1,
        fill: true, // Enable filling for area chart
      },
      {
        label: 'Theft',
        data: [2, 4, 2, 5, 3, 2, 4, 3, 5, 2, 1, 2],
        backgroundColor: 'rgba(255, 159, 64, 0.2)',
        borderColor: 'rgba(255, 159, 64, 1)',
        borderWidth: 1,
        fill: true, // Enable filling for area chart
      },
    ],
  };

  // Dummy data for incidents
  useEffect(() => {
    setIncidents([
      { id: 1, position: [14.6760, 121.0453], details: 'Robbery in Fairview, Quezon City' },
      { id: 2, position: [14.6994, 121.0371], details: 'Fire in North Fairview, Quezon City' },
      { id: 3, position: [14.6546, 121.0483], details: 'Burglary near SM Fairview' },
      { id: 4, position: [14.6590, 121.0618], details: 'Assault in Commonwealth' },
      { id: 5, position: [14.6861, 121.0330], details: 'Theft at a local store' },
    ]);
  }, []);

  // Function to handle date change on the calendar
  const handleDateChange = (newDate) => {
    setDate(newDate);
  };

  // Function to add a note for the selected date
  const addNote = () => {
    const formattedDate = date.toLocaleDateString();
    if (currentNote) {
      setNotes((prevNotes) => [
        ...prevNotes,
        { date: formattedDate, note: currentNote },
      ]);
      setCurrentNote(''); // Clear the input field
    }
  };

  const deleteNote = (index) => {
    setNotes((prevNotes) => prevNotes.filter((_, i) => i !== index));
  };

  return (
    <div className="p-4 md:p-8">
      <h1 className="text-3xl font-bold mb-8">Admin Dashboard</h1>

      {/* Patrol and Incidents Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-blue-500 text-white p-4 rounded shadow-lg text-center">
          <h2 className="text-lg font-semibold">Patrols Scheduled</h2>
          <p className="text-2xl">{patrolData.patrolsScheduled}</p>
        </div>
        <div className="bg-green-500 text-white p-4 rounded shadow-lg text-center">
          <h2 className="text-lg font-semibold">Incidents Responded</h2>
          <p className="text-2xl">{patrolData.incidentsResponded}</p>
        </div>
        <div className="bg-yellow-500 text-white p-4 rounded shadow-lg text-center">
          <h2 className="text-lg font-semibold">Total Patrols</h2>
          <p className="text-2xl">{patrolData.totalPatrols}</p>
        </div>
        <div className="bg-red-500 text-white p-4 rounded shadow-lg text-center">
          <h2 className="text-lg font-semibold">Active Patrols</h2>
          <p className="text-2xl">{patrolData.activePatrols}</p>
        </div>
      </div>

      {/* Tanods Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-indigo-500 text-white p-4 rounded shadow-lg text-center">
          <h2 className="text-lg font-semibold">Online Tanods</h2>
          <p className="text-2xl">{patrolData.onlineTanods}</p>
        </div>
        <div className="bg-teal-500 text-white p-4 rounded shadow-lg text-center">
          <h2 className="text-lg font-semibold">Tanods on Patrol</h2>
          <p className="text-2xl">{patrolData.tanodsOnPatrol}</p>
        </div>
        <div className="bg-orange-500 text-white p-4 rounded shadow-lg text-center">
          <h2 className="text-lg font-semibold">Total Tanods</h2>
          <p className="text-2xl">{patrolData.totalTanods}</p>
        </div>
        <div className="bg-pink-500 text-white p-4 rounded shadow-lg text-center">
          <h2 className="text-lg font-semibold">Available Tanods</h2>
          <p className="text-2xl">{patrolData.availableTanods}</p>
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
                {notes.map((note, index) => (
                  <li key={index} className="border-b py-2 flex justify-between items-center">
                    <span className="font-bold">{note.date}:</span> {note.note}
                    <button onClick={() => deleteNote(index)} className="text-red-600 ml-2">
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
          </MapContainer>
        </div>

        {/* Top Performers Section */}
        <div className="bg-white p-4 rounded shadow-lg w-full lg:w-1/4 TopNav">
          <h2 className="text-lg font-semibold mb-4">Top Tanod Performers</h2>
          <ul>
            {topPerformers.map((performer, index) => (
              <li key={index} className="flex justify-between py-1">
                <span>{performer.name}</span>
                <span>{'⭐'.repeat(Math.round(performer.rating))} ({performer.rating})</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;

import React from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css"; // Leaflet CSS
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import L from "leaflet";

// Fix leaflet icon issue
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png",
});

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

const Home = () => {
  // Crime incidents chart data
  const crimeData = {
    labels: ["January", "February", "March", "April", "May", "June", "July"],
    datasets: [
      {
        label: "Robberies",
        data: [5, 7, 3, 8, 4, 6, 9],
        borderColor: "rgba(255, 99, 132, 1)",
        backgroundColor: "rgba(255, 99, 132, 0.2)",
        borderWidth: 2,
      },
      {
        label: "Assaults",
        data: [3, 4, 6, 7, 5, 3, 4],
        borderColor: "rgba(54, 162, 235, 1)",
        backgroundColor: "rgba(54, 162, 235, 0.2)",
        borderWidth: 2,
      },
      {
        label: "Vandalism",
        data: [2, 1, 3, 4, 2, 5, 6],
        borderColor: "rgba(255, 206, 86, 1)",
        backgroundColor: "rgba(255, 206, 86, 0.2)",
        borderWidth: 2,
      },
    ],
  };

  // Dummy data for map, incidents, patrols, announcements, and news
  const recentIncidents = [
    {
      id: 1,
      type: "Robbery",
      location: "Main Street",
      status: "Resolved",
      date: "2024-10-20",
    },
    {
      id: 2,
      type: "Vandalism",
      location: "Central Park",
      status: "Under Investigation",
      date: "2024-10-19",
    },
    {
      id: 3,
      type: "Noise Disturbance",
      location: "Elm Avenue",
      status: "Pending",
      date: "2024-10-18",
    },
    {
      id: 4,
      type: "Fire Alarm",
      location: "Riverbank",
      status: "Resolved",
      date: "2024-10-17",
    },
    {
      id: 5,
      type: "Street Fight",
      location: "5th Avenue",
      status: "Pending",
      date: "2024-10-16",
    },
  ];

  const patrols = [
    {
      id: 1,
      area: "North Zone",
      time: "08:00 AM - 12:00 PM",
      status: "On Patrol",
    },
    {
      id: 2,
      area: "South Zone",
      time: "12:00 PM - 04:00 PM",
      status: "Scheduled",
    },
    {
      id: 3,
      area: "East Zone",
      time: "04:00 PM - 08:00 PM",
      status: "Scheduled",
    },
    {
      id: 4,
      area: "West Zone",
      time: "08:00 PM - 12:00 AM",
      status: "On Patrol",
    },
  ];

  const announcements = [
    { id: 1, message: "Community Cleanup Drive this Saturday at 9 AM." },
    { id: 2, message: "Scam alert! Report suspicious activity in your area." },
    { id: 3, message: "Tanod patrol schedules have been updated." },
    {
      id: 4,
      message:
        "Halloween party for residents on October 31st at the community hall!",
    },
  ];

  const news = [
    {
      id: 1,
      title: "New Patrol Schedules Announced",
      description:
        "The barangay has updated patrol schedules for the upcoming month.",
    },
    {
      id: 2,
      title: "Community Awareness Drive",
      description:
        "Join our community drive to raise awareness on safety measures.",
    },
    {
      id: 3,
      title: "Incident Reporting System Upgrade",
      description:
        "We have upgraded our incident reporting system to ensure quicker response times.",
    },
  ];

  // Center map over an example location
  const position = [14.599512, 120.984222]; // Example coordinates for Manila

  return (
    <div className="p-8 TopNav rounded-2xl">
      <h1 className="text-4xl font-bold mb-8 text-center">
        Residents Dashboard
      </h1>

      {/* Map Section */}
      <div className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">
          Patrol Map
        </h2>
        <div className="w-full h-64 bg-gray-200 rounded-lg shadow-md">
          <MapContainer
            center={position}
            zoom={13}
            scrollWheelZoom={false}
            style={{ height: "100%", width: "100%" }}
          >
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            />
            {/* Example marker for patrol location */}
            <Marker position={position}>
              <Popup>Current Patrol Location: Manila</Popup>
            </Marker>
          </MapContainer>
        </div>
      </div>

      {/* Recent Incidents */}
      <div className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">
          Recent Incidents
        </h2>
        <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {recentIncidents.map((incident) => (
            <div
              key={incident.id}
              className="bg-white shadow-md rounded-lg p-4"
            >
              <h3 className="text-lg font-bold text-gray-700">
                {incident.type}
              </h3>
              <p className="text-gray-600">Location: {incident.location}</p>
              <p className="text-gray-600">Date: {incident.date}</p>
              <p
                className={`mt-2 text-sm font-semibold ${
                  incident.status === "Resolved"
                    ? "text-green-500"
                    : incident.status === "Pending"
                    ? "text-yellow-500"
                    : "text-red-500"
                }`}
              >
                Status: {incident.status}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Current Patrols */}
      <div className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">
          Current Patrols
        </h2>
        <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {patrols.map((patrol) => (
            <div key={patrol.id} className="bg-white shadow-md rounded-lg p-4">
              <h3 className="text-lg font-bold text-gray-700">{patrol.area}</h3>
              <p className="text-gray-600">Time: {patrol.time}</p>
              <p
                className={`mt-2 text-sm font-semibold ${
                  patrol.status === "On Patrol"
                    ? "text-green-500"
                    : "text-yellow-500"
                }`}
              >
                Status: {patrol.status}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Announcements */}
      <div className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">
          Announcements
        </h2>
        <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {announcements.map((announcement) => (
            <div
              key={announcement.id}
              className="bg-white shadow-md rounded-lg p-4"
            >
              <p className="text-gray-700">{announcement.message}</p>
            </div>
          ))}
        </div>
      </div>

      {/* News Section */}
      <div className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">
          Latest News
        </h2>
        <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {news.map((article) => (
            <div key={article.id} className="bg-white shadow-md rounded-lg p-4">
              {" "}
              <h3 className="text-lg font-bold text-gray-700">
                {article.title}
              </h3>{" "}
              <p className="text-gray-600">{article.description}</p>{" "}
            </div>
          ))}{" "}
        </div>{" "}
      </div>
      {/* Crime Incidents Chart */}
      <div className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">
          Crime Incidents
        </h2>
        <div className="bg-white shadow-md rounded-lg p-4">
          <Line className="TopNav rounded-lg p-5" data={crimeData} />
        </div>
      </div>
    </div>
  );
};

export default Home;

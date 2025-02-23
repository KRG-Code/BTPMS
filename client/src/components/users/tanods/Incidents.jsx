import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { FaUserShield } from "react-icons/fa";
import TanodPatrolSchedule from "./incidentComponents/TanodPatrolSchedule";
import ReportIncident from "./incidentComponents/ReportIncident";
import ViewReportedIncidents from "./incidentComponents/ViewReportedIncidents";
import io from 'socket.io-client'; // Import socket.io-client

const Incidents = ({ fetchCurrentPatrolArea, setUserLocation }) => { // Add setUserLocation as a prop
  const [patrols, setPatrols] = useState([]);
  const [upcomingPatrols, setUpcomingPatrols] = useState([]);
  const [incident, setIncident] = useState({ type: "", description: "", location: "" });
  const [incidentLog, setIncidentLog] = useState([]);
  const [currentReport, setCurrentReport] = useState(localStorage.getItem("currentReport") || "");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [showTodaySchedule, setShowTodaySchedule] = useState(false);
  const [showReportIncident, setShowReportIncident] = useState(false);
  const [showReportedIncidents, setShowReportedIncidents] = useState(false);
  const [todayPatrols, setTodayPatrols] = useState([]);
  const [patrolLogs, setPatrolLogs] = useState(JSON.parse(localStorage.getItem("patrolLogs")) || []);
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [deleteIndex, setDeleteIndex] = useState(null);
  const [editIndex, setEditIndex] = useState(null); // Track the index being edited
  const [hasStartedPatrol, setHasStartedPatrol] = useState(false);
  const [currentScheduleId, setCurrentScheduleId] = useState(null); // Track the current schedule ID
  const [isTracking, setIsTracking] = useState(JSON.parse(localStorage.getItem("isTracking")) || false); // Persist tracking state
  const [userProfile, setUserProfile] = useState(null); // Define userProfile
  const [watchId, setWatchId] = useState(null); // Add state to store watchId
  const [intervalId, setIntervalId] = useState(null); // Add state to store intervalId
  const socketRef = useRef(null); // Add socketRef

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
      localStorage.setItem("userId", response.data._id); // Store userId in localStorage
      setUserProfile(response.data); // Set userProfile
      return response.data;
    } catch (error) {
      console.error("Error fetching user profile:", error);
      toast.error("Error fetching user profile.");
      return null;
    }
  };

  const fetchUpcomingPatrols = async () => {
    const token = localStorage.getItem('token');
    const userProfile = await fetchUserProfile();
    if (!token || !userProfile) return;

    try {
      const response = await axios.get(`${process.env.REACT_APP_API_URL}/auth/tanod-schedules/${userProfile._id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
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
      setUpcomingPatrols(schedulesWithPatrolArea || []);
      setTodayPatrols(schedulesWithPatrolArea.filter(schedule => {
        const today = new Date();
        const startTime = new Date(schedule.startTime);
        return startTime.toDateString() === today.toDateString();
      }));
      const startedPatrol = schedulesWithPatrolArea.some(schedule => {
        const patrolStatus = schedule.patrolStatus.find(status => status.tanodId === userProfile._id);
        return patrolStatus && patrolStatus.status === 'Started';
      });
      setHasStartedPatrol(startedPatrol);

      if (startedPatrol) {
        const currentSchedule = schedulesWithPatrolArea.find(schedule => {
          const patrolStatus = schedule.patrolStatus.find(status => status.tanodId === userProfile._id);
          return patrolStatus && patrolStatus.status === 'Started';
        });
        setCurrentScheduleId(currentSchedule._id); // Set the current schedule ID

      }
    } catch (error) {
      console.error('Error fetching upcoming patrols:', error);
      toast.error('Failed to load upcoming patrols.');
    }
  };

  useEffect(() => {
    fetchUpcomingPatrols();
  }, []);

  const toggleDropdown = () => {
    setIsDropdownOpen(!isDropdownOpen);
  };

  const savePatrolLog = () => {
    const timestamp = new Date().toLocaleString();
    const logEntry = { report: currentReport, timestamp, scheduleId: currentScheduleId };

    let updatedLogs;
    if (editIndex !== null) {
      // Update the existing log entry
      updatedLogs = patrolLogs.map((log, index) => (index === editIndex ? logEntry : log));
      setEditIndex(null); // Reset the edit index
    } else {
      // Add a new log entry
      updatedLogs = [...patrolLogs, logEntry];
    }

    setPatrolLogs(updatedLogs);
    localStorage.setItem("patrolLogs", JSON.stringify(updatedLogs));
    localStorage.setItem("currentReport", "");
    setCurrentReport(""); // Clear the text area after saving
    toast.success("Patrol log saved.");
  };

  const confirmDeletePatrolLog = (index) => {
    setDeleteIndex(index);
    setShowDeleteConfirmation(true);
  };

  const deletePatrolLog = () => {
    const updatedLogs = patrolLogs.filter((_, i) => i !== deleteIndex);
    setPatrolLogs(updatedLogs);
    localStorage.setItem("patrolLogs", JSON.stringify(updatedLogs));
    toast.success("Patrol log deleted.");
    setShowDeleteConfirmation(false);
    setDeleteIndex(null);
  };

  const editPatrolLog = (index) => {
    const log = patrolLogs[index];
    setCurrentReport(log.report);
    setEditIndex(index); // Set the index being edited
  };

  const uploadPatrolLogs = async (scheduleId) => {
    const token = localStorage.getItem("token");
    if (!token || !scheduleId) return;

    try {
      await axios.post(`${process.env.REACT_APP_API_URL}/auth/save-patrol-logs`, {
        scheduleId,
        logs: patrolLogs.filter(log => log.scheduleId === scheduleId), // Filter logs by schedule ID
      }, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setPatrolLogs([]); // Clear the logs after saving
      localStorage.removeItem("patrolLogs"); // Clear local storage
      toast.success("Patrol logs uploaded successfully");
    } catch (error) {
      console.error('Error uploading patrol logs:', error);
      toast.error('Failed to upload patrol logs');
    }
  };

  const startTracking = () => {
    setIsTracking(true);
    localStorage.setItem("isTracking", true); // Persist tracking state
    if (navigator.geolocation) {
      const id = navigator.geolocation.watchPosition(updateUserLocation, handleLocationError);
      setWatchId(id); // Store the watchId

      // Set an interval to update location every 5 seconds
      const interval = setInterval(() => {
        navigator.geolocation.getCurrentPosition(updateUserLocation, handleLocationError);
      }, 5000);
      setIntervalId(interval); // Store the intervalId

      // Connect to WebSocket
      const socketUrl = process.env.NODE_ENV === 'production' 
        ? 'https://barangaypatrol.lgu1.com'  // Production WebSocket URL
        : 'http://localhost:5000';           // Development WebSocket URL
      socketRef.current = io(socketUrl, { withCredentials: true });
      socketRef.current.on('connect', () => {
        console.log('Connected to WebSocket');
      });
      socketRef.current.on('disconnect', () => {
        console.log('Disconnected from WebSocket');
      });
    }
  };

  const stopTracking = () => {
    setIsTracking(false);
    localStorage.setItem("isTracking", false); // Persist tracking state
    if (navigator.geolocation && watchId !== null) {
      navigator.geolocation.clearWatch(watchId); // Clear the watch using watchId
      setWatchId(null); // Reset the watchId
    }
    if (intervalId !== null) {
      clearInterval(intervalId); // Clear the interval
      setIntervalId(null); // Reset the intervalId
    }
    setUserLocation(null); // Clear the user location

    // Disconnect from WebSocket
    if (socketRef.current) {
      socketRef.current.disconnect();
    }
  };

  const updateUserLocation = async (position) => {
    const { latitude, longitude } = position.coords;
    console.log(`Current location: Latitude ${latitude}, Longitude ${longitude}`); // Log the current location
    setUserLocation({ latitude, longitude }); // Update the user location state
    if (userProfile) {
      // Emit location update via WebSocket
      console.log('Emitting location update:', { 
        userId: userProfile._id, 
        latitude, 
        longitude, 
        profilePicture: userProfile.profilePicture,
        patrolArea: userProfile.patrolArea,
        firstName: userProfile.firstName,
        lastName: userProfile.lastName,
        currentScheduleId // Pass the current schedule ID
      });
      socketRef.current.emit('locationUpdate', {
        userId: userProfile._id,
        latitude,
        longitude,
        profilePicture: userProfile.profilePicture, // Pass the profile picture
        patrolArea: userProfile.patrolArea, // Pass the patrol area
        firstName: userProfile.firstName, // Pass the first name
        lastName: userProfile.lastName, // Pass the last name
        currentScheduleId // Pass the current schedule ID
      });
    } else {
      console.error('User profile is not available.');
    }
  };

  const handleLocationError = (error) => {
    switch (error.code) {
      case error.PERMISSION_DENIED:
        toast.error("User denied the request for Geolocation.");
        break;
      case error.POSITION_UNAVAILABLE:
        toast.error("Location information is unavailable. Retrying...");
        setTimeout(() => {
          navigator.geolocation.getCurrentPosition(updateUserLocation, handleLocationError);
        }, 5000);
        break;
      case error.TIMEOUT:
        toast.error("The request to get user location timed out. Retrying...");
        setTimeout(() => {
          navigator.geolocation.getCurrentPosition(updateUserLocation, handleLocationError);
        }, 5000);
        break;
      case error.UNKNOWN_ERROR:
        toast.error("An unknown error occurred.");
        break;
      default:
        toast.error("An error occurred while fetching location.");
    }
    console.error("Error getting user's location:", error);
  };

  return (
    <div className="p-4 max-w-4xl mx-auto bg-white bg-opacity-75 shadow-lg rounded-lg TopNav border border-blue-600">
      <h1 onClick={toggleDropdown} className="text-2xl md:text-3xl font-bold text-center mb-4 cursor-pointer bg-blue-600 text-white py-2 px-4 rounded-lg shadow hover:bg-blue-700 transition">
        <FaUserShield className="inline-block mr-2" />
      </h1>
      
      {isDropdownOpen && (
        <div className="dropdown-content">
          <div className="mb-4 flex justify-center space-x-4">
            <button
              onClick={() => setShowTodaySchedule(true)}
              className="bg-blue-600 text-white text-sm md:text-base px-4 py-2 md:px-6 md:py-2 rounded-lg shadow hover:bg-blue-700 transition"
            >
              Today's Patrol Schedule
            </button>
            <button
              onClick={() => setShowReportIncident(true)}
              className="bg-green-600 text-white text-sm md:text-base px-4 py-2 md:px-6 md:py-2 rounded-lg shadow hover:bg-green-700 transition"
            >
              Report an Incident
            </button>
            <button
              onClick={() => setShowReportedIncidents(true)}
              className="bg-yellow-600 text-white text-sm md:text-base px-4 py-2 md:px-6 md:py-2 rounded-lg shadow hover:bg-yellow-700 transition"
            >
              View Reported Incidents
            </button>
            {isTracking ? (
              <button onClick={stopTracking} className="bg-red-600 text-white text-sm md:text-base px-4 py-2 md:px-6 md:py-2 rounded-lg shadow hover:bg-red-700 transition">
                Stop Tracking
              </button>
            ) : (
              <button onClick={() => fetchUserProfile().then(() => startTracking())} className="bg-green-600 text-white text-sm md:text-base px-4 py-2 md:px-6 md:py-2 rounded-lg shadow hover:bg-green-700 transition">
                Start Tracking
              </button>
            )}
          </div>

          {hasStartedPatrol && (
            <>
              <h2 className="text-xl md:text-2xl mb-2">Log Patrol Report</h2>
              <textarea
                className="border p-2 mb-4 w-full h-24 rounded text-sm md:text-base text-black"
                placeholder="Enter your patrol report..."
                value={currentReport}
                onChange={(e) => setCurrentReport(e.target.value)}
              />
              <button onClick={savePatrolLog} className="bg-blue-600 text-white text-sm md:text-base px-4 py-2 md:px-6 md:py-2 rounded-lg shadow hover:bg-blue-700 transition">
                Save Log
              </button>
            </>
          )}

          {patrolLogs.filter(log => log.scheduleId === currentScheduleId).length > 0 && (
            <div className="mt-4">
              <h3 className="text-lg md:text-xl font-bold mb-2">Saved Patrol Logs</h3>
              <div className="overflow-y-auto" style={{ maxHeight: "200px" }}>
                <table className="min-w-full bg-white shadow-md rounded-lg border overflow-hidden text-center">
                  <thead className="TopNav">
                    <tr>
                      <th className="border px-4 py-2 text-sm md:text-base">Time Log</th>
                      <th className="border px-4 py-2 text-sm md:text-base">Report</th>
                      <th className="border px-4 py-2 text-sm md:text-base">Action</th>
                    </tr>
                  </thead>
                  <tbody className="text-black">
                    {patrolLogs.filter(log => log.scheduleId === currentScheduleId).map((log, index) => (
                      <tr key={index}>
                        <td className="border px-4 py-2 text-sm md:text-base">{log.timestamp}</td>
                        <td className="border px-4 py-2 text-sm md:text-base">{log.report}</td>
                        <td className="border px-4 py-2 text-sm md:text-base">
                          <button onClick={() => editPatrolLog(index)} className="bg-yellow-600 text-white text-sm md:text-base px-2 py-1 md:px-3 md:py-1 rounded shadow hover:bg-yellow-700 transition">
                            Edit
                          </button>
                          <button onClick={() => confirmDeletePatrolLog(index)} className="bg-red-600 text-white text-sm md:text-base px-2 py-1 md:px-3 md:py-1 rounded shadow hover:bg-red-700 transition ml-2">
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {showTodaySchedule && (
        <TanodPatrolSchedule
          todayPatrols={todayPatrols}
          setShowTodaySchedule={setShowTodaySchedule}
          fetchUpcomingPatrols={fetchUpcomingPatrols}
          fetchCurrentPatrolArea={fetchCurrentPatrolArea}
          uploadPatrolLogs={uploadPatrolLogs} // Pass the function as a prop
        />
      )}

      {showReportIncident && (
        <ReportIncident
          incident={incident}
          setIncident={setIncident}
          setIncidentLog={setIncidentLog}
          incidentLog={incidentLog}
          setShowReportIncident={setShowReportIncident}
        />
      )}

      {showReportedIncidents && (
        <ViewReportedIncidents
          incidentLog={incidentLog}
          setShowReportedIncidents={setShowReportedIncidents}
        />
      )}

      {showDeleteConfirmation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg w-11/12 max-w-lg relative TopNav">
            <h2 className="text-xl md:text-2xl font-bold mb-4">Confirm Delete</h2>
            <p>Are you sure you want to delete this patrol log?</p>
            <div className="mt-4 flex justify-end space-x-4">
              <button onClick={deletePatrolLog} className="bg-red-600 text-white text-sm md:text-base px-4 py-2 rounded shadow hover:bg-red-700 transition">
                Delete
              </button>
              <button onClick={() => setShowDeleteConfirmation(false)} className="bg-gray-600 text-white text-sm md:text-base px-4 py-2 rounded shadow hover:bg-gray-700 transition">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Incidents

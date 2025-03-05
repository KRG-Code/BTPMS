import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { FaUserShield } from "react-icons/fa";
import TanodPatrolSchedule from "./incidentComponents/TanodPatrolSchedule";
import ReportIncident from "./incidentComponents/IncidentResponse";
import ViewReportedIncidents from "./incidentComponents/ViewReportedIncidents";
import io from 'socket.io-client'; // Import socket.io-client
import { MapContainer } from 'react-leaflet'; // Import MapContainer

const Incidents = ({ 
  fetchCurrentPatrolArea, 
  setUserLocation, 
  setIncidentLocations, 
  incidentReports, 
  isTrackingVisible, 
  toggleTracking,
  showReportIncident,
  setShowReportIncident,
  selectedIncidentForResponse,
  setSelectedIncidentForResponse
}) => { // Add setUserLocation as a prop
  const [patrols, setPatrols] = useState([]);
  const [upcomingPatrols, setUpcomingPatrols] = useState([]);
  const [incident, setIncident] = useState({ type: "", description: "", location: "" });
  const [incidentLog, setIncidentLog] = useState([]);
  const [currentReport, setCurrentReport] = useState(localStorage.getItem("currentReport") || "");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [showTodaySchedule, setShowTodaySchedule] = useState(false);
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

  const updateUserLocation = (position, profile) => {
    if (!profile) return;

    const { latitude, longitude } = position.coords;
    const locationData = { 
      latitude, 
      longitude, 
      profilePicture: profile.profilePicture
    };
    
    setUserLocation(locationData);
    
    if (socketRef.current) {
      socketRef.current.emit('locationUpdate', {
        userId: profile._id,
        ...locationData,
        firstName: profile.firstName,
        lastName: profile.lastName,
        currentScheduleId
      });
    }
  };

  const startTracking = async () => {
    const profile = await fetchUserProfile();
    if (!profile) {
      toast.error("Failed to fetch user profile");
      return;
    }

    setIsTracking(true);
    toggleTracking();
    localStorage.setItem("isTracking", "true");
    
    // Initialize socket connection
    const socketUrl = process.env.NODE_ENV === 'production' 
      ? 'https://barangaypatrol.lgu1.com'
      : 'http://localhost:5000';
      
    socketRef.current = io(socketUrl, { 
      withCredentials: true,
      query: { userId: profile._id, role: 'tanod' }
    });

    // Start location tracking
    if (navigator.geolocation) {
      const id = navigator.geolocation.watchPosition(
        (position) => updateUserLocation(position, profile),
        handleLocationError,
        { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
      );
      setWatchId(id);

      // Initial location update
      navigator.geolocation.getCurrentPosition(
        (position) => updateUserLocation(position, profile),
        handleLocationError
      );
    }
  };

  const stopTracking = () => {
    setIsTracking(false);
    toggleTracking(); // Call this first to ensure map cleanup
    localStorage.setItem("isTracking", "false");
    
    // Clear tracking data
    setUserLocation(null);
    
    // Clear geolocation watchers
    if (navigator.geolocation && watchId !== null) {
      navigator.geolocation.clearWatch(watchId);
      setWatchId(null);
    }
    if (intervalId !== null) {
      clearInterval(intervalId);
      setIntervalId(null);
    }

    // Disconnect socket
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
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
    <div className="p-2 sm:p-4 max-w-4xl mx-auto bg-white bg-opacity-75 shadow-lg rounded-lg TopNav border border-blue-600">
      <h1 onClick={toggleDropdown} className="text-xl sm:text-2xl md:text-3xl font-bold text-center mb-2 sm:mb-4 cursor-pointer bg-blue-600 text-white py-2 px-4 rounded-lg shadow hover:bg-blue-700 transition">
        <FaUserShield className="inline-block mr-2" />
      </h1>
      
      {isDropdownOpen && (
        <div className="dropdown-content space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-4">
            <button
              onClick={() => setShowTodaySchedule(true)}
              className="w-full bg-blue-600 text-white text-sm sm:text-base px-3 py-2 rounded-lg shadow hover:bg-blue-700 transition"
            >
              Today's Schedule
            </button>
            <div className="flex gap-2">
              <button
                onClick={() => setShowReportedIncidents(true)}
                className="w-full bg-yellow-600 text-white text-sm sm:text-base px-3 py-2 rounded-lg shadow hover:bg-yellow-700 transition"
              >
                View Reports
              </button>
              {selectedIncidentForResponse && selectedIncidentForResponse.status === 'In Progress' && (
                <button
                  onClick={() => setShowReportIncident(true)}
                  className="w-full bg-green-600 text-white text-sm sm:text-base px-3 py-2 rounded-lg shadow hover:bg-green-700 transition"
                >
                  Respond to Incident
                </button>
              )}
            </div>
            {isTracking ? (
              <button 
                onClick={stopTracking} 
                className="w-full bg-red-600 text-white text-sm sm:text-base px-3 py-2 rounded-lg shadow hover:bg-red-700 transition"
              >
                Stop Tracker
              </button>
            ) : (
              <button 
                onClick={() => fetchUserProfile().then(() => startTracking())} 
                className="w-full bg-green-600 text-white text-sm sm:text-base px-3 py-2 rounded-lg shadow hover:bg-green-700 transition"
              >
                Turn On Tracker
              </button>
            )}
          </div>

          {hasStartedPatrol && (
            <div className="space-y-2 sm:space-y-4">
              <h2 className="text-lg sm:text-xl md:text-2xl mb-2">Log Patrol Report</h2>
              <textarea
                className="border p-2 mb-2 sm:mb-4 w-full h-24 rounded text-sm sm:text-base text-black"
                placeholder="Enter your patrol report..."
                value={currentReport}
                onChange={(e) => setCurrentReport(e.target.value)}
              />
              <button 
                onClick={savePatrolLog} 
                className="w-full sm:w-auto bg-blue-600 text-white text-sm sm:text-base px-4 py-2 rounded-lg shadow hover:bg-blue-700 transition"
              >
                Save Log
              </button>
            </div>
          )}

          {patrolLogs.filter(log => log.scheduleId === currentScheduleId).length > 0 && (
            <div className="mt-4">
              <h3 className="text-base sm:text-lg md:text-xl font-bold mb-2">Saved Patrol Logs</h3>
              <div className="overflow-x-auto overflow-y-auto max-h-[200px] sm:max-h-[300px]">
                <table className="min-w-full bg-white shadow-md rounded-lg border overflow-hidden text-center">
                  <thead className="TopNav">
                    <tr>
                      <th className="border px-2 sm:px-4 py-2 text-xs sm:text-sm md:text-base">Time Log</th>
                      <th className="border px-2 sm:px-4 py-2 text-xs sm:text-sm md:text-base">Report</th>
                      <th className="border px-2 sm:px-4 py-2 text-xs sm:text-sm md:text-base">Action</th>
                    </tr>
                  </thead>
                  <tbody className="text-black">
                    {patrolLogs.filter(log => log.scheduleId === currentScheduleId).map((log, index) => (
                      <tr key={index}>
                        <td className="border px-2 sm:px-4 py-2 text-xs sm:text-sm md:text-base">{log.timestamp}</td>
                        <td className="border px-2 sm:px-4 py-2 text-xs sm:text-sm md:text-base">{log.report}</td>
                        <td className="border px-2 sm:px-4 py-2 text-xs sm:text-sm md:text-base">
                          <div className="flex flex-col sm:flex-row gap-1 sm:gap-2 justify-center">
                            <button 
                              onClick={() => editPatrolLog(index)} 
                              className="bg-yellow-600 text-white text-xs sm:text-sm px-2 py-1 rounded shadow hover:bg-yellow-700 transition"
                            >
                              Edit
                            </button>
                            <button 
                              onClick={() => confirmDeletePatrolLog(index)} 
                              className="bg-red-600 text-white text-xs sm:text-sm px-2 py-1 rounded shadow hover:bg-red-700 transition"
                            >
                              Delete
                            </button>
                          </div>
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
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4">
            <TanodPatrolSchedule
              todayPatrols={todayPatrols}
              setShowTodaySchedule={setShowTodaySchedule}
              fetchUpcomingPatrols={fetchUpcomingPatrols}
              fetchCurrentPatrolArea={fetchCurrentPatrolArea}
              uploadPatrolLogs={uploadPatrolLogs} // Pass the function as a prop
            />
          </div>
        </div>
      )}

      {showReportIncident && selectedIncidentForResponse && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black bg-opacity-50"
             style={{ touchAction: 'none' }}
             onClick={(e) => {
               if (e.target === e.currentTarget) {
                 setShowReportIncident(false);
               }
             }}>
          <div className="flex items-center justify-center min-h-screen px-4">
            <div onClick={(e) => e.stopPropagation()}>
              <ReportIncident
                incident={incident}
                setIncident={setIncident}
                setIncidentLog={setIncidentLog}
                incidentLog={incidentLog}
                setShowReportIncident={setShowReportIncident}
                selectedIncident={selectedIncidentForResponse}
                setSelectedIncidentForResponse={setSelectedIncidentForResponse}
              />
            </div>
          </div>
        </div>
      )}

      {showReportedIncidents && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4">
            <ViewReportedIncidents
              setShowReportedIncidents={setShowReportedIncidents}
              setIncidentLocations={setIncidentLocations}
              incidentReports={incidentReports}
              setShowReportIncident={setShowReportIncident}
              setSelectedIncidentForResponse={setSelectedIncidentForResponse}
            />
          </div>
        </div>
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

export default Incidents;

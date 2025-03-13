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
  setIncidentReports, // Add this prop
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
  const watchPositionId = useRef(null);
  const [prevUserLocation, setPrevUserLocation] = useState(null);  // Add this state

  // Add global animation styles
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
@keyframes pulse {
  0% { transform: scale(0.1); opacity: 1; }
  50% { transform: scale(1); opacity: .5; }
  100% { transform: scale(1.5); opacity: 0; }
}

@keyframes markerPulse {
  0% { transform: scale(0.1); opacity: 1; }
  50% { transform: scale(1); opacity: 0.5; }
  100% { transform: scale(1.5); opacity: 0; }
}

.pulse-animation {
  animation: pulse 2s ease-out infinite;
}
    `;
    document.head.appendChild(style);
    return () => document.head.removeChild(style);
  }, []);

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
    // Check if the report is empty or only contains whitespace
    if (!currentReport || !currentReport.trim()) {
      toast.error("Cannot save empty patrol log.");
      return;
    }

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

  // Update the fetchPatrolAreaColor function
const fetchPatrolAreaColor = async (scheduleId) => {
  try {
    const token = localStorage.getItem('token');
    const schedule = await axios.get(
      `${process.env.REACT_APP_API_URL}/auth/schedule/${scheduleId}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );

    // Extract patrol area ID properly
    const patrolAreaId = schedule.data.patrolArea?._id || schedule.data.patrolArea;
    
    if (patrolAreaId) {
      const patrolArea = await axios.get(
        `${process.env.REACT_APP_API_URL}/polygons/${patrolAreaId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      return patrolArea.data.color;
    }
    return 'red'; // default color
  } catch (error) {
    console.error('Error fetching patrol area color:', error);
    return 'red'; // default color
  }
};

// Update updateUserLocation to include better error logging
const updateUserLocation = async (position, profile) => {
  if (!profile || !position?.coords) return;

  const { latitude, longitude } = position.coords;
  
  const newLocation = {
    latitude,
    longitude,
    currentScheduleId,
    markerColor: currentScheduleId ? await fetchPatrolAreaColor(currentScheduleId) : 'red',
    isOnPatrol: !!currentScheduleId
  };

  // Only update if location has actually changed
  if (!hasLocationChanged(prevUserLocation, newLocation)) {
    return;
  }
  
  try {
    const token = localStorage.getItem('token');
    
    await axios.post(
      `${process.env.REACT_APP_API_URL}/locations/update`,
      {
        ...newLocation,
        userId: profile._id
      },
      {
        headers: { Authorization: `Bearer ${token}` }
      }
    );
    
    const locationData = {
      ...newLocation,
      firstName: profile.firstName,
      lastName: profile.lastName,
      profilePicture: profile.profilePicture,
    };

    setPrevUserLocation(locationData);
    setUserLocation(locationData); // Always update location

  } catch (error) {
    console.error('Error updating location:', error?.response?.data || error.message);
    toast.error('Failed to update location');
  }
};

// Add helper function to check if location update is needed
const shouldUpdateLocation = (newLocation) => {
  if (!prevUserLocation) {
    setPrevUserLocation(newLocation);
    return true;
  }
  
  const minDistanceChange = 5; // 5 meters minimum change
  const distance = calculateDistance(
    prevUserLocation.latitude,
    prevUserLocation.longitude,
    newLocation.latitude,
    newLocation.longitude
  );

  const shouldUpdate = distance > minDistanceChange || 
                       prevUserLocation.currentScheduleId !== newLocation.currentScheduleId ||
                       prevUserLocation.areaColor !== newLocation.areaColor;
  
  if (shouldUpdate) {
    setPrevUserLocation(newLocation);
  }
  
  return shouldUpdate;
};

// Add distance calculation helper
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371e3; // Earth's radius in meters
  const φ1 = lat1 * Math.PI/180;
  const φ2 = lat2 * Math.PI/180;
  const Δφ = (lat2-lat1) * Math.PI/180;
  const Δλ = (lon2-lon1) * Math.PI/180;

  const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
          Math.cos(φ1) * Math.cos(φ2) *
          Math.sin(Δλ/2) * Math.sin(Δλ/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

  return R * c;
};

const startLocationTracking = async () => {
  const profile = await fetchUserProfile();
  if (!profile) {
    toast.error("Failed to fetch user profile");
    return;
  }

  if (navigator.geolocation) {
    const options = {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 5000, // Update this to cache positions for 5 seconds
      distanceFilter: 5
    };

    try {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          updateUserLocation(position, profile);
          
          if (watchPositionId.current) {
            navigator.geolocation.clearWatch(watchPositionId.current);
          }
          
          watchPositionId.current = navigator.geolocation.watchPosition(
            (position) => updateUserLocation(position, profile),
            handleLocationError,
            options
          );
        },
        handleLocationError,
        options
      );
    } catch (error) {
      console.error('Geolocation error:', error);
      toast.error('Error initializing location tracking');
    }
  } else {
    toast.error('Geolocation is not supported by your browser');
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

  // Only initialize socket if it doesn't exist
  if (!socketRef.current) {
    const socketUrl = process.env.NODE_ENV === 'production' 
      ? 'https://barangaypatrol.lgu1.com'
      : 'http://localhost:5000';

    const token = localStorage.getItem('token');
    if (!token) {
      toast.error('Authentication required');
      return;
    }

    socketRef.current = io(socketUrl, {
      auth: { token },
      withCredentials: true,
      transports: ['websocket'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      timeout: 20000
    });

    socketRef.current.on('connect', () => {
      console.log('Connected to socket server');
      socketRef.current.emit('joinTrackingRoom');
      startLocationTracking(); // Start location tracking after socket connects
    });

    socketRef.current.on('locationUpdate', (data) => {
      if (data.userId?._id === profile._id) {
        const locationData = {
          ...data,
          latitude: data.latitude,
          longitude: data.longitude,
          markerColor: data.markerColor || 'red',
          isOnPatrol: data.isOnPatrol || false,
          profilePicture: profile.profilePicture,
          firstName: profile.firstName,
          lastName: profile.lastName
        };
        setUserLocation(locationData);
      }
    });
  } else {
    // If socket exists, just start location tracking
    startLocationTracking();
  }
};

const stopTracking = async () => {
  try {
    // Clear the watch position first
    if (watchPositionId.current) {
      navigator.geolocation.clearWatch(watchPositionId.current);
      watchPositionId.current = null;
    }

    const token = localStorage.getItem('token');
    await axios.post(
      `${process.env.REACT_APP_API_URL}/locations/deactivate`,
      {},
      {
        headers: { Authorization: `Bearer ${token}` }
      }
    );

    setIsTracking(false);
    toggleTracking();
    localStorage.setItem("isTracking", "false");
    setUserLocation(null);
  } catch (error) {
    console.error('Error deactivating tracking:', error);
    toast.error('Failed to stop tracking');
  }
};

const handleLocationError = (error) => {
  let errorMessage = '';
  
  switch (error.code) {
    case error.PERMISSION_DENIED:
      errorMessage = "Location access denied. Please enable location services in your browser settings.";
      break;
    case error.POSITION_UNAVAILABLE:
      errorMessage = "Location information is unavailable. Please check your device's GPS settings.";
      break;
    case error.TIMEOUT:
      errorMessage = "Location request timed out. Please try again.";
      break;
    case error.UNKNOWN_ERROR:
    default:
      errorMessage = "An unknown error occurred while getting location.";
      break;
  }

  console.error('Geolocation error:', error.code, error.message);
  toast.error(errorMessage);

  // Stop tracking if there's a critical error
  if (error.code === error.PERMISSION_DENIED) {
    stopTracking();
  }
};

// Add this helper function at the top level of your component
const hasLocationChanged = (prevLoc, newLoc) => {
  if (!prevLoc) return true;
  
  return (
    prevLoc.latitude !== newLoc.latitude ||
    prevLoc.longitude !== newLoc.longitude ||
    prevLoc.currentScheduleId !== newLoc.currentScheduleId ||
    prevLoc.markerColor !== newLoc.markerColor ||
    prevLoc.isOnPatrol !== newLoc.isOnPatrol
  );
};

  // Add effect to start tracking on component mount
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      startTracking();
    }
    
    return () => {
      // Cleanup tracking on unmount
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
      if (watchPositionId.current) {
        navigator.geolocation.clearWatch(watchPositionId.current);
      }
      localStorage.setItem("isTracking", "false");
      setIsTracking(false);
      setUserLocation(null);
    };
  }, []);

  // Replace the tracking initialization effect with this updated version
  useEffect(() => {
    let isMounted = true;

    const initializeTracking = async () => {
      try {
        const token = localStorage.getItem('token');
        const wasTracking = JSON.parse(localStorage.getItem("isTracking") || "false");

        if (token && wasTracking && isMounted) {
          const profile = await fetchUserProfile();
          if (profile && isMounted) {
            setUserProfile(profile);
            setIsTracking(true);
            toggleTracking();

            // Initialize socket connection first
            if (!socketRef.current) {
              const socketUrl = process.env.NODE_ENV === 'production' 
                ? 'https://barangaypatrol.lgu1.com'
                : 'http://localhost:5000';

              socketRef.current = io(socketUrl, {
                auth: { token },
                withCredentials: true,
                transports: ['websocket'],
                reconnection: true,
                reconnectionAttempts: 5,
                reconnectionDelay: 1000,
                timeout: 20000
              });

              socketRef.current.on('connect', () => {
                socketRef.current.emit('joinTrackingRoom');
                // Start location tracking only after socket connects
                startLocationTracking();
              });

              // Set up socket event handlers
              setupSocketHandlers(profile);
            }

            // If socket exists but not connected, connect it
            if (socketRef.current && !socketRef.current.connected) {
              socketRef.current.connect();
            }

            // Start location tracking if socket is already connected
            if (socketRef.current && socketRef.current.connected) {
              startLocationTracking();
            }
          }
        }
      } catch (error) {
        console.error('Error initializing tracking:', error);
        toast.error('Failed to initialize tracking');
      }
    };

    initializeTracking();

    return () => {
      isMounted = false;
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
      if (watchPositionId.current) {
        navigator.geolocation.clearWatch(watchPositionId.current);
      }
    };
  }, []);

  // Add this new function to setup socket handlers
  const setupSocketHandlers = (profile) => {
    if (!socketRef.current) return;

    socketRef.current.on('locationUpdate', (data) => {
      if (data.userId?._id === profile._id) {
        const locationData = {
          ...data,
          latitude: data.latitude,
          longitude: data.longitude,
          markerColor: data.markerColor || 'red',
          isOnPatrol: data.isOnPatrol || false,
          profilePicture: profile.profilePicture,
          firstName: profile.firstName,
          lastName: profile.lastName
        };
        setUserLocation(locationData);
      }
    });

    socketRef.current.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
      toast.error('Connection error occurred');
    });
  };

  // Update the handleLocationUpdate function
  const handleLocationUpdate = (data) => {
    if (!socketRef.current) return;

    if (data.userId?._id === userProfile?._id) {
      const locationData = {
        ...data,
        latitude: data.latitude,
        longitude: data.longitude,
        markerColor: data.markerColor || 'red',
        isOnPatrol: data.isOnPatrol || false,
        profilePicture: userProfile.profilePicture,
        firstName: userProfile.firstName,
        lastName: userProfile.lastName
      };
      
      setUserLocation(locationData);
      setPrevUserLocation(locationData);
    }
  };

  return (
    <div className="p-2 sm:p-4 max-w-4xl mx-auto bg-white bg-opacity-75 shadow-lg rounded-lg TopNav border border-blue-600">
      <h1 onClick={toggleDropdown} className="text-xl sm:text-2xl md:text-3xl font-bold text-center mb-2 sm:mb-4 cursor-pointer bg-blue-600 text-white py-2 px-4 rounded-lg shadow hover:bg-blue-700 transition">
        <FaUserShield className="inline-block mr-2" />
      </h1>
      
      {isDropdownOpen && (
        <div className="dropdown-content space-y-4">
          {/* Replace the grid layout with this new responsive layout */}
          <div className="flex flex-col sm:flex-row gap-2 w-full">
            <div className="flex flex-col sm:flex-row gap-2 flex-grow">
              <button
                onClick={() => setShowTodaySchedule(true)}
                className="w-full sm:flex-1 bg-blue-600 text-white px-3 py-2 text-sm sm:text-base rounded-lg shadow hover:bg-blue-700 transition flex items-center justify-center"
              >
                Today's Schedule
              </button>
              <button
                onClick={() => setShowReportedIncidents(true)}
                className="w-full sm:flex-1 bg-yellow-600 text-white px-3 py-2 text-sm sm:text-base rounded-lg shadow hover:bg-yellow-700 transition flex items-center justify-center"
              >
                View Reports
              </button>
            </div>
            {selectedIncidentForResponse && selectedIncidentForResponse.status === 'In Progress' && (
              <button
                onClick={() => setShowReportIncident(true)}
                className="w-full sm:w-auto bg-green-600 text-white px-3 py-2 text-sm sm:text-base rounded-lg shadow hover:bg-green-700 transition flex items-center justify-center"
              >
                Respond to Incident
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

import React, { useEffect, useRef, useState } from 'react';
import { MapContainer, TileLayer, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import axios from 'axios';
import { toast } from 'react-toastify';
import io from 'socket.io-client'; // Import socket.io-client
import L from 'leaflet';
import { FaUserCircle, FaSync } from 'react-icons/fa'; // Add FaSync import
import IncidentReports from './PatrolTrackingComponents/IncidentReports'; // Import IncidentReports component
import ViewLocation from './PatrolTrackingComponents/ViewLocation'; // Import ViewLocation component

const PatrolTracking = () => {
  const mapRef = useRef(null);
  const [tanodLocations, setTanodLocations] = useState([]);
  const [patrolAreas, setPatrolAreas] = useState([]);
  const [isTrackingVisible, setIsTrackingVisible] = useState(JSON.parse(localStorage.getItem("isTrackingVisible")) || false); // Persist visibility state
  const socketRef = useRef(null); // Add socketRef
  const userMarkerRefs = useRef({}); // Add userMarkerRefs to store markers
  const [incidentLocations, setIncidentLocations] = useState({}); // Add state for incident locations
  const [selectedReport, setSelectedReport] = useState(null); // Add state for selected incident
  const [incidentReports, setIncidentReports] = useState([]); // Add state for incident reports

  const fetchPatrolAreas = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      toast.error('Please log in.');
      return;
    }

    try {
      const response = await axios.get(`${process.env.REACT_APP_API_URL}/polygons`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setPatrolAreas(response.data);
    } catch (error) {
      console.error('Error fetching patrol areas:', error);
      toast.error('Failed to load patrol areas.');
    }
  };

  const fetchIncidentReports = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      toast.error('Please log in.');
      return;
    }

    try {
      const response = await axios.get(`${process.env.REACT_APP_API_URL}/incident-reports`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setIncidentReports(response.data);
    } catch (error) {
      console.error('Error fetching incident reports:', error);
      toast.error('Failed to load incident reports.');
    }
  };

  const fetchScheduleById = async (scheduleId) => {
    const token = localStorage.getItem('token');
    if (!token) {
      toast.error('Please log in.');
      return null;
    }

    try {
      const response = await axios.get(`${process.env.REACT_APP_API_URL}/auth/schedule/${scheduleId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching schedule:', error);
      return null;
    }
  };

  const fetchPatrolAreaById = async (patrolAreaId) => {
    const token = localStorage.getItem('token');
    if (!token) {
      toast.error('Please log in.');
      return null;
    }

    try {
      const response = await axios.get(`${process.env.REACT_APP_API_URL}/polygons/${patrolAreaId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching patrol area:', error);
      return null;
    }
  };

  const initializeWebSocket = () => {
    const socketUrl = process.env.NODE_ENV === 'production' 
      ? 'https://barangaypatrol.lgu1.com'  // Production WebSocket URL
      : 'http://localhost:5000';           // Development WebSocket URL
    socketRef.current = io(socketUrl, { withCredentials: true }); // Connect to the correct namespace

    socketRef.current.on('connect', () => {
    });

    socketRef.current.on('disconnect', () => {
    });

    socketRef.current.on('connect_error', (error) => {
    });

    socketRef.current.on('locationUpdate', async (data) => {
      const { userId, latitude, longitude, profilePicture, firstName, lastName, currentScheduleId } = data;

      const schedule = await fetchScheduleById(currentScheduleId);
      const patrolAreaId = schedule?.patrolArea?._id || schedule?.patrolArea;
      const patrolArea = patrolAreaId ? await fetchPatrolAreaById(patrolAreaId) : null;

      setTanodLocations((prevLocations) => {
        const existingLocation = prevLocations.find(location => location.userId === userId);
        if (existingLocation) {
          return prevLocations.map(location =>
            location.userId === userId ? { ...location, latitude, longitude, profilePicture, patrolArea, firstName, lastName, currentScheduleId } : location
          );
        } else {
          return [...prevLocations, { userId, latitude, longitude, profilePicture, patrolArea, firstName, lastName, currentScheduleId }];
        }
      });

      // Clear existing layers to prevent duplication
      if (mapRef.current) {
        mapRef.current.eachLayer((layer) => {
          if (layer instanceof L.Polygon) {
            mapRef.current.removeLayer(layer);
          }
        });
      }
    });
  };

  const toggleTrackingVisibility = () => {
    const newVisibilityState = !isTrackingVisible;
    setIsTrackingVisible(newVisibilityState);
    localStorage.setItem("isTrackingVisible", newVisibilityState); // Persist visibility state
    refreshMap(); // Refresh the map
  };

  const refreshMap = () => {
    if (mapRef.current) {
      mapRef.current.eachLayer((layer) => {
        if (layer instanceof L.Marker || layer instanceof L.Polygon) {
          mapRef.current.removeLayer(layer);
        }
      });

      // Re-add patrol areas
      patrolAreas.forEach(area => {
        if (area && area.coordinates) {
          const layer = L.polygon(
            area.coordinates.map(({ lat, lng }) => [lat, lng]),
            { color: area.color, fillOpacity: 0.2, weight: 2 }
          );
          layer.bindTooltip(area.legend, { permanent: true, direction: 'center' });
          layer.addTo(mapRef.current);
        }
      });

      // Re-add tanod locations
      tanodLocations.forEach(({ userId, latitude, longitude, profilePicture, patrolArea }) => {
        const userMarker = L.marker([latitude, longitude], {
          icon: L.divIcon({
            className: 'custom-icon',
            html: `<div style="position: relative; width: 50px; height: 50px;">
                     <div style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; border-radius: 50%; background-color: ${patrolArea?.color || 'red'}; animation: pulse 1.5s infinite;"></div>
                     <div style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; background-image: url(${profilePicture || ''}); background-size: cover; border-radius: 50%; border: 2px solid ${patrolArea?.color || 'red'};">
                     </div>
                   </div>
                   <style>
                     @keyframes pulse {
                       0% { transform: scale(0.5); opacity: 1; }
                       100% { transform: scale(2); opacity: 0; }
                     }
                   </style>`,
          }),
        });

        if (isTrackingVisible) {
          userMarker.addTo(mapRef.current);
        }
        userMarkerRefs.current[userId] = userMarker;
      });

      // Re-add incident locations
      Object.keys(incidentLocations).forEach((key) => {
        const incidentLocation = incidentLocations[key];
        const latLngMatch = incidentLocation.location.match(/Lat:\s*([0-9.-]+),\s*Lon:\s*([0-9.-]+)/);
        if (latLngMatch) {
          const [_, lat, lng] = latLngMatch.map(Number);
          if (!isNaN(lat) && !isNaN(lng)) {
            const icon = L.divIcon({
              className: 'custom-icon',
              html: `<div style="position: relative; width: 36px; height: 36px;">
                       <div style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; border-radius: 50%; background-color: ${incidentLocation.type === 'Emergency' ? 'rgba(255, 0, 0, 0.5)' : 'rgba(0, 0, 255, 0.5)'}; animation: pulse 1.5s infinite;"></div>
                       <div style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; font-size: 36px; color: ${incidentLocation.type === 'Emergency' ? 'red' : 'blue'};">
                         <i class="fa ${incidentLocation.type === 'Emergency' ? 'fa-exclamation-triangle' : 'fa-info-circle'}"></i>
                       </div>
                     </div>
                     <style>
                       @keyframes pulse {
                         0% { transform: scale(0.5); opacity: 1; }
                         100% { transform: scale(2); opacity: 0; }
                       }
                     </style>`,
            });
            const incidentMarker = L.marker([lat, lng], { icon }).addTo(mapRef.current);
            incidentMarker.on('click', () => {
              const incident = incidentReports.find(report => report._id === key);
              setSelectedReport(incident);
            }); // Add click event listener
            mapRef.current.setView([lat, lng], 15); // Zoom to the location
          }
        }
      });
    }
  };

  const handleRefreshMap = () => {
    // Reset all states
    setTanodLocations([]);
    setPatrolAreas([]);
    setIncidentReports([]);
    setIncidentLocations({});
    setSelectedReport(null);

    // Reinitialize WebSocket connection
    if (socketRef.current) {
      socketRef.current.disconnect();
    }
    initializeWebSocket();

    // Fetch fresh data
    fetchPatrolAreas();
    fetchIncidentReports();
    
    // Clear and refresh map
    if (mapRef.current) {
      mapRef.current.eachLayer((layer) => {
        if (layer instanceof L.Marker || layer instanceof L.Polygon) {
          mapRef.current.removeLayer(layer);
        }
      });
    }
    refreshMap();
    
    toast.success('Map refreshed successfully');
  };

  useEffect(() => {
    fetchPatrolAreas();
    fetchIncidentReports();
    initializeWebSocket(); // Always initialize WebSocket
    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, []);

  useEffect(() => {
    refreshMap();
  }, [tanodLocations, isTrackingVisible, incidentLocations]);

  const MapEvents = () => {
    const map = useMap();

    useEffect(() => {
      if (map) {
        mapRef.current = map;

        // Clear existing layers to prevent duplication
        map.eachLayer((layer) => {
          if (layer instanceof L.Polygon) {
            map.removeLayer(layer);
          }
        });

        patrolAreas.forEach(area => {
          if (area && area.coordinates) {
            const layer = L.polygon(
              area.coordinates.map(({ lat, lng }) => [lat, lng]),
              { color: area.color, fillOpacity: 0.2, weight: 2 }
            );
            layer.bindTooltip(area.legend, { permanent: true, direction: 'center' });
            layer.addTo(map);
          }
        });
      }
    }, [patrolAreas]);

    return null;
  };

  return (
    <div className="flex w-full h-full">
      <div className="relative w-2/3 h-full mr-6">
        <MapContainer center={[14.7356, 121.0498]} zoom={13} style={{ height: '100%', width: '100%' }} ref={mapRef}>
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          <MapEvents />
          {Object.keys(incidentLocations).map((key) => (
            <ViewLocation
              key={key}
              location={incidentLocations[key].location}
              isVisible={!!incidentLocations[key]}
              incidentType={incidentLocations[key].type}
              markerId={key}
              onMarkerClick={() => {
                const incident = incidentReports.find(report => report._id === key);
                setSelectedReport(incident);
              }} // Pass the click handler
            />
          ))}
        </MapContainer>
      </div>
      <div className="w-1/3 h-full flex flex-col items-center bg-gray-100 p-4 space-y-4 rounded-lg TopNav">
        <div className="w-full flex justify-between gap-2">
          <button 
            onClick={toggleTrackingVisibility} 
            className={`flex-1 py-3 text-white text-lg rounded-lg shadow transition ${
              isTrackingVisible ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'
            }`}
          >
            {isTrackingVisible ? 'Hide Tracking' : 'Show Tracking'}
          </button>
          <button
            onClick={handleRefreshMap}
            className="px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow transition flex items-center justify-center"
            title="Refresh Map"
          >
            <FaSync className="text-xl" />
          </button>
        </div>
        <div className="w-full overflow-y-auto">
          <IncidentReports 
            setIncidentLocations={setIncidentLocations} 
            selectedReport={selectedReport} 
            setSelectedReport={setSelectedReport}
          />
        </div>
      </div>
    </div>
  );
};

export default PatrolTracking;

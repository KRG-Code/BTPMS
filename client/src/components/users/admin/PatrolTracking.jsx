import React, { useEffect, useRef, useState } from 'react';
import { MapContainer, TileLayer, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import axios from 'axios';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import io from 'socket.io-client'; // Import socket.io-client
import L from 'leaflet';
import { FaUserCircle, FaSync } from 'react-icons/fa'; // Add FaSync import
import IncidentReports from './PatrolTrackingComponents/IncidentReports'; // Import IncidentReports component
import ViewLocation from './PatrolTrackingComponents/ViewLocation'; // Import ViewLocation component
import CctvLocationModal from './PatrolTrackingComponents/CctvLocationModal'; // Add import at the top

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
  const [isCctvVisible, setIsCctvVisible] = useState(JSON.parse(localStorage.getItem("isCctvVisible")) || false);
  const [showCctvModal, setShowCctvModal] = useState(false); // Add state for modal visibility
  const [cctvLocations, setCctvLocations] = useState([]); // Add state for CCTV locations

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

  const fetchCctvLocations = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${process.env.REACT_APP_API_URL}/cctv-locations`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setCctvLocations(response.data);
    } catch (error) {
      console.error('Error fetching CCTV locations:', error);
    }
  };

  const createMarker = (location) => {
    if (!mapRef.current) {
      console.error('Map reference is not available');
      return null;
    }

    console.log('Creating marker for location:', location);

    const marker = L.marker([location.latitude, location.longitude], {
      icon: L.divIcon({
        className: 'custom-icon',
        html: `
          <div style="position: relative; width: 50px; height: 50px; z-index: 1000;">
            <div style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; 
                 border-radius: 50%; background-color: ${location.areaColor || 'red'}; 
                 opacity: 0.5; animation: pulse 1.5s infinite; z-index: 998;"></div>
            <div style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; 
                 background-image: url('${location.profilePicture}'); 
                 background-size: cover; border-radius: 50%; 
                 border: 2px solid ${location.areaColor || 'red'}; z-index: 999;"></div>
          </div>
        `,
        iconSize: [50, 50],
        iconAnchor: [25, 25]
      }),
      zIndexOffset: 1000
    });

    marker.bindTooltip(`${location.firstName} ${location.lastName}`, {
      permanent: false,
      direction: 'bottom',
      offset: [0, 10],
      className: 'custom-tooltip'
    });

    return marker;
  };

  const refreshMap = () => {
    if (!mapRef.current || !isTrackingVisible) return;

    console.log('Refreshing map with tanod locations:', tanodLocations);

    // Clear existing markers
    Object.values(userMarkerRefs.current).forEach(marker => {
      if (marker && mapRef.current) {
        mapRef.current.removeLayer(marker);
      }
    });
    userMarkerRefs.current = {};

    // Create new markers
    tanodLocations.forEach(location => {
      if (location.latitude && location.longitude) {
        const userMarker = createMarker(location);
        if (userMarker) {
          userMarker.addTo(mapRef.current);
          userMarkerRefs.current[location.userId] = userMarker;
        }
      }
    });
  };

  const initializeWebSocket = () => {
    const socketUrl = process.env.NODE_ENV === 'production' 
      ? 'https://barangaypatrol.lgu1.com'
      : 'http://localhost:5000';

    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current.removeAllListeners();
    }

    socketRef.current = io(socketUrl, {
      withCredentials: true,
      transports: ['polling', 'websocket'],
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      timeout: 20000
    });

    socketRef.current.on('connect', () => {
      console.log('Connected to WebSocket server');
      socketRef.current.emit('joinTrackingRoom');
    });

    // Add handler for initial locations
    socketRef.current.on('initializeLocations', (locations) => {
      console.log('Received initial locations:', locations);
      setTanodLocations(locations.map(loc => ({
        ...loc,
        lastUpdate: Date.now()
      })));
    });

    socketRef.current.on('locationUpdate', async (data) => {
      console.log('Location update received:', data);
      const { userId, latitude, longitude, profilePicture, firstName, lastName, currentScheduleId } = data;
      
      try {
        // Fetch schedule and patrol area data
        const schedule = await fetchScheduleById(currentScheduleId);
        const patrolAreaId = schedule?.patrolArea?._id || schedule?.patrolArea;
        const patrolArea = patrolAreaId ? await fetchPatrolAreaById(patrolAreaId) : null;
        const areaColor = patrolArea?.color || 'red';

        // Update tanod locations state
        setTanodLocations(prev => {
          const others = prev.filter(loc => loc.userId !== userId);
          const newLocation = {
            userId,
            latitude,
            longitude,
            profilePicture,
            firstName,
            lastName,
            areaColor,
            currentScheduleId,
            patrolArea,
            lastUpdate: Date.now()
          };

          // Create or update marker immediately
          if (mapRef.current && isTrackingVisible) {
            // Remove existing marker if it exists
            if (userMarkerRefs.current[userId]) {
              userMarkerRefs.current[userId].remove();
            }

            // Create new marker
            const marker = createMarker(newLocation);
            if (marker) {
              marker.addTo(mapRef.current);
              userMarkerRefs.current[userId] = marker;
            }
          }

          return [...others, newLocation];
        });
      } catch (error) {
        console.error('Error processing location update:', error);
      }
    });

    // ...existing socket event handlers...
  };

  // Add this new function to handle marker updates
  const updateMarker = (location) => {
    if (!mapRef.current || !isTrackingVisible) return;

    // Remove existing marker if it exists
    if (userMarkerRefs.current[location.userId]) {
      mapRef.current.removeLayer(userMarkerRefs.current[location.userId]);
    }

    // Create new marker
    const marker = createMarker(location);
    marker.addTo(mapRef.current);
    userMarkerRefs.current[location.userId] = marker;
  };

  const handleRefreshMap = async () => {
    try {
      // Clear all existing markers and layers
      if (mapRef.current) {
        mapRef.current.eachLayer((layer) => {
          if (!(layer instanceof L.TileLayer)) {
            layer.remove();
          }
        });
      }
  
      // Clear all stored references
      userMarkerRefs.current = {};
      setTanodLocations([]);
      setPatrolAreas([]);
      setCctvLocations([]);
      setIncidentLocations({});
  
      // Disconnect and reconnect socket
      if (socketRef.current) {
        socketRef.current.disconnect();
        await new Promise(resolve => setTimeout(resolve, 500)); // Small delay before reconnecting
        initializeWebSocket();
      }
  
      // Fetch all data fresh
      await Promise.all([
        fetchPatrolAreas(),
        fetchIncidentReports(),
        fetchCctvLocations()
      ]);
  
      // Force map to update view
      if (mapRef.current) {
        mapRef.current.setView(mapRef.current.getCenter(), mapRef.current.getZoom());
      }
  
      toast.success('Map refreshed successfully');
    } catch (error) {
      console.error('Error refreshing map:', error);
      toast.error('Error refreshing map');
    }
  };

  useEffect(() => {
    fetchPatrolAreas();
    fetchIncidentReports();
    fetchCctvLocations(); // Add this
    initializeWebSocket(); // Always initialize WebSocket

    const intervalId = setInterval(() => {
      if (socketRef.current && !socketRef.current.connected) {
        console.log('Attempting to reconnect...');
        socketRef.current.connect();
      }
    }, 5000);

    return () => {
      clearInterval(intervalId);
      if (socketRef.current) {
        socketRef.current.removeAllListeners();
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (isTrackingVisible) {
      refreshMap();
    } else {
      // Clear all markers when tracking is disabled
      Object.values(userMarkerRefs.current).forEach(marker => {
        if (marker && mapRef.current) {
          marker.remove();
        }
      });
      userMarkerRefs.current = {};
    }
  }, [tanodLocations, isTrackingVisible]);

  // Add CSS for marker animation
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      @keyframes pulse {
        0% { transform: scale(1); opacity: 0.5; }
        50% { transform: scale(1.2); opacity: 0.3; }
        100% { transform: scale(1); opacity: 0.5; }
      }
    `;
    document.head.appendChild(style);
    return () => document.head.removeChild(style);
  }, []);

  // Add this useEffect to handle cleanup of stale markers
  const MARKER_TIMEOUT = 10000; // 10 seconds timeout for inactive markers

  // Update the useEffect that handles cleanup of stale markers
  useEffect(() => {
    const cleanupInterval = setInterval(() => {
      const now = Date.now();
      setTanodLocations(prev => {
        const filtered = prev.filter(loc => (now - loc.lastUpdate) < MARKER_TIMEOUT);
        
        // Remove markers for stale locations
        prev.forEach(loc => {
          if (!filtered.find(f => f.userId === loc.userId)) {
            if (userMarkerRefs.current[loc.userId] && mapRef.current) {
              userMarkerRefs.current[loc.userId].remove();
              delete userMarkerRefs.current[loc.userId];
            }
          }
        });
        
        return filtered;
      });
    }, 5000); // Check every 5 seconds instead of every minute

    return () => clearInterval(cleanupInterval);
  }, []);

  // Remove or update the second cleanup interval since it's redundant now
  // Remove this useEffect or merge it with the one above
  useEffect(() => {
    const cleanup = setInterval(() => {
      const now = Date.now();
      setTanodLocations(prev => 
        prev.filter(loc => now - loc.lastUpdate < MARKER_TIMEOUT)
      );
    }, 5000); // Match the interval with the other cleanup

    return () => clearInterval(cleanup);
  }, []);

  const toggleTrackingVisibility = () => {
    const newVisibilityState = !isTrackingVisible;
    setIsTrackingVisible(newVisibilityState);
    localStorage.setItem("isTrackingVisible", newVisibilityState);

    if (!newVisibilityState) {
      // Clear markers when turning off tracking
      Object.values(userMarkerRefs.current).forEach(marker => {
        if (mapRef.current && mapRef.current.hasLayer(marker)) {
          marker.remove();
        }
      });
      userMarkerRefs.current = {};
    } else {
      // Refresh markers when turning on tracking
      refreshMap();
    }
  };

  const toggleCctvVisibility = () => {
    setShowCctvModal(true);
  };

  // Add cleanup interval to remove stale locations
  useEffect(() => {
    const cleanup = setInterval(() => {
      const now = Date.now();
      setTanodLocations(prev => 
        prev.filter(loc => now - loc.lastUpdate < 300000) // Remove locations older than 5 minutes
      );
    }, 60000); // Run every minute

    return () => clearInterval(cleanup);
  }, []);

  // Add cleanup effect
  useEffect(() => {
    return () => {
      // Cleanup markers when component unmounts
      Object.values(userMarkerRefs.current).forEach(marker => {
        if (marker && mapRef.current) {
          marker.remove();
        }
      });
      userMarkerRefs.current = {};
    };
  }, []);

  // Add this useEffect to persist markers
  useEffect(() => {
    if (isTrackingVisible && mapRef.current) {
      // Clear existing markers
      Object.values(userMarkerRefs.current).forEach(marker => {
        if (marker) marker.remove();
      });
      userMarkerRefs.current = {};

      // Re-add all markers
      tanodLocations.forEach(location => {
        updateMarker(location);
      });
    }
  }, [isTrackingVisible]);

  const MapEvents = () => {
    const map = useMap();
    const layerGroupRef = useRef(null);

    useEffect(() => {
      if (map) {
        mapRef.current = map;

        // Create a new layer group if it doesn't exist
        if (!layerGroupRef.current) {
          layerGroupRef.current = L.layerGroup().addTo(map);
        }

        // Clear only the layers in our layer group
        layerGroupRef.current.clearLayers();

        // Add patrol areas to the layer group
        patrolAreas.forEach(area => {
          if (area && area.coordinates) {
            const layer = L.polygon(
              area.coordinates.map(({ lat, lng }) => [lat, lng]),
              { color: area.color, fillOpacity: 0.2, weight: 2 }
            );
            layer.bindTooltip(area.legend, { permanent: true, direction: 'center' });
            layerGroupRef.current.addLayer(layer);
          }
        });

        // Add CCTV markers to the layer group
        cctvLocations.forEach(cctv => {
          const marker = L.marker([cctv.latitude, cctv.longitude], {
            icon: createCctvMarker()
          });
          
          marker.bindTooltip(
            `<div class="font-semibold">${cctv.name}</div>
             <div class="text-sm mt-1">${cctv.description}</div>`,
            { 
              permanent: false,
              direction: 'top',
              offset: [0, -10],
              className: 'custom-tooltip'
            }
          );
          
          layerGroupRef.current.addLayer(marker);
        });
      }

      return () => {
        if (layerGroupRef.current) {
          layerGroupRef.current.clearLayers();
        }
      };
    }, [patrolAreas, cctvLocations, map]);

    return null;
  };

  const createIncidentMarker = (lat, lng, data, id) => {
    const getMarkerColor = (status) => {
      switch (status) {
        case 'Resolved':
          return 'rgba(34, 197, 94, 0.5)'; // green
        case 'In Progress':
          return 'rgba(59, 130, 246, 0.5)'; // blue
        case 'Pending':
          return data.type === 'Emergency' ? 'rgba(255, 0, 0, 0.5)' : 'rgba(0, 0, 255, 0.5)';
        default:
          return data.type === 'Emergency' ? 'rgba(255, 0, 0, 0.5)' : 'rgba(0, 0, 255, 0.5)';
      }
    };

    return L.marker([lat, lng], {
      icon: L.divIcon({
        className: 'custom-icon',
        html: `<div style="position: relative; width: 36px; height: 36px;">
                 <div style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; 
                      border-radius: 50%; 
                      background-color: ${getMarkerColor(data.status)}; 
                      animation: ${data.status !== 'Resolved' ? 'pulse 1.5s infinite' : 'none'};"></div>
                 <div style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; 
                      display: flex; align-items: center; justify-content: center;">
                   ${data.status === 'Resolved' 
                     ? '<i class="fas fa-check-circle" style="color: green; font-size: 20px;"></i>'
                     : data.type === 'Emergency'
                     ? '<i class="fas fa-exclamation-triangle" style="color: red; font-size: 20px;"></i>'
                     : '<i class="fas fa-info-circle" style="color: blue; font-size: 20px;"></i>'}
                 </div>
               </div>`,
        iconSize: [36, 36],
        iconAnchor: [18, 18]
      }),
      zIndexOffset: data.status === 'Resolved' ? 500 : 1000
    });
  };

  const createCctvMarker = () => {
    return L.divIcon({
      className: 'custom-cctv-icon',
      html: `
        <div class="relative">
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="#3b82f6"
            style="filter: drop-shadow(2px 2px 2px rgba(0,0,0,0.5));"
            class="w-8 h-8"
          >
            <path 
              stroke-linecap="round" 
              stroke-linejoin="round" 
              stroke-width="2" 
              d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
            />
          </svg>
        </div>
      `,
      iconSize: [32, 32],
      iconAnchor: [16, 16],
    });
  };

  const zoomToLocation = (coordinates) => {
    if (mapRef.current && coordinates) {
      mapRef.current.setView(coordinates, 18);
    }
  };

  return (
    <>
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop={true}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
        limit={3} // Add this to limit number of toasts shown at once
      />
      <div className="flex w-full h-full">
        <div className="relative w-2/3 h-full mr-6" style={{ zIndex: 1 }}>
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
              {isTrackingVisible ? 'Stop Tracking' : 'Track Tanods'}
            </button>
            <button 
              onClick={toggleCctvVisibility} 
              className={`flex-1 py-3 text-white text-lg rounded-lg shadow transition ${
                isCctvVisible ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'
              }`}
            >
              CCTV Location
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
              mapRef={mapRef}
              zoomToLocation={zoomToLocation}
            />
          </div>
        </div>
        <CctvLocationModal
          isOpen={showCctvModal}
          onClose={() => setShowCctvModal(false)}
        />
      </div>
    </>
  );
};

export default PatrolTracking;

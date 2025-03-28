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
  const [activePanel, setActivePanel] = useState(null); // Add this line with the other state declarations
  const [lastLocationUpdate, setLastLocationUpdate] = useState({}); // Track the timestamp of last location update per user
  const [isCctvReviewActive, setIsCctvReviewActive] = useState(false); // Ensure we properly track CCTV review state to prevent marker conflicts

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
    // Skip fetching if scheduleId is null
    if (!scheduleId) {
      return null;
    }

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

  const fetchLocations = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `${process.env.REACT_APP_API_URL}/locations/active`, // Updated URL
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setTanodLocations(response.data);
    } catch (error) {
      console.error('Error fetching locations:', error);
      toast.error('Failed to fetch tanod locations');
    }
  };

  const createMarker = (location) => {
    if (!mapRef.current || !location.userId) return null;

    const userInfo = location.userId || {};
    const profilePicture = userInfo.profilePicture || '/default-avatar.png';
    const firstName = userInfo.firstName || 'Unknown';
    const lastName = userInfo.lastName || 'User';

    // Use the markerColor and isOnPatrol status
    const markerColor = location.markerColor || 'red';

    const marker = L.marker([location.latitude, location.longitude], {
      icon: L.divIcon({
        className: 'custom-icon',
        html: `
          <div style="position: relative; width: 50px; height: 50px;">
            <div style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; 
                 border-radius: 50%; background-color: ${markerColor}; 
                 opacity: 0.5; animation: pulse 2s ease-out infinite;"></div>
            <div style="position: absolute; width: 50px; height: 50px; 
                 border-radius: 50%; background-image: url('${profilePicture}');
                 background-size: cover; border: 2px solid ${markerColor};"></div>
          </div>
        `,
        iconSize: [50, 50],
        iconAnchor: [25, 25]
      })
    });

    marker.bindTooltip(`${firstName} ${lastName}`, {
      permanent: false,
      direction: 'bottom',
      offset: [0, 10],
      className: 'custom-tooltip'
    });

    return marker;
  };

  // Improved refreshMap function to properly handle markers
  const refreshMap = () => {
    if (!mapRef.current || !isTrackingVisible) return;

    // Clean up all existing markers first
    Object.values(userMarkerRefs.current).forEach(marker => {
      if (marker && mapRef.current) {
        mapRef.current.removeLayer(marker);
      }
    });
    
    // Reset the markers reference object
    userMarkerRefs.current = {};

    // Only add markers if tracking is enabled
    if (isTrackingVisible) {
      tanodLocations.forEach(location => {
        if (location.latitude && location.longitude && location.userId) {
          const userMarker = createMarker(location);
          if (userMarker) {
            userMarker.addTo(mapRef.current);
            // Store marker reference with userId as key
            const userId = typeof location.userId === 'object' ? location.userId._id : location.userId;
            userMarkerRefs.current[userId] = userMarker;
          }
        }
      });
    }
  };

  const initializeWebSocket = () => {
    const socketUrl = process.env.NODE_ENV === 'production' 
      ? 'https://barangaypatrol.lgu1.com'
      : 'http://localhost:5000';

    const token = localStorage.getItem('token');

    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current.removeAllListeners();
    }

    socketRef.current = io(socketUrl, {
      auth: { token },
      withCredentials: true,
      transports: ['websocket'], // Only use WebSocket transport
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      timeout: 20000,
      forceNew: true
    });

    socketRef.current.on('connect_error', (error) => {
      if (error.message === 'xhr poll error') {
        return; // Ignore polling errors since we're using websocket only
      }
      //toast.error('Connection error. Retrying...');
    });

    socketRef.current.on('connect', () => {
      socketRef.current.emit('joinTrackingRoom');
    });

    socketRef.current.on('disconnect', () => {
      toast.warn('Connection lost. Attempting to reconnect...');
    });

    // Add handler for initial locations
    socketRef.current.on('initializeLocations', (locations) => {
      setTanodLocations(locations.map(loc => ({
        ...loc,
        lastUpdate: Date.now()
      })));
    });

    socketRef.current.on('locationUpdate', async (data) => {
      try {
        const populatedData = { ...data };
        
        // Extract schedule ID correctly
        if (data.currentScheduleId) {
          // Check if currentScheduleId is an object or string
          const scheduleId = typeof data.currentScheduleId === 'object' 
            ? data.currentScheduleId._id 
            : data.currentScheduleId;

          if (scheduleId) {
            const schedule = await fetchScheduleById(scheduleId);
            if (schedule?.patrolArea) {
              const patrolAreaId = schedule.patrolArea._id || schedule.patrolArea;
              const patrolArea = await fetchPatrolAreaById(patrolAreaId);
              populatedData.patrolArea = patrolArea;
            }
          }
        }

        handleLocationUpdate(populatedData);
      } catch (error) {
        console.error('Error processing location update:', error);
        // Still update with original data if population fails
        handleLocationUpdate(data);
      }
    });

    // ...existing socket event handlers...
  };

  // Improved updateMarker function to properly handle existing markers
  const updateMarker = (location) => {
    if (!mapRef.current || !isTrackingVisible) return;

    // Extract userId correctly whether it's an object or string
    const userId = typeof location.userId === 'object' ? location.userId._id : location.userId;
    
    // Check if we already have a marker for this user
    if (userMarkerRefs.current[userId]) {
      // Just update the position of the existing marker
      userMarkerRefs.current[userId].setLatLng([location.latitude, location.longitude]);
    } else {
      // Create a new marker if one doesn't exist
      const marker = createMarker(location);
      if (marker) {
        marker.addTo(mapRef.current);
        userMarkerRefs.current[userId] = marker;
      }
    }
  };

  const handleRefreshMap = async () => {
    try {
      // Clear all existing markers and layers
      if (mapRef.current) {
        // Only remove custom markers, not base tile layers
        Object.values(userMarkerRefs.current).forEach(marker => {
          if (marker) {
            mapRef.current.removeLayer(marker);
          }
        });
      }
  
      // Clear all stored references
      userMarkerRefs.current = {};
      setTanodLocations([]);
      setPatrolAreas([]);
      setCctvLocations([]);
      
      // Don't clear incident locations as they are managed separately
      // setIncidentLocations({});
  
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
        fetchCctvLocations(),
        fetchLocations() // Added missing function call
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
    fetchLocations();
    fetchPatrolAreas();
    fetchIncidentReports();
    fetchCctvLocations();
    initializeWebSocket();

    const refreshInterval = setInterval(fetchLocations, 30000); // Refresh every 30 seconds

    return () => {
      clearInterval(refreshInterval);
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, []);

  // Improved effect to handle tracking visibility changes
  useEffect(() => {
    if (isTrackingVisible) {
      // Rebuild all markers when tracking is turned on
      refreshMap();
    } else {
      // Clear all markers when tracking is disabled
      Object.values(userMarkerRefs.current).forEach(marker => {
        if (marker && mapRef.current) {
          mapRef.current.removeLayer(marker);
        }
      });
      // Reset the markers object
      userMarkerRefs.current = {};
    }
  }, [isTrackingVisible]);

  // Add CSS for marker animation
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

  // Improved toggleTrackingVisibility to properly handle marker cleanup
  const toggleTrackingVisibility = () => {
    const newVisibilityState = !isTrackingVisible;
    setIsTrackingVisible(newVisibilityState);
    localStorage.setItem("isTrackingVisible", newVisibilityState);

    if (!newVisibilityState) {
      // Clean up all markers when disabling tracking
      Object.values(userMarkerRefs.current).forEach(marker => {
        if (mapRef.current && marker) {
          mapRef.current.removeLayer(marker);
        }
      });
      userMarkerRefs.current = {};
    } else {
      // Refresh all markers when enabling tracking
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
      
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, []);

  // Improved effect to persist markers
  useEffect(() => {
    if (isTrackingVisible && mapRef.current) {
      refreshMap();
    }
  }, [isTrackingVisible, tanodLocations]);

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
      switch (data.assistanceStatus) {
        case 'Rejected':
          return 'rgba(239, 68, 68, 0.5)'; // red
        case 'Processing':
          return 'rgba(59, 130, 246, 0.5)'; // blue
        case 'Deployed':
          return 'rgba(99, 102, 241, 0.5)'; // indigo
        case 'Completed':
          return 'rgba(34, 197, 94, 0.5)'; // green
        case 'Pending':
          return data.type === 'Emergency' ? 'rgba(255, 0, 0, 0.5)' : 'rgba(234, 179, 8, 0.5)';
        default:
          return data.type === 'Emergency' ? 'rgba(255, 0, 0, 0.5)' : 'rgba(0, 0, 255, 0.5)';
      }
    };

    const getMarkerIcon = (status) => {
      switch (data.assistanceStatus) {
        case 'Rejected':
          return '<i class="fas fa-times-circle"></i>';
        case 'Processing':
          return '<i class="fas fa-sync fa-spin"></i>';
        case 'Deployed':
          return '<i class="fas fa-truck"></i>';
        case 'Completed':
          return '<i class="fas fa-check-circle"></i>';
        case 'Pending':
          return data.type === 'Emergency' ? 
            '<i class="fas fa-exclamation-triangle"></i>' : 
            '<i class="fas fa-clock"></i>';
        default:
          return data.type === 'Emergency' ? 
            '<i class="fas fa-exclamation-triangle"></i>' : 
            '<i class="fas fa-info-circle"></i>';
      }
    };

    return L.marker([lat, lng], {
      icon: L.divIcon({
        className: 'custom-icon',
        html: `
          <div style="position: relative; width: 36px; height: 36px;">
            <div style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; 
                 border-radius: 50%; background-color: ${getMarkerColor(data.status)}; 
                 animation: ${data.status !== 'Completed' ? 'pulse 1.5s infinite' : 'none'};"></div>
            <div style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; 
                 display: flex; align-items: center; justify-content: center; font-size: 20px; color: white;">
              ${getMarkerIcon(data.status)}
            </div>
          </div>`,
        iconSize: [36, 36],
        iconAnchor: [18, 18]
      })
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

  useEffect(() => {
    const socketUrl = process.env.NODE_ENV === 'production' 
      ? 'https://barangaypatrol.lgu1.com'
      : 'http://localhost:5000';

    const token = localStorage.getItem('token');

    socketRef.current = io(socketUrl, {
      auth: { token },
      withCredentials: true,
      transports: ['websocket']
    });

    socketRef.current.on('connect', () => {
      socketRef.current.emit('joinTrackingRoom');
      socketRef.current.emit('joinScheduleRoom');
    });

    // Handle location updates
    socketRef.current.on('locationUpdate', handleLocationUpdate);

    // Handle incident updates
    socketRef.current.on('incidentUpdate', ({ type, incident }) => {
      setIncidentReports(prev => {
        if (type === 'insert') {
          return [...prev, incident];
        }
        return prev.map(inc => inc._id === incident._id ? incident : inc);
      });
    });

    // Handle schedule updates
    socketRef.current.on('scheduleUpdate', ({ type, schedule }) => {
      if (type === 'update' || type === 'insert') {
        fetchLocations();
      }
    });

    return () => {
      if (socketRef.current) {
        socketRef.current.emit('leaveTrackingRoom');
        socketRef.current.emit('leaveScheduleRoom');
        socketRef.current.disconnect();
      }
    };
  }, []);

  // Improved handleLocationUpdate function to properly handle marker updates
  const handleLocationUpdate = async (data) => {
    try {
      // Check if current user is admin - don't track their location
      const currentUserId = localStorage.getItem('userId');
      if (data.userId?._id === currentUserId) {
        return; // Skip updating location for admin user
      }

      const userId = typeof data.userId === 'object' ? data.userId._id : data.userId;

      // Check if this is a newer update than what we already have
      if (lastLocationUpdate[userId] && lastLocationUpdate[userId] > data.lastUpdate) {
        return; // Skip older updates
      }

      // Update the last location timestamp for this user
      setLastLocationUpdate(prev => ({
        ...prev,
        [userId]: data.lastUpdate || Date.now()
      }));

      // Update the locations state
      setTanodLocations(prev => {
        // Filter out the old location for this user
        const others = prev.filter(loc => {
          const locUserId = typeof loc.userId === 'object' ? loc.userId._id : loc.userId;
          return locUserId !== userId;
        });
        
        // Add the new location data
        return [...others, {
          ...data,
          lastUpdate: data.lastUpdate || Date.now()
        }];
      });

      // Only update the marker if tracking is enabled
      if (isTrackingVisible && mapRef.current) {
        updateMarker(data);
      }
    } catch (error) {
      console.error('Error updating location:', error);
    }
  };

  const handleActivateCctvReview = (isActive) => {
    setIsCctvReviewActive(isActive);
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
        limit={3} 
        style={{ zIndex: 9999 }} // Add high z-index to ensure it's above all other elements
        enableMultiContainer={false} // Ensure we don't have multiple containers
      />
      <div className="flex w-full h-full">
        <div className="relative w-3/5 h-full mr-6" style={{ zIndex: 1 }}>
          <MapContainer center={[14.7356, 121.0498]} zoom={13} style={{ height: '100%', width: '100%' }} ref={mapRef}>
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
            <MapEvents />
            {Object.keys(incidentLocations).map((key) => {
              const incident = incidentReports.find(report => report._id === key);
              return (
                <ViewLocation
                  key={key}
                  location={incidentLocations[key].location}
                  incidentType={incidentLocations[key].type} 
                  markerId={key}
                  isVisible={!!incidentLocations[key] && !isCctvReviewActive}
                  incident={incident}
                  onMarkerClick={() => {
                    setSelectedReport(incident);
                    setActivePanel('details'); // Add this line to show details panel
                  }}
                />
              );
            })}
          </MapContainer>
        </div>
        <div className="w-2/5 h-full flex flex-col items-center bg-gray-100 p-4 space-y-4 rounded-lg TopNav">
          <div className="w-full flex justify-between gap-2">
            <button 
              onClick={toggleTrackingVisibility} 
              className={`flex-1 py-3 text-white text-lg rounded-lg shadow transition ${isTrackingVisible ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'}`}
            >
              {isTrackingVisible ? 'Stop Tracking' : 'Track Tanods'}
            </button>
            <button 
              onClick={toggleCctvVisibility} 
              className={`flex-1 py-3 text-white text-lg rounded-lg shadow transition ${isCctvVisible ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'}`}
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
              activePanel={activePanel}
              setActivePanel={(panel) => {
                setActivePanel(panel);
                // When setting CCTV panel, track it
                if (panel === 'cctv') {
                  handleActivateCctvReview(true);
                } else if (panel === null) {
                  handleActivateCctvReview(false);
                }
              }}
              incidentLocations={incidentLocations}
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

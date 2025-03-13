import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import axios from 'axios';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Incidents from './Incidents';
import ViewReportedIncidents from './incidentComponents/ViewReportedIncidents'; // Import ViewReportedIncidents
import { FaExclamationTriangle, FaInfoCircle } from 'react-icons/fa'; // Import icons

const TanodMap = () => {
  const [patrolAreas, setPatrolAreas] = useState([]);
  const [currentPatrolArea, setCurrentPatrolArea] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [userLocation, setUserLocation] = useState(null); // Add state to store user location
  const [incidentLocations, setIncidentLocations] = useState({});
  const [selectedIncident, setSelectedIncident] = useState(null); // Add state for selected incident
  const [incidentReports, setIncidentReports] = useState([]); // Add this state
  const [isTrackingVisible, setIsTrackingVisible] = useState(
    JSON.parse(localStorage.getItem("isTrackingVisible")) || false
  );
  const [showReportIncident, setShowReportIncident] = useState(false);
  const [selectedIncidentForResponse, setSelectedIncidentForResponse] = useState(null);
  const [activeIncidents, setActiveIncidents] = useState([]);
  const mapRef = useRef(null);
  const userMarkerRef = useRef(null);
  const start = [14.72661640119096, 121.03715880494757];

  // Add new refs for different layer types
  const patrolLayersRef = useRef({});
  const incidentLayersRef = useRef({});
  const socketRef = useRef(null); // Add socketRef
  const [prevUserLocation, setPrevUserLocation] = useState(null); // Add prevUserLocation state

  const fetchUserProfile = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      toast.error('Please log in.');
      return null;
    }

    try {
      const response = await axios.get(`${process.env.REACT_APP_API_URL}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const profile = response.data;
      setUserProfile(profile);
      localStorage.setItem('userId', profile._id);
      return profile;
    } catch (error) {
      toast.error('Failed to load user profile.');
      return null;
    }
  };

  const fetchPatrolAreas = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      toast.error('Please log in.');
      return;
    }

    try {
      const response = await axios.get(`${process.env.REACT_APP_API_URL}/auth/schedules`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const upcomingPatrolAreas = response.data.filter(schedule => {
        const now = new Date();
        const startTime = new Date(schedule.startTime);
        const diff = (startTime - now) / (1000 * 60); // Difference in minutes
        return diff <= 30 && schedule.patrolArea;
      }).map(schedule => schedule.patrolArea);

      setPatrolAreas(upcomingPatrolAreas);
    } catch (error) {
      console.error('Error fetching patrol areas:', error);
      toast.error('Failed to load patrol areas.');
    }
  };

  const fetchCurrentPatrolArea = async () => {
    const token = localStorage.getItem('token');
    const userId = localStorage.getItem('userId');
    if (!token || !userId) return;

    try {
      const response = await axios.get(`${process.env.REACT_APP_API_URL}/auth/tanod-schedules/${userId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const currentPatrol = response.data.find(schedule => {
        const patrolStatus = schedule.patrolStatus.find(status => status.tanodId === userId);
        const now = new Date();
        const endTime = new Date(schedule.endTime);
        
        // Check if patrol is active (started and not yet ended)
        return patrolStatus && 
               patrolStatus.status === 'Started' && 
               now <= endTime;
      });

      if (currentPatrol && currentPatrol.patrolArea) {
        const patrolAreaResponse = await axios.get(
          `${process.env.REACT_APP_API_URL}/polygons/${currentPatrol.patrolArea._id}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setCurrentPatrolArea(patrolAreaResponse.data);
        if (mapRef.current) {
          const bounds = L.latLngBounds(patrolAreaResponse.data.coordinates.map(({ lat, lng }) => [lat, lng]));
          mapRef.current.fitBounds(bounds);
        }
      } else {
        setCurrentPatrolArea(null);
      }
    } catch (error) {
      console.error('Error fetching current patrol area:', error);
      toast.error('Failed to load current patrol area.');
    }
  };

  // Add this function to fetch incident reports
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

  useEffect(() => {
    fetchUserProfile();
    fetchPatrolAreas();
    fetchCurrentPatrolArea();
    fetchIncidentReports(); // Add this call
  }, []);

  useEffect(() => {
    const loadStoredData = async () => {
      if (localStorage.getItem("isTracking") === "true") {
        const storedProfile = await fetchUserProfile();
        if (storedProfile) {
          setUserProfile(storedProfile);
          // Re-enable tracking if it was active
          setIsTrackingVisible(true);
        }
      }
    };
    loadStoredData();
  }, []);

  // Simplified marker creation function that matches PatrolTracking.jsx style
  const createUserMarker = (latitude, longitude, profileUrl, areaColor) => {
    return L.marker([latitude, longitude], {
      icon: L.divIcon({
        className: 'custom-icon',
        html: `
          <div style="position: relative; width: 50px; height: 50px;">
            <div style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; 
                 border-radius: 50%; background-color: ${areaColor || 'red'}; 
                 opacity: 0.5; animation: pulse 1.5s ease-in-out infinite;"></div>
            <div style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; 
                 display: flex; align-items: center; justify-content: center;
                 background-image: url('${profileUrl}'); background-size: cover; 
                 border-radius: 50%; border: 2px solid ${areaColor || 'red'};"></div>
          </div>
        `,
        iconSize: [50, 50],
        iconAnchor: [25, 25]
      }),
      zIndexOffset: 1000
    });
  };

  const clearMapLayers = (map, layerType = 'all') => {
    if (!map) return;
    
    map.eachLayer((layer) => {
      if (layerType === 'all') {
        if (layer instanceof L.Marker || layer instanceof L.Polygon) {
          map.removeLayer(layer);
        }
      } else if (layerType === 'markers' && layer instanceof L.Marker) {
        map.removeLayer(layer);
      } else if (layerType === 'polygons' && layer instanceof L.Polygon) {
        map.removeLayer(layer);
      }
    });
  };

  // Separate user marker effect
  useEffect(() => {
    if (!mapRef.current || !userLocation || !isTrackingVisible || !userProfile) {
      if (userMarkerRef.current && mapRef.current) {
        mapRef.current.removeLayer(userMarkerRef.current);
        userMarkerRef.current = null;
      }
      return;
    }

    try {
      const { latitude, longitude } = userLocation;

      // Create user marker
      const userMarker = L.marker([latitude, longitude], {
        icon: L.divIcon({
          className: 'custom-icon',
          html: `
            <div style="position: relative; width: 50px; height: 50px; z-index: 1000;">
              <div style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; 
                   border-radius: 50%; background-color: ${currentPatrolArea?.color || 'red'}; 
                   opacity: 0.5; animation: pulse 1.5s infinite; z-index: 998;"></div>
              <div style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; 
                   background-image: url('${userProfile.profilePicture}'); 
                   background-size: cover; border-radius: 50%; 
                   border: 2px solid ${currentPatrolArea?.color || 'red'}; z-index: 999;"></div>
            </div>
          `,
          iconSize: [50, 50],
          iconAnchor: [25, 25]
        }),
        zIndexOffset: 1000
      });

      if (userMarkerRef.current) {
        mapRef.current.removeLayer(userMarkerRef.current);
      }

      userMarker.addTo(mapRef.current);
      userMarkerRef.current = userMarker;
      mapRef.current.setView([latitude, longitude], mapRef.current.getZoom());

    } catch (error) {
      toast.error('Error updating location marker');
    }
  }, [userLocation, userProfile, currentPatrolArea, isTrackingVisible]);

  // Add useEffect to handle tracking visibility changes
  useEffect(() => {
    if (!isTrackingVisible && userMarkerRef.current && mapRef.current) {
      // Remove marker when tracking is stopped
      mapRef.current.removeLayer(userMarkerRef.current);
      userMarkerRef.current = null;
      setUserLocation(null); // Clear user location when tracking stops
    }
  }, [isTrackingVisible]);

  const MapEvents = () => {
    const map = useMap();

    useEffect(() => {
      if (!map) return;
      mapRef.current = map;
      clearMapLayers(map, 'polygons');
      
      // Add patrol areas
      patrolAreas.forEach(area => {
        if (area?.coordinates) {
          const layer = L.polygon(
            area.coordinates.map(({ lat, lng }) => [lat, lng]),
            { color: area.color, fillOpacity: 0.2, weight: 2 }
          );
          layer.bindTooltip(area.legend, { permanent: true, direction: 'center' });
          layer.addTo(map);
          patrolLayersRef.current[area._id] = layer;
        }
      });

      // Add current patrol area
      if (currentPatrolArea?.coordinates) {
        const layer = L.polygon(
          currentPatrolArea.coordinates.map(({ lat, lng }) => [lat, lng]),
          { color: currentPatrolArea.color, fillOpacity: 0.2, weight: 2 }
        );
        layer.bindTooltip(currentPatrolArea.legend, { permanent: true, direction: 'center' });
        layer.addTo(map);
      }
    }, [patrolAreas, currentPatrolArea]);

    // Handle incident markers
    useEffect(() => {
      if (!map) return;

      Object.values(incidentLayersRef.current).forEach(marker => {
        map.removeLayer(marker);
      });
      incidentLayersRef.current = {};

      Object.entries(incidentLocations).forEach(([id, data]) => {
        const latLngMatch = data.location.match(/Lat:\s*([0-9.-]+),\s*Lon:\s*([0-9.-]+)/);
        if (latLngMatch) {
          const [_, lat, lng] = latLngMatch.map(Number);
          if (!isNaN(lat) && !isNaN(lng)) {
            const marker = createIncidentMarker(lat, lng, data.type, id);
            marker.addTo(map);
            incidentLayersRef.current[id] = marker;
            map.setView([lat, lng], 16);
          }
        }
      });
    }, [incidentLocations]);

    return null;
  };

  const createIncidentMarker = (lat, lng, type, id) => {
    return L.marker([lat, lng], {
      icon: L.divIcon({
        className: 'custom-icon',
        html: `
          <div style="position: relative; width: 36px; height: 36px;">
            <div style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; 
                 border-radius: 50%; background-color: ${type === 'Emergency' ? 'rgba(255, 0, 0, 0.5)' : 'rgba(0, 0, 255, 0.5)'}; 
                 animation: markerPulse 1.5s ease-in-out infinite;"></div>
            <div style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; 
                 display: flex; align-items: center; justify-center; font-size: 36px; 
                 color: ${type === 'Emergency' ? 'red' : 'blue'};">
              <i class="fa ${type === 'Emergency' ? 'fa-exclamation-triangle' : 'fa-info-circle'}"></i>
            </div>
          </div>`,
        iconSize: [36, 36],
        iconAnchor: [18, 18]
      }),
      zIndexOffset: 1000
    }).on('click', () => {
      const incident = incidentReports.find(report => report._id === id);
      if (incident) setSelectedIncident(incident);
    });
  };

  // Update toggle tracking function
  const toggleTracking = () => {
    const newTrackingState = !isTrackingVisible;
    setIsTrackingVisible(newTrackingState);
    localStorage.setItem("isTrackingVisible", JSON.stringify(newTrackingState));
    
    if (!newTrackingState) {
      // Cleanup when stopping tracking
      if (userMarkerRef.current && mapRef.current) {
        mapRef.current.removeLayer(userMarkerRef.current);
        userMarkerRef.current = null;
        setUserLocation(null);
      }
    } else {
      // Re-initialize when starting tracking
      fetchUserProfile().then(profile => {
        if (profile) {
          setUserProfile(profile);
        }
      });
    }
  };

  // Update effect to handle tracking visibility changes
  useEffect(() => {
    if (!isTrackingVisible) {
      // Additional cleanup in effect
      if (userMarkerRef.current && mapRef.current) {
        mapRef.current.removeLayer(userMarkerRef.current);
        userMarkerRef.current = null;
        setUserLocation(null);
      }
    }
  }, [isTrackingVisible]);

  // Add new useEffect to fetch active incidents
  useEffect(() => {
    const fetchActiveIncidents = async () => {
      const token = localStorage.getItem('token');
      if (!token) return;

      try {
        const response = await axios.get(
          `${process.env.REACT_APP_API_URL}/incident-reports`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        const inProgressIncidents = response.data.filter(incident => incident.status === 'In Progress');
        setActiveIncidents(inProgressIncidents);
        
        // Set the selected incident if there's an active one
        const activeIncident = inProgressIncidents.find(incident => incident.status === 'In Progress');
        if (activeIncident) {
          setSelectedIncidentForResponse(activeIncident);
        }
      } catch (error) {
        console.error('Error fetching active incidents:', error);
      }
    };

    fetchActiveIncidents();
  }, []);

  useEffect(() => {
    // Add global animation styles
    const style = document.createElement('style');
    style.textContent = `
      @keyframes pulse {
        0% { transform: scale(.5); opacity: 1; }
        50% { transform: scale(1); opacity: 1; }
        100% { transform: scale(2); opacity: 0; }
      }
      
      @keyframes markerPulse {
        0% { transform: scale(.5); opacity: 1; }
        50% { transform: scale(1); opacity: 1; }
        100% { transform: scale(2); opacity: 0; }
      }
      .pulse-animation {
      animation: pulse 3s ease-out infinite;
      }
    `;
    document.head.appendChild(style);
    return () => document.head.removeChild(style);
  }, []);

  // Update user marker effect with debouncing
  useEffect(() => {
    if (!mapRef.current || !userLocation || !isTrackingVisible) {
      if (userMarkerRef.current && mapRef.current) {
        mapRef.current.removeLayer(userMarkerRef.current);
        userMarkerRef.current = null;
      }
      return;
    }
  
    try {
      // Add debounce check
      if (userLocation.lastUpdate && 
          Date.now() - userLocation.lastUpdate < 1000) {
        return;
      }
  
      const { latitude, longitude, profilePicture } = userLocation;
  
      if (userMarkerRef.current) {
        const currentPos = userMarkerRef.current.getLatLng();
        if (currentPos.lat === latitude && currentPos.lng === longitude) {
          return; // Skip update if position hasn't changed
        }
        mapRef.current.removeLayer(userMarkerRef.current);
      }
  
      const userMarker = createUserMarker(
        latitude, 
        longitude, 
        profilePicture || userProfile?.profilePicture,
        userLocation.markerColor
      );
  
      userMarker.addTo(mapRef.current);
      userMarkerRef.current = userMarker;
      
      // Only update view if position has changed significantly
      const currentCenter = mapRef.current.getCenter();
      const distance = mapRef.current.distance([latitude, longitude], [currentCenter.lat, currentCenter.lng]);
      if (distance > 50) { // Only pan if moved more than 50 meters
        mapRef.current.setView([latitude, longitude], mapRef.current.getZoom() || 16);
      }
  
    } catch (error) {
      console.error('Error updating marker:', error);
    }
  }, [userLocation, isTrackingVisible, userProfile]);

  // Update startTracking function
  const startTracking = async () => {
    const profile = await fetchUserProfile(); // Get profile first
    if (!profile) {
      toast.error("Failed to fetch user profile");
      return;
    }

    // ...rest of startTracking implementation...

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
        
        // Only update location if marker is meant to be shown
        if (isTrackingVisible) {
          setUserLocation(locationData);
          
          // Update marker immediately if it exists
          if (userMarkerRef.current && mapRef.current) {
            const newLatLng = [locationData.latitude, locationData.longitude];
            userMarkerRef.current.setLatLng(newLatLng);
          }
        }
        // Always update prevUserLocation
        setPrevUserLocation(locationData);
      }
    });
  };

  // Update effect to handle tracking visibility
  useEffect(() => {
    if (!isTrackingVisible) {
      // Remove marker when tracking is hidden
      if (userMarkerRef.current && mapRef.current) {
        mapRef.current.removeLayer(userMarkerRef.current);
        userMarkerRef.current = null;
      }
      setUserLocation(null);
    } else if (prevUserLocation) {
      // Restore marker with previous location when showing
      setUserLocation(prevUserLocation);
    }

    // Cleanup function
    return () => {
      if (userMarkerRef.current && mapRef.current) {
        mapRef.current.removeLayer(userMarkerRef.current);
        userMarkerRef.current = null;
      }
    };
  }, [isTrackingVisible]);

  // Add cleanup for socket events
  useEffect(() => {
    return () => {
      if (socketRef.current) {
        socketRef.current.off('locationUpdate');
        socketRef.current.disconnect();
      }
    };
  }, []);

  return (
    <div style={{ position: 'relative', height: '100%' }}>
      <ToastContainer position="top-right" autoClose={3000} hideProgressBar newestOnTop closeOnClick rtl={false} pauseOnFocusLoss draggable pauseOnHover />
      <MapContainer center={start} zoom={16} style={{ width: '100%', height: '100%' }}>
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        <MapEvents />
        <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', zIndex: 1000 }}>
          <Incidents 
            fetchCurrentPatrolArea={fetchCurrentPatrolArea} 
            setUserLocation={setUserLocation}
            setIncidentLocations={setIncidentLocations}
            incidentReports={incidentReports} // Pass incidentReports down
            setIncidentReports={setIncidentReports} // Add this prop
            isTrackingVisible={isTrackingVisible}
            toggleTracking={toggleTracking}
            showReportIncident={showReportIncident}
            setShowReportIncident={setShowReportIncident}
            selectedIncidentForResponse={selectedIncidentForResponse}
            setSelectedIncidentForResponse={setSelectedIncidentForResponse}
          />
        </div>
      </MapContainer>
      {selectedIncident && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center" style={{ zIndex: 2001 }}>
          <div className="bg-blue-50 p-6 rounded-lg w-11/12 max-w-lg relative">
            <button 
              onClick={() => setSelectedIncident(null)} 
              className="absolute top-2 right-2 px-2 py-1 bg-red-500 text-white rounded-lg"
            >
              X
            </button>
            <h4 className="text-lg font-semibold text-blue-700">Incident Report Details</h4>
            <div className="mt-2 text-gray-700 space-y-2">
              <p><strong>Incident:</strong> {selectedIncident.type}</p>
              <p>
                <strong>Incident Type:</strong> 
                <span className={selectedIncident.incidentClassification === 'Emergency Incident' ? 'ml-1 text-red-500 font-bold animate-pulse' : 'ml-1 font-bold'}>
                  {selectedIncident.incidentClassification || 'N/A'}
                </span>
              </p>
              <p><strong>Date:</strong> {new Date(selectedIncident.date).toLocaleDateString()}</p>
              <p><strong>Time:</strong> {selectedIncident.time || 'N/A'}</p>
              <p><strong>Location:</strong> {selectedIncident.location || 'N/A'}</p>
              <p><strong>Location Note:</strong> {selectedIncident.locationNote || 'N/A'}</p>
              <p><strong>Description:</strong> {selectedIncident.description || 'N/A'}</p>
              <p><strong>Full Name:</strong> {selectedIncident.fullName || 'Anonymous'}</p>
              <p><strong>Contact Number:</strong> {selectedIncident.contactNumber || 'Anonymous'}</p>
              <p><strong>Status:</strong> {selectedIncident.status || 'Pending'}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TanodMap;
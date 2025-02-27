import React, { useEffect, useRef, useState } from 'react';
import { MapContainer, TileLayer, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import axios from 'axios';
import { toast } from 'react-toastify';
import io from 'socket.io-client'; // Import socket.io-client
import L from 'leaflet';
import { FaUserCircle } from 'react-icons/fa';

const PatrolTracking = () => {
  const mapRef = useRef(null);
  const [tanodLocations, setTanodLocations] = useState([]);
  const [patrolAreas, setPatrolAreas] = useState([]);
  const [isTrackingVisible, setIsTrackingVisible] = useState(JSON.parse(localStorage.getItem("isTrackingVisible")) || false); // Persist visibility state
  const socketRef = useRef(null); // Add socketRef
  const userMarkerRefs = useRef({}); // Add userMarkerRefs to store markers

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

    // Clear existing layers to prevent duplication
    if (mapRef.current) {
      mapRef.current.eachLayer((layer) => {
        if (layer instanceof L.Polygon) {
          mapRef.current.removeLayer(layer);
        }
      });
    }
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
            html: `<div style="background-image: url(${profilePicture || ''}); background-size: cover; border-radius: 50%; width: 50px; height: 50px; border: 2px solid ${patrolArea?.color || 'blue'};"></div>`,
          }),
        });

        if (isTrackingVisible) {
          userMarker.addTo(mapRef.current);
        }
        userMarkerRefs.current[userId] = userMarker;
      });
    }
  };

  useEffect(() => {
    fetchPatrolAreas();
    initializeWebSocket(); // Always initialize WebSocket
    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, []);

  useEffect(() => {
    refreshMap();
  }, [tanodLocations, isTrackingVisible]);

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
    <div style={{ height: '100%', width: '100%' }}>
      <MapContainer center={[14.7356, 121.0498]} zoom={13} style={{ height: '100%', width: '100%' }} ref={mapRef}>
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        <MapEvents />
        <div style={{ position: 'absolute', top: 10, right: 10, zIndex: 1000 }}>
          <button onClick={toggleTrackingVisibility} className={`text-white px-4 py-2 rounded-lg shadow transition ${isTrackingVisible ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'}`}>
            {isTrackingVisible ? 'Hide Tracking' : 'Show Tracking'}
          </button>
        </div>
      </MapContainer>
    </div>
  );
};

export default PatrolTracking;

import React, { useEffect, useRef, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polygon, Tooltip, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import axios from 'axios';
import { toast } from 'react-toastify';
import io from 'socket.io-client'; // Import socket.io-client
import L from 'leaflet';

const PatrolTracking = () => {
  const mapRef = useRef(null);
  const [tanodLocations, setTanodLocations] = useState([]);
  const [patrolAreas, setPatrolAreas] = useState([]);
  const [isTracking, setIsTracking] = useState(JSON.parse(localStorage.getItem("isTrackingAdmin")) || false); // Persist tracking state
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

  const startTracking = () => {
    setIsTracking(true);
    localStorage.setItem("isTrackingAdmin", true); // Persist tracking state
    const socketUrl = process.env.NODE_ENV === 'production' 
      ? 'https://barangaypatrol.lgu1.com'  // Production WebSocket URL
      : 'http://localhost:5000';           // Development WebSocket URL
    socketRef.current = io(socketUrl, { withCredentials: true }); // Connect to the correct namespace

    socketRef.current.on('connect', () => {
      console.log('Connected to WebSocket');
    });

    socketRef.current.on('disconnect', () => {
      console.log('Disconnected from WebSocket');
    });

    socketRef.current.on('connect_error', (error) => {
      console.error('WebSocket connection error:', error);
    });

    socketRef.current.on('locationUpdate', (data) => {
      console.log('Received location update:', data); // Log the received location update
      const { userId, latitude, longitude, profilePicture, patrolArea } = data;
      setTanodLocations((prevLocations) => {
        const existingLocation = prevLocations.find(location => location.userId === userId);
        if (existingLocation) {
          return prevLocations.map(location =>
            location.userId === userId ? { ...location, latitude, longitude, profilePicture, patrolArea } : location
          );
        } else {
          return [...prevLocations, { userId, latitude, longitude, profilePicture, patrolArea }];
        }
      });
    });
  };

  const stopTracking = () => {
    setIsTracking(false);
    localStorage.setItem("isTrackingAdmin", false); // Persist tracking state
    setTanodLocations([]); // Clear tanod locations
    if (socketRef.current) {
      socketRef.current.disconnect();
    }
  };

  useEffect(() => {
    fetchPatrolAreas();
    if (isTracking) {
      startTracking(); // Start tracking if the state is persisted as true
    }
    return () => {
      stopTracking(); // Ensure tracking is stopped when component unmounts
    };
  }, []);

  useEffect(() => {
    if (mapRef.current) {
      tanodLocations.forEach(({ userId, latitude, longitude, profilePicture, patrolArea }) => {
        const userMarker = L.marker([latitude, longitude], {
          icon: L.divIcon({
            className: 'custom-icon',
            html: `<div style="background-image: url(${profilePicture || ''}); background-size: cover; border-radius: 50%; width: 40px; height: 40px; border: 2px solid ${patrolArea?.color || 'blue'};"></div>`,
          }),
        });

        if (userMarkerRefs.current[userId]) {
          mapRef.current.removeLayer(userMarkerRefs.current[userId]);
        }

        userMarker.addTo(mapRef.current);
        userMarkerRefs.current[userId] = userMarker;
      });
    }
  }, [tanodLocations]);

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
        {tanodLocations.map((tanod) => (
          <Marker key={tanod.userId} position={[tanod.latitude, tanod.longitude]}>
            <Popup>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <div
                  style={{
                    backgroundImage: `url(${tanod.profilePicture || ''})`,
                    backgroundSize: 'cover',
                    border: `2px solid ${tanod.patrolArea?.color || 'blue'}`,
                    borderRadius: '50%',
                    width: '50px',
                    height: '50px',
                    boxShadow: '0 0 10px rgba(0, 0, 0, 0.5)',
                    marginRight: '10px',
                  }}
                ></div>
                <div>
                  <strong>{tanod.name || 'Unknown Tanod'}</strong>
                  <p>{tanod.patrolArea?.legend || 'No patrol area assigned'}</p>
                </div>
              </div>
            </Popup>
          </Marker>
        ))}
        <div style={{ position: 'absolute', top: 10, right: 10, zIndex: 1000 }}>
          {isTracking ? (
            <button onClick={stopTracking} className="bg-red-600 text-white px-4 py-2 rounded-lg shadow hover:bg-red-700 transition">
              Stop Tracking
            </button>
          ) : (
            <button onClick={startTracking} className="bg-green-600 text-white px-4 py-2 rounded-lg shadow hover:bg-green-700 transition">
              Start Tracking
            </button>
          )}
        </div>
      </MapContainer>
    </div>
  );
};

export default PatrolTracking;

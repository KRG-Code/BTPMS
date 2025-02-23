import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import axios from 'axios';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Incidents from './Incidents';

const TanodMap = () => {
  const [patrolAreas, setPatrolAreas] = useState([]);
  const [currentPatrolArea, setCurrentPatrolArea] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [userLocation, setUserLocation] = useState(null); // Add state to store user location
  const mapRef = useRef(null);
  const userMarkerRef = useRef(null);
  const start = [14.72661640119096, 121.03715880494757];

  const fetchUserProfile = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      toast.error('Please log in.');
      return;
    }

    try {
      const response = await axios.get(`${process.env.REACT_APP_API_URL}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUserProfile(response.data);
      localStorage.setItem('userId', response.data._id); // Store userId in localStorage
    } catch (error) {
      console.error('Error fetching user profile:', error);
      toast.error('Failed to load user profile.');
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
        return patrolStatus && patrolStatus.status === 'Started';
      });

      if (currentPatrol && currentPatrol.patrolArea) {
        console.log('Current Patrol Area ID:', currentPatrol.patrolArea._id); // Debugging information
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

  useEffect(() => {
    fetchUserProfile();
    fetchPatrolAreas();
    fetchCurrentPatrolArea();
  }, []);

  useEffect(() => {
    if (userLocation && mapRef.current) {
      const { latitude, longitude } = userLocation;
      const userMarker = L.marker([latitude, longitude], {
        icon: L.divIcon({
          className: 'custom-icon',
          html: `<div style="background-image: url(${userProfile?.profilePicture || ''}); background-size: cover; border-radius: 50%; width: 40px; height: 40px; border: 2px solid ${currentPatrolArea?.color || 'red'};"></div>`,
        }),
      });

      if (userMarkerRef.current) {
        mapRef.current.removeLayer(userMarkerRef.current);
      }

      userMarker.addTo(mapRef.current);
      userMarkerRef.current = userMarker;
      mapRef.current.setView([latitude, longitude], mapRef.current.getZoom()); // Update map view to the new location
    } else if (!userLocation && userMarkerRef.current) {
      mapRef.current.removeLayer(userMarkerRef.current);
      userMarkerRef.current = null;
    }
  }, [userLocation, userProfile, currentPatrolArea]);

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

        if (currentPatrolArea && currentPatrolArea.coordinates) {
          const layer = L.polygon(
            currentPatrolArea.coordinates.map(({ lat, lng }) => [lat, lng]),
            { color: currentPatrolArea.color, fillOpacity: 0.2, weight: 2 }
          );
          layer.bindTooltip(currentPatrolArea.legend, { permanent: true, direction: 'center' });
          layer.addTo(map);
        }
      }
    }, [patrolAreas, currentPatrolArea]);

    return null;
  };

  return (
    <div style={{ position: 'relative', height: '100%' }}>
      <ToastContainer position="top-right" autoClose={3000} hideProgressBar newestOnTop closeOnClick rtl={false} pauseOnFocusLoss draggable pauseOnHover />
      <MapContainer center={start} zoom={16} style={{ width: '100%', height: '100%' }}>
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        <MapEvents />
      </MapContainer>
      <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', zIndex: 1000 }}>
        <Incidents fetchCurrentPatrolArea={fetchCurrentPatrolArea} setUserLocation={setUserLocation} />
      </div>
    </div>
  );
};

export default TanodMap;
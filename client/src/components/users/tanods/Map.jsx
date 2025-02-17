import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Polygon, useMap } from 'react-leaflet';
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
  const [patrolLogs, setPatrolLogs] = useState([]);
  const mapRef = useRef(null);
  const userMarkerRef = useRef(null);
  const start = [14.72661640119096, 121.03715880494757]; // Start point

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

  const savePatrolLogs = async () => {
    const token = localStorage.getItem('token');
    const scheduleId = currentPatrolArea._id; // Assuming currentPatrolArea has the schedule ID
    if (!token || !scheduleId) return;

    try {
      await axios.post(`${process.env.REACT_APP_API_URL}/schedule/save-patrol-logs`, {
        scheduleId,
        logs: patrolLogs,
      }, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setPatrolLogs([]); // Clear the logs after saving
      toast.success('Patrol logs saved successfully');
    } catch (error) {
      console.error('Error saving patrol logs:', error);
      toast.error('Failed to save patrol logs');
    }
  };

  useEffect(() => {
    fetchUserProfile();
    fetchPatrolAreas();
    fetchCurrentPatrolArea();
  }, []);

  useEffect(() => {
    // Save patrol logs when the component unmounts or patrol area changes
    return () => {
      if (patrolLogs.length > 0) {
        savePatrolLogs();
      }
    };
  }, [currentPatrolArea]);

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

        const updateUserLocation = (position) => {
          const { latitude, longitude } = position.coords;
          // Clear existing user marker
          if (userMarkerRef.current) {
            map.removeLayer(userMarkerRef.current);
          }
          // Add a marker for the user's current location
          if (userProfile && userProfile.profilePicture) {
            const icon = L.divIcon({
              html: `<div style="background-image: url(${userProfile.profilePicture}); background-size: cover; border: 2px solid white; border-radius: 50%; width: 50px; height: 50px; box-shadow: 0 0 10px rgba(0, 0, 0, 0.5);"></div>`,
              className: 'custom-marker'
            });
            userMarkerRef.current = L.marker([latitude, longitude], { icon }).addTo(map)
              .openPopup();
          }
          map.setView([latitude, longitude], 13);
        };

        if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(updateUserLocation);
          const watchId = navigator.geolocation.watchPosition(updateUserLocation, (error) => {
            console.error("Error getting user's location:", error);
          });

          return () => {
            navigator.geolocation.clearWatch(watchId);
          };
        }
      }
    }, [map, patrolAreas, currentPatrolArea, userProfile]);

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
        <Incidents fetchCurrentPatrolArea={fetchCurrentPatrolArea} />
      </div>
    </div>
  );
};

export default TanodMap;

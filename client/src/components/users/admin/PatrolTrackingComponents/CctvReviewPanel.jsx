import React, { useEffect, useState } from 'react';
import axios from 'axios';
import L from 'leaflet';

const CctvReviewPanel = ({ incident, onClose, mapRef }) => {
  const [nearestCctv, setNearestCctv] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [friendlyLocation, setFriendlyLocation] = useState('');

  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // Earth's radius in kilometers
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distance = R * c;
    return distance * 1000; // Convert to meters
  };

  const findNearestCctv = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${process.env.REACT_APP_API_URL}/cctv-locations`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const cctvLocations = response.data;
      let nearest = null;
      let shortestDistance = Infinity;

      // Extract coordinates from location string
      let incidentLat, incidentLon;
      
      // Try to match both 'Lat: X, Lon: Y' and 'X, Y' formats
      const locationMatch = incident.location.match(/Lat:\s*([0-9.-]+),\s*Lon:\s*([0-9.-]+)/i) ||
                           incident.location.match(/([0-9.-]+),\s*([0-9.-]+)/);

      if (!locationMatch) {
        console.error('Could not parse location:', incident.location);
        setError('Invalid incident location format');
        setLoading(false);
        return;
      }

      [, incidentLat, incidentLon] = locationMatch.map(Number);

      if (isNaN(incidentLat) || isNaN(incidentLon)) {
        console.error('Invalid coordinates:', incidentLat, incidentLon);
        setError('Invalid coordinates');
        setLoading(false);
        return;
      }

      cctvLocations.forEach(cctv => {
        if (!cctv.latitude || !cctv.longitude) return;

        const distance = calculateDistance(
          incidentLat,
          incidentLon,
          cctv.latitude,
          cctv.longitude
        );

        if (distance < shortestDistance) {
          shortestDistance = distance;
          nearest = { ...cctv, distance };
        }
      });

      if (nearest) {
        setNearestCctv(nearest);
      } else {
        setError('No CCTV cameras found');
      }
      
      setLoading(false);
    } catch (error) {
      console.error('Error finding nearest CCTV:', error);
      setError('Error finding nearest CCTV');
      setLoading(false);
    }
  };

  const reverseGeocode = async (location) => {
    const latLngMatch = location.match(/Lat:\s*([0-9.-]+),\s*Lon:\s*([0-9.-]+)/);
    if (latLngMatch) {
      const [, latitude, longitude] = latLngMatch;
      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&addressdetails=1`
        );
        const data = await response.json();
        return data.display_name;
      } catch (error) {
        console.error("Error getting location details:", error);
        return location;
      }
    }
    return location;
  };

  useEffect(() => {
    const getFriendlyLocation = async () => {
      if (incident?.location) {
        const friendly = await reverseGeocode(incident.location);
        setFriendlyLocation(friendly);
      }
    };
    getFriendlyLocation();
  }, [incident]);

  useEffect(() => {
    if (incident) {
      findNearestCctv();
    }
  }, [incident]);

  const getReviewTimeWindow = () => {
    if (!incident.date || !incident.time) return null;
    
    try {
      // Format the date to ensure it's in YYYY-MM-DD format
      const formattedDate = new Date(incident.date).toISOString().split('T')[0];
      
      // Combine date and time properly
      const incidentDateTime = new Date(`${formattedDate}T${incident.time}`);
      
      // Check if the date is valid
      if (isNaN(incidentDateTime.getTime())) {
        console.error('Invalid date/time:', { date: incident.date, time: incident.time });
        return null;
      }

      // Changed from 30 to 10 minutes
      const startTime = new Date(incidentDateTime.getTime() - 10 * 60000);
      const endTime = new Date(incidentDateTime.getTime() + 10 * 60000);
      
      // Format the date for display
      const formattedDisplayDate = new Date(incident.date).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });

      // Format times for display
      const formatTime = (date) => {
        return date.toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: true
        });
      };

      return {
        date: formattedDisplayDate,
        start: formatTime(startTime),
        end: formatTime(endTime)
      };
    } catch (error) {
      console.error('Error processing date/time:', error);
      return null;
    }
  };

  const timeWindow = getReviewTimeWindow();

  const createIncidentMarker = () => {
    return L.divIcon({
      className: 'custom-icon',
      html: `<div class="relative">
              <div class="w-8 h-8 bg-red-500 rounded-full animate-ping absolute"></div>
              <div class="w-8 h-8 bg-red-600 rounded-full relative flex items-center justify-center">
                <i class="fas fa-exclamation-triangle text-white"></i>
              </div>
            </div>`,
      iconSize: [32, 32],
      iconAnchor: [16, 16],
    });
  };

  const createNearestCctvMarker = () => {
    return L.divIcon({
      className: 'custom-cctv-icon',
      html: `
        <div class="relative">
          <div class="absolute inset-0 bg-green-500 rounded-full animate-ping opacity-75"></div>
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="#22c55e"
            style="filter: drop-shadow(2px 2px 2px rgba(0,0,0,0.5));"
            class="w-8 h-8 relative z-10"
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

  const getIncidentCoordinates = () => {
    const match = incident.location.match(/Lat:\s*([0-9.-]+),\s*Lon:\s*([0-9.-]+)/);
    if (match) {
      return [parseFloat(match[1]), parseFloat(match[2])];
    }
    return null;
  };

  useEffect(() => {
    if (mapRef.current && nearestCctv) {
      // Clear all existing layers first
      mapRef.current.eachLayer((layer) => {
        if (!(layer instanceof L.TileLayer)) {
          mapRef.current.removeLayer(layer);
        }
      });

      const incidentCoords = getIncidentCoordinates();
      if (!incidentCoords) return;

      const reviewLayerGroup = L.layerGroup().addTo(mapRef.current);

      // Add incident marker
      const incidentMarker = L.marker(incidentCoords, {
        icon: createIncidentMarker()
      }).addTo(reviewLayerGroup);

      // Add nearest CCTV marker
      const nearestCctvMarker = L.marker(
        [nearestCctv.latitude, nearestCctv.longitude],
        { icon: createNearestCctvMarker() }
      ).addTo(reviewLayerGroup);

      // Zoom to show both markers
      const bounds = L.latLngBounds([incidentCoords, [nearestCctv.latitude, nearestCctv.longitude]]);
      mapRef.current.fitBounds(bounds, { padding: [50, 50] });

      // Cleanup function
      return () => {
        if (mapRef.current) {
          reviewLayerGroup.remove();
        }
      };
    }
  }, [nearestCctv]);

  useEffect(() => {
    const incidentCoords = getIncidentCoordinates();
    if (!incidentCoords && !loading) {
      setError('Invalid incident location coordinates');
    }
  }, [incident]);

  if (loading) {
    return (
      <div className="relative p-4 bg-blue-50 rounded-lg shadow-md mt-4">
        <button onClick={onClose} className="absolute top-2 right-2 px-2 py-1 bg-red-500 text-white rounded-lg">X</button>
        <div className="flex items-center space-x-2">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
          <p className="text-black">Finding nearest CCTV...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="relative p-4 bg-red-50 rounded-lg shadow-md mt-4">
        <button onClick={onClose} className="absolute top-2 right-2 px-2 py-1 bg-red-500 text-white rounded-lg">X</button>
        <p className="text-red-600">{error}</p>
      </div>
    );
  }

  if (!nearestCctv) {
    return (
      <div className="relative p-4 bg-red-50 rounded-lg shadow-md mt-4">
        <button onClick={onClose} className="absolute top-2 right-2 px-2 py-1 bg-red-500 text-white rounded-lg">X</button>
        <p className="text-red-600">No CCTV cameras found near this incident location.</p>
      </div>
    );
  }

  if (!loading && nearestCctv) {
    return (
      <div className="relative p-4 bg-blue-50 rounded-lg shadow-md mt-4">
        <button onClick={onClose} className="absolute top-2 right-2 px-2 py-1 bg-red-500 text-white rounded-lg">X</button>
        <h4 className="text-lg font-semibold text-blue-700 mb-4">CCTV Review Details</h4>
        
        <div className="mt-4 space-y-3 text-black">
          <div className="bg-white p-3 rounded-lg shadow-sm">
            <h5 className="font-semibold text-blue-600 mb-2">Nearest CCTV Camera</h5>
            <p><strong>Name:</strong> {nearestCctv.name}</p>
            <p><strong>Description:</strong> {nearestCctv.description}</p>
            <p><strong>Distance:</strong> {nearestCctv.distance.toFixed(2)} meters away</p>
            <p><strong>Location:</strong> {' '}
              {friendlyLocation}
              {friendlyLocation !== incident.location && (
                <span className="block text-gray-500 text-xs mt-1">
                  ({incident.location})
                </span>
              )}
            </p>
          </div>

          {timeWindow && (
            <div className="bg-yellow-50 p-3 rounded-lg shadow-sm">
              <h5 className="font-semibold text-yellow-600 mb-2">Recommended Review Window</h5>
              <div className="space-y-2">
                <p><strong>Date:</strong> {timeWindow.date}</p>
                <p><strong>Start Time:</strong> {timeWindow.start}</p>
                <p><strong>End Time:</strong> {timeWindow.end}</p>
                <div className="mt-4 p-2 bg-white rounded border border-yellow-200">
                  <p className="text-sm text-gray-600">
                    <span className="font-semibold">Review Instructions:</span>
                    <br />
                    1. Check CCTV footage starting from {timeWindow.start}
                    <br />
                    2. Continue monitoring until {timeWindow.end}
                    <br />
                    3. Look for any suspicious activity near the incident location
                    <br />
                    4. The incident location is marked in red on the map
                    <br />
                    5. The nearest CCTV camera is highlighted in green
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }
};

export default CctvReviewPanel;

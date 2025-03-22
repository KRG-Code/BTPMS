import React, { useEffect, useState } from 'react';
import axios from 'axios';
import L from 'leaflet';
import { motion, AnimatePresence } from 'framer-motion';
import { FaVideo, FaMapMarkedAlt, FaCalendarAlt, FaClock, FaArrowRight, FaExclamationTriangle, FaTimes, FaRuler, FaInfoCircle } from 'react-icons/fa';
import { useTheme } from '../../../../contexts/ThemeContext';

// Animation variants
const panelVariants = {
  hidden: { opacity: 0, x: 100 },
  visible: { opacity: 1, x: 0, transition: { type: "spring", damping: 25, stiffness: 300 } },
  exit: { opacity: 0, x: 100, transition: { duration: 0.2 } }
};

const contentVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: i => ({ opacity: 1, y: 0, transition: { delay: i * 0.1, duration: 0.5 } }),
};

const buttonVariants = {
  hover: { scale: 1.05 },
  tap: { scale: 0.95 }
};

const CctvReviewPanel = ({ incident, onClose, mapRef }) => {
  const { isDarkMode } = useTheme();
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

  useEffect(() => {
    const getFriendlyLocation = async () => {
      if (incident?.location) {
        // Use the address field if available, otherwise use location
        const friendly = incident.address || incident.location;
        setFriendlyLocation(friendly);
      }
    };
    getFriendlyLocation();
  }, [incident]);

  // You can keep this as a fallback or remove it
  const reverseGeocode = async (location) => {
    return location;
  };

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
    const primaryColor = isDarkMode ? '#f87171' : '#ef4444'; // red-400 vs red-500
    const secondaryColor = isDarkMode ? '#fca5a5' : '#fca5a5'; // red-300

    return L.divIcon({
      className: 'custom-icon',
      html: `
        <div class="relative">
          <div class="w-8 h-8 bg-opacity-60 rounded-full animate-ping absolute" style="background-color: ${secondaryColor}"></div>
          <div class="w-8 h-8 rounded-full relative flex items-center justify-center" style="background-color: ${primaryColor}">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
        </div>`,
      iconSize: [32, 32],
      iconAnchor: [16, 16],
    });
  };

  const createNearestCctvMarker = () => {
    const primaryColor = isDarkMode ? '#34d399' : '#10b981'; // green-400 vs green-500
    const secondaryColor = isDarkMode ? '#6ee7b7' : '#6ee7b7'; // green-300

    return L.divIcon({
      className: 'custom-cctv-icon',
      html: `
        <div class="relative">
          <div class="w-8 h-8 bg-opacity-60 rounded-full animate-ping absolute" style="background-color: ${secondaryColor}"></div>
          <div class="w-8 h-8 rounded-full relative flex items-center justify-center" style="background-color: ${primaryColor}">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          </div>
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

      incidentMarker.bindTooltip('Incident Location', {
        permanent: false,
        direction: 'top',
        className: isDarkMode ? 'dark-tooltip' : 'light-tooltip'
      });

      // Add nearest CCTV marker
      const nearestCctvMarker = L.marker(
        [nearestCctv.latitude, nearestCctv.longitude],
        { icon: createNearestCctvMarker() }
      ).addTo(reviewLayerGroup);

      nearestCctvMarker.bindTooltip(`CCTV: ${nearestCctv.name}`, {
        permanent: false,
        direction: 'top',
        className: isDarkMode ? 'dark-tooltip' : 'light-tooltip'
      });

      // Add line between incident and CCTV
      const line = L.polyline([
        incidentCoords,
        [nearestCctv.latitude, nearestCctv.longitude]
      ], {
        color: isDarkMode ? '#60a5fa' : '#3b82f6', // blue-400 vs blue-500
        weight: 2,
        opacity: 0.7,
        dashArray: '5, 5',
      }).addTo(reviewLayerGroup);

      // Add distance label
      const midPoint = [
        (incidentCoords[0] + nearestCctv.latitude) / 2,
        (incidentCoords[1] + nearestCctv.longitude) / 2
      ];

      const distanceLabel = L.divIcon({
        className: 'distance-label',
        html: `<div class="${isDarkMode ? 'bg-blue-900 text-blue-200' : 'bg-blue-100 text-blue-800'} px-2 py-1 rounded-full text-xs font-medium shadow">
                ${nearestCctv.distance.toFixed(0)}m
               </div>`,
        iconSize: [60, 20],
        iconAnchor: [30, 10],
      });

      L.marker(midPoint, { icon: distanceLabel }).addTo(reviewLayerGroup);

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
  }, [nearestCctv, isDarkMode]);

  useEffect(() => {
    const incidentCoords = getIncidentCoordinates();
    if (!incidentCoords && !loading) {
      setError('Invalid incident location coordinates');
    }
  }, [incident, loading]);

  return (
    <AnimatePresence>
      <motion.div
        variants={panelVariants}
        initial="hidden"
        animate="visible"
        exit="exit"
        className={`fixed right-0 top-0 bottom-0 md:w-96 w-full z-20 shadow-2xl overflow-y-auto ${
          isDarkMode ? 'bg-gray-800 text-gray-100' : 'bg-white text-gray-800'
        }`}
      >
        {/* Header */}
        <div className={`sticky top-0 z-10 px-6 py-4 flex justify-between items-center ${
          isDarkMode ? 'bg-gray-900 border-b border-gray-700' : 'bg-blue-50 border-b border-blue-100'
        }`}>
          <motion.h3 
            className="text-lg font-semibold flex items-center" 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <FaVideo className={`mr-2 ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`} />
            CCTV Review
          </motion.h3>
          <motion.button
            variants={buttonVariants}
            whileHover="hover"
            whileTap="tap"
            onClick={onClose}
            className={`p-2 rounded-full ${
              isDarkMode 
              ? 'bg-gray-700 hover:bg-gray-600 text-gray-300' 
              : 'bg-white hover:bg-gray-100 text-gray-700 shadow-sm'
            }`}
          >
            <FaTimes />
          </motion.button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <div className={`animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 ${
                isDarkMode ? 'border-blue-400' : 'border-blue-500'
              }`}></div>
              <p className="mt-4 text-center">Finding nearest CCTV camera...</p>
            </div>
          ) : error ? (
            <motion.div 
              variants={contentVariants}
              custom={0}
              initial="hidden"
              animate="visible"
              className={`p-6 rounded-lg ${
                isDarkMode ? 'bg-red-900 bg-opacity-20 text-red-200' : 'bg-red-50 text-red-800'
              }`}
            >
              <div className="flex items-start">
                <FaExclamationTriangle className="mt-0.5 mr-3 flex-shrink-0" />
                <div>
                  <h4 className="font-semibold mb-2">Error</h4>
                  <p>{error}</p>
                  <motion.button
                    variants={buttonVariants}
                    whileHover="hover"
                    whileTap="tap"
                    onClick={onClose}
                    className={`mt-4 px-4 py-2 rounded-lg ${
                      isDarkMode 
                      ? 'bg-gray-700 hover:bg-gray-600' 
                      : 'bg-white hover:bg-gray-100 border border-gray-200'
                    }`}
                  >
                    Close
                  </motion.button>
                </div>
              </div>
            </motion.div>
          ) : nearestCctv ? (
            <>
              {/* Incident Information */}
              <motion.div 
                variants={contentVariants}
                custom={0}
                initial="hidden"
                animate="visible"
                className={`p-4 rounded-lg ${
                  isDarkMode ? 'bg-gray-700' : 'bg-blue-50'
                }`}
              >
                <h4 className={`font-semibold text-lg mb-3 ${
                  isDarkMode ? 'text-blue-300' : 'text-blue-800'
                }`}>Incident Details</h4>
                <div className="space-y-2">
                  <div className="flex">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center mr-3 flex-shrink-0 ${
                      isDarkMode ? 'bg-red-900 text-red-200' : 'bg-red-100 text-red-600'
                    }`}>
                      <FaExclamationTriangle className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="font-medium">{incident.type}</div>
                      <div className={`text-sm ${
                        isDarkMode ? 'text-gray-400' : 'text-gray-600'
                      }`}>{incident.incidentClassification}</div>
                    </div>
                  </div>
                  <div className={`pl-11 ${
                    isDarkMode ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    <div className="text-sm flex items-start">
                      <FaMapMarkedAlt className="mr-2 mt-1 flex-shrink-0" />
                      <span>
                        {friendlyLocation}
                        {friendlyLocation !== incident.location && !incident.address && (
                          <span className={`block text-xs mt-1 ${
                            isDarkMode ? 'text-gray-400' : 'text-gray-500'
                          }`}>
                            ({incident.location})
                          </span>
                        )}
                      </span>
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Nearest CCTV */}
              <motion.div 
                variants={contentVariants}
                custom={1}
                initial="hidden"
                animate="visible"
                className={`p-4 rounded-lg ${
                  isDarkMode ? 'bg-gray-700' : 'bg-green-50'
                }`}
              >
                <h4 className={`font-semibold text-lg mb-3 ${
                  isDarkMode ? 'text-green-300' : 'text-green-800'
                }`}>Nearest CCTV Camera</h4>
                <div className="space-y-4">
                  <div className="flex">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center mr-3 flex-shrink-0 ${
                      isDarkMode ? 'bg-green-900 text-green-200' : 'bg-green-100 text-green-600'
                    }`}>
                      <FaVideo className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="font-medium">{nearestCctv.name}</div>
                      <div className={`text-sm ${
                        isDarkMode ? 'text-gray-400' : 'text-gray-600'
                      }`}>{nearestCctv.description}</div>
                      <div className={`flex items-center mt-2 text-sm ${
                        isDarkMode ? 'text-blue-300' : 'text-blue-600'
                      }`}>
                        <FaRuler className="mr-2" />
                        <span className="font-semibold">{nearestCctv.distance.toFixed(0)} meters</span>
                        <span className="mx-2">from incident</span>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Review Time Window */}
              {timeWindow && (
                <motion.div 
                  variants={contentVariants}
                  custom={2}
                  initial="hidden"
                  animate="visible"
                  className={`p-4 rounded-lg ${
                    isDarkMode ? 'bg-yellow-900 bg-opacity-30 text-yellow-100' : 'bg-yellow-50 text-yellow-800'
                  }`}
                >
                  <h4 className="font-semibold text-lg mb-3">Recommended Review Window</h4>
                  <div className="space-y-3">
                    <div className="flex items-start">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center mr-3 flex-shrink-0 ${
                        isDarkMode ? 'bg-yellow-900 text-yellow-200' : 'bg-yellow-100 text-yellow-600'
                      }`}>
                        <FaCalendarAlt className="h-4 w-4" />
                      </div>
                      <div className="flex-1">
                        <div className="font-medium">Date</div>
                        <div className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                          {timeWindow.date}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-start">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center mr-3 flex-shrink-0 ${
                        isDarkMode ? 'bg-yellow-900 text-yellow-200' : 'bg-yellow-100 text-yellow-600'
                      }`}>
                        <FaClock className="h-4 w-4" />
                      </div>
                      <div className="flex-1">
                        <div className="font-medium">Review Period</div>
                        <div className="flex items-center text-sm">
                          <span className={isDarkMode ? 'text-gray-300' : 'text-gray-700'}>
                            {timeWindow.start}
                          </span>
                          <FaArrowRight className="mx-3" />
                          <span className={isDarkMode ? 'text-gray-300' : 'text-gray-700'}>
                            {timeWindow.end}
                          </span>
                        </div>
                        <div className={`mt-1 text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                          (20 minute window centered on incident time)
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className={`mt-4 p-3 rounded-lg ${
                    isDarkMode ? 'bg-gray-800 bg-opacity-50' : 'bg-white border border-yellow-200'
                  }`}>
                    <div className="flex items-start">
                      <FaInfoCircle className={`mt-0.5 mr-2 flex-shrink-0 ${
                        isDarkMode ? 'text-yellow-400' : 'text-yellow-500'
                      }`} />
                      <div className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                        <p className="font-medium mb-1">Review Instructions:</p>
                        <ul className="space-y-1 list-disc list-inside pl-1">
                          <li>Check CCTV footage starting from {timeWindow.start}</li>
                          <li>Continue monitoring until {timeWindow.end}</li>
                          <li>Look for any suspicious activity near the incident location</li>
                          <li>The incident location is marked in red on the map</li>
                          <li>The nearest CCTV camera is highlighted in green</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Actions */}
              <motion.div 
                variants={contentVariants}
                custom={3}
                initial="hidden"
                animate="visible"
                className="flex justify-end space-x-3"
              >
                <motion.button
                  variants={buttonVariants}
                  whileHover="hover"
                  whileTap="tap"
                  onClick={onClose}
                  className={`px-4 py-2 rounded-lg ${
                    isDarkMode 
                    ? 'bg-gray-700 hover:bg-gray-600 text-gray-300' 
                    : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
                  }`}
                >
                  Close
                </motion.button>
                <motion.a
                  variants={buttonVariants}
                  whileHover="hover"
                  whileTap="tap"
                  href={`https://maps.google.com/?q=${nearestCctv.latitude},${nearestCctv.longitude}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`px-4 py-2 rounded-lg ${
                    isDarkMode 
                    ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                    : 'bg-blue-500 hover:bg-blue-600 text-white'
                  }`}
                >
                  Get Directions
                </motion.a>
              </motion.div>
            </>
          ) : (
            <motion.div 
              variants={contentVariants}
              custom={0}
              initial="hidden"
              animate="visible"
              className={`p-6 rounded-lg ${
                isDarkMode ? 'bg-yellow-900 bg-opacity-20 text-yellow-200' : 'bg-yellow-50 text-yellow-800'
              }`}
            >
              <div className="flex items-start">
                <FaExclamationTriangle className="mt-0.5 mr-3 flex-shrink-0" />
                <div>
                  <h4 className="font-semibold mb-2">No CCTV Coverage</h4>
                  <p>There are no CCTV cameras found near this incident location.</p>
                  <motion.button
                    variants={buttonVariants}
                    whileHover="hover"
                    whileTap="tap"
                    onClick={onClose}
                    className={`mt-4 px-4 py-2 rounded-lg ${
                      isDarkMode 
                      ? 'bg-gray-700 hover:bg-gray-600' 
                      : 'bg-white hover:bg-gray-100 border border-gray-200'
                    }`}
                  >
                    Close
                  </motion.button>
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default CctvReviewPanel;

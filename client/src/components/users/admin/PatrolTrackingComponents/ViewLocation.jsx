import React, { useEffect, useRef } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';
import { FaExclamationTriangle, FaInfoCircle } from 'react-icons/fa';

const ViewLocation = ({ location, isVisible, incidentType, markerId, onMarkerClick }) => {
  const map = useMap();
  const markerRef = useRef({});

  // Add cleanup effect
  useEffect(() => {
    return () => {
      // Cleanup: remove marker when component unmounts
      if (markerRef.current[markerId]) {
        markerRef.current[markerId].remove();
        delete markerRef.current[markerId];
      }
    };
  }, [markerId]);

  useEffect(() => {
    if (isVisible && location) {
      const latLngMatch = location.match(/Lat:\s*([0-9.-]+),\s*Lon:\s*([0-9.-]+)/);
      if (latLngMatch) {
        const [_, lat, lng] = latLngMatch.map(Number);
        if (!isNaN(lat) && !isNaN(lng)) {
          if (markerRef.current[markerId]) {
            markerRef.current[markerId].remove(); // Remove the existing marker
          }
          const icon = L.divIcon({
            className: 'custom-icon',
            html: `<div style="position: relative; width: 36px; height: 36px;">
                     <div style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; border-radius: 50%; background-color: ${incidentType === 'Emergency' ? 'rgba(255, 0, 0, 0.5)' : 'rgba(0, 0, 255, 0.5)'}; animation: pulse 1.5s infinite;"></div>
                     <div style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; font-size: 36px; color: ${incidentType === 'Emergency' ? 'red' : 'blue'};">
                       <i class="fa ${incidentType === 'Emergency' ? 'fa-exclamation-triangle' : 'fa-info-circle'}"></i>
                     </div>
                   </div>
                   <style>
                     @keyframes pulse {
                       0% { transform: scale(0.5); opacity: 1; }
                       100% { transform: scale(2); opacity: 0; }
                     }
                   </style>`,
          });
          const newMarker = L.marker([lat, lng], { icon }).addTo(map);
          newMarker.on('click', () => onMarkerClick(markerId)); // Add click event listener
          markerRef.current[markerId] = newMarker;
          map.setView([lat, lng], 15); // Zoom to the location
        } else {
          console.error('Invalid location data:', location);
        }
      } else {
        console.error('Invalid location format:', location);
      }
    } else if (markerRef.current[markerId]) {
      markerRef.current[markerId].remove(); // Remove the marker
      delete markerRef.current[markerId];
    }
  }, [isVisible, location, map, incidentType, markerId, onMarkerClick]);

  return null;
};

export default ViewLocation;

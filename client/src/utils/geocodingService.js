import axios from 'axios';

/**
 * Reverse geocodes coordinates to get a human-readable address
 * @param {number} lat - Latitude
 * @param {number} lon - Longitude
 * @returns {Promise<string|null>} - Human-readable address or null if unsuccessful
 */
export const reverseGeocode = async (lat, lon) => {
  try {
    // First, try to use MapQuest's API (requires an API key)
    const apiKey = process.env.REACT_APP_MAPQUEST_API_KEY;
    
    if (apiKey) {
      try {
        const response = await axios.get(
          `https://www.mapquestapi.com/geocoding/v1/reverse?key=${apiKey}&location=${lat},${lon}&outFormat=json`,
          { timeout: 3000 }
        );
        
        if (response.data && response.data.results && response.data.results[0].locations) {
          const location = response.data.results[0].locations[0];
          return `${location.street || ''}, ${location.adminArea5 || ''}, ${location.adminArea3 || ''}, ${location.adminArea1 || ''}`;
        }
      } catch (mqError) {
        console.warn('MapQuest geocoding failed, falling back to alternative method:', mqError);
      }
    }

    // Fallback: Try OpenStreetMap's Nominatim API with a lower timeout
    try {
      const response = await axios.get(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=18&addressdetails=1`,
        { 
          headers: { 
            'Accept-Language': 'en',
            'User-Agent': 'BTPMS-Application'
          },
          timeout: 3000
        }
      );
      
      if (response.data && response.data.display_name) {
        return response.data.display_name;
      }
    } catch (nominatimError) {
      console.warn('Nominatim geocoding failed:', nominatimError);
    }
    
    // Final fallback: Use a simple extraction from the coordinates
    return `Location at approximately ${Math.abs(lat.toFixed(4))}° ${lat >= 0 ? 'N' : 'S'}, ${Math.abs(lon.toFixed(4))}° ${lon >= 0 ? 'E' : 'W'}`;
    
  } catch (error) {
    console.error('Error during reverse geocoding:', error);
    // Fallback to raw coordinates in a readable format
    return `Coordinates: ${lat.toFixed(6)}, ${lon.toFixed(6)}`;
  }
};

/**
 * Extract coordinates from a location string
 * @param {string} locationString - String containing coordinates
 * @returns {Array|null} - [lat, lon] or null if extraction fails
 */
export const extractCoordinates = (locationString) => {
  if (!locationString) return null;
  
  const latLngMatch = locationString.match(/Lat:\s*([0-9.-]+),\s*Lon:\s*([0-9.-]+)/);
  
  if (!latLngMatch) return null;
  
  return [parseFloat(latLngMatch[1]), parseFloat(latLngMatch[2])];
};

/**
 * Get a human-readable address from a location string
 * @param {string} locationString - String containing coordinates
 * @returns {Promise<string|null>} - Human-readable address or null if unsuccessful
 */
export const getAddressFromLocationString = async (locationString) => {
  const coords = extractCoordinates(locationString);
  if (!coords) return null;
  
  return await reverseGeocode(coords[0], coords[1]);
};

import axios from 'axios';

/**
 * Utility functions for geocoding operations
 */

/**
 * Reverse geocode from coordinates to human-readable address
 * Uses Nominatim OpenStreetMap service (free, no API key needed)
 * 
 * @param {number} latitude - Latitude coordinate
 * @param {number} longitude - Longitude coordinate
 * @returns {Promise<string>} - A promise that resolves to an address string
 */
export const reverseGeocode = async (latitude, longitude) => {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`
    );
    
    if (!response.ok) {
      throw new Error(`Geocoding failed: ${response.statusText}`);
    }
    
    const data = await response.json();
    
    // Format the address based on available components
    if (data && data.display_name) {
      // For Philippine addresses, we can customize the format
      const address = data.address || {};
      
      // Build a more concise address string
      const addressParts = [];
      
      if (address.road) addressParts.push(address.road);
      if (address.suburb) addressParts.push(address.suburb);
      if (address.city || address.town || address.village) {
        addressParts.push(address.city || address.town || address.village);
      }
      if (address.county) addressParts.push(address.county);
      if (address.state) addressParts.push(address.state);
      
      // Use the constructed address or fall back to display_name
      return addressParts.length > 0 ? addressParts.join(', ') : data.display_name;
    }
    
    return null;
  } catch (error) {
    console.error('Reverse geocoding error:', error);
    return null;
  }
};

/**
 * Forward geocode from address to coordinates
 * Uses Nominatim OpenStreetMap service (free, no API key needed)
 * 
 * @param {string} address - Address to geocode
 * @returns {Promise<{lat: number, lng: number} | null>} - A promise resolving to coordinates or null
 */
export const forwardGeocode = async (address) => {
  try {
    if (!address) return null;
    
    const encodedAddress = encodeURIComponent(address);
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodedAddress}&limit=1`
    );
    
    if (!response.ok) {
      throw new Error(`Forward geocoding failed: ${response.statusText}`);
    }
    
    const data = await response.json();
    
    if (data && data.length > 0) {
      return {
        lat: parseFloat(data[0].lat),
        lng: parseFloat(data[0].lon)
      };
    }
    
    return null;
  } catch (error) {
    console.error('Forward geocoding error:', error);
    return null;
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

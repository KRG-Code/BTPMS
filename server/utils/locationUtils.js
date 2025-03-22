const axios = require('axios');

/**
 * Converts latitude and longitude coordinates to a human-readable address
 * @param {number} latitude - The latitude coordinate
 * @param {number} longitude - The longitude coordinate
 * @returns {Promise<string>} A string containing the address or the original coordinates if geocoding fails
 */
exports.getAddressFromCoordinates = async (latitude, longitude) => {
  try {
    // Using OpenStreetMap's Nominatim API for reverse geocoding
    const response = await axios.get(`https://nominatim.openstreetmap.org/reverse`, {
      params: {
        format: 'json',
        lat: latitude,
        lon: longitude,
        zoom: 18,
        addressdetails: 1
      },
      headers: {
        'User-Agent': 'BTPMS Application' // Required by Nominatim's terms of use
      }
    });

    if (response.data && response.data.display_name) {
      // Extract and format a simplified address
      const address = response.data.display_name;
      // Simplify the address if it's too long
      return address.length > 50 ? address.substring(0, 47) + '...' : address;
    }
    return `Lat: ${latitude}, Lon: ${longitude}`;
  } catch (error) {
    console.error('Error in reverse geocoding:', error);
    return `Lat: ${latitude}, Lon: ${longitude}`;
  }
};

/**
 * Formats a MongoDB ObjectId to be more user-friendly
 * @param {string} id - The MongoDB ObjectId to format
 * @returns {string} A shortened, uppercase version of the ID
 */
exports.formatObjectId = (id) => {
  if (!id) return 'Unknown';
  return id.toString().substring(id.length - 6).toUpperCase();
};

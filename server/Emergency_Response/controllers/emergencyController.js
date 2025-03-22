const emergencyDbConnection = require('../config/emergencyDb');
const UserEmergency = require('../Model/model_for_emergency_popup');
const CitizenEmergency = require('../Model/model_for_citizen_emergency_report');
const axios = require('axios');
const { parseAddressString } = require('../../utils/addressParser'); // Import the address parser

const extractCoordinates = (location) => {
  if (!location) return null;
  
  console.log('Attempting to extract coordinates from:', location); // Debug log

  // Try different possible formats
  const formats = [
    /Lat:\s*([0-9.-]+),\s*Lon:\s*([0-9.-]+)/i,
    /latitude:\s*([0-9.-]+).*longitude:\s*([0-9.-]+)/i,
    /([0-9.-]+),\s*([0-9.-]+)/,
    /.*?([0-9.-]+)[,\s]+([0-9.-]+)/
  ];

  for (const format of formats) {
    const match = location.match(format);
    if (match) {
      const [_, lat, lon] = match;
      const latitude = parseFloat(lat);
      const longitude = parseFloat(lon);
      
      // Validate coordinates are within reasonable bounds
      if (!isNaN(latitude) && !isNaN(longitude) &&
          latitude >= -90 && latitude <= 90 &&
          longitude >= -180 && longitude <= 180) {
        console.log('Successfully extracted coordinates:', { latitude, longitude }); // Debug log
        return { latitude, longitude };
      }
    }
  }
  
  console.log('Failed to extract valid coordinates'); // Debug log
  return null;
};

// This function is kept for backward compatibility but isn't our primary method anymore
async function reverseGeocode(lat, lon) {
  try {
    const response = await axios.get(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&addressdetails=1`
    );
    const address = response.data.address;
    
    return {
      street: address.road || address.street || 'N/A',
      barangay: address.quarter || address.suburb || 'N/A', // Use quarter for barangay
      city: address.city || address.municipality || 'N/A',
      province: address.region || address.state_district || 'N/A'  // Prioritize region over state_district
    };
  } catch (error) {
    console.error('Geocoding error:', error);
    return {
      street: 'N/A',
      barangay: 'N/A',
      city: 'N/A',
      province: 'N/A'
    };
  }
}

// Modified saveBackupRequest to include address parameter
const saveBackupRequest = async (data) => {
  try {
    console.log('Received data for backup request:', data);

    let coordinates = extractCoordinates(data.location);
    if (!coordinates && data.rawLocation) {
      coordinates = extractCoordinates(data.rawLocation);
    }

    if (!coordinates) {
      coordinates = { latitude: 0, longitude: 0 };
    }

    // Use the provided address if available, otherwise fall back to reverse geocoding
    let address;
    if (data.address) {
      // Parse the address string to get components
      address = parseAddressString(data.address);
    } else {
      // Fall back to reverse geocoding only if no address is provided
      address = coordinates.latitude !== 0 ? 
        await reverseGeocode(coordinates.latitude, coordinates.longitude) :
        { street: 'N/A', barangay: 'N/A', city: 'N/A', province: 'N/A' };
    }

    // Create base emergency data with address
    const emergencyData = {
      name: `Backup request by Tanod ${data.tanodName}`,
      emergencyType: data.incidentType,
      status: 'new',
      // Flat address fields for both models
      street: address.street,
      barangay: address.barangay,
      city: address.city,
      province: address.province,
      // Direct latitude and longitude for both models  
      latitude: coordinates.latitude,
      longitude: coordinates.longitude,
      description: data.description || 'N/A',
      timestamp: new Date(),
      locationNote: coordinates.latitude === 0 ? 'Coordinates not available' : 'N/A',
      phone: data.tanodContact,
      backup: true,
      assistanceRequestId: data.assistanceRequestId,
    };

    console.log('Creating emergency records with data:', {
      latitude: coordinates.latitude,
      longitude: coordinates.longitude,
      street: address.street,
      barangay: address.barangay,
      city: address.city,
      province: address.province
    });

    // Create both emergency records
    const userEmergency = new UserEmergency({
      ...emergencyData,
      gender: 'N/A',
      age: 0,
      profilePicture: 'N/A'
    });

    const citizenEmergency = new CitizenEmergency({
      ...emergencyData,
      gender: 'N/A',
      profilePicture: 'N/A',
      // No need for nested address or coordinates array anymore
    });

    await Promise.all([
      userEmergency.save(),
      citizenEmergency.save()
    ]);

    return true;
  } catch (error) {
    console.error('Error in saveBackupRequest:', error);
    throw error;
  }
};

// Helper function to parse address components
function parseAddress(addressString) {
  if (!addressString || addressString === '') {
    return {
      street: 'N/A',
      barangay: 'N/A',
      city: 'N/A',
      province: 'N/A'
    };
  }
  
  // Simple parsing logic - split by commas and take parts
  const parts = addressString.split(',').map(part => part.trim());
  
  return {
    street: parts[0] || 'N/A',
    barangay: parts[1] || 'N/A',
    city: parts[2] || 'N/A',
    province: parts[3] || 'N/A'
  };
}

module.exports = {
  saveBackupRequest
};

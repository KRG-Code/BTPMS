const emergencyDbConnection = require('../config/emergencyDb');
const UserEmergency = require('../Model/model_for_emergency_popup');
const CitizenEmergency = require('../Model/model_for_citizen_emergency_report');
const axios = require('axios');

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

// Modify saveBackupRequest to include address lookup
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

    // Get address data
    const address = coordinates.latitude !== 0 ? 
      await reverseGeocode(coordinates.latitude, coordinates.longitude) :
      { street: 'N/A', barangay: 'N/A', city: 'N/A', province: 'N/A' };

    // Create base emergency data with address
    const emergencyData = {
      name: `Backup request by Tanod ${data.tanodName}`,
      emergencyType: data.incidentType,
      status: 'new',
      latitude: coordinates.latitude,
      longitude: coordinates.longitude,
      description: data.description || 'N/A',
      timestamp: new Date(),
      locationNote: coordinates.latitude === 0 ? 'Coordinates not available' : 'N/A',
      phone: data.tanodContact,
      backup: true,
      street: address.street,
      barangay: address.barangay,
      city: address.city,
      province: address.province,
      assistanceRequestId: data.assistanceRequestId // Add this field
    };

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
      profilePicture: 'N/A'
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

module.exports = {
  saveBackupRequest
};

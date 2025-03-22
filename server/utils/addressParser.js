/**
 * Parses an address string into structured components
 * @param {string} addressString - The full address string to parse
 * @returns {Object} Structured address with street, barangay, city, and province
 */
exports.parseAddressString = (addressString) => {
  // Default values if parsing fails
  const defaultAddress = {
    street: 'N/A',
    barangay: 'N/A',
    city: 'N/A',
    province: 'N/A'
  };

  if (!addressString || typeof addressString !== 'string') {
    return defaultAddress;
  }

  try {
    // Remove extra spaces and split by commas
    const parts = addressString.split(',').map(part => part.trim()).filter(Boolean);
    
    // If we have enough parts, assign them accordingly
    if (parts.length >= 4) {
      return {
        street: parts[0],
        barangay: parts[1],
        city: parts[2],
        province: parts[3]
      };
    } else if (parts.length === 3) {
      return {
        street: parts[0],
        barangay: parts[1],
        city: parts[2],
        province: 'N/A'
      };
    } else if (parts.length === 2) {
      return {
        street: parts[0],
        barangay: parts[1],
        city: 'N/A',
        province: 'N/A'
      };
    } else if (parts.length === 1) {
      return {
        street: parts[0],
        barangay: 'N/A',
        city: 'N/A',
        province: 'N/A'
      };
    }
    
    return defaultAddress;
  } catch (error) {
    console.error('Error parsing address:', error);
    return defaultAddress;
  }
};

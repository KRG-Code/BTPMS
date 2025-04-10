import React from 'react';
import { motion } from 'framer-motion';
import { 
  FaCar, 
  FaInfoCircle, 
  FaGasPump, 
  FaTachometerAlt, 
  FaTools, 
  FaCheckCircle, 
  FaExclamationTriangle, 
  FaBan,
  FaCalendarAlt,
  FaUser,
  FaIdCard,
  FaPalette,
  FaBarcode,
  FaMapMarkerAlt,
  FaClock,
  FaHistory
} from 'react-icons/fa';

const VehicleDetail = ({ 
  vehicle, 
  isDarkMode, 
  cardBg, 
  borderColor, 
  textColor, 
  subTextColor 
}) => {
  // Function to determine condition icon and color based on condition
  const getConditionDetails = (condition) => {
    switch(condition) {
      case 'Good condition':
        return { 
          icon: <FaCheckCircle className={isDarkMode ? 'text-green-400' : 'text-green-500'} />,
          textColor: isDarkMode ? 'text-green-400' : 'text-green-600',
          bgColor: isDarkMode ? 'bg-green-900/30' : 'bg-green-100'
        };
      case 'Needs minor maintenance':
        return { 
          icon: <FaTools className={isDarkMode ? 'text-yellow-400' : 'text-yellow-500'} />,
          textColor: isDarkMode ? 'text-yellow-400' : 'text-yellow-600',
          bgColor: isDarkMode ? 'bg-yellow-900/30' : 'bg-yellow-100'
        };
      case 'Needs major maintenance':
        return { 
          icon: <FaExclamationTriangle className={isDarkMode ? 'text-orange-400' : 'text-orange-500'} />,
          textColor: isDarkMode ? 'text-orange-400' : 'text-orange-600',
          bgColor: isDarkMode ? 'bg-orange-900/30' : 'bg-orange-100'
        };
      case 'Not operational':
        return { 
          icon: <FaBan className={isDarkMode ? 'text-red-400' : 'text-red-500'} />,
          textColor: isDarkMode ? 'text-red-400' : 'text-red-600',
          bgColor: isDarkMode ? 'bg-red-900/30' : 'bg-red-100'
        };
      default:
        return { 
          icon: <FaInfoCircle className={isDarkMode ? 'text-gray-400' : 'text-gray-500'} />,
          textColor: isDarkMode ? 'text-gray-400' : 'text-gray-600',
          bgColor: isDarkMode ? 'bg-gray-900/30' : 'bg-gray-100'
        };
    }
  };

  // Get condition details for this vehicle
  const conditionDetails = getConditionDetails(vehicle.condition);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={`${cardBg} border ${borderColor} rounded-lg shadow-sm overflow-hidden`}
    >
      {/* Vehicle Image Section */}
      <div className="flex justify-center p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="w-64 h-48 rounded-lg overflow-hidden bg-gray-200">
          {vehicle.imageUrl ? (
            <img 
              src={vehicle.imageUrl} 
              alt={vehicle.name} 
              className="w-full h-full object-cover"
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = 'https://placehold.co/600x400?text=Vehicle';
              }}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gray-300">
              <FaCar className="text-6xl text-gray-400" />
            </div>
          )}
        </div>
      </div>

      {/* Vehicle Basic Details */}
      <div className="p-5">
        <h3 className={`text-xl font-bold mb-1 ${textColor}`}>{vehicle.name}</h3>
        <p className={`text-sm ${subTextColor} mb-4`}>{vehicle.model} - {vehicle.licensePlate}</p>
        
        {/* Condition and Status Badges */}
        <div className="flex flex-wrap gap-2 mb-6">
          {/* Condition Badge */}
          <div className={`inline-flex items-center px-3 py-1.5 rounded-full ${conditionDetails.bgColor} ${conditionDetails.textColor}`}>
            {conditionDetails.icon}
            <span className="ml-2">{vehicle.condition}</span>
          </div>
          
          {/* Status Badge */}
          <div className={`inline-flex items-center px-3 py-1.5 rounded-full ${
            vehicle.status === 'Available' 
              ? isDarkMode ? 'bg-green-900/30 text-green-300' : 'bg-green-100 text-green-700'
              : vehicle.status === 'In Use'
              ? isDarkMode ? 'bg-blue-900/30 text-blue-300' : 'bg-blue-100 text-blue-700'
              : vehicle.status === 'Under Maintenance'
              ? isDarkMode ? 'bg-yellow-900/30 text-yellow-300' : 'bg-yellow-100 text-yellow-700'
              : isDarkMode ? 'bg-red-900/30 text-red-300' : 'bg-red-100 text-red-700'
          }`}>
            {vehicle.status === 'Available' ? <FaCheckCircle className="mr-1" /> :
             vehicle.status === 'In Use' ? <FaClock className="mr-1" /> :
             vehicle.status === 'Under Maintenance' ? <FaTools className="mr-1" /> :
             <FaBan className="mr-1" />}
            <span>{vehicle.status}</span>
          </div>
        </div>

        {/* Primary Details Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className="flex items-center">
            <div className={`p-2.5 rounded-full mr-3 ${isDarkMode ? 'bg-gray-800' : 'bg-gray-100'}`}>
              <FaTachometerAlt className={isDarkMode ? 'text-blue-400' : 'text-blue-500'} />
            </div>
            <div>
              <p className={`text-xs ${subTextColor}`}>Current Mileage</p>
              <p className={`font-medium ${textColor}`}>{vehicle.currentMileage || 0} km</p>
            </div>
          </div>

          <div className="flex items-center">
            <div className={`p-2.5 rounded-full mr-3 ${isDarkMode ? 'bg-gray-800' : 'bg-gray-100'}`}>
              <FaGasPump className={isDarkMode ? 'text-blue-400' : 'text-blue-500'} />
            </div>
            <div>
              <p className={`text-xs ${subTextColor}`}>Type</p>
              <p className={`font-medium ${textColor}`}>{vehicle.type || 'Not specified'}</p>
            </div>
          </div>

          <div className="flex items-center">
            <div className={`p-2.5 rounded-full mr-3 ${isDarkMode ? 'bg-gray-800' : 'bg-gray-100'}`}>
              <FaPalette className={isDarkMode ? 'text-blue-400' : 'text-blue-500'} />
            </div>
            <div>
              <p className={`text-xs ${subTextColor}`}>Color</p>
              <p className={`font-medium ${textColor}`}>{vehicle.color || 'Not specified'}</p>
            </div>
          </div>

          <div className="flex items-center">
            <div className={`p-2.5 rounded-full mr-3 ${isDarkMode ? 'bg-gray-800' : 'bg-gray-100'}`}>
              <FaCalendarAlt className={isDarkMode ? 'text-blue-400' : 'text-blue-500'} />
            </div>
            <div>
              <p className={`text-xs ${subTextColor}`}>Year</p>
              <p className={`font-medium ${textColor}`}>{vehicle.year || 'Not specified'}</p>
            </div>
          </div>
        </div>
        
        {/* Additional Details Section */}
        <div className={`p-4 rounded-lg ${
          isDarkMode ? 'bg-gray-800/50 border border-gray-700' : 'bg-gray-50 border border-gray-200'
        } mb-6`}>
          <h4 className={`font-medium mb-3 ${textColor} flex items-center`}>
            <FaInfoCircle className="mr-2" /> Additional Information
          </h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <p className={`text-xs ${subTextColor}`}>License Plate</p>
              <p className={`font-medium ${textColor}`}>{vehicle.licensePlate || 'N/A'}</p>
            </div>
            
            <div>
              <p className={`text-xs ${subTextColor}`}>Vehicle ID</p>
              <p className={`font-medium ${textColor}`}>{vehicle.vehicleId || vehicle._id || 'N/A'}</p>
            </div>
            
            {vehicle.manufactureDate && (
              <div>
                <p className={`text-xs ${subTextColor}`}>Manufacture Date</p>
                <p className={`font-medium ${textColor}`}>{formatDate(vehicle.manufactureDate)}</p>
              </div>
            )}
            
            {vehicle.purchaseDate && (
              <div>
                <p className={`text-xs ${subTextColor}`}>Purchase Date</p>
                <p className={`font-medium ${textColor}`}>{formatDate(vehicle.purchaseDate)}</p>
              </div>
            )}
            
            {vehicle.insurance && (
              <div className="md:col-span-2">
                <p className={`text-xs ${subTextColor}`}>Insurance Information</p>
                <p className={`font-medium ${textColor}`}>{vehicle.insurance}</p>
              </div>
            )}
            
            {vehicle.notes && (
              <div className="md:col-span-2">
                <p className={`text-xs ${subTextColor}`}>Notes</p>
                <p className={`font-medium ${textColor}`}>{vehicle.notes}</p>
              </div>
            )}
          </div>
        </div>

        {/* Status and Assignment Section */}
        <div className={`p-4 rounded-lg ${
          isDarkMode ? 'bg-gray-800/50 border border-gray-700' : 'bg-gray-50 border border-gray-200'
        }`}>
          <h4 className={`font-medium mb-3 ${textColor} flex items-center`}>
            <FaUser className="mr-2" /> Assignment & Status
          </h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {vehicle.assignedDriver && vehicle.assignedDriver.firstName ? (
              <div className="md:col-span-2">
                <p className={`text-xs ${subTextColor}`}>Assigned Driver</p>
                <div className="flex items-center mt-1">
                  {vehicle.assignedDriver.profilePicture ? (
                    <img 
                      src={vehicle.assignedDriver.profilePicture} 
                      className="w-6 h-6 rounded-full mr-2 object-cover"
                      alt={`${vehicle.assignedDriver.firstName}`}
                    />
                  ) : (
                    <div className={`w-6 h-6 rounded-full mr-2 flex items-center justify-center ${
                      isDarkMode ? 'bg-gray-700' : 'bg-gray-300'
                    }`}>
                      <FaUser className={`text-xs ${
                        isDarkMode ? 'text-gray-400' : 'text-gray-600'
                      }`} />
                    </div>
                  )}
                  <span className={`font-medium ${textColor}`}>
                    {vehicle.assignedDriver.firstName} {vehicle.assignedDriver.lastName}
                  </span>
                </div>
              </div>
            ) : (
              <div className="md:col-span-2">
                <p className={`text-xs ${subTextColor}`}>Assigned Driver</p>
                <p className={`font-medium ${textColor}`}>Not assigned</p>
              </div>
            )}
            
            {vehicle.lastUsed && (
              <div>
                <p className={`text-xs ${subTextColor}`}>Last Used</p>
                <p className={`font-medium ${textColor} flex items-center`}>
                  <FaHistory className="mr-1.5 text-xs" /> {formatDate(vehicle.lastUsed)}
                </p>
              </div>
            )}
            
            {vehicle.lastMaintenance && (
              <div>
                <p className={`text-xs ${subTextColor}`}>Last Maintenance</p>
                <p className={`font-medium ${textColor} flex items-center`}>
                  <FaTools className="mr-1.5 text-xs" /> {formatDate(vehicle.lastMaintenance)}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

// Helper function to get status color
const getStatusColor = (status) => {
  switch(status) {
    case 'Available':
      return 'text-green-500 dark:text-green-400';
    case 'In Use':
      return 'text-blue-500 dark:text-blue-400';
    case 'Under Maintenance':
      return 'text-yellow-500 dark:text-yellow-400';
    case 'Out of Service':
      return 'text-red-500 dark:text-red-400';
    default:
      return 'text-gray-500 dark:text-gray-400';
  }
};

// Helper function to format date
const formatDate = (dateString) => {
  if (!dateString) return 'Never';
  const date = new Date(dateString);
  return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

export default VehicleDetail;

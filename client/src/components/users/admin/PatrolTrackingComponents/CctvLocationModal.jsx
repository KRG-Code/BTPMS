import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import axios from 'axios';
import { toast } from 'react-toastify';
import { motion, AnimatePresence } from 'framer-motion';
import { FaPlus, FaTrash, FaEdit, FaTimes, FaSearch, FaVideo, FaMapMarkerAlt } from 'react-icons/fa';
import { useTheme } from '../../../../contexts/ThemeContext';

// Animation variants
const modalVariants = {
  hidden: { opacity: 0, scale: 0.9, y: -20 },
  visible: { 
    opacity: 1, 
    scale: 1, 
    y: 0, 
    transition: { 
      type: "spring", 
      damping: 25, 
      stiffness: 300 
    }
  },
  exit: { 
    opacity: 0, 
    scale: 0.9, 
    y: 20, 
    transition: { duration: 0.2 } 
  }
};

const formVariants = {
  hidden: { opacity: 0, height: 0 },
  visible: { 
    opacity: 1, 
    height: 'auto', 
    transition: { 
      duration: 0.3,
      when: "beforeChildren" 
    }
  },
  exit: { 
    opacity: 0, 
    height: 0, 
    transition: { 
      duration: 0.2,
      when: "afterChildren" 
    } 
  }
};

const formItemVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: { 
    opacity: 1, 
    y: 0, 
    transition: { duration: 0.3 }
  },
  exit: { 
    opacity: 0, 
    y: -10, 
    transition: { duration: 0.2 } 
  }
};

const tableRowVariants = {
  hidden: { opacity: 0, x: -10 },
  visible: i => ({
    opacity: 1,
    x: 0,
    transition: {
      delay: i * 0.05,
      duration: 0.3
    }
  }),
  hover: {
    backgroundColor: "rgba(59, 130, 246, 0.05)",
  }
};

const buttonVariants = {
  hover: { scale: 1.05 },
  tap: { scale: 0.95 }
};

// Update the marker creation function to support dark/light mode
const createCctvMarker = (isNew = false, isDarkMode = false) => {
  const color = isNew ? '#22c55e' : isDarkMode ? '#60a5fa' : '#3b82f6'; // green-500 for new, blue variants for existing
  return L.divIcon({
    className: 'custom-cctv-icon',
    html: `
      <div class="relative">
        <svg 
          xmlns="http://www.w3.org/2000/svg" 
          fill="none" 
          viewBox="0 0 24 24" 
          stroke="${color}"
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
        ${isNew ? `
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="${color}"
            class="w-8 h-8 absolute inset-0 animate-ping opacity-75"
          >
            <path 
              stroke-linecap="round" 
              stroke-linejoin="round" 
              stroke-width="2" 
              d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
            />
          </svg>
        ` : ''}
      </div>
    `,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
  });
};

const CctvLocationModal = ({ isOpen, onClose }) => {
  const { isDarkMode } = useTheme();
  const [cctvLocations, setCctvLocations] = useState([]);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [isAddingCctv, setIsAddingCctv] = useState(false);
  const [newCctv, setNewCctv] = useState({
    name: '',
    description: '',
    latitude: '',
    longitude: '',
  });
  const [isEditing, setIsEditing] = useState(false);
  const [editingCctv, setEditingCctv] = useState(null);
  const [canMoveMarker, setCanMoveMarker] = useState(false);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null);

  // Function to fetch CCTV locations from backend
  const fetchCctvLocations = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${process.env.REACT_APP_API_URL}/cctv-locations`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setCctvLocations(response.data);
    } catch (error) {
      console.error('Error fetching CCTV locations:', error);
      toast.error('Failed to load CCTV locations');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchCctvLocations();
    }
  }, [isOpen]);

  // Map click handler component
  const MapClickHandler = () => {
    useMapEvents({
      click: (e) => {
        if (isAddingCctv || (isEditing && canMoveMarker)) {
          toast.dismiss(); // Dismiss any existing toasts
          setNewCctv(prev => ({
            ...prev,
            latitude: e.latlng.lat,
            longitude: e.latlng.lng
          }));
        }
      },
    });
    return null;
  };

  const validateForm = () => {
    toast.dismiss(); // Dismiss any existing toasts
    if (!newCctv.name.trim()) {
      toast.error('CCTV name is required');
      return false;
    }
    if (!newCctv.description.trim()) {
      toast.error('CCTV description is required');
      return false;
    }
    if (!newCctv.latitude || !newCctv.longitude) {
      toast.error('Please select a location on the map');
      return false;
    }
    return true;
  };

  const handleAddCctv = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setConfirmAction(() => handleConfirmSave);
    setShowConfirmDialog(true);
  };

  // Add confirm save handler
  const handleConfirmSave = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      if (isEditing) {
        await axios.put(
          `${process.env.REACT_APP_API_URL}/cctv-locations/${editingCctv._id}`,
          newCctv,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        toast.success('CCTV location updated successfully');
      } else {
        await axios.post(
          `${process.env.REACT_APP_API_URL}/cctv-locations`,
          newCctv,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        toast.success('CCTV location added successfully');
      }
      resetForm();
      fetchCctvLocations();
    } catch (error) {
      console.error('Error saving CCTV location:', error);
      toast.error(isEditing ? 'Failed to update CCTV location' : 'Failed to add CCTV location');
    } finally {
      setLoading(false);
      setShowConfirmDialog(false);
    }
  };

  // Add edit CCTV handler
  const handleEditCctv = (cctv) => {
    toast.dismiss(); // Dismiss any existing toasts
    setIsEditing(true);
    setIsAddingCctv(false);
    setEditingCctv(cctv);
    setCanMoveMarker(false); // Start with marker locked
    setNewCctv({
      name: cctv.name,
      description: cctv.description,
      latitude: cctv.latitude,
      longitude: cctv.longitude,
    });
  };

  // Add toggle marker movement function
  const toggleMarkerMovement = () => {
    toast.dismiss(); // Dismiss any existing toasts
    setCanMoveMarker(!canMoveMarker);
    toast.info(
      canMoveMarker ? 
      'Marker location locked' : 
      'Click anywhere on the map to move the CCTV location',
      { autoClose: 2000 }
    );
  };

  // Modify handleDeleteCctv to include confirmation
  const handleDeleteCctv = (id) => {
    setConfirmAction(() => () => handleConfirmDelete(id));
    setShowConfirmDialog(true);
  };

  // Reset form function
  const resetForm = () => {
    setIsAddingCctv(false);
    setIsEditing(false);
    setEditingCctv(null);
    setNewCctv({ name: '', description: '', latitude: '', longitude: '' });
  };

  // Add confirm delete handler
  const handleConfirmDelete = async (id) => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${process.env.REACT_APP_API_URL}/cctv-locations/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success('CCTV location deleted successfully');
      fetchCctvLocations();
    } catch (error) {
      console.error('Error deleting CCTV location:', error);
      toast.error('Failed to delete CCTV location');
    } finally {
      setLoading(false);
      setShowConfirmDialog(false);
    }
  };

  // Get filtered CCTV locations based on search term
  const filteredCctvLocations = cctvLocations.filter(
    cctv => cctv.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
            cctv.description.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  // Update the form title and button text based on mode
  const getFormTitle = () => isEditing ? 'Edit CCTV' : 'Add New CCTV';
  const getSaveButtonText = () => isEditing ? 'Update Location' : 'Save Location';

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm z-[3000] flex items-center justify-center p-4"
      >
        <motion.div
          variants={modalVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          className={`w-11/12 max-w-7xl rounded-xl shadow-xl overflow-hidden h-[90vh] flex flex-col md:flex-row ${
            isDarkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-800'
          }`}
        >
          {/* Header - Mobile Only */}
          <div className={`md:hidden flex justify-between items-center p-4 border-b ${
            isDarkMode 
              ? 'bg-gray-900 border-gray-700' 
              : 'bg-gray-50 border-gray-200'
          }`}>
            <h2 className="text-xl font-bold flex items-center">
              <FaVideo className="mr-2" />
              CCTV Locations
            </h2>
            <motion.button
              variants={buttonVariants}
              whileHover="hover"
              whileTap="tap"
              onClick={onClose}
              className={`p-2 rounded-full ${
                isDarkMode 
                ? 'bg-gray-700 hover:bg-gray-600 text-gray-300' 
                : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
              }`}
            >
              <FaTimes />
            </motion.button>
          </div>

          {/* Left side - Map */}
          <div className="w-full md:w-2/3 h-1/2 md:h-full relative">
            <MapContainer
              center={[14.7356, 121.0498]}
              zoom={13}
              style={{ height: '100%', width: '100%' }}
              className="z-10"
            >
              <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
              <MapClickHandler />
              
              {/* Display existing CCTV markers */}
              {cctvLocations.map((cctv) => (
                <Marker
                  key={cctv._id}
                  position={[
                    isEditing && editingCctv?._id === cctv._id ? newCctv.latitude : cctv.latitude,
                    isEditing && editingCctv?._id === cctv._id ? newCctv.longitude : cctv.longitude
                  ]}
                  icon={createCctvMarker(isEditing && editingCctv?._id === cctv._id, isDarkMode)}
                />
              ))}
              
              {/* Display new CCTV marker when adding */}
              {isAddingCctv && newCctv.latitude && newCctv.longitude && (
                <Marker
                  position={[newCctv.latitude, newCctv.longitude]}
                  icon={createCctvMarker(true, isDarkMode)}
                />
              )}
            </MapContainer>
          </div>

          {/* Right side - Controls and Table */}
          <div className={`w-full md:w-1/3 h-1/2 md:h-full flex flex-col ${
            isDarkMode ? 'bg-gray-800' : 'bg-white'
          }`}>
            {/* Header - Desktop Only */}
            <div className={`hidden md:flex justify-between items-center px-6 py-4 ${
              isDarkMode 
                ? 'bg-gray-900 border-b border-gray-700' 
                : 'bg-blue-50 border-b border-blue-100'
            }`}>
              <h2 className="text-xl font-bold flex items-center">
                <FaVideo className={`mr-2 ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`} />
                CCTV Locations
              </h2>
              <motion.button
                variants={buttonVariants}
                whileHover="hover"
                whileTap="tap"
                onClick={onClose}
                className={`p-2 rounded-full ${
                  isDarkMode 
                  ? 'bg-gray-700 hover:bg-gray-600 text-gray-300' 
                  : 'bg-white hover:bg-gray-100 text-gray-700'
                }`}
              >
                <FaTimes />
              </motion.button>
            </div>

            {/* Search and Add Controls */}
            <div className={`p-4 ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
              <div className="flex items-center gap-2 mb-4">
                <div className="relative flex-grow">
                  <FaSearch className={`absolute left-3 top-1/2 transform -translate-y-1/2 ${
                    isDarkMode ? 'text-gray-500' : 'text-gray-400'
                  }`} />
                  <input
                    type="text"
                    placeholder="Search CCTV locations..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className={`pl-9 pr-4 py-2 w-full rounded-lg border ${
                      isDarkMode 
                        ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                        : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                    } focus:ring-2 ${
                      isDarkMode ? 'focus:ring-blue-500' : 'focus:ring-blue-500'
                    } focus:border-transparent`}
                  />
                </div>
                {!isAddingCctv && !isEditing && (
                  <motion.button
                    variants={buttonVariants}
                    whileHover="hover"
                    whileTap="tap"
                    onClick={() => setIsAddingCctv(true)}
                    className={`p-2 rounded-lg ${
                      isDarkMode 
                        ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                        : 'bg-blue-500 hover:bg-blue-600 text-white'
                    }`}
                  >
                    <FaPlus />
                  </motion.button>
                )}
              </div>

              {/* Add/Edit CCTV Form */}
              <AnimatePresence>
                {(isAddingCctv || isEditing) && (
                  <motion.div
                    variants={formVariants}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                    className={`mb-4 p-4 rounded-lg overflow-hidden ${
                      isDarkMode 
                        ? 'bg-gray-700 border border-gray-600' 
                        : 'bg-blue-50 border border-blue-100'
                    }`}
                  >
                    <motion.h3 
                      variants={formItemVariants}
                      className={`font-semibold mb-3 flex items-center ${
                        isDarkMode ? 'text-blue-300' : 'text-blue-700'
                      }`}
                    >
                      <FaVideo className="mr-2" />
                      {getFormTitle()}
                    </motion.h3>
                    
                    <form onSubmit={handleAddCctv}>
                      <motion.div variants={formItemVariants} className="mb-3">
                        <label className={`block text-sm font-medium mb-1 ${
                          isDarkMode ? 'text-gray-300' : 'text-gray-700'
                        }`}>
                          CCTV Name
                        </label>
                        <input
                          type="text"
                          placeholder="Enter CCTV name"
                          className={`w-full p-2 rounded-lg border ${
                            isDarkMode 
                              ? 'bg-gray-800 border-gray-600 text-white placeholder-gray-500' 
                              : 'bg-white border-gray-300 text-black placeholder-gray-400'
                          } focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                          value={newCctv.name}
                          onChange={(e) => setNewCctv(prev => ({ ...prev, name: e.target.value }))}
                          required
                        />
                      </motion.div>

                      <motion.div variants={formItemVariants} className="mb-3">
                        <label className={`block text-sm font-medium mb-1 ${
                          isDarkMode ? 'text-gray-300' : 'text-gray-700'
                        }`}>
                          Description
                        </label>
                        <textarea
                          placeholder="Enter description"
                          className={`w-full p-2 rounded-lg border ${
                            isDarkMode 
                              ? 'bg-gray-800 border-gray-600 text-white placeholder-gray-500' 
                              : 'bg-white border-gray-300 text-black placeholder-gray-400'
                          } focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                          value={newCctv.description}
                          onChange={(e) => setNewCctv(prev => ({ ...prev, description: e.target.value }))}
                          required
                        />
                      </motion.div>

                      <motion.div variants={formItemVariants} className="mb-3 grid grid-cols-2 gap-2">
                        <div>
                          <label className={`block text-sm font-medium mb-1 ${
                            isDarkMode ? 'text-gray-300' : 'text-gray-700'
                          }`}>
                            Latitude
                          </label>
                          <div className="flex">
                            <span className={`inline-flex items-center px-3 rounded-l-md border border-r-0 ${
                              isDarkMode 
                                ? 'bg-gray-700 border-gray-600 text-gray-300' 
                                : 'bg-gray-50 border-gray-300 text-gray-500'
                            }`}>
                              <FaMapMarkerAlt />
                            </span>
                            <input
                              type="text"
                              placeholder="Click on map"
                              className={`flex-1 rounded-r-md border ${
                                isDarkMode 
                                  ? 'bg-gray-800 border-gray-600 text-white placeholder-gray-500' 
                                  : 'bg-white border-gray-300 text-black placeholder-gray-400'
                              } focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                              value={newCctv.latitude}
                              onChange={(e) => setNewCctv(prev => ({ ...prev, latitude: e.target.value }))}
                              readOnly
                            />
                          </div>
                        </div>
                        <div>
                          <label className={`block text-sm font-medium mb-1 ${
                            isDarkMode ? 'text-gray-300' : 'text-gray-700'
                          }`}>
                            Longitude
                          </label>
                          <div className="flex">
                            <span className={`inline-flex items-center px-3 rounded-l-md border border-r-0 ${
                              isDarkMode 
                                ? 'bg-gray-700 border-gray-600 text-gray-300' 
                                : 'bg-gray-50 border-gray-300 text-gray-500'
                            }`}>
                              <FaMapMarkerAlt />
                            </span>
                            <input
                              type="text"
                              placeholder="Click on map"
                              className={`flex-1 rounded-r-md border ${
                                isDarkMode 
                                  ? 'bg-gray-800 border-gray-600 text-white placeholder-gray-500' 
                                  : 'bg-white border-gray-300 text-black placeholder-gray-400'
                              } focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                              value={newCctv.longitude}
                              onChange={(e) => setNewCctv(prev => ({ ...prev, longitude: e.target.value }))}
                              readOnly
                            />
                          </div>
                        </div>
                      </motion.div>

                      {isEditing && (
                        <motion.div variants={formItemVariants} className="mb-3">
                          <motion.button
                            variants={buttonVariants}
                            whileHover="hover"
                            whileTap="tap"
                            type="button"
                            onClick={toggleMarkerMovement}
                            className={`w-full py-2 text-white rounded-lg ${
                              canMoveMarker 
                              ? isDarkMode ? 'bg-yellow-600' : 'bg-yellow-500' 
                              : isDarkMode ? 'bg-blue-600' : 'bg-blue-500'
                            }`}
                          >
                            {canMoveMarker ? 'Lock Marker Location' : 'Move Marker Location'}
                          </motion.button>
                        </motion.div>
                      )}

                      <motion.div variants={formItemVariants} className="flex justify-end gap-2 mt-4">
                        <motion.button
                          variants={buttonVariants}
                          whileHover="hover"
                          whileTap="tap"
                          type="button"
                          onClick={resetForm}
                          className={`px-4 py-2 rounded-lg ${
                            isDarkMode 
                              ? 'bg-gray-600 hover:bg-gray-500 text-white' 
                              : 'bg-gray-200 hover:bg-gray-300 text-gray-800'
                          }`}
                        >
                          Cancel
                        </motion.button>
                        <motion.button
                          variants={buttonVariants}
                          whileHover="hover"
                          whileTap="tap"
                          type="submit"
                          disabled={loading}
                          className={`px-4 py-2 rounded-lg ${
                            isDarkMode 
                              ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                              : 'bg-blue-500 hover:bg-blue-600 text-white'
                          } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                          {loading ? (
                            <span className="flex items-center">
                              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                              </svg>
                              Processing...
                            </span>
                          ) : (
                            getSaveButtonText()
                          )}
                        </motion.button>
                      </motion.div>
                    </form>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* CCTV Locations Table */}
              <div className={`flex-1 overflow-hidden rounded-lg border ${
                isDarkMode ? 'border-gray-700' : 'border-gray-200'
              }`}>
                <div className={`overflow-y-auto h-[calc(100vh-350px)] md:h-[calc(90vh-210px)] ${
                  isDarkMode 
                    ? 'scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-800' 
                    : 'scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100'
                }`}>
                  {loading && !filteredCctvLocations.length ? (
                    <div className={`flex justify-center items-center h-32 ${
                      isDarkMode ? 'text-gray-400' : 'text-gray-500'
                    }`}>
                      <svg className="animate-spin h-8 w-8" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                    </div>
                  ) : filteredCctvLocations.length === 0 ? (
                    <div className={`p-8 text-center ${
                      isDarkMode ? 'text-gray-400' : 'text-gray-500'
                    }`}>
                      <FaVideo className="mx-auto h-12 w-12 mb-4 opacity-30" />
                      <p>No CCTV locations found</p>
                      {searchTerm && <p className="mt-2 text-sm">Try changing your search term</p>}
                    </div>
                  ) : (
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className={isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}>
                        <tr>
                          <th scope="col" className={`px-4 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                            isDarkMode ? 'text-gray-400' : 'text-gray-500'
                          }`}>
                            Name
                          </th>
                          <th scope="col" className={`px-4 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                            isDarkMode ? 'text-gray-400' : 'text-gray-500'
                          }`}>
                            Description
                          </th>
                          <th scope="col" className={`px-4 py-3 text-center text-xs font-medium uppercase tracking-wider ${
                            isDarkMode ? 'text-gray-400' : 'text-gray-500'
                          }`}>
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className={`divide-y ${
                        isDarkMode ? 'divide-gray-700' : 'divide-gray-200'
                      }`}>
                        {filteredCctvLocations.map((cctv, index) => (
                          <motion.tr 
                            key={cctv._id}
                            custom={index}
                            variants={tableRowVariants}
                            initial="hidden"
                            animate="visible"
                            whileHover="hover"
                            className={isDarkMode ? 'text-gray-300' : 'text-gray-800'}
                          >
                            <td className="px-4 py-3">
                              <div className="flex items-center">
                                <div className={`flex-shrink-0 h-8 w-8 rounded-full flex items-center justify-center ${
                                  isDarkMode ? 'bg-blue-900 text-blue-300' : 'bg-blue-100 text-blue-600'
                                }`}>
                                  <FaVideo />
                                </div>
                                <div className="ml-3 truncate max-w-[120px]">
                                  {cctv.name}
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-3 truncate max-w-[140px]">{cctv.description}</td>
                            <td className="px-4 py-3 text-center">
                              <div className="flex justify-center gap-2">
                                <motion.button
                                  variants={buttonVariants}
                                  whileHover="hover"
                                  whileTap="tap"
                                  onClick={() => handleEditCctv(cctv)}
                                  className={`p-1.5 rounded-full ${
                                    isDarkMode 
                                      ? 'bg-blue-900 hover:bg-blue-800 text-blue-300' 
                                      : 'bg-blue-100 hover:bg-blue-200 text-blue-700'
                                  }`}
                                  title="Edit"
                                >
                                  <FaEdit className="h-3.5 w-3.5" />
                                </motion.button>
                                <motion.button
                                  variants={buttonVariants}
                                  whileHover="hover"
                                  whileTap="tap"
                                  onClick={() => handleDeleteCctv(cctv._id)}
                                  className={`p-1.5 rounded-full ${
                                    isDarkMode 
                                      ? 'bg-red-900 hover:bg-red-800 text-red-300' 
                                      : 'bg-red-100 hover:bg-red-200 text-red-700'
                                  }`}
                                  title="Delete"
                                >
                                  <FaTrash className="h-3.5 w-3.5" />
                                </motion.button>
                              </div>
                            </td>
                          </motion.tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Confirmation Dialog */}
          <AnimatePresence>
            {showConfirmDialog && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[4000] flex items-center justify-center p-4 bg-black bg-opacity-50"
              >
                <motion.div
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.9, opacity: 0 }}
                  className={`max-w-sm p-6 rounded-lg shadow-xl ${
                    isDarkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-800'
                  }`}
                >
                  <h3 className="text-lg font-medium mb-4">Confirm Action</h3>
                  <p className="mb-6">
                    {isEditing ? 
                      "Are you sure you want to update this CCTV location?" :
                      isAddingCctv ? 
                        "Are you sure you want to save this CCTV location?" :
                        "Are you sure you want to delete this CCTV location?"
                    }
                  </p>
                  <div className="flex justify-end gap-4">
                    <motion.button
                      variants={buttonVariants}
                      whileHover="hover"
                      whileTap="tap"
                      onClick={() => setShowConfirmDialog(false)}
                      className={`px-4 py-2 rounded-lg ${
                        isDarkMode 
                          ? 'bg-gray-700 hover:bg-gray-600 text-gray-300' 
                          : 'bg-gray-200 hover:bg-gray-300 text-gray-800'
                      }`}
                    >
                      Cancel
                    </motion.button>
                    <motion.button
                      variants={buttonVariants}
                      whileHover="hover"
                      whileTap="tap"
                      onClick={confirmAction}
                      className={`px-4 py-2 rounded-lg ${
                        (isEditing || isAddingCctv) ?
                          (isDarkMode 
                            ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                            : 'bg-blue-500 hover:bg-blue-600 text-white') :
                          (isDarkMode 
                            ? 'bg-red-600 hover:bg-red-700 text-white' 
                            : 'bg-red-500 hover:bg-red-600 text-white')
                      }`}
                    >
                      Confirm
                    </motion.button>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default CctvLocationModal;

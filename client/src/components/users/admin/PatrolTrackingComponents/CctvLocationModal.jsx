import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import axios from 'axios';
import { toast } from 'react-toastify';
import { FaPlus, FaTrash, FaEdit } from 'react-icons/fa';
import { BiCctv } from 'react-icons/bi'; // Change to BiCctv from react-icons/bi

// Update the marker creation function
const createCctvMarker = (isNew = false) => {
  const color = isNew ? '#22c55e' : '#3b82f6'; // green-500 for new, blue-500 for existing
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

  // Function to fetch CCTV locations from backend
  const fetchCctvLocations = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${process.env.REACT_APP_API_URL}/cctv-locations`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setCctvLocations(response.data);
    } catch (error) {
      console.error('Error fetching CCTV locations:', error);
      toast.error('Failed to load CCTV locations');
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

    const toastId = toast.info(
      <div>
        <p>Are you sure you want to save this CCTV location?</p>
        <div className="mt-2 flex justify-end gap-2">
          <button
            onClick={() => {
              handleConfirmSave();
              toast.dismiss(toastId);
            }}
            className="px-2 py-1 bg-green-500 text-white rounded hover:bg-green-600"
          >
            Confirm
          </button>
          <button
            onClick={() => toast.dismiss(toastId)}
            className="px-2 py-1 bg-gray-500 text-white rounded hover:bg-gray-600"
          >
            Cancel
          </button>
        </div>
      </div>,
      {
        autoClose: false,
        closeButton: false,
        closeOnClick: false,
        draggable: false,
      }
    );
  };

  // Add confirm save handler
  const handleConfirmSave = async () => {
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
      setIsAddingCctv(false);
      setIsEditing(false);
      setEditingCctv(null);
      setNewCctv({ name: '', description: '', latitude: '', longitude: '' });
      fetchCctvLocations();
    } catch (error) {
      console.error('Error saving CCTV location:', error);
      toast.error(isEditing ? 'Failed to update CCTV location' : 'Failed to add CCTV location');
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
    const toastId = toast.info(
      <div>
        <p>Are you sure you want to delete this CCTV location?</p>
        <div className="mt-2 flex justify-end gap-2">
          <button
            onClick={() => {
              handleConfirmDelete(id);
              toast.dismiss(toastId);
            }}
            className="px-2 py-1 bg-red-500 text-white rounded hover:bg-red-600"
          >
            Delete
          </button>
          <button
            onClick={() => toast.dismiss(toastId)}
            className="px-2 py-1 bg-gray-500 text-white rounded hover:bg-gray-600"
          >
            Cancel
          </button>
        </div>
      </div>,
      {
        autoClose: false,
        closeButton: false,
        closeOnClick: false,
        draggable: false,
      }
    );
  };

  // Add confirm delete handler
  const handleConfirmDelete = async (id) => {
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
    }
  };

  // Update the form title and button text based on mode
  const getFormTitle = () => isEditing ? 'Edit CCTV' : 'Add New CCTV';
  const getSaveButtonText = () => isEditing ? 'Update' : 'Save';

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[3000]">
      <div className="bg-white p-6 rounded-lg w-11/12 max-w-7xl h-[80vh] flex gap-4 TopNav">
        {/* Left side - Map */}
        <div className="w-2/3 h-full relative">
          <MapContainer
            center={[14.7356, 121.0498]}
            zoom={13}
            style={{ height: '100%', width: '100%' }}
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
                icon={createCctvMarker(isEditing && editingCctv?._id === cctv._id)}
              />
            ))}
            {/* Display new CCTV marker when adding */}
            {isAddingCctv && newCctv.latitude && newCctv.longitude && (
              <Marker
                position={[newCctv.latitude, newCctv.longitude]}
                icon={createCctvMarker(true)}
              />
            )}
          </MapContainer>
        </div>

        {/* Right side - Controls and Table */}
        <div className="w-1/3 h-full flex flex-col">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold">CCTV Locations</h2>
            <button
              onClick={onClose}
              className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600"
            >
              Close
            </button>
          </div>

          {/* Add CCTV Button and Form */}
          <div className="mb-4">
            {!isAddingCctv && !isEditing ? (
              <button
                onClick={() => setIsAddingCctv(true)}
                className="bg-blue-500 text-white px-4 py-2 rounded flex items-center gap-2 hover:bg-blue-600"
              >
                <FaPlus /> Add CCTV
              </button>
            ) : (
              <form onSubmit={handleAddCctv} className="bg-gray-50 p-4 rounded-lg TopNav">
                <h3 className="font-semibold mb-2">{getFormTitle()}</h3>
                <div className="space-y-3">
                  <input
                    type="text"
                    placeholder="CCTV Name"
                    className="w-full p-2 border rounded text-black"
                    value={newCctv.name}
                    onChange={(e) => setNewCctv(prev => ({ ...prev, name: e.target.value }))}
                    required
                  />
                  <textarea
                    placeholder="Description"
                    className="w-full p-2 border rounded text-black"
                    value={newCctv.description}
                    onChange={(e) => setNewCctv(prev => ({ ...prev, description: e.target.value }))}
                    required
                  />
                  <p className="text-sm text-gray-600">Click on the map to set location</p>
                  <div className="flex gap-2">
                    <button
                      type="submit"
                      className="bg-green-500 text-white px-3 py-1 rounded hover:bg-green-600"
                    >
                      {getSaveButtonText()}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setIsAddingCctv(false);
                        setIsEditing(false);
                        setEditingCctv(null);
                        setNewCctv({ name: '', description: '', latitude: '', longitude: '' });
                      }}
                      className="bg-gray-500 text-white px-3 py-1 rounded hover:bg-gray-600"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
                {isEditing && (
                  <div className="mt-2 mb-4">
                    <button
                      type="button"
                      onClick={toggleMarkerMovement}
                      className={`w-full py-2 text-white rounded ${
                        canMoveMarker 
                        ? 'bg-yellow-500 hover:bg-yellow-600' 
                        : 'bg-blue-500 hover:bg-blue-600'
                      }`}
                    >
                      {canMoveMarker ? 'Lock Marker Location' : 'Move Marker Location'}
                    </button>
                  </div>
                )}
              </form>
            )}
          </div>

          {/* CCTV Table - Update the table container */}
          <div className="flex-1 overflow-hidden bg-gray-50 rounded-lg">
            <div className="overflow-y-auto h-full" style={{ maxHeight: 'calc(100vh - 400px)' }}>
              <table className="min-w-full">
                <thead className="bg-gray-100 TopNav sticky top-0 z-10">
                  <tr>
                    <th className="px-4 py-2 text-left">Name</th>
                    <th className="px-4 py-2 text-left">Description</th>
                    <th className="px-4 py-2 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className='text-black'>
                  {cctvLocations.length === 0 ? (
                    <tr>
                      <td colSpan="3" className="px-4 py-2 text-center text-gray-500">
                        No CCTV locations found
                      </td>
                    </tr>
                  ) : (
                    cctvLocations.map((cctv) => (
                      <tr key={cctv._id} className="border-b">
                        <td className="px-4 py-2">{cctv.name}</td>
                        <td className="px-4 py-2">{cctv.description}</td>
                        <td className="px-4 py-2 text-center">
                          <div className="flex justify-center gap-2">
                            <button
                              onClick={() => handleEditCctv(cctv)}
                              className="text-blue-500 hover:text-blue-700"
                              title="Edit"
                            >
                              <FaEdit />
                            </button>
                            <button
                              onClick={() => handleDeleteCctv(cctv._id)}
                              className="text-red-500 hover:text-red-700"
                              title="Delete"
                            >
                              <FaTrash />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const MapComponent = ({ incident }) => {
  const map = useMap();
  const layerGroupRef = useRef(null);

  useEffect(() => {
    // Create a new layer group if it doesn't exist
    if (!layerGroupRef.current) {
      layerGroupRef.current = L.layerGroup().addTo(map);
    }

    return () => {
      if (layerGroupRef.current) {
        layerGroupRef.current.clearLayers();
        map.removeLayer(layerGroupRef.current);
      }
    };
  }, [map]);

  // ... rest of the component code ...
};

export default CctvLocationModal;

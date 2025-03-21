import React, { useState, useRef, useEffect } from 'react';
import { toast } from 'react-toastify';
import { MapContainer, TileLayer, Marker, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import axios from 'axios';

// Map component to handle marker creation and updates
const MapComponent = ({ incident }) => {
  const map = useMap();
  const markerRef = useRef(null);

  React.useEffect(() => {
    if (incident) {
      const match = incident.location.match(/Lat:\s*([0-9.-]+),\s*Lon:\s*([0-9.-]+)/);
      if (match) {
        const [_, lat, lng] = match.map(Number);
        
        // Use the same marker style as PatrolTracking.jsx
        const icon = L.divIcon({
          className: 'custom-icon',
          html: `<div style="position: relative; width: 36px; height: 36px;">
                  <div style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; 
                       border-radius: 50%; 
                       background-color: ${incident.incidentClassification === 'Emergency Incident' ? 'rgba(255, 0, 0, 0.5)' : 'rgba(0, 0, 255, 0.5)'}; 
                       animation: pulse 1.5s infinite;"></div>
                  <div style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; 
                       display: flex; align-items: center; justify-content: center;">
                    ${incident.incidentClassification === 'Emergency Incident'
                      ? '<i class="fas fa-exclamation-triangle" style="color: red; font-size: 20px;"></i>'
                      : '<i class="fas fa-info-circle" style="color: blue; font-size: 20px;"></i>'}
                  </div>
                </div>
                <style>
                  @keyframes pulse {
                    0% { transform: scale(0.5); opacity: 1; }
                    100% { transform: scale(2); opacity: 0; }
                  }
                </style>`,
          iconSize: [36, 36],
          iconAnchor: [18, 18]
        });

        // Remove existing marker if any
        if (markerRef.current) {
          markerRef.current.remove();
        }

        // Create and add new marker
        const marker = L.marker([lat, lng], { icon }).addTo(map);
        markerRef.current = marker;

        // Center map on marker
        map.setView([lat, lng], 15);
      }
    }

    // Cleanup on unmount
    return () => {
      if (markerRef.current) {
        markerRef.current.remove();
      }
    };
  }, [incident, map]);

  return null;
};

const ResolvedIncidentsModal = ({ isOpen, onClose, resolvedIncidents }) => {
  const [selectedIncident, setSelectedIncident] = useState(null);
  const [showDetails, setShowDetails] = useState(false);
  const [showMap, setShowMap] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [assistanceRequests, setAssistanceRequests] = useState({});
  const [showAssistanceDetails, setShowAssistanceDetails] = useState(false);
  const [selectedAssistance, setSelectedAssistance] = useState(null);
  const [friendlyLocation, setFriendlyLocation] = useState('');

  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  const handleViewDetails = (incident) => {
    if (selectedIncident?._id === incident._id && showDetails) {
      // If clicking on the same incident and details are shown, hide them
      setShowDetails(false);
      setSelectedIncident(null);
    } else {
      // Show details for the selected incident
      setSelectedIncident(incident);
      setShowDetails(true);
      setShowMap(false);
    }
  };

  const handleViewLocation = (incident) => {
    const latLngMatch = incident.location.match(/Lat:\s*([0-9.-]+),\s*Lon:\s*([0-9.-]+)/);
    if (!latLngMatch) {
      toast.warning(
        <div>
          <p>Cannot display location on map</p>
          <p className="text-sm mt-1">Location provided: {incident.location}</p>
          <p className="text-sm mt-1">Exact coordinates are required to show on map</p>
        </div>,
        { autoClose: 5000, icon: '📍' }
      );
      return;
    }

    if (selectedIncident?._id === incident._id && showMap) {
      // If clicking on the same incident and map is shown, hide it
      setShowMap(false);
      setSelectedIncident(null);
    } else {
      // Show map for the selected incident
      setSelectedIncident(incident);
      setShowMap(true);
      setShowDetails(false);
    }
  };

  // Add this new function to filter incidents
  const filteredIncidents = resolvedIncidents.filter(incident => {
    const matchesSearch = incident.type.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDate = dateFilter ? formatDate(incident.date) === formatDate(dateFilter) : true;
    const matchesType = typeFilter === 'all' ? true : 
      typeFilter === 'emergency' ? incident.incidentClassification === 'Emergency Incident' : 
      incident.incidentClassification !== 'Emergency Incident';
    
    return matchesSearch && matchesDate && matchesType;
  });

  const handleClose = () => {
    setShowDetails(false);
    setShowMap(false);
    setSelectedIncident(null);
    onClose();
  };

  const fetchAssistanceRequests = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `${process.env.REACT_APP_API_URL}/assistance-requests`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const requests = {};
      response.data.forEach(request => {
        const incidentId = request.incidentId._id || request.incidentId;
        requests[incidentId] = request;
      });
      setAssistanceRequests(requests);
    } catch (error) {
      console.error('Error fetching assistance requests:', error);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchAssistanceRequests();
    }
  }, [isOpen]);

  const reverseGeocode = async (location) => {
    const latLngMatch = location.match(/Lat:\s*([0-9.-]+),\s*Lon:\s*([0-9.-]+)/);
    if (latLngMatch) {
      const [, latitude, longitude] = latLngMatch;
      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&addressdetails=1`
        );
        const data = await response.json();
        return data.display_name;
      } catch (error) {
        console.error("Error getting location details:", error);
        return location;
      }
    }
    return location;
  };

  useEffect(() => {
    const getFriendlyLocation = async () => {
      if (selectedIncident?.location) {
        const friendly = await reverseGeocode(selectedIncident.location);
        setFriendlyLocation(friendly);
      }
    };
    getFriendlyLocation();
  }, [selectedIncident]);

  const renderAssistanceStatus = (status) => {
    const statusColors = {
      'Pending': 'text-yellow-500',
      'Processing': 'text-blue-500',
      'Deployed': 'text-indigo-500',
      'Rejected': 'text-red-500',
      'Completed': 'text-green-500'
    };
    return statusColors[status] || 'text-gray-500';
  };

  const AssistanceDetailsModal = ({ details, onClose }) => {
    const renderStatusContent = () => {
      switch (details.status) {
        case 'Rejected':
          return (
            <div>
              <h4 className="font-semibold mb-2">Rejection Details</h4>
              {details.rejectedDetails?.map((detail, index) => (
                <div key={index} className="bg-red-50 p-3 rounded-lg mb-3 border border-red-200">
                  <p><strong>Department:</strong> {detail.department}</p>
                  <p><strong>Rejected By:</strong> {detail.rejectorName}</p>
                  <p><strong>Date/Time:</strong> {new Date(detail.rejectedDateTime).toLocaleString()}</p>
                  <p><strong>Reason:</strong> {detail.reason}</p>
                  <p><strong>Notes:</strong> {detail.notes || 'N/A'}</p>
                </div>
              ))}
            </div>
          );

        case 'Processing':
        case 'Deployed':
        case 'Completed':
          return (
            <>
              <div>
                <h4 className="font-semibold mb-2">Approval History</h4>
                {details.approvedDetails?.map((detail, index) => (
                  <div key={index} className="bg-blue-50 p-3 rounded-lg mb-3 border border-blue-200">
                    <p><strong>Department:</strong> {detail.department}</p>
                    <p><strong>Approved By:</strong> {detail.approverName}</p>
                    <p><strong>Date/Time:</strong> {new Date(detail.approvedDateTime).toLocaleString()}</p>
                    <p><strong>Notes:</strong> {detail.notes || 'N/A'}</p>
                  </div>
                ))}
              </div>
              {details.responderDetails?.length > 0 && (
                <div className="mt-4">
                  <h4 className="font-semibold mb-2">Responder Details</h4>
                  {details.responderDetails.map((responder, index) => (
                    <div key={index} className="bg-green-50 p-3 rounded-lg mb-3 border border-green-200">
                      <p><strong>Department:</strong> {responder.department}</p>
                      <p><strong>Responder Name:</strong> {responder.responderName}</p>
                      <p><strong>Contact:</strong> {responder.responderContact || 'N/A'}</p>
                      <p><strong>Address:</strong> {responder.responderAddress || 'N/A'}</p>
                      <p><strong>Type:</strong> {responder.responderType || 'N/A'}</p>
                      <p><strong>Response Time:</strong> {new Date(responder.responseDateTime).toLocaleString()}</p>
                    </div>
                  ))}
                </div>
              )}
            </>
          );

        default:
          return null;
      }
    };

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 z-[4000] flex items-center justify-center">
        <div className="bg-white p-6 rounded-lg w-11/12 max-w-lg relative">
          <h3 className="text-xl font-bold mb-4">Assistance Request Details</h3>
          <button onClick={onClose} className="absolute top-2 right-2 text-gray-600 hover:text-gray-800">✕</button>
          <div className="space-y-4">
            <p className="font-semibold text-lg">
              Status: <span className={renderAssistanceStatus(details.status)}>{details.status}</span>
            </p>
            {renderStatusContent()}
          </div>
        </div>
      </div>
    );
  };

  const renderIncidentDetails = () => {
    if (!selectedIncident) return null;

    const assistanceRequest = assistanceRequests[selectedIncident._id];

    return (
      <div className="w-1/2 pl-6">
        <div className="bg-blue-50 p-4 rounded-lg h-full text-black">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-bold text-blue-700">Incident Details</h3>
            <button
              onClick={() => setShowDetails(false)}
              className="text-gray-500 hover:text-gray-700"
            >
              ✕
            </button>
          </div>
          <div className="space-y-3 text-sm">
            <p><strong className="text-gray-700">Incident:</strong> {selectedIncident.type}</p>
            <p>
              <strong className="text-gray-700">Type:</strong>
              <span className={`ml-2 ${
                selectedIncident.incidentClassification === 'Emergency Incident' 
                ? 'text-red-500 font-semibold' 
                : 'text-blue-500'
              }`}>
                {selectedIncident.incidentClassification || 'Normal Incident'}
              </span>
            </p>
            <p><strong className="text-gray-700">Status:</strong> 
              <span className="ml-2 text-green-600 font-semibold">
                {selectedIncident.status}
              </span>
            </p>
            <p><strong className="text-gray-700">Date:</strong> {formatDate(selectedIncident.date)}</p>
            <p><strong className="text-gray-700">Time:</strong> {selectedIncident.time || 'N/A'}</p>
            <p><strong className="text-gray-700">Location:</strong> {' '}
              {friendlyLocation}
              {friendlyLocation !== selectedIncident.location && (
                <span className="block text-gray-500 text-xs mt-1">
                  ({selectedIncident.location})
                </span>
              )}
            </p>
            <p><strong className="text-gray-700">Location Note:</strong> {selectedIncident.locationNote || 'N/A'}</p>
            <div>
              <strong className="text-gray-700">Description:</strong>
              <p className="mt-1 p-2 bg-white rounded">{selectedIncident.description || 'N/A'}</p>
            </div>
            <div className="mt-6 pt-4 px-2 py-1 bg-green-50 border-t border-gray-200 rounded-xl">
              <h4 className="font-semibold text-green-700 mb-2">Resolution Information</h4>
              <p><strong className="text-gray-700">Resolved By:</strong> {selectedIncident.resolvedByFullName}</p>
              <p><strong className="text-gray-700">Resolved At:</strong> {new Date(selectedIncident.resolvedAt).toLocaleString()}</p>
              <div className="mt-2">
                <strong className="text-gray-700">Resolution Log:</strong>
                <p className="mt-1 p-2 bg-white rounded border border-gray-200">
                  {selectedIncident.log || 'No log provided'}
                </p>
              </div>
            </div>
            {assistanceRequest && (
              <div className="mt-4 pt-4 border-t border-gray-200">
                <h4 className="font-semibold text-blue-700 mb-2">Assistance Request</h4>
                <div className="flex items-center justify-between">
                  <p className={`font-medium ${renderAssistanceStatus(assistanceRequest.status)}`}>
                    Status: {assistanceRequest.status}
                  </p>
                  <button
                    onClick={() => {
                      setSelectedAssistance(assistanceRequest);
                      setShowAssistanceDetails(true);
                    }}
                    className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600"
                  >
                    View Details
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[3000]">
      <div className="bg-white p-6 rounded-lg w-11/12 max-w-7xl TopNav flex">
        {/* Left side - Table */}
        <div className={`${(showDetails || showMap) ? 'w-1/2' : 'w-full'} transition-all duration-300`}>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold">Resolved Incidents</h2>
            <button
              onClick={handleClose}
              className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600"
            >
              Close
            </button>
          </div>

          {/* Modified Search and Filter Controls */}
          <div className="mb-4 flex justify-end items-center space-x-3">
            <input
              type="text"
              placeholder="Search incidents..."
              className="w-48 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <input
              type="date"
              className="w-40 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
            />
            <select
              className="w-32 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
            >
              <option value="all">All Types</option>
              <option value="emergency">Emergency</option>
              <option value="normal">Normal</option>
            </select>
            <button
              onClick={() => {
                setSearchTerm('');
                setDateFilter('');
                setTypeFilter('all');
              }}
              className="px-3 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 whitespace-nowrap"
            >
              Clear Filters
            </button>
          </div>
          
          {/* Modified table container with fixed height */}
          <div className="overflow-x-auto" style={{ 
            maxHeight: filteredIncidents.length > 5 ? '400px' : 'auto',
            overflowY: filteredIncidents.length > 5 ? 'auto' : 'hidden' 
          }}>
            <table className="min-w-full bg-white">
              <thead className="bg-gray-50 TopNav">
                <tr>
                  <th className="px-4 py-2 text-center">Date</th>
                  <th className="px-4 py-2 text-center">Incident</th>
                  <th className="px-4 py-2 text-center">Incident Type</th>
                  <th className="px-4 py-2 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className='text-black'>
                {filteredIncidents.length > 0 ? (
                  filteredIncidents.map((incident) => (
                    <tr key={incident._id} 
                        className={`border-b hover:bg-gray-50 ${
                          selectedIncident?._id === incident._id ? 'bg-blue-50' : ''
                        }`}>
                      <td className="px-4 py-2 text-center">{formatDate(incident.date)}</td>
                      <td className="px-4 py-2 text-center">{incident.type}</td>
                      <td className="px-4 py-2 text-center">
                        <span className={incident.incidentClassification === 'Emergency Incident' ? 'text-red-500 font-semibold' : 'text-blue-500'}>
                          {incident.incidentClassification || 'Normal Incident'}
                        </span>
                      </td>
                      <td className="px-4 py-2">
                        <div className="flex justify-center space-x-2">
                          <button
                            onClick={() => handleViewDetails(incident)}
                            className={`${
                              selectedIncident?._id === incident._id && showDetails
                                ? 'bg-red-500 hover:bg-red-600'
                                : 'bg-blue-500 hover:bg-blue-600'
                            } text-white px-3 py-1 rounded`}
                          >
                            {selectedIncident?._id === incident._id && showDetails ? 'Hide Details' : 'View Details'}
                          </button>
                          <button
                            onClick={() => handleViewLocation(incident)}
                            className={`${
                              selectedIncident?._id === incident._id && showMap
                                ? 'bg-red-500 hover:bg-red-600'
                                : 'bg-green-500 hover:bg-green-600'
                            } text-white px-3 py-1 rounded`}
                          >
                            {selectedIncident?._id === incident._id && showMap ? 'Hide Location' : 'View Location'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="4" className="px-4 py-2 text-center">
                      No resolved incidents found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right side - Details Panel */}
        {showDetails && selectedIncident && renderIncidentDetails()}

        {/* Right side - Map Panel */}
        {showMap && selectedIncident && (
          <div className="w-1/2 pl-6">
            <div className="bg-gray-50 p-4 rounded-lg h-full">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold text-green-700">Incident Location</h3>
                <button
                  onClick={() => setShowMap(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ✕
                </button>
              </div>
              <div className="h-[500px] rounded-lg overflow-hidden">
                <MapContainer
                  center={[14.7356, 121.0498]}
                  zoom={15}
                  style={{ height: '100%', width: '100%' }}
                >
                  <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                  <MapComponent incident={selectedIncident} />
                </MapContainer>
              </div>
            </div>
          </div>
        )}
      </div>
      {showAssistanceDetails && selectedAssistance && (
        <AssistanceDetailsModal
          details={selectedAssistance}
          onClose={() => setShowAssistanceDetails(false)}
        />
      )}
    </div>
  );
};

export default ResolvedIncidentsModal;

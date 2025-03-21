import React, { useEffect, useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import L from 'leaflet'; // Add this import

const ViewReportedIncidents = ({ 
  setShowReportedIncidents, 
  setIncidentLocations, 
  incidentReports,
  setShowReportIncident,
  setSelectedIncidentForResponse
}) => {
  const [incidentLog, setIncidentLog] = useState([]);
  const [selectedIncidentState, setSelectedIncidentState] = useState(null);
  const [visibleLocations, setVisibleLocations] = useState(() => {
    const saved = localStorage.getItem('visibleIncidentLocations');
    return saved ? JSON.parse(saved) : {};
  });
  const [showAllLocations, setShowAllLocations] = useState(
    JSON.parse(localStorage.getItem('showAllLocations')) || false
  );
  const [hasActiveResponse, setHasActiveResponse] = useState(false);

  const fetchIncidentReports = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      toast.error('Please log in.');
      return;
    }

    try {
      const response = await axios.get(`${process.env.REACT_APP_API_URL}/incident-reports`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      // Filter out resolved incidents
      const activeIncidents = response.data.filter(incident => incident.status !== 'Resolved');
      setIncidentLog(activeIncidents);
    } catch (error) {
      console.error('Error fetching incident reports:', error);
      toast.error('Failed to load incident reports.');
    }
  };

  const checkActiveResponse = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      const response = await axios.get(
        `${process.env.REACT_APP_API_URL}/incident-reports`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const hasInProgress = response.data.some(incident => incident.status === 'In Progress');
      setHasActiveResponse(hasInProgress);
    } catch (error) {
      console.error('Error checking active responses:', error);
    }
  };

  useEffect(() => {
    fetchIncidentReports();
    checkActiveResponse();
  }, []);

  useEffect(() => {
    localStorage.setItem('visibleIncidentLocations', JSON.stringify(visibleLocations));
  }, [visibleLocations]);

  useEffect(() => {
    const savedLocations = localStorage.getItem('visibleIncidentLocations');
    if (savedLocations) {
      const parsedLocations = JSON.parse(savedLocations);
      setVisibleLocations(parsedLocations);
      setIncidentLocations(parsedLocations);
    }
  }, []);

  useEffect(() => {
    if (showAllLocations) {
      const allLocations = {};
      incidentReports
        // Filter out resolved incidents before showing locations
        .filter(incident => incident.status !== 'Resolved')
        .forEach(incident => {
          allLocations[incident._id] = {
            location: incident.location,
            type: incident.incidentClassification === 'Emergency Incident' ? 'Emergency' : 'Normal'
          };
        });
      setVisibleLocations(allLocations);
      setIncidentLocations(allLocations);
      localStorage.setItem('visibleIncidentLocations', JSON.stringify(allLocations));
    }
  }, [showAllLocations, incidentReports]);

  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  const handleViewDetails = (incident) => {
    setSelectedIncidentState(incident);
  };

  const handleCloseDetails = () => {
    setSelectedIncidentState(null);
  };

  const getIncidentType = (classification) => {
    return classification === 'Emergency Incident' ? 'Emergency' : 'Normal';
  };

  const handleToggleLocation = (incident) => {
    // Don't allow showing location if incident is resolved
    if (incident.status === 'Resolved') {
      toast.info('Location is not available for resolved incidents');
      return;
    }

    const latLngMatch = incident.location.match(/Lat:\s*([0-9.-]+),\s*Lon:\s*([0-9.-]+)/);
    if (!latLngMatch) {
      toast.warning(
        <div>
          <p>Cannot display location on map</p>
          <p className="text-sm mt-1">Location provided: {incident.location}</p>
          <p className="text-sm mt-1">Exact coordinates are required to show on map</p>
        </div>,
        {
          autoClose: 5000,
          icon: '📍'
        }
      );
      return;
    }

    setVisibleLocations((prev) => {
      const newVisibleLocations = { ...prev };
      if (newVisibleLocations[incident._id]) {
        delete newVisibleLocations[incident._id];
      } else {
        const incidentType = getIncidentType(incident.incidentClassification);
        newVisibleLocations[incident._id] = {
          location: incident.location,
          type: incidentType,
          status: incident.status
        };
      }
      setIncidentLocations(newVisibleLocations);
      return newVisibleLocations;
    });
  };

  const handleToggleAllLocations = () => {
    const newShowAllState = !showAllLocations;
    setShowAllLocations(newShowAllState);
    localStorage.setItem('showAllLocations', JSON.stringify(newShowAllState));

    if (!newShowAllState) {
      // Only handle hiding locations here
      setVisibleLocations({});
      setIncidentLocations({});
      localStorage.setItem('visibleIncidentLocations', JSON.stringify({}));
    }
  };

  const getResponseButtonState = (incident) => {
    // If incident is already resolved
    if (incident.status === 'Resolved') {
      return {
        disabled: true,
        text: 'Resolved',
        className: 'bg-gray-500 opacity-50 cursor-not-allowed'
      };
    }
    
    // If incident is in progress by another user
    if (incident.status === 'In Progress' && incident.responderName) {
      return {
        disabled: true,
        text: `Handled by: ${incident.responderName}`,
        className: 'bg-blue-500 opacity-50 cursor-not-allowed'
      };
    }

    // If user already has an active response
    if (hasActiveResponse) {
      return {
        disabled: true,
        text: 'Unavailable',
        className: 'bg-yellow-500 opacity-50 cursor-not-allowed'
      };
    }

    // Available to respond
    return {
      disabled: false,
      text: 'Respond',
      className: 'bg-yellow-500 hover:bg-yellow-600'
    };
  };

  const handleRespond = (incident) => {
    if (incident.status === 'In Progress') {
      toast.warning(`This incident is already being handled by ${incident.responderName}`);
      return;
    }

    if (hasActiveResponse) {
      toast.error('You already have an active incident response');
      return;
    }

    toast.info(
      <div>
        <p>Are you sure you want to respond to this incident?</p>
        <div className="flex justify-end mt-2">
          <button
            className="bg-green-500 text-white px-4 py-1 rounded mr-2"
            onClick={async () => {
              toast.dismiss();
              try {
                const token = localStorage.getItem('token');
                const userId = localStorage.getItem('userId');
                
                if (!token || !userId) {
                  toast.error('Authentication required');
                  return;
                }

                // Add a check for incident status before sending request
                const currentStatus = await axios.get(
                  `${process.env.REACT_APP_API_URL}/incident-reports/${incident._id}/details`,
                  { headers: { Authorization: `Bearer ${token}` } }
                );

                if (currentStatus.data.status === 'In Progress') {
                  toast.warning(`This incident is already being handled by ${currentStatus.data.responderName}`);
                  return;
                }

                const response = await axios.put(
                  `${process.env.REACT_APP_API_URL}/incident-reports/${incident._id}/status`,
                  { 
                    status: 'In Progress',
                    userId: userId
                  },
                  { 
                    headers: { 
                      Authorization: `Bearer ${token}`,
                      'Content-Type': 'application/json'
                    } 
                  }
                );

                if (response.data) {
                  const updatedIncident = response.data;
                  setSelectedIncidentForResponse(updatedIncident);
                  setHasActiveResponse(true);
                  toast.success(`You are now responding to incident: ${updatedIncident.type}`);
                  setShowReportedIncidents(false);
                  
                  // Update the incident log with the new data
                  setIncidentLog(prevLog => 
                    prevLog.map(item => 
                      item._id === incident._id ? updatedIncident : item
                    )
                  );
                }
              } catch (error) {
                console.error('Error updating incident status:', error);
                toast.error('Failed to update incident status. Please try again.');
              }
            }}
          >
            Yes
          </button>
          <button
            className="bg-red-500 text-white px-4 py-1 rounded"
            onClick={() => toast.dismiss()}
          >
            No
          </button>
        </div>
      </div>,
      {
        autoClose: false,
        closeOnClick: false,
      }
    );
  };

  const styles = `
    @keyframes pulse {
      0% { transform: scale(0.5); opacity: 1; }
      100% { transform: scale(2); opacity: 0; }
    }
  `;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center" 
         style={{ zIndex: 2000 }}>
      <style>{styles}</style>
      <div className="bg-white p-6 rounded-lg w-11/12 max-w-3xl relative TopNav">
        <h2 className="text-xl md:text-2xl font-bold mb-4 flex justify-between items-center">
          Reported Incidents
          <button
            onClick={() => setShowReportedIncidents(false)}
            className="bg-red-500 text-white px-3 py-1 rounded"
          >
            Close
          </button>
        </h2>
        <div className="mb-4">
          <button
            onClick={handleToggleAllLocations}
            className={`w-full ${showAllLocations ? 'bg-red-500' : 'bg-green-500'} text-white px-4 py-2 rounded`}
          >
            {showAllLocations ? 'Hide All Locations' : 'Show All Locations'}
          </button>
        </div>
        <div className="overflow-x-auto relative" 
             style={{ 
               maxHeight: "300px",
               overflowY: "auto",
               WebkitOverflowScrolling: "touch",
               touchAction: "pan-x pan-y",
               msOverflowStyle: "none",
               scrollbarWidth: "none"
             }}>
          <div className="min-w-full inline-block"
               onTouchMove={(e) => {
                 e.stopPropagation();
                 e.preventDefault();
               }}
               onClick={(e) => e.stopPropagation()}>
            <table className="w-full bg-white rounded-lg overflow-hidden">
              <thead className="sticky top-0 bg-white TopNav">
                <tr>
                  <th className="py-2 px-4 border-b text-center whitespace-nowrap">Incident</th>
                  <th className="py-2 px-4 border-b text-center whitespace-nowrap">Date</th>
                  <th className="py-2 px-4 border-b text-center whitespace-nowrap">Status</th>
                  <th className="py-2 px-4 border-b text-center whitespace-nowrap">Actions</th>
                </tr>
              </thead>
              <tbody className="text-black">
                {incidentLog.length > 0 ? (
                  incidentLog.map((incident) => (
                    <tr key={incident._id}>
                      <td className="py-2 px-4 border-b text-center">{incident.type}</td>
                      <td className="py-2 px-4 border-b text-center">{formatDate(incident.date)}</td>
                      <td className={`py-2 px-4 border-b text-center font-medium ${
                        incident.status === 'Pending' ? 'text-yellow-600' :
                        incident.status === 'In Progress' ? 'text-blue-600' :
                        'text-black'
                      }`}>
                        {incident.status}
                      </td>
                      <td className="py-2 px-4 border-b text-center">
                        <div className="flex flex-col sm:flex-row items-center justify-center space-y-1 sm:space-y-0 sm:space-x-1">
                          <button 
                            className="bg-blue-500 text-white px-2 py-1 rounded text-sm w-24" 
                            onClick={() => handleViewDetails(incident)}
                          >
                            View Details
                          </button>
                          <button 
                            className="bg-green-500 text-white px-2 py-1 rounded text-sm w-24" 
                            onClick={() => handleToggleLocation(incident)}
                          >
                            {visibleLocations[incident._id] ? 'Hide Location' : 'View Location'}
                          </button>
                          <button 
                            className={`text-white px-2 py-1 rounded text-sm w-24 ${getResponseButtonState(incident).className}`}
                            onClick={() => handleRespond(incident)}
                            disabled={getResponseButtonState(incident).disabled}
                            title={incident.status === 'In Progress' ? `Currently being handled by ${incident.responderName}` : ''}
                          >
                            {getResponseButtonState(incident).text}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="4" className="text-center py-4 text-sm md:text-base">
                      No reported incidents.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <style jsx>{`
          /* Hide default scrollbar */
          div::-webkit-scrollbar {
            display: none;
          }
          
          /* Custom scrollbar for non-touch devices */
          @media (hover: hover) {
            div::-webkit-scrollbar {
              display: block;
              width: 6px;
              height: 6px;
            }
            
            div::-webkit-scrollbar-track {
              background: #f1f1f1;
              border-radius: 3px;
            }
            
            div::-webkit-scrollbar-thumb {
              background: #888;
              border-radius: 3px;
            }
            
            div::-webkit-scrollbar-thumb:hover {
              background: #555;
            }
          }
        `}</style>

        {/* Incident Details Modal */}
        {selectedIncidentState && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center" style={{ zIndex: 2001 }}>
            <div className="bg-blue-50 p-6 rounded-lg w-11/12 max-w-lg relative">
              <button 
                onClick={handleCloseDetails} 
                className="absolute top-2 right-2 px-2 py-1 bg-red-500 text-white rounded-lg"
              >
                X
              </button>
              <h4 className="text-lg font-semibold text-blue-700">Incident Report Details</h4>
              <div className="mt-2 text-gray-700 space-y-2">
                <p><strong>Incident:</strong> {selectedIncidentState.type}</p>
                <p>
                  <strong>Incident Type:</strong> 
                  <span className={selectedIncidentState.incidentClassification === 'Emergency Incident' ? 'ml-1 text-red-500 font-bold animate-pulse' : 'ml-1 font-bold'}>
                    {selectedIncidentState.incidentClassification || 'N/A'}
                  </span>
                </p>
                <p><strong>Date:</strong> {formatDate(selectedIncidentState.date)}</p>
                <p><strong>Time:</strong> {selectedIncidentState.time || 'N/A'}</p>
                <p><strong>Location:</strong> {selectedIncidentState.location || 'N/A'}</p>
                <p><strong>Location Note:</strong> {selectedIncidentState.locationNote || 'N/A'}</p>
                <p><strong>Description:</strong> {selectedIncidentState.description || 'N/A'}</p>
                <p><strong>Full Name:</strong> {selectedIncidentState.fullName || 'Anonymous'}</p>
                <p><strong>Contact Number:</strong> {selectedIncidentState.contactNumber || 'Anonymous'}</p>
                <p><strong>Status:</strong> {selectedIncidentState.status || 'Pending'}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ViewReportedIncidents;


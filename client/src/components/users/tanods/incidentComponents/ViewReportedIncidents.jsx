import React, { useEffect, useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";

const ViewReportedIncidents = ({ setShowReportedIncidents, setIncidentLocations, incidentReports }) => {
  const [incidentLog, setIncidentLog] = useState([]);
  const [selectedIncidentState, setSelectedIncidentState] = useState(null);
  const [visibleLocations, setVisibleLocations] = useState(() => {
    const saved = localStorage.getItem('visibleIncidentLocations');
    return saved ? JSON.parse(saved) : {};
  });
  const [showAllLocations, setShowAllLocations] = useState(
    JSON.parse(localStorage.getItem('showAllLocations')) || false
  );

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
      setIncidentLog(response.data);
    } catch (error) {
      console.error('Error fetching incident reports:', error);
      toast.error('Failed to load incident reports.');
    }
  };

  useEffect(() => {
    fetchIncidentReports();
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
      incidentReports.forEach(incident => {
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
    setVisibleLocations((prev) => {
      const newVisibleLocations = { ...prev };
      if (newVisibleLocations[incident._id]) {
        delete newVisibleLocations[incident._id];
      } else {
        newVisibleLocations[incident._id] = {
          location: incident.location,
          type: getIncidentType(incident.incidentClassification)
        };
      }
      setIncidentLocations(newVisibleLocations);
      
      // Extract coordinates and center map
      const latLngMatch = incident.location.match(/Lat:\s*([0-9.-]+),\s*Lon:\s*([0-9.-]+)/);
      if (latLngMatch) {
        const [_, lat, lng] = latLngMatch.map(Number);
        if (!isNaN(lat) && !isNaN(lng)) {
          // The map will center on these coordinates through the Map.jsx effect
          return newVisibleLocations;
        }
      }
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

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center" style={{ zIndex: 2000 }}>
      <div className="bg-white p-6 rounded-lg w-11/12 max-w-lg relative TopNav">
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

        <div className="overflow-x-auto" style={{ maxHeight: "300px", overflowY: "auto" }}>
          <table className="min-w-full bg-white rounded-lg overflow-hidden">
            <thead className="sticky top-0 bg-white TopNav">
              <tr>
                <th className="py-2 px-4 border-b text-center">Incident</th>
                <th className="py-2 px-4 border-b text-center">Date</th>
                <th className="py-2 px-4 border-b text-center">Action</th>
              </tr>
            </thead>
            <tbody className="text-black">
              {incidentLog.length > 0 ? (
                incidentLog.map((incident) => (
                  <tr key={incident._id}>
                    <td className="py-2 px-4 border-b text-center">{incident.type}</td>
                    <td className="py-2 px-4 border-b text-center">{formatDate(incident.date)}</td>
                    <td className="py-2 px-4 border-b text-center">
                      <div className="flex flex-col items-center space-y-2">
                        <button 
                          className="bg-blue-500 text-white px-1 py-1 rounded w-28" 
                          onClick={() => handleViewDetails(incident)}
                        >
                          View Details
                        </button>
                        <button 
                          className="bg-green-500 text-white px-1 py-1 rounded w-28" 
                          onClick={() => handleToggleLocation(incident)}
                        >
                          {visibleLocations[incident._id] ? 'Hide Location' : 'View Location'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="3" className="text-center py-4 text-sm md:text-base">
                    No reported incidents.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

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


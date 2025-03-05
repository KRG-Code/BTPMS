import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import ResolvedIncidentsModal from './ResolvedIncidentsModal';
import ViewLocation from './ViewLocation';
import CctvReviewPanel from './CctvReviewPanel';

const IncidentReports = ({ setIncidentLocations, selectedReport, setSelectedReport, mapRef, zoomToLocation }) => {
  const [incidentReports, setIncidentReports] = useState([]);
  const [visibleLocations, setVisibleLocations] = useState({});
  const [showAll, setShowAll] = useState(false);
  const [showResolvedModal, setShowResolvedModal] = useState(false);
  const [resolvedIncidents, setResolvedIncidents] = useState([]);
  const [showCctvReview, setShowCctvReview] = useState(false);
  const [activePanel, setActivePanel] = useState(null); // 'details' or 'cctv'

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
      setIncidentReports(activeIncidents);
    } catch (error) {
      console.error('Error fetching incident reports:', error);
      toast.error('Failed to load incident reports.');
    }
  };

  const fetchResolvedIncidents = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      const response = await axios.get(`${process.env.REACT_APP_API_URL}/incident-reports`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const resolved = response.data.filter(incident => incident.status === 'Resolved');
      setResolvedIncidents(resolved);
    } catch (error) {
      console.error('Error fetching resolved incidents:', error);
      toast.error('Failed to load resolved incidents.');
    }
  };

  useEffect(() => {
    fetchIncidentReports();
    fetchResolvedIncidents();
  }, []);

  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  const fetchIncidentDetails = async (reportId) => {
    const token = localStorage.getItem('token');
    if (!token) return null;

    try {
      const response = await axios.get(
        `${process.env.REACT_APP_API_URL}/incident-reports/${reportId}/details`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      return response.data;
    } catch (error) {
      console.error('Error fetching incident details:', error);
      return null;
    }
  };

  const handleViewDetails = async (report) => {
    const details = await fetchIncidentDetails(report._id);
    if (details) {
      setSelectedReport(details);
      setActivePanel('details');
    } else {
      setSelectedReport(report);
      setActivePanel('details');
    }
  };

  const handleCctvReview = (report) => {
    setSelectedReport(report);
    setActivePanel('cctv');
  };

  const handleCloseDetails = () => {
    setSelectedReport(null);
    setActivePanel(null);
  };

  const getIncidentType = (classification) => {
    return classification === 'Emergency Incident' ? 'Emergency' : 'Normal';
  };

  const handleToggleLocation = (report) => {
    const latLngMatch = report.location.match(/Lat:\s*([0-9.-]+),\s*Lon:\s*([0-9.-]+)/);
    if (!latLngMatch) {
      toast.warning(
        <div>
          <p>Cannot display location on map</p>
          <p className="text-sm mt-1">Location provided: {report.location}</p>
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
      if (newVisibleLocations[report._id]) {
        delete newVisibleLocations[report._id];
      } else {
        Object.keys(newVisibleLocations).forEach(key => {
          delete newVisibleLocations[key];
        });
        newVisibleLocations[report._id] = { 
          location: report.location, 
          type: getIncidentType(report.incidentClassification),
          status: report.status
        };
      }
      setIncidentLocations(newVisibleLocations);
      return newVisibleLocations;
    });

    setShowAll(false);
  };

  const handleToggleAllLocations = () => {
    setShowAll(!showAll);
    if (!showAll) {
      const allLocations = {};
      let invalidLocations = 0;

      incidentReports
        // Filter out resolved incidents before showing locations
        .filter(incident => incident.status !== 'Resolved')
        .forEach((report) => {
          const latLngMatch = report.location.match(/Lat:\s*([0-9.-]+),\s*Lon:\s*([0-9.-]+)/);
          if (latLngMatch) {
            allLocations[report._id] = { 
              location: report.location, 
              type: getIncidentType(report.incidentClassification),
              status: report.status
            };
          } else {
            invalidLocations++;
          }
        });

      if (invalidLocations > 0) {
        toast.info(
          `${invalidLocations} incident${invalidLocations > 1 ? 's' : ''} cannot be shown on map due to missing coordinates`,
          { autoClose: 5000, icon: 'ℹ️' }
        );
      }

      setVisibleLocations(allLocations);
      setIncidentLocations(allLocations);
    } else {
      setVisibleLocations({});
      setIncidentLocations({});
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Pending':
        return 'text-yellow-500';
      case 'In Progress':
        return 'text-blue-500';
      case 'Resolved':
        return 'text-green-500';
      default:
        return 'text-gray-500';
    }
  };

  const sortIncidents = (incidents) => {
    const statusPriority = {
      'In Progress': 1,
      'Pending': 2,
      'Resolved': 3
    };

    return [...incidents].sort((a, b) => {
      const statusA = a.status || 'Pending';
      const statusB = b.status || 'Pending';
      
      const priorityDiff = statusPriority[statusA] - statusPriority[statusB];
      if (priorityDiff !== 0) return priorityDiff;
      
      return new Date(b.date) - new Date(a.date);
    });
  };

  const handleOpenResolvedModal = () => {
    setSelectedReport(null); // Clear any selected report
    setShowResolvedModal(true);
  };

  const handleCloseResolvedModal = () => {
    setSelectedReport(null); // Clear selected report when closing modal
    setShowResolvedModal(false);
  };

  const handleCloseCctvReview = () => {
    setShowCctvReview(false);
    setActivePanel(null);
  };

  return (
    <div className="w-full">
      <h3 className="text-lg font-semibold mb-4 text-center">Incident Reports</h3>
      <div className="flex justify-between mb-4">
        <button
          onClick={handleOpenResolvedModal}
          className="px-1 py-1 rounded-lg transition duration-200 ease-in-out bg-green-600 hover:bg-green-700 text-white"
        >
          Resolved Incidents
        </button>
        <button
          onClick={handleToggleAllLocations}
          className={`px-1 py-1 rounded-lg transition duration-200 ease-in-out ${
            showAll ? 'bg-red-500 hover:bg-red-600' : 'bg-blue-500 hover:bg-blue-600'
          } text-white`}
        >
          {showAll ? 'Hide All Locations' : 'Show All Locations'}
        </button>
      </div>
      <div className="overflow-x-auto" style={{ maxHeight: '220px', overflowY: 'auto' }}>
        <table className="min-w-full bg-white rounded-lg overflow-hidden">
          <thead className="TopNav sticky top-0 bg-white z-10">
            <tr>
              <th className="py-2 px-4 border-b text-center">Incident</th>
              <th className="py-2 px-4 border-b text-center">Date</th>
              <th className="py-2 px-4 border-b text-center">Status</th>
              <th className="py-2 px-4 border-b text-center">Action</th>
            </tr>
          </thead>
          <tbody className="text-black">
            {sortIncidents(incidentReports).map((report) => (
              <tr key={report._id}>
                <td className="py-2 px-4 border-b text-center">{report.type}</td>
                <td className="py-2 px-4 border-b text-center">{formatDate(report.date)}</td>
                <td className={`py-2 px-4 border-b text-center font-semibold ${getStatusColor(report.status)}`}>
                  {report.status || 'Pending'}
                </td>
                <td className="py-2 px-4 border-b text-center">
                  <div className="flex flex-col items-center space-y-2">
                    <button className="bg-blue-500 text-white px-1 py-1 rounded w-28" onClick={() => handleViewDetails(report)}>View Details</button>
                    <button className="bg-green-500 text-white px-1 py-1 rounded w-28" onClick={() => handleToggleLocation(report)}>
                      {visibleLocations[report._id] ? 'Hide Location' : 'View Location'}
                    </button>
                    <button 
                      className="bg-purple-500 text-white px-1 py-1 rounded w-28" 
                      onClick={() => handleCctvReview(report)}
                    >
                      Review CCTV
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selectedReport && activePanel === 'details' && (
        <div className="relative p-4 bg-blue-50 rounded-lg shadow-md mt-4">
          <button onClick={handleCloseDetails} className="absolute top-2 right-2 px-2 py-1 bg-red-500 text-white rounded-lg">X</button>
          <h4 className="text-lg font-semibold text-blue-700">Incident Report Details</h4>
          <div className="mt-2 text-gray-700 space-y-2">
            <p><strong>Incident:</strong> {selectedReport.type}</p>
            <p>
              <strong>Incident Type:</strong> 
              <span className={`${selectedReport.incidentClassification === 'Emergency Incident' ? 'ml-1 text-red-500 font-bold animate-pulse' : 'ml-1 font-bold'}`}>
                {getIncidentType(selectedReport.incidentClassification) || 'N/A'}
              </span>
            </p>
            <p><strong>Date:</strong> {formatDate(selectedReport.date)}</p>
            <p><strong>Time:</strong> {selectedReport.time || 'N/A'}</p>
            <p><strong>Location:</strong> {selectedReport.location || 'N/A'}</p>
            <p><strong>Location Note:</strong> {selectedReport.locationNote || 'N/A'}</p>
            <p><strong>Description:</strong> {selectedReport.description || 'N/A'}</p>
            <p><strong>Full Name:</strong> {selectedReport.fullName || 'Anonymous'}</p>
            <p><strong>Contact Number:</strong> {selectedReport.contactNumber || 'Anonymous'}</p>
            <p>
              <strong>Status:</strong>{' '}
              <span className={`${getStatusColor(selectedReport.status)} font-semibold`}>
                {selectedReport.status || 'Pending'}
              </span>
            </p>
            
            {selectedReport.status === 'In Progress' && (
              <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                <h5 className="font-semibold text-blue-700 mb-2">Response Details</h5>
                <p><strong>Responding Officer:</strong> {selectedReport.responderName || 'Unknown'}</p>
                <p><strong>Response Started:</strong> {selectedReport.respondedAt ? new Date(selectedReport.respondedAt).toLocaleString() : 'N/A'}</p>
              </div>
            )}

            {selectedReport.status === 'Resolved' && (
              <div className="mt-4 p-3 bg-green-50 rounded-lg border border-green-200">
                <h5 className="font-semibold text-green-700 mb-2">Resolution Details</h5>
                <p><strong>Resolved By:</strong> {selectedReport.resolvedByFullName || 'Unknown'}</p>
                <p><strong>Resolved At:</strong> {new Date(selectedReport.resolvedAt).toLocaleString()}</p>
                <p className="mt-2"><strong>Resolution Log:</strong></p>
                <p className="whitespace-pre-wrap bg-white p-2 rounded border border-green-200 mt-1">
                  {selectedReport.log || 'No log provided'}
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {selectedReport && activePanel === 'cctv' && (
        <CctvReviewPanel 
          incident={selectedReport} 
          onClose={handleCloseCctvReview}
          mapRef={mapRef}
          zoomToLocation={zoomToLocation}
        />
      )}

      <ResolvedIncidentsModal
        isOpen={showResolvedModal}
        onClose={handleCloseResolvedModal} 
        resolvedIncidents={resolvedIncidents}
      />
    </div>
  );
};

export default IncidentReports;

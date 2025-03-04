import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import ViewLocation from './ViewLocation'; // Import ViewLocation component

const IncidentReports = ({ setIncidentLocations, selectedReport, setSelectedReport }) => {
  const [incidentReports, setIncidentReports] = useState([]);
  const [visibleLocations, setVisibleLocations] = useState({});
  const [showAll, setShowAll] = useState(false);

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
      setIncidentReports(response.data);
    } catch (error) {
      console.error('Error fetching incident reports:', error);
      toast.error('Failed to load incident reports.');
    }
  };

  useEffect(() => {
    fetchIncidentReports();
  }, []);

  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  const handleViewDetails = (report) => {
    setSelectedReport(report);
  };

  const handleCloseDetails = () => {
    setSelectedReport(null);
  };

  const getIncidentType = (classification) => {
    return classification === 'Emergency Incident' ? 'Emergency' : 'Normal';
  };

  const handleToggleLocation = (report) => {
    setVisibleLocations((prev) => {
      const newVisibleLocations = { ...prev };
      if (newVisibleLocations[report._id]) {
        delete newVisibleLocations[report._id];
      } else {
        newVisibleLocations[report._id] = { location: report.location, type: getIncidentType(report.incidentClassification) };
      }
      setIncidentLocations(newVisibleLocations);
      return newVisibleLocations;
    });
  };

  const handleToggleAllLocations = () => {
    if (showAll) {
      setVisibleLocations({});
      setIncidentLocations({});
    } else {
      const allLocations = {};
      incidentReports.forEach((report) => {
        allLocations[report._id] = { location: report.location, type: getIncidentType(report.incidentClassification) };
      });
      setVisibleLocations(allLocations);
      setIncidentLocations(allLocations);
    }
    setShowAll(!showAll);
  };

  return (
    <div className="w-full">
      <h3 className="text-lg font-semibold mb-4 text-center">Incident Reports</h3>
      <div className="flex justify-center mb-4">
        <button onClick={handleToggleAllLocations} className={`px-1 py-1 rounded-lg transition duration-200 ease-in-out ${showAll ? 'bg-red-500 hover:bg-red-600' : 'bg-blue-500 hover:bg-blue-600'} text-white`}>
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
            {incidentReports.map((report) => (
              <tr key={report._id}>
                <td className="py-2 px-4 border-b text-center">{report.type}</td>
                <td className="py-2 px-4 border-b text-center">{formatDate(report.date)}</td>
                <td className="py-2 px-4 border-b text-center">{report.status || 'Pending'}</td>
                <td className="py-2 px-4 border-b text-center">
                  <div className="flex flex-col items-center space-y-2">
                    <button className="bg-blue-500 text-white px-1 py-1 rounded w-28" onClick={() => handleViewDetails(report)}>View Details</button>
                    <button className="bg-green-500 text-white px-1 py-1 rounded w-28" onClick={() => handleToggleLocation(report)}>
                      {visibleLocations[report._id] ? 'Hide Location' : 'View Location'}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selectedReport && (
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
            <p><strong>Status:</strong> {selectedReport.status || 'Pending'}</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default IncidentReports;

import React, { useState, useEffect } from "react";
import axios from 'axios';
import { toast } from 'react-toastify';

const RespondToIncident = ({ 
  setShowReportIncident,
  selectedIncident,
  setSelectedIncidentForResponse 
}) => {
  const [incidentLog, setIncidentLog] = useState(() => {
    const savedLog = localStorage.getItem(`incident_log_${selectedIncident._id}`);
    return savedLog || "";
  });
  const [assistanceStatus, setAssistanceStatus] = useState(null);

  const handleLogChange = (e) => {
    const newValue = e.target.value;
    setIncidentLog(newValue);
    localStorage.setItem(`incident_log_${selectedIncident._id}`, newValue);
  };

  const handleResolveIncident = async () => {
    if (!incidentLog.trim()) {
      toast.error('Please enter an incident log before resolving');
      return;
    }

    // Show confirmation toast
    toast.info(
      <div className="text-center">
        <p className="mb-2">Are you sure you want to resolve this incident?</p>
        <p className="mb-4 text-sm text-gray-600">This action cannot be undone.</p>
        <div className="flex justify-center space-x-2">
          <button
            onClick={async () => {
              toast.dismiss();
              try {
                const token = localStorage.getItem('token');
                const userId = localStorage.getItem('userId');
                
                if (!token || !userId) {
                  toast.error('Authentication required');
                  return;
                }

                const response = await axios.put(
                  `${process.env.REACT_APP_API_URL}/incident-reports/${selectedIncident._id}/status`,
                  {
                    status: 'Resolved',
                    log: incidentLog,
                    userId: userId // Include userId in the request body
                  },
                  {
                    headers: { Authorization: `Bearer ${token}` }
                  }
                );

                if (response.data) {
                  toast.success('Incident has been resolved and log saved');
                  localStorage.removeItem(`incident_log_${selectedIncident._id}`);
                  setShowReportIncident(false);
                  setSelectedIncidentForResponse(null);

                  // Refresh the incident reports list if you have a refresh function
                  // refreshIncidentReports(); // You might want to add this as a prop
                }
              } catch (error) {
                console.error('Error resolving incident:', error);
                toast.error(error.response?.data?.message || 'Failed to resolve incident');
              }
            }}
            className="bg-blue-600 text-white text-sm md:text-base px-4 py-2 rounded shadow hover:bg-blue-700 transition"
          >
            Yes
          </button>
          <button
            onClick={() => toast.dismiss()}
            className="bg-gray-600 text-white text-sm md:text-base px-4 py-2 rounded shadow hover:bg-gray-700 transition"
          >
            No
          </button>
        </div>
      </div>,
      { autoClose: false }
    );
  };

  const handleRequestAssistance = async () => {
    try {
      const token = localStorage.getItem('token');
      const userId = localStorage.getItem('userId');
      
      if (!token || !userId) {
        toast.error('Authentication required');
        return;
      }

      toast.info(
        <div className="text-center">
          <p className="mb-2">Are you sure you want to request assistance?</p>
          <div className="flex justify-center space-x-2">
            <button
              onClick={async () => {
                toast.dismiss();
                try {
                  const response = await axios.post(
                    `${process.env.REACT_APP_API_URL}/assistance-requests/create`,
                    {
                      incidentId: selectedIncident._id,
                      requesterId: userId,
                      location: selectedIncident.location,
                      incidentType: selectedIncident.type,
                      incidentClassification: selectedIncident.incidentClassification,
                      dateRequested: new Date(),
                      requesterName: selectedIncident.responderName,
                    },
                    {
                      headers: { Authorization: `Bearer ${token}` }
                    }
                  );

                  if (response.data) {
                    toast.success('Assistance request has been sent');
                    setAssistanceStatus('Pending');
                  }
                } catch (error) {
                  console.error('Error requesting assistance:', error);
                  toast.error(error.response?.data?.message || 'Failed to request assistance');
                }
              }}
              className="bg-blue-600 text-white px-4 py-2 rounded shadow hover:bg-blue-700 transition"
            >
              Yes
            </button>
            <button
              onClick={() => toast.dismiss()}
              className="bg-gray-600 text-white px-4 py-2 rounded shadow hover:bg-gray-700 transition"
            >
              No
            </button>
          </div>
        </div>,
        { autoClose: false }
      );
    } catch (error) {
      console.error('Error requesting assistance:', error);
      toast.error('Failed to request assistance');
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('token');
        
        // Fetch incident details
        const incidentResponse = await axios.get(
          `${process.env.REACT_APP_API_URL}/incident-reports/${selectedIncident._id}/details`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        
        if (incidentResponse.data.log) {
          setIncidentLog(incidentResponse.data.log);
          localStorage.setItem(`incident_log_${selectedIncident._id}`, incidentResponse.data.log);
        }

        // Check assistance status
        const assistanceResponse = await axios.get(
          `${process.env.REACT_APP_API_URL}/assistance-requests/${selectedIncident._id}/status`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        
        if (assistanceResponse.data) {
          setAssistanceStatus(assistanceResponse.data.status);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };

    fetchData();
  }, [selectedIncident._id]);

  const handleClose = () => {
    if (incidentLog.trim()) {
      localStorage.setItem(`incident_log_${selectedIncident._id}`, incidentLog);
    }
    setShowReportIncident(false);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
      <div className="bg-white p-6 rounded-lg w-11/12 max-w-lg relative TopNav">
        <h2 className="text-xl md:text-2xl font-bold mb-4 flex justify-between items-center">
          Respond to Incident
          <div className="flex gap-2">
            {assistanceStatus ? (
              <span className={`px-3 py-1 rounded ${
                assistanceStatus === 'Pending' ? 'bg-yellow-500' :
                assistanceStatus === 'Approved' ? 'bg-green-500' :
                assistanceStatus === 'Completed' ? 'bg-blue-500' :
                'bg-gray-500'
              } text-white`}>
                Assistance: {assistanceStatus}
              </span>
            ) : (
              <button
                onClick={handleRequestAssistance}
                className="bg-yellow-500 text-white px-3 py-1 rounded hover:bg-yellow-600"
              >
                Request Assistance
              </button>
            )}
            <button
              onClick={handleClose}
              className="bg-red-500 text-white px-3 py-1 rounded"
            >
              Close
            </button>
          </div>
        </h2>

        <div className="mb-4 p-4 bg-gray-100 rounded text-black">
          <h3 className="font-bold mb-2">Incident Details</h3>
          <p><strong>Type:</strong> {selectedIncident.type}</p>
          <p><strong>Location:</strong> {selectedIncident.location}</p>
          <p><strong>Description:</strong> {selectedIncident.description}</p>
          <p><strong>Status:</strong> {selectedIncident.status}</p>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block font-bold mb-2">
              Incident Response Log
            </label>
            <p className="text-sm text-gray-600 mb-2">
              Write your incident response details here. The log will be saved when you resolve the incident.
            </p>
            <textarea
              value={incidentLog}
              onChange={(e) => handleLogChange(e)}
              placeholder="Enter your incident response log here..."
              className="border p-2 mb-4 w-full h-32 rounded text-sm md:text-base text-black resize-none"
            />
          </div>

          <div className="flex justify-end">
            <button 
              onClick={handleResolveIncident}
              className="bg-blue-600 text-white text-sm md:text-base px-4 py-2 rounded shadow hover:bg-blue-700 transition"
            >
              Mark as Resolved & Save Log
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RespondToIncident;

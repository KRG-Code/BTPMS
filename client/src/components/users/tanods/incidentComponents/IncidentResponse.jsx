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
  const [showApprovalDetails, setShowApprovalDetails] = useState(false);
  const [approvalDetails, setApprovalDetails] = useState(null);
  const [assistanceRequest, setAssistanceRequest] = useState(null);

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

  const handleAssistanceClick = () => {
    if (assistanceRequest) {
      setApprovalDetails(assistanceRequest);
      setShowApprovalDetails(true);
    }
  };

  const ApprovalDetailsModal = ({ details, onClose }) => {
    if (!details) return null;

    const getStatusStyle = (status) => {
      switch (status) {
        case 'Pending':
          return 'text-yellow-500';
        case 'Processing':
          return 'text-blue-500';
        case 'Deployed':
          return 'text-green-500';
        case 'Rejected':
          return 'text-red-500';
        case 'Completed':
          return 'text-green-500';
        default:
          return 'text-gray-500';
      }
    };

    const renderStatusContent = () => {
      switch (details.status) {
        case 'Rejected':
          return (
            <div>
              <h4 className="font-semibold mb-2">Rejection Details</h4>
              {details.rejectedDetails && details.rejectedDetails.length > 0 ? (
                details.rejectedDetails.map((detail, index) => (
                  <div key={index} className="bg-red-50 p-3 rounded-lg mb-3 border border-red-200">
                    <p><strong>Department:</strong> {detail.department}</p>
                    <p><strong>Rejected By:</strong> {detail.rejectorName}</p>
                    <p><strong>Date/Time:</strong> {new Date(detail.rejectedDateTime).toLocaleString()}</p>
                    <p><strong>Reason:</strong> {detail.reason}</p>
                    <p><strong>Additional Notes:</strong> {detail.notes || 'N/A'}</p>
                  </div>
                ))
              ) : (
                <p>No rejection details available</p>
              )}
            </div>
          );

        case 'Processing':
          return (
            <div>
              <h4 className="font-semibold mb-2">Approval History</h4>
              {details.approvedDetails && details.approvedDetails.map((detail, index) => (
                <div key={index} className="bg-blue-50 p-3 rounded-lg mb-3 border border-blue-200">
                  <p><strong>Department:</strong> {detail.department}</p>
                  <p><strong>Approved By:</strong> {detail.approverName}</p>
                  <p><strong>Date/Time:</strong> {new Date(detail.approvedDateTime).toLocaleString()}</p>
                  <p><strong>Notes:</strong> {detail.notes || 'N/A'}</p>
                </div>
              ))}
              <div className="text-center p-4 bg-yellow-50 rounded-lg mt-4">
                <p className="text-yellow-600">
                  {details.approvedDetails?.some(detail => detail.department === "ERDMS")
                    ? "Waiting for assigned responder to deploy..."
                    : "Waiting for emergency response team to process the request..."}
                </p>
              </div>
            </div>
          );

        case 'Deployed':
        case 'Completed':
          return (
            <div>
              <h4 className="font-semibold mb-2">Approval History</h4>
              {details.approvedDetails && details.approvedDetails.map((detail, index) => (
                <div key={index} className="bg-blue-50 p-3 rounded-lg mb-3 border border-blue-200">
                  <p><strong>Department:</strong> {detail.department}</p>
                  <p><strong>Approved By:</strong> {detail.approverName}</p>
                  <p><strong>Date/Time:</strong> {new Date(detail.approvedDateTime).toLocaleString()}</p>
                  <p><strong>Notes:</strong> {detail.notes || 'N/A'}</p>
                </div>
              ))}
              
              {details.responderDetails && details.responderDetails.length > 0 && (
                <>
                  <h4 className="font-semibold mb-2 mt-4">Responder Details</h4>
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
                </>
              )}
              
              {details.status === 'Completed' && (
                <div className="text-center p-4 bg-green-50 rounded-lg mt-4">
                  <p className="text-green-600">
                    Response completed successfully
                  </p>
                </div>
              )}
            </div>
          );

        case 'Pending':
          return (
            <div className="text-center p-4 bg-yellow-50 rounded-lg">
              <p className="text-yellow-600">
                Waiting for admin approval...
              </p>
            </div>
          );

        default:
          return null;
      }
    };

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
        <div className="bg-white p-6 rounded-lg w-11/12 max-w-lg relative TopNav">
          <h3 className="text-xl font-bold mb-4 text-black">Assistance Status Details</h3>
          <button
            onClick={onClose}
            className="absolute top-2 right-2 text-gray-600 hover:text-gray-800"
          >
            ✕
          </button>
          <div className="space-y-4 text-black">
            <div className="mb-4">
              <p className="font-semibold text-lg mb-2">
                Current Status: 
                <span className={`ml-2 ${getStatusStyle(details.status)}`}>
                  {details.status}
                </span>
              </p>
            </div>
            {renderStatusContent()}
          </div>
        </div>
      </div>
    );
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

        // Check assistance status and get request details
        const assistanceResponse = await axios.get(
          `${process.env.REACT_APP_API_URL}/assistance-requests/${selectedIncident._id}/status`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        
        if (assistanceResponse.data) {
          setAssistanceStatus(assistanceResponse.data.status);
          setAssistanceRequest(assistanceResponse.data); // Store the full assistance request data
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
              <span 
              className={`px-3 py-1 rounded cursor-pointer ${
                assistanceStatus === 'Pending' ? 'bg-yellow-500' :
                assistanceStatus === 'Processing' ? 'bg-blue-500' :
                assistanceStatus === 'Deployed' ? 'bg-indigo-500' :
                assistanceStatus === 'Rejected' ? 'bg-red-500' :
                assistanceStatus === 'Completed' ? 'bg-green-500' :
                'bg-gray-500'
              } text-white`}              
                onClick={handleAssistanceClick}
                title={assistanceStatus === 'Approved' ? 'Click to view approval details' : ''}
              >
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

      {showApprovalDetails && (
        <ApprovalDetailsModal
          details={approvalDetails}
          onClose={() => setShowApprovalDetails(false)}
        />
      )}
    </div>
  );
};

export default RespondToIncident;

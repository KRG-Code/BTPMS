import React from "react";
import { motion } from "framer-motion";
import { FaTimes, FaUserShield, FaMapMarkedAlt, FaClock, FaInfoCircle, FaCheck, FaTimes as FaTimesCircle, FaUserTie, FaCalendarAlt, FaTag, FaPhone } from "react-icons/fa";

const formatDate = (dateString) => {
  if (!dateString) return "N/A";
  const date = new Date(dateString);
  return date.toLocaleDateString(undefined, { year: 'numeric', month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' });
};

// Format address to handle undefined parts
const formatAddress = (address) => {
  if (!address) return "Not provided";
  if (address === "undefined, undefined, undefined") return "Not provided";
  return address;
};

const AssistanceDetailsModal = ({ show, onClose, assistance, isDarkMode }) => {
  // Theme-aware styling variables
  const bgColor = isDarkMode ? "bg-gray-800" : "bg-white";
  const textColor = isDarkMode ? "text-white" : "text-gray-800";
  const borderColor = isDarkMode ? "border-gray-700" : "border-gray-200";
  const subTextColor = isDarkMode ? "text-gray-300" : "text-gray-600"; // Lightened for dark mode
  const headingColor = isDarkMode ? "text-blue-400" : "text-blue-600";
  const buttonColor = isDarkMode 
    ? "bg-blue-600 text-white hover:bg-blue-700" 
    : "bg-blue-500 text-white hover:bg-blue-600";

  // Color scheme for sections
  const sectionColors = {
    approval: isDarkMode ? {
      bg: "bg-blue-800 bg-opacity-20",
      border: "border-blue-700",
      text: "text-blue-100",
      label: "text-blue-300"
    } : {
      bg: "bg-blue-50",
      border: "border-blue-100",
      text: "text-blue-900",
      label: "text-blue-700"
    },
    responder: isDarkMode ? {
      bg: "bg-green-800 bg-opacity-20",
      border: "border-green-700",
      text: "text-green-100",
      label: "text-green-300"
    } : {
      bg: "bg-green-50",
      border: "border-green-100",
      text: "text-green-900",
      label: "text-green-700"
    }
  };

  const getStatusBadge = (status) => {
    let colorClasses;
    
    switch (status) {
      case "Pending":
        colorClasses = isDarkMode 
          ? "bg-yellow-700 text-yellow-200" 
          : "bg-yellow-100 text-yellow-800";
        break;
      case "Processing":
        colorClasses = isDarkMode 
          ? "bg-blue-700 text-blue-200" 
          : "bg-blue-100 text-blue-800";
        break;
      case "Deployed":
        colorClasses = isDarkMode 
          ? "bg-indigo-700 text-indigo-200" 
          : "bg-indigo-100 text-indigo-800";
        break;
      case "Completed":
        colorClasses = isDarkMode 
          ? "bg-green-700 text-green-200" 
          : "bg-green-100 text-green-800";
        break;
      case "Rejected":
        colorClasses = isDarkMode 
          ? "bg-red-700 text-red-200" 
          : "bg-red-100 text-red-800";
        break;
      default:
        colorClasses = isDarkMode 
          ? "bg-gray-700 text-gray-200" 
          : "bg-gray-100 text-gray-800";
    }
    
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${colorClasses}`}>
        {status}
      </span>
    );
  };

  return (
    <motion.div
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0.9, opacity: 0 }}
      className={`fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black bg-opacity-70`}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className={`w-full max-w-2xl rounded-lg shadow-xl ${bgColor} ${textColor} overflow-hidden`}>
        {/* Header */}
        <div className={`p-4 border-b ${borderColor} flex justify-between items-center`}>
          <h2 className={`text-lg font-bold ${headingColor}`}>Assistance Request Details</h2>
          <button
            onClick={onClose}
            className={`p-1 rounded-full ${isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-200'}`}
          >
            <FaTimes className={`h-5 w-5 ${textColor}`} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[70vh]">
          {/* Status Badge */}
          <div className="flex justify-center mb-6">
            <div className={`text-center ${isDarkMode ? 'bg-gray-700' : 'bg-gray-100'} rounded-lg p-3 w-full`}>
              <p className={`font-medium mb-2 ${textColor}`}>Status</p>
              <div className="flex justify-center">
                {getStatusBadge(assistance.status)}
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div className={`p-3 rounded-lg ${isDarkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
              <h3 className={`font-bold mb-2 ${headingColor} flex items-center`}>
                <FaUserShield className="mr-2" /> Requester Information
              </h3>
              <p className={`${textColor}`}>
                <span className="font-medium">Name:</span> {assistance.requesterName}
              </p>
              <p className={`${textColor}`}>
                <span className="font-medium">Date Requested:</span> {formatDate(assistance.dateRequested)}
              </p>
            </div>

            <div className={`p-3 rounded-lg ${isDarkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
              <h3 className={`font-bold mb-2 ${headingColor} flex items-center`}>
                <FaMapMarkedAlt className="mr-2" /> Incident Information
              </h3>
              <p className={`${textColor}`}>
                <span className="font-medium">Type:</span> {assistance.incidentType}
              </p>
              <p className={`${textColor}`}>
                <span className="font-medium">Classification:</span> {assistance.incidentClassification}
              </p>
              <p className={`${textColor} truncate`}>
                <span className="font-medium">Location:</span> {assistance.location}
              </p>
            </div>
          </div>

          {/* Approvals Section */}
          {assistance.approvedDetails && assistance.approvedDetails.length > 0 && (
            <div className="mb-4">
              <h3 className={`font-bold mb-2 ${textColor} flex items-center`}>
                <FaCheck className="mr-2 text-green-500" /> Approval History
              </h3>
              <div className="space-y-3">
                {assistance.approvedDetails.map((detail, index) => (
                  <div 
                    key={index} 
                    className={`p-3 rounded-lg border ${sectionColors.approval.bg} ${sectionColors.approval.border}`}
                  >
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      <div className="flex items-center">
                        <FaUserTie className={`mr-2 ${sectionColors.approval.label}`} />
                        <div>
                          <div className={`text-xs ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>Department</div>
                          <div className={`font-medium ${textColor}`}>{detail.department || 'BTPMS'}</div>
                        </div>
                      </div>
                      
                      <div className="flex items-center">
                        <FaUserShield className={`mr-2 ${sectionColors.approval.label}`} />
                        <div>
                          <div className={`text-xs ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>Approved By</div>
                          <div className={`font-medium ${textColor}`}>{detail.approverName}</div>
                        </div>
                      </div>
                      
                      <div className="flex items-center">
                        <FaCalendarAlt className={`mr-2 ${sectionColors.approval.label}`} />
                        <div>
                          <div className={`text-xs ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>Date/Time</div>
                          <div className={`font-medium ${textColor}`}>{formatDate(detail.approvedDateTime)}</div>
                        </div>
                      </div>
                    </div>
                    
                    {detail.notes && (
                      <div className={`mt-2 pt-2 border-t ${isDarkMode ? "border-blue-800" : "border-blue-200"}`}>
                        <div className={`text-xs ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>Notes</div>
                        <div className={`${textColor}`}>{detail.notes}</div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Responder Details Section */}
          {assistance.responderDetails && assistance.responderDetails.length > 0 && (
            <div className="mb-4">
              <h3 className={`font-bold mb-2 ${textColor} flex items-center`}>
                <FaUserShield className="mr-2 text-green-500" /> Responder Details
              </h3>
              <div className="space-y-3">
                {assistance.responderDetails.map((responder, index) => (
                  <div 
                    key={index} 
                    className={`p-3 rounded-lg border ${sectionColors.responder.bg} ${sectionColors.responder.border}`}
                  >
                    {/* Change from 2-column grid to 1-column to ensure all fields are visible */}
                    <div className="grid grid-cols-1 gap-2">
                      {/* Department */}
                      <div className="flex items-center">
                        <FaUserTie className={`mr-2 ${sectionColors.responder.label}`} />
                        <div>
                          <div className={`text-xs ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>Department</div>
                          <div className={`font-medium ${textColor}`}>{responder.department || 'ERDMS'}</div>
                        </div>
                      </div>
                      
                      {/* Responder Name */}
                      <div className="flex items-center">
                        <FaUserShield className={`mr-2 ${sectionColors.responder.label}`} />
                        <div>
                          <div className={`text-xs ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>Responder Name</div>
                          <div className={`font-medium ${textColor}`}>{responder.responderName}</div>
                        </div>
                      </div>
                      
                      {/* Contact */}
                      <div className="flex items-center">
                        <FaPhone className={`mr-2 ${sectionColors.responder.label}`} />
                        <div>
                          <div className={`text-xs ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>Contact</div>
                          <div className={`font-medium ${textColor}`}>{responder.responderContact || 'N/A'}</div>
                        </div>
                      </div>
                      
                      {/* Address */}
                      <div className="flex items-center">
                        <FaMapMarkedAlt className={`mr-2 ${sectionColors.responder.label}`} />
                        <div>
                          <div className={`text-xs ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>Address</div>
                          <div className={`font-medium ${textColor}`}>{formatAddress(responder.responderAddress)}</div>
                        </div>
                      </div>
                      
                      {/* Type - Make sure this is displayed correctly */}
                      <div className="flex items-center">
                        <FaTag className={`mr-2 ${sectionColors.responder.label}`} />
                        <div>
                          <div className={`text-xs ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>Type</div>
                          <div className={`font-medium ${textColor}`}>{responder.responderType || 'N/A'}</div>
                        </div>
                      </div>
                      
                      {/* Response Time */}
                      <div className="flex items-center">
                        <FaCalendarAlt className={`mr-2 ${sectionColors.responder.label}`} />
                        <div>
                          <div className={`text-xs ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>Response Time</div>
                          <div className={`font-medium ${textColor}`}>{formatDate(responder.responseDateTime)}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Rejection Section */}
          {assistance.rejectedDetails && assistance.rejectedDetails.length > 0 && (
            <div className={`p-3 rounded-lg mb-4 ${isDarkMode ? 'bg-red-900/20 border-red-800/30' : 'bg-red-50 border border-red-200'}`}>
              <h3 className={`font-bold mb-2 ${isDarkMode ? 'text-red-300' : 'text-red-700'} flex items-center`}>
                <FaTimesCircle className="mr-2" /> Rejection Details
              </h3>
              {assistance.rejectedDetails.map((detail, index) => (
                <div key={index} className={`mb-2 ${index > 0 ? 'border-t pt-2' : ''} ${isDarkMode ? 'border-red-800/30' : 'border-red-200'}`}>
                  <p className={textColor}>
                    <span className="font-medium">Rejected by:</span> {detail.rejectorName}
                  </p>
                  <p className={textColor}>
                    <span className="font-medium">Department:</span> {detail.department || 'BTPMS'}
                  </p>
                  <p className={textColor}>
                    <span className="font-medium">Date:</span> {formatDate(detail.rejectedDateTime)}
                  </p>
                  <p className={textColor}>
                    <span className="font-medium">Reason:</span> {detail.reason}
                  </p>
                  {detail.notes && (
                    <p className={textColor}>
                      <span className="font-medium">Notes:</span> {detail.notes}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Notes or Additional Information */}
          {assistance.notes && (
            <div className={`p-3 rounded-lg mb-4 ${isDarkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
              <h3 className={`font-bold mb-2 ${headingColor} flex items-center`}>
                <FaInfoCircle className="mr-2" /> Additional Information
              </h3>
              <p className={textColor}>
                {assistance.notes || "No additional notes provided."}
              </p>
            </div>
          )}

          {/* Close Button */}
          <div className="flex justify-end mt-4">
            <button
              onClick={onClose}
              className={`px-4 py-2 rounded ${buttonColor}`}
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default AssistanceDetailsModal;

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaUserCircle, FaTimes, FaPhone, FaMapMarkedAlt, FaSpinner, FaHistory, FaCrown } from 'react-icons/fa';
import { toast } from 'react-toastify';
import { fetchPatrolLogs } from './ScheduleUtils';

// Animation variants
const backdropVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
  exit: { opacity: 0 }
};

const modalVariants = {
  hidden: { opacity: 0, y: -50, scale: 0.9 },
  visible: { 
    opacity: 1, 
    y: 0, 
    scale: 1,
    transition: { duration: 0.3, type: 'spring', damping: 25 }
  },
  exit: {
    opacity: 0,
    y: 50,
    scale: 0.9,
    transition: { duration: 0.2 }
  }
};

const ScheduleMembers = ({ scheduleMembers, setShowMembersTable, scheduleId, isDarkMode }) => {
  const [patrolLogs, setPatrolLogs] = useState([]);
  const [showPatrolLogsModal, setShowPatrolLogsModal] = useState(false);
  const [selectedMemberId, setSelectedMemberId] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleViewPatrolLogs = (memberId) => {
    setLoading(true);
    setSelectedMemberId(memberId);
    fetchPatrolLogs(memberId, scheduleId, setPatrolLogs, setShowPatrolLogsModal)
      .finally(() => setLoading(false));
  };

  // Find the team leader among members
  const teamLeader = scheduleMembers.find(member => member.isTeamLeader);

  return (
    <motion.div 
      className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4 backdrop-blur-sm"
      variants={backdropVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
    >
      <motion.div 
        className={`relative w-full max-w-2xl rounded-xl shadow-lg overflow-hidden ${
          isDarkMode ? 'bg-[#0e1022] text-[#e7e8f4]' : 'bg-white text-gray-800'
        }`}
        variants={modalVariants}
        initial="hidden"
        animate="visible"
        exit="exit"
      >
        {/* Header */}
        <div className={`${
          isDarkMode 
            ? 'bg-gradient-to-r from-[#191f8a] to-[#4750eb]' 
            : 'bg-gradient-to-r from-[#191d67] to-[#141db8]'
          } px-6 py-4 text-white flex justify-between items-center`}>
          <h2 className="text-xl font-bold">Schedule Members</h2>
          <button 
            onClick={() => setShowMembersTable(false)}
            className="text-white hover:text-gray-200 transition-colors"
          >
            <FaTimes className="w-5 h-5" />
          </button>
        </div>
        
        {/* Team Leader Section - New! */}
        {teamLeader && (
          <div className={`px-6 py-3 ${
            isDarkMode ? 'bg-yellow-900/20 border-b border-yellow-800' : 'bg-yellow-50 border-b border-yellow-200'
          }`}>
            <div className="flex items-center">
              <FaCrown className={`mr-2 ${isDarkMode ? 'text-yellow-500' : 'text-yellow-600'}`} />
              <p className={`${isDarkMode ? 'text-yellow-300' : 'text-yellow-800'} font-medium`}>
                Team Leader: {teamLeader.firstName} {teamLeader.lastName}
              </p>
            </div>
          </div>
        )}
        
        {/* Members */}
        <div className="px-6 py-4">
          <h3 className={`text-lg font-semibold mb-4 ${isDarkMode ? 'text-[#e7e8f4]' : 'text-gray-800'}`}>
            Tanod Members
          </h3>
          <div className={`space-y-4 max-h-96 overflow-y-auto ${
            isDarkMode ? 'scrollbar-dark' : 'scrollbar-light'
          }`}>
            {scheduleMembers.map((member) => (
              <div 
                key={member._id} 
                className={`p-4 rounded-lg shadow ${
                  member.isTeamLeader 
                    ? isDarkMode 
                      ? 'bg-[#191f2a] border-l-4 border-yellow-500' 
                      : 'bg-white border-l-4 border-yellow-500 shadow-md'
                    : isDarkMode 
                      ? 'bg-[#191f2a]' 
                      : 'bg-white'
                }`}
              >
                <div className="flex items-center">
                  {member.profilePicture ? (
                    <img 
                      src={member.profilePicture} 
                      alt={`${member.firstName} ${member.lastName}`}
                      className="w-12 h-12 rounded-full object-cover mr-4"
                    />
                  ) : (
                    <FaUserCircle className={`w-12 h-12 mr-4 ${isDarkMode ? 'text-gray-600' : 'text-gray-400'}`} />
                  )}
                  <div className="flex-1">
                    <div className="flex items-center">
                      <h4 className={`text-lg font-medium ${isDarkMode ? 'text-[#e7e8f4]' : 'text-gray-800'}`}>
                        {member.firstName} {member.lastName}
                      </h4>
                      {member.isTeamLeader && (
                        <span className={`ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          isDarkMode ? 'bg-yellow-900 text-yellow-300' : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          <FaCrown className="mr-1" size={10} />
                          Team Leader
                        </span>
                      )}
                    </div>
                    {member.contactNumber && (
                      <p className={`text-sm flex items-center ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                        <FaPhone className="mr-1" size={12} />
                        {member.contactNumber}
                      </p>
                    )}
                  </div>
                  <button
                    onClick={() => handleViewPatrolLogs(member._id)}
                    className={`px-3 py-1.5 text-sm rounded-md flex items-center ${
                      isDarkMode
                        ? 'bg-[#0e1022] hover:bg-[#191f2a] text-[#989ce6] border border-[#1e2048]'
                        : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                    }`}
                    disabled={loading && selectedMemberId === member._id}
                  >
                    {loading && selectedMemberId === member._id ? (
                      <FaSpinner className="mr-1 animate-spin" size={14} />
                    ) : (
                      <FaHistory className="mr-1" size={14} />
                    )}
                    Patrol Logs
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
        
        {/* Footer */}
        <div className={`px-6 py-4 border-t ${isDarkMode ? 'border-[#1e2048]' : 'border-gray-200'} flex justify-end`}>
          <button
            onClick={() => setShowMembersTable(false)}
            className={`px-4 py-2 rounded-md ${
              isDarkMode
                ? 'bg-[#191f2a] hover:bg-[#232942] text-[#e7e8f4]'
                : 'bg-gray-200 hover:bg-gray-300 text-gray-800'
            } transition-colors`}
          >
            Close
          </button>
        </div>
      </motion.div>
      
      {/* Patrol Logs Modal */}
      <AnimatePresence>
        {showPatrolLogsModal && (
          <PatrolLogsModal
            patrolLogs={patrolLogs}
            setShowPatrolLogsModal={setShowPatrolLogsModal}
            isDarkMode={isDarkMode}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
};

// PatrolLogsModal component
const PatrolLogsModal = ({ patrolLogs, setShowPatrolLogsModal, isDarkMode }) => {
  return (
    <motion.div
      className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4 backdrop-blur-sm"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={() => setShowPatrolLogsModal(false)}
    >
      <motion.div
        className={`relative w-full max-w-md rounded-xl shadow-lg overflow-hidden ${
          isDarkMode ? 'bg-[#0e1022] text-[#e7e8f4]' : 'bg-white text-gray-800'
        }`}
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 20, scale: 0.95 }}
        transition={{ duration: 0.3, type: 'spring', damping: 25 }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className={`${
          isDarkMode 
            ? 'bg-gradient-to-r from-purple-900 to-purple-800' 
            : 'bg-gradient-to-r from-purple-700 to-purple-600'
          } px-6 py-4 text-white flex justify-between items-center`}>
          <h2 className="text-xl font-bold flex items-center">
            <FaHistory className="mr-2" />
            Patrol Logs
          </h2>
          <button
            onClick={() => setShowPatrolLogsModal(false)}
            className="text-white hover:text-gray-200 transition-colors"
          >
            <FaTimes className="w-5 h-5" />
          </button>
        </div>
        
        {/* Logs */}
        <div className="px-6 py-4">
          <div className={`max-h-96 overflow-y-auto ${
            isDarkMode ? 'scrollbar-dark' : 'scrollbar-light'
          }`}>
            {patrolLogs.length > 0 ? (
              patrolLogs.map((log, index) => (
                <div 
                  key={index} 
                  className={`mb-4 p-4 rounded-lg ${
                    isDarkMode ? 'bg-[#191f2a]' : 'bg-gray-50'
                  }`}
                >
                  <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'} mb-1`}>
                    {new Date(log.timestamp).toLocaleString()}
                  </div>
                  <p className={isDarkMode ? 'text-[#e7e8f4]' : 'text-gray-800'}>
                    {log.log}
                  </p>
                </div>
              ))
            ) : (
              <div className={`text-center py-8 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                <FaMapMarkedAlt className={`mx-auto h-12 w-12 mb-3 ${isDarkMode ? 'text-gray-600' : 'text-gray-400'}`} />
                <p>No logs reported</p>
                <p className="text-sm mt-2 opacity-75">This tanod hasn't submitted any patrol logs for this schedule.</p>
              </div>
            )}
          </div>
        </div>
        
        {/* Footer */}
        <div className={`px-6 py-4 border-t ${isDarkMode ? 'border-[#1e2048]' : 'border-gray-200'} flex justify-end`}>
          <button
            onClick={() => setShowPatrolLogsModal(false)}
            className={`px-4 py-2 rounded-md ${
              isDarkMode
                ? 'bg-[#191f2a] hover:bg-[#232942] text-[#e7e8f4]'
                : 'bg-gray-200 hover:bg-gray-300 text-gray-800'
            } transition-colors`}
          >
            Close
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default ScheduleMembers;

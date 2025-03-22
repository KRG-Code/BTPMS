import React, { useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { motion, AnimatePresence } from "framer-motion";
import { FaUserCircle, FaTimes, FaUsers, FaPhone, FaEnvelope } from 'react-icons/fa';

const overlayVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.3 } },
  exit: { opacity: 0, transition: { duration: 0.2 } }
};

const modalVariants = {
  hidden: { opacity: 0, y: -50, scale: 0.95 },
  visible: { 
    opacity: 1, 
    y: 0, 
    scale: 1,
    transition: { 
      type: "spring", 
      damping: 25, 
      stiffness: 500 
    } 
  },
  exit: { 
    opacity: 0, 
    y: 50, 
    scale: 0.95, 
    transition: { duration: 0.2 } 
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: i => ({ 
    opacity: 1, 
    y: 0,
    transition: { delay: i * 0.05, duration: 0.3 }
  })
};

const ScheduleMembers = ({ scheduleMembers, setShowMembersTable, scheduleId, isDarkMode }) => {
  const [showPatrolLogsModal, setShowPatrolLogsModal] = useState(false);
  const [patrolLogs, setPatrolLogs] = useState([]);
  const [selectedMember, setSelectedMember] = useState(null);

  const fetchPatrolLogs = async (memberId) => {
    const token = localStorage.getItem("token");
    if (!token) {
      toast.error("Please log in.");
      return;
    }

    try {
      if (!scheduleId) {
        toast.error("Invalid schedule ID.");
        return;
      }
      const response = await axios.get(
        `${process.env.REACT_APP_API_URL}/auth/patrol-logs/${memberId}/${scheduleId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setPatrolLogs(response.data);
      setShowPatrolLogsModal(true);
    } catch (error) {
      console.error("Error fetching patrol logs:", error);
      toast.error("Error fetching patrol logs.");
    }
  };

  return (
    <AnimatePresence>
      <motion.div 
        className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4 backdrop-blur-sm"
        variants={overlayVariants}
        initial="hidden"
        animate="visible"
        exit="exit"
        onClick={() => setShowMembersTable(false)}
      >
        <motion.div 
          className={`relative w-full max-w-2xl rounded-xl shadow-2xl overflow-hidden ${
            isDarkMode ? 'bg-[#0e1022] text-[#e7e8f4]' : 'bg-white text-[#0b0c18]'
          }`}
          variants={modalVariants}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className={`${
            isDarkMode 
              ? 'bg-gradient-to-r from-[#191f8a] to-[#4750eb]'
              : 'bg-gradient-to-r from-[#191d67] to-[#141db8]'
            } px-6 py-4 text-white flex justify-between items-center`}>
            <h2 className="text-xl font-bold flex items-center">
              <FaUsers className="mr-3" />
              Schedule Members ({scheduleMembers.length})
            </h2>
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => setShowMembersTable(false)}
              className="text-white hover:text-gray-200 focus:outline-none"
            >
              <FaTimes className="h-5 w-5" />
            </motion.button>
          </div>

          {/* Body */}
          <div className={`p-6 max-h-[70vh] overflow-y-auto ${
            isDarkMode ? 'scrollbar-dark' : 'scrollbar-light'
          }`}>
            {scheduleMembers.length === 0 ? (
              <div className={`text-center py-8 ${
                isDarkMode ? 'text-gray-400' : 'text-gray-500'
              }`}>
                <FaUsers className="mx-auto text-5xl mb-3 opacity-30" />
                <p>No members assigned to this schedule.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {scheduleMembers.map((member, index) => (
                  <motion.div
                    key={member._id}
                    variants={itemVariants}
                    custom={index}
                    initial="hidden"
                    animate="visible"
                    className={`flex border rounded-lg overflow-hidden shadow-sm ${
                      isDarkMode 
                        ? 'bg-[#080917] border-[#1e2048] hover:border-[#4750eb]'
                        : 'bg-gray-50 border-gray-200 hover:border-blue-300'
                    } transition-all duration-200 hover:shadow-md`}
                  >
                    <div className="w-1/3 flex items-center justify-center p-4">
                      {member.profilePicture ? (
                        <img
                          src={member.profilePicture}
                          alt={`${member.firstName} ${member.lastName}`}
                          className="w-20 h-20 rounded-full object-cover border-4 border-white shadow"
                        />
                      ) : (
                        <div className={`w-20 h-20 rounded-full flex items-center justify-center ${
                          isDarkMode ? 'bg-[#191f8a] text-[#e7e8f4]' : 'bg-[#141db8] text-white'
                        } shadow`}>
                          <FaUserCircle className="w-16 h-16" />
                        </div>
                      )}
                    </div>

                    <div className="w-2/3 p-4">
                      <h3 className="font-bold text-lg mb-1">
                        {member.firstName} {member.lastName}
                      </h3>

                      {member.contactNumber && (
                        <div className={`flex items-center text-sm mb-1 ${
                          isDarkMode ? 'text-gray-400' : 'text-gray-600'
                        }`}>
                          <FaPhone className="mr-2" />
                          {member.contactNumber}
                        </div>
                      )}

                      {member.email && (
                        <div className={`flex items-center text-sm truncate ${
                          isDarkMode ? 'text-gray-400' : 'text-gray-600'
                        }`}>
                          <FaEnvelope className="mr-2 flex-shrink-0" />
                          <span className="truncate">{member.email}</span>
                        </div>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className={`border-t p-4 flex justify-end ${
            isDarkMode ? 'border-[#1e2048]' : 'border-gray-200'
          }`}>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.97 }}
              className={`px-6 py-2 rounded-lg ${
                isDarkMode 
                  ? 'bg-[#4750eb] hover:bg-[#191f8a] text-white' 
                  : 'bg-[#141db8] hover:bg-[#191d67] text-white'
              } shadow-sm transition-colors`}
              onClick={() => setShowMembersTable(false)}
            >
              Close
            </motion.button>
          </div>
        </motion.div>
      </motion.div>

      {/* Custom scrollbar styles */}
      <style jsx>{`
        .scrollbar-dark::-webkit-scrollbar {
          width: 8px;
        }
        .scrollbar-dark::-webkit-scrollbar-track {
          background: #080917;
        }
        .scrollbar-dark::-webkit-scrollbar-thumb {
          background: #1e2048;
          border-radius: 4px;
        }
        .scrollbar-dark::-webkit-scrollbar-thumb:hover {
          background: #4750eb;
        }
        
        .scrollbar-light::-webkit-scrollbar {
          width: 8px;
        }
        .scrollbar-light::-webkit-scrollbar-track {
          background: #f1f1f1;
        }
        .scrollbar-light::-webkit-scrollbar-thumb {
          background: #d1d5db;
          border-radius: 4px;
        }
        .scrollbar-light::-webkit-scrollbar-thumb:hover {
          background: #9ca3af;
        }
      `}</style>
    </AnimatePresence>
  );
};

export default ScheduleMembers;

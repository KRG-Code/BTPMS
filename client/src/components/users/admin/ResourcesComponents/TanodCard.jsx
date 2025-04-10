import React from "react";
import { motion } from "framer-motion";
import { FaUserCircle, FaEye } from "react-icons/fa";

const TanodCard = ({ tanod, handleViewEquipment, isDarkMode, buttonClass }) => {
  return (
    <motion.div 
      whileHover={{ y: -5, boxShadow: '0 10px 20px rgba(0,0,0,0.1)' }}
      className={`rounded-xl overflow-hidden shadow-md ${
        isDarkMode ? 'bg-gray-750 border border-gray-700' : 'bg-white border border-gray-200'
      }`}
    >
      <div className={`h-24 flex items-center justify-center ${
        isDarkMode ? 'bg-gradient-to-r from-blue-900 to-purple-900' : 'bg-gradient-to-r from-blue-500 to-indigo-500'
      }`}>
        {tanod.profilePicture ? (
          <img
            src={tanod.profilePicture}
            alt={tanod.firstName}
            className="w-20 h-20 rounded-full object-cover border-4 border-white shadow-md"
          />
        ) : (
          <div className="w-20 h-20 rounded-full flex items-center justify-center bg-gray-200 border-4 border-white shadow-md">
            <FaUserCircle className="w-14 h-14 text-gray-400" />
          </div>
        )}
      </div>
      
      <div className="p-4">
        <h3 className={`font-bold text-center truncate ${isDarkMode ? 'text-gray-100' : 'text-gray-800'}`}>
          {tanod.firstName} {tanod.lastName}
        </h3>
        <p className={`text-sm text-center truncate mb-4 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
          {tanod.contactNumber || "No contact info"}
        </p>
        
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => handleViewEquipment(tanod)}
          className={`w-full py-2 rounded-lg flex items-center justify-center ${buttonClass}`}
        >
          <FaEye className="mr-2" />
          View Equipment
        </motion.button>
      </div>
    </motion.div>
  );
};

export default TanodCard;

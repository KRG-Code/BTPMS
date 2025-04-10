import React from "react";
import { motion } from "framer-motion";
import dayjs from "dayjs";
import { FaUserCircle, FaTimes, FaBox, FaHistory, FaCalendarAlt, FaClock, FaCheck } from "react-icons/fa";

const slideUp = {
  hidden: { y: 50, opacity: 0 },
  visible: { y: 0, opacity: 1, transition: { type: "spring", duration: 0.5 } },
  exit: { y: -20, opacity: 0, transition: { duration: 0.2 } }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { duration: 0.3 }
  }
};

const EquipmentModal = ({ 
  selectedTanod, 
  filteredItems, 
  showReturned, 
  setShowReturned, 
  filterDate, 
  setFilterDate,
  loadingEquipments, 
  setShowEquipmentModal, 
  formatDate,
  isDarkMode,
  modalBgClass,
  headerClass,
  inputClass
}) => {
  return (
    <motion.div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm p-4 overflow-y-auto"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div 
        className={`${modalBgClass} rounded-xl shadow-xl w-full max-w-4xl relative flex flex-col max-h-[90vh]`}
        variants={slideUp}
        initial="hidden"
        animate="visible"
        exit="exit"
      >
        <div className={`${headerClass} px-6 py-4 flex items-center justify-between sticky top-0 z-10`}>
          <div className="flex items-center">
            <div className="flex-shrink-0 mr-3">
              {selectedTanod.profilePicture ? (
                <img
                  src={selectedTanod.profilePicture}
                  alt={selectedTanod.firstName}
                  className="w-10 h-10 rounded-full object-cover"
                />
              ) : (
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  isDarkMode ? 'bg-gray-700' : 'bg-gray-200'
                }`}>
                  <FaUserCircle className={`w-8 h-8 ${
                    isDarkMode ? 'text-gray-500' : 'text-gray-400'
                  }`} />
                </div>
              )}
            </div>
            <div>
              <h2 className="text-xl font-bold">
                {selectedTanod.firstName} {selectedTanod.lastName}'s Equipment
              </h2>
              <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                {filteredItems.length} {filteredItems.length === 1 ? 'item' : 'items'} found
              </p>
            </div>
          </div>
          <motion.button
            whileHover={{ scale: 1.1, rotate: 90 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => setShowEquipmentModal(false)}
            className={`p-2 rounded-full ${isDarkMode ? 'bg-gray-700 hover:bg-gray-600 text-gray-300' : 'bg-gray-200 hover:bg-gray-300 text-gray-600'}`}
            aria-label="Close"
          >
            <FaTimes />
          </motion.button>
        </div>
        
        <div className="p-6 overflow-y-auto flex-1">
          {/* Filter Controls */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
            <div className="flex flex-wrap gap-2">
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => setShowReturned(false)}
                className={`px-4 py-2 rounded-lg flex items-center ${!showReturned 
                  ? (isDarkMode ? 'bg-blue-600 text-white' : 'bg-blue-500 text-white') 
                  : (isDarkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-700')
                }`}
              >
                <FaBox className="mr-2" />
                Currently Borrowed
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => setShowReturned(true)}
                className={`px-4 py-2 rounded-lg flex items-center ${showReturned 
                  ? (isDarkMode ? 'bg-blue-600 text-white' : 'bg-blue-500 text-white') 
                  : (isDarkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-700')
                }`}
              >
                <FaHistory className="mr-2" />
                Returned Items
              </motion.button>
            </div>
            
            <div className="flex items-center">
              <FaCalendarAlt className={`mr-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`} />
              <input
                type="date"
                value={filterDate}
                onChange={(e) => setFilterDate(e.target.value)}
                className={`px-3 py-2 rounded-lg border ${inputClass}`}
              />
            </div>
          </div>
          
          {/* Equipment List */}
          {loadingEquipments ? (
            <div className="flex justify-center items-center py-12">
              <div className="loader">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
                <p className="mt-3">Loading equipment data...</p>
              </div>
            </div>
          ) : filteredItems.length === 0 ? (
            <div className={`text-center py-12 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              <FaBox className="mx-auto text-5xl mb-4 opacity-30" />
              <h3 className="text-lg font-medium mb-2">No equipment found</h3>
              <p>{showReturned ? 
                'No items have been returned yet' : 
                'No items are currently borrowed'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {filteredItems.map((item, index) => (
                <motion.div
                  key={index}
                  variants={itemVariants}
                  initial="hidden"
                  animate="visible"
                  className={`rounded-lg overflow-hidden shadow-md border ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}
                >
                  <div className="flex">
                    {/* Item Image */}
                    <div className="w-1/3 h-32">
                      {item.imageUrl ? (
                        <img
                          src={item.imageUrl}
                          alt={item.name}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = 'https://placehold.co/300x300?text=No+Image';
                          }}
                        />
                      ) : (
                        <div className={`w-full h-full flex items-center justify-center ${
                          isDarkMode ? 'bg-gray-700' : 'bg-gray-200'
                        }`}>
                          <FaBox className="text-4xl opacity-30" />
                        </div>
                      )}
                    </div>
                    
                    {/* Item Details */}
                    <div className="w-2/3 p-4">
                      <h3 className="font-bold text-lg mb-2">{item.name}</h3>
                      <div className="space-y-1.5">
                        <div className="flex items-start">
                          <span className={`flex-shrink-0 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                            <FaClock className="mr-1.5 inline" />
                            Borrowed:
                          </span>
                          <span className="ml-2 block">
                            {dayjs(item.borrowDate).format("hh:mm A DD-MM-YYYY")}
                          </span>
                        </div>
                        
                        <div className="flex items-start">
                          <span className={`flex-shrink-0 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                            <FaCheck className="mr-1.5 inline" />
                            Returned:
                          </span>
                          <span className="ml-2 block">
                            {formatDate(item.returnDate)}
                          </span>
                        </div>
                        
                        <div className="mt-3">
                          {item.returnDate === "1970-01-01T00:00:00.000Z" ? (
                            <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
                              isDarkMode ? 'bg-yellow-900 text-yellow-200' : 'bg-yellow-100 text-yellow-800'
                            }`}>
                              Currently Borrowed
                            </span>
                          ) : (
                            <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
                              isDarkMode ? 'bg-green-900 text-green-200' : 'bg-green-100 text-green-800'
                            }`}>
                              Returned
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
};

export default EquipmentModal;

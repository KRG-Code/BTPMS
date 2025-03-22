import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FaUserCircle, FaSearch, FaUserPlus, FaUserMinus, FaTimes } from 'react-icons/fa';

const modalVariants = {
  hidden: { opacity: 0, y: -20, scale: 0.95 },
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
  exit: { opacity: 0, y: 20, scale: 0.95, transition: { duration: 0.2 } }
};

const overlayVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
  exit: { opacity: 0 }
};

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: i => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: i * 0.05,
      duration: 0.2
    }
  })
};

const TanodModal = ({
  showAddTanodModal,
  setShowAddTanodModal,
  showRemoveTanodModal,
  setShowRemoveTanodModal,
  tanods,
  selectedTanods,
  handleToggleCheckbox,
  handleAddSelectedTanods,
  handleRemoveSelectedTanods,
  checkedTanods,
  isDarkMode
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  
  // Filter tanods based on search term
  const filterTanods = (tanodsList) => {
    if (!searchTerm) return tanodsList;
    return tanodsList.filter(tanod => {
      const fullName = `${tanod?.firstName || ''} ${tanod?.lastName || ''}`.toLowerCase();
      return fullName.includes(searchTerm.toLowerCase());
    });
  };

  const filteredAddTanods = filterTanods(tanods.filter(tanod => !selectedTanods.includes(tanod._id)));
  const filteredRemoveTanods = filterTanods(tanods.filter(tanod => selectedTanods.includes(tanod._id)));

  return (
    <>
      {/* Add Tanod Modal */}
      <AnimatePresence>
        {showAddTanodModal && (
          <motion.div
            className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4 backdrop-blur-sm"
            variants={overlayVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            <motion.div
              className={`relative w-full max-w-md rounded-xl shadow-lg overflow-hidden ${
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
                  ? 'bg-gradient-to-r from-green-800 to-green-700' 
                  : 'bg-gradient-to-r from-green-600 to-green-500'
                } px-6 py-4 text-white flex justify-between items-center`}>
                <h2 className="text-xl font-bold flex items-center">
                  <FaUserPlus className="mr-2" />
                  Add Tanods
                </h2>
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setShowAddTanodModal(false)}
                  className="text-white hover:text-gray-200"
                >
                  <FaTimes className="w-5 h-5" />
                </motion.button>
              </div>
              
              {/* Search Bar */}
              <div className="px-6 py-4">
                <div className="relative mb-4">
                  <FaSearch className={`absolute left-3 top-1/2 transform -translate-y-1/2 ${
                    isDarkMode ? 'text-gray-500' : 'text-gray-400'
                  }`} />
                  <input
                    type="text"
                    placeholder="Search tanods..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className={`w-full py-2 pl-10 pr-4 rounded-lg border ${
                      isDarkMode 
                      ? 'bg-[#080917] border-[#1e2048] text-[#e7e8f4] placeholder-gray-500' 
                      : 'bg-white border-gray-200 text-gray-800 placeholder-gray-400'
                    }`}
                  />
                </div>

                {/* Tanod List */}
                <div className={`overflow-y-auto max-h-64 divide-y ${
                  isDarkMode ? 'divide-[#1e2048]' : 'divide-gray-100'
                }`}>
                  {filteredAddTanods.length === 0 ? (
                    <div className={`text-center py-4 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                      {searchTerm ? 'No tanods found matching your search' : 'No tanods available to add'}
                    </div>
                  ) : (
                    filteredAddTanods.map((tanod, index) => (
                      <motion.div
                        key={tanod._id}
                        variants={itemVariants}
                        initial="hidden"
                        animate="visible"
                        custom={index}
                        className={`py-3 flex items-center ${
                          checkedTanods.includes(tanod._id) 
                          ? isDarkMode ? 'bg-[#191f8a20]' : 'bg-blue-50' 
                          : ''
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={checkedTanods.includes(tanod._id)}
                          onChange={() => handleToggleCheckbox(tanod._id)}
                          className={`form-checkbox h-5 w-5 rounded mr-3 ${
                            isDarkMode
                            ? 'bg-[#080917] border-[#1e2048] text-green-500'
                            : 'border-gray-300 text-green-600'
                          }`}
                        />
                        <div className="flex items-center flex-1">
                          {tanod.profilePicture ? (
                            <img
                              src={tanod.profilePicture}
                              alt={`${tanod.firstName} ${tanod.lastName}`}
                              className="w-10 h-10 rounded-full object-cover mr-3"
                            />
                          ) : (
                            <FaUserCircle className={`w-10 h-10 mr-3 ${isDarkMode ? 'text-gray-600' : 'text-gray-400'}`} />
                          )}
                          <span>{tanod.firstName} {tanod.lastName}</span>
                        </div>
                      </motion.div>
                    ))
                  )}
                </div>
              </div>

              {/* Footer */}
              <div className={`px-6 py-4 border-t ${isDarkMode ? 'border-[#1e2048]' : 'border-gray-100'} flex justify-end`}>
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => setShowAddTanodModal(false)}
                  className={`px-4 py-2 rounded-lg mr-2 ${
                    isDarkMode
                    ? 'bg-[#080917] text-[#989ce6] border border-[#1e2048]'
                    : 'bg-gray-200 text-gray-800'
                  }`}
                >
                  Cancel
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={handleAddSelectedTanods}
                  disabled={checkedTanods.length === 0}
                  className={`px-4 py-2 rounded-lg ${
                    isDarkMode 
                    ? 'bg-green-700 hover:bg-green-600 text-white'
                    : 'bg-green-500 hover:bg-green-600 text-white'
                  } ${checkedTanods.length === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  Add {checkedTanods.length > 0 ? `(${checkedTanods.length})` : ''}
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Remove Tanod Modal */}
      <AnimatePresence>
        {showRemoveTanodModal && (
          <motion.div
            className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4 backdrop-blur-sm"
            variants={overlayVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            <motion.div
              className={`relative w-full max-w-md rounded-xl shadow-lg overflow-hidden ${
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
                  ? 'bg-gradient-to-r from-red-800 to-red-700' 
                  : 'bg-gradient-to-r from-red-600 to-red-500'
                } px-6 py-4 text-white flex justify-between items-center`}>
                <h2 className="text-xl font-bold flex items-center">
                  <FaUserMinus className="mr-2" />
                  Remove Tanods
                </h2>
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setShowRemoveTanodModal(false)}
                  className="text-white hover:text-gray-200"
                >
                  <FaTimes className="w-5 h-5" />
                </motion.button>
              </div>
              
              {/* Search Bar */}
              <div className="px-6 py-4">
                <div className="relative mb-4">
                  <FaSearch className={`absolute left-3 top-1/2 transform -translate-y-1/2 ${
                    isDarkMode ? 'text-gray-500' : 'text-gray-400'
                  }`} />
                  <input
                    type="text"
                    placeholder="Search tanods..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className={`w-full py-2 pl-10 pr-4 rounded-lg border ${
                      isDarkMode 
                      ? 'bg-[#080917] border-[#1e2048] text-[#e7e8f4] placeholder-gray-500' 
                      : 'bg-white border-gray-200 text-gray-800 placeholder-gray-400'
                    }`}
                  />
                </div>

                {/* Tanod List */}
                <div className={`overflow-y-auto max-h-64 divide-y ${
                  isDarkMode ? 'divide-[#1e2048]' : 'divide-gray-100'
                }`}>
                  {filteredRemoveTanods.length === 0 ? (
                    <div className={`text-center py-4 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                      {searchTerm ? 'No tanods found matching your search' : 'No tanods selected to remove'}
                    </div>
                  ) : (
                    filteredRemoveTanods.map((tanod, index) => (
                      <motion.div
                        key={tanod._id}
                        variants={itemVariants}
                        initial="hidden"
                        animate="visible"
                        custom={index}
                        className={`py-3 flex items-center ${
                          checkedTanods.includes(tanod._id) 
                          ? isDarkMode ? 'bg-[#8b333320]' : 'bg-red-50' 
                          : ''
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={checkedTanods.includes(tanod._id)}
                          onChange={() => handleToggleCheckbox(tanod._id)}
                          className={`form-checkbox h-5 w-5 rounded mr-3 ${
                            isDarkMode
                            ? 'bg-[#080917] border-[#1e2048] text-red-500'
                            : 'border-gray-300 text-red-600'
                          }`}
                        />
                        <div className="flex items-center flex-1">
                          {tanod.profilePicture ? (
                            <img
                              src={tanod.profilePicture}
                              alt={`${tanod.firstName} ${tanod.lastName}`}
                              className="w-10 h-10 rounded-full object-cover mr-3"
                            />
                          ) : (
                            <FaUserCircle className={`w-10 h-10 mr-3 ${isDarkMode ? 'text-gray-600' : 'text-gray-400'}`} />
                          )}
                          <span>{tanod.firstName} {tanod.lastName}</span>
                        </div>
                      </motion.div>
                    ))
                  )}
                </div>
              </div>

              {/* Footer */}
              <div className={`px-6 py-4 border-t ${isDarkMode ? 'border-[#1e2048]' : 'border-gray-100'} flex justify-end`}>
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => setShowRemoveTanodModal(false)}
                  className={`px-4 py-2 rounded-lg mr-2 ${
                    isDarkMode
                    ? 'bg-[#080917] text-[#989ce6] border border-[#1e2048]'
                    : 'bg-gray-200 text-gray-800'
                  }`}
                >
                  Cancel
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={handleRemoveSelectedTanods}
                  disabled={checkedTanods.length === 0}
                  className={`px-4 py-2 rounded-lg ${
                    isDarkMode 
                    ? 'bg-red-700 hover:bg-red-600 text-white'
                    : 'bg-red-500 hover:bg-red-600 text-white'
                  } ${checkedTanods.length === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  Remove {checkedTanods.length > 0 ? `(${checkedTanods.length})` : ''}
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default TanodModal;
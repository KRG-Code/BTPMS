import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FaFilter, FaSearch } from "react-icons/fa";

const slideUp = {
  hidden: { y: 20, opacity: 0 },
  visible: i => ({
    y: 0, 
    opacity: 1, 
    transition: { delay: i * 0.1, duration: 0.4 }
  })
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05
    }
  }
};

const EquipmentFilter = ({
  showFilters,
  searchQuery,
  setSearchQuery,
  filterDate,
  setFilterDate,
  showReturned,
  setShowReturned,
  isDarkMode,
  inputBg,
  inputText,
  cardBg,
  borderColor,
  textColor,
  subTextColor,
  buttonPrimary,
  buttonSecondary
}) => {
  return (
    <AnimatePresence>
      {showFilters && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          className="overflow-hidden mb-6"
        >
          <motion.div 
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
            className={`p-4 rounded-xl ${cardBg} border ${borderColor} shadow-md`}
          >
            <motion.h2 
              variants={slideUp} 
              custom={0} 
              className={`text-lg font-semibold mb-4 flex items-center ${textColor}`}
            >
              <FaFilter className="mr-2" /> Filter Equipment
            </motion.h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <motion.div variants={slideUp} custom={1} className="flex flex-col">
                <label className={`text-sm font-medium mb-1.5 ${subTextColor}`}>Search Items</label>
                <div className="relative">
                  <FaSearch className="absolute left-3 top-2.5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search by name..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className={`w-full pl-9 pr-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${inputBg} ${inputText}`}
                  />
                </div>
              </motion.div>
              
              <motion.div variants={slideUp} custom={2} className="flex flex-col">
                <label className={`text-sm font-medium mb-1.5 ${subTextColor}`}>Filter by Date</label>
                <input
                  type="date"
                  value={filterDate}
                  onChange={(e) => setFilterDate(e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${inputBg} ${inputText}`}
                />
              </motion.div>
              
              <motion.div variants={slideUp} custom={3} className="flex flex-col">
                <label className={`text-sm font-medium mb-1.5 ${subTextColor}`}>Status</label>
                <div className="flex space-x-2">
                  <button
                    onClick={() => setShowReturned(false)}
                    className={`flex-1 py-2 px-3 rounded-lg ${!showReturned 
                      ? buttonPrimary + ' text-white' 
                      : buttonSecondary + ` ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}`}
                  >
                    Borrowed
                  </button>
                  <button
                    onClick={() => setShowReturned(true)}
                    className={`flex-1 py-2 px-3 rounded-lg ${showReturned 
                      ? buttonPrimary + ' text-white' 
                      : buttonSecondary + ` ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}`}
                  >
                    Returned
                  </button>
                </div>
              </motion.div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default EquipmentFilter;

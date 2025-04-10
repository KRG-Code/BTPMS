import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FaCheck, FaImage, FaPlus, FaTimes } from "react-icons/fa";

const EquipmentForm = ({
  showForm,
  handleSubmit,
  selectedItem,
  handleItemSelection,
  inventory,
  alreadyBorrowed,
  selectedInventoryItem,
  setShowForm,
  setSelectedItem,
  setSelectedInventoryItem,
  setAlreadyBorrowed,
  isDarkMode,
  cardBg,
  borderColor,
  textColor,
  subTextColor,
  inputBg,
  inputText,
  buttonPrimary,
  buttonSecondary,
  formVariants
}) => {
  return (
    <AnimatePresence>
      {showForm && (
        <motion.div
          initial="hidden"
          animate="visible"
          exit="exit"
          variants={formVariants}
          className={`mb-6 ${cardBg} rounded-lg shadow-lg border ${borderColor} overflow-hidden`}
        >
          <div className={`${isDarkMode ? 'bg-gray-900/50' : 'bg-gray-50'} px-4 py-3 border-b ${borderColor}`}>
            <h2 className={`text-lg font-semibold ${textColor} flex items-center`}>
              <FaPlus className="mr-2" />
              Borrow Equipment
            </h2>
          </div>
          
          <form onSubmit={handleSubmit} className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className={`block text-sm font-medium mb-2 ${subTextColor}`}>
                  Select Equipment
                </label>
                <select
                  value={selectedItem}
                  onChange={(e) => handleItemSelection(e.target.value)}
                  required
                  className={`w-full px-3 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${inputBg} ${inputText}`}
                >
                  <option value="">-- Select Item --</option>
                  {inventory.map((item) => (
                    <option 
                      key={item._id} 
                      value={item._id}
                      disabled={item.quantity <= 0}
                    >
                      {item.name} (Available: {item.quantity})
                    </option>
                  ))}
                </select>
                
                {alreadyBorrowed && selectedInventoryItem && (
                  <p className="text-red-500 mt-1 text-sm">
                    You already have a {selectedInventoryItem.name} checked out.
                    Please return it first.
                  </p>
                )}
              </div>
              
              <div>
                <label className={`block text-sm font-medium mb-2 ${subTextColor}`}>
                  Item Preview
                </label>
                <div className={`border ${borderColor} rounded-lg p-4 h-32 flex items-center justify-center`}>
                  {selectedInventoryItem ? (
                    <div className="text-center">
                      <img 
                        src={selectedInventoryItem.imageUrl || 'https://placehold.co/100x100?text=No+Image'} 
                        alt={selectedInventoryItem.name} 
                        className="h-20 mx-auto object-contain rounded mb-2" 
                      />
                      <p className={`text-sm font-medium ${textColor}`}>{selectedInventoryItem.name}</p>
                    </div>
                  ) : (
                    <div className="text-center">
                      <FaImage className={`text-4xl mb-2 mx-auto ${subTextColor}`} />
                      <p className={`text-sm ${subTextColor}`}>
                        Select an item to see preview
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            <div className="flex justify-end space-x-3 mt-6">
              <motion.button
                type="button"
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => {
                  setShowForm(false);
                  setSelectedItem("");
                  setSelectedInventoryItem(null);
                  setAlreadyBorrowed(false);
                }}
                className={`py-2 px-4 rounded-lg ${buttonSecondary} ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}
              >
                <FaTimes className="mr-2 inline" />
                Cancel
              </motion.button>
              
              <motion.button
                type="submit"
                disabled={!selectedInventoryItem || alreadyBorrowed}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                className={`py-2 px-5 rounded-lg ${
                  selectedInventoryItem && !alreadyBorrowed
                    ? buttonPrimary 
                    : isDarkMode ? 'bg-gray-700 cursor-not-allowed' : 'bg-gray-300 cursor-not-allowed'
                } text-white`}
              >
                <FaCheck className="mr-2 inline" />
                Borrow Item
              </motion.button>
            </div>
          </form>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default EquipmentForm;

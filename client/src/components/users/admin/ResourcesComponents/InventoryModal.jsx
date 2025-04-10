import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FaBox, FaTimes, FaSync, FaChevronUp, FaChevronDown, FaPlus, FaEdit, FaTrash } from "react-icons/fa";
import InventoryForm from "./InventoryForm";

const slideUp = {
  hidden: { y: 50, opacity: 0 },
  visible: { y: 0, opacity: 1, transition: { type: "spring", duration: 0.5 } },
  exit: { y: -20, opacity: 0, transition: { duration: 0.2 } }
};

const InventoryModal = ({ 
  inventoryItems,
  showItemForm,
  toggleItemForm,
  resetForm,
  handleEditItem,
  handleDeleteItem,
  handleResetItemTotal,
  refreshInventory,
  editMode,
  newItem,
  setNewItem,
  handleAddOrUpdateItem,
  handleItemImageChange,
  imagePreview,
  itemImageFile,
  uploadingImage,
  currentItem,
  setShowInventoryModal,
  isDarkMode,
  modalBgClass,
  headerClass,
  tableHeaderClass,
  secondaryButtonClass,
  inputClass
}) => {
  return (
    <motion.div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm p-4 overflow-y-auto"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={() => setShowInventoryModal(false)}
    >
      <motion.div 
        className={`${modalBgClass} rounded-xl shadow-xl w-full max-w-4xl relative max-h-[90vh] flex flex-col`}
        variants={slideUp}
        initial="hidden"
        animate="visible"
        exit="exit"
        onClick={(e) => e.stopPropagation()}
      >
        <div className={`${headerClass} px-6 py-4 flex items-center justify-between sticky top-0 z-10`}>
          <div className="flex items-center">
            <FaBox className="mr-2" />
            <h2 className="text-xl font-bold">Inventory Management</h2>
          </div>
          <div className="flex items-center space-x-2">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={refreshInventory}
              className={`px-3 py-1 rounded-md flex items-center ${
                isDarkMode ? 'bg-blue-700 hover:bg-blue-600 text-white' : 'bg-blue-500 hover:bg-blue-600 text-white'
              }`}
              title="Refresh inventory data"
            >
              <FaSync className="mr-1" size={12} />
              Refresh
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.1, rotate: 90 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => {
                setShowInventoryModal(false);
                resetForm();
              }}
              className={`p-2 rounded-full ${isDarkMode ? 'bg-gray-700 hover:bg-gray-600 text-gray-300' : 'bg-gray-200 hover:bg-gray-300 text-gray-600'}`}
              aria-label="Close"
            >
              <FaTimes />
            </motion.button>
          </div>
        </div>
        
        <div className="p-6 overflow-y-auto flex-1">
          {/* Toggle form button */}
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={toggleItemForm}
            className={`w-full mb-4 px-4 py-3 rounded-lg flex items-center justify-center ${
              showItemForm
                ? (isDarkMode ? 'bg-gray-700 text-white' : 'bg-gray-200 text-gray-800')
                : (isDarkMode ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'bg-blue-500 hover:bg-blue-600 text-white')
            }`}
          >
            {showItemForm ? (
              <>
                <FaChevronUp className="mr-2" />
                {editMode ? 'Cancel Edit' : 'Hide Form'}
              </>
            ) : (
              <>
                <FaPlus className="mr-2" />
                Add New Item
              </>
            )}
          </motion.button>
          
          {/* Add/Edit Item Form */}
          <AnimatePresence>
            {showItemForm && (
              <InventoryForm
                editMode={editMode}
                newItem={newItem}
                setNewItem={setNewItem}
                handleAddOrUpdateItem={handleAddOrUpdateItem}
                handleItemImageChange={handleItemImageChange}
                resetForm={resetForm}
                imagePreview={imagePreview}
                itemImageFile={itemImageFile}
                uploadingImage={uploadingImage}
                isDarkMode={isDarkMode}
                inputClass={inputClass}
                secondaryButtonClass={secondaryButtonClass}
                currentItem={currentItem}
              />
            )}
          </AnimatePresence>
          
          <h3 className={`text-lg font-semibold mb-4 pb-2 border-b ${isDarkMode ? 'text-gray-200 border-gray-700' : 'text-gray-800 border-gray-200'}`}>
            Inventory Items
          </h3>
          
          {inventoryItems.length === 0 ? (
            <div className={`text-center py-8 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              <FaBox className="mx-auto text-4xl mb-3 opacity-30" />
              <p>No items in inventory</p>
              <p className="text-sm mt-2">Add your first item using the form above</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className={`w-full ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                <thead className={tableHeaderClass}>
                  <tr>
                    <th className="py-3 px-4 text-left">Image</th>
                    <th className="py-3 px-4 text-left">Item Name</th>
                    <th className="py-3 px-4 text-center">Available</th>
                    <th className="py-3 px-4 text-center">Borrowed</th>
                    <th className="py-3 px-4 text-center">Total</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className={isDarkMode ? 'divide-y divide-gray-700' : 'divide-y divide-gray-200'}>
                  {inventoryItems.map((item) => (
                    <motion.tr 
                      key={item._id}
                      whileHover={{ backgroundColor: isDarkMode ? 'rgba(55, 65, 81, 0.3)' : 'rgba(249, 250, 251, 0.8)' }}
                      layout
                    >
                      <td className="py-3 px-4">
                        <div className="w-12 h-12 rounded overflow-hidden flex items-center justify-center">
                          {item.imageUrl ? (
                            <img 
                              src={item.imageUrl} 
                              alt={item.name} 
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className={`w-full h-full flex items-center justify-center ${
                              isDarkMode ? 'bg-gray-700' : 'bg-gray-200'
                            }`}>
                              <FaBox className={`${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`} />
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4">{item.name}</td>
                      <td className="py-3 px-4 text-center">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          item.quantity > 0 
                            ? isDarkMode ? 'bg-green-900 text-green-200' : 'bg-green-100 text-green-800'
                            : isDarkMode ? 'bg-red-900 text-red-200' : 'bg-red-100 text-red-800'
                        }`}>
                          {item.quantity}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          isDarkMode ? 'bg-blue-900 text-blue-200' : 'bg-blue-100 text-blue-800'
                        }`}>
                          {item.currentlyBorrowed}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">{item.total}</td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex justify-end space-x-2">
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => handleEditItem(item)}
                            className={`p-1.5 rounded-full ${
                              isDarkMode ? 'bg-yellow-800 hover:bg-yellow-700 text-yellow-200' : 'bg-yellow-100 hover:bg-yellow-200 text-yellow-700'
                            }`}
                            aria-label="Edit"
                          >
                            <FaEdit />
                          </motion.button>
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => handleDeleteItem(item._id)}
                            className={`p-1.5 rounded-full ${
                              isDarkMode ? 'bg-red-800 hover:bg-red-700 text-red-200' : 'bg-red-100 hover:bg-red-200 text-red-700'
                            }`}
                            aria-label="Delete"
                          >
                            <FaTrash />
                          </motion.button>
                          {item.total !== (item.quantity + (item.currentlyBorrowed || 0)) && (
                            <motion.button
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                              onClick={() => handleResetItemTotal(item._id)}
                              title="Fix quantity calculation"
                              className={`p-1.5 rounded-full ${
                                isDarkMode ? 'bg-blue-800 hover:bg-blue-700 text-blue-200' : 'bg-blue-100 hover:bg-blue-200 text-blue-700'
                              }`}
                            >
                              <FaSync size={12} />
                            </motion.button>
                          )}
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
};

export default InventoryModal;

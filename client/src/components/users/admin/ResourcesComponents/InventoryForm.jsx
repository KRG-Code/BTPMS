import React from "react";
import { motion } from "framer-motion";
import { FaTimes, FaEdit, FaPlus, FaImage, FaCloudUploadAlt } from "react-icons/fa";

const InventoryForm = ({ 
  editMode, 
  newItem, 
  setNewItem, 
  handleAddOrUpdateItem, 
  handleItemImageChange, 
  resetForm, 
  imagePreview, 
  itemImageFile, 
  uploadingImage,
  isDarkMode,
  inputClass,
  secondaryButtonClass,
  currentItem
}) => {
  return (
    <motion.form 
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ duration: 0.3 }}
      onSubmit={handleAddOrUpdateItem} 
      className="mb-8 overflow-hidden"
    >
      <div className={`p-4 rounded-lg mb-6 ${isDarkMode ? 'bg-gray-750 border border-gray-700' : 'bg-gray-50 border border-gray-200'}`}>
        <h3 className={`text-lg font-semibold mb-4 ${isDarkMode ? 'text-blue-300' : 'text-blue-600'}`}>
          {editMode ? 'Edit Inventory Item' : 'Add New Item'}
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              Item Name
            </label>
            <input
              type="text"
              placeholder="Enter item name"
              value={newItem.name}
              onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
              className={`w-full px-4 py-2 rounded-lg border focus:ring-2 focus:ring-blue-500 ${inputClass}`}
            />
          </div>
          
          {/* Update the quantity label to be clear */}
          <div>
            <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              Total Quantity (Available + Borrowed)
            </label>
            <input
              type="number"
              placeholder="Enter total quantity"
              value={newItem.quantity}
              onChange={(e) => setNewItem({ ...newItem, quantity: e.target.value })}
              className={`w-full px-4 py-2 rounded-lg border focus:ring-2 focus:ring-blue-500 ${inputClass}`}
            />
            {editMode && currentItem?.currentlyBorrowed > 0 && (
              <p className="text-xs mt-1 text-blue-500">
                Note: {currentItem.currentlyBorrowed} item(s) are currently borrowed. 
                Available will be set to {Math.max(0, Number(newItem.quantity) - currentItem.currentlyBorrowed)}.
              </p>
            )}
          </div>
        </div>
        
        {/* Image Upload Section */}
        <div className="mt-6">
          <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
            Item Image
          </label>
          
          <div className="flex items-center space-x-6">
            <div className={`w-24 h-24 rounded-lg overflow-hidden flex items-center justify-center ${isDarkMode ? 'bg-gray-800' : 'bg-gray-200'}`}>
              {imagePreview ? (
                <img 
                  src={imagePreview} 
                  alt="Item Preview" 
                  className="w-full h-full object-cover"
                />
              ) : (
                <FaImage className={`w-10 h-10 ${isDarkMode ? 'text-gray-600' : 'text-gray-400'}`} />
              )}
            </div>
            
            <label className={`flex items-center justify-center px-4 py-2 rounded-lg cursor-pointer ${
              isDarkMode 
                ? 'bg-gray-700 hover:bg-gray-600 text-gray-200' 
                : 'bg-gray-200 hover:bg-gray-300 text-gray-800'
            }`}>
              <FaCloudUploadAlt className="mr-2" />
              {imagePreview ? 'Change Image' : 'Upload Image'}
              <input 
                type="file" 
                accept="image/*" 
                onChange={handleItemImageChange} 
                className="hidden" 
              />
            </label>
            
            {itemImageFile && (
              <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                {itemImageFile.name}
              </p>
            )}
          </div>
        </div>
        
        <div className="flex justify-end space-x-3 mt-6">
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            type="button"
            onClick={resetForm}
            className={`px-4 py-2 rounded-lg ${secondaryButtonClass}`}
          >
            <FaTimes className="mr-2 inline" />
            Cancel
          </motion.button>
          
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            type="submit"
            disabled={uploadingImage}
            className={`px-4 py-2 rounded-lg flex items-center ${
              editMode 
              ? (isDarkMode ? 'bg-yellow-600 hover:bg-yellow-700 text-white' : 'bg-yellow-500 hover:bg-yellow-600 text-white')
              : (isDarkMode ? 'bg-green-600 hover:bg-green-700 text-white' : 'bg-green-500 hover:bg-green-600 text-white')
            } ${uploadingImage ? 'opacity-70 cursor-not-allowed' : ''}`}
          >
            {uploadingImage ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Processing...
              </>
            ) : editMode ? (
              <>
                <FaEdit className="mr-2" />
                Update Item
              </>
            ) : (
              <>
                <FaPlus className="mr-2" />
                Add Item
              </>
            )}
          </motion.button>
        </div>
      </div>
    </motion.form>
  );
};

export default InventoryForm;

import React, { useState, useEffect } from "react";
import axios from "axios";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import dayjs from "dayjs";
import customParseFormat from "dayjs/plugin/customParseFormat";
import { motion, AnimatePresence } from "framer-motion";
import { 
  FaUserCircle, 
  FaBox, 
  FaPlus, 
  FaTimes, 
  FaEdit, 
  FaTrash, 
  FaEye, 
  FaExchangeAlt,
  FaCalendarAlt,
  FaArrowLeft,
  FaCheck,
  FaClock,
  FaHistory,
  FaUserShield  // Added FaUserShield to the imports
} from "react-icons/fa";
import { useTheme } from "../../../contexts/ThemeContext";  // Fixed import path

dayjs.extend(customParseFormat);

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: { 
    opacity: 1,
    transition: { 
      when: "beforeChildren",
      staggerChildren: 0.1
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { duration: 0.3 }
  }
};

const fadeIn = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.4 } },
  exit: { opacity: 0, transition: { duration: 0.2 } }
};

const slideUp = {
  hidden: { y: 50, opacity: 0 },
  visible: { y: 0, opacity: 1, transition: { type: "spring", duration: 0.5 } },
  exit: { y: -20, opacity: 0, transition: { duration: 0.2 } }
};

export default function Resources() {
  const { isDarkMode } = useTheme();
  const [tanods, setTanods] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedTanod, setSelectedTanod] = useState(null);
  const [equipments, setEquipments] = useState([]);
  const [inventoryItems, setInventoryItems] = useState([]);
  const [showInventoryModal, setShowInventoryModal] = useState(false);
  const [showEquipmentModal, setShowEquipmentModal] = useState(false);
  const [showReturned, setShowReturned] = useState(false);
  const [filterDate, setFilterDate] = useState("");
  const [loadingEquipments, setLoadingEquipments] = useState(false);
  const [newItem, setNewItem] = useState({ name: "", quantity: "" });
  const [editMode, setEditMode] = useState(false);
  const [currentItemId, setCurrentItemId] = useState(null);
  const [viewMode, setViewMode] = useState("grid"); // "grid" or "table"

  const baseURL = `${process.env.REACT_APP_API_URL}`;
  let deleteToastId = null;

  // Fetch tanods and inventory data
  useEffect(() => {
    const fetchTanods = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        toast.error("Please log in.");
        return;
      }

      try {
        setLoading(true);
        const response = await axios.get(`${baseURL}/auth/users`, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });

        const tanodsList = response.data.filter(
          (user) => user.userType === "tanod"
        );
        setTanods(tanodsList);
      } catch (error) {
        toast.error("Error fetching Tanods.");
      } finally {
        setLoading(false);
      }
    };

    const fetchInventory = async () => {
      try {
        const response = await axios.get(`${baseURL}/auth/inventory`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        });

        const inventoryWithBorrowed = response.data.map((item) => ({
          ...item,
          currentlyBorrowed: item.total - item.quantity,
        }));

        setInventoryItems(inventoryWithBorrowed);
      } catch (error) {
        toast.error("Failed to load inventory items.");
      }
    };

    fetchTanods();
    fetchInventory();
  }, [baseURL]);

  // Add or update inventory item
  const handleAddOrUpdateItem = async (e) => {
    e.preventDefault();
    if (!newItem.name || !newItem.quantity) {
      toast.error("Please provide item name and quantity.");
      return;
    }

    try {
      if (editMode) {
        const response = await axios.put(
          `${baseURL}/auth/inventory/${currentItemId}`,
          newItem,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          }
        );
        setInventoryItems((prevItems) =>
          prevItems.map((item) =>
            item._id === currentItemId ? response.data : item
          )
        );
        toast.success("Item updated successfully.");
      } else {
        const response = await axios.post(
          `${baseURL}/auth/inventory`,
          newItem,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          }
        );
        setInventoryItems([...inventoryItems, response.data]);
        toast.success("Item added to inventory.");
      }

      setNewItem({ name: "", quantity: "" });
      setEditMode(false);
      setCurrentItemId(null);
    } catch (error) {
      toast.error("Failed to add or update item.");
    }
  };

  // Edit an inventory item
  const handleEditItem = (item) => {
    setEditMode(true);
    setNewItem({ name: item.name, quantity: item.quantity });
    setCurrentItemId(item._id);
  };

  // Handle delete item action with confirmation
  const handleDeleteItem = (itemId) => {
    deleteToastId = toast.info(
      <div className="flex flex-col space-y-2">
        <p className="text-center mb-2">Are you sure you want to delete this item?</p>
        <div className="flex justify-center space-x-3">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className={`px-3 py-1 rounded-md ${isDarkMode ? 'bg-red-600 hover:bg-red-700' : 'bg-red-500 hover:bg-red-600'} text-white`}
            onClick={() => confirmDeleteItem(itemId)}
          >
            Yes, Delete
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className={`px-3 py-1 rounded-md ${isDarkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300'} text-gray-800`}
            onClick={() => toast.dismiss(deleteToastId)}
          >
            Cancel
          </motion.button>
        </div>
      </div>,
      { 
        autoClose: false,
        closeButton: false,
        draggable: false
      }
    );
  };

  // Confirm deletion of inventory item
  const confirmDeleteItem = async (itemId) => {
    try {
      await axios.delete(`${baseURL}/auth/inventory/${itemId}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      setInventoryItems((prevItems) =>
        prevItems.filter((item) => item._id !== itemId)
      );
      toast.success("Item deleted successfully.");
    } catch (error) {
      toast.error("Failed to delete item.");
    } finally {
      toast.dismiss(deleteToastId);
      deleteToastId = null;
    }
  };

  // Fetch borrowed equipment for a specific tanod
  const fetchEquipment = async (tanodId) => {
    const token = localStorage.getItem("token");
    if (!token) {
      toast.error("Please log in.");
      return;
    }

    try {
      setLoadingEquipments(true);
      const response = await axios.get(
        `${baseURL}/equipments/user/${tanodId}/equipments`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setEquipments(response.data);
    } catch (error) {
      toast.error("No Borrowed Equipments");
      setEquipments([]);
    } finally {
      setLoadingEquipments(false);
    }
  };

  // View equipment borrowed by a tanod
  const handleViewEquipment = (tanod) => {
    setSelectedTanod(tanod);
    setEquipments([]);
    fetchEquipment(tanod._id);
    setShowEquipmentModal(true);
  };

  // Filter items by return status and date
  const filteredItems = equipments.filter(
    (item) =>
      (showReturned
        ? item.returnDate !== "1970-01-01T00:00:00.000Z"
        : item.returnDate === "1970-01-01T00:00:00.000Z") &&
      (!filterDate || dayjs(item.returnDate).isSame(dayjs(filterDate), "day"))
  );

  // Format date display
  const formatDate = (date) => {
    const notReturnedDate = "1970-01-01T00:00:00.000Z";
    return date === notReturnedDate ? (
      <span className={`${isDarkMode ? 'text-red-400' : 'text-red-500'} font-semibold`}>
        Not Yet Returned
      </span>
    ) : (
      dayjs(date).format("MMM DD, YYYY - hh:mm A")
    );
  };

  // Theme-aware styles
  const cardBgClass = isDarkMode ? 'bg-gray-800 text-gray-200' : 'bg-white text-gray-800';
  const buttonClass = isDarkMode 
    ? 'bg-blue-600 hover:bg-blue-700 text-white' 
    : 'bg-blue-500 hover:bg-blue-600 text-white';
  const secondaryButtonClass = isDarkMode
    ? 'bg-gray-700 hover:bg-gray-600 text-gray-200'
    : 'bg-gray-200 hover:bg-gray-300 text-gray-800';
  const inputClass = isDarkMode
    ? 'bg-gray-700 border-gray-600 text-gray-200 focus:border-blue-500'
    : 'bg-white border-gray-300 text-gray-700 focus:border-blue-500';
  const modalBgClass = isDarkMode
    ? 'bg-gray-900 text-gray-200 border border-gray-700'
    : 'bg-white text-gray-800 border border-gray-300';
  const headerClass = isDarkMode
    ? 'bg-gray-800 text-gray-200 border-b border-gray-700'
    : 'bg-gray-50 text-gray-800 border-b border-gray-200';
  const tableHeaderClass = isDarkMode
    ? 'bg-gray-800 text-gray-200 border-b border-gray-700'
    : 'bg-gray-50 text-gray-700 border-b border-gray-200';
  
  return (
    <motion.div 
      className={`container mx-auto px-4 sm:px-6 lg:px-8 py-6 ${isDarkMode ? 'bg-gray-900' : 'bg-gray-100'}`}
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <ToastContainer 
        position="top-right"
        theme={isDarkMode ? "dark" : "light"}
        closeOnClick
        pauseOnHover
      />
      
      {/* Header Section */}
      <motion.div 
        className="flex flex-col md:flex-row md:items-center md:justify-between mb-8 gap-4"
        variants={itemVariants}
      >
        <div>
          <h1 className={`text-3xl font-bold mb-2 ${isDarkMode ? 'text-gray-100' : 'text-gray-800'}`}>
            Resource Management
          </h1>
          <p className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            Manage personnel and equipment inventory
          </p>
        </div>
        
        <div className="flex flex-wrap gap-3">
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => setShowInventoryModal(!showInventoryModal)}
            className={`px-4 py-2 rounded-lg shadow flex items-center ${buttonClass}`}
          >
            <FaBox className="mr-2" />
            Manage Inventory
          </motion.button>
          
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => setViewMode(viewMode === 'grid' ? 'table' : 'grid')}
            className={`px-4 py-2 rounded-lg shadow flex items-center ${secondaryButtonClass}`}
          >
            <FaExchangeAlt className="mr-2" />
            {viewMode === 'grid' ? 'Table View' : 'Grid View'}
          </motion.button>
        </div>
      </motion.div>
      
      {/* Tanod Personnel Section */}
      <motion.div
        variants={itemVariants}
        className={`rounded-xl shadow-lg overflow-hidden mb-8 ${cardBgClass}`}
      >
        <div className={`${headerClass} px-6 py-4 flex items-center`}>
          <FaUserShield className="mr-2" />
          <h2 className="text-xl font-bold">Tanod Personnel</h2>
          <span className={`ml-3 px-3 py-1 text-sm rounded-full ${
            isDarkMode ? 'bg-blue-900 text-blue-200' : 'bg-blue-100 text-blue-800'
          }`}>
            {tanods.length}
          </span>
        </div>
        
        {loading ? (
          <div className="flex justify-center items-center p-12">
            <div className="loader">
              <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500"></div>
              <p className="mt-4">Loading personnel data...</p>
            </div>
          </div>
        ) : tanods.length === 0 ? (
          <div className="p-12 text-center">
            <p className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'} mb-4`}>No tanod personnel found</p>
          </div>
        ) : (
          <>
            {viewMode === 'grid' ? (
              <div className="p-6 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {tanods.map((tanod) => (
                  <TanodCard 
                    key={tanod._id} 
                    tanod={tanod} 
                    handleViewEquipment={handleViewEquipment} 
                    isDarkMode={isDarkMode}
                    buttonClass={buttonClass}
                  />
                ))}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead className={tableHeaderClass}>
                    <tr>
                      <th className="py-3 px-6 text-left">Profile</th>
                      <th className="py-3 px-6 text-left">Full Name</th>
                      <th className="py-3 px-6 text-left">Contact</th>
                      <th className="py-3 px-6 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className={isDarkMode ? 'divide-y divide-gray-700' : 'divide-y divide-gray-200'}>
                    {tanods.map((tanod) => (
                      <motion.tr 
                        key={tanod._id} 
                        className={isDarkMode ? 'hover:bg-gray-750' : 'hover:bg-gray-50'}
                        whileHover={{ backgroundColor: isDarkMode ? 'rgba(55, 65, 81, 0.3)' : 'rgba(249, 250, 251, 0.8)' }}
                      >
                        <td className="py-4 px-6 whitespace-nowrap">
                          <div className="flex items-center">
                            {tanod.profilePicture ? (
                              <img
                                src={tanod.profilePicture}
                                alt={tanod.firstName}
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
                        </td>
                        <td className="py-4 px-6">
                          {`${tanod.firstName} ${tanod.middleName || ""} ${tanod.lastName}`}
                        </td>
                        <td className="py-4 px-6">
                          {tanod.contactNumber || "N/A"}
                        </td>
                        <td className="py-4 px-6 text-center">
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => handleViewEquipment(tanod)}
                            className={`px-3 py-1.5 rounded flex items-center justify-center mx-auto ${buttonClass}`}
                          >
                            <FaEye className="mr-1.5" />
                            View Equipment
                          </motion.button>
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </motion.div>
      
      {/* Inventory Modal */}
      <AnimatePresence>
        {showInventoryModal && (
          <motion.div 
            className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div 
              className={`${modalBgClass} rounded-xl shadow-xl w-full max-w-4xl relative overflow-hidden`}
              variants={slideUp}
              initial="hidden"
              animate="visible"
              exit="exit"
            >
              <div className={`${headerClass} px-6 py-4 flex items-center justify-between`}>
                <div className="flex items-center">
                  <FaBox className="mr-2" />
                  <h2 className="text-xl font-bold">Inventory Management</h2>
                </div>
                <motion.button
                  whileHover={{ scale: 1.1, rotate: 90 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => {
                    setShowInventoryModal(false);
                    setEditMode(false);
                    setNewItem({ name: "", quantity: "" });
                  }}
                  className={`p-2 rounded-full ${isDarkMode ? 'bg-gray-700 hover:bg-gray-600 text-gray-300' : 'bg-gray-200 hover:bg-gray-300 text-gray-600'}`}
                  aria-label="Close"
                >
                  <FaTimes />
                </motion.button>
              </div>
              
              <div className="p-6">
                <form onSubmit={handleAddOrUpdateItem} className="mb-8">
                  <div className="mb-6">
                    <h3 className={`text-lg font-semibold mb-4 ${isDarkMode ? 'text-blue-300' : 'text-blue-600'}`}>
                      {editMode ? 'Edit Inventory Item' : 'Add New Item'}
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="md:col-span-2">
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
                      <div>
                        <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                          Quantity
                        </label>
                        <input
                          type="number"
                          placeholder="Enter quantity"
                          value={newItem.quantity}
                          onChange={(e) => setNewItem({ ...newItem, quantity: e.target.value })}
                          className={`w-full px-4 py-2 rounded-lg border focus:ring-2 focus:ring-blue-500 ${inputClass}`}
                        />
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex justify-end space-x-3">
                    {editMode && (
                      <motion.button
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.97 }}
                        type="button"
                        onClick={() => {
                          setEditMode(false);
                          setNewItem({ name: "", quantity: "" });
                        }}
                        className={`px-4 py-2 rounded-lg ${secondaryButtonClass}`}
                      >
                        Cancel Edit
                      </motion.button>
                    )}
                    <motion.button
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.97 }}
                      type="submit"
                      className={`px-4 py-2 rounded-lg flex items-center ${editMode ? 
                        (isDarkMode ? 'bg-yellow-600 hover:bg-yellow-700 text-white' : 'bg-yellow-500 hover:bg-yellow-600 text-white') : 
                        (isDarkMode ? 'bg-green-600 hover:bg-green-700 text-white' : 'bg-green-500 hover:bg-green-600 text-white')
                      }`}
                    >
                      {editMode ? (
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
                </form>
                
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
        )}
      </AnimatePresence>

      {/* Equipment Modal */}
      <AnimatePresence>
        {showEquipmentModal && selectedTanod && (
          <motion.div 
            className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div 
              className={`${modalBgClass} rounded-xl shadow-xl w-full max-w-4xl relative overflow-hidden`}
              variants={slideUp}
              initial="hidden"
              animate="visible"
              exit="exit"
            >
              <div className={`${headerClass} px-6 py-4 flex items-center justify-between`}>
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
                      Manage borrowed and returned items
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
              
              <div className="p-6">
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
                          <div className="w-1/3">
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
                                  {formatDate(item.borrowDate)}
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
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// Tanod Card Component
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

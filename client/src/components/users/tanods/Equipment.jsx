import React, { useState, useEffect } from "react";
import axios from "axios";
import { storage } from "../../../firebase";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import dayjs from "dayjs";
import customParseFormat from "dayjs/plugin/customParseFormat";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "../../../contexts/ThemeContext";
import {
  FaPlus,
  FaTimes,
  FaCalendarAlt,
  FaExchangeAlt,
  FaUpload,
  FaArrowLeft,
  FaImage,
  FaCheck,
  FaSearch,
  FaFilter,
  FaExclamationTriangle,
} from "react-icons/fa";

dayjs.extend(customParseFormat);

// Animation variants
const fadeIn = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.4 } }
};

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

const tableRowVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3 } }
};

const formVariants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.3 } },
  exit: { opacity: 0, scale: 0.95, transition: { duration: 0.2 } }
};

const Equipment = () => {
  const [items, setItems] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [newItem, setNewItem] = useState({ image: null });
  const [imagePreview, setImagePreview] = useState(null);
  const [selectedItem, setSelectedItem] = useState("");
  const [showReturned, setShowReturned] = useState(false);
  const [filterDate, setFilterDate] = useState("");
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const { isDarkMode } = useTheme();

  const baseURL = `${process.env.REACT_APP_API_URL}`;

  // Theme-aware styles
  const cardBg = isDarkMode ? 'bg-gray-800' : 'bg-white';
  const textColor = isDarkMode ? 'text-gray-100' : 'text-gray-800';
  const subTextColor = isDarkMode ? 'text-gray-400' : 'text-gray-600';
  const borderColor = isDarkMode ? 'border-gray-700' : 'border-gray-200';
  const hoverBg = isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-50';
  const inputBg = isDarkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-200';
  const inputText = isDarkMode ? 'text-white placeholder:text-gray-400' : 'text-black placeholder:text-gray-500';
  const buttonPrimary = isDarkMode ? 'bg-blue-600 hover:bg-blue-700' : 'bg-blue-500 hover:bg-blue-600';
  const buttonSecondary = isDarkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300';
  const buttonDanger = isDarkMode ? 'bg-red-600 hover:bg-red-700' : 'bg-red-500 hover:bg-red-600';
  const pageBg = isDarkMode ? 'bg-gray-900' : 'bg-gray-50';

  useEffect(() => {
    const fetchEquipments = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem("token");
        const response = await axios.get(`${baseURL}/equipments`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setItems(response.data);
      } catch (error) {
        toast.error("Error fetching equipment. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    const fetchInventory = async () => {
      try {
        const token = localStorage.getItem("token");
        const response = await axios.get(`${baseURL}/auth/inventory`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setInventory(response.data.filter((item) => item.quantity > 0));
      } catch (error) {
        toast.error("Failed to load inventory items.");
      }
    };

    fetchEquipments();
    fetchInventory();
  }, [baseURL]);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setNewItem({ ...newItem, image: file });
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const selectedInventoryItem = inventory.find(item => item._id === selectedItem);
    if (!selectedInventoryItem) {
      toast.error("Please select a valid item.");
      return;
    }

    if (!newItem.image) {
      toast.error("Please upload an image of the equipment.");
      return;
    }

    try {
      toast.info("Uploading image... Please wait.", { autoClose: false, toastId: "upload" });
      const storageRef = ref(storage, `Equipments/${newItem.image.name}`);
      const snapshot = await uploadBytes(storageRef, newItem.image);
      const imageUrl = await getDownloadURL(snapshot.ref);
      toast.dismiss("upload");

      const formData = {
        name: selectedInventoryItem.name,
        borrowDate: new Date().toISOString(),
        returnDate: "1970-01-01T00:00:00.000Z",
        imageUrl,
      };

      const token = localStorage.getItem("token");
      const response = await axios.post(`${baseURL}/equipments`, formData, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setInventory(inventory.map((item) =>
        item._id === selectedInventoryItem._id
          ? { ...item, quantity: item.quantity - 1 }
          : item
      ));
      setItems([...items, response.data]);
      setShowForm(false);
      setNewItem({ image: null });
      setImagePreview(null);
      toast.success("Item borrowed successfully!");
    } catch (error) {
      toast.error("Error adding equipment. Please try again.");
    }
  };

  const handleReturn = (itemId) => {
    toast.info(
      <div className="flex flex-col">
        <p className="mb-3 font-medium">Do you want to return this item?</p>
        <div className="flex justify-center space-x-3">
          <motion.button 
            whileHover={{ scale: 1.05 }} 
            whileTap={{ scale: 0.95 }}
            className={`${isDarkMode ? 'bg-green-600 hover:bg-green-700' : 'bg-green-500 hover:bg-green-600'} text-white py-2 px-4 rounded-lg`}
            onClick={() => confirmReturn(itemId)}
          >
            <FaCheck className="mr-2 inline" /> Yes, Return Item
          </motion.button>
          <motion.button 
            whileHover={{ scale: 1.05 }} 
            whileTap={{ scale: 0.95 }}
            className={`${buttonSecondary} py-2 px-4 rounded-lg`}
            onClick={() => toast.dismiss()}
          >
            <FaTimes className="mr-2 inline" /> Cancel
          </motion.button>
        </div>
      </div>,
      { autoClose: false }
    );
  };

  const confirmReturn = async (itemId) => {
    try {
      const itemToReturn = items.find(item => item._id === itemId);
      const currentDateTime = new Date().toISOString();
      const updatedItem = { returnDate: currentDateTime };
      const token = localStorage.getItem("token");

      const response = await axios.put(`${baseURL}/equipments/${itemId}`, updatedItem, {
        headers: { Authorization: `Bearer ${token}` },
      });

      // Update the inventory to increase the returned item quantity
      const inventoryItem = inventory.find(item => item.name === itemToReturn.name);
      if (inventoryItem) {
        const updatedInventory = inventory.map(item => 
          item._id === inventoryItem._id 
            ? { ...item, quantity: item.quantity + 1 } 
            : item
        );
        setInventory(updatedInventory);
      }

      setItems(items.map((item) =>
        item._id === itemId ? response.data : item
      ));
      toast.dismiss();
      toast.success("Item returned successfully!");
    } catch (error) {
      toast.error("Error returning equipment. Please try again.");
    }
  };

  const formatDate = (date) => {
    const notReturnedDate = "1970-01-01T00:00:00.000Z";
    return date === notReturnedDate 
      ? <span className="text-red-500 flex items-center"><FaExclamationTriangle className="mr-1" /> Not Returned</span> 
      : dayjs(date).format("hh:mm A DD-MM-YYYY");
  };

  const getStatusBadgeClass = (returnDate) => {
    const notReturnedDate = "1970-01-01T00:00:00.000Z";
    if (returnDate === notReturnedDate) {
      return isDarkMode 
        ? 'bg-red-900/30 text-red-300 border-red-700' 
        : 'bg-red-100 text-red-800 border-red-200';
    } else {
      return isDarkMode 
        ? 'bg-green-900/30 text-green-300 border-green-700' 
        : 'bg-green-100 text-green-800 border-green-200';
    }
  };

  // Filter items based on search, date and returned status
  const filteredItems = items.filter(item => {
    const matchesReturnStatus = showReturned 
      ? item.returnDate !== "1970-01-01T00:00:00.000Z" 
      : item.returnDate === "1970-01-01T00:00:00.000Z";
    
    const matchesDate = !filterDate || dayjs(item.borrowDate).format('YYYY-MM-DD') === filterDate;
    
    const matchesSearch = !searchQuery || 
      item.name.toLowerCase().includes(searchQuery.toLowerCase());
    
    return matchesReturnStatus && matchesDate && matchesSearch;
  });

  // Loading skeletons
  const TableSkeleton = () => (
    <div className="animate-pulse">
      <div className={`h-10 ${isDarkMode ? 'bg-gray-700' : 'bg-gray-200'} rounded mb-4`}></div>
      {[...Array(3)].map((_, i) => (
        <div key={i} className={`h-16 ${isDarkMode ? 'bg-gray-700' : 'bg-gray-200'} rounded mb-3`}></div>
      ))}
    </div>
  );

  const CardSkeleton = () => (
    <div className="animate-pulse">
      {[...Array(3)].map((_, i) => (
        <div key={i} className={`${isDarkMode ? 'bg-gray-700' : 'bg-gray-200'} rounded-xl h-44 mb-4`}></div>
      ))}
    </div>
  );

  // Mobile Equipment Card component
  const EquipmentCard = ({ item }) => {
    return (
      <motion.div 
        variants={tableRowVariants}
        whileHover={{ scale: 1.01 }}
        className={`${cardBg} shadow-md rounded-xl overflow-hidden border ${borderColor} mb-4`}
      >
        <div className={`px-4 py-3 border-b ${borderColor} flex justify-between items-center`}>
          <div className="flex items-center">
            <span className={`font-medium ${textColor}`}>{item.name}</span>
          </div>
          <span className={`px-3 py-1 rounded-full text-sm font-medium flex items-center ${getStatusBadgeClass(item.returnDate)}`}>
            {item.returnDate === "1970-01-01T00:00:00.000Z" ? 'Borrowed' : 'Returned'}
          </span>
        </div>
        
        <div className="p-4">
          <div className="flex space-x-3">
            <div className="flex-shrink-0">
              <img 
                src={item.imageUrl} 
                alt={item.name} 
                className="w-24 h-24 object-cover rounded-lg border border-gray-300"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = 'https://placehold.co/100x100?text=No+Image';
                }}
              />
            </div>
            
            <div className="flex-1">
              <div className="mb-2">
                <div className="flex items-center mb-1">
                  <FaCalendarAlt className={`mr-2 ${subTextColor}`} />
                  <span className={`text-xs font-medium ${subTextColor}`}>Borrowed</span>
                </div>
                <p className={`${textColor} text-sm`}>{dayjs(item.borrowDate).format("hh:mm A DD-MM-YYYY")}</p>
              </div>
              
              <div>
                <div className="flex items-center mb-1">
                  <FaExchangeAlt className={`mr-2 ${subTextColor}`} />
                  <span className={`text-xs font-medium ${subTextColor}`}>Returned</span>
                </div>
                <p className={`text-sm`}>{formatDate(item.returnDate)}</p>
              </div>
            </div>
          </div>
          
          {item.returnDate === "1970-01-01T00:00:00.000Z" && (
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => handleReturn(item._id)}
              className={`w-full mt-3 py-2 px-4 rounded-lg ${buttonDanger} text-white flex items-center justify-center`}
            >
              <FaCheck className="mr-2" /> Return Item
            </motion.button>
          )}
        </div>
      </motion.div>
    );
  };

  return (
    <motion.div 
      initial="hidden"
      animate="visible"
      variants={fadeIn}
      className={`container mx-auto px-4 py-6 ${pageBg} min-h-screen`}
    >
      <ToastContainer position="top-right" theme={isDarkMode ? "dark" : "light"} />
      
      <motion.div variants={slideUp} custom={0}>
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
          <h1 className={`text-2xl font-bold mb-4 md:mb-0 ${textColor}`}>Equipment Management</h1>
          
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`px-4 py-2 rounded-lg flex items-center text-sm ${
                isDarkMode ? 'bg-gray-800 hover:bg-gray-700' : 'bg-white hover:bg-gray-100'
              } ${borderColor} shadow-sm`}
            >
              <FaFilter className="mr-2" />
              {showFilters ? 'Hide Filters' : 'Show Filters'}
            </button>
            
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => setShowForm(!showForm)}
              className={`${buttonPrimary} text-white font-medium py-2 px-4 rounded-lg flex items-center`}
            >
              {showForm ? <><FaTimes className="mr-2" /> Cancel</> : <><FaPlus className="mr-2" /> Borrow Equipment</>}
            </motion.button>
          </div>
        </div>
      </motion.div>

      {/* Expandable Filters Section */}
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

      {/* Borrow Equipment Form */}
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
                <FaUpload className="mr-2" />
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
                    onChange={(e) => setSelectedItem(e.target.value)}
                    required
                    className={`w-full px-3 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${inputBg} ${inputText}`}
                  >
                    <option value="">-- Select Item --</option>
                    {inventory.map((item) => (
                      <option key={item._id} value={item._id}>
                        {item.name} (Available: {item.quantity})
                      </option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className={`block text-sm font-medium mb-2 ${subTextColor}`}>
                    Upload Image
                  </label>
                  <div className={`border-2 border-dashed ${borderColor} rounded-lg p-4 text-center hover:border-blue-500 transition-colors`}>
                    <input 
                      type="file" 
                      id="equipment-image"
                      onChange={handleImageChange} 
                      required 
                      className="hidden"
                      accept="image/*" 
                    />
                    <label 
                      htmlFor="equipment-image"
                      className={`cursor-pointer flex flex-col items-center justify-center ${
                        imagePreview ? 'h-32' : 'h-24'
                      }`}
                    >
                      {imagePreview ? (
                        <img 
                          src={imagePreview} 
                          alt="Preview" 
                          className="h-full object-contain rounded mb-2" 
                        />
                      ) : (
                        <>
                          <FaImage className={`text-4xl mb-2 ${subTextColor}`} />
                          <p className={`text-sm ${subTextColor}`}>
                            Click to upload equipment image
                          </p>
                          <p className={`text-xs mt-1 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                            JPG, PNG or GIF files
                          </p>
                        </>
                      )}
                    </label>
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
                    setImagePreview(null);
                    setNewItem({ image: null });
                  }}
                  className={`py-2 px-4 rounded-lg ${buttonSecondary} ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}
                >
                  <FaTimes className="mr-2 inline" />
                  Cancel
                </motion.button>
                
                <motion.button
                  type="submit"
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  className={`py-2 px-5 rounded-lg ${buttonPrimary} text-white`}
                >
                  <FaCheck className="mr-2 inline" />
                  Borrow Item
                </motion.button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Results section */}
      <motion.div variants={slideUp} custom={1}>
        <div className="flex items-center justify-between mb-4">
          <h2 className={`text-xl font-bold ${textColor}`}>
            {showReturned ? "Returned Equipment" : "Borrowed Equipment"}
          </h2>
          <span className={`text-sm ${subTextColor}`}>
            {filteredItems.length} {filteredItems.length === 1 ? 'item' : 'items'} found
          </span>
        </div>
      </motion.div>

      {/* Desktop Table View (hidden on mobile) */}
      <motion.div 
        variants={fadeIn}
        className="hidden md:block"
      >
        {loading ? (
          <TableSkeleton />
        ) : filteredItems.length === 0 ? (
          <motion.div 
            variants={slideUp} 
            custom={3}
            className={`flex flex-col items-center justify-center p-8 rounded-xl ${cardBg} border ${borderColor}`}
          >
            <FaExchangeAlt size={48} className={`${subTextColor} mb-4`} />
            <p className={`${textColor} text-lg font-medium mb-2`}>No equipment found</p>
            <p className={`${subTextColor}`}>Try adjusting your filters or borrow new equipment</p>
          </motion.div>
        ) : (
          <motion.div 
            variants={staggerContainer}
            className={`overflow-hidden rounded-xl shadow-lg border ${borderColor}`}
          >
            <div className="overflow-x-auto">
              <table className={`min-w-full ${cardBg}`}>
                <thead className={`${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'} border-b ${borderColor}`}>
                  <tr>
                    <th className={`py-3.5 px-4 text-left text-sm font-medium ${subTextColor}`}>Item Name</th>
                    <th className={`py-3.5 px-4 text-left text-sm font-medium ${subTextColor}`}>Borrow Date & Time</th>
                    <th className={`py-3.5 px-4 text-left text-sm font-medium ${subTextColor}`}>Return Date & Time</th>
                    <th className={`py-3.5 px-4 text-left text-sm font-medium ${subTextColor}`}>Image</th>
                    <th className={`py-3.5 px-4 text-left text-sm font-medium ${subTextColor}`}>Status</th>
                    <th className={`py-3.5 px-4 text-right text-sm font-medium ${subTextColor}`}>Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  <AnimatePresence>
                    {filteredItems.map((item, index) => (
                      <motion.tr 
                        key={item._id}
                        variants={tableRowVariants}
                        initial="hidden"
                        animate="visible"
                        exit="hidden"
                        custom={index}
                        className={`${hoverBg} transition-colors`}
                      >
                        <td className={`py-4 px-4 whitespace-nowrap ${textColor} font-medium`}>{item.name}</td>
                        <td className={`py-4 px-4 whitespace-nowrap ${textColor}`}>
                          {dayjs(item.borrowDate).format("hh:mm A DD-MM-YYYY")}
                        </td>
                        <td className={`py-4 px-4 whitespace-nowrap`}>
                          {formatDate(item.returnDate)}
                        </td>
                        <td className={`py-4 px-4`}>
                          <img 
                            src={item.imageUrl} 
                            alt={item.name} 
                            className="w-16 h-16 object-cover rounded border border-gray-300"
                            onError={(e) => {
                              e.target.onerror = null;
                              e.target.src = 'https://placehold.co/80x80?text=No+Image';
                            }}
                          />
                        </td>
                        <td className={`py-4 px-4 whitespace-nowrap`}>
                          <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${getStatusBadgeClass(item.returnDate)}`}>
                            {item.returnDate === "1970-01-01T00:00:00.000Z" ? 'Borrowed' : 'Returned'}
                          </span>
                        </td>
                        <td className="py-4 px-4 whitespace-nowrap text-right">
                          {item.returnDate === "1970-01-01T00:00:00.000Z" && (
                            <motion.button
                              whileHover={{ scale: 1.03 }}
                              whileTap={{ scale: 0.98 }}
                              onClick={() => handleReturn(item._id)}
                              className={`inline-flex items-center px-3 py-1.5 rounded-lg ${buttonDanger} text-white text-sm`}
                            >
                              <FaCheck className="mr-1.5" /> Return Item
                            </motion.button>
                          )}
                        </td>
                      </motion.tr>
                    ))}
                  </AnimatePresence>
                </tbody>
              </table>
            </div>
          </motion.div>
        )}
      </motion.div>

      {/* Mobile Card View (hidden on desktop) */}
      <motion.div 
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
        className="md:hidden"
      >
        {loading ? (
          <CardSkeleton />
        ) : filteredItems.length === 0 ? (
          <motion.div 
            variants={slideUp} 
            custom={3}
            className={`flex flex-col items-center justify-center p-8 rounded-xl ${cardBg} border ${borderColor}`}
          >
            <FaExchangeAlt size={40} className={`${subTextColor} mb-3`} />
            <p className={`${textColor} text-base font-medium mb-1`}>No equipment found</p>
            <p className={`${subTextColor} text-sm text-center`}>Try adjusting your filters or borrow new equipment</p>
          </motion.div>
        ) : (
          filteredItems.map((item) => (
            <EquipmentCard key={item._id} item={item} />
          ))
        )}
      </motion.div>
    </motion.div>
  );
};

export default Equipment;

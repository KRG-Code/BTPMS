import React, { useState, useEffect } from 'react';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { io } from 'socket.io-client';
import { motion, AnimatePresence } from 'framer-motion';
import { FaUserPlus, FaSearch, FaFilter, FaSyncAlt, FaUserCircle, FaChartBar } from 'react-icons/fa';
import { useTheme } from '../../../contexts/ThemeContext'; // Import useTheme hook

import TanodTable from './PersonelsComponents/TanodTable';
import AddTanodModal from './PersonelsComponents/AddTanodModal';
import EditTanodModal from './PersonelsComponents/EditTanodModal';
import AllTanodsReportModal from './PersonelsComponents/AllTanodsReportModal';
import PasswordVerificationModal from './PersonelsComponents/PasswordVerificationModal';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { 
    opacity: 1,
    transition: { 
      duration: 0.5,
      when: "beforeChildren",
      staggerChildren: 0.1
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 }
};

export default function TanodPersonels() {
  const { isDarkMode } = useTheme(); // Use theme context
  const [tanods, setTanods] = useState([]);
  const [filteredTanods, setFilteredTanods] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedTanod, setSelectedTanod] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [showReportModal, setShowReportModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);

  useEffect(() => {
    const fetchTanods = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        toast.error("Please log in to view this page.");
        return;
      }

      try {
        setLoading(true);
        const response = await fetch(`${process.env.REACT_APP_API_URL}/auth/users`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error(`Error: ${response.status}`);
        }

        const data = await response.json();
        // Filter only users with userType "tanod"
        const tanodData = data.filter(user => user.userType === "tanod");
        setTanods(tanodData);
        setFilteredTanods(tanodData);
      } catch (error) {
        console.error("Error fetching tanods:", error);
        toast.error("Failed to load tanod personnel.");
      } finally {
        setLoading(false);
      }
    };
    fetchTanods();

    // Set up socket connection for real-time updates
    const socket = io(process.env.REACT_APP_API_URL, {
      auth: { token: localStorage.getItem('token') },
      withCredentials: true
    });

    socket.on('connect', () => {
      console.log('Connected to socket for tanod status updates');
    });

    socket.on('userStatusUpdate', ({ userId, isOnline }) => {
      setTanods(prevTanods => 
        prevTanods.map(tanod => 
          tanod._id === userId 
            ? { ...tanod, isOnline } 
            : tanod
        )
      );
      
      setFilteredTanods(prevTanods => 
        prevTanods.map(tanod => 
          tanod._id === userId 
            ? { ...tanod, isOnline } 
            : tanod
        )
      );
    });

    return () => {
      socket.disconnect();
    };
  }, [refreshTrigger]);

  useEffect(() => {
    // Filter tanods based on search term and filter status
    let filtered = tanods;
    
    if (searchTerm) {
      filtered = filtered.filter(tanod => 
        `${tanod.firstName} ${tanod.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
        tanod.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        tanod.username?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    if (filterStatus !== 'all') {
      filtered = filtered.filter(tanod => 
        filterStatus === 'online' ? tanod.isOnline : !tanod.isOnline
      );
    }
    
    setFilteredTanods(filtered);
  }, [searchTerm, filterStatus, tanods]);

  const handleAddTanod = async (newTanodData) => {
    if (newTanodData.password !== newTanodData.confirmPassword) {
      toast.error("Passwords do not match.");
      return;
    }

    const token = localStorage.getItem("token");
    if (!token) {
      toast.error("Please log in.");
      return;
    }

    const tanodData = {
      firstName: newTanodData.firstName,
      middleName: newTanodData.middleName,
      lastName: newTanodData.lastName,
      email: newTanodData.email,
      username: newTanodData.username,
      password: newTanodData.password,
      userType: "tanod",
    };

    try {
      setLoading(true);
      const response = await fetch(
        `${process.env.REACT_APP_API_URL}/auth/registertanod`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(tanodData),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to add tanod");
      }

      const data = await response.json();
      toast.success("Tanod added successfully!");
      setTanods([...tanods, data]);
      setFilteredTanods([...filteredTanods, data]);
      setShowModal(false);
    } catch (error) {
      console.error("Error adding Tanod:", error);
      toast.error(error.message || "An error occurred while adding Tanod.");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteTanod = (tanodId) => {
    toast.info(
      <div>
        <span className="font-medium">Are you sure you want to delete this Tanod?</span>
        <div className="mt-2 flex justify-end space-x-2">
          <button
            className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded-md text-sm font-medium transition-colors duration-200"
            onClick={() => {
              confirmDelete(tanodId);
              toast.dismiss();
            }}
          >
            Delete
          </button>
          <button
            className="bg-gray-500 hover:bg-gray-600 text-white px-3 py-1 rounded-md text-sm font-medium transition-colors duration-200"
            onClick={() => toast.dismiss()}
          >
            Cancel
          </button>
        </div>
      </div>,
      {
        closeButton: false,
        autoClose: false,
        position: "top-center",
        className: "bg-white text-gray-800 shadow-xl rounded-lg border-l-4 border-red-500",
      }
    );
  };

  const confirmDelete = async (tanodId) => {
    const token = localStorage.getItem("token");
    if (!token) {
      toast.error("Please log in.");
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(
        `${process.env.REACT_APP_API_URL}/auth/users/${tanodId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to delete tanod");
      }

      // Remove the deleted tanod from the state
      setTanods(tanods.filter((tanod) => tanod._id !== tanodId));
      setFilteredTanods(filteredTanods.filter((tanod) => tanod._id !== tanodId));
      toast.success("Tanod deleted successfully!");
    } catch (error) {
      console.error("Error deleting Tanod:", error);
      toast.error(error.message || "An error occurred while deleting Tanod.");
    } finally {
      setLoading(false);
    }
  };

  const handleEditClick = (tanod) => {
    setSelectedTanod(tanod);
    setShowEditModal(true);
  };

  const handleEditTanod = async (editedTanodData) => {
    const token = localStorage.getItem("token");
    if (!token) {
      toast.error("Please log in.");
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(
        `${process.env.REACT_APP_API_URL}/auth/users/${editedTanodData._id}`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(editedTanodData),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to update tanod");
      }

      const updatedTanod = await response.json();

      // Update the tanods state with the edited tanod
      setTanods(
        tanods.map((tanod) =>
          tanod._id === updatedTanod._id ? updatedTanod : tanod
        )
      );
      
      setFilteredTanods(
        filteredTanods.map((tanod) =>
          tanod._id === updatedTanod._id ? updatedTanod : tanod
        )
      );

      toast.success("Tanod updated successfully!");
      setShowEditModal(false);
    } catch (error) {
      console.error("Error updating Tanod:", error);
      toast.error(error.message || "An error occurred while updating Tanod.");
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  const handleToggleTeamLeader = async (tanodId, isTeamLeader) => {
    const token = localStorage.getItem("token");
    if (!token) {
      toast.error("Please log in.");
      return;
    }

    // Get the tanod's name for better context in the confirmation message
    const tanod = tanods.find(t => t._id === tanodId);
    const tanodName = tanod ? `${tanod.firstName} ${tanod.lastName}` : "this tanod";
    
    // Show confirmation toast
    toast.info(
      <div>
        <p className="font-medium mb-2">
          {isTeamLeader 
            ? `Are you sure you want to demote ${tanodName} from team leader status?` 
            : `Are you sure you want to promote ${tanodName} to team leader?`}
        </p>
        <div className="flex justify-end space-x-2 mt-2">
          <button
            className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded-md text-sm font-medium transition-colors duration-200"
            onClick={async () => {
              toast.dismiss(); // Close this confirmation prompt
              
              // Show a loading toast
              const loadingToastId = toast.loading(
                isTeamLeader ? "Demoting tanod..." : "Promoting tanod to team leader..."
              );
              
              try {
                setLoading(true);
                const response = await fetch(
                  `${process.env.REACT_APP_API_URL}/auth/users/${tanodId}`,
                  {
                    method: "PUT",
                    headers: {
                      Authorization: `Bearer ${token}`,
                      "Content-Type": "application/json",
                    },
                    body: JSON.stringify({ isTeamLeader: !isTeamLeader }),
                  }
                );

                // Close the loading toast
                toast.dismiss(loadingToastId);

                if (!response.ok) {
                  const errorData = await response.json();
                  throw new Error(errorData.message || `Failed to ${isTeamLeader ? 'demote' : 'promote'} tanod`);
                }

                const updatedTanod = await response.json();
                
                // Verify that the isTeamLeader field was actually updated
                if (updatedTanod.isTeamLeader === isTeamLeader) {
                  throw new Error(`Failed to ${isTeamLeader ? 'demote' : 'promote'} tanod. Status did not change.`);
                }

                // Update the tanods state with the updated tanod
                setTanods(
                  tanods.map((tanod) =>
                    tanod._id === updatedTanod._id ? updatedTanod : tanod
                  )
                );
                
                setFilteredTanods(
                  filteredTanods.map((tanod) =>
                    tanod._id === updatedTanod._id ? updatedTanod : tanod
                  )
                );

                // Success message with styled toast
                toast.success(
                  <div>
                    <p className="font-medium">
                      {updatedTanod.firstName} {updatedTanod.lastName} {isTeamLeader ? 'demoted to regular tanod' : 'promoted to team leader'} successfully!
                    </p>
                  </div>,
                  {
                    icon: isTeamLeader ? '⬇️' : '⬆️',
                    className: "bg-white text-gray-800 shadow-xl rounded-lg border-l-4 border-blue-500",
                    autoClose: 3000
                  }
                );
              } catch (error) {
                console.error("Error updating Tanod team leader status:", error);
                toast.error(error.message || "An error occurred while updating Tanod team leader status.");
              } finally {
                setLoading(false);
              }
            }}
          >
            Yes, {isTeamLeader ? 'Demote' : 'Promote'}
          </button>
          <button
            className="bg-gray-500 hover:bg-gray-600 text-white px-3 py-1 rounded-md text-sm font-medium transition-colors duration-200"
            onClick={() => toast.dismiss()}
          >
            Cancel
          </button>
        </div>
      </div>,
      {
        closeButton: false,
        autoClose: false,
        position: "top-center",
        className: "bg-white text-gray-800 shadow-xl rounded-lg border-l-4 border-yellow-500"
      }
    );
  };

  const handleVerificationSuccess = () => {
    setShowPasswordModal(false);
    setShowReportModal(true);
  };

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className={`p-6 ${isDarkMode ? 'bg-[#080917] text-[#e7e8f4]' : 'bg-gray-50 text-gray-800'}`}
    >
      <ToastContainer />
      
      {/* Header section */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold">Manage Tanod Personnel</h1>
        <div className="flex space-x-2">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowPasswordModal(true)}
            className={`${isDarkMode ? 'bg-purple-600 hover:bg-purple-700 text-white' : 'bg-purple-500 hover:bg-purple-600 text-white'} px-4 py-2 rounded-md flex items-center mr-2`}
          >
            <FaChartBar className="mr-2" /> Generate Report
          </motion.button>
          
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowModal(true)}
            className={`${isDarkMode ? 'bg-[#4750eb] hover:bg-[#191f8a] text-white' : 'bg-blue-600 hover:bg-blue-700 text-white'} px-4 py-2 rounded-md flex items-center`}
          >
            <FaUserPlus className="mr-2" /> Add New Tanod
          </motion.button>
          
          <motion.button
            className={`${isDarkMode ? 'bg-[#080917] text-[#989ce6]' : 'bg-gray-100 text-gray-600'} hover:${isDarkMode ? 'bg-[#0e1022]' : 'bg-gray-200'} p-2 rounded-md`}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleRefresh}
          >
            <FaSyncAlt className={loading ? "animate-spin" : ""} />
          </motion.button>
        </div>
      </div>

      <motion.div 
        variants={itemVariants} 
        className={`${isDarkMode ? 'bg-[#0e1022]' : 'bg-white'} rounded-lg shadow-md p-6 mb-8`}
      >
        <div className="flex flex-col md:flex-row justify-between items-center mb-6 space-y-4 md:space-y-0">
          <div className="relative w-full md:w-96">
            <FaSearch className={`absolute left-3 top-1/2 transform -translate-y-1/2 ${isDarkMode ? 'text-gray-400' : 'text-gray-400'}`} />
            <input
              type="text"
              placeholder="Search by name, username or email..."
              className={`w-full pl-10 pr-4 py-2 ${isDarkMode ? 'bg-[#080917] text-[#e7e8f4] border-[#1e2048]' : 'bg-white text-[#0b0c18] border-[#e2e8f0]'} rounded-md focus:ring-2 focus:ring-[${isDarkMode ? '#4750eb' : '#141db8'}] focus:border-[${isDarkMode ? '#4750eb' : '#141db8'}] transition-all duration-200`}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <div className="flex items-center space-x-4 w-full md:w-auto">
            <div className="flex items-center space-x-2">
              <FaFilter className={isDarkMode ? 'text-gray-400' : 'text-gray-500'} />
              <select
                className={`border ${isDarkMode ? 'bg-[#080917] text-[#e7e8f4] border-[#1e2048]' : 'bg-white text-[#0b0c18] border-[#e2e8f0]'} rounded-md py-2 px-3 focus:ring-2 focus:ring-[${isDarkMode ? '#4750eb' : '#141db8'}] focus:border-[${isDarkMode ? '#4750eb' : '#141db8'}] transition-all duration-200`}
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
              >
                <option value="all">All Status</option>
                <option value="online">Online</option>
                <option value="offline">Offline</option>
              </select>
            </div>
            
            <motion.button
              className={`${isDarkMode ? 'bg-[#080917] text-[#989ce6]' : 'bg-gray-100 text-gray-600'} hover:${isDarkMode ? 'bg-[#0e1022]' : 'bg-gray-200'} p-2 rounded-md`}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleRefresh}
            >
              <FaSyncAlt className={loading ? "animate-spin" : ""} />
            </motion.button>
          </div>
        </div>

        <TanodTable 
          tanods={filteredTanods}
          loading={loading}
          handleDeleteTanod={handleDeleteTanod}
          handleEditClick={handleEditClick}
          handleToggleTeamLeader={handleToggleTeamLeader}
        />
        
        {filteredTanods.length === 0 && !loading && (
          <div className={`text-center py-8 ${isDarkMode ? 'text-gray-300' : 'text-gray-500'}`}>
            <div className="mx-auto w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <FaUserCircle className={`h-16 w-16 ${isDarkMode ? 'text-gray-600' : 'text-gray-400'}`} />
            </div>
            <p className={`${isDarkMode ? 'text-gray-300' : 'text-gray-500'} text-lg`}>No tanod personnel found</p>
            {searchTerm || filterStatus !== 'all' ? (
              <p className={`${isDarkMode ? 'text-gray-400' : 'text-gray-400'} mt-2`}>Try adjusting your search or filter criteria</p>
            ) : null}
          </div>
        )}
      </motion.div>

      <AnimatePresence>
        {showModal && (
          <AddTanodModal
            showModal={showModal}
            closeModal={() => setShowModal(false)}
            handleAddTanod={handleAddTanod}
            loading={loading}
            isDarkMode={isDarkMode} // Pass isDarkMode to AddTanodModal
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showEditModal && selectedTanod && (
          <EditTanodModal
            showModal={showEditModal}
            closeModal={() => setShowEditModal(false)}
            handleEditTanod={handleEditTanod}
            loading={loading}
            tanodData={selectedTanod}
            isDarkMode={isDarkMode} // Pass isDarkMode to EditTanodModal
          />
        )}
      </AnimatePresence>

      {/* Password Verification Modal */}
      <PasswordVerificationModal 
        isOpen={showPasswordModal}
        onClose={() => setShowPasswordModal(false)}
        onVerified={handleVerificationSuccess}
        isDarkMode={isDarkMode}
        action="generate a collective performance report"
      />
      
      {/* Report Modal */}
      <AllTanodsReportModal 
        isOpen={showReportModal} 
        onClose={() => setShowReportModal(false)} 
        isDarkMode={isDarkMode}
      />
    </motion.div>
  );
}

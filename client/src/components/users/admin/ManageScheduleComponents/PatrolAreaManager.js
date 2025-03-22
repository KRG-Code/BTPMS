import React, { useState } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { motion } from 'framer-motion';
import { FaMapMarkedAlt, FaEdit, FaSave, FaTrash, FaTimes, FaPalette } from 'react-icons/fa';

const API_URL = process.env.REACT_APP_API_URL;

// Animation variants
const tableRowVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: i => ({ opacity: 1, y: 0, transition: { delay: i * 0.1, duration: 0.3 } })
};

const buttonVariants = {
  hover: { scale: 1.05, transition: { duration: 0.2 } },
  tap: { scale: 0.95, transition: { duration: 0.1 } }
};

const PatrolAreaManager = ({
  polygons,
  setPolygons,
  editingPolygonId,
  setEditingPolygonId,
  legendInput,
  setLegendInput,
  colorInput,
  setColorInput,
  refreshMapData,
  isDarkMode
}) => {
  const [backupPolygon, setBackupPolygon] = useState(null);

  // Function to handle the editing of a polygon
  const handleEditPolygon = (polygon) => {
    polygons.forEach((p) => {
      if (p.layer) p.layer.pm.disable();
    });

    polygon.layer.pm.enable();
    setEditingPolygonId(polygon._id);
    setLegendInput(polygon.legend);
    setColorInput(polygon.color);
    setBackupPolygon({ ...polygon });
    toast.info(`Editing "${polygon.legend}"`);
  };

  // Function to handle saving the edited polygon
  const handleSaveEdit = async () => {
    if (!editingPolygonId) {
      toast.error('No polygon selected for editing.');
      return;
    }

    try {
      const polygon = polygons.find((p) => p._id === editingPolygonId);

      if (!polygon || !polygon.layer) {
        throw new Error('Polygon layer is undefined or not found.');
      }

      const latLngs = polygon.layer.getLatLngs();
      if (!latLngs || !latLngs[0]) {
        throw new Error('Polygon coordinates are invalid.');
      }

      const updatedCoordinates = latLngs[0].map(({ lat, lng }) => ({ lat, lng }));

      const updatedPolygon = {
        legend: legendInput,
        color: colorInput,
        coordinates: updatedCoordinates,
      };

      const response = await axios.put(
        `${API_URL}/polygons/${editingPolygonId}`,
        updatedPolygon,
        { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
      );

      setPolygons((prev) =>
        prev.map((p) =>
          p._id === editingPolygonId ? { ...p, ...response.data } : p
        )
      );

      polygon.layer.pm.disable();
      setEditingPolygonId(null);
      toast.success('Patrol area updated successfully.');

      if (typeof refreshMapData === 'function') {
        await refreshMapData();
      }
    } catch (error) {
      console.error('Error updating polygon:', error);
      toast.error('Failed to update patrol area.');
    }
  };

  // Function to cancel the edit and restore the polygon to its original state
  const handleCancelEdit = () => {
    if (backupPolygon && backupPolygon.layer) {
      const original = backupPolygon;
      original.layer.setLatLngs(
        original.coordinates.map(({ lat, lng }) => [lat, lng])
      );
      original.layer.setStyle({ color: original.color });
      original.layer.unbindTooltip();
      original.layer.bindTooltip(original.legend, {
        permanent: true,
        direction: 'center',
      });
      original.layer.pm.disable();
    }

    setEditingPolygonId(null);
    setLegendInput('');
    setColorInput('#FF0000');
    setBackupPolygon(null);
    toast.info('Edit cancelled.');
  };

  // Function to handle the deletion of a polygon
  const handleDeletePolygon = (id) => {
    toast.info(
      <div>
        <p>Are you sure you want to delete this patrol area?</p>
        <div className="flex justify-center gap-2 mt-3">
          <motion.button
            variants={buttonVariants}
            whileHover="hover"
            whileTap="tap"
            className={`px-4 py-2 rounded-lg ${isDarkMode ? 'bg-green-700' : 'bg-green-500'} text-white`}
            onClick={() => confirmDeletePolygon(id)}
          >
            Yes
          </motion.button>
          <motion.button
            variants={buttonVariants}
            whileHover="hover"
            whileTap="tap"
            className={`px-4 py-2 rounded-lg ${isDarkMode ? 'bg-red-700' : 'bg-red-500'} text-white`}
            onClick={() => toast.dismiss()}
          >
            No
          </motion.button>
        </div>
      </div>,
      { autoClose: false }
    );
  };

  const confirmDeletePolygon = async (id) => {
    const token = localStorage.getItem('token');
    try {
      await axios.delete(`${API_URL}/polygons/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const polygon = polygons.find((p) => p._id === id);
      if (polygon && polygon.layer) polygon.layer.remove();

      setPolygons((prev) => prev.filter((polygon) => polygon._id !== id));

      toast.dismiss();
      toast.success('Patrol area deleted successfully.');
    } catch (error) {
      console.error('Error deleting polygon:', error);
      toast.error('Failed to delete patrol area.');
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className={`rounded-xl shadow-lg overflow-hidden ${isDarkMode ? 'bg-[#0e1022]' : 'bg-white'}`}
    >
      {/* Header */}
      <div className={`${
        isDarkMode 
          ? 'bg-gradient-to-r from-[#191f8a] to-[#4750eb]' 
          : 'bg-gradient-to-r from-[#191d67] to-[#141db8]'
        } px-6 py-4 text-white`}>
        <h3 className="text-lg font-semibold flex items-center">
          <FaMapMarkedAlt className="mr-2" />
          Patrol Areas
        </h3>
      </div>
      
      {/* Content */}
      <div className={`overflow-x-auto`}>
        <table className="w-full border-collapse">
          <thead className={`${
            isDarkMode ? 'bg-[#191f8a]' : 'bg-[#191d67]'
          } text-white`}>
            <tr>
              <th className="py-3 px-4 text-left">Legend</th>
              <th className="py-3 px-4 text-left">Color</th>
              <th className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {polygons.length === 0 ? (
              <tr>
                <td colSpan="3" className={`py-8 text-center ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  No patrol areas defined yet.
                </td>
              </tr>
            ) : (
              polygons.map((polygon, index) => (
                <motion.tr 
                  key={polygon._id || polygon.id || Math.random()}
                  className={`${
                    editingPolygonId === polygon._id 
                    ? isDarkMode ? 'bg-[#191f8a20]' : 'bg-blue-50' 
                    : isDarkMode ? 'hover:bg-[#191f8a10]' : 'hover:bg-gray-50'
                  } transition-colors duration-200`}
                  variants={tableRowVariants}
                  initial="hidden"
                  animate="visible"
                  custom={index}
                >
                  <td className="py-4 px-4">
                    <input
                      type="text"
                      value={editingPolygonId === polygon._id ? legendInput : polygon.legend}
                      onChange={(e) => setLegendInput(e.target.value)}
                      className={`w-full px-3 py-2 rounded-lg ${
                        isDarkMode
                          ? 'bg-[#080917] border-[#1e2048] text-[#e7e8f4]'
                          : 'bg-white border-gray-300 text-gray-800'
                      } ${editingPolygonId === polygon._id ? 'border' : 'border-transparent'} focus:ring-2 focus:ring-blue-500`}
                      disabled={editingPolygonId !== polygon._id}
                    />
                  </td>
                  <td className="py-4 px-4">
                    <div className="flex items-center">
                      <span className="w-8 h-8 rounded-full mr-2 flex-shrink-0" style={{ backgroundColor: editingPolygonId === polygon._id ? colorInput : polygon.color }}></span>
                      <input
                        type="color"
                        value={editingPolygonId === polygon._id ? colorInput : polygon.color}
                        onChange={(e) => setColorInput(e.target.value)}
                        className={`h-8 w-20 cursor-pointer rounded border ${
                          isDarkMode ? 'border-[#1e2048]' : 'border-gray-200'
                        }`}
                        disabled={editingPolygonId !== polygon._id}
                      />
                    </div>
                  </td>
                  <td className="py-4 px-4 text-right">
                    <div className="flex justify-end space-x-2">
                      {editingPolygonId === polygon._id ? (
                        <>
                          <motion.button
                            variants={buttonVariants}
                            whileHover="hover"
                            whileTap="tap"
                            onClick={handleSaveEdit}
                            className={`p-2 rounded-lg ${
                              isDarkMode 
                              ? 'bg-green-700 hover:bg-green-600 text-white' 
                              : 'bg-green-500 hover:bg-green-600 text-white'
                            }`}
                          >
                            <FaSave className="w-4 h-4" />
                          </motion.button>
                          <motion.button
                            variants={buttonVariants}
                            whileHover="hover"
                            whileTap="tap"
                            onClick={handleCancelEdit}
                            className={`p-2 rounded-lg ${
                              isDarkMode 
                              ? 'bg-gray-700 hover:bg-gray-600 text-white' 
                              : 'bg-gray-500 hover:bg-gray-600 text-white'
                            }`}
                          >
                            <FaTimes className="w-4 h-4" />
                          </motion.button>
                        </>
                      ) : (
                        <>
                          <motion.button
                            variants={buttonVariants}
                            whileHover="hover"
                            whileTap="tap"
                            onClick={() => handleEditPolygon(polygon)}
                            className={`p-2 rounded-lg ${
                              isDarkMode 
                              ? 'bg-blue-700 hover:bg-blue-600 text-white' 
                              : 'bg-blue-500 hover:bg-blue-600 text-white'
                            }`}
                          >
                            <FaEdit className="w-4 h-4" />
                          </motion.button>
                          <motion.button
                            variants={buttonVariants}
                            whileHover="hover"
                            whileTap="tap"
                            onClick={() => handleDeletePolygon(polygon._id)}
                            className={`p-2 rounded-lg ${
                              isDarkMode 
                              ? 'bg-red-700 hover:bg-red-600 text-white' 
                              : 'bg-red-500 hover:bg-red-600 text-white'
                            }`}
                          >
                            <FaTrash className="w-4 h-4" />
                          </motion.button>
                        </>
                      )}
                    </div>
                  </td>
                </motion.tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </motion.div>
  );
};

export default PatrolAreaManager;

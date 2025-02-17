import React, { useState } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';

const API_URL = process.env.REACT_APP_API_URL;

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
      toast.success('Polygon updated successfully.');

      if (typeof refreshMapData === 'function') {
        await refreshMapData();
      }
    } catch (error) {
      console.error('Error updating polygon:', error);
      toast.error('Failed to update polygon.');
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
        <p>Are you sure you want to delete this polygon?</p>
        <button
          className="bg-green-500 text-white p-2 rounded m-2"
          onClick={() => confirmDeletePolygon(id)}
        >
          Yes
        </button>
        <button
          className="bg-red-500 text-white p-2 rounded m-2"
          onClick={() => toast.dismiss()}
        >
          No
        </button>
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
      toast.success('Polygon deleted successfully.');
    } catch (error) {
      console.error('Error deleting polygon:', error);
      toast.error('Failed to delete polygon.');
    }
  };

  return (
    <div>
      <h3 className="text-lg font-semibold mt-6">Patrol Areas:</h3>
      <div className="h-full border-separate overflow-clip rounded-xl border border-solid flex flex-col">
        <div style={{ maxHeight: "190px", overflowY: "auto" }}>
          <table className="w-full text-left border-collapse">
            <thead className="sticky top-0 z-10 TopNav">
              <tr>
                <th className="border p-2">Legend</th>
                <th className="border p-2">Color</th>
                <th className="border p-2">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white text-black">
              {polygons.map((polygon) => (
                <tr key={polygon._id || polygon.id || Math.random()}>
                  <td className="border p-2">
                    <input
                      type="text"
                      value={editingPolygonId === polygon._id ? legendInput : polygon.legend}
                      onChange={(e) => setLegendInput(e.target.value)}
                      className="w-full border rounded p-1"
                      disabled={editingPolygonId !== polygon._id}
                    />
                  </td>
                  <td className="border p-2">
                    <input
                      type="color"
                      value={editingPolygonId === polygon._id ? colorInput : polygon.color}
                      onChange={(e) => setColorInput(e.target.value)}
                      className="w-full h-8 cursor-pointer"
                      disabled={editingPolygonId !== polygon._id}
                    />
                  </td>
                  <td className="border p-2">
                    <div className="flex justify-start space-x-2">
                      {editingPolygonId === polygon._id ? (
                        <>
                          <button
                            onClick={handleSaveEdit}
                            className="px-2 py-1 bg-green-500 text-white rounded whitespace-nowrap"
                          >
                            Save
                          </button>
                          <button
                            onClick={handleCancelEdit}
                            className="px-2 py-1 bg-gray-500 text-white rounded whitespace-nowrap"
                          >
                            Cancel
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={() => handleEditPolygon(polygon)}
                            className="px-2 py-1 bg-blue-500 text-white rounded whitespace-nowrap"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeletePolygon(polygon._id)}
                            className="px-2 py-1 bg-red-500 text-white rounded whitespace-nowrap"
                          >
                            Delete
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default PatrolAreaManager;

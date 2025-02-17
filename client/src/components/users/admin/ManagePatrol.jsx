import React, { useState, useEffect, useRef } from 'react';
import L from 'leaflet';
import { MapContainer, TileLayer, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import '@geoman-io/leaflet-geoman-free';
import '@geoman-io/leaflet-geoman-free/dist/leaflet-geoman.css';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import axios from 'axios';
import PatrolAreaManager from './PatrolAreaManager';
import PatrolScheduleManager from './PatrolScheduleManager';
import ScheduleMaker from './ManageSchedule';

const API_URL = process.env.REACT_APP_API_URL;

const PatrolManagement = () => {
  const [polygons, setPolygons] = useState([]);
  const [toolsEnabled, setToolsEnabled] = useState(false);
  const [legendInput, setLegendInput] = useState('');
  const [colorInput, setColorInput] = useState('#FF0000');
  const [modalVisible, setModalVisible] = useState(false);
  const [editingPolygonId, setEditingPolygonId] = useState(null);
  const mapRef = useRef(null);

  const fetchPolygons = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      toast.error('User is not authenticated.');
      return;
    }

    try {
      const response = await axios.get(`${API_URL}/polygons`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (mapRef.current) {
        mapRef.current.eachLayer((layer) => {
          if (layer instanceof L.Polygon) {
            mapRef.current.removeLayer(layer);
          }
        });
      }

      const polygonsWithLayers = response.data.map((polygon) => {
        const layer = L.polygon(
          polygon.coordinates.map(({ lat, lng }) => [lat, lng]),
          { color: polygon.color }
        );
        layer.bindTooltip(polygon.legend, { permanent: true, direction: 'center' });

        if (mapRef.current) {
          layer.addTo(mapRef.current);
        }

        return { ...polygon, layer };
      });

      setPolygons(polygonsWithLayers);

    } catch (error) {
      console.error('Error fetching polygons:', error);
      toast.error('Failed to load polygons from database.');
    }
  };

  const handlePolygonCreatedAndUpload = async (layer) => {
    if (!legendInput.trim()) {
      toast.error('Please provide a legend before creating the polygon.');
      mapRef.current.removeLayer(layer);
      return;
    }

    const latLngs = layer.getLatLngs();
    if (!latLngs || !latLngs[0]) {
      toast.error('Invalid coordinates. Polygon creation failed.');
      mapRef.current.removeLayer(layer);
      return;
    }

    const coordinates = latLngs[0].map(({ lat, lng }) => ({ lat, lng }));

    // Check if the legend already exists
    const isDuplicate = polygons.some((polygon) => polygon.legend === legendInput);
    if (isDuplicate) {
      toast.error('A polygon with this legend already exists. Please choose a different legend.');
      mapRef.current.removeLayer(layer);
      return;
    }

    const newPolygon = {
      id: Date.now(),
      coordinates,
      legend: legendInput,
      color: colorInput,
      layer,
    };

    layer.setStyle({ color: colorInput });
    layer.bindTooltip(legendInput, { permanent: true, direction: 'center' }).openTooltip();

    setPolygons((prev) => [...prev, newPolygon]);

    const result = await uploadPolygon(newPolygon);
    if (result) {
      setLegendInput('');  // Clear the legend input on success
      toast.success(`Polygon "${legendInput}" created and saved.`);
      await refreshMapData();
    } else {
      toast.error('Failed to upload the polygon.');
    }
  };

  const uploadPolygon = async (polygon) => {
    const token = localStorage.getItem('token');
    if (!token) {
      toast.error('User is not authenticated.');
      return false;  // Return false to indicate failure
    }

    try {
      const { legend, color, coordinates } = polygon;

      if (!legend || !color || !coordinates || !coordinates.length) {
        throw new Error('Incomplete polygon data. Ensure legend, color, and coordinates are provided.');
      }

      const response = await axios.post(
        `${API_URL}/polygons`,
        { legend, color, coordinates },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const { polygon: createdPolygon } = response.data;

      if (!createdPolygon || !createdPolygon.coordinates || !createdPolygon.legend || !createdPolygon.color) {
        console.warn('Incomplete or invalid response:', response.data);
        return false;  // Return false on incomplete or invalid response
      }

      const layer = L.polygon(
        createdPolygon.coordinates.map(({ lat, lng }) => [lat, lng]),
        { color: createdPolygon.color }
      );
      layer.bindTooltip(createdPolygon.legend, { permanent: true, direction: 'center' });
      layer.addTo(mapRef.current);

      setPolygons((prev) => [...prev, { ...createdPolygon, layer }]);
      return true;  // Indicate success
    } catch (error) {
      console.error('Error uploading polygon:', error);
      toast.error('Failed to upload polygon.');
      return false;  // Indicate failure
    }
  };

  const deletePolygon = async (polygonId) => {
    toast.info(
      <div>
        <p>Are you sure you want to delete this polygon?</p>
        <button
          className="bg-green-500 text-white p-2 rounded m-2"
          onClick={() => confirmDeletePolygon(polygonId)}
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

  const confirmDeletePolygon = async (polygonId) => {
    const token = localStorage.getItem('token');
    try {
      await axios.delete(`${API_URL}/polygons/${polygonId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const polygon = polygons.find((p) => p._id === polygonId);
      if (polygon && polygon.layer) {
        polygon.layer.remove();
      }

      setPolygons((prev) => prev.filter((polygon) => polygon._id !== polygonId));

      toast.dismiss();
      toast.success('Polygon deleted successfully.');
    } catch (error) {
      console.error('Error deleting polygon:', error);
      toast.error('Failed to delete polygon.');
    }
  };

  const updatePolygon = async (polygonId, updatedPolygon) => {
    const token = localStorage.getItem('token');
    if (!token) {
      toast.error('User is not authenticated.');
      return;
    }

    try {
      const response = await axios.put(
        `${API_URL}/polygons/${polygonId}`,
        updatedPolygon,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const polygon = polygons.find((p) => p._id === polygonId);

      if (polygon && polygon.layer) {
        mapRef.current.removeLayer(polygon.layer);
      }

      const updatedLayer = L.polygon(
        response.data.coordinates.map(({ lat, lng }) => [lat, lng]),
        { color: response.data.color }
      );
      updatedLayer.bindTooltip(response.data.legend, { permanent: true, direction: 'center' });

      if (mapRef.current) {
        updatedLayer.addTo(mapRef.current);
      }

      setPolygons((prev) =>
        prev.map((p) =>
          p._id === polygonId ? { ...response.data, layer: updatedLayer } : p
        )
      );

      toast.success(`Polygon "${response.data.legend}" updated successfully.`);
    } catch (error) {
      console.error('Error updating polygon:', error);
      toast.error('Failed to update polygon.');
    }
  };

  const MapEvents = () => {
    const map = useMap();

    useEffect(() => {
      if (map) {
        mapRef.current = map;
        if (toolsEnabled) {
          map.pm.addControls({
            position: 'topleft',
            drawMarker: false,
            drawCircle: false,
            drawCircleMarker: false,
            drawText: false,
            drawPolyline: false,
            drawRectangle: false,
            drawPolygon: true,
            editMode: true,
            dragMode: true,
            cutPolygon: false,
            removalMode: true,
            rotateMode: true,
          });
        } else {
          map.pm.removeControls();
        }

        map.on('pm:create', (e) => {
          if (e.layer instanceof L.Polygon) {
            handlePolygonCreatedAndUpload(e.layer);
          }
        });

        return () => {
          map.pm.removeControls();
          map.off('pm:create');
        };
      }
    }, [map, toolsEnabled]);

    return null;
  };

  const toggleGeomanTools = () => {
    setToolsEnabled((prev) => !prev);
  };

  const refreshMapData = async () => {
    try {
      if (mapRef.current) {
        mapRef.current.eachLayer((layer) => {
          if (layer instanceof L.Polygon) {
            mapRef.current.removeLayer(layer); // Remove Polygon layers
          }
        });
      }

      const response = await axios.get(`${API_URL}/polygons`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });

      const polygonsWithLayers = response.data.map((polygon) => {
        const layer = L.polygon(
          polygon.coordinates.map(({ lat, lng }) => [lat, lng]),
          { color: polygon.color }
        );
        layer.bindTooltip(polygon.legend, { permanent: true, direction: 'center' });
        layer.addTo(mapRef.current);
        return { ...polygon, layer };
      });

      setPolygons(polygonsWithLayers);
      toast.success('Map refreshed with the latest data.');
    } catch (error) {
      console.error('Error refreshing map data:', error);
      toast.error('Failed to refresh map data.');
    }
  };

  const handleModalClose = () => {
    setToolsEnabled(false); // Disable tools when closing modal
    setModalVisible(false);
  };

  useEffect(() => {
    fetchPolygons();
  }, []);

  return (
    <div className="flex flex-col p-6 ">
      <ToastContainer position="top-right" autoClose={3000} hideProgressBar newestOnTop closeOnClick rtl={false} pauseOnFocusLoss draggable pauseOnHover />

      <div className="w-full h-[500px] p-6 flex items-center justify-center rounded-lg TopNav">
        <ScheduleMaker className="TopNav" />
      </div>

      <div className="flex w-full mt-4 z-0">
      <div className="relative w-2/3 h-[700px] mr-4">
        <MapContainer center={[14.7356, 121.0498]} zoom={13} style={{ height: '100%' }}>
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          <MapEvents />
        </MapContainer>
      </div>

      <div className="w-1/3 h-[700px] flex flex-col items-center justify-between bg-gray-100 p-4 space-y-4 rounded-lg TopNav">
  {!modalVisible ? (
    <div className="flex flex-col items-center w-full space-y-4">
      <button
        onClick={() => setModalVisible(true)}
        className="w-full py-3 bg-blue-500 text-white text-lg rounded-lg hover:bg-blue-600 transition duration-200 ease-in-out"
      >
        Patrol Area Settings
      </button>
      <div className="w-full flex-1">
        <PatrolScheduleManager
          polygons={polygons}
          refreshMapData={refreshMapData}
          className="w-full h-full" // Ensure it takes up the full width and height available
        />
      </div>
    </div>
        ) : (
          <div className="w-full h-full bg-white shadow-lg p-4 rounded-xl overflow-y-auto relative TopNav">
            <button
              onClick={handleModalClose}
              className="absolute top-2 right-2 px-2 py-1 bg-red-500 text-white rounded-lg"
            >
              X
            </button>
            <h3 className="text-lg font-semibold mb-4 text-center">Patrol Area Settings</h3>
            <div className="mb-4">
              <h3 className="text-l font-semibold mb-4">Create Patrol Area</h3>
              <label className="block font-bold">Legend:</label>
              <input
                type="text"
                value={legendInput}
                onChange={(e) => setLegendInput(e.target.value)}
                placeholder="Enter legend text"
                className="w-full border rounded p-2 text-black"
                disabled={editingPolygonId !== null}
              />
            </div>
            <div className="mb-4">
              <label className="block font-bold">Color:</label>
              <input
                type="color"
                value={colorInput}
                onChange={(e) => setColorInput(e.target.value)}
                className="w-full h-10 cursor-pointer"
                disabled={editingPolygonId !== null}
              />
            </div>
            <div className="mt-4 space-y-2">
            <h3 className="text-l font-semibold mb-4">Map Tools</h3>
              <button
                onClick={toggleGeomanTools}
                className={`w-full p-2 rounded text-white ${toolsEnabled ? 'bg-red-500 hover:bg-red-600' : 'bg-green-500 hover:bg-green-600'}`}
              >
                {toolsEnabled ? 'Disable Tools' : 'Enable Tools'}
              </button>
              <button
                onClick={refreshMapData}
                className="w-full p-2 rounded bg-blue-500 text-white hover:bg-blue-600"
              >
                Refresh Map
              </button>
            </div>
            <PatrolAreaManager
              polygons={polygons}
              setPolygons={setPolygons}
              editingPolygonId={editingPolygonId}
              setEditingPolygonId={setEditingPolygonId}
              legendInput={legendInput}
              setLegendInput={setLegendInput}
              colorInput={colorInput}
              setColorInput={setColorInput}
              deletePolygon={deletePolygon}
              updatePolygon={updatePolygon}
              refreshMapData={refreshMapData}
            />
          </div>
        )}
      </div>
    </div>
    </div>
  );
};

export default PatrolManagement;

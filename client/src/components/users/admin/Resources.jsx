import React, { useState, useEffect } from "react";
import axios from "axios";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import dayjs from "dayjs";
import customParseFormat from "dayjs/plugin/customParseFormat";

dayjs.extend(customParseFormat);

export default function TanodPersonels() {
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
      <div>
        <p>Are you sure you want to delete this item?</p>
        <button
          className="bg-red-500 text-white px-2 py-1 rounded mx-1 hover:bg-red-700"
          onClick={() => confirmDeleteItem(itemId)}
        >
          Yes
        </button>
        <button
          className="bg-gray-500 text-white px-2 py-1 rounded mx-1 hover:bg-gray-700"
          onClick={() => toast.dismiss(deleteToastId)}
        >
          No
        </button>
      </div>,
      { autoClose: false }
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
      <span className="text-red-500">Not Yet Returned</span>
    ) : (
      dayjs(date).format("hh:mm A DD-MM-YYYY")
    );
  };

  return (
    <div className="container mx-auto relative">
      <ToastContainer />
      <h1 className="text-2xl font-bold mb-4">Tanod Personnel List</h1>

      <button
        onClick={() => setShowInventoryModal(!showInventoryModal)}
        className="mb-4 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-700"
      >
        {showInventoryModal ? "Manage Inventory" : "Manage Inventory"}
      </button>

      {/* Inventory Modal */}
      {showInventoryModal && (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
    <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-lg sm:max-w-md md:max-w-2xl lg:max-w-3xl xl:max-w-4xl relative TopNav">
      <button
        onClick={() => {
          setShowInventoryModal(false);
          setEditMode(false);
          setNewItem({ name: "", quantity: "" });
        }}
        className="absolute top-2 right-2 text-red-500 hover:text-red-700 text-lg font-bold"
      >
        &#x2715;
      </button>
      <h2 className="text-xl font-bold mb-4">Inventory</h2>
      <form onSubmit={handleAddOrUpdateItem} className="mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center mb-4">
          <input
            type="text"
            placeholder="Item Name"
            value={newItem.name}
            onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
            className="mr-4 p-2 border rounded w-full mb-4 sm:mb-0 sm:w-1/2 text-black"
          />
          <input
            type="number"
            placeholder="Quantity"
            value={newItem.quantity}
            onChange={(e) => setNewItem({ ...newItem, quantity: e.target.value })}
            className="p-2 border rounded w-full sm:w-1/2 text-black"
          />
        </div>
        <div className="flex justify-end">
          <button
            type="submit"
            className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-700"
          >
            {editMode ? "Update Item" : "Add Item"}
          </button>
        </div>
      </form>

      <div className="overflow-x-auto">
        <table className="min-w-full bg-white shadow-md rounded-lg border overflow-hidden text-center">
          <thead className="bg-gray-100 TopNav">
            <tr>
              <th className="py-2 px-4 border text-sm sm:text-base">Item Name</th>
              <th className="py-2 px-4 border text-sm sm:text-base">Available Item to Borrow</th>
              <th className="py-2 px-4 border text-sm sm:text-base">Currently Borrowed Item</th>
              <th className="py-2 px-4 border text-sm sm:text-base">Total Item</th>
              <th className="py-2 px-4 border text-sm sm:text-base">Actions</th>
            </tr>
          </thead>
          <tbody className="text-black">
            {inventoryItems.length === 0 ? (
              <tr>
                <td colSpan="5" className="text-center py-4 text-sm sm:text-base">
                  No items in inventory.
                </td>
              </tr>
            ) : (
              inventoryItems.map((item) => (
                <tr key={item._id}>
                  <td className="py-2 px-4 border text-sm sm:text-base">{item.name}</td>
                  <td className="py-2 px-4 border text-sm sm:text-base">{item.quantity}</td>
                  <td className="py-2 px-4 border text-sm sm:text-base">{item.currentlyBorrowed}</td>
                  <td className="py-2 px-4 border text-sm sm:text-base">{item.total}</td>
                  <td className="py-2 px-4 border text-sm sm:text-base">
                    <button
                      onClick={() => handleEditItem(item)}
                      className="bg-yellow-500 text-white px-2 py-1 rounded mx-1 hover:bg-yellow-700"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteItem(item._id)}
                      className="bg-red-500 mt-3 text-white px-2 py-1 rounded mx-1 hover:bg-red-700"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  </div>
)}


      {/* Tanod Personnel Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white shadow-md rounded-lg border overflow-hidden text-center">
          <thead className="TopNav">
            <tr>
              <th className="py-2 px-4 border">Profile Picture</th>
              <th className="py-2 px-4 border">Full Name</th>
              <th className="py-2 px-4 border">Contact</th>
              <th className="py-2 px-4 border">Action</th>
            </tr>
          </thead>
          <tbody className="bg-white text-black">
            {loading ? (
              <tr>
                <td colSpan="5" className="text-center py-4">
                  Loading Tanod personnel...
                </td>
              </tr>
            ) : (
              tanods.map((tanod) => (
                <tr key={tanod._id} className="text-center">
                  <td className="py-2 px-4 border">
                    <img
                      src={
                        tanod.profilePicture || "https://via.placeholder.com/50"
                      }
                      alt={tanod.firstName}
                      className="w-10 h-10 rounded-full mx-auto"
                    />
                  </td>
                  <td className="py-2 px-4 border">
                    {`${tanod.firstName} ${tanod.middleName || ""} ${
                      tanod.lastName
                    }`}
                  </td>
                  <td className="py-2 px-4 border">
                    {tanod.contactNumber || "N/A"}
                  </td>
                  <td className="py-2 px-4 border">
                    <button
                      className="bg-blue-500 text-white px-2 py-1 rounded mx-1 hover:bg-blue-700"
                      onClick={() => handleViewEquipment(tanod)}
                    >
                      View Equipment
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Equipment Modal */}
      {showEquipmentModal && selectedTanod && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white p-6 rounded-lg w-full max-w-4xl relative shadow-lg TopNav">
            <button
              onClick={() => setShowEquipmentModal(false)}
              className="absolute top-2 right-2 text-red-500 hover:text-red-700 text-lg font-bold"
              aria-label="Close Equipment Modal"
            >
              &#x2715;
            </button>
            <h2 className="text-xl font-bold mb-2">
              Equipment Borrowed by {selectedTanod.firstName}{" "}
              {selectedTanod.lastName}
            </h2>

            <div className="flex flex-col sm:flex-row sm:justify-between items-center mb-4 space-y-4 sm:space-y-0">
              <div className="flex space-x-2">
                <button
                  onClick={() => setShowReturned(false)}
                  className={`py-2 px-4 border-2 rounded-2xl ${
                    !showReturned ? "border-blue-500" : "bg-blue-500"
                  } TopNav`}
                >
                  Currently Borrowed
                </button>
                <button
                  onClick={() => setShowReturned(true)}
                  className={`py-2 px-4 border-2 rounded-2xl ${
                    showReturned ? "border-blue-500" : "bg-blue-500"
                  } TopNav`}
                >
                  Returned Items
                </button>
              </div>
              <input
                type="date"
                value={filterDate}
                onChange={(e) => setFilterDate(e.target.value)}
                className="border border-gray-300 p-2 rounded-2xl TopNav"
              />
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full bg-white shadow-md rounded-lg border overflow-hidden text-center">
                <thead className="TopNav">
                  <tr>
                    <th className="py-2 px-4 border">Item Name</th>
                    <th className="py-2 px-4 border">Borrow Date & Time</th>
                    <th className="py-2 px-4 border">Return Date & Time</th>
                    <th className="py-2 px-4 border">Item Image</th>
                  </tr>
                </thead>
                <tbody className="text-black">
                  {filteredItems.map((item, index) => (
                    <tr
                      key={index}
                      className="text-center hover:bg-slate-100 hover:cursor-pointer"
                    >
                      <td className="py-2 px-4 border">{item.name}</td>
                      <td className="py-2 px-4 border">
                        {formatDate(item.borrowDate)}
                      </td>
                      <td className="py-2 px-4 border">
                        {formatDate(item.returnDate)}
                      </td>
                      <td className="py-2 px-4 border">
                        <img
                          src={item.imageUrl}
                          alt={item.name}
                          className="w-24 h-24 object-cover mx-auto"
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

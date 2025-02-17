import React, { useState, useEffect } from "react";
import axios from "axios";
import { storage } from "../../../firebase";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import dayjs from "dayjs";
import customParseFormat from "dayjs/plugin/customParseFormat";

dayjs.extend(customParseFormat);

const Equipment = () => {
  const [items, setItems] = useState([]);
  const [inventory, setInventory] = useState([]); // Load inventory for dropdown
  const [showForm, setShowForm] = useState(false);
  const [newItem, setNewItem] = useState({ image: null });
  const [imagePreview, setImagePreview] = useState(null);
  const [selectedItem, setSelectedItem] = useState(""); // Selected inventory item
  const [showReturned, setShowReturned] = useState(false);
  const [filterDate, setFilterDate] = useState("");

  const baseURL = `${process.env.REACT_APP_API_URL}`;

  useEffect(() => {
    const fetchEquipments = async () => {
      try {
        const token = localStorage.getItem("token");
        const response = await axios.get(`${baseURL}/equipments`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setItems(response.data);
      } catch (error) {
        toast.error("Error fetching equipment. Please try again.");
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
    setNewItem({ ...newItem, image: file });
    setImagePreview(URL.createObjectURL(file));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const selectedInventoryItem = inventory.find(item => item._id === selectedItem);
    if (!selectedInventoryItem) {
      toast.error("Please select a valid item.");
      return;
    }

    const storageRef = ref(storage, `Equipments/${newItem.image.name}`);
    try {
      const snapshot = await uploadBytes(storageRef, newItem.image);
      const imageUrl = await getDownloadURL(snapshot.ref);

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
      <div>
        <p>Do you want to return this item?</p>
        <button className="bg-green-500 text-white p-2 rounded m-2" onClick={() => confirmReturn(itemId)}>
          Yes
        </button>
        <button className="bg-red-500 text-white p-2 rounded m-2" onClick={() => toast.dismiss()}>
          No
        </button>
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
    return date === notReturnedDate ? <span className="text-red-500">Not Yet Returned</span> : dayjs(date).format("hh:mm A DD-MM-YYYY");
  };

  const filteredItems = items.filter(item =>
    (showReturned ? item.returnDate !== "1970-01-01T00:00:00.000Z" : item.returnDate === "1970-01-01T00:00:00.000Z") &&
    (!filterDate || dayjs(item.returnDate).isSame(dayjs(filterDate), "day"))
  );

  return (
    <div className="container mx-auto p-5">
      <ToastContainer />
      <h1 className="text-3xl font-bold mb-6">Equipment</h1>

      <div className="flex flex-col sm:flex-row justify-between mb-4">
        <div className="flex space-x-2">
          <button
            onClick={() => setShowReturned(false)}
            className={`py-2 px-4 border-2 rounded-2xl ${!showReturned ? "border-blue-500" : "bg-blue-500"} TopNav`}
          >
            Currently Borrowed
          </button>
          <button
            onClick={() => setShowReturned(true)}
            className={`py-2 px-4 border-2 rounded-2xl ${showReturned ? "border-blue-500" : "bg-blue-500"} TopNav`}
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

      <div className="flex justify-end mb-4">
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
        >
          {showForm ? "Cancel" : "Add Borrowed Item"}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-gray-100 p-4 rounded shadow-md mb-6 text-black">
          <div className="mb-4">
            <select
              value={selectedItem}
              onChange={(e) => setSelectedItem(e.target.value)}
              required
              className="border border-gray-300 p-2 w-full rounded text-black"
            >
              <option value="">Select Item</option>
              {inventory.map((item) => (
                <option key={item._id} value={item._id}>
                  {item.name} (Available: {item.quantity})
                </option>
              ))}
            </select>
          </div>

          <div className="mb-4">
            <input type="file" name="image" onChange={handleImageChange} required className="border border-gray-300 p-2 w-full rounded" />
          </div>

          {imagePreview && (
            <div className="mb-4">
              <h4 className="text-lg font-bold">Image Preview:</h4>
              <img src={imagePreview} alt="Preview" className="mt-2 w-24 h-24 object-cover" />
            </div>
          )}

          <button type="submit" className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded">
            Borrow Item
          </button>
        </form>
      )}

      <div className="overflow-x-auto">
        <table className="min-w-full bg-white shadow-md rounded-lg border overflow-hidden">
          <thead className="TopNav">
            <tr>
              <th className="py-2 px-4 border">Item Name</th>
              <th className="py-2 px-4 border">Borrow Date & Time</th>
              <th className="py-2 px-4 border">Return Date & Time</th>
              <th className="py-2 px-4 border">Item Image</th>
              <th className="py-2 px-4 border">Actions</th>
            </tr>
          </thead>
          <tbody className="text-black">
            {filteredItems.length === 0 ? (
              <tr>
                <td colSpan="5" className="text-center py-4">No items found</td>
              </tr>
            ) : (
              filteredItems.map(item => (
                <tr key={item._id} className="text-center hover:cursor-pointer">
                  <td className="py-2 px-4 border">{item.name}</td>
                  <td className="py-2 px-4 border">{formatDate(item.borrowDate)}</td>
                  <td className="py-2 px-4 border">{formatDate(item.returnDate)}</td>
                  <td className="py-2 px-4 border">
                    <img src={item.imageUrl} alt={item.name} className="w-24 h-24 object-cover" />
                  </td>
                  <td className="py-2 px-4">
                    {item.returnDate === "1970-01-01T00:00:00.000Z" && (
                      <button onClick={() => handleReturn(item._id)} className="bg-red-500 hover:bg-red-700 text-white font-bold py-1 px-2 rounded">
                        Return
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Equipment;

import React, { useState, useEffect } from "react";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import TanodTable from "./PersonelsComponents/TanodTable";
import AddTanodModal from "./PersonelsComponents/AddTanodModal";
import EditTanodModal from "./PersonelsComponents/EditTanodModal";
import { io } from 'socket.io-client';

export default function TanodPersonels() {
  const [tanods, setTanods] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedTanod, setSelectedTanod] = useState(null);

  useEffect(() => {
    const fetchTanods = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        toast.error("Please log in.");
        return;
      }

      try {
        setLoading(true);
        const response = await fetch(
          `${process.env.REACT_APP_API_URL}/auth/users`,
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        );

        if (!response.ok) {
          throw new Error("Network response was not ok");
        }

        const users = await response.json();

        if (Array.isArray(users)) {
          // Filter and map the tanods with isOnline property
          const tanodsList = users
            .filter((user) => user.userType === "tanod")
            .map(tanod => ({
              ...tanod,
              isOnline: tanod.isOnline || false
            }));
          setTanods(tanodsList);
        } else {
          toast.error("Unexpected response format.");
        }
      } catch (error) {
        console.error("Error fetching tanods:", error);
        toast.error("Error fetching Tanods.");
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
    });

    return () => {
      socket.disconnect();
    };
  }, []);

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
        throw new Error(errorData.message || "Failed to add Tanod");
      }

      const data = await response.json();
      toast.success("Tanod added successfully!");
      setTanods([...tanods, data]);
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
        <span>Are you sure you want to delete this Tanod?</span>
        <div className="mt-2">
          <button
            className="bg-red-500 text-white px-2 py-1 rounded mr-2"
            onClick={() => {
              confirmDelete(tanodId);
              toast.dismiss(); // Dismiss the toast after confirmation
            }}
          >
            Yes
          </button>
          <button
            className="bg-gray-500 text-white px-2 py-1 rounded"
            onClick={() => toast.dismiss()} // Dismiss the toast for "No"
          >
            No
          </button>
        </div>
      </div>,
      {
        closeButton: false,
        autoClose: false,
        position: "top-right",
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
        throw new Error("Failed to delete Tanod");
      }

      // Remove the deleted tanod from the state
      setTanods(tanods.filter((tanod) => tanod._id !== tanodId));
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
          body: JSON.stringify({
            firstName: editedTanodData.firstName,
            middleName: editedTanodData.middleName,
            lastName: editedTanodData.lastName,
            email: editedTanodData.email,
            username: editedTanodData.username,
            ...(editedTanodData.password && { password: editedTanodData.password }),
          }),
        }
      );

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || "Failed to update Tanod");
      }

      const data = await response.json();
      setTanods(tanods.map(tanod => 
        tanod._id === editedTanodData._id ? { ...tanod, ...data } : tanod
      ));
      toast.success("Tanod updated successfully!");
      setShowEditModal(false);
    } catch (error) {
      console.error("Error updating Tanod:", error);
      toast.error(error.message || "An error occurred while updating Tanod.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto">
      <ToastContainer />
      <h1 className="text-2xl font-bold mb-4">Tanod Personnel List</h1>

      <div className="mb-4">
        <button
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-700"
          onClick={() => setShowModal(true)}
        >
          Add Tanod
        </button>
      </div>

      <TanodTable 
        tanods={tanods}
        loading={loading}
        handleDeleteTanod={handleDeleteTanod}
        handleEditClick={handleEditClick}
      />

      <AddTanodModal
        showModal={showModal}
        closeModal={() => setShowModal(false)}
        handleAddTanod={handleAddTanod}
        loading={loading}
      />

      <EditTanodModal
        showModal={showEditModal}
        closeModal={() => setShowEditModal(false)}
        handleEditTanod={handleEditTanod}
        loading={loading}
        tanodData={selectedTanod}
      />
    </div>
  );
}

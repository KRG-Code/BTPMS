import React, { useState, useEffect } from "react";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { FaEye, FaEyeSlash } from "react-icons/fa"; // Import icons

export default function TanodPersonels() {
  const [tanods, setTanods] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [passwordVisible, setPasswordVisible] = useState(false); // State to toggle password visibility
  const [confirmPasswordVisible, setConfirmPasswordVisible] = useState(false); // State to toggle confirm password visibility
  const [newTanod, setNewTanod] = useState({
    firstName: "",
    middleName: "",
    lastName: "",
    email: "",
    username: "",
    password: "",
    confirmPassword: "",
  });

  // Fetch tanods list
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
          const tanodsList = users.filter((user) => user.userType === "tanod");
          setTanods(tanodsList); // Update the state with fetched tanods
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
  }, []);

  // Function to handle opening the modal
  const openModal = () => {
    setShowModal(true);
  };

  // Function to handle closing the modal
  const closeModal = () => {
    setShowModal(false);
    setNewTanod({
      firstName: "",
      middleName: "",
      lastName: "",
      email: "",
      username: "",
      password: "",
      confirmPassword: "",
    }); // Reset form
  };

  // Function to handle form input change
  const handleInputChange = (e) => {
    setNewTanod({ ...newTanod, [e.target.name]: e.target.value });
  };

  // Function to submit new Tanod
  const handleAddTanod = async (e) => {
    e.preventDefault();

    if (newTanod.password !== newTanod.confirmPassword) {
      toast.error("Passwords do not match.");
      return;
    }

    const token = localStorage.getItem("token");
    if (!token) {
      toast.error("Please log in.");
      return;
    }

    const tanodData = {
      firstName: newTanod.firstName,
      middleName: newTanod.middleName,
      lastName: newTanod.lastName,
      email: newTanod.email,
      username: newTanod.username,
      password: newTanod.password,
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
      closeModal();
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

  return (
    <div className="container mx-auto">
      <ToastContainer />
      <h1 className="text-2xl font-bold mb-4">Tanod Personnel List</h1>

      {/* Add Tanod Button */}
      <div className="mb-4">
        <button
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-700"
          onClick={openModal}
        >
          Add Tanod
        </button>
      </div>

      {/* Tanod Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white shadow-md rounded-lg border overflow-hidden">
          <thead className="TopNav">
            <tr>
              <th className="py-2 px-4 border">Profile Picture</th>
              <th className="py-2 px-4 border">Full Name</th>
              <th className="py-2 px-4 border">Contact</th>
              <th className="py-2 px-4 border">Email</th>
              <th className="py-2 px-4 border">Action</th>
            </tr>
          </thead>
          <tbody className="text-black">
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
                  {/* Combine firstName, middleName, lastName for Full Name */}
                  <td className="py-2 px-4 border">
                    {`${tanod.firstName} ${tanod.middleName || ""} ${
                      tanod.lastName
                    }`}
                  </td>
                  <td className="py-2 px-4 border">
                    {tanod.contactNumber || "N/A"}
                  </td>
                  <td className="py-2 px-4 border">{tanod.email || "N/A"}</td>
                  <td className="py-2 px-4 border">
                    <button
                      className="bg-green-500 text-white w-24 h-10 rounded mx-1 my-1 hover:bg-green-700"
                      onClick={() => toast.info(`Edit ${tanod.firstName}`)}
                    >
                      Edit
                    </button>
                    <button
                      className="bg-red-500 text-white w-24 h-10 rounded mx-1 my-1 hover:bg-red-700"
                      onClick={() => handleDeleteTanod(tanod._id)}
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

      {/* Custom Modal */}
      {showModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg w-96 TopNav">
            <h2 className="text-xl font-bold mb-4">Add New Tanod</h2>
            <form onSubmit={handleAddTanod}>
              <div className="mb-4">
                <label
                  htmlFor="firstName"
                  className="block text-lg font-semibold mb-2"
                >
                  First Name:
                </label>
                <input
                  type="text"
                  name="firstName"
                  id="firstName"
                  value={newTanod.firstName}
                  onChange={handleInputChange}
                  className="border border-gray-300 p-2 rounded w-full text-black"
                  required
                />
              </div>

              <div className="mb-4">
                <label
                  htmlFor="middleName"
                  className="block text-lg font-semibold mb-2"
                >
                  Middle Name:
                </label>
                <input
                  type="text"
                  name="middleName"
                  id="middleName"
                  value={newTanod.middleName}
                  onChange={handleInputChange}
                  className="border border-gray-300 p-2 rounded w-full text-black"
                />
              </div>

              <div className="mb-4">
                <label
                  htmlFor="lastName"
                  className="block text-lg font-semibold mb-2"
                >
                  Last Name:
                </label>
                <input
                  type="text"
                  name="lastName"
                  id="lastName"
                  value={newTanod.lastName}
                  onChange={handleInputChange}
                  className="border border-gray-300 p-2 rounded w-full text-black"
                  required
                />
              </div>

              <div className="mb-4">
                <label
                  htmlFor="email"
                  className="block text-lg font-semibold mb-2"
                >
                  Email:
                </label>
                <input
                  type="email"
                  name="email"
                  id="email"
                  value={newTanod.email}
                  onChange={handleInputChange}
                  className="border border-gray-300 p-2 rounded w-full text-black"
                  required
                />
              </div>

              <div className="mb-4">
                <label
                  htmlFor="username"
                  className="block text-lg font-semibold mb-2"
                >
                  Username:
                </label>
                <input
                  type="text"
                  name="username"
                  id="username"
                  value={newTanod.username}
                  onChange={handleInputChange}
                  className="border border-gray-300 p-2 rounded w-full text-black"
                  required
                />
              </div>

              {/* Password Field */}
              <div className="mb-4 relative">
                <label
                  htmlFor="password"
                  className="block text-lg font-semibold mb-2"
                >
                  Password:
                </label>
                <input
                  type={passwordVisible ? "text" : "password"}
                  name="password"
                  id="password"
                  value={newTanod.password}
                  onChange={handleInputChange}
                  className="border border-gray-300 p-2 rounded w-full text-black"
                  required
                />
                <button
                  type="button"
                  onClick={() => setPasswordVisible(!passwordVisible)}
                  className="absolute right-2 top-1/2 transform -translate-y-0 text-gray-600"
                >
                  {passwordVisible ? <FaEyeSlash /> : <FaEye />}
                </button>
              </div>

              {/* Confirm Password Field */}
              <div className="mb-4 relative">
                <label
                  htmlFor="confirmPassword"
                  className="block text-lg font-semibold mb-2"
                >
                  Confirm Password:
                </label>
                <input
                  type={confirmPasswordVisible ? "text" : "password"}
                  name="confirmPassword"
                  id="confirmPassword"
                  value={newTanod.confirmPassword}
                  onChange={handleInputChange}
                  className="border border-gray-300 p-2 rounded w-full text-black"
                  required
                />
                <button
                  type="button"
                  onClick={() =>
                    setConfirmPasswordVisible(!confirmPasswordVisible)
                  }
                  className="absolute right-2 top-1/2 transform -translate-y-0.5 text-gray-600"
                >
                  {confirmPasswordVisible ? <FaEyeSlash /> : <FaEye />}
                </button>
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 mr-2"
                  disabled={loading}
                >
                  {loading ? "Adding..." : "Add Tanod"}
                </button>
                <button
                  type="button"
                  onClick={closeModal}
                  className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

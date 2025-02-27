import React, { useState, useEffect } from "react";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import TanodCard from "./TanodCard"; // Import the new component
import { FaUserCircle } from "react-icons/fa"; // Import FaUserCircle

export default function TanodPersonels() {
  const [tanods, setTanods] = useState([]);
  const [selectedTanod, setSelectedTanod] = useState("");
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);

  // Fetch tanods list
  useEffect(() => {
    const fetchTanods = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        toast.error("Please log in.");
        return;
      }

      try {
        const response = await fetch(`${process.env.REACT_APP_API_URL}/auth/user`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });

        if (!response.ok) {
          throw new Error("Network response was not ok");
        }

        const users = await response.json();

        if (Array.isArray(users)) {
          const tanods = users.filter((user) => user.userType === "tanod");
          setTanods(tanods);
        } else {
          toast.error("Unexpected response format.");
        }
      } catch (error) {
        console.error("Error fetching tanods:", error);
        toast.error("Error fetching Tanods.");
      }
    };
    fetchTanods();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedTanod || rating === 0 || comment.trim() === "") {
      toast.error(
        "Please select a tanod, provide a rating, and leave a comment"
      );
      return;
    }

    setLoading(true);

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `${process.env.REACT_APP_API_URL}/auth/tanods/${selectedTanod}/rate`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            rating,
            comment,
          }),
        }
      );

      const data = await response.json();

      if (response.ok) {
        toast.success("Rating and comment submitted successfully");

        // Reset the form
        setSelectedTanod("");
        setRating(0);
        setComment("");
      } else {
        toast.error(data.message || "Failed to submit rating");
      }
    } catch (error) {
      toast.error("An error occurred while submitting rating");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-4">
      <ToastContainer />
      <h1 className="text-2xl font-bold mb-4 text-center">Rate a Tanod</h1>

      {/* Display Tanod List */}
      <div className="overflow-x-auto">
        <table className="min-w-full TopNav">
          <thead>
            <tr>
              <th className="py-2 px-4 border text-center">Profile Picture</th>
              <th className="py-2 px-4 border text-center">Name</th>
              <th className="py-2 px-4 border text-center">Action</th>
            </tr>
          </thead>
          <tbody className="bg-white text-black">
            {tanods.map((tanod) => (
              <tr key={tanod._id} className="hover:cursor-pointer">
                <td className="py-2 px-4 border text-center">
                  {tanod.profilePicture ? (
                    <img
                      src={tanod.profilePicture}
                      alt={`${tanod.firstName} ${tanod.lastName}`}
                      className="w-12 h-12 rounded-full mx-auto"
                    />
                  ) : (
                    <FaUserCircle className="w-12 h-12 rounded-full mx-auto text-gray-300" />
                  )}
                </td>
                <td className="py-2 px-4 border text-center">
                  {tanod.firstName} {tanod.lastName}
                </td>
                <td className="py-2 px-4 border text-center">
                  <button
                    onClick={() => setSelectedTanod(tanod._id)}
                    className="bg-blue-500 text-white px-2 py-1 rounded"
                  >
                    Rate
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Rating Form */}
      {selectedTanod && (
        <div className="fixed inset-0 bg-gray-800 bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded shadow-md w-full max-w-lg border-2 border-gray-300 TopNav">
            <div className="flex flex-col items-center mb-4">
              {tanods.find(t => t._id === selectedTanod).profilePicture ? (
                <img
                  src={tanods.find(t => t._id === selectedTanod).profilePicture}
                  alt={`${tanods.find(t => t._id === selectedTanod).firstName} ${tanods.find(t => t._id === selectedTanod).lastName}`}
                  className="w-24 h-24 rounded-full mb-2 border-2 border-gray-300"
                />
              ) : (
                <FaUserCircle className="w-24 h-24 rounded-full mb-2 text-gray-300" />
              )}
              <h2 className="text-xl font-bold text-center">
                {tanods.find(t => t._id === selectedTanod).firstName} {tanods.find(t => t._id === selectedTanod).lastName}
              </h2>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label htmlFor="rating" className="block text-lg font-semibold mb-2">
                  Rating (1 to 5):
                </label>
                <select
                  id="rating"
                  value={rating}
                  onChange={(e) => setRating(Number(e.target.value))}
                  className="border border-gray-300 p-2 rounded w-full text-black"
                  required
                >
                  <option value={0}>Select rating</option>
                  {[1, 2, 3, 4, 5].map((num) => (
                    <option key={num} value={num}>
                      {num}
                    </option>
                  ))}
                </select>
              </div>

              <div className="mb-4">
                <label htmlFor="comment" className="block text-lg font-semibold mb-2">
                  Comment:
                </label>
                <textarea
                  id="comment"
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  className="border border-gray-300 p-2 rounded w-full text-black"
                  required
                  placeholder="Leave a comment..."
                />
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                  disabled={loading}
                >
                  {loading ? "Submitting..." : "Submit Rating"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedTanod("");
                    setRating(0);
                    setComment("");
                  }}
                  className="bg-gray-500 text-white px-4 py-2 rounded ml-2 hover:bg-gray-600"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Display Tanod Cards */}
      <h1 className="text-center text-black text-2xl font-bold mt-6">Tanod Personel's</h1>
      <div className="mt-6 grid gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
        {tanods.map((tanod) => (
          <TanodCard key={tanod._id} tanod={tanod} />
        ))}
      </div>
    </div>
  );
}

import React, { useState, useEffect } from "react";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

export default function TanodPersonels() {
  const [tanods, setTanods] = useState([]);
  const [selectedTanod, setSelectedTanod] = useState("");
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);
  const [ratings, setRatings] = useState([]); // State for user's previous ratings
  const [editingRatingId, setEditingRatingId] = useState(null); // Track if editing an existing rating

  // Fetch tanods list
  useEffect(() => {
    const fetchTanods = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        toast.error("Please log in.");
        return;
      }

      try {
        const response = await fetch(`${process.env.REACT_APP_API_URL}/auth/users`, {
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

  // Fetch current user's ratings
  useEffect(() => {
    const fetchUserRatings = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        toast.error("Please log in.");
        return;
      }

      try {
        const response = await fetch(
          `${process.env.REACT_APP_API_URL}/auth/my-ratings`,
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        );

        if (response.ok) {
          const ratings = await response.json();
          setRatings(ratings); // Store the user's ratings in state
        } else if (response.status === 404) {
          setRatings([]); // Handle case where no ratings are found
        } else {
          throw new Error("Error fetching user ratings");
        }
      } catch (error) {
        console.error("Error fetching user ratings:", error);
        toast.error("Error fetching user ratings.");
      }
    };

    fetchUserRatings();
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
        `${process.env.REACT_APP_API_URL}/tanods/${selectedTanod}/rate`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            rating,
            comment,
            ratingId: editingRatingId, // Send `ratingId` if editing
          }),
        }
      );

      const data = await response.json();

      if (response.ok) {
        if (editingRatingId) {
          toast.success("Rating updated successfully");

          // Update the rating in the state
          setRatings((prevRatings) =>
            prevRatings.map((r) =>
              r._id === editingRatingId ? data.updatedRating : r
            )
          );
        } else {
          toast.success("Rating and comment submitted successfully");

          // Add the newly submitted rating to the state
          setRatings((prevRatings) => [...prevRatings, data.newRating]);
        }

        // Reset the form
        setSelectedTanod("");
        setRating(0);
        setComment("");
        setEditingRatingId(null); // Reset editing state
      } else {
        toast.error(data.message || "Failed to submit rating");
      }
    } catch (error) {
      toast.error("An error occurred while submitting rating");
    } finally {
      setLoading(false);
    }
  };

  const deleteRating = (ratingId) => {
    const confirmDelete = async (confirmed) => {
      if (confirmed) {
        try {
          const token = localStorage.getItem("token");
          const response = await fetch(
            `${process.env.REACT_APP_API_URL}/auth/ratings/${ratingId}`,
            {
              method: "DELETE",
              headers: {
                Authorization: `Bearer ${token}`,
              },
            }
          );
  
          if (response.ok) {
            toast.success("Rating deleted successfully");
            setRatings(ratings.filter((rating) => rating._id !== ratingId)); // Update the state
          } else {
            toast.error("Failed to delete rating");
          }
        } catch (error) {
          console.error("Error deleting rating:", error);
          toast.error("Error deleting rating");
        }
      }
    };
  
    toast.info(
      <div>
        <p>Are you sure you want to delete this rating?</p>
        <button
          onClick={() => {
            confirmDelete(true);
            toast.dismiss(); // Dismiss the toast
          }}
          className="bg-red-500 text-white px-2 py-1 rounded mr-2"
        >
          Yes
        </button>
        <button
          onClick={() => {
            confirmDelete(false);
            toast.dismiss(); // Dismiss the toast
          }}
          className="bg-gray-500 text-white px-2 py-1 rounded"
        >
          No
        </button>
      </div>,
      {
        autoClose: false, // Keep it open until dismissed
        closeButton: false, // Disable the default close button
        position: "top-right",
      }
    );
  };
  

  const editRating = (rating) => {
    setSelectedTanod(rating.tanodId._id);
    setRating(rating.rating);
    setComment(rating.comment);
    setEditingRatingId(rating._id); // Set the ratingId for editing
  };

  return (
    <div className="container mx-auto p-4">
      <ToastContainer />
      <h1 className="text-2xl font-bold mb-4 text-center">Rate a Tanod</h1>

      {/* Display Tanod List */}
      <table className="min-w-full TopNav">
        <thead>
          <tr>
            <th className="py-2 px-4 border text-center">Profile Picture</th>
            <th className="py-2 px-4 border text-center">Name</th>
            <th className="py-2 px-4 border text-center">Action</th>
          </tr>
        </thead>
        <tbody className="bg-white TopNav">
          {tanods.map((tanod) => (
            <tr key={tanod._id} className="hover:cursor-pointer">
              <td className="py-2 px-4 border text-center">
                <img
                  src={tanod.profilePicture || "/default-user-icon.png"}
                  alt={`${tanod.firstName} ${tanod.lastName}`}
                  className="w-12 h-12 rounded-full mx-auto"
                />
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

      {/* Display Previous Ratings */}
      {ratings.length > 0 && (
        <div className="mt-6">
          <h2 className="text-xl font-bold mb-4">Your Previous Ratings</h2>
          <table className="min-w-full TopNav">
            <thead>
              <tr>
                <th className="py-2 px-4 border">Tanod Name</th>
                <th className="py-2 px-4 border">Rating</th>
                <th className="py-2 px-4 border">Comment</th>
                <th className="py-2 px-4 border">Actions</th>
              </tr>
            </thead>
            <tbody>
              {ratings.map((rating) => (
                <tr key={rating._id}>
                  <td className="py-2 px-4 border-b text-center">
                    {rating.tanodId.firstName} {rating.tanodId.lastName}
                  </td>
                  <td className="py-2 px-4 border text-center">
                    {rating.rating}
                  </td>
                  <td className="py-2 px-4 border text-center">
                    {rating.comment}
                  </td>
                  <td className="py-2 px-4 border text-center">
                    <button
                      onClick={() => editRating(rating)}
                      className="bg-yellow-500 text-white px-2 py-1 rounded"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => deleteRating(rating._id)}
                      className="bg-red-500 text-white px-2 py-1 rounded ml-2"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Rating Form */}
      {selectedTanod && (
        <form
          onSubmit={handleSubmit}
          className="mt-4 TopNav p-4 rounded shadow-md"
        >
          <h2 className="text-xl mb-2">Rate Tanod</h2>
          <div className="mb-4">
            <label
              htmlFor="rating"
              className="block text-lg font-semibold mb-2"
            >
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
            <label
              htmlFor="comment"
              className="block text-lg font-semibold mb-2"
            >
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
              setEditingRatingId(null); // Reset editing state
            }}
            className="bg-gray-500 text-white px-4 py-2 rounded ml-2 hover:bg-gray-600"
          >
            Cancel
          </button>
        </form>
      )}
    </div>
  );
}

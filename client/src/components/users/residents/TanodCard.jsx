import React, { useState, useEffect } from "react";
import { FaStar, FaStarHalfAlt, FaUserCircle, FaComment } from "react-icons/fa";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const TanodCard = ({ tanod }) => {
  const [ratings, setRatings] = useState([]);
  const [averageRating, setAverageRating] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);

  const fetchRatings = async () => {
    try {
      const response = await fetch(
        `${process.env.REACT_APP_API_URL}/auth/${tanod._id}/rating`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        console.error(`Fetch error: ${response.status} ${response.statusText}`);
        throw new Error(`Network response was not ok: ${response.statusText}`);
      }

      const data = await response.json();
      setRatings(data.comments);

      // Calculate the average rating
      const totalRating = data.comments.reduce((sum, rating) => sum + rating.rating, 0);
      const avgRating = data.comments.length ? totalRating / data.comments.length : 0;
      setAverageRating(Number(avgRating.toFixed(1))); // Ensure averageRating is a number
    } catch (error) {
      console.error("Error fetching ratings:", error);
    }
  };

  useEffect(() => {
    fetchRatings();
  }, [tanod._id]);

  const renderStars = () => {
    const fullStars = Math.floor(averageRating);
    const hasHalfStar = averageRating % 1 !== 0;
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);

    return (
      <>
        {[...Array(fullStars)].map((_, index) => (
          <FaStar key={`full-${index}`} className="text-yellow-500 fill-current" />
        ))}
        {hasHalfStar && <FaStarHalfAlt className="text-yellow-500 fill-current" />}
        {[...Array(emptyStars)].map((_, index) => (
          <FaStar key={`empty-${index}`} className="text-gray-300" />
        ))}
      </>
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (rating === 0 || comment.trim() === "") {
      toast.error("Please provide both rating and comment");
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `${process.env.REACT_APP_API_URL}/auth/tanods/${tanod._id}/rate`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ rating, comment }),
        }
      );

      if (response.ok) {
        toast.success("Feedback submitted successfully");
        setIsModalOpen(false);
        setRating(0);
        setComment("");
        // Refresh ratings
        fetchRatings();
      } else {
        toast.error("Failed to submit feedback");
      }
    } catch (error) {
      toast.error("An error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="bg-white shadow-lg rounded-xl p-6 transform transition-all duration-300 hover:-translate-y-2 hover:shadow-xl border border-gray-200 TopNav">
        <div className="relative">
          {tanod.profilePicture ? (
            <img
              src={tanod.profilePicture}
              alt={`${tanod.firstName} ${tanod.lastName}`}
              className="w-32 h-32 rounded-full mx-auto mb-4 border-4 border-blue-100 object-cover"
            />
          ) : (
            <FaUserCircle className="w-32 h-32 rounded-full mx-auto mb-4" />
          )}
        </div>
        
        <h3 className="text-xl font-bold text-center  mb-2">
          {tanod.firstName} {tanod.lastName}
        </h3>
        
        <div className="flex justify-center items-center gap-2 mb-4">
          {renderStars()}
          <span className="text-gray-600 font-medium">({averageRating})</span>
        </div>

        <div className="space-y-4">
          <div className="bg-gray-50 rounded-lg p-4 max-h-40 overflow-y-auto">
            <h4 className="text-md font-semibold text-gray-700 mb-2">Recent Feedback:</h4>
            {ratings.length > 0 ? (
              <ul className="space-y-2">
                {ratings.slice(0, 3).map((rating, index) => (
                  <li key={index} className="text-sm text-gray-600 border-l-2 border-blue-200 pl-3">
                    <p className="italic">{rating.comment}</p>
                    <div className="flex items-center gap-2 mt-1 text-xs text-gray-400">
                      <span>{rating.rating} stars</span>
                      <span>•</span>
                      <span>{new Date(rating.createdAt).toLocaleDateString()}</span>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-gray-500">No feedback yet.</p>
            )}
          </div>

          <button
            onClick={() => setIsModalOpen(true)}
            className="w-full bg-blue-500 text-white py-2 px-4 rounded-lg hover:bg-blue-600 transition-colors duration-300 flex items-center justify-center gap-2"
          >
            <FaComment />
            Send Feedback
          </button>
        </div>
      </div>

      {/* Feedback Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 animate-fadeIn">
          <div className="bg-white rounded-xl p-6 w-full max-w-md m-4">
            <h2 className="text-xl font-bold mb-4">Send Feedback to {tanod.firstName}</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Rating</label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((value) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setRating(value)}
                      className={`text-2xl ${
                        value <= rating ? 'text-yellow-400' : 'text-gray-300'
                      } hover:text-yellow-400 transition-colors`}
                    >
                      ★
                    </button>
                  ))}
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Comment</label>
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  className="w-full border rounded-lg p-2 h-32"
                  placeholder="Write your feedback here..."
                  required
                />
              </div>

              <div className="flex gap-2 justify-end">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50"
                >
                  {loading ? 'Sending...' : 'Submit Feedback'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default TanodCard;

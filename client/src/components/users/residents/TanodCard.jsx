import React, { useState, useEffect } from "react";
import { FaStar, FaStarHalfAlt, FaUserCircle } from "react-icons/fa"; // Import FaUserCircle
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const TanodCard = ({ tanod }) => {
  const [ratings, setRatings] = useState([]);
  const [averageRating, setAverageRating] = useState(0);

  useEffect(() => {
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

  return (
    <div className="bg-white shadow-md rounded-lg p-4 TopNav border-2 border-gray-300">
      {tanod.profilePicture ? (
        <img
          src={tanod.profilePicture}
          alt={`${tanod.firstName} {tanod.lastName}`}
          className="w-24 h-24 rounded-full mx-auto mb-4 border-2 border-gray-300"
        />
      ) : (
        <FaUserCircle className="w-24 h-24 rounded-full mx-auto mb-4 text-gray-300" />
      )}
      <h3 className="text-lg font-bold text-center">
        {tanod.firstName} {tanod.lastName}
      </h3>
      <p className="text-center text-gray-600">{tanod.contactNumber}</p>
      <div className="flex justify-center items-center mt-2">
        {renderStars()}
        <span className="ml-2 text-gray-600">({averageRating})</span>
      </div>
      <div className="mt-4">
        <h4 className="text-md font-semibold">Comments:</h4>
        {ratings.length > 0 ? (
          <ul className={`mt-2 ${ratings.length > 3 ? 'max-h-32 overflow-y-scroll scrollbar-hide' : ''}`}>
            {ratings.map((rating, index) => (
              <li key={index} className="border-b py-2">
                <p className="text-sm text-gray-600">{rating.comment}</p>
                <p className="text-xs text-gray-400">
                  Rating: {rating.rating} - {new Date(rating.createdAt).toLocaleDateString()}
                </p>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-gray-500">No comments yet.</p>
        )}
      </div>
    </div>
  );
};

export default TanodCard;

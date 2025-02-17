import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from 'react-toastify'; 
import 'react-toastify/dist/ReactToastify.css'; 
import Loading from "../../../utils/Loading"; // Import your Loading component

export default function Perform() {
    const navigate = useNavigate();
    const [user, setUser] = useState({
        profilePicture: null,
        fullName: "",
        userId: null,
    });
    const [tanod, setTanod] = useState({
        profilePicture: null,
        overallRating: 0,
        ratingCounts: [0, 0, 0, 0, 0],
        comments: [],
    });
    const [users, setUsers] = useState([]);
    const [loadingRatings, setLoadingRatings] = useState(false);
    const [loadingUserProfile, setLoadingUserProfile] = useState(true);
    const [loadingComments, setLoadingComments] = useState(true);

    useEffect(() => {
        const fetchUserData = async () => {
            const token = localStorage.getItem("token");
            if (!token) {
                navigate("/login");
                return;
            }

            try {
                const response = await fetch(`${process.env.REACT_APP_API_URL}/auth/me`, {
                    method: "GET",
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                });

                const data = await response.json();
                if (response.ok) {
                    setUser({
                        profilePicture: data.profilePicture || null,
                        fullName: `${data.firstName} ${data.lastName}`,
                        userId: data._id,
                    });
                    setLoadingUserProfile(false);

                    fetchTanodRatings(data._id);
                    fetchAllUsers();
                } else {
                    toast.error(data.message || "Failed to load user data");
                }
            } catch (error) {
                toast.error("An error occurred while fetching user data.");
            }
        };

        const fetchAllUsers = async () => {
            const token = localStorage.getItem("token");
            try {
                const response = await fetch(`${process.env.REACT_APP_API_URL}/auth/users`, {
                    method: "GET",
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                });

                const data = await response.json();
                if (response.ok) {
                    setUsers(data);
                } else {
                    toast.error(data.message || "Failed to load user profiles");
                }
            } catch (error) {
                toast.error("An error occurred while fetching user profiles.");
            }
        };

        const fetchTanodRatings = async (tanodId) => {
            const token = localStorage.getItem("token");
            setLoadingRatings(true);

            try {
                const response = await fetch(`${process.env.REACT_APP_API_URL}/tanods/${tanodId}/ratings`, {
                    method: "GET",
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                });

                const data = await response.json();
                if (response.ok) {
                    setTanod(data);
                } else {
                    toast.error(data.message || "Failed to load Tanod ratings");
                }
            } catch (error) {
                toast.error("An error occurred while fetching Tanod ratings.");
            } finally {
                setLoadingRatings(false);
                setLoadingComments(false); // Ensure loadingComments is set to false here
            }
        };

        fetchUserData();
    }, [navigate]);

    return (
        <div className="flex flex-col md:flex-row justify-between items-start p-4">
            <div className="flex flex-col items-center md:items-start md:w-1/2 mb-4 md:mb-0">
                <div className="flex items-center justify-center mb-4">
                    {loadingUserProfile ? (
                        <Loading type="spinner" />
                    ) : (
                        <img
                            src={user.profilePicture || "/default-user-icon.png"}
                            alt="User Profile"
                            className="rounded-full w-32 h-32 object-cover border-2 border-gray-200"
                        />
                    )}
                    <h2 className="mt-4 ml-6 text-xl font-bold">{loadingUserProfile ? "Loading..." : user.fullName}</h2>
                </div>

                <div className="flex justify-between w-full max-w-md mb-4">
                    <div className="text-center flex flex-auto items-center justify-center">
                        <p className="text-lg font-semibold">
                            Overall Rating <br /> 
                            {loadingRatings ? "Loading Ratings..." : tanod.overallRating}
                        </p>
                    </div>
                    <div className="text-center">
                        <p className="text-lg font-semibold">Rating Counts</p>
                        <div className="flex flex-col items-center">
                            {tanod.ratingCounts.map((count, index) => (
                                <div key={index} className="flex items-center mb-1 w-full max-w-md">
                                    <span className="mr-2">{index + 1}:</span>
                                    <div className="flex-1 bg-gray-300 rounded-full h-4">
                                        <div
                                            className="bg-blue-500 h-full rounded-full"
                                            style={{ width: `${(count / Math.max(...tanod.ratingCounts, 1)) * 100}%` }}
                                        ></div>
                                    </div>
                                    <span className="ml-2 font-bold">
                                        {loadingRatings ? "Loading..." : count}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            <div className="md:w-1/2">
                <div>
                    <h3 className="text-lg font-semibold">Residents' Comments & Feedback</h3>
                    <ul className="list-disc pl-5 mt-3">
                        {loadingComments ? (
                            <li className="mb-2">Loading Comments...</li>
                        ) : tanod.comments.length === 0 ? (
                            <li className="mb-2">No ratings and feedback yet.</li>
                        ) : (
                            tanod.comments.map((commentData, index) => {
                                const userName = commentData.fullName || "Unknown User";

                                return (
                                    <li key={index} className="mb-2">
                                        <span className="font-bold">{userName}:</span> {commentData.comment} 
                                    </li>
                                );
                            })
                        )}
                    </ul>
                </div>
            </div>
        </div>
    );
}

import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast, ToastContainer } from "react-toastify";
import { FaArrowLeft } from "react-icons/fa";
import "react-toastify/dist/ReactToastify.css";
import TanodCard from "./TanodCard";

export default function TanodPersonels() {
  const [tanods, setTanods] = useState([]);
  const navigate = useNavigate();

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

  return (
    <div className="min-h-screen bg-gradient-to-r from-blue-500 to-indigo-600 p-8">
      <div className="container mx-auto">
        <button
          onClick={() => navigate('/Home')}
          className="bg-white text-blue-600 px-4 py-2 rounded-lg mb-8 flex items-center gap-2 hover:bg-blue-50 transition-colors"
        >
          <FaArrowLeft /> Back to Home
        </button>

        <div className="bg-white rounded-xl p-8 mb-12 animate__animated animate__fadeIn">
          <h1 className="text-4xl font-bold mb-6 text-center text-blue-600">
            Our Tanod Personnel
          </h1>
          <div className="max-w-3xl mx-auto text-center text-gray-600 space-y-4">
            <p>
              Our dedicated Tanod Personnel serve as the backbone of community safety and security. 
              These trained individuals work tirelessly to maintain peace and order in our community.
            </p>
            <p>
              Available 24/7, they respond to various situations from emergency calls to routine patrols, 
              ensuring the safety and well-being of all residents.
            </p>
            <div className="grid grid-cols-2 gap-4 mt-8 text-center">
              <div className="bg-blue-50 p-4 rounded-lg">
                <h3 className="font-bold text-blue-600 text-xl mb-2">24/7 Service</h3>
                <p>Round-the-clock availability for emergency response</p>
              </div>
              <div className="bg-blue-50 p-4 rounded-lg">
                <h3 className="font-bold text-blue-600 text-xl mb-2">Trained Professionals</h3>
                <p>Certified in emergency response and community safety</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 animate__animated animate__fadeIn">
          {tanods.map((tanod) => (
            <TanodCard key={tanod._id} tanod={tanod} />
          ))}
        </div>
      </div>
      <ToastContainer />
    </div>
  );
}

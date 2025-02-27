import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { RiGovernmentFill } from "react-icons/ri";
import ThemeToggle from "../components/forms/ThemeToggle";
import { FaHouseUser } from "react-icons/fa";
import { GiPoliceOfficerHead } from "react-icons/gi";

const SelectionPage = () => {
  const navigate = useNavigate();

  useEffect(() => {
    localStorage.removeItem('token');
    localStorage.removeItem('userType');
    const lastRefresh = localStorage.getItem("lastRefresh");
    const now = new Date().getTime();

    if (!lastRefresh || now - lastRefresh > 3600000) { // 1 hour = 3600000 ms
      localStorage.setItem("lastRefresh", now);
      localStorage.setItem("refreshed", "true");
      window.location.reload();
    } else {
      const refreshed = localStorage.getItem("refreshed");
      if (refreshed === "true") {
        localStorage.removeItem("refreshed");
        localStorage.removeItem('token');
        localStorage.removeItem('userType');
      }
    }
  }, []);

  const handleResidentClick = async () => {
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/auth/public-token`);
      const data = await response.json();
      localStorage.setItem("userType", "resident"); // Set userType to resident
      localStorage.setItem("token", data.token); // Set the public token
      navigate("/Home");
    } catch (error) {
      console.error('Error fetching public token:', error);
    }
  };

  const handleTanodClick = () => {
    navigate("/tanod-login");
  };

  return (
    <>
      <span className="mt-4">
        <ThemeToggle /> {"<--Click here to see a magic"}
      </span>
      <div className="flex flex-col items-center mt-20">
        <RiGovernmentFill className="text-6xl mb-2 text-blue-900" />
        <div className="text-2xl font-bold text-center">BARANGAY TANOD PATROL MANAGEMENT SYSTEM</div><br />
        <h1 className="text-3xl font-bold mb-8 text-center">Select Login Type</h1>
        <div className="flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-4">
          <div
            className="TopNav border border-gray-300 rounded-lg shadow-md p-6 w-64 cursor-pointer hover:shadow-lg transition flex flex-col items-center justify-center"
            onClick={handleResidentClick}
          >
            <FaHouseUser className="text-4xl mb-2" /> {/* Increased size */}
            <h2 className="text-xl font-semibold text-center">Resident Login</h2>
          </div>
          <div
            className="TopNav border border-gray-300 rounded-lg shadow-md p-6 w-64 cursor-pointer hover:shadow-lg transition flex flex-col items-center justify-center"
            onClick={handleTanodClick}
          >
            <GiPoliceOfficerHead className="text-4xl mb-2" /> {/* Increased size */}
            <h2 className="text-xl font-semibold text-center">Tanod Login</h2>
          </div>
        </div>
      </div>
    </>
  );
};

export default SelectionPage;

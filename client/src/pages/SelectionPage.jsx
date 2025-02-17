import React from "react";
import { useNavigate } from "react-router-dom";
import { RiGovernmentFill } from "react-icons/ri";
import ThemeToggle from "../components/forms/ThemeToggle";
import { FaHouseUser } from "react-icons/fa";
import { GiPoliceOfficerHead } from "react-icons/gi";

const SelectionPage = () => {
  const navigate = useNavigate();

  const handleResidentClick = () => {
    navigate("/resident-login");
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

import React from 'react';
import { FaUserCircle } from "react-icons/fa";
import { toast } from "react-toastify";

export default function TanodTable({ tanods, loading, handleDeleteTanod, handleEditClick }) {
  if (loading) {
    return (
      <div className="text-center py-4">
        Loading Tanod personnel...
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {tanods.map((tanod) => (
        <div key={tanod._id} className="bg-white rounded-xl shadow-lg p-6 TopNav hover:shadow-2xl transition-shadow duration-300 relative">
          {/* Status Indicator with Text */}
          <div className="absolute top-4 right-4 flex items-center">
            <span className={`text-xs mr-2 ${
              tanod.isOnline ? 'text-green-600' : 'text-gray-500'
            }`}>
              {tanod.isOnline ? 'Online' : 'Offline'}
            </span>
            <div className={`w-3 h-3 rounded-full ${
              tanod.isOnline ? 'bg-green-500' : 'bg-gray-400'
            } ring-2 ring-white`} />
          </div>

          <div className="flex flex-col items-center">
            <div className="relative mb-4">
              {tanod.profilePicture ? (
                <img
                  src={tanod.profilePicture}
                  alt={tanod.firstName}
                  className="w-28 h-28 rounded-full border-4 border-blue-100 shadow-md"
                />
              ) : (
                <FaUserCircle className="w-28 h-28 " />
              )}
            </div>

            <h2 className="text-xl font-bold mb-3 text-center">
              {`${tanod.firstName} ${tanod.middleName || ""} ${tanod.lastName}`}
            </h2>

            <div className="space-y-1 text-center mb-4">
              <p className="">{tanod.contactNumber || "No contact number"}</p>
              <p className="text-sm break-words">{tanod.email || "No email"}</p>
            </div>

            <div className="flex justify-center space-x-3 w-full">
              <button
                className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 transition-colors duration-200 flex-1"
                onClick={() => handleEditClick(tanod)}
              >
                Edit
              </button>
              <button
                className="bg-red-500 text-white px-6 py-2 rounded-lg hover:bg-red-600 transition-colors duration-200 flex-1"
                onClick={() => handleDeleteTanod(tanod._id)}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

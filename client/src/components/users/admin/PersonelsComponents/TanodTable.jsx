import React from 'react';
import { FaUserCircle } from "react-icons/fa";
import { toast } from "react-toastify";

export default function TanodTable({ tanods, loading, handleDeleteTanod, handleEditClick }) {
  return (
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
                  {tanod.profilePicture ? (
                    <img
                      src={tanod.profilePicture}
                      alt={tanod.firstName}
                      className="w-10 h-10 rounded-full mx-auto"
                    />
                  ) : (
                    <FaUserCircle className="w-10 h-10 rounded-full mx-auto text-gray-300" />
                  )}
                </td>
                <td className="py-2 px-4 border">
                  {`${tanod.firstName} ${tanod.middleName || ""} ${tanod.lastName}`}
                </td>
                <td className="py-2 px-4 border">
                  {tanod.contactNumber || "N/A"}
                </td>
                <td className="py-2 px-4 border">{tanod.email || "N/A"}</td>
                <td className="py-2 px-4 border">
                  <button
                    className="bg-green-500 text-white w-24 h-10 rounded mx-1 my-1 hover:bg-green-700"
                    onClick={() => handleEditClick(tanod)}
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
  );
}

import React, { useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";

const ScheduleMembers = ({ scheduleMembers, setShowMembersTable, scheduleId }) => {
  const [showPatrolLogsModal, setShowPatrolLogsModal] = useState(false);
  const [patrolLogs, setPatrolLogs] = useState([]);
  const [selectedMember, setSelectedMember] = useState(null);

  const fetchPatrolLogs = async (memberId) => {
    const token = localStorage.getItem("token");
    if (!token) {
      toast.error("Please log in.");
      return;
    }

    try {
      if (!scheduleId) {
        toast.error("Invalid schedule ID.");
        return;
      }
      const response = await axios.get(
        `${process.env.REACT_APP_API_URL}/auth/patrol-logs/${memberId}/${scheduleId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setPatrolLogs(response.data);
      setShowPatrolLogsModal(true);
    } catch (error) {
      console.error("Error fetching patrol logs:", error);
      toast.error("Error fetching patrol logs.");
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-900 bg-opacity-75 z-50 flex justify-center items-center">
      <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-4xl relative TopNav">
        <h2 className="text-xl font-bold mb-4">Assigned Tanod Members</h2>
        <button
          onClick={() => setShowMembersTable(false)}
          className="absolute top-2 right-2 text-red-500 hover:text-red-700"
        >
          &#x2715;
        </button>
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white shadow-md rounded-lg border overflow-hidden text-center">
            <thead className="TopNav">
              <tr>
                <th className="w-1/12">Profile Picture</th>
                <th className="w-2/12">Full Name</th>
                <th className="w-2/12">Contact Number</th>
                <th className="w-1/12">Status</th>
                <th className="w-2/12">Start Time</th>
                <th className="w-2/12">End Time</th>
                <th className="w-2/12">Patrol Logs</th>
              </tr>
            </thead>
            <tbody className="text-black">
              {scheduleMembers.map((member) => (
                <tr key={member._id}>
                  <td className="border">
                    <img
                      src={
                        member.profilePicture ||
                        "https://via.placeholder.com/50"
                      }
                      alt={member.firstName}
                      className="w-10 h-10 rounded-full mx-auto"
                    />
                  </td>
                  <td className="border">{`${member.firstName} ${member.lastName}`}</td>
                  <td className="border">
                    {member.contactNumber || "N/A"}
                  </td>
                  <td className="border">
                    {member.status}
                  </td>
                  <td className="border">
                    {member.startTime ? new Date(member.startTime).toLocaleString() : "N/A"}
                  </td>
                  <td className="border">
                    {member.endTime ? new Date(member.endTime).toLocaleString() : "N/A"}
                  </td>
                  <td className="border">
                    <button
                      onClick={() => {
                        setSelectedMember(member);
                        fetchPatrolLogs(member._id); // Fetch patrol logs for the selected member
                      }}
                      className="bg-blue-500 text-white px-4 py-2 rounded"
                    >
                      View Logs
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showPatrolLogsModal && (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-75 z-50 flex justify-center items-center">
          <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-4xl relative TopNav">
            <h2 className="text-xl font-bold mb-4">Patrol Logs for {selectedMember?.firstName} {selectedMember?.lastName}</h2>
            <button
              onClick={() => setShowPatrolLogsModal(false)}
              className="absolute top-2 right-2 text-red-500 hover:text-red-700"
            >
              &#x2715;
            </button>
            <div className="overflow-x-auto">
              <table className="min-w-full bg-white shadow-md rounded-lg border overflow-hidden text-center">
                <thead className="TopNav">
                  <tr>
                    <th className="w-1/4">Date and Time</th>
                    <th className="w-3/4">Log</th>
                  </tr>
                </thead>
                <tbody className="text-black">
                  {patrolLogs.length === 0 ? (
                    <tr>
                      <td colSpan="2" className="border px-4 py-2">No patrol logs recorded.</td>
                    </tr>
                  ) : (
                    patrolLogs.map((log, index) => (
                      <tr key={index}>
                        <td className="border px-4 py-2">{new Date(log.timestamp).toLocaleString()}</td>
                        <td className="border px-4 py-2">{log.log}</td> {/* Use log.log instead of log.report */}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ScheduleMembers;

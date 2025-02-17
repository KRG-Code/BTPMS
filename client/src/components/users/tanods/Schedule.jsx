import React, { useState, useEffect } from "react";
import axios from "axios";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Loading from "../../../utils/Loading"; // Assuming you have a Loading component

export default function TanodSchedule() {
  const [schedules, setSchedules] = useState([]);
  const [scheduleMembers, setScheduleMembers] = useState([]);
  const [showMembersTable, setShowMembersTable] = useState(false);
  const [userId, setUserId] = useState(null);
  const [loadingSchedules, setLoadingSchedules] = useState(false);
  const [loadingMembers, setLoadingMembers] = useState(false);

  const fetchUserProfile = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      toast.error("Please log in.");
      return null;
    }

    try {
      const response = await axios.get(`${process.env.REACT_APP_API_URL}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUserId(response.data._id);
      return response.data._id;
    } catch (error) {
      console.error("Error fetching user profile:", error);
      toast.error("Error fetching user profile.");
      return null;
    }
  };

  useEffect(() => {
    const fetchSchedules = async () => {
      const token = localStorage.getItem("token");
      const userId = await fetchUserProfile();
      if (!token || !userId) return;

      setLoadingSchedules(true);
      try {
        const response = await axios.get(
          `${process.env.REACT_APP_API_URL}/auth/tanod-schedules/${userId}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        const schedulesWithPatrolArea = await Promise.all(
          response.data.map(async (schedule) => {
            if (schedule.patrolArea && typeof schedule.patrolArea === 'object' && schedule.patrolArea._id) {
              const patrolAreaResponse = await axios.get(
                `${process.env.REACT_APP_API_URL}/polygons/${schedule.patrolArea._id}`,
                {
                  headers: { Authorization: `Bearer ${token}` },
                }
              );
              schedule.patrolArea = patrolAreaResponse.data;
            } else if (schedule.patrolArea) {
              const patrolAreaResponse = await axios.get(
                `${process.env.REACT_APP_API_URL}/polygons/${schedule.patrolArea}`,
                {
                  headers: { Authorization: `Bearer ${token}` },
                }
              );
              schedule.patrolArea = patrolAreaResponse.data;
            }
            return schedule;
          })
        );
        setSchedules(schedulesWithPatrolArea);
      } catch (error) {
        console.error("Error fetching schedules:", error);
        toast.error("Error fetching schedules.");
      } finally {
        setLoadingSchedules(false);
      }
    };

    fetchSchedules();
  }, []);

  const handleViewMembers = async (scheduleId) => {
    const token = localStorage.getItem("token");

    setLoadingMembers(true);
    try {
      const response = await axios.get(
        `${process.env.REACT_APP_API_URL}/auth/schedule/${scheduleId}/members`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setScheduleMembers(response.data.tanods);
      setShowMembersTable(true);
    } catch (error) {
      console.error("Error fetching members:", error);
      toast.error("Error fetching members.");
    } finally {
      setLoadingMembers(false);
    }
  };

  return (
    <div className="container mx-auto">
      <ToastContainer />
      <h1 className="text-2xl font-bold mb-4">Your Schedule</h1>

      <h2 className="text-xl font-bold mb-4">Scheduled Patrols</h2>
      <table className="min-w-full bg-white shadow-md rounded-lg border overflow-hidden text-center">
        <thead className=" TopNav">
          <tr>
            <th className="border">Unit</th>
            <th className="border">Start Time</th>
            <th className="border">End Time</th>
            <th className="border">Patrol Area</th>
            <th className="border">Actions</th>
          </tr>
        </thead>
        <tbody className="text-black">
          {loadingSchedules ? (
            <tr>
              <td colSpan="5" className="text-center">
                <Loading type="circle" />
                Loading Schedules...
              </td>
            </tr>
          ) : schedules.length === 0 ? (
            <tr>
              <td colSpan="5" className="text-center">
                No schedule set yet.
              </td>
            </tr>
          ) : (
            schedules.map((schedule) => (
              <tr key={schedule._id}>
                <td className="border">{schedule.unit}</td>
                <td className="border">{new Date(schedule.startTime).toLocaleString()}</td>
                <td className="border">{new Date(schedule.endTime).toLocaleString()}</td>
                <td className="border">{schedule.patrolArea ? schedule.patrolArea.legend : "N/A"}</td>
                <td className="border">
                  <button
                    className="bg-green-500 text-white px-2 py-1 rounded mx-1 my-3"
                    onClick={() => handleViewMembers(schedule._id)}
                  >
                    View Members
                  </button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>

      {/* Modal for Viewing Members */}
      {showMembersTable && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg w-11/12 max-w-lg relative TopNav">
            <h2 className="text-xl font-bold mb-4 flex justify-between items-center">
              Assigned Tanod Members
              <button
                onClick={() => setShowMembersTable(false)}
                className="bg-red-500 text-white px-3 py-1 rounded"
              >
                Close
              </button>
            </h2>
            <table className="min-w-full bg-white border text-center">
              <thead className=" TopNav">
                <tr>
                  <th className="border">Profile Picture</th>
                  <th className="border">Full Name</th>
                  <th className="border">Contact Number</th>
                </tr>
              </thead>
              <tbody className="text-black">
                {loadingMembers ? (
                  <tr>
                    <td colSpan="3" className="text-center">
                      <Loading type="circle" />
                      Loading Members...
                    </td>
                  </tr>
                ) : (
                  scheduleMembers.map((member) => (
                    <tr key={member._id}>
                      <td className="border">
                        <img
                          src={member.profilePicture || "https://via.placeholder.com/50"}
                          alt={member.firstName}
                          className="w-10 h-10 rounded-full mx-auto"
                        />
                      </td>
                      <td className="border">{`${member.firstName} ${member.lastName}`}</td>
                      <td className="border">{member.contactNumber || "N/A"}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

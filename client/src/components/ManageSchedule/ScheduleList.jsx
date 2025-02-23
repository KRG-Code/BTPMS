import React, { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const ScheduleList = ({
  schedules,
  setSchedules,
  setUnit,
  setSelectedTanods,
  setStartTime,
  setEndTime,
  setOriginalStartTime,
  setCurrentScheduleId,
  setIsEditing,
  setShowForm,
  fetchSchedules,
  handleViewMembers,
  handleDeleteSchedule,
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterDate, setFilterDate] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [loadingSchedules, setLoadingSchedules] = useState(false);
  const [error, setError] = useState(null);

  const filteredSchedules = schedules.filter((schedule) => {
    const matchesSearchTerm = schedule.unit
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    const matchesFilterDate = filterDate
      ? new Date(schedule.startTime).toLocaleDateString() ===
        new Date(filterDate).toLocaleDateString()
      : true;
    const matchesFilterStatus = filterStatus
      ? schedule.status === filterStatus
      : true;
    return matchesSearchTerm && matchesFilterDate && matchesFilterStatus;
  });

  const handleRefresh = async () => {
    setLoadingSchedules(true);
    setError(null);
    try {
      await fetchSchedules(setSchedules, setLoadingSchedules);
    } catch (err) {
      setError("Failed to fetch schedules. Please try again later.");
    } finally {
      setLoadingSchedules(false);
    }
  };

  useEffect(() => {
    handleRefresh();
  }, []);

  return (
    <div className="container mx-auto relative p-4">
      <div className="mb-4 flex flex-col md:flex-row justify-end gap-3">
        <h2 className="text-2xl font-bold mb-4 mt-3 w-full md:w-8/12">Scheduled list</h2>
        <input
          type="text"
          placeholder="Search by unit"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="border p-2 rounded w-full md:w-3/12 text-black"
        />
        <input
          type="date"
          value={filterDate}
          onChange={(e) => setFilterDate(e.target.value)}
          className="border p-2 rounded w-full md:w-2/12 text-black"
        />
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="border p-2 rounded w-full md:w-2/12 text-black"
        >
          <option value="">All Statuses</option>
          <option value="Upcoming">Upcoming</option>
          <option value="Ongoing">Ongoing</option>
          <option value="Completed">Completed</option>
        </select>
        <button
          onClick={handleRefresh}
          className="bg-blue-500 text-white px-4 py-2 rounded"
        >
          Refresh
        </button>
      </div>
      <div className="h-full border-separate overflow-clip rounded-xl border border-solid flex flex-col">
        <div className="overflow-y-auto" style={{ maxHeight: "300px" }}>
          <table className="w-full table-fixed border-collapse">
            <thead className="sticky top-0 z-10 TopNav">
              <tr>
                <th className="border px-4 py-2">Unit</th>
                <th className="border px-4 py-2">Start Time</th>
                <th className="border px-4 py-2">End Time</th>
                <th className="border px-4 py-2">Patrol Area</th>
                <th className="border px-4 py-2">Status</th>
                <th className="border px-4 py-2">Actions</th>
              </tr>
            </thead>
            <tbody className="text-black bg-white text-center align-middle">
              {loadingSchedules ? (
                <tr>
                  <td colSpan="6" className="text-center py-4">
                    Loading Schedules...
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan="6" className="text-center py-4 text-red-500">
                    {error}
                  </td>
                </tr>
              ) : filteredSchedules.length === 0 ? (
                <tr>
                  <td colSpan="6" className="text-center py-4">
                    No schedules found.
                  </td>
                </tr>
              ) : (
                filteredSchedules.map((schedule) => (
                  <tr key={schedule._id}>
                    <td className="border px-4 py-2">{schedule.unit}</td>
                    <td className="border px-4 py-2">
                      {new Date(schedule.startTime).toLocaleString()}
                    </td>
                    <td className="border px-4 py-2">
                      {new Date(schedule.endTime).toLocaleString()}
                    </td>
                    <td className="border px-4 py-2">
                      {schedule.patrolArea ? schedule.patrolArea.legend : "N/A"}
                    </td>
                    <td className="border px-4 py-2">
                      {schedule.status}
                    </td>
                    <td className="border px-4 py-2">
                    <div className="flex justify-center space-x-2">
                  <button
                    className="bg-green-500 text-white w-32 h-10 rounded whitespace-nowrap text-sm"
                    onClick={() => {
                      setCurrentScheduleId(schedule._id); // Set the current schedule ID
                      handleViewMembers(schedule);
                    }}
                  >
                    View Members
                  </button>
                  <button
                    className="bg-yellow-500 text-white w-32 h-10 rounded whitespace-nowrap text-sm"
                    onClick={() => {
                      setUnit(schedule.unit);
                      setSelectedTanods(
                        schedule.tanods.map((tanod) => tanod._id)
                      );
                      setStartTime(schedule.startTime);
                      setEndTime(schedule.endTime);
                      setOriginalStartTime(
                        new Date(schedule.startTime)
                          .toLocaleString("sv")
                          .slice(0, 16)
                      );
                      setCurrentScheduleId(schedule._id);
                      setIsEditing(true);
                      setShowForm(true);
                    }}
                  >
                    Edit
                  </button>
                  <button
                    className="bg-red-500 text-white w-32 h-10 rounded whitespace-nowrap text-sm"
                    onClick={() => handleDeleteSchedule(schedule._id)}
                  >
                    Delete
                  </button>
                </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ScheduleList;

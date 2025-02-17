import React, { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

export default function ScheduleMaker() {
  const [tanods, setTanods] = useState([]);
  const [unit, setUnit] = useState("Unit 1");
  const [selectedTanods, setSelectedTanods] = useState([]);
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [schedules, setSchedules] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentScheduleId, setCurrentScheduleId] = useState(null);
  const [originalStartTime, setOriginalStartTime] = useState("");
  const [showAddTanodModal, setShowAddTanodModal] = useState(false);
  const [showRemoveTanodModal, setShowRemoveTanodModal] = useState(false);
  const [scheduleMembers, setScheduleMembers] = useState([]);
  const [showMembersTable, setShowMembersTable] = useState(false);
  const [loadingSchedules, setLoadingSchedules] = useState(false);
  const [checkedTanods, setCheckedTanods] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterDate, setFilterDate] = useState("");

  useEffect(() => {
    const fetchTanods = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        toast.error("Please log in.");
        return;
      }

      try {
        const response = await axios.get(
          `${process.env.REACT_APP_API_URL}/auth/users`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        setTanods(response.data.filter((user) => user.userType === "tanod"));
      } catch (error) {
        console.error("Error fetching tanods:", error);
        toast.error("Error fetching tanods.");
      }
    };

    fetchTanods();
  }, []);

  const handleCreateOrUpdateSchedule = async (e) => {
    e.preventDefault();

    // Validate that at least one Tanod is selected
    if (selectedTanods.length === 0) {
      toast.error("Please select at least one Tanod.");
      return; // Prevent form submission if no Tanod is selected
    }

    const token = localStorage.getItem("token");
    const url = isEditing
      ? `${process.env.REACT_APP_API_URL}/auth/schedule/${currentScheduleId}`
      : `${process.env.REACT_APP_API_URL}/auth/schedule`;

    try {
      const response = await axios({
        method: isEditing ? "put" : "post",
        url,
        data: { unit, tanods: selectedTanods, startTime, endTime },
        headers: { Authorization: `Bearer ${token}` },
      });

      if (isEditing) {
        setSchedules(
          schedules.map((schedule) =>
            schedule._id === currentScheduleId
              ? response.data.schedule
              : schedule
          )
        );
        fetchSchedules();
        toast.success("Schedule updated successfully!");
      } else {
        fetchSchedules();
        setSchedules([...schedules, response.data.schedule]);
        toast.success("Schedule created successfully!");
      }

      resetForm();
    } catch (error) {
      console.error("Error creating/updating schedule:", error);
      toast.error("Error creating/updating schedule.");
    }
  };

  const fetchSchedules = async () => {
    setLoadingSchedules(true);
    const token = localStorage.getItem("token");
    if (!token) return;

    try {
      const response = await axios.get(
        `${process.env.REACT_APP_API_URL}/auth/schedules`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
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
          const currentTime = new Date();
          if (new Date(schedule.startTime) <= currentTime && new Date(schedule.endTime) >= currentTime) {
            schedule.status = 'Ongoing';
          } else if (new Date(schedule.endTime) < currentTime) {
            schedule.status = 'Completed';
          } else {
            schedule.status = 'Upcoming';
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

  useEffect(() => {
    fetchSchedules();
  }, []);

  const handleCancel = () => {
    setShowForm(false);
    resetForm();
  };

  const resetForm = () => {
    setUnit("Unit 1");
    setSelectedTanods([]);
    setStartTime("");
    setEndTime("");
    setIsEditing(false);
    setCurrentScheduleId(null);
    setOriginalStartTime("");
    setShowForm(false);
  };

  const handleViewMembers = async (schedule) => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(
        `${process.env.REACT_APP_API_URL}/auth/schedule/${schedule._id}/members`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      setScheduleMembers(response.data.tanods.map(tanod => {
        const memberStatus = schedule.patrolStatus.find(status => status.tanodId === tanod._id);
        return {
          ...tanod,
          status: memberStatus ? memberStatus.status : 'Not Started',
          startTime: memberStatus ? memberStatus.startTime : null,
          endTime: memberStatus ? memberStatus.endTime : null,
        };
      }));
      setShowMembersTable(true);
    } catch (error) {
      console.error("Error fetching members:", error);
      toast.error("Error fetching members.");
    }
  };

  const handleDeleteSchedule = async (scheduleId) => {
    toast.info(
      <div>
        <p>Are you sure you want to delete this schedule?</p>
        <button
          className="bg-green-500 text-white p-2 rounded m-2"
          onClick={() => confirmDeleteSchedule(scheduleId)}
        >
          Yes
        </button>
        <button
          className="bg-red-500 text-white p-2 rounded m-2"
          onClick={() => toast.dismiss()}
        >
          No
        </button>
      </div>,
      { autoClose: false }
    );
  };

  const confirmDeleteSchedule = async (scheduleId) => {
    const token = localStorage.getItem("token");
    try {
      await axios.delete(
        `${process.env.REACT_APP_API_URL}/auth/schedule/${scheduleId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setSchedules(schedules.filter((schedule) => schedule._id !== scheduleId));
      fetchSchedules();
      toast.dismiss();
      toast.success("Schedule deleted successfully!");
    } catch (error) {
      console.error("Error deleting schedule:", error);
      toast.error("Error deleting schedule.");
    }
  };

  const handleAddSelectedTanods = () => {
    setSelectedTanods((prev) => [...prev, ...checkedTanods]);
    setCheckedTanods([]);
    setShowAddTanodModal(false);
  };

  const handleRemoveSelectedTanods = () => {
    setSelectedTanods((prev) =>
      prev.filter((id) => !checkedTanods.includes(id))
    );
    setCheckedTanods([]);
    setShowRemoveTanodModal(false);
  };

  const handleToggleCheckbox = (tanodId) => {
    setCheckedTanods((prev) =>
      prev.includes(tanodId)
        ? prev.filter((id) => id !== tanodId)
        : [...prev, tanodId]
    );
  };

  const filteredSchedules = schedules.filter((schedule) => {
    const matchesSearchTerm = schedule.unit
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    const matchesFilterDate = filterDate
      ? new Date(schedule.startTime).toLocaleDateString() ===
        new Date(filterDate).toLocaleDateString()
      : true;
    return matchesSearchTerm && matchesFilterDate;
  });

  const getMinDateTime = () => {
    const now = new Date();
    return now.toISOString().slice(0, 16);
  };

  const handleRefresh = () => {
    fetchSchedules();
  };

  return (
    <div className="container mx-auto relative p-4">
      <h1 className="text-2xl font-bold mb-4">Schedule Maker</h1>

      <button
        onClick={() => {
          resetForm();
          setShowForm(true);
        }}
        className="bg-blue-500 text-white px-4 py-2 rounded mb-4"
        hidden={showForm}
      >
        Create Schedule
      </button>

      {showForm && (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-75 z-50 flex justify-center items-center p-4">
          <form
            onSubmit={handleCreateOrUpdateSchedule}
            className="bg-white p-6 rounded-lg shadow-lg w-full max-w-lg relative TopNav"
          >
            <button
              onClick={() => setShowForm(false)}
              className="absolute top-2 right-2 text-red-500 hover:text-red-700"
            >
              &#x2715;
            </button>
            <h2 className="text-xl font-bold mb-4">
              {isEditing ? "Edit Schedule" : "Create Schedule"}
            </h2>

            <div className="mb-4">
              <label className="block mb-1">Unit:</label>
              <select
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                className="border p-2 rounded w-full text-black"
              >
                <option value="Unit 1">Unit 1</option>
                <option value="Unit 2">Unit 2</option>
                <option value="Unit 3">Unit 3</option>
              </select>
            </div>

            <div className="mb-4">
              <label className="block mb-1">Tanods:</label>
              <div>
                <button
                  type="button"
                  onClick={() => setShowAddTanodModal(true)}
                  className="bg-green-500 text-white px-4 py-2 rounded mb-2"
                >
                  Add Tanods
                </button>
                <button
                  type="button"
                  onClick={() => setShowRemoveTanodModal(true)}
                  className="bg-red-500 text-white px-4 py-2 rounded mb-2 ml-2"
                >
                  Remove Tanods
                </button>
              </div>
              <ul>
                {selectedTanods.map((tanodId) => {
                  const tanod = tanods.find((t) => t._id === tanodId);
                  return (
                    <li key={tanodId} className="flex items-center mb-2">
                      <img
                        src={
                          tanod?.profilePicture ||
                          "https://via.placeholder.com/50"
                        }
                        alt={tanod?.firstName}
                        className="w-8 h-8 rounded-full mr-2"
                      />
                      {tanod?.firstName} {tanod?.lastName}
                    </li>
                  );
                })}
              </ul>
            </div>

            <div className="mb-4">
              <label className="block mb-1">Start Time:</label>
              <input
                type="datetime-local"
                value={
                  startTime
                    ? new Date(startTime).toLocaleString("sv").slice(0, 16)
                    : ""
                }
                onChange={(e) => setStartTime(e.target.value)}
                className="border p-2 rounded w-full text-black"
                min={isEditing ? originalStartTime : getMinDateTime()}
                required
              />
            </div>

            <div className="mb-4">
              <label className="block mb-1">End Time:</label>
              <input
                type="datetime-local"
                value={
                  endTime
                    ? new Date(endTime).toLocaleString("sv").slice(0, 16)
                    : ""
                }
                onChange={(e) => setEndTime(e.target.value)}
                className="border p-2 rounded w-full text-black"
                min={startTime || getMinDateTime()}
                required
              />
            </div>

            <div className="flex justify-between">
              <button
                type="submit"
                className="bg-green-500 text-white px-4 py-2 rounded"
              >
                {isEditing ? "Update Schedule" : "Create Schedule"}
              </button>
              <button
                type="button"
                className="bg-red-500 text-white px-4 py-2 rounded"
                onClick={handleCancel}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

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
                    onClick={() => handleViewMembers(schedule)}
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

      {showMembersTable && (
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
              <table className="min-w-full bg-white shadow-md rounded-lg border overflow-hidden">
                <thead className="TopNav">
                  <tr>
                    <th>Profile Picture</th>
                    <th>Full Name</th>
                    <th>Contact Number</th>
                    <th>Status</th>
                    <th>Start Time</th>
                    <th>End Time</th>
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
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Add Tanod Modal */}
      {showAddTanodModal && (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-75 z-50 flex justify-center items-center">
          <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-lg relative TopNav">
            <h2 className="text-xl font-bold mb-4">Add Tanods</h2>
            <button
              onClick={() => setShowAddTanodModal(false)}
              className="absolute top-2 right-2 text-red-500 hover:text-red-700"
            >
              &#x2715;
            </button>
            <div className="overflow-y-auto h-64">
              {tanods
                .filter((tanod) => !selectedTanods.includes(tanod._id))
                .map((tanod) => (
                  <div key={tanod._id} className="mb-2 flex items-center">
                    <input
                      type="checkbox"
                      value={tanod._id}
                      onChange={() => handleToggleCheckbox(tanod._id)}
                      className="mr-2"
                    />
                    <img
                      src={
                        tanod.profilePicture || "https://via.placeholder.com/50"
                      }
                      alt={tanod.firstName}
                      className="w-8 h-8 rounded-full mr-2"
                    />
                    {tanod.firstName} {tanod.lastName}
                  </div>
                ))}
            </div>
            <button
              onClick={handleAddSelectedTanods}
              className="bg-green-500 text-white px-4 py-2 rounded mt-4"
            >
              Add Selected
            </button>
          </div>
        </div>
      )}

      {/* Remove Tanod Modal */}
      {showRemoveTanodModal && (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-75 z-50 flex justify-center items-center">
          <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-lg relative TopNav">
            <h2 className="text-xl font-bold mb-4">Remove Tanods</h2>
            <button
              onClick={() => setShowRemoveTanodModal(false)}
              className="absolute top-2 right-2 text-red-500 hover:text-red-700"
            >
              &#x2715;
            </button>
            <div className="overflow-y-auto h-64">
              {selectedTanods.map((tanodId) => {
                const tanod = tanods.find((t) => t._id === tanodId);
                return (
                  <div key={tanodId} className="mb-2 flex items-center">
                    <input
                      type="checkbox"
                      onChange={() => handleToggleCheckbox(tanodId)}
                      className="mr-2"
                    />
                    <img
                      src={
                        tanod?.profilePicture ||
                        "https://via.placeholder.com/50"
                      }
                      alt={tanod?.firstName}
                      className="w-8 h-8 rounded-full mr-2"
                    />
                    {tanod?.firstName} {tanod?.lastName}
                  </div>
                );
              })}
            </div>
            <button
              onClick={handleRemoveSelectedTanods}
              className="bg-green-500 text-white px-4 py-2 rounded mt-4"
            >
              Remove Selected
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

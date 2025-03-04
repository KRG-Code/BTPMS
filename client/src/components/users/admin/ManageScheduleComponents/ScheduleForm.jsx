import React, { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import TanodModal from "./TanodModal";
import { FaUserCircle } from 'react-icons/fa';

const ScheduleForm = ({
  isEditing,
  currentScheduleId,
  unit,
  setUnit,
  selectedTanods,
  setSelectedTanods,
  startTime,
  setStartTime,
  endTime,
  setEndTime,
  originalStartTime,
  setOriginalStartTime,
  resetForm,
  fetchSchedules,
  schedules,
  setSchedules,
  setShowForm,
  tanods,
}) => {
  const [scheduleStatus, setScheduleStatus] = useState("Upcoming");
  const [showAddTanodModal, setShowAddTanodModal] = useState(false);
  const [showRemoveTanodModal, setShowRemoveTanodModal] = useState(false);
  const [checkedTanods, setCheckedTanods] = useState([]);

  useEffect(() => {
    if (isEditing && currentScheduleId) {
      const schedule = schedules.find((s) => s._id === currentScheduleId);
      if (schedule) {
        setScheduleStatus(schedule.status);
      }
    }
  }, [isEditing, currentScheduleId, schedules]);

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

  const getMinDateTime = () => {
    const now = new Date();
    return now.toISOString().slice(0, 16);
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

  return (
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
                  {tanod?.profilePicture ? (
                    <img
                      src={tanod?.profilePicture}
                      alt={tanod?.firstName}
                      className="w-8 h-8 rounded-full mr-2"
                    />
                  ) : (
                    <FaUserCircle className="w-8 h-8 rounded-full mr-2 text-gray-300" />
                  )}
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
            disabled={scheduleStatus !== "Upcoming"} // Disable if status is not Upcoming
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
            disabled={scheduleStatus !== "Upcoming"} // Disable if status is not Upcoming
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
            onClick={() => setShowForm(false)}
          >
            Cancel
          </button>
        </div>
      </form>

      <TanodModal
        showAddTanodModal={showAddTanodModal}
        setShowAddTanodModal={setShowAddTanodModal}
        showRemoveTanodModal={showRemoveTanodModal}
        setShowRemoveTanodModal={setShowRemoveTanodModal}
        tanods={tanods}
        selectedTanods={selectedTanods}
        handleToggleCheckbox={handleToggleCheckbox}
        handleAddSelectedTanods={handleAddSelectedTanods}
        handleRemoveSelectedTanods={handleRemoveSelectedTanods}
        checkedTanods={checkedTanods}
      />
    </div>
  );
};

export default ScheduleForm;


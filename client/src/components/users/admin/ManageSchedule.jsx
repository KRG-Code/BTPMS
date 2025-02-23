import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import ScheduleForm from "../../ManageSchedule/ScheduleForm";
import ScheduleList from "../../ManageSchedule/ScheduleList";
import ScheduleMembers from "../../ManageSchedule/ScheduleMembers";
import TanodModal from "../../ManageSchedule/TanodModal";
import {
  fetchTanods,
  fetchSchedules,
  handleCreateOrUpdateSchedule,
  handleDeleteSchedule,
  handleViewMembers,
} from "../../ManageSchedule/ScheduleUtils";

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
    fetchTanods(setTanods);
  }, []);

  useEffect(() => {
    fetchSchedules(setSchedules, setLoadingSchedules);
  }, []);

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

  const handleCancel = () => {
    setShowForm(false);
    resetForm();
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

  const handleRefresh = () => {
    fetchSchedules(setSchedules, setLoadingSchedules);
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
        <ScheduleForm
          isEditing={isEditing}
          currentScheduleId={currentScheduleId}
          unit={unit}
          setUnit={setUnit}
          selectedTanods={selectedTanods}
          setSelectedTanods={setSelectedTanods}
          startTime={startTime}
          setStartTime={setStartTime}
          endTime={endTime}
          setEndTime={setEndTime}
          originalStartTime={originalStartTime}
          setOriginalStartTime={setOriginalStartTime}
          resetForm={resetForm}
          fetchSchedules={() => fetchSchedules(setSchedules, setLoadingSchedules)}
          schedules={schedules}
          setSchedules={setSchedules}
          setShowForm={setShowForm}
          tanods={tanods}
        />
      )}

      <ScheduleList
        schedules={schedules}
        setSchedules={setSchedules}
        setUnit={setUnit}
        setSelectedTanods={setSelectedTanods}
        setStartTime={setStartTime}
        setEndTime={setEndTime}
        setOriginalStartTime={setOriginalStartTime}
        setCurrentScheduleId={setCurrentScheduleId}
        setIsEditing={setIsEditing}
        setShowForm={setShowForm}
        fetchSchedules={() => fetchSchedules(setSchedules, setLoadingSchedules)}
        handleViewMembers={(schedule) =>
          handleViewMembers(schedule, setScheduleMembers, setShowMembersTable)
        }
        handleDeleteSchedule={(scheduleId) =>
          handleDeleteSchedule(scheduleId, setSchedules, schedules, () =>
            fetchSchedules(setSchedules, setLoadingSchedules)
          )
        }
      />

      {showMembersTable && (
        <ScheduleMembers
          scheduleMembers={scheduleMembers}
          setShowMembersTable={setShowMembersTable}
          scheduleId={currentScheduleId}
        />
      )}

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
}

import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { motion, AnimatePresence } from "framer-motion";
import { FaPlus, FaCalendarAlt, FaUsers, FaSyncAlt, FaRegCalendarCheck } from "react-icons/fa";
import ScheduleForm from "./ManageScheduleComponents/ScheduleForm";
import ScheduleList from "./ManageScheduleComponents/ScheduleList";
import ScheduleMembers from "./ManageScheduleComponents/ScheduleMembers";
import TanodModal from "./ManageScheduleComponents/TanodModal";
import { useTheme } from "../../../contexts/ThemeContext";
import {
  fetchTanods,
  fetchSchedules,
  handleDeleteSchedule,
  handleViewMembers,
} from "./ManageScheduleComponents/ScheduleUtils";

// Animation variants
const fadeIn = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.4 } }
};

const slideUp = {
  hidden: { y: 20, opacity: 0 },
  visible: i => ({ 
    y: 0, 
    opacity: 1, 
    transition: { delay: i * 0.1, duration: 0.5 } 
  })
};

const buttonScale = {
  hover: { scale: 1.05, transition: { duration: 0.2 } },
  tap: { scale: 0.95, transition: { duration: 0.1 } }
};

export default function ScheduleMaker() {
  const { isDarkMode } = useTheme();
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
    <motion.div 
      className={`container mx-auto px-4 py-6 ${isDarkMode ? 'bg-[#080917] text-[#e7e8f4]' : 'bg-[#e8e9f7] text-[#0b0c18]'}`}
      variants={fadeIn}
      initial="hidden"
      animate="visible"
    >
      <motion.div 
        className="flex flex-col md:flex-row items-center justify-between mb-6"
        variants={slideUp}
        custom={0}
      >
        <h1 className="text-3xl font-bold flex items-center mb-4 md:mb-0">
          <FaCalendarAlt className={`mr-3 ${isDarkMode ? 'text-[#989ce6]' : 'text-[#191d67]'}`} />
          Schedule Manager
        </h1>
        
        <div className="flex space-x-3">
          <motion.button
            variants={buttonScale}
            whileHover="hover"
            whileTap="tap"
            onClick={() => {
              resetForm();
              setShowForm(true);
            }}
            className={`flex items-center px-4 py-2 rounded-lg mr-5 ${
              isDarkMode 
              ? 'bg-[#4750eb] hover:bg-[#191f8a] text-white' 
              : 'bg-[#141db8] hover:bg-[#191d67] text-white'
            } transition-all duration-300 shadow-md ${showForm ? 'hidden' : ''}`}
          >
            <FaPlus className="mr-2" />
            Create Schedule
          </motion.button>
          
          
        </div>
      </motion.div>

      <AnimatePresence>
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
            isDarkMode={isDarkMode}
          />
        )}
      </AnimatePresence>

      <motion.div
        variants={slideUp}
        custom={1}
      >
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
          loadingSchedules={loadingSchedules}
          isDarkMode={isDarkMode}
        />
      </motion.div>

      <AnimatePresence>
        {showMembersTable && (
          <ScheduleMembers
            scheduleMembers={scheduleMembers}
            setShowMembersTable={setShowMembersTable}
            scheduleId={currentScheduleId}
            isDarkMode={isDarkMode}
          />
        )}
      </AnimatePresence>

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
        isDarkMode={isDarkMode}
      />
    </motion.div>
  );
}

import axios from "axios";
import { toast } from "react-toastify";

export const fetchTanods = async (setTanods) => {
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
    if (error.response && error.response.status === 404) {
      toast.error("No tanods found.");
    } else {
      toast.error("Error fetching tanods.");
    }
  }
};

export const fetchSchedules = async (setSchedules, setLoadingSchedules) => {
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
        
        // Update status based on current time
        const currentTime = new Date();
        const startTime = new Date(schedule.startTime);
        const endTime = new Date(schedule.endTime);
        
        if (startTime > currentTime) {
          schedule.status = 'Upcoming';
        } else if (endTime < currentTime) {
          schedule.status = 'Completed';
        } else if (startTime <= currentTime && endTime >= currentTime) {
          schedule.status = 'Ongoing';
        }
        
        return schedule;
      })
    );

    setSchedules(schedulesWithPatrolArea.map(schedule => {
      // Add schedule ID if it doesn't exist (for older records)
      if (!schedule.scheduleID) {
        schedule.scheduleID = `SCH-${Math.random().toString(36).substr(2, 9)}`;
      }
      return schedule;
    }));
  } catch (error) {
    console.error("Error fetching schedules:", error);
    if (error.response && error.response.status === 404) {
      toast.error("No schedules found.");
    } else {
      toast.error("Error fetching schedules.");
    }
  } finally {
    setLoadingSchedules(false);
  }
};

export const handleCreateOrUpdateSchedule = async (
  e,
  isEditing,
  currentScheduleId,
  unit, // Now holds shift type value
  selectedTanods,
  startTime,
  endTime,
  setSchedules,
  schedules,
  resetForm,
  fetchSchedules,
  scheduleID, // New parameter
  startDate, // New parameter
  endDate // New parameter
) => {
  e.preventDefault();

  // Validate that at least two Tanods are selected
  if (selectedTanods.length < 2) {
    toast.error("Please select at least two Tanods for the schedule.");
    return;
  }
  
  // Validate dates
  if (!startDate || !endDate) {
    toast.error("Please select both start and end dates.");
    return;
  }

  try {
    // Create proper date objects with original times
    if (!startTime || !endTime) {
      toast.error("Please provide both start and end times.");
      return;
    }
    
    // Use the exact provided times instead of transforming them
    const startDateTime = new Date(startTime);
    const endDateTime = new Date(endTime);
    
    // Validate that end time is after start time
    if (endDateTime <= startDateTime) {
      toast.error("End time must be after start time.");
      return;
    }
    
    const token = localStorage.getItem("token");
    const url = isEditing
      ? `${process.env.REACT_APP_API_URL}/auth/schedule/${currentScheduleId}`
      : `${process.env.REACT_APP_API_URL}/auth/schedule`;

    const response = await axios({
      method: isEditing ? "put" : "post",
      url,
      data: { 
        unit, 
        tanods: selectedTanods, 
        startTime: startDateTime.toISOString(), 
        endTime: endDateTime.toISOString(),
        scheduleID
      },
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

export const handleDeleteSchedule = async (scheduleId, setSchedules, schedules, fetchSchedules) => {
  toast.info(
    <div>
      <p>Are you sure you want to delete this schedule?</p>
      <button
        className="bg-green-500 text-white p-2 rounded m-2"
        onClick={() => confirmDeleteSchedule(scheduleId, setSchedules, schedules, fetchSchedules)}
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

const confirmDeleteSchedule = async (scheduleId, setSchedules, schedules, fetchSchedules) => {
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

export const handleViewMembers = async (schedule, setScheduleMembers, setShowMembersTable) => {
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
        scheduleId: schedule._id // Pass the scheduleId to the ScheduleMembers component
      };
    }));
    setShowMembersTable(true);
  } catch (error) {
    console.error("Error fetching members:", error);
    toast.error("Error fetching members.");
  }
};

export const fetchPatrolLogs = async (memberId, scheduleId, setPatrolLogs, setShowPatrolLogsModal) => {
  const token = localStorage.getItem("token");
  if (!token) {
    toast.error("Please log in.");
    return;
  }

  try {
    const response = await axios.get(
      `${process.env.REACT_APP_API_URL}/auth/patrol-logs/${memberId}`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    const filteredLogs = response.data.filter(log => log.scheduleId === scheduleId); // Filter logs by schedule ID
    setPatrolLogs(filteredLogs);
    setShowPatrolLogsModal(true);
  } catch (error) {
    console.error("Error fetching patrol logs:", error);
    toast.error("Error fetching patrol logs.");
  }
};

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
  unit,
  selectedTanods,
  startTime,
  endTime,
  setSchedules,
  schedules,
  resetForm,
  fetchSchedules
) => {
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

import React from "react";
import axios from "axios";
import { toast } from "react-toastify";

const TanodPatrolSchedule = ({ todayPatrols, setShowTodaySchedule, fetchUpcomingPatrols, fetchCurrentPatrolArea, uploadPatrolLogs }) => {
  const startPatrol = async (patrolId, startTime) => {
    const token = localStorage.getItem("token");
    if (!token) {
      toast.error("Please log in.");
      return;
    }

    const now = new Date();
    const start = new Date(startTime);
    const diff = (start - now) / (1000 * 60); // Difference in minutes

    if (diff > 30) {
      toast.error("You can only start the patrol 30 minutes before the scheduled start time.");
      return;
    }

    try {
      await axios.put(
        `${process.env.REACT_APP_API_URL}/auth/schedule/${patrolId}/start-patrol`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      toast.success("Patrol has started.");
      fetchUpcomingPatrols(); // Refresh the patrols list
      fetchCurrentPatrolArea(); // Update the map with the current patrol area
    } catch (error) {
      console.error("Error starting patrol:", error);
      toast.error("Failed to start patrol.");
    }
  };

  const endPatrol = async (patrolId) => {
    const token = localStorage.getItem("token");
    if (!token) {
      toast.error("Please log in.");
      return;
    }

    try {
      const now = new Date();
      const schedule = todayPatrols.find(s => s._id === patrolId);
      const endTime = new Date(schedule.endTime);

      if (now < endTime) {
        toast.info(
          <div>
            <p>Are you sure you want to end the patrol before the scheduled end time?</p>
            <button
              className="bg-green-500 text-white p-2 rounded m-2"
              onClick={() => confirmEndPatrol(patrolId)}
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
      } else {
        await confirmEndPatrol(patrolId);
      }
    } catch (error) {
      console.error("Error ending patrol:", error);
      toast.error("Failed to end patrol.");
    }
  };

  const confirmEndPatrol = async (patrolId) => {
    const token = localStorage.getItem("token");
    if (!token) {
      toast.error("Please log in.");
      return;
    }

    try {
      // Upload patrol logs to the database
      await uploadPatrolLogs(patrolId);

      await axios.put(
        `${process.env.REACT_APP_API_URL}/auth/schedule/${patrolId}/end-patrol`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      toast.dismiss();
      toast.success("Patrol has ended.");
      fetchUpcomingPatrols(); // Refresh the patrols list
      fetchCurrentPatrolArea(); // Update the map to remove the current patrol area

      // Clear local patrol logs
      localStorage.removeItem("patrolLogs");
    } catch (error) {
      console.error("Error ending patrol:", error);
      toast.error("Failed to end patrol.");
    }
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
  };

  const getPatrolButton = (patrol) => {
    const userId = localStorage.getItem("userId");
    const patrolStatus = patrol.patrolStatus.find(status => status.tanodId === userId);

    if (!patrolStatus || patrolStatus.status === 'Not Started') {
      return (
        <button onClick={() => startPatrol(patrol._id, patrol.startTime)} className="bg-green-600 text-white text-sm md:text-base px-2 py-1 md:px-3 md:py-1 rounded shadow hover:bg-green-700 transition">
          Start Patrol
        </button>
      );
    } else if (patrolStatus.status === 'Started') {
      return (
        <button onClick={() => endPatrol(patrol._id)} className="bg-red-600 text-white text-sm md:text-base px-2 py-1 md:px-3 md:py-1 rounded shadow hover:bg-red-700 transition">
          End Patrol
        </button>
      );
    } else {
      return null;
    }
  };

  const filteredPatrols = todayPatrols.filter(patrol => {
    const userId = localStorage.getItem("userId");
    const patrolStatus = patrol.patrolStatus.find(status => status.tanodId === userId);
    return patrol.patrolArea && (!patrolStatus || patrolStatus.status === 'Not Started' || patrolStatus.status === 'Started');
  });

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
      <div className="bg-white p-6 rounded-lg w-11/12 max-w-lg relative TopNav">
        <h2 className="text-xl md:text-2xl font-bold mb-4 flex justify-between items-center">
          Today's Patrol Schedule
          <button
            onClick={() => setShowTodaySchedule(false)}
            className="bg-red-500 text-white px-3 py-1 rounded"
          >
            Close
          </button>
        </h2>
        <div className="overflow-y-auto" style={{ maxHeight: "300px" }}>
          {filteredPatrols.length > 0 ? (
            <table className="min-w-full bg-white shadow-md rounded-lg border overflow-hidden text-center">
              <thead className="TopNav">
                <tr>
                  <th className="border px-4 py-2 text-sm md:text-base">Unit</th>
                  <th className="border px-4 py-2 text-sm md:text-base">Start Time</th>
                  <th className="border px-4 py-2 text-sm md:text-base">End Time</th>
                  <th className="border px-4 py-2 text-sm md:text-base">Patrol Area</th>
                  <th className="border px-4 py-2 text-sm md:text-base">Action</th>
                </tr>
              </thead>
              <tbody className="text-black">
                {filteredPatrols.map((patrol, index) => (
                  <tr key={index}>
                    <td className="border px-4 py-2 text-sm md:text-base">{patrol.unit}</td>
                    <td className="border px-4 py-2 text-sm md:text-base">{formatTime(patrol.startTime)}</td>
                    <td className="border px-4 py-2 text-sm md:text-base">{formatTime(patrol.endTime)}</td>
                    <td className="border px-4 py-2 text-sm md:text-base">
                      {patrol.status === 'Upcoming' || patrol.status === 'Ongoing' ? patrol.patrolArea.legend : "N/A"}
                    </td>
                    <td className="border px-4 py-2 text-sm md:text-base">
                      {getPatrolButton(patrol)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="text-center text-sm md:text-base">No patrol schedule for today.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default TanodPatrolSchedule;

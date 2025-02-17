import React, { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { FaUserShield } from "react-icons/fa";
import TanodPatrolSchedule from "./incidentComponents/TanodPatrolSchedule";
import ReportIncident from "./incidentComponents/ReportIncident";
import ViewReportedIncidents from "./incidentComponents/ViewReportedIncidents";

const Incidents = ({ fetchCurrentPatrolArea }) => {
  const [patrols, setPatrols] = useState([]);
  const [upcomingPatrols, setUpcomingPatrols] = useState([]);
  const [incident, setIncident] = useState({ type: "", description: "", location: "" });
  const [incidentLog, setIncidentLog] = useState([]);
  const [currentReport, setCurrentReport] = useState(localStorage.getItem("currentReport") || "");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [showTodaySchedule, setShowTodaySchedule] = useState(false);
  const [showReportIncident, setShowReportIncident] = useState(false);
  const [showReportedIncidents, setShowReportedIncidents] = useState(false);
  const [todayPatrols, setTodayPatrols] = useState([]);
  const [patrolLogs, setPatrolLogs] = useState(JSON.parse(localStorage.getItem("patrolLogs")) || []);
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [deleteIndex, setDeleteIndex] = useState(null);
  const [hasStartedPatrol, setHasStartedPatrol] = useState(false);

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
      localStorage.setItem("userId", response.data._id); // Store userId in localStorage
      return response.data._id;
    } catch (error) {
      console.error("Error fetching user profile:", error);
      toast.error("Error fetching user profile.");
      return null;
    }
  };

  const fetchUpcomingPatrols = async () => {
    const token = localStorage.getItem('token');
    const userId = await fetchUserProfile();
    if (!token || !userId) return;

    try {
      const response = await axios.get(`${process.env.REACT_APP_API_URL}/auth/tanod-schedules/${userId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
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
      setUpcomingPatrols(schedulesWithPatrolArea || []);
      setTodayPatrols(schedulesWithPatrolArea.filter(schedule => {
        const today = new Date();
        const startTime = new Date(schedule.startTime);
        return startTime.toDateString() === today.toDateString();
      }));
      const startedPatrol = schedulesWithPatrolArea.some(schedule => {
        const patrolStatus = schedule.patrolStatus.find(status => status.tanodId === userId);
        return patrolStatus && patrolStatus.status === 'Started';
      });
      setHasStartedPatrol(startedPatrol);
    } catch (error) {
      console.error('Error fetching upcoming patrols:', error);
      toast.error('Failed to load upcoming patrols.');
    }
  };

  useEffect(() => {
    fetchUpcomingPatrols();
  }, []);

  const toggleDropdown = () => {
    setIsDropdownOpen(!isDropdownOpen);
  };

  const savePatrolLog = () => {
    const timestamp = new Date().toLocaleString();
    const logEntry = { report: currentReport, timestamp };
    const updatedLogs = [...patrolLogs, logEntry];
    setPatrolLogs(updatedLogs);
    localStorage.setItem("patrolLogs", JSON.stringify(updatedLogs));
    localStorage.setItem("currentReport", "");
    setCurrentReport(""); // Clear the text area after saving
    toast.success("Patrol log saved.");
  };

  const confirmDeletePatrolLog = (index) => {
    setDeleteIndex(index);
    setShowDeleteConfirmation(true);
  };

  const deletePatrolLog = () => {
    const updatedLogs = patrolLogs.filter((_, i) => i !== deleteIndex);
    setPatrolLogs(updatedLogs);
    localStorage.setItem("patrolLogs", JSON.stringify(updatedLogs));
    toast.success("Patrol log deleted.");
    setShowDeleteConfirmation(false);
    setDeleteIndex(null);
  };

  const editPatrolLog = (index) => {
    const log = patrolLogs[index];
    setCurrentReport(log.report);
    confirmDeletePatrolLog(index);
  };

  const uploadPatrolLogs = async (scheduleId) => {
    const token = localStorage.getItem("token");
    if (!token || !scheduleId) return;

    try {
      await axios.post(`${process.env.REACT_APP_API_URL}/auth/save-patrol-logs`, {
        scheduleId,
        logs: patrolLogs,
      }, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setPatrolLogs([]); // Clear the logs after saving
      localStorage.removeItem("patrolLogs"); // Clear local storage
      toast.success("Patrol logs uploaded successfully");
    } catch (error) {
      console.error('Error uploading patrol logs:', error);
      toast.error('Failed to upload patrol logs');
    }
  };

  return (
    <div className="p-4 max-w-4xl mx-auto bg-white bg-opacity-75 shadow-lg rounded-lg TopNav">
      <h1 onClick={toggleDropdown} className="text-2xl md:text-3xl font-bold text-center mb-4 cursor-pointer bg-blue-600 text-white py-2 px-4 rounded-lg shadow hover:bg-blue-700 transition">
        <FaUserShield className="inline-block mr-2" />
      </h1>
      
      {isDropdownOpen && (
        <div className="dropdown-content">
          <div className="mb-4 flex justify-center space-x-4">
            <button onClick={() => setShowTodaySchedule(true)} className="bg-blue-600 text-white text-sm md:text-base px-4 py-2 md:px-6 md:py-2 rounded-lg shadow hover:bg-blue-700 transition">
              Today's Patrol Schedule
            </button>
            <button onClick={() => setShowReportIncident(true)} className="bg-green-600 text-white text-sm md:text-base px-4 py-2 md:px-6 md:py-2 rounded-lg shadow hover:bg-green-700 transition">
              Report an Incident
            </button>
            <button onClick={() => setShowReportedIncidents(true)} className="bg-yellow-600 text-white text-sm md:text-base px-4 py-2 md:px-6 md:py-2 rounded-lg shadow hover:bg-yellow-700 transition">
              View Reported Incidents
            </button>
          </div>

          {hasStartedPatrol && (
            <>
              <h2 className="text-xl md:text-2xl mb-2">Log Patrol Report</h2>
              <textarea
                className="border p-2 mb-4 w-full h-24 rounded text-sm md:text-base text-black"
                placeholder="Enter your patrol report..."
                value={currentReport}
                onChange={(e) => setCurrentReport(e.target.value)}
              />
              <button onClick={savePatrolLog} className="bg-blue-600 text-white text-sm md:text-base px-4 py-2 md:px-6 md:py-2 rounded-lg shadow hover:bg-blue-700 transition">
                Save Log
              </button>
            </>
          )}

          {patrolLogs.length > 0 && (
            <div className="mt-4">
              <h3 className="text-lg md:text-xl font-bold mb-2">Saved Patrol Logs</h3>
              <div className="overflow-y-auto" style={{ maxHeight: "200px" }}>
                <table className="min-w-full bg-white shadow-md rounded-lg border overflow-hidden text-center">
                  <thead className="TopNav">
                    <tr>
                      <th className="border px-4 py-2 text-sm md:text-base">Time Log</th>
                      <th className="border px-4 py-2 text-sm md:text-base">Report</th>
                      <th className="border px-4 py-2 text-sm md:text-base">Action</th>
                    </tr>
                  </thead>
                  <tbody className="text-black">
                    {patrolLogs.map((log, index) => (
                      <tr key={index}>
                        <td className="border px-4 py-2 text-sm md:text-base">{log.timestamp}</td>
                        <td className="border px-4 py-2 text-sm md:text-base">{log.report}</td>
                        <td className="border px-4 py-2 text-sm md:text-base">
                          <button onClick={() => editPatrolLog(index)} className="bg-yellow-600 text-white text-sm md:text-base px-2 py-1 md:px-3 md:py-1 rounded shadow hover:bg-yellow-700 transition">
                            Edit
                          </button>
                          <button onClick={() => confirmDeletePatrolLog(index)} className="bg-red-600 text-white text-sm md:text-base px-2 py-1 md:px-3 md:py-1 rounded shadow hover:bg-red-700 transition ml-2">
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {showTodaySchedule && (
        <TanodPatrolSchedule
          todayPatrols={todayPatrols}
          setShowTodaySchedule={setShowTodaySchedule}
          fetchUpcomingPatrols={fetchUpcomingPatrols}
          fetchCurrentPatrolArea={fetchCurrentPatrolArea}
          uploadPatrolLogs={uploadPatrolLogs} // Pass the function as a prop
        />
      )}

      {showReportIncident && (
        <ReportIncident
          incident={incident}
          setIncident={setIncident}
          setIncidentLog={setIncidentLog}
          incidentLog={incidentLog}
          setShowReportIncident={setShowReportIncident}
        />
      )}

      {showReportedIncidents && (
        <ViewReportedIncidents
          incidentLog={incidentLog}
          setShowReportedIncidents={setShowReportedIncidents}
        />
      )}

      {showDeleteConfirmation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg w-11/12 max-w-lg relative TopNav">
            <h2 className="text-xl md:text-2xl font-bold mb-4">Confirm Delete</h2>
            <p>Are you sure you want to delete this patrol log?</p>
            <div className="mt-4 flex justify-end space-x-4">
              <button onClick={deletePatrolLog} className="bg-red-600 text-white text-sm md:text-base px-4 py-2 rounded shadow hover:bg-red-700 transition">
                Delete
              </button>
              <button onClick={() => setShowDeleteConfirmation(false)} className="bg-gray-600 text-white text-sm md:text-base px-4 py-2 rounded shadow hover:bg-gray-700 transition">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Incidents;

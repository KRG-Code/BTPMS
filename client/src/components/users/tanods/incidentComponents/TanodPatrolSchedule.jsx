import React, { useRef } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import io from 'socket.io-client'; // Import socket.io-client

const TanodPatrolSchedule = ({ todayPatrols, setShowTodaySchedule, fetchUpcomingPatrols, fetchCurrentPatrolArea, uploadPatrolLogs }) => {
  const socketRef = useRef(null);

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

      // Connect to WebSocket when patrol starts
      const userId = localStorage.getItem("userId");
      socketRef.current = io(`${process.env.REACT_APP_API_URL}/namespace`, {
        query: { userId },
      });

      socketRef.current.on('connect', () => {
        console.log('Connected to WebSocket');
      });

      socketRef.current.on('disconnect', () => {
        console.log('Disconnected from WebSocket');
      });

      socketRef.current.on('connect_error', (error) => {
        console.error('WebSocket connection error:', error);
        toast.error("Connection error occurred");
      });

      socketRef.current.on('locationUpdate', (location) => {
        console.log('Location update:', location);
      });
    } catch (error) {
      console.error("Error starting patrol:", error);
      toast.error("Failed to start patrol.");
    }
  };

  const endPatrol = async (patrolId) => {
    // Show confirmation toast
    toast.info(
      ({ closeToast }) => (
        <div>
          <p className="mb-4">Are you sure you want to end this patrol?</p>
          <div className="flex justify-end space-x-2">
            <button
              onClick={async () => {
                closeToast();
                try {
                  const token = localStorage.getItem('token');
                  
                  // First end the patrol in the schedule
                  await axios.put(
                    `${process.env.REACT_APP_API_URL}/auth/schedule/${patrolId}/end-patrol`,
                    {},
                    { headers: { Authorization: `Bearer ${token}` } }
                  );

                  // Then update the location marker status
                  await axios.post(
                    `${process.env.REACT_APP_API_URL}/locations/patrol-status`,
                    { endedPatrolId: patrolId },
                    { headers: { Authorization: `Bearer ${token}` } }
                  );

                  // Upload patrol logs first
                  await uploadPatrolLogs(patrolId);

                  // Clear local patrol logs after successful upload
                  localStorage.removeItem("patrolLogs");

                  // Update UI states
                  await fetchUpcomingPatrols();
                  await fetchCurrentPatrolArea();

                  // Show success message
                  toast.success('Patrol ended successfully');
                  
                  // Close the schedule modal
                  setShowTodaySchedule(false);

                } catch (error) {
                  console.error('Error ending patrol:', error);
                  toast.error('Failed to end patrol');
                }
              }}
              className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
            >
              Yes, End Patrol
            </button>
            <button
              onClick={closeToast}
              className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
            >
              Cancel
            </button>
          </div>
        </div>
      ),
      {
        position: "top-right",
        autoClose: false,
        closeOnClick: false,
        draggable: false,
        closeButton: false,
      }
    );
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
  };

  const isScheduleActive = (patrol) => {
    const now = new Date();
    const endTime = new Date(patrol.endTime);
    const userId = localStorage.getItem("userId");
    const patrolStatus = patrol.patrolStatus.find(status => status.tanodId === userId);
    
    // Schedule is active if:
    // 1. End time hasn't passed OR
    // 2. Patrol status is 'Started' (ongoing)
    return now <= endTime || (patrolStatus && patrolStatus.status === 'Started');
  };

  // Filter patrols to show only active or not yet started ones
  const filteredPatrols = todayPatrols.filter(patrol => {
    const userId = localStorage.getItem("userId");
    const patrolStatus = patrol.patrolStatus.find(status => status.tanodId === userId);
    
    return patrol.patrolArea && (
      !patrolStatus || // Not started yet
      patrolStatus.status === 'Not Started' ||
      (patrolStatus.status === 'Started' && isScheduleActive(patrol)) // Started and still active
    );
  });

  const getPatrolButton = (patrol) => {
    const userId = localStorage.getItem("userId");
    const patrolStatus = patrol.patrolStatus.find(status => status.tanodId === userId);
    const isActive = isScheduleActive(patrol);

    if (!isActive) {
      return null;
    }

    if (!patrolStatus || patrolStatus.status === 'Not Started') {
      return (
        <button 
          onClick={() => startPatrol(patrol._id, patrol.startTime)} 
          className="bg-green-600 text-white text-sm md:text-base px-2 py-1 md:px-3 md:py-1 rounded shadow hover:bg-green-700 transition"
        >
          Start Patrol
        </button>
      );
    } else if (patrolStatus.status === 'Started') {
      return (
        <button 
          onClick={() => endPatrol(patrol._id)} 
          className="bg-red-600 text-white text-sm md:text-base px-2 py-1 md:px-3 md:py-1 rounded shadow hover:bg-red-700 transition"
        >
          End Patrol
        </button>
      );
    }
    return null;
  };

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
        <div className="overflow-y-auto" 
             style={{ 
               maxHeight: "300px",
               WebkitOverflowScrolling: "touch",
               touchAction: "pan-y" 
             }}
             onTouchMove={(e) => e.stopPropagation()}>
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
            <p className="text-center text-sm md:text-base">No active patrols for today.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default TanodPatrolSchedule;

import React, { useState, useEffect } from "react";
import axios from "axios";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Loading from "../../../utils/Loading"; // Assuming you have a Loading component
import { FaUserCircle } from 'react-icons/fa';

export default function TanodSchedule() {
  const [schedules, setSchedules] = useState([]);
  const [filteredSchedules, setFilteredSchedules] = useState([]);
  const [scheduleMembers, setScheduleMembers] = useState([]);
  const [showMembersTable, setShowMembersTable] = useState(false);
  const [userId, setUserId] = useState(null);
  const [loadingSchedules, setLoadingSchedules] = useState(false);
  const [loadingMembers, setLoadingMembers] = useState(false);
  
  // Filter states
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

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
      setUserId(response.data._id);
      return response.data._id;
    } catch (error) {
      console.error("Error fetching user profile:", error);
      toast.error("Error fetching user profile.");
      return null;
    }
  };

  const sortSchedules = (schedules) => {
    const statusPriority = {
      'Ongoing': 1,
      'Upcoming': 2,
      'Completed': 3
    };

    return schedules.sort((a, b) => {
      // First, compare by status priority
      const statusDiff = statusPriority[a.status] - statusPriority[b.status];
      if (statusDiff !== 0) return statusDiff;

      // If same status, compare by date
      const dateA = new Date(a.startTime);
      const dateB = new Date(b.startTime);
      if (dateA !== dateB) return dateA - dateB;

      // If same date, compare by unit number
      const unitNumberA = parseInt(a.unit.split(' ')[1]);
      const unitNumberB = parseInt(b.unit.split(' ')[1]);
      return unitNumberA - unitNumberB;
    });
  };

  useEffect(() => {
    const fetchSchedules = async () => {
      const token = localStorage.getItem("token");
      const userId = await fetchUserProfile();
      if (!token || !userId) return;

      setLoadingSchedules(true);
      try {
        const response = await axios.get(
          `${process.env.REACT_APP_API_URL}/auth/tanod-schedules/${userId}`,
          { headers: { Authorization: `Bearer ${token}` } }
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
            return schedule;
          })
        );
        
        // Sort schedules with new sorting function
        const sortedSchedules = sortSchedules(schedulesWithPatrolArea);
        setSchedules(sortedSchedules);
        setFilteredSchedules(sortedSchedules);
        
      } catch (error) {
        console.error("Error fetching schedules:", error);
        toast.error("Error fetching schedules.");
      } finally {
        setLoadingSchedules(false);
      }
    };

    fetchSchedules();
  }, []);

  const handleViewMembers = async (scheduleId) => {
    const token = localStorage.getItem("token");

    setLoadingMembers(true);
    try {
      const response = await axios.get(
        `${process.env.REACT_APP_API_URL}/auth/schedule/${scheduleId}/members`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setScheduleMembers(response.data.tanods);
      setShowMembersTable(true);
    } catch (error) {
      console.error("Error fetching members:", error);
      toast.error("Error fetching members.");
    } finally {
      setLoadingMembers(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...schedules];

    // Apply date filter
    if (startDate && endDate) {
      filtered = filtered.filter(schedule => {
        const scheduleDate = new Date(schedule.startTime);
        const filterStartDate = new Date(startDate);
        const filterEndDate = new Date(endDate);
        return scheduleDate >= filterStartDate && scheduleDate <= filterEndDate;
      });
    }

    // Apply status filter
    if (statusFilter) {
      filtered = filtered.filter(schedule => schedule.status === statusFilter);
    }

    // Apply search query
    if (searchQuery) {
      filtered = filtered.filter(schedule => 
        schedule.unit.toLowerCase().includes(searchQuery.toLowerCase()) ||
        schedule.patrolArea?.legend.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Apply the new sorting
    filtered = sortSchedules(filtered);
    setFilteredSchedules(filtered);
  };

  useEffect(() => {
    applyFilters();
  }, [startDate, endDate, statusFilter, searchQuery]);

  const clearFilters = () => {
    setStartDate('');
    setEndDate('');
    setStatusFilter('');
    setSearchQuery('');
    setFilteredSchedules(schedules);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Upcoming':
        return 'text-blue-600';
      case 'Ongoing':
        return 'text-green-600';
      case 'Completed':
        return 'text-gray-600';
      default:
        return 'text-black';
    }
  };

  const formatDateTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  return (
    <div className="container mx-auto px-4"> {/* Added px-4 for better spacing */}
      <ToastContainer />
      <h1 className="text-2xl font-bold mb-4">Your Schedule</h1>

      {/* Filters Section - Modified to be in one line */}
      <div className="mb-4 flex items-center gap-2">
        <input
          type="text"
          placeholder="Search unit or area..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="p-1 border rounded w-64 text-sm text-black"
        />
        <div className="flex items-center gap-1">
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="p-1 border rounded w-36 text-sm text-black"
          />
          <span className="text-sm">to</span>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="p-1 border rounded w-36 text-sm text-black"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="p-1 border rounded w-28 text-sm text-black"
        >
          <option value="">All Status</option>
          <option value="Upcoming">Upcoming</option>
          <option value="Ongoing">Ongoing</option>
          <option value="Completed">Completed</option>
        </select>
        <button
          onClick={clearFilters}
          className="bg-gray-500 text-white px-3 py-1 rounded hover:bg-gray-600 text-sm"
        >
          Clear
        </button>
      </div>

      <h2 className="text-xl font-bold mb-4">Scheduled Patrols</h2>
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white shadow-md rounded-lg border overflow-hidden text-center text-base"> {/* Changed text-sm to text-base */}
          <thead className="TopNav">
            <tr>
              <th className="border py-3 px-2">Unit</th> {/* Increased padding */}
              <th className="border py-3 px-2">Start Time</th>
              <th className="border py-3 px-2">End Time</th>
              <th className="border py-3 px-2">Patrol Area</th>
              <th className="border py-3 px-2">Status</th>
              <th className="border py-3 px-2">Actions</th>
            </tr>
          </thead>
          <tbody className="text-black">
            {loadingSchedules ? (
              <tr>
                <td colSpan="6" className="text-center py-2">
                  <Loading type="circle" />
                  Loading Schedules...
                </td>
              </tr>
            ) : filteredSchedules.length === 0 ? (
              <tr>
                <td colSpan="6" className="text-center py-2">
                  No schedules found.
                </td>
              </tr>
            ) : (
              filteredSchedules.map((schedule) => (
                <tr key={schedule._id} className="hover:bg-gray-50">
                  <td className="border py-2 px-2">{schedule.unit}</td> {/* Increased padding */}
                  <td className="border py-2 px-2">{formatDateTime(schedule.startTime)}</td>
                  <td className="border py-2 px-2">{formatDateTime(schedule.endTime)}</td>
                  <td className="border py-2 px-2">{schedule.patrolArea ? schedule.patrolArea.legend : "N/A"}</td>
                  <td className={`border py-2 px-2 ${getStatusColor(schedule.status)}`}>
                    {schedule.status}
                  </td>
                  <td className="border py-2 px-2">
                    <button
                      className="bg-green-500 text-white px-3 py-1.5 rounded text-sm hover:bg-green-600"
                      onClick={() => handleViewMembers(schedule._id)}
                    >
                      View Members
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal for Viewing Members */}
      {showMembersTable && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg w-3/4 max-w-4xl relative TopNav"> {/* Made modal wider and added more padding */}
            <h2 className="text-xl font-bold mb-4 flex justify-between items-center"> {/* Increased text size */}
              Assigned Tanod Members
              <button
                onClick={() => setShowMembersTable(false)}
                className="bg-red-500 text-white px-4 py-2 rounded text-sm" 
              >
                Close
              </button>
            </h2>
            <table className="min-w-full bg-white border text-center text-base"> {/* Changed text-sm to text-base */}
              <thead className="TopNav">
                <tr>
                  <th className="border py-3 px-2">Profile Picture</th> {/* Increased padding */}
                  <th className="border py-3 px-2">Full Name</th>
                  <th className="border py-3 px-2">Contact Number</th>
                </tr>
              </thead>
              <tbody className="text-black">
                {loadingMembers ? (
                  <tr>
                    <td colSpan="3" className="text-center py-2">
                      <Loading type="circle" />
                      Loading Members...
                    </td>
                  </tr>
                ) : (
                  scheduleMembers.map((member) => (
                    <tr key={member._id} className="hover:bg-gray-50">
                      <td className="border py-2 px-2">
                        {member.profilePicture ? (
                          <img
                            src={member.profilePicture}
                            alt={member.firstName}
                            className="w-12 h-12 rounded-full mx-auto" 
                          />
                        ) : (
                          <FaUserCircle className="w-12 h-12 rounded-full mx-auto text-gray-300" />
                        )}
                      </td>
                      <td className="border py-2 px-2">{`${member.firstName} ${member.lastName}`}</td>
                      <td className="border py-2 px-2">{member.contactNumber || "N/A"}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

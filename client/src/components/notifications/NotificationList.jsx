import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { RiDeleteBin6Line } from "react-icons/ri";

export default function NotificationList({ onClose }) {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const fetchNotifications = async () => {
      const token = localStorage.getItem("token");

      if (!token) {
        toast.error("Please log in to view notifications.");
        return;
      }

      try {
        const response = await axios.get(`${process.env.REACT_APP_API_URL}/notifications`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setNotifications(response.data.notifications);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching notifications:", error);
        toast.error("Error fetching notifications.");
      }
    };

    fetchNotifications();

    const markNotificationsAsRead = async () => {
      const token = localStorage.getItem("token");
      try {
        await axios.post(
          `${process.env.REACT_APP_API_URL}/notifications/mark-read`,
          {},
          { headers: { Authorization: `Bearer ${token}` } }
        );
        fetchNotifications();
      } catch (error) {
        console.error("Error marking notifications as read:", error);
      }
    };

    markNotificationsAsRead();

    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        onClose();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [onClose]);

  const deleteNotification = (notificationId) => {
    const confirmDelete = async (confirmed) => {
      if (confirmed) {
        const token = localStorage.getItem("token");
        try {
          await axios.delete(`${process.env.REACT_APP_API_URL}/notifications/${notificationId}`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          setNotifications(notifications.filter(notification => notification._id !== notificationId));
          toast.success("Notification deleted successfully");
        } catch (error) {
          console.error("Error deleting notification:", error);
          toast.error("Error deleting notification");
        }
      }
    };

    toast.info(
      <div>
        <p>Are you sure you want to delete this notification?</p>
        <button
          onClick={() => {
            confirmDelete(true);
            toast.dismiss(); // Dismiss the toast
          }}
          className="bg-red-500 text-white px-2 py-1 rounded mr-2"
        >
          Yes
        </button>
        <button
          onClick={() => {
            confirmDelete(false);
            toast.dismiss(); // Dismiss the toast
          }}
          className="bg-gray-500 text-white px-2 py-1 rounded"
        >
          No
        </button>
      </div>,
      {
        autoClose: false, // Keep it open until dismissed
        closeButton: false, // Disable the default close button
        position: "top-right",
      }
    );
  };

  return (
    <div
      ref={dropdownRef}
      className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg p-4 z-50 TopNav"
    >
      <ToastContainer />
      <h2 className="font-bold mb-2">Notifications</h2>
      {loading ? (
        <div className="flex justify-center items-center h-24">
          <div className="animate-spin h-5 w-5 border-4 border-blue-500 border-t-transparent rounded-full"></div>
        </div>
      ) : notifications.length === 0 ? (
        <p>No new notifications</p>
      ) : (
        <ul className="space-y-2 TopNav overflow-y-auto" style={{ maxHeight: "300px" }}>
          {notifications.slice().reverse().map((notification) => (
            <li
              key={notification._id}
              className={`p-2 flex justify-between items-center ${notification.read ? "bg-gray-100" : "bg-gray-200"} hover:cursor-pointer rounded TopNav`}
            >
              <div>
                {notification.message}
                <span className="text-sm text-gray-500">
                  <br />- {new Date(notification.createdAt).toLocaleString()}
                </span>
              </div>
              <button onClick={() => deleteNotification(notification._id)} className="text-red-500">
                <RiDeleteBin6Line />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

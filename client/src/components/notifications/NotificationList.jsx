import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { RiDeleteBin6Line } from "react-icons/ri";

export default function NotificationList({ onClose }) {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedNotifications, setSelectedNotifications] = useState([]);
  const [showSelectOptions, setShowSelectOptions] = useState(false);
  const dropdownRef = useRef(null);
  const holdTimeoutRef = useRef(null);

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

  const markAllAsRead = async () => {
    const token = localStorage.getItem("token");
    try {
      await axios.post(
        `${process.env.REACT_APP_API_URL}/notifications/mark-read`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setNotifications(notifications.map(notification => ({ ...notification, read: true })));
      toast.success("All notifications marked as read");
    } catch (error) {
      console.error("Error marking notifications as read:", error);
      toast.error("Error marking notifications as read");
    }
  };

  const deleteNotification = async (notificationId) => {
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
  };

  const confirmDeleteNotification = (notificationId) => {
    toast.info(
      <div>
        <p>Are you sure you want to delete this notification?</p>
        <button
          onClick={() => {
            deleteNotification(notificationId);
            toast.dismiss();
          }}
          className="bg-green-500 text-white font-bold py-1 px-2 rounded-md hover:bg-green-600"
        >
          Yes
        </button>
        <button
          onClick={() => toast.dismiss()}
          className="bg-red-500 text-white font-bold py-1 px-2 rounded-md hover:bg-red-600 ml-2"
        >
          No
        </button>
      </div>,
      { 
        autoClose: false,
        closeOnClick: false,
        draggable: false,
      }
    );
  };

  const deleteSelectedNotifications = async () => {
    if (selectedNotifications.length === 0) {
      toast.error("No notifications selected to delete.");
      return;
    }

    const token = localStorage.getItem("token");
    try {
      await Promise.all(selectedNotifications.map(notificationId =>
        axios.delete(`${process.env.REACT_APP_API_URL}/notifications/${notificationId}`, {
          headers: { Authorization: `Bearer ${token}` },
        })
      ));
      setNotifications(notifications.filter(notification => !selectedNotifications.includes(notification._id)));
      setSelectedNotifications([]);
      toast.success("Selected notifications deleted successfully");
    } catch (error) {
      console.error("Error deleting selected notifications:", error);
      toast.error("Error deleting selected notifications");
    }
  };

  const confirmDeleteSelectedNotifications = () => {
    if (selectedNotifications.length === 0) {
      toast.error("No notifications selected to delete.");
      return;
    }

    toast.info(
      <div>
        <p>Are you sure you want to delete the selected notifications?</p>
        <button
          onClick={() => {
            deleteSelectedNotifications();
            toast.dismiss();
          }}
          className="bg-green-500 text-white font-bold py-1 px-2 rounded-md hover:bg-green-600"
        >
          Yes
        </button>
        <button
          onClick={() => toast.dismiss()}
          className="bg-red-500 text-white font-bold py-1 px-2 rounded-md hover:bg-red-600 ml-2"
        >
          No
        </button>
      </div>,
      { 
        autoClose: false,
        closeOnClick: false,
        draggable: false,
      }
    );
  };

  const toggleSelectNotification = (notificationId) => {
    setSelectedNotifications(prevSelected =>
      prevSelected.includes(notificationId)
        ? prevSelected.filter(id => id !== notificationId)
        : [...prevSelected, notificationId]
    );
  };

  const handleNotificationHold = (notificationId) => {
    holdTimeoutRef.current = setTimeout(() => {
      setShowSelectOptions(true);
      toggleSelectNotification(notificationId);
    }, 1000); // 1 second hold time
  };

  const handleNotificationRelease = () => {
    clearTimeout(holdTimeoutRef.current);
  };

  const handleNotificationClick = (notificationId) => {
    if (showSelectOptions) {
      toggleSelectNotification(notificationId);
    } else {
      // Update the notification status to read
      const token = localStorage.getItem("token");
      axios.post(
        `${process.env.REACT_APP_API_URL}/notifications/mark-read`,
        { notificationId },
        { headers: { Authorization: `Bearer ${token}` } }
      ).then(() => {
        setNotifications(notifications.map(notification =>
          notification._id === notificationId ? { ...notification, read: true } : notification
        ));
      }).catch(error => {
        console.error("Error marking notification as read:", error);
        toast.error("Error marking notification as read");
      });
    }
  };

  const selectAllNotifications = () => {
    setSelectedNotifications(notifications.map(notification => notification._id));
  };

  return (
    <div
      ref={dropdownRef}
      className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg p-4 z-50 TopNav"
    >
      <ToastContainer />
      <h2 className="font-bold mb-2">Notifications</h2>
      <div className="flex justify-between mb-2">
        <button onClick={markAllAsRead} className="bg-blue-500 text-white px-2 py-1 rounded">
          Mark All as Read
        </button>
        {showSelectOptions && (
          <>
            <button onClick={selectAllNotifications} className="bg-gray-500 text-white px-2 py-1 rounded">
              Select All
            </button>
            <button onClick={confirmDeleteSelectedNotifications} className="bg-red-500 text-white px-2 py-1 rounded">
              Delete Selected
            </button>
          </>
        )}
      </div>
      {loading ? (
        <div className="flex justify-center items-center h-24">
          <div className="animate-spin h-5 w-5 border-4 border-blue-500 border-t-transparent rounded-full"></div>
        </div>
      ) : notifications.length === 0 ? (
        <p>No new notifications</p>
      ) : (
        <ul className="space-y-2 TopNav overflow-y-auto " style={{ maxHeight: "300px" }}>
          {notifications.slice().reverse().map((notification) => (
            <li
              key={notification._id}
              className={`p-2 flex justify-between items-center  ${notification.read ? "bg-gray-100" : "bg-gray-300"} hover:bg-blue-100 hover:cursor-pointer rounded TopNav ${selectedNotifications.includes(notification._id) ? "bg-blue-100" : ""}`}
              onMouseDown={() => handleNotificationHold(notification._id)}
              onMouseUp={handleNotificationRelease}
              onMouseLeave={handleNotificationRelease}
              onClick={() => handleNotificationClick(notification._id)}
              style={{ backgroundColor: selectedNotifications.includes(notification._id) ? "#cce4ff" : "" }}
            >
              <div>
                {notification.message}
                <span className="text-sm text-gray-500">
                  <br />- {new Date(notification.createdAt).toLocaleString()}
                </span>
              </div>
              {showSelectOptions && (
                <button onClick={() => confirmDeleteNotification(notification._id)} className="text-red-500">
                  <RiDeleteBin6Line />
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

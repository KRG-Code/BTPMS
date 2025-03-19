import React, { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { RiUser3Line, RiMenuLine, RiMessage3Line, RiNotification3Line } from "react-icons/ri";
import ThemeToggle from "../forms/ThemeToggle";
import { useCombinedContext } from "../../contexts/useContext";
import NotificationList from "../notifications/NotificationList";
import MessageList from "../messages/MessageList";
import { io } from "socket.io-client";

export default function TopNav() {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [profilePicture, setProfilePicture] = useState(null);
  const [showNotificationList, setShowNotificationList] = useState(false);
  const [showMessageList, setShowMessageList] = useState(false);
  const [hasUnreadNotifications, setHasUnreadNotifications] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [setUserType] = useState(null);
  const [hasUnreadMessages, setHasUnreadMessages] = useState(false);
  const dropdownRef = useRef(null);
  const notificationRef = useRef(null);
  const messageRef = useRef(null);
  const navigate = useNavigate();
  const { toggleSideNav, logout } = useCombinedContext();

  const handleClickOutside = useCallback((event) => {
    if (
      dropdownRef.current && !dropdownRef.current.contains(event.target) &&
      notificationRef.current && !notificationRef.current.contains(event.target) &&
      messageRef.current && !messageRef.current.contains(event.target)
    ) {
      closeAllDropdowns();
    }
  }, []);

  useEffect(() => {
    const fetchUserProfile = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        navigate("/login");
        return;
      }

      try {
        const response = await fetch(
          `${process.env.REACT_APP_API_URL}/auth/me`,
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        const data = await response.json();
        if (response.ok) {
          setProfilePicture(data.profilePicture || null);
          setUserType(data.userType || null);
          setHasUnreadNotifications(data.hasUnreadNotifications || false);
        } else {
          console.error("Failed to load user data");
        }
      } catch (error) {
        console.error("An error occurred while fetching user data:", error);
      }
    };

    fetchUserProfile();
    checkUnreadNotifications();
    checkUnreadMessages();

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [handleClickOutside, navigate]);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const userType = localStorage.getItem("userType");
    
    if (token && userType !== "resident") {
      const socketUrl = process.env.NODE_ENV === 'production' 
        ? 'https://barangaypatrol.lgu1.com' 
        : 'http://localhost:5000';

      const socket = io(socketUrl, {
        auth: { token },
        withCredentials: true,
        transports: ['websocket']
      });

      socket.on('connect', () => {
        socket.emit('joinNotificationRoom');
      });

      socket.on('notificationUpdate', ({ type, notification }) => {
        if (type === 'new') {
          setHasUnreadNotifications(true);
          setNotifications(prev => [...prev, notification]);
        }
      });

      // Initial fetch of notifications
      checkUnreadNotifications();

      return () => {
        socket.disconnect();
      };
    }
  }, []);

  const checkUnreadNotifications = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `${process.env.REACT_APP_API_URL}/notifications/unread`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Network response was not ok: ${response.statusText}`);
      }

      const data = await response.json();
      setNotifications(data.unreadNotifications);
      setHasUnreadNotifications(data.unreadNotifications.length > 0);
    } catch (error) {
      console.error("Error fetching unread notifications:", error);
    }
  };

  const checkUnreadMessages = async () => {
    try {
      const response = await axios.get(
        `${process.env.REACT_APP_API_URL}/messages/unread`,
        {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        }
      );
      setHasUnreadMessages(response.data.hasUnread);
    } catch (error) {
      console.error("Error checking unread messages:", error);
    }
  };

  const toggleDropdown = () => setIsDropdownOpen(!isDropdownOpen);
  const toggleMessagesDropdown = () => {
    setShowMessageList(!showMessageList);
    setShowNotificationList(false);
    // Reset unread messages when opening message list
    if (!showMessageList) {
      setHasUnreadMessages(false);
    }
  };

  const toggleNotificationsDropdown = () => {
    setShowNotificationList(!showNotificationList);
    setShowMessageList(false);
    if (!showNotificationList) markNotificationsAsRead();
  };

  const markNotificationsAsRead = async () => {
    const token = localStorage.getItem("token");
    if (!token) return;

    try {
      await fetch(`${process.env.REACT_APP_API_URL}/notifications/mark-read`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      setHasUnreadNotifications(false);
    } catch (error) {
      console.error("Error marking notifications as read:", error);
    }
  };

  const closeAllDropdowns = () => {
    setIsDropdownOpen(false);
    setShowMessageList(false);
    setShowNotificationList(false);
  };

  const handleBackButton = () => {
    localStorage.clear();
    navigate("/");
  };

  const handleLogout = async () => {
    try {
      const token = localStorage.getItem('token');
      await axios.post(
        `${process.env.REACT_APP_API_URL}/auth/logout`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
    } catch (error) {
      console.error('Error during logout:', error);
    }
    
    logout(); // Call existing logout function
    closeAllDropdowns();
    navigate("/");
  };

  const handleMyAccount = () => {
    closeAllDropdowns();
    navigate("/myaccount");
  };

  const navItems = [
    { id: 1, component: <ThemeToggle />, label: "Theme Toggle" },
  ];

  const storedUserType = localStorage.getItem("userType");

  return (
    <aside className="rounded-2xl TopNav relative">
      <header className="bg-background text-text p-4 flex justify-between items-center rounded navigation">
        <button onClick={toggleSideNav} className="text-2xl">
          <RiMenuLine />
        </button>
        <div className="flex items-center m-2 space-x-5">
          {navItems.map((item) => (
            <span key={item.id} className="flex border-2 rounded-3xl text-2xl" title={item.label}>
              {item.component}
            </span>
          ))}

          {storedUserType === "resident" && (
            <button onClick={handleBackButton} className="text-2xl p-1" title="Back">
              Back
            </button>
          )}

          {storedUserType !== "resident" && (
            <>
              <div className="relative" ref={messageRef}>
                <button onClick={toggleMessagesDropdown} className="text-2xl p-1 relative" title="Messages">
                  <RiMessage3Line />
                  {hasUnreadMessages && (
                    <span className="absolute top-0 right-0 inline-block w-3 h-3 bg-red-500 rounded-full pulse"></span>
                  )}
                </button>
                {showMessageList && <MessageList />}
              </div>

              <div className="relative" ref={notificationRef}>
                <button onClick={toggleNotificationsDropdown} className="text-2xl p-1 relative" title="Notifications">
                  <RiNotification3Line />
                  {hasUnreadNotifications && notifications.length > 0 && (
                    <span className="absolute top-0 right-0 inline-block w-3 h-3 bg-red-500 rounded-full pulse"></span>
                  )}
                </button>
                {showNotificationList && <NotificationList onClose={toggleNotificationsDropdown} />}
              </div>
            </>
          )}

          {storedUserType !== "resident" && (
            <div className="relative" ref={dropdownRef}>
              <button onClick={toggleDropdown} className="border-2 rounded-full">
                {profilePicture ? (
                  <img src={profilePicture} alt="Profile" className="rounded-full w-12 h-12 object-cover" />
                ) : (
                  <RiUser3Line
                  className="rounded-full w-12 h-12 object-cover"
                  />
                )}
              </button>
              {isDropdownOpen && (
                <div className="absolute right-0 mt-6 w-48 TopNav shadow-lg rounded-lg z-50 hover:cursor-pointer text-center">
                  <ul className="py-2 ml-5 mr-5 my-5">
                    <li className="px-4 py-2 hover:bg-blue5 rounded-3xl" onClick={handleMyAccount}>
                      My Account
                    </li>
                    <li className="px-4 py-2 hover:bg-blue5 rounded-3xl" onClick={handleLogout}>
                      Log Out
                    </li>
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      </header>
    </aside>
  );
}

import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { RiUser3Line, RiMenuLine, RiMessage3Line, RiNotification3Line } from "react-icons/ri";
import ThemeToggle from "../forms/ThemeToggle";
import { useCombinedContext } from "../../contexts/useContext";
import NotificationList from "../notifications/NotificationList";
import MessageList from "../messages/MessageList";

export default function TopNav() {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [profilePicture, setProfilePicture] = useState(null);
  const [showNotificationList, setShowNotificationList] = useState(false);
  const [showMessageList, setShowMessageList] = useState(false);
  const [hasUnreadNotifications, setHasUnreadNotifications] = useState(false);
  const dropdownRef = useRef(null);
  const notificationRef = useRef(null);
  const messageRef = useRef(null);
  const navigate = useNavigate();
  const { toggleSideNav } = useCombinedContext();

  const handleClickOutside = (event) => {
    if (
      dropdownRef.current && !dropdownRef.current.contains(event.target) &&
      notificationRef.current && !notificationRef.current.contains(event.target) &&
      messageRef.current && !messageRef.current.contains(event.target)
    ) {
      closeAllDropdowns();
    }
  };

  useEffect(() => {
    const storedUser = JSON.parse(localStorage.getItem("user"));
    if (storedUser) {
      fetch(`${process.env.REACT_APP_API_URL}/users/${storedUser.id}`)
        .then((response) => response.json())
        .then((data) => {
          if (data.profilePicture) {
            setProfilePicture(data.profilePicture);
          }
        })
        .catch((error) => console.error("Error fetching user data:", error));
    }

    checkUnreadNotifications();

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const checkUnreadNotifications = async () => {
    const token = localStorage.getItem("token");
    if (!token) return;

    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/notifications/unread`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      setHasUnreadNotifications(data.hasUnread);
    } catch (error) {
      console.error("Error checking unread notifications:", error);
    }
  };

  const toggleDropdown = () => setIsDropdownOpen(!isDropdownOpen);
  const toggleMessagesDropdown = () => {
    setShowMessageList(!showMessageList);
    setShowNotificationList(false);
  };

  const toggleNotificationsDropdown = () => {
    setShowNotificationList(!showNotificationList);
    setShowMessageList(false);
    if (showNotificationList) markNotificationsAsRead();
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

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
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

          <div className="relative" ref={messageRef}>
            <button onClick={toggleMessagesDropdown} className="text-2xl p-1" title="Messages">
              <RiMessage3Line />
            </button>
            {showMessageList && <MessageList />}
          </div>

          <div className="relative" ref={notificationRef}>
            <button onClick={toggleNotificationsDropdown} className="text-2xl p-1 relative" title="Notifications">
              <RiNotification3Line />
              {hasUnreadNotifications && (
                <span className="absolute top-0 right-0 inline-block w-3 h-3 bg-red-500 rounded-full pulse"></span>
              )}
            </button>
            {showNotificationList && <NotificationList onClose={toggleNotificationsDropdown} />}
          </div>

          <div className="relative" ref={dropdownRef}>
            <button onClick={toggleDropdown} className="text-2xl border-2 rounded-full p-1">
              {profilePicture ? (
                <img src={profilePicture} alt="Profile" className="rounded-full w-8 h-8 object-cover" />
              ) : (
                <RiUser3Line />
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
        </div>
      </header>
    </aside>
  );
}

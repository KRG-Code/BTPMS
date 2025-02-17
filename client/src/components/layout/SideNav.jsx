import React, { useEffect, useState } from "react";
import { RiGovernmentFill } from "react-icons/ri";
import { buttonData, buttonData2, buttonData3 } from "../constants/navButtons";
import { NavLink } from "react-router-dom";
import { useCombinedContext } from "../../contexts/useContext";

export default function SideNav() {
  const { isOpen, closeSideNav } = useCombinedContext();
  const [userType, setUserType] = useState(null); // Store userType from API
  const [navButtons, setNavButtons] = useState([]);

  // Fetch user data from the server
  const fetchData = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;

      const response = await fetch(`${process.env.REACT_APP_API_URL}/auth/me`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`, // Use token to fetch user details
        },
      });

      if (response.ok) {
        const data = await response.json();
        setUserType(data.userType); // Set userType from the response
      } else {
        console.error("Failed to fetch user data");
      }
    } catch (error) {
      console.error("Error fetching user data:", error);
    }
  };

  useEffect(() => {
    fetchData(); // Fetch user type on component mount
  }, []);

  // Set nav buttons based on userType
  useEffect(() => {
    if (userType === "tanod") {
      setNavButtons(buttonData); // Set tanod-specific buttons
    } else if (userType === "resident") {
      setNavButtons(buttonData2); // Set resident-specific buttons
    }
    else if (userType === "admin") {
      setNavButtons(buttonData3); // Set resident-specific buttons
    }
  }, [userType]);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth > 768 && !isOpen) {
        closeSideNav(); // Ensure it remains open above 768px
      }
    };

    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, [isOpen, closeSideNav]);

  const handleNavClick = () => {
    if (window.innerWidth <= 768) {
      closeSideNav(); // Close on mobile view only
    }
  };

  return (
    <>
      <aside className={`SideNav mr-5 text-text h-full ${isOpen ? "SideNav-open" : "SideNav-close"} flex flex-col items-center rounded-2xl`}>
        <div className="p-4 flex flex-col items-center">
          <RiGovernmentFill className="text-4xl mb-2 text-blue-900" />
          <div className="text-lg font-bold">BTPMS</div>
        </div>
        <nav className="mt-10 flex-grow flex flex-col">
          <ul className="w-full">
            {navButtons.map((item, index) => (
              <li key={index} className="mb-2 w-full border rounded-3xl border-transparent">
                <NavLink
                  to={`/${item.label.charAt(0).toUpperCase() + item.label.slice(1).toLowerCase().replace(/\s+/g, "")}`}
                  className="flex items-center p-3 border border-transparent rounded-3xl navList"
                  onClick={handleNavClick} // Close the sidebar on mobile only
                >
                  <span className="text-xl flex items-center justify-center p-1 navIcon">
                    {item.icon}
                  </span>
                  {isOpen && <span className="ml-4">{item.label}</span>}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
      </aside>
      {isOpen && <div className="overlay" onClick={closeSideNav}></div>}
    </>
  );
}

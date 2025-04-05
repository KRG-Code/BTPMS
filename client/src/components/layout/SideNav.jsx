import React, { useEffect, useState } from "react";
import { buttonData, buttonData2, buttonData3 } from "../constants/navButtons";
import { NavLink } from "react-router-dom";
import { useCombinedContext } from "../../contexts/useContext";
import { useTheme } from "../../contexts/ThemeContext"; // Import useTheme hook

export default function SideNav() {
  const { isOpen, closeSideNav } = useCombinedContext();
  const { isDarkMode } = useTheme(); // Use theme context
  const [userType, setUserType] = useState(null); // Store userType from API
  const [navButtons, setNavButtons] = useState([]);

  // Fetch user data from the server
  const fetchData = async () => {
    try {
      const token = localStorage.getItem("token");
      const storedUserType = localStorage.getItem("userType"); // Get userType from local storage

      if (storedUserType) {
        setUserType(storedUserType); // Set userType from local storage
        return;
      }

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

  // Define theme-aware classes using the provided color palette
  const sideNavClasses = `SideNav mr-5 h-full ${isOpen ? "SideNav-open" : "SideNav-close"} 
    flex flex-col items-center rounded-2xl 
    ${isDarkMode 
      ? 'bg-[#080917] text-[#e7e8f4]' // Dark mode: dark blue bg, light text
      : 'bg-white text-[#0b0c18]'} // Light mode: white bg, dark text
    transition-colors duration-300`;

  const logoTextClasses = `text-lg font-bold ${isDarkMode ? 'text-[#e7e8f4]' : 'text-[#191d67]'}`;

  const iconClasses = `text-4xl mb-2 ${isDarkMode ? 'text-[#989ce6]' : 'text-[#191d67]'}`;

  const navItemClasses = (isActive) => `
    flex items-center p-3 border border-transparent rounded-3xl 
    ${isDarkMode 
      ? isActive 
        ? 'bg-[#191f8a] text-[#e7e8f4]' // Dark active: secondary color bg, light text
        : 'text-[#e7e8f4] hover:bg-[#0e0f28]' // Dark inactive: light text, darker hover
      : isActive 
        ? 'bg-[#e8e9f7] text-[#191d67]' // Light active: background color bg, primary text
        : 'text-[#0b0c18] hover:bg-[#f0f1fa]' // Light inactive: dark text, lighter hover
    }
    transition-colors duration-200
  `;

  const navIconClasses = (isActive) => `
    text-xl flex items-center justify-center p-1
    ${isDarkMode
      ? isActive ? 'text-[#989ce6]' : 'text-[#989ce6]' // Dark mode: primary color
      : isActive ? 'text-[#141db8]' : 'text-[#191d67]' // Light mode: accent or primary
    }
  `;

  return (
    <>
      <aside className={sideNavClasses}>
        <div className="p-4 flex flex-col items-center">
          <img 
            src="/icon.png" 
            alt="BTPMS Logo" 
            className={`w-12 h-12 mb-2 ${isDarkMode ? 'filter brightness-110' : ''}`} 
          />
          <div className={logoTextClasses}>
            {isOpen ? "Brgy. San Agustin" : "BSA"}
          </div>
        </div>
        <nav className="mt-10 flex-grow flex flex-col">
          <ul className="w-full">
            {navButtons.map((item, index) => (
              <li key={index} className="mb-2 w-full border rounded-3xl border-transparent">
                <NavLink
                  to={`/${item.label.charAt(0).toUpperCase() + item.label.slice(1).toLowerCase().replace(/\s+/g, "")}`}
                  className={({ isActive }) => navItemClasses(isActive)}
                  onClick={handleNavClick} // Close the sidebar on mobile only
                >
                  <span className={({ isActive }) => navIconClasses(isActive)}>
                    {item.icon}
                  </span>
                  {isOpen && <span className="ml-4">{item.label}</span>}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
      </aside>
      {isOpen && (
        <div 
          className={`overlay ${isDarkMode ? 'bg-opacity-70' : 'bg-opacity-50'}`}
          onClick={closeSideNav}
        ></div>
      )}
    </>
  );
}

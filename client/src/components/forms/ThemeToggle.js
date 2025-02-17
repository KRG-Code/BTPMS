import React, { useState, useEffect } from 'react';
import { RiSunLine, RiMoonLine } from "react-icons/ri";

export default function ThemeToggle() {
  const [isDarkMode, setIsDarkMode] = useState(
    localStorage.getItem('theme') === 'dark'
  );

  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode);
  };

  useEffect(() => {
    if (isDarkMode) {
      document.body.classList.add('dark-mode');
      document.body.classList.remove('light-mode');
      localStorage.setItem('theme', 'dark');
    } else {
      document.body.classList.add('light-mode');
      document.body.classList.remove('dark-mode');
      localStorage.setItem('theme', 'light');
    }
  }, [isDarkMode]);

  return (
    <button
      onClick={toggleTheme}
      className={`p-2 rounded transition-colors duration-300 ${
        isDarkMode ? 'text-white' : 'text-black'
      }`}
    >
      {isDarkMode ? <RiMoonLine /> : <RiSunLine />}
    </button>
  );
}

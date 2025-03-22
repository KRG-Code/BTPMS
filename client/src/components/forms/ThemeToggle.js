import React from 'react';
import { RiSunLine, RiMoonLine } from "react-icons/ri";
import { useTheme } from '../../contexts/ThemeContext';
import { motion } from 'framer-motion';

export default function ThemeToggle() {
  const { isDarkMode, toggleTheme } = useTheme();
  
  return (
    <motion.button
      onClick={toggleTheme}
      className={`p-2 rounded-full transition-colors duration-300 ${
        isDarkMode 
          ? 'bg-gray-800 text-yellow-300 hover:bg-gray-700' 
          : 'bg-blue-100 text-blue-800 hover:bg-blue-200'
      }`}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.9 }}
      title={isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
    >
      {isDarkMode ? <RiSunLine className="h-5 w-5" /> : <RiMoonLine className="h-5 w-5" />}
    </motion.button>
  );
}

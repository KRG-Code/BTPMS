import { motion } from 'framer-motion';
import Header from "../components/layout/TanodHeader";
import Login from "../components/users/tanods/Login";
import ThemeToggle from "../components/forms/ThemeToggle";
import { useTheme } from '../contexts/ThemeContext';
import { FaShieldAlt } from 'react-icons/fa';

export default function LoginPage() {
  const { isDarkMode } = useTheme();
  
  return (
    <div className={`min-h-screen ${isDarkMode ? 'bg-gray-900' : 'bg-gradient-to-r from-blue-50 to-indigo-50'}`}>
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>
      
      <div className="min-h-screen flex flex-col items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <motion.div 
          className={`max-w-md w-full space-y-8 ${
            isDarkMode 
              ? 'bg-gray-800 shadow-xl shadow-blue-900/10' 
              : 'bg-white shadow-xl shadow-blue-200/50'
          } rounded-xl p-8`}
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <motion.div
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.5 }}
            className="flex flex-col items-center"
          >
            <FaShieldAlt className={`w-16 h-16 ${isDarkMode ? 'text-blue-400' : 'text-blue-600'} mb-4`} />
            <Header heading="Tanod Login" />
            <p className={`text-center ${isDarkMode ? 'text-gray-400' : 'text-gray-600'} mt-2`}>
              Sign in to access your tanod dashboard
            </p>
          </motion.div>
          
          <Login />
        </motion.div>
      </div>
    </div>
  );
}

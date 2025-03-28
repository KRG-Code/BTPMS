import { motion } from 'framer-motion';

export default function FormExtra({ isDarkMode = false }) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center">
        <input
          id="remember-me"
          name="remember-me"
          type="checkbox"
          className={`h-4 w-4 ${isDarkMode ? 'text-blue-600 border-gray-600' : 'text-blue-600 border-gray-300'} rounded focus:ring-blue-500`}
        />
        <label htmlFor="remember-me" className={`ml-2 block text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
          Remember me
        </label>
      </div>

      <motion.div 
        className="text-sm"
        whileHover={{ scale: 1.03 }}
      >
        <a 
          href="/forgot-password" 
          className={`font-medium ${isDarkMode ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-500'} transition-colors duration-200`}
        >
          Forgot your password?
        </a>
      </motion.div>
    </div>
  );
}

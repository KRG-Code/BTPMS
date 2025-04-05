import { motion } from 'framer-motion';

export default function FormExtra({ isDarkMode = false }) {
  return (
    <div className="flex items-center justify-end">
      <div className="text-sm">
        <a 
          href="/forgot-password" 
          className={`font-medium ${isDarkMode ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-500'} transition-colors duration-200`}
        >
          Forgot your password?
        </a>
      </div>
    </div>
  );
}

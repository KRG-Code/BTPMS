import { motion } from 'framer-motion';

export default function FormAction({
  handleSubmit,
  type = "Button",
  action = "submit",
  text,
  loading = false,
  isDarkMode = false
}) {
  return (
    <>
      {type === "Button" ? (
        <motion.button
          type={action}
          className={`group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg 
            ${isDarkMode 
              ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-600/20' 
              : 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/30'
            } 
            focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 
            transition-all duration-200 ease-in-out
            ${loading ? 'opacity-80 cursor-not-allowed' : ''}`}
          onClick={handleSubmit}
          disabled={loading}
          whileHover={{ scale: loading ? 1 : 1.02 }}
          whileTap={{ scale: loading ? 1 : 0.98 }}
        >
          {text}
        </motion.button>
      ) : (
        <></>
      )}
    </>
  );
}

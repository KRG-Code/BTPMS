import React from "react";
import { motion } from "framer-motion";
import { FaBox, FaCalendarAlt, FaCheck, FaClock, FaExchangeAlt } from "react-icons/fa";
import dayjs from "dayjs";

const tableRowVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3 } }
};

const EquipmentCard = ({ 
  item, 
  handleReturn,
  formatDate,
  getStatusBadgeClass,
  isDarkMode,
  cardBg,
  borderColor,
  textColor,
  subTextColor,
  buttonDanger
}) => {
  return (
    <motion.div 
      variants={tableRowVariants}
      whileHover={{ scale: 1.01 }}
      className={`${cardBg} shadow-md rounded-xl overflow-hidden border ${borderColor} mb-4`}
    >
      <div className={`px-4 py-3 border-b ${borderColor} flex justify-between items-center`}>
        <div className="flex items-center">
          <span className={`font-medium ${textColor}`}>{item.name}</span>
        </div>
        <span className={`px-3 py-1 rounded-full text-sm font-medium flex items-center ${getStatusBadgeClass(item.returnDate)}`}>
          {item.returnDate === "1970-01-01T00:00:00.000Z" ? 'Borrowed' : 'Returned'}
        </span>
      </div>
      
      <div className="p-4">
        <div className="flex space-x-3">
          <div className="flex-shrink-0">
            <img 
              src={item.imageUrl} 
              alt={item.name} 
              className="w-24 h-24 object-cover rounded-lg border border-gray-300"
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = 'https://placehold.co/100x100?text=No+Image';
              }}
            />
          </div>
          
          <div className="flex-1">
            <div className="mb-2">
              <div className="flex items-center mb-1">
                <FaCalendarAlt className={`mr-2 ${subTextColor}`} />
                <span className={`text-xs font-medium ${subTextColor}`}>Borrowed</span>
              </div>
              <p className={`${textColor} text-sm`}>{dayjs(item.borrowDate).format("hh:mm A DD-MM-YYYY")}</p>
            </div>
            
            <div>
              <div className="flex items-center mb-1">
                <FaExchangeAlt className={`mr-2 ${subTextColor}`} />
                <span className={`text-xs font-medium ${subTextColor}`}>Returned</span>
              </div>
              <p className={`text-sm`}>
                {formatDate(item.returnDate) || (
                  <span className="text-red-500 flex items-center">Not Returned</span>
                )}
              </p>
            </div>
          </div>
        </div>
        
        {item.returnDate === "1970-01-01T00:00:00.000Z" && (
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => handleReturn(item._id)}
            className={`w-full mt-3 py-2 px-4 rounded-lg ${buttonDanger} text-white flex items-center justify-center`}
          >
            <FaCheck className="mr-2" /> Return Item
          </motion.button>
        )}
      </div>
    </motion.div>
  );
};

export default EquipmentCard;

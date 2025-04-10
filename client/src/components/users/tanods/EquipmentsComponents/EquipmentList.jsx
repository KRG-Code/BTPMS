import React from "react";
import { motion } from "framer-motion";
import { FaCheck, FaExchangeAlt, FaExclamationTriangle } from "react-icons/fa";
import dayjs from "dayjs";
import EquipmentCard from "./EquipmentCard";

const slideUp = {
  hidden: { y: 20, opacity: 0 },
  visible: i => ({
    y: 0, 
    opacity: 1, 
    transition: { delay: i * 0.1, duration: 0.4 }
  })
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05
    }
  }
};

const tableRowVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3 } }
};

const fadeIn = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.4 } }
};

const EquipmentList = ({
  loading,
  filteredItems,
  showReturned,
  textColor,
  subTextColor,
  handleReturn,
  formatDate,
  getStatusBadgeClass,
  isDarkMode,
  cardBg,
  borderColor,
  hoverBg,
  buttonDanger
}) => {
  // Loading skeletons
  const TableSkeleton = () => (
    <div className="animate-pulse">
      <div className={`h-10 ${isDarkMode ? 'bg-gray-700' : 'bg-gray-200'} rounded mb-4`}></div>
      {[...Array(3)].map((_, i) => (
        <div key={i} className={`h-16 ${isDarkMode ? 'bg-gray-700' : 'bg-gray-200'} rounded mb-3`}></div>
      ))}
    </div>
  );

  const CardSkeleton = () => (
    <div className="animate-pulse">
      {[...Array(3)].map((_, i) => (
        <div key={i} className={`${isDarkMode ? 'bg-gray-700' : 'bg-gray-200'} rounded-xl h-44 mb-4`}></div>
      ))}
    </div>
  );

  return (
    <>
      <motion.div variants={slideUp} custom={1}>
        <div className="flex items-center justify-between mb-4">
          <h2 className={`text-xl font-bold ${textColor}`}>
            {showReturned ? "Returned Equipment" : "Borrowed Equipment"}
          </h2>
          <span className={`text-sm ${subTextColor}`}>
            {filteredItems.length} {filteredItems.length === 1 ? 'item' : 'items'} found
          </span>
        </div>
      </motion.div>

      {/* Desktop Table View (hidden on mobile) */}
      <motion.div 
        variants={fadeIn}
        className="hidden md:block"
      >
        {loading ? (
          <TableSkeleton />
        ) : filteredItems.length === 0 ? (
          <motion.div 
            variants={slideUp} 
            custom={3}
            className={`flex flex-col items-center justify-center p-8 rounded-xl ${cardBg} border ${borderColor}`}
          >
            <FaExchangeAlt size={48} className={`${subTextColor} mb-4`} />
            <p className={`${textColor} text-lg font-medium mb-2`}>No equipment found</p>
            <p className={`${subTextColor}`}>Try adjusting your filters or borrow new equipment</p>
          </motion.div>
        ) : (
          <motion.div 
            variants={staggerContainer}
            className={`overflow-hidden rounded-xl shadow-lg border ${borderColor}`}
          >
            <div className="overflow-x-auto">
              <table className={`min-w-full ${cardBg}`}>
                <thead className={`${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'} border-b ${borderColor}`}>
                  <tr>
                    <th className={`py-3.5 px-4 text-left text-sm font-medium ${subTextColor}`}>Item Name</th>
                    <th className={`py-3.5 px-4 text-left text-sm font-medium ${subTextColor}`}>Borrow Date & Time</th>
                    <th className={`py-3.5 px-4 text-left text-sm font-medium ${subTextColor}`}>Return Date & Time</th>
                    <th className={`py-3.5 px-4 text-left text-sm font-medium ${subTextColor}`}>Image</th>
                    <th className={`py-3.5 px-4 text-left text-sm font-medium ${subTextColor}`}>Status</th>
                    <th className={`py-3.5 px-4 text-right text-sm font-medium ${subTextColor}`}>Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {filteredItems.map((item, index) => (
                    <motion.tr 
                      key={item._id}
                      variants={tableRowVariants}
                      initial="hidden"
                      animate="visible"
                      exit="hidden"
                      custom={index}
                      className={`${hoverBg} transition-colors`}
                    >
                      <td className={`py-4 px-4 whitespace-nowrap ${textColor} font-medium`}>{item.name}</td>
                      <td className={`py-4 px-4 whitespace-nowrap ${textColor}`}>
                        {dayjs(item.borrowDate).format("hh:mm A DD-MM-YYYY")}
                      </td>
                      <td className={`py-4 px-4 whitespace-nowrap`}>
                        {formatDate(item.returnDate) || (
                          <span className="text-red-500 flex items-center">
                            <FaExclamationTriangle className="mr-1" /> Not Returned
                          </span>
                        )}
                      </td>
                      <td className={`py-4 px-4`}>
                        <img 
                          src={item.imageUrl} 
                          alt={item.name} 
                          className="w-16 h-16 object-cover rounded border border-gray-300"
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = 'https://placehold.co/80x80?text=No+Image';
                          }}
                        />
                      </td>
                      <td className={`py-4 px-4 whitespace-nowrap`}>
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${getStatusBadgeClass(item.returnDate)}`}>
                          {item.returnDate === "1970-01-01T00:00:00.000Z" ? 'Borrowed' : 'Returned'}
                        </span>
                      </td>
                      <td className="py-4 px-4 whitespace-nowrap text-right">
                        {item.returnDate === "1970-01-01T00:00:00.000Z" && (
                          <motion.button
                            whileHover={{ scale: 1.03 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => handleReturn(item._id)}
                            className={`inline-flex items-center px-3 py-1.5 rounded-lg ${buttonDanger} text-white text-sm`}
                          >
                            <FaCheck className="mr-1.5" /> Return Item
                          </motion.button>
                        )}
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}
      </motion.div>

      {/* Mobile Card View (hidden on desktop) */}
      <motion.div 
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
        className="md:hidden"
      >
        {loading ? (
          <CardSkeleton />
        ) : filteredItems.length === 0 ? (
          <motion.div 
            variants={slideUp} 
            custom={3}
            className={`flex flex-col items-center justify-center p-8 rounded-xl ${cardBg} border ${borderColor}`}
          >
            <FaExchangeAlt size={40} className={`${subTextColor} mb-3`} />
            <p className={`${textColor} text-base font-medium mb-1`}>No equipment found</p>
            <p className={`${subTextColor} text-sm text-center`}>Try adjusting your filters or borrow new equipment</p>
          </motion.div>
        ) : (
          filteredItems.map((item) => (
            <EquipmentCard 
              key={item._id} 
              item={item} 
              handleReturn={handleReturn}
              formatDate={formatDate}
              getStatusBadgeClass={getStatusBadgeClass}
              isDarkMode={isDarkMode}
              cardBg={cardBg}
              borderColor={borderColor}
              textColor={textColor}
              subTextColor={subTextColor}
              buttonDanger={buttonDanger}
            />
          ))
        )}
      </motion.div>
    </>
  );
};

export default EquipmentList;

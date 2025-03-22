import React, { useState } from 'react';
import { FaEdit, FaTrash, FaSortUp, FaSortDown, FaSort, FaEnvelope, FaUserTag, FaPhone, FaUserCircle } from 'react-icons/fa';
import { motion } from 'framer-motion';
import Loading from '../../../../utils/Loading';
import { useTheme } from '../../../../contexts/ThemeContext'; // Import useTheme hook

export default function TanodTable({ tanods, loading, handleDeleteTanod, handleEditClick }) {
  const { isDarkMode } = useTheme(); // Use theme context
  const [sortField, setSortField] = useState('firstName');
  const [sortDirection, setSortDirection] = useState('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Sort tanods
  const sortedTanods = [...tanods].sort((a, b) => {
    let aValue = a[sortField];
    let bValue = b[sortField];
    
    // Handle special sort cases
    if (sortField === 'status') {
      aValue = a.isOnline ? 1 : 0;
      bValue = b.isOnline ? 1 : 0;
    }
    
    if (sortField === 'name') {
      aValue = (a.firstName + ' ' + a.lastName).toLowerCase();
      bValue = (b.firstName + ' ' + b.lastName).toLowerCase();
    }
    
    if (aValue === null || aValue === undefined) return 1;
    if (bValue === null || bValue === undefined) return -1;
    
    if (typeof aValue === 'string') {
      aValue = aValue.toLowerCase();
      bValue = bValue.toLowerCase();
    }
    
    if (sortDirection === 'asc') {
      return aValue > bValue ? 1 : -1;
    } else {
      return aValue < bValue ? 1 : -1;
    }
  });

  // Pagination
  const totalPages = Math.ceil(sortedTanods.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedTanods = sortedTanods.slice(startIndex, startIndex + itemsPerPage);

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const getSortIcon = (field) => {
    if (sortField !== field) return <FaSort className="ml-1 text-gray-400" />;
    return sortDirection === 'asc' ? <FaSortUp className="ml-1 text-blue-500" /> : <FaSortDown className="ml-1 text-blue-500" />;
  };

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05
      }
    }
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.3 }
    }
  };

  return (
    <div>
      {/* Table Controls */}
      <div className="flex flex-wrap gap-2 mb-4">
        <SortButton 
          label="Name" 
          field="firstName" 
          currentField={sortField} 
          onClick={() => handleSort('firstName')} 
          icon={getSortIcon('firstName')}
          isDarkMode={isDarkMode}
        />
        <SortButton 
          label="Username" 
          field="username" 
          currentField={sortField} 
          onClick={() => handleSort('username')} 
          icon={getSortIcon('username')}
          isDarkMode={isDarkMode}
        />
        <SortButton 
          label="Email" 
          field="email" 
          currentField={sortField} 
          onClick={() => handleSort('email')} 
          icon={getSortIcon('email')}
          isDarkMode={isDarkMode}
        />
        <SortButton 
          label="Status" 
          field="status" 
          currentField={sortField} 
          onClick={() => handleSort('status')} 
          icon={getSortIcon('status')}
          isDarkMode={isDarkMode}
        />
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center p-12">
          <Loading type="spinner" color={isDarkMode ? "white" : "blue"} size="lg" />
          <p className={`${isDarkMode ? 'text-gray-300' : 'text-gray-500'} mt-4 animate-pulse`}>Loading tanod personnel...</p>
        </div>
      ) : (
        <motion.div 
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {paginatedTanods.map((tanod) => (
            <TanodCard 
              key={tanod._id} 
              tanod={tanod} 
              handleEditClick={handleEditClick} 
              handleDeleteTanod={handleDeleteTanod} 
              variants={cardVariants}
              isDarkMode={isDarkMode}
            />
          ))}
        </motion.div>
      )}
      
      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-8 px-4 py-4 bg-white rounded-lg shadow-sm">
          <div className="hidden sm:block">
            <p className="text-sm text-gray-700">
              Showing <span className="font-medium">{startIndex + 1}</span> to{" "}
              <span className="font-medium">
                {Math.min(startIndex + itemsPerPage, tanods.length)}
              </span>{" "}
              of <span className="font-medium">{tanods.length}</span> results
            </p>
          </div>
          <div className="flex-1 flex justify-center sm:justify-end">
            <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
              <PaginationButton 
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                icon={
                  <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                    <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                }
                className="rounded-l-md"
              />
              
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter(page => {
                  // Show only a subset of pages for large numbers
                  if (totalPages <= 7) return true;
                  if (page === 1 || page === totalPages) return true;
                  if (page >= currentPage - 1 && page <= currentPage + 1) return true;
                  return false;
                })
                .map((page, index, array) => {
                  if (index > 0 && array[index - 1] !== page - 1) {
                    // Add ellipsis when there's a gap in page numbers
                    return [
                      <div key={`ellipsis-${page}`} className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700">
                        ...
                      </div>,
                      <PaginationButton 
                        key={page}
                        page={page}
                        currentPage={currentPage}
                        onClick={() => setCurrentPage(page)}
                      />
                    ];
                  }
                  return (
                    <PaginationButton 
                      key={page}
                      page={page}
                      currentPage={currentPage}
                      onClick={() => setCurrentPage(page)}
                    />
                  );
                })}
              
              <PaginationButton 
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                icon={
                  <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                    <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                  </svg>
                }
                className="rounded-r-md"
              />
            </nav>
          </div>
        </div>
      )}
    </div>
  );
}

// Tanod Card Component
function TanodCard({ tanod, handleEditClick, handleDeleteTanod, variants, isDarkMode }) {
  return (
    <motion.div
      variants={variants}
      whileHover={{ y: -5, transition: { duration: 0.2 } }}
      className={`rounded-xl overflow-hidden shadow-md transition-all duration-300 hover:shadow-xl border ${
        isDarkMode ? 'bg-[#0e1022] border-[#1e2048]' : 'bg-white border-gray-100'
      }`}
    >
      {/* Card Header */}
      <div className="relative">
        {/* Background gradient banner */}
        <div className={`h-24 ${
          isDarkMode 
            ? 'bg-gradient-to-r from-[#191f8a] to-[#4750eb]' 
            : 'bg-gradient-to-r from-[#191d67] to-[#141db8]'
        }`}></div>
        
        {/* Profile picture */}
        <div className="absolute left-1/2 transform -translate-x-1/2 -bottom-12">
          <div className="relative">
            {tanod.profilePicture ? (
              <img
                src={tanod.profilePicture}
                alt={`${tanod.firstName} ${tanod.lastName}`}
                className="h-24 w-24 rounded-full object-cover border-4 border-white shadow-md"
              />
            ) : (
              <div className={`h-24 w-24 rounded-full flex items-center justify-center ${
                isDarkMode ? 'bg-[#080917] border-4 border-[#0e1022]' : 'bg-gray-100 border-4 border-white'
              } shadow-md`}>
                <FaUserCircle className={`h-16 w-16 ${isDarkMode ? 'text-[#1e2048]' : 'text-gray-300'}`} />
              </div>
            )}
            {tanod.isOnline && (
              <span className="absolute bottom-1 right-1 block h-5 w-5 rounded-full bg-green-400 ring-2 ring-white" />
            )}
          </div>
        </div>
      </div>
      
      {/* Card Body */}
      <div className="pt-14 px-4 pb-4">
        <div className="text-center mb-4">
          <h3 className={`text-lg font-bold truncate ${isDarkMode ? 'text-[#e7e8f4]' : 'text-gray-900'}`}>
            {tanod.firstName} {tanod.lastName}
          </h3>
          <span
            className={`inline-flex mt-1 px-2 py-1 text-xs font-semibold rounded-full ${
              tanod.isOnline
                ? isDarkMode ? "bg-green-900 text-green-200" : "bg-green-100 text-green-800"
                : isDarkMode ? "bg-gray-700 text-gray-300" : "bg-gray-100 text-gray-800"
            }`}
          >
            {tanod.isOnline ? "Online" : "Offline"}
          </span>
        </div>

        {/* Tanod details */}
        <div className="space-y-2 mt-4">
          <div className={`flex items-center text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
            <FaUserTag className={`mr-2 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`} />
            <span className="truncate">{tanod.username || 'No username'}</span>
          </div>
          {tanod.email && (
            <div className={`flex items-center text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
              <FaEnvelope className={`mr-2 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`} />
              <span className="truncate">{tanod.email}</span>
            </div>
          )}
          {tanod.contactNumber && (
            <div className={`flex items-center text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
              <FaPhone className={`mr-2 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`} />
              <span>{tanod.contactNumber}</span>
            </div>
          )}
        </div>
        
        {/* Card Actions */}
        <div className={`mt-5 flex justify-end space-x-2 border-t pt-4 ${isDarkMode ? 'border-[#1e2048]' : 'border-gray-100'}`}>
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            className={`p-2 ${isDarkMode ? 'text-[#989ce6] hover:bg-[#191f8a]' : 'text-blue-600 hover:bg-blue-50'} rounded-full transition-colors`}
            onClick={() => handleEditClick(tanod)}
            title="Edit"
          >
            <FaEdit className="h-5 w-5" />
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            className={`p-2 ${isDarkMode ? 'text-red-400 hover:bg-red-900' : 'text-red-600 hover:bg-red-50'} rounded-full transition-colors`}
            onClick={() => handleDeleteTanod(tanod._id)}
            title="Delete"
          >
            <FaTrash className="h-5 w-5" />
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
}

// Sort Button Component
function SortButton({ label, field, currentField, onClick, icon, isDarkMode }) {
  return (
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      className={`px-3 py-1 rounded-md text-sm font-medium flex items-center ${
        currentField === field
          ? isDarkMode ? 'bg-[#191f8a] text-[#e7e8f4]' : 'bg-blue-100 text-blue-800'
          : isDarkMode ? 'bg-[#080917] text-[#e7e8f4] hover:bg-[#0e1022]' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
      }`}
      onClick={onClick}
    >
      {label} {icon}
    </motion.button>
  );
}

// Pagination Button Component
function PaginationButton({ page, currentPage, onClick, disabled, icon, className = '' }) {
  if (icon) {
    return (
      <button
        onClick={onClick}
        disabled={disabled}
        className={`relative inline-flex items-center px-2 py-2 border border-gray-300 bg-white text-sm font-medium ${
          disabled ? "text-gray-300" : "text-gray-500 hover:bg-gray-50"
        } ${className}`}
      >
        <span className="sr-only">{disabled ? "Disabled" : "Enabled"}</span>
        {icon}
      </button>
    );
  }
  
  return (
    <button
      onClick={onClick}
      className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
        currentPage === page
          ? "z-10 bg-blue-50 border-blue-500 text-blue-600"
          : "bg-white border-gray-300 text-gray-500 hover:bg-gray-50"
      }`}
    >
      {page}
    </button>
  );
}

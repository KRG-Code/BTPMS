import React, { useState, useEffect } from 'react';
import { PDFViewer } from '@react-pdf/renderer';
import { FaArrowLeft, FaDownload, FaCalendarAlt, FaFilter } from 'react-icons/fa';
import { format } from 'date-fns';
import { motion } from 'framer-motion';
import axios from 'axios';
import CollectivePerformanceReport from './CollectivePerformanceReport';
import PDFPasswordModal from './PDFPasswordModal';
import { createAndDownloadProtectedZip } from '../../../../utils/zipUtils';
import { toast } from 'react-toastify';

// Animation variants
const backdropVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
  exit: { opacity: 0 }
};

const modalVariants = {
  hidden: { opacity: 0, y: 20, scale: 0.95 },
  visible: { 
    opacity: 1, 
    y: 0, 
    scale: 1, 
    transition: { duration: 0.3 } 
  },
  exit: { 
    opacity: 0, 
    y: 20, 
    scale: 0.95, 
    transition: { duration: 0.2 } 
  }
};

const AllTanodsReportModal = ({ isOpen, onClose, isDarkMode }) => {
  const [reportType, setReportType] = useState('monthly');
  const [startDate, setStartDate] = useState(() => {
    const date = new Date();
    date.setMonth(date.getMonth() - 1);
    return format(date, 'yyyy-MM-dd');
  });
  const [endDate, setEndDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [reportData, setReportData] = useState(null);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchReportData();
    }
  }, [isOpen, reportType, startDate, endDate]);

  const fetchReportData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${process.env.REACT_APP_API_URL}/auth/tanod-performance/collective`, {
        headers: { Authorization: `Bearer ${token}` },
        params: { reportType, startDate, endDate }
      });
      
      setReportData(response.data);
    } catch (error) {
      console.error('Error fetching report data:', error);
      setError('Failed to load report data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handlePrepareDownload = () => {
    setShowPasswordModal(true);
  };

  const handleConfirmDownload = async (password) => {
    setShowPasswordModal(false);
    setIsDownloading(true);
    
    try {
      // Create filename
      const fileName = `collective_performance_${reportType}_${format(new Date(), 'yyyy-MM-dd')}`;
      
      // Generate and download the ZIP file with password protection
      await createAndDownloadProtectedZip(
        CollectivePerformanceReport,
        { data: reportData },
        password,
        fileName
      );
      
      toast.success("Report downloaded successfully");
    } catch (error) {
      console.error('Error creating report:', error);
      toast.error("Failed to create report");
    } finally {
      setIsDownloading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <motion.div
      className={`fixed inset-0 z-50 flex items-center justify-center p-4 ${isDarkMode ? 'bg-gray-900' : 'bg-gray-100'} bg-opacity-90`}
      variants={backdropVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
    >
      <motion.div 
        className={`w-full max-w-5xl h-[85vh] flex flex-col rounded-xl overflow-hidden ${isDarkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-800'} shadow-2xl`}
        variants={modalVariants}
      >
        <div className={`p-4 border-b ${isDarkMode ? 'border-gray-700 bg-gray-900' : 'border-gray-200 bg-gray-50'} flex justify-between items-center`}>
          <div className="flex items-center space-x-2">
            <button
              onClick={onClose}
              className={`p-2 rounded-full ${isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-200'}`}
            >
              <FaArrowLeft />
            </button>
            <h2 className="text-lg font-semibold">Collective Tanod Performance Report</h2>
          </div>
        </div>

        <div className="p-6 flex flex-col flex-grow overflow-hidden">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 flex-shrink-0">
            <div className="flex flex-col sm:flex-row gap-4">
              <div>
                <label className={`block text-sm font-medium mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                  <FaFilter className="inline mr-1" /> Report Type
                </label>
                <select
                  value={reportType}
                  onChange={(e) => setReportType(e.target.value)}
                  className={`w-full p-2 rounded-md ${
                    isDarkMode 
                      ? 'bg-gray-700 border-gray-600 text-white' 
                      : 'bg-white border-gray-300'
                  }`}
                >
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                  <option value="quarterly">Quarterly</option>
                  <option value="annual">Annual</option>
                </select>
              </div>
              
              <div>
                <label className={`block text-sm font-medium mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                  <FaCalendarAlt className="inline mr-1" /> Start Date
                </label>
                <input 
                  type="date" 
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className={`w-full p-2 rounded-md ${
                    isDarkMode 
                      ? 'bg-gray-700 border-gray-600 text-white' 
                      : 'bg-white border-gray-300'
                  }`}
                />
              </div>
              
              <div>
                <label className={`block text-sm font-medium mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                  <FaCalendarAlt className="inline mr-1" /> End Date
                </label>
                <input 
                  type="date" 
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className={`w-full p-2 rounded-md ${
                    isDarkMode 
                      ? 'bg-gray-700 border-gray-600 text-white' 
                      : 'bg-white border-gray-300'
                  }`}
                />
              </div>
            </div>

            {reportData && !loading && !error && (
              <button
                onClick={handlePrepareDownload}
                className={`px-4 py-2 rounded-md ${
                  isDarkMode 
                    ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                    : 'bg-blue-500 hover:bg-blue-600 text-white'
                }`}
              >
                <FaDownload className="inline mr-2" />
                Download Report
              </button>
            )}
          </div>

          <div className="flex-grow overflow-auto rounded-lg border relative">
            {/* Read-only message */}
            <div className="text-xs text-center py-1 bg-gray-800 bg-opacity-75 text-white absolute w-full z-10">
              This is a read-only preview. Use the download button above to save this report.
            </div>

            {loading && (
              <div className="h-full flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
              </div>
            )}
            
            {error && !loading && (
              <div className={`h-full flex items-center justify-center ${isDarkMode ? 'text-red-400' : 'text-red-500'}`}>
                <div className="text-center p-4">
                  <p className="text-lg font-medium mb-2">Error</p>
                  <p>{error}</p>
                </div>
              </div>
            )}
            
            {reportData && !loading && !error && (
              <PDFViewer 
                style={{ width: '100%', height: '100%', minHeight: '400px' }}
                showToolbar={false}
              >
                <CollectivePerformanceReport data={reportData} />
              </PDFViewer>
            )}
            
            {/* CSS to disable browser print and save functionality */}
            <style jsx global>{`
              iframe {
                -webkit-user-select: none;
                -moz-user-select: none;
                -ms-user-select: none;
                user-select: none;
              }
              @media print {
                body * {
                  display: none !important;
                }
                body:after {
                  content: "Printing is disabled. Please use the download button.";
                  display: block !important;
                }
              }
            `}</style>
          </div>
        </div>
      </motion.div>
      
      {/* PDF Password Modal */}
      {showPasswordModal && (
        <PDFPasswordModal
          isOpen={showPasswordModal}
          onClose={() => setShowPasswordModal(false)}
          onConfirm={handleConfirmDownload}
          isDarkMode={isDarkMode}
        />
      )}
    </motion.div>
  );
};

export default AllTanodsReportModal;

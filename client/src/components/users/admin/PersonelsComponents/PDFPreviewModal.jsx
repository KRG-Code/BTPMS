import React, { useState } from 'react';
import { PDFViewer } from '@react-pdf/renderer';
import { FaArrowLeft, FaDownload, FaCalendarAlt } from 'react-icons/fa';
import { format } from 'date-fns';
import { motion } from 'framer-motion';
import TanodPerformanceReport from './TanodPerformanceReport';
import PDFPasswordModal from './PDFPasswordModal';
import { toast } from 'react-toastify';
import { createAndDownloadProtectedZip } from '../../../../utils/zipUtils';

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

const PDFPreviewModal = ({ isOpen, onClose, tanod, performanceData, isDarkMode }) => {
  const [reportType, setReportType] = useState('monthly');
  const [reportPeriod, setReportPeriod] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  if (!isOpen) return null;

  const handlePrepareDownload = () => {
    // Always show password modal first before downloading
    setShowPasswordModal(true);
  };

  const handleConfirmDownload = async (password) => {
    try {
      setIsDownloading(true);
      
      // Always use the password-protected zip function
      const success = await createAndDownloadProtectedZip(
        TanodPerformanceReport,
        { 
          tanod, 
          performanceData,
          reportType,
          reportPeriod
        },
        password,
        `${tanod.firstName}_${tanod.lastName}_Report_${new Date().toISOString().split('T')[0]}`
      );
      
      if (success) {
        setShowPasswordModal(false);
      }
    } catch (error) {
      console.error('Error downloading report:', error);
      toast.error('Failed to download report');
    } finally {
      setIsDownloading(false);
    }
  };

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
            <h2 className="text-lg font-semibold">Performance Report: {tanod.firstName} {tanod.lastName}</h2>
          </div>
          
        </div>

        <div className="p-6 flex flex-col flex-grow overflow-hidden">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 flex-shrink-0">
            <div className="flex flex-col sm:flex-row gap-4">
              <div>
                <label className={`block text-sm font-medium mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                  Report Type
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
                  <FaCalendarAlt className="inline mr-1" /> Report Date
                </label>
                <input 
                  type="date" 
                  value={reportPeriod}
                  onChange={(e) => setReportPeriod(e.target.value)}
                  className={`w-full p-2 rounded-md ${
                    isDarkMode 
                      ? 'bg-gray-700 border-gray-600 text-white' 
                      : 'bg-white border-gray-300'
                  }`}
                />
              </div>
            </div>

            <button
              onClick={handlePrepareDownload}
              className={`px-4 py-2 rounded-md ${
                isDarkMode 
                  ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                  : 'bg-blue-500 hover:bg-blue-600 text-white'
              }`}
              disabled={isDownloading}
            >
              <FaDownload className="inline mr-2" />
              {isDownloading ? "Preparing..." : "Download Report"}
            </button>
          </div>

          <div className="flex-grow overflow-auto rounded-lg border relative">
            {/* Read-only message */}
            <div className="text-xs text-center py-1 bg-gray-800 bg-opacity-75 text-white absolute w-full z-10">
              This is a read-only preview. Use the download button above to save this report.
            </div>
            
            {/* PDF Viewer with disabled toolbar */}
            <PDFViewer 
              style={{ width: '100%', height: '100%', minHeight: '400px' }}
              showToolbar={false}
            >
              <TanodPerformanceReport 
                tanod={tanod} 
                performanceData={performanceData} 
                reportType={reportType}
                reportPeriod={reportPeriod}
              />
            </PDFViewer>
            
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

export default PDFPreviewModal;

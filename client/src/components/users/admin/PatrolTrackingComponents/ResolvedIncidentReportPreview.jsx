import React, { useState, useEffect } from 'react';
import { PDFViewer } from '@react-pdf/renderer';
import { motion } from 'framer-motion';
import { FaArrowLeft, FaDownload, FaFilter, FaCalendarAlt, FaChartBar, FaChevronDown, FaChevronUp } from 'react-icons/fa';
import { format, startOfMonth, endOfMonth, startOfQuarter, endOfQuarter, startOfYear, endOfYear, subMonths, subQuarters, subYears } from 'date-fns';
import ResolvedIncidentReport from './ResolvedIncidentReport';

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

const buttonVariants = {
  hover: { scale: 1.05 },
  tap: { scale: 0.95 }
};

const ResolvedIncidentReportPreview = ({ isOpen, onClose, onDownload, incidents, falseAlarms, isDarkMode }) => {
  const [reportType, setReportType] = useState('all');
  const [reportPeriod, setReportPeriod] = useState('custom');
  const [dateRange, setDateRange] = useState({
    startDate: format(startOfMonth(new Date()), 'yyyy-MM-dd'),
    endDate: format(endOfMonth(new Date()), 'yyyy-MM-dd')
  });
  const [timePeriod, setTimePeriod] = useState(0); // 0 means current (month/quarter/year)
  const [showFilters, setShowFilters] = useState(true); // Add state to toggle filter visibility

  // Handle report period change
  useEffect(() => {
    let startDate, endDate;
    const now = new Date();
    
    switch (reportPeriod) {
      case 'monthly':
        const monthDate = subMonths(now, timePeriod);
        startDate = startOfMonth(monthDate);
        endDate = endOfMonth(monthDate);
        break;
      case 'quarterly':
        const quarterDate = subQuarters(now, timePeriod);
        startDate = startOfQuarter(quarterDate);
        endDate = endOfQuarter(quarterDate);
        break;
      case 'yearly':
        const yearDate = subYears(now, timePeriod);
        startDate = startOfYear(yearDate);
        endDate = endOfYear(yearDate);
        break;
      default: // 'custom' - don't change the dates
        return;
    }
    
    setDateRange({
      startDate: format(startDate, 'yyyy-MM-dd'),
      endDate: format(endDate, 'yyyy-MM-dd')
    });
  }, [reportPeriod, timePeriod]);

  // Get the display text for the current time period
  const getPeriodDisplayText = () => {
    const now = new Date();
    let periodText = "";
    
    switch (reportPeriod) {
      case 'monthly':
        const monthDate = subMonths(now, timePeriod);
        periodText = format(monthDate, 'MMMM yyyy');
        break;
      case 'quarterly':
        const quarterDate = subQuarters(now, timePeriod);
        const quarterNum = Math.floor(quarterDate.getMonth() / 3) + 1;
        periodText = `Q${quarterNum} ${format(quarterDate, 'yyyy')}`;
        break;
      case 'yearly':
        const yearDate = subYears(now, timePeriod);
        periodText = format(yearDate, 'yyyy');
        break;
      default:
        periodText = "Custom Period";
    }
    
    return periodText;
  };

  // Handle time period navigation
  const handlePeriodChange = (direction) => {
    // direction: -1 for previous, 1 for next
    setTimePeriod(prev => {
      // Fix: For previous we should add 1 to period, for next subtract 1
      const newPeriod = prev + direction;
      // Don't allow future periods
      return newPeriod < 0 ? 0 : newPeriod;
    });
  };

  if (!isOpen) return null;

  // Filter incidents based on reportType and dateRange
  const filteredIncidents = incidents.filter(incident => {
    const incidentDate = new Date(incident.date);
    const startDate = new Date(dateRange.startDate);
    const endDate = new Date(dateRange.endDate);
    endDate.setHours(23, 59, 59, 999); // Set to end of day
    
    // Apply date range filter
    const meetsDateCriteria = incidentDate >= startDate && incidentDate <= endDate;
    
    // Apply report type filter
    if (reportType === 'all') {
      return meetsDateCriteria;
    } else if (reportType === 'resolved') {
      return meetsDateCriteria && incident.status === 'Resolved';
    }
    
    return meetsDateCriteria;
  });

  // Filter false alarms based on dateRange
  const filteredFalseAlarms = falseAlarms.filter(alarm => {
    const alarmDate = new Date(alarm.markedAt || alarm.date);
    const startDate = new Date(dateRange.startDate);
    const endDate = new Date(dateRange.endDate);
    endDate.setHours(23, 59, 59, 999); // Set to end of day
    
    const meetsDateCriteria = alarmDate >= startDate && alarmDate <= endDate;
    
    // Only include false alarms if report type is 'all' or 'falseAlarm'
    return meetsDateCriteria && (reportType === 'all' || reportType === 'falseAlarm');
  });

  return (
    <motion.div
      className={`fixed inset-0 z-[5000] flex items-center justify-center p-4 ${isDarkMode ? 'bg-gray-900' : 'bg-gray-100'} bg-opacity-90`}
      variants={backdropVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
    >
      <motion.div 
        className={`w-full max-w-6xl h-[90vh] flex flex-col rounded-xl overflow-hidden ${isDarkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-800'} shadow-2xl`}
        variants={modalVariants}
      >
        {/* Header with Back Button and Download Button */}
        <div className={`p-3 border-b ${isDarkMode ? 'border-gray-700 bg-gray-900' : 'border-gray-200 bg-gray-50'} flex justify-between items-center`}>
          <div className="flex items-center space-x-2">
            <button
              onClick={onClose}
              className={`p-2 rounded-full ${isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-200'}`}
            >
              <FaArrowLeft />
            </button>
            <h2 className="text-lg font-semibold">Incident Report Preview</h2>
          </div>
          
          <div className="flex items-center space-x-2">
            {/* Toggle Filters Button */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`p-2 rounded-md ${
                isDarkMode 
                  ? 'bg-gray-700 hover:bg-gray-600 text-gray-300' 
                  : 'bg-gray-200 hover:bg-gray-300 text-gray-600'
              }`}
            >
              <FaFilter className="inline mr-1" />
              {showFilters ? <FaChevronUp className="inline" /> : <FaChevronDown className="inline" />}
            </button>
            
            <motion.button
              variants={buttonVariants}
              whileHover="hover"
              whileTap="tap"
              onClick={onDownload}
              className={`px-4 py-2 rounded-md ${
                isDarkMode 
                  ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                  : 'bg-blue-500 hover:bg-blue-600 text-white'
              }`}
            >
              <FaDownload className="inline mr-2" />
              Download Report
            </motion.button>
          </div>
        </div>

        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Filters Section - Collapsible */}
          {showFilters && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className={`p-3 border-b ${isDarkMode ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-gray-50'}`}
            >
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {/* Report Type */}
                <div>
                  <label className={`block text-xs font-medium mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                    <FaFilter className="inline mr-1" /> Report Content
                  </label>
                  <select
                    name="reportType"
                    value={reportType}
                    onChange={(e) => setReportType(e.target.value)}
                    className={`w-full p-1.5 text-sm rounded-md ${
                      isDarkMode 
                        ? 'bg-gray-700 border-gray-600 text-white' 
                        : 'bg-white border-gray-300'
                    }`}
                  >
                    <option value="all">All Incidents (Resolved & False Alarms)</option>
                    <option value="resolved">Resolved Incidents Only</option>
                    <option value="falseAlarm">False Alarms Only</option>
                  </select>
                </div>
                
                {/* Report Period */}
                <div>
                  <label className={`block text-xs font-medium mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                    <FaChartBar className="inline mr-1" /> Report Period
                  </label>
                  <select
                    name="reportPeriod"
                    value={reportPeriod}
                    onChange={(e) => {
                      setReportPeriod(e.target.value);
                      setTimePeriod(0); // Reset to current period when changing period type
                    }}
                    className={`w-full p-1.5 text-sm rounded-md ${
                      isDarkMode 
                        ? 'bg-gray-700 border-gray-600 text-white' 
                        : 'bg-white border-gray-300'
                    }`}
                  >
                    <option value="custom">Custom Date Range</option>
                    <option value="monthly">Monthly</option>
                    <option value="quarterly">Quarterly</option>
                    <option value="yearly">Yearly</option>
                  </select>
                </div>
                
                {/* Period Navigation or Date Range */}
                <div>
                  {reportPeriod !== 'custom' ? (
                    // Period Navigation (when not custom)
                    <div className={`flex items-center h-full mt-4`}>
                      <button 
                        onClick={() => handlePeriodChange(1)} // Fix: Changed from -1 to 1 for previous
                        className={`px-2 py-1 text-sm rounded ${
                          isDarkMode 
                            ? 'bg-gray-600 hover:bg-gray-500 text-white' 
                            : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
                        }`}
                      >
                        Previous
                      </button>
                      
                      <div className="font-medium mx-2 text-center flex-1">
                        {getPeriodDisplayText()}
                      </div>
                      
                      <button 
                        onClick={() => handlePeriodChange(-1)} // Fix: Changed from 1 to -1 for next
                        className={`px-2 py-1 text-sm rounded ${
                          isDarkMode 
                            ? 'bg-gray-600 hover:bg-gray-500 text-white' 
                            : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
                        } ${timePeriod === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
                        disabled={timePeriod === 0}
                      >
                        Next
                      </button>
                    </div>
                  ) : (
                    // Custom Date Range
                    <div className="flex items-center space-x-2">
                      <div className="flex-1">
                        <label className={`block text-xs font-medium mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                          <FaCalendarAlt className="inline mr-1" /> Start
                        </label>
                        <input 
                          type="date" 
                          name="startDate"
                          value={dateRange.startDate}
                          onChange={(e) => setDateRange({...dateRange, startDate: e.target.value})}
                          className={`w-full p-1.5 text-sm rounded-md ${
                            isDarkMode 
                              ? 'bg-gray-700 border-gray-600 text-white' 
                              : 'bg-white border-gray-300'
                          }`}
                        />
                      </div>
                      
                      <div className="flex-1">
                        <label className={`block text-xs font-medium mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                          <FaCalendarAlt className="inline mr-1" /> End
                        </label>
                        <input 
                          type="date" 
                          name="endDate"
                          value={dateRange.endDate}
                          onChange={(e) => setDateRange({...dateRange, endDate: e.target.value})}
                          className={`w-full p-1.5 text-sm rounded-md ${
                            isDarkMode 
                              ? 'bg-gray-700 border-gray-600 text-white' 
                              : 'bg-white border-gray-300'
                          }`}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Summary of what will be included */}
              <div className={`mt-3 p-2 rounded-lg text-sm ${
                isDarkMode ? 'bg-blue-900 bg-opacity-30 text-blue-200' : 'bg-blue-50 text-blue-900'
              }`}>
                <div>
                  <strong>Report includes:</strong> {reportType === 'all' ? 'All incidents' : 
                    reportType === 'resolved' ? 'Only resolved incidents' : 'Only false alarms'} 
                  from {format(new Date(dateRange.startDate), 'MMM d, yyyy')} to {format(new Date(dateRange.endDate), 'MMM d, yyyy')}
                </div>
                <div className="text-xs opacity-80 mt-1">
                  {filteredIncidents.length} resolved incident(s) and {filteredFalseAlarms.length} false alarm(s) match these criteria
                </div>
              </div>
            </motion.div>
          )}

          {/* PDF Viewer - Fixed Height with Scrolling */}
          <div className="flex-1 overflow-auto relative">
            {/* Read-only message */}
            <div className="text-xs text-center py-1 bg-gray-800 bg-opacity-75 text-white absolute w-full z-10">
              This is a read-only preview. Use the download button above to save this report.
            </div>
            
            {/* PDF Viewer with fixed height */}
            <div className="h-full w-full">
              <PDFViewer 
                style={{ width: '100%', height: '100%' }}
                showToolbar={false}
              >
                <ResolvedIncidentReport 
                  incidents={filteredIncidents}
                  falseAlarms={filteredFalseAlarms}
                  generatedDate={new Date().toISOString()}
                  dateRange={dateRange}
                  reportPeriod={reportPeriod}
                  periodDisplay={getPeriodDisplayText()}
                  reportType={reportType}
                />
              </PDFViewer>
            </div>
            
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
    </motion.div>
  );
};

export default ResolvedIncidentReportPreview;

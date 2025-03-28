import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaVideo, FaTimes, FaCalendarAlt, FaClock, FaMapMarkerAlt, 
         FaExclamationTriangle, FaPlayCircle, FaPauseCircle, 
         FaVolumeUp, FaVolumeMute, FaExpand, FaArrowsAlt } from 'react-icons/fa';
import { useTheme } from '../../../../contexts/ThemeContext';
import { toast } from 'react-toastify';
import axios from 'axios';

// Animation variants
const modalVariants = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: { 
    opacity: 1, 
    scale: 1, 
    transition: { 
      type: "spring", 
      damping: 25, 
      stiffness: 300 
    }
  },
  exit: { opacity: 0, scale: 0.9, transition: { duration: 0.2 } }
};

const contentVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: i => ({ opacity: 1, y: 0, transition: { delay: i * 0.1, duration: 0.4 } }),
};

const buttonVariants = {
  hover: { scale: 1.05 },
  tap: { scale: 0.95 }
};

// Sample dummy CCTV footage URLs
const cctvFootageSources = [
  "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
  "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4",
  "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/SubaruOutbackOnStreetAndDirt.mp4"
];

const CctvReviewModal = ({ isOpen, onClose, incident, cctv }) => {
  const { isDarkMode } = useTheme();
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [videoTime, setVideoTime] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [selectedFootage, setSelectedFootage] = useState(cctvFootageSources[0]);
  const videoRef = React.useRef(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false); // Add this state

  // Format timestamp
  const formatTime = (time) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  // Calculate time window for the incident
  const getReviewTimeWindow = () => {
    if (!incident?.date || !incident?.time) return { date: 'Unknown', start: '00:00', end: '00:00' };
    
    try {
      // Format the date
      const formattedDate = new Date(incident.date).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
      
      // Parse time
      const timeParts = incident.time.split(':');
      const incidentHour = parseInt(timeParts[0]);
      const incidentMinute = parseInt(timeParts[1]);
      
      // Create date objects for start (15 minutes before) and end (15 minutes after)
      const baseDate = new Date();
      baseDate.setHours(incidentHour, incidentMinute, 0);
      
      const startTime = new Date(baseDate);
      startTime.setMinutes(baseDate.getMinutes() - 15);
      
      const endTime = new Date(baseDate);
      endTime.setMinutes(baseDate.getMinutes() + 15);
      
      // Format for display
      const formatTimeString = (date) => {
        return date.toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: true
        });
      };
      
      return {
        date: formattedDate,
        start: formatTimeString(startTime),
        end: formatTimeString(endTime)
      };
    } catch (error) {
      console.error('Error calculating time window:', error);
      return { date: 'Unknown', start: '00:00', end: '00:00' };
    }
  };

  const timeWindow = getReviewTimeWindow();

  // Play/pause video
  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  // Toggle mute
  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  // Handle timeline click
  const handleTimelineClick = (e) => {
    if (!videoRef.current || !duration) return;
    
    const timeline = e.currentTarget;
    const rect = timeline.getBoundingClientRect();
    const offsetX = e.clientX - rect.left;
    const percentage = offsetX / rect.width;
    
    // Set video time based on click position
    videoRef.current.currentTime = percentage * duration;
    setProgress(percentage * 100);
    setVideoTime(percentage * duration);
  };

  // Toggle fullscreen
  const toggleFullscreen = () => {
    if (!videoRef.current) return;
    
    if (!document.fullscreenElement) {
      videoRef.current.requestFullscreen().catch(err => {
        console.error(`Error attempting to enable fullscreen: ${err.message}`);
      });
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  // Update video progress
  const handleTimeUpdate = () => {
    if (videoRef.current) {
      const current = videoRef.current.currentTime;
      const videoDuration = videoRef.current.duration;
      
      if (videoDuration) {
        setProgress((current / videoDuration) * 100);
        setVideoTime(current);
      }
    }
  };

  // Set video duration when metadata is loaded
  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
    }
  };

  // Handle video end
  const handleVideoEnd = () => {
    setIsPlaying(false);
    setProgress(100);
  };

  // Switch between different dummy footage
  const switchFootage = (footageUrl) => {
    setSelectedFootage(footageUrl);
    setIsPlaying(false);
    setProgress(0);
    setVideoTime(0);
    // Reset video after a small delay to allow the source to update
    setTimeout(() => {
      if (videoRef.current) {
        videoRef.current.currentTime = 0;
      }
    }, 100);
  };

  // Handle fullscreen change event
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  // Auto-cleanup when modal closes
  useEffect(() => {
    if (!isOpen && videoRef.current) {
      videoRef.current.pause();
      setIsPlaying(false);
    }
  }, [isOpen]);

  // Handle marking incident as false alarm
  const handleMarkAsFalseAlarm = () => {
    // Instead of using toast, show our custom confirmation modal
    setShowConfirmModal(true);
  };
  
  // Add a new function to handle the actual false alarm marking
  const confirmMarkAsFalseAlarm = async () => {
    try {
      const token = localStorage.getItem('token');
      
      // First hide the confirmation modal to prevent UI conflicts
      setShowConfirmModal(false);
      
      // Then make the API call
      await axios.put(
        `${process.env.REACT_APP_API_URL}/incident-reports/${incident._id}/false-alarm`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      // Show success modal instead of toast
      setShowSuccessModal(true);
      
    } catch (error) {
      console.error('Error marking as false alarm:', error);
      toast.error('Failed to mark incident as false alarm');
    }
  };

  // Add cleanup on unmount
  useEffect(() => {
    return () => {
      // Clear any pending toasts when component unmounts
      toast.dismiss();
    };
  }, []);
  
  // Add a new confirmation modal component
  const ConfirmationModal = () => {
    if (!showConfirmModal) return null;
    
    return (
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-[60]"
        onClick={() => setShowConfirmModal(false)}
      >
        <motion.div 
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className={`max-w-sm w-full p-6 rounded-xl ${
            isDarkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-800'
          } shadow-2xl`}
          onClick={e => e.stopPropagation()}
        >
          <h3 className="text-xl font-semibold mb-4">Confirm False Alarm</h3>
          
          <p className="mb-4">Are you sure you want to mark this incident as a false alarm?</p>
          <p className="mb-6 text-sm opacity-80">This will remove the incident from active reports and move it to the false alarm archive.</p>
          
          <div className="flex justify-end space-x-3">
            <motion.button
              variants={buttonVariants}
              whileHover="hover"
              whileTap="tap"
              onClick={() => setShowConfirmModal(false)}
              className={`px-4 py-2 rounded-lg ${
                isDarkMode 
                ? 'bg-gray-700 hover:bg-gray-600 text-gray-300' 
                : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
              }`}
            >
              Cancel
            </motion.button>
            
            <motion.button
              variants={buttonVariants}
              whileHover="hover"
              whileTap="tap"
              onClick={confirmMarkAsFalseAlarm}
              className={`px-4 py-2 rounded-lg ${
                isDarkMode 
                ? 'bg-red-700 hover:bg-red-600 text-white' 
                : 'bg-red-500 hover:bg-red-600 text-white'
              }`}
            >
              Yes, Mark as False Alarm
            </motion.button>
          </div>
        </motion.div>
      </motion.div>
    );
  };

  // Add a new success modal component
  const SuccessModal = () => {
    if (!showSuccessModal) return null;
    
    return (
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-[60]"
        onClick={(e) => e.stopPropagation()}
      >
        <motion.div 
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className={`max-w-sm w-full p-6 rounded-xl ${
            isDarkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-800'
          } shadow-2xl`}
          onClick={e => e.stopPropagation()}
        >
          <div className="text-center">
            <div className={`mx-auto flex items-center justify-center h-16 w-16 rounded-full ${
              isDarkMode ? 'bg-green-900' : 'bg-green-100'
            } mb-4`}>
              <svg 
                className={`h-10 w-10 ${isDarkMode ? 'text-green-400' : 'text-green-600'}`} 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold mb-2">Success!</h3>
            <p className="mb-6">Incident has been marked as a false alarm and removed from active reports.</p>
            
            <motion.button
              variants={buttonVariants}
              whileHover="hover"
              whileTap="tap"
              onClick={() => {
                setShowSuccessModal(false);
                onClose(); // Close the parent modal after acknowledging success
              }}
              className={`px-6 py-2 rounded-lg ${
                isDarkMode 
                ? 'bg-green-700 hover:bg-green-600 text-white' 
                : 'bg-green-500 hover:bg-green-600 text-white'
              }`}
            >
              OK
            </motion.button>
          </div>
        </motion.div>
      </motion.div>
    );
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black bg-opacity-70 backdrop-blur-sm flex items-center justify-center z-50"
        onClick={onClose}
      >
        <motion.div 
          variants={modalVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          className={`w-11/12 max-w-3xl rounded-xl shadow-2xl overflow-hidden p-0 ${
            isDarkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-800'
          }`}
          onClick={e => e.stopPropagation()}
        >
          {/* Close button overlay - visible on all screens */}
          <motion.button
            className="absolute top-2 right-2 z-50 p-2 rounded-full bg-black bg-opacity-50 text-white hover:bg-opacity-70"
            onClick={onClose}
            variants={buttonVariants}
            whileHover="hover"
            whileTap="tap"
          >
            <FaTimes size={18} />
          </motion.button>
          
          {/* Header - Improve CCTV name display */}
          <div className={`px-6 py-4 flex justify-between items-center border-b ${
            isDarkMode ? 'bg-gray-900 border-gray-700' : 'bg-blue-50 border-blue-100'
          }`}>
            <h2 className="text-xl font-bold flex items-center">
              <FaVideo className={`mr-3 ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`} />
              CCTV Footage
            </h2>
            <div className={`px-3 py-1 rounded-full text-sm font-medium ${
              isDarkMode ? 'bg-green-900 text-green-100' : 'bg-green-100 text-green-800'
            }`}>
              {cctv?.name || 'Nearest CCTV Camera'}
            </div>
          </div>
          
          {/* Content */}
          <div className="p-4 space-y-4">
            {/* Incident Details */}
            <motion.div 
              variants={contentVariants}
              custom={0}
              initial="hidden"
              animate="visible"
              className={`p-3 rounded-lg text-sm ${
                isDarkMode ? 'bg-gray-700' : 'bg-gray-50'
              }`}
            >
              <h3 className="font-semibold mb-2 flex items-center text-base">
                <FaExclamationTriangle className={`mr-2 ${
                  incident?.incidentClassification === 'Emergency Incident'
                    ? isDarkMode ? 'text-red-400' : 'text-red-500'
                    : isDarkMode ? 'text-blue-400' : 'text-blue-500'
                }`} />
                {incident?.type || 'Unknown Incident'}
              </h3>
              
              <div className="flex flex-wrap gap-3 text-xs">
                <div className="flex items-start space-x-1">
                  <FaCalendarAlt className={`mt-0.5 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`} />
                  <span>{timeWindow.date}</span>
                </div>
                
                <div className="flex items-start space-x-1">
                  <FaClock className={`mt-0.5 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`} />
                  <span>{timeWindow.start} - {timeWindow.end}</span>
                </div>
                
                <div className="flex items-start space-x-1">
                  <FaMapMarkerAlt className={`mt-0.5 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`} />
                  <span className="truncate max-w-xs">
                    {incident?.address || incident?.location || 'Unknown Location'}
                  </span>
                </div>
              </div>

              {/* Add CCTV information */}
              <div className="mt-2 pt-2 border-t border-gray-600">
                <div className="flex items-start">
                  <FaVideo className={`mt-0.5 mr-2 ${isDarkMode ? 'text-green-400' : 'text-green-500'}`} />
                  <div>
                    <span className="font-medium">CCTV: {cctv?.name || 'Unknown'}</span>
                    {cctv?.description && (
                      <div className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                        {cctv.description}
                      </div>
                    )}
                    {cctv?.distance && (
                      <div className={`text-xs ${isDarkMode ? 'text-blue-300' : 'text-blue-600'}`}>
                        {cctv.distance.toFixed(0)} meters from incident
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
            
            {/* Video Player Section */}
            <motion.div
              variants={contentVariants}
              custom={1}
              initial="hidden"
              animate="visible"
              className="space-y-2"
            >
              {/* Camera selection */}
              <div className="flex flex-wrap gap-2 items-center">
                <span className={`text-xs ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>Camera Angle:</span>
                <div className="flex flex-wrap gap-1">
                  {cctvFootageSources.map((footage, index) => (
                    <motion.button
                      key={index}
                      variants={buttonVariants}
                      whileHover="hover"
                      whileTap="tap"
                      onClick={() => switchFootage(footage)}
                      className={`px-2 py-0.5 text-xs rounded-full ${
                        selectedFootage === footage
                          ? isDarkMode ? 'bg-blue-600 text-white' : 'bg-blue-500 text-white'
                          : isDarkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-700'
                      }`}
                    >
                      {['Front View', 'Side View', 'Street View'][index]}
                    </motion.button>
                  ))}
                </div>
              </div>
              
              {/* Video Player */}
              <div className={`rounded-lg overflow-hidden ${
                isDarkMode ? 'bg-black' : 'bg-gray-900'
              }`}>
                <div className="relative">
                  <video
                    ref={videoRef}
                    src={selectedFootage}
                    className="w-full h-auto"
                    style={{ maxHeight: "350px" }}
                    onTimeUpdate={handleTimeUpdate}
                    onLoadedMetadata={handleLoadedMetadata}
                    onEnded={handleVideoEnd}
                    muted={isMuted}
                    playsInline
                  />
                  
                  {/* Play/Pause overlay */}
                  {!isPlaying && (
                    <div 
                      className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-30 cursor-pointer"
                      onClick={togglePlay}
                    >
                      <FaPlayCircle size={50} className="text-white opacity-80 hover:opacity-100 transition" />
                    </div>
                  )}
                </div>
                
                {/* Video Controls */}
                <div className={`p-2 ${isDarkMode ? 'bg-gray-900' : 'bg-gray-800'}`}>
                  {/* Progress Bar */}
                  <div 
                    className="h-1.5 bg-gray-700 rounded-full cursor-pointer mb-2 relative"
                    onClick={handleTimelineClick}
                  >
                    <div 
                      className={`h-full rounded-full ${
                        isDarkMode ? 'bg-blue-500' : 'bg-blue-600'
                      }`}
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  
                  {/* Controls Bar */}
                  <div className="flex items-center justify-between text-white text-xs">
                    <div className="flex items-center space-x-2">
                      <motion.button
                        variants={buttonVariants}
                        whileHover="hover"
                        whileTap="tap"
                        onClick={togglePlay}
                        className="p-1 hover:text-blue-400"
                      >
                        {isPlaying ? <FaPauseCircle size={16} /> : <FaPlayCircle size={16} />}
                      </motion.button>
                      
                      <motion.button
                        variants={buttonVariants}
                        whileHover="hover"
                        whileTap="tap"
                        onClick={toggleMute}
                        className="p-1 hover:text-blue-400"
                      >
                        {isMuted ? <FaVolumeMute size={16} /> : <FaVolumeUp size={16} />}
                      </motion.button>
                      
                      <span>
                        {formatTime(videoTime)} / {formatTime(duration)}
                      </span>
                    </div>
                    
                    <motion.button
                      variants={buttonVariants}
                      whileHover="hover"
                      whileTap="tap"
                      onClick={toggleFullscreen}
                      className="p-1 hover:text-blue-400"
                    >
                      {isFullscreen ? <FaArrowsAlt size={14} /> : <FaExpand size={14} />}
                    </motion.button>
                  </div>
                </div>
              </div>
            </motion.div>
            
            {/* Notes Section */}
            <motion.div 
              variants={contentVariants}
              custom={2}
              initial="hidden"
              animate="visible"
              className={`p-3 rounded-lg text-xs ${
                isDarkMode ? 'bg-yellow-900 bg-opacity-20' : 'bg-yellow-50'
              }`}
            >
              <h3 className={`font-semibold mb-1 ${
                isDarkMode ? 'text-yellow-400' : 'text-yellow-700'
              }`}>Review Notes</h3>
              <p className={`${
                isDarkMode ? 'text-gray-300' : 'text-gray-600'
              }`}>
                The footage is showing the area near the incident location. Look for any suspicious activities or persons in this time frame.
              </p>
            </motion.div>
          </div>
          
          {/* Footer */}
          <div className={`px-4 py-3 border-t flex justify-end gap-2 ${
            isDarkMode ? 'bg-gray-900 border-gray-700' : 'bg-gray-50 border-gray-200'
          }`}>
            <motion.button
              variants={buttonVariants}
              whileHover="hover"
              whileTap="tap"
              onClick={onClose}
              className={`px-3 py-1.5 text-sm rounded-lg ${
                isDarkMode 
                ? 'bg-gray-700 hover:bg-gray-600 text-gray-300' 
                : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
              }`}
            >
              Close
            </motion.button>
            
            <motion.a
              variants={buttonVariants}
              whileHover="hover"
              whileTap="tap"
              href="#"
              download="cctv_footage.mp4"
              className={`px-3 py-1.5 text-sm rounded-lg ${
                isDarkMode 
                ? 'bg-blue-700 hover:bg-blue-600 text-white' 
                : 'bg-blue-500 hover:bg-blue-600 text-white'
              }`}
            >
              Download Footage
            </motion.a>

            <motion.button
              variants={buttonVariants}
              whileHover="hover"
              whileTap="tap"
              onClick={handleMarkAsFalseAlarm}
              className={`px-4 py-2 rounded-lg ${
                isDarkMode 
                ? 'bg-orange-700 hover:bg-orange-600 text-white' 
                : 'bg-orange-500 hover:bg-orange-600 text-white'
              }`}
            >
              Mark as False Alarm
            </motion.button>
          </div>
        </motion.div>
      </motion.div>
      
      {/* Render the confirmation modal */}
      <AnimatePresence>
        {showConfirmModal && <ConfirmationModal />}
      </AnimatePresence>

      {/* Render the success modal */}
      <AnimatePresence>
        {showSuccessModal && <SuccessModal />}
      </AnimatePresence>
    </AnimatePresence>
  );
};

export default CctvReviewModal;

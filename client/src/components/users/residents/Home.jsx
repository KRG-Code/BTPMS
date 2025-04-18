import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { FaBars, FaTimes, FaExclamationTriangle, FaClock, FaUserClock, FaCheckCircle, FaBuilding, FaNewspaper, FaCalendarAlt, FaUsers, FaHandshake, FaQuoteLeft, FaEnvelope, FaPhone, FaTicketAlt, FaMapMarkedAlt, FaInfoCircle, FaHistory } from "react-icons/fa";
import { useTheme } from "../../../contexts/ThemeContext";
import ReportIncidents from "./ReportIncident";
import EmergencyReportForm from "./EmergencyReportForm";
import TicketLookup from "./TicketLookup";
import ThemeToggle from "../../../components/forms/ThemeToggle";

const Home = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [showEmergencyForm, setShowEmergencyForm] = useState(false);
  const [showTicketLookup, setShowTicketLookup] = useState(false);
  const navigate = useNavigate();
  const { isDarkMode } = useTheme();


  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1, 
      transition: { 
        duration: 0.5,
        when: "beforeChildren",
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { 
      y: 0, 
      opacity: 1,
      transition: { duration: 0.5 }
    }
  };

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const handleReportClick = () => {
    setShowEmergencyForm(false);
    setShowReportModal(true);
  };

  const handleTicketLookupClick = () => {
    setShowTicketLookup(true);
  };

  const handleTanodClick = () => {
    navigate("/Tanodevaluation");
  };

  const handleReportClose = () => {
    setShowReportModal(false);
  };

  const handleEmergencyFormClose = () => {
    // Only close the emergency form if it's explicitly closed by the user
    // This will be called from EmergencyReportForm's Close button
    setShowEmergencyForm(false);
    
    // Always ensure the report modal is closed when emergency modal is handled
    setShowReportModal(false);
  };

  const handleTicketLookupClose = () => {
    setShowTicketLookup(false);
  };

  // Theme-aware colors - Fixed color values for better contrast
  const bgColor = isDarkMode ? "bg-gray-900" : "bg-gray-50";
  const textColor = isDarkMode ? "text-gray-100" : "text-gray-800";
  const sectionBgColor = isDarkMode ? "bg-gray-800" : "bg-white";
  const cardBgColor = isDarkMode ? "bg-gray-800" : "bg-white";
  const cardHoverBgColor = isDarkMode ? "hover:bg-gray-700" : "hover:bg-blue-50";
  const buttonBgColor = isDarkMode ? "bg-blue-600" : "bg-blue-500";
  const buttonHoverBgColor = isDarkMode ? "hover:bg-blue-700" : "hover:bg-blue-600";
  const navbarBgColor = isDarkMode ? "bg-gray-800 bg-opacity-90" : "bg-white bg-opacity-90";
  const navLinkHoverColor = isDarkMode ? "hover:bg-gray-700" : "hover:bg-gray-100";
  const borderColor = isDarkMode ? "border-gray-700" : "border-gray-200";
  
  return (
    <div className={`min-h-screen ${bgColor} ${textColor}`}>
      {/* Navigation */}
      <nav className={`fixed top-0 left-0 right-0 z-50 ${navbarBgColor} backdrop-blur-sm shadow-lg`}>
        <div className="container mx-auto px-4 py-3 flex justify-between items-center">
          <motion.div 
            className="flex items-center"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <img src="/icon.png" alt="Barangay Logo" className="h-10 w-10 mr-2" />
            <span className="text-xl font-bold">Barangay San Agustin</span>
          </motion.div>
          
          {/* Desktop Navigation Links */}
          <div className="hidden md:flex items-center space-x-6">
            {['About', 'Services', 'News', 'Location', 'Community', 'Programs', 'Contact'].map((item, index) => (
              <motion.a 
                key={item} 
                href={`#${item.toLowerCase()}`}
                className={`py-2 px-3 rounded-md font-medium transition-colors ${navLinkHoverColor}`}
                initial={{ opacity: 0, y: -10 }}
                animate={{ 
                  opacity: 1, 
                  y: 0,
                  transition: { delay: 0.1 + index * 0.05 }
                }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                {item}
              </motion.a>
            ))}
          </div>
          
          {/* Theme Toggle Button - Now on right side for both desktop and mobile */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center space-x-2"
          >
            <div className={`p-1 rounded-full ${isDarkMode ? 'bg-gray-700' : 'bg-gray-100'} flex items-center`}>
              <ThemeToggle />
            </div>
            
            {/* Mobile Menu Button - Only visible on mobile */}
            <motion.button
              className="md:hidden p-2 rounded-md text-gray-500 hover:text-blue-600 focus:outline-none"
              onClick={toggleMenu}
              whileTap={{ scale: 0.9 }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              {isMenuOpen ? <FaTimes size={24} /> : <FaBars size={24} />}
            </motion.button>
          </motion.div>
        </div>
        
        {/* Mobile Menu */}
        <AnimatePresence>
          {isMenuOpen && (
            <motion.div 
              className={`md:hidden ${sectionBgColor} shadow-lg overflow-hidden`}
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
            >
              <div className="container mx-auto px-4 py-4 space-y-2">
                {['About', 'Services', 'News', 'Location', 'Community', 'Programs', 'Contact'].map((item) => (
                  <a 
                    key={item} 
                    href={`#${item.toLowerCase()}`}
                    className={`block py-3 px-4 rounded-md ${navLinkHoverColor} font-medium transition-colors`}
                    onClick={() => setIsMenuOpen(false)}
                  >
                    {item}
                  </a>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      {/* Hero Section - Updated with Ticket Lookup */}
      <section className="relative pt-16 overflow-hidden">
        <div 
          className={`${
            isDarkMode 
              ? "bg-gradient-to-r from-blue-900 via-indigo-900 to-purple-900" 
              : "bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500"
          } h-[500px] w-full absolute top-0 left-0 -z-10 opacity-90`}
        ></div>
        <div className="absolute inset-0 -z-10 opacity-20">
          <svg className="h-full w-full" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M0 20 L40 20 M20 0 L20 40" stroke="currentColor" strokeWidth="0.5" fill="none" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
          </svg>
        </div>
        
        <div className="container mx-auto px-4 pt-24 pb-32 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="max-w-3xl mx-auto"
          >
            <h1 className={`text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight ${
              isDarkMode ? 'text-gray-100' : 'text-black'
            }`}>
              Welcome to Barangay San Agustin
            </h1>
            <p className={`text-lg md:text-xl mb-8 ${
              isDarkMode ? 'text-gray-200/90' : 'text-black'
            }`}>
              Serving the community of San Agustin, Quezon City since 1975
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <motion.button
                onClick={handleReportClick}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-6 py-3 bg-white text-blue-700 rounded-lg shadow-lg font-medium w-full sm:w-auto flex items-center justify-center"
              >
                <FaExclamationTriangle className="mr-2" /> Report an Incident
              </motion.button>
              
              <motion.button
                onClick={handleTicketLookupClick}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-6 py-3 bg-purple-700 text-white rounded-lg shadow-lg font-medium w-full sm:w-auto flex items-center justify-center"
              >
                <FaTicketAlt className="mr-2" /> Track Ticket Status
              </motion.button>
              
              <motion.button
                onClick={handleTanodClick}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-6 py-3 bg-blue-700 text-white rounded-lg shadow-lg font-medium w-full sm:w-auto flex items-center justify-center"
              >
                <FaUsers className="mr-2" /> View Tanod Personnel
              </motion.button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Main Content */}
      <motion.div 
        className="container mx-auto px-4 py-12"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* About Section */}
        <motion.section id="about" className="mb-20" variants={itemVariants}>
          <div className={`${sectionBgColor} rounded-2xl shadow-xl overflow-hidden border ${borderColor}`}>
            <div className="md:flex">
              <div className="md:w-1/2 p-8 md:p-12">
                <h2 className="text-3xl font-bold mb-6 flex items-center">
                  <FaInfoCircle className="mr-3 text-blue-500" /> About San Agustin
                </h2>
                <p className="mb-4">
                  Barangay San Agustin is located in District V of Quezon City with a land area of 103,482 hectares. Established on June 25, 1975 through Executive Order No. 26, our barangay has grown into a vibrant community.
                </p>
                <p>
                  With a population of over 22,000 residents and more than 4,700 households, San Agustin is committed to providing excellent public service and fostering a safe, progressive community for all residents.
                </p>
              </div>
              <div className="md:w-1/2 bg-blue-600 h-auto min-h-[300px] relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-indigo-700 flex items-center justify-center">
                  <img src="/icon.png" alt="Barangay Logo" className="h-32 w-32 opacity-20" />
                </div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-white text-center px-8">
                    <h3 className="text-2xl font-bold mb-4">Our Vision</h3>
                    <p className="text-white/90">
                      A progressive, peaceful, and well-governed barangay with empowered citizens contributing to sustainable community development.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.section>

        {/* Services Section */}
        <motion.section id="services" className="mb-20" variants={itemVariants}>
          <h2 className="text-3xl font-bold mb-8 text-center">Our Services</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                title: "Barangay Clearances",
                description: "Processing and issuance of various barangay clearances and certificates for residents.",
                icon: <FaBuilding className="h-8 w-8 text-blue-500" />
              },
              {
                title: "Incident Response",
                description: "Quick and efficient response to reported incidents within the barangay through our tanod personnel.",
                icon: <FaExclamationTriangle className="h-8 w-8 text-orange-500" />
              },
              {
                title: "Community Programs",
                description: "Various social welfare, health, and development programs for San Agustin residents.",
                icon: <FaUsers className="h-8 w-8 text-green-500" />
              }
            ].map((service, index) => (
              <motion.div
                key={index}
                className={`${cardBgColor} rounded-xl shadow-lg p-6 ${cardHoverBgColor} transition-all`}
                whileHover={{ y: -5, boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1)" }}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0, transition: { delay: 0.1 * index } }}
              >
                <div className="h-14 w-14 rounded-full bg-gray-100 flex items-center justify-center mb-4">
                  {service.icon}
                </div>
                <h3 className="text-xl font-bold mb-2">{service.title}</h3>
                <p className={isDarkMode ? "text-gray-300" : "text-gray-600"}>
                  {service.description}
                </p>
              </motion.div>
            ))}
          </div>
        </motion.section>

        {/* News & Events Section (Combined) */}
        <div className="flex flex-col lg:flex-row gap-8 mb-20">
          {/* News Section */}
          <motion.section id="news" className="lg:w-1/2" variants={itemVariants}>
            <div className={`${sectionBgColor} rounded-2xl shadow-lg p-8 h-full border ${borderColor}`}>
              <h2 className="text-3xl font-bold mb-6 flex items-center">
                <FaNewspaper className="mr-3 text-blue-500" /> Latest News
              </h2>
              <div className="space-y-6">
                {[
                  {
                    title: "Barangay Clean-up Drive",
                    date: "June 15, 2023",
                    summary: "Join us for our monthly community clean-up drive this weekend. Together we can keep San Agustin clean and green."
                  },
                  {
                    title: "Free Medical Mission",
                    date: "May 28, 2023",
                    summary: "The barangay will host a free medical consultation and medicine distribution for all residents next month."
                  }
                ].map((item, index) => (
                  <motion.div
                    key={index}
                    className={`p-4 border-l-4 border-blue-500 ${isDarkMode ? 'bg-gray-700' : 'bg-blue-50'} rounded-r-lg`}
                    whileHover={{ x: 5 }}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ 
                      opacity: 1, 
                      x: 0, 
                      transition: { delay: 0.1 * index } 
                    }}
                  >
                    <h3 className="text-lg font-semibold">{item.title}</h3>
                    <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'} mb-2`}>{item.date}</p>
                    <p>{item.summary}</p>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.section>

          {/* Events Section */}
          <motion.section id="events" className="lg:w-1/2" variants={itemVariants}>
            <div className={`${sectionBgColor} rounded-2xl shadow-lg p-8 h-full border ${borderColor}`}>
              <h2 className="text-3xl font-bold mb-6 flex items-center">
                <FaCalendarAlt className="mr-3 text-blue-500" /> Upcoming Events
              </h2>
              <div className="space-y-6">
                {[
                  {
                    title: "Barangay Assembly",
                    date: "July 10, 2023",
                    time: "9:00 AM - 12:00 PM",
                    location: "San Agustin Covered Court"
                  },
                  {
                    title: "Youth Leadership Workshop",
                    date: "July 15, 2023",
                    time: "2:00 PM - 4:00 PM",
                    location: "Barangay Hall"
                  }
                ].map((event, index) => (
                  <motion.div
                    key={index}
                    className={`p-4 rounded-lg ${isDarkMode ? 'bg-gray-700' : 'bg-blue-50'}`}
                    whileHover={{ y: -5 }}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ 
                      opacity: 1, 
                      y: 0, 
                      transition: { delay: 0.1 * index } 
                    }}
                  >
                    <div className="flex">
                      <div className={`h-14 w-14 rounded-lg ${isDarkMode ? 'bg-blue-900' : 'bg-blue-100'} flex flex-col items-center justify-center mr-4`}>
                        <span className={`text-sm ${isDarkMode ? 'text-blue-300' : 'text-blue-700'}`}>
                          {event.date.split(' ')[0]}
                        </span>
                        <span className={`text-xl font-bold ${isDarkMode ? 'text-blue-200' : 'text-blue-800'}`}>
                          {event.date.split(' ')[1].replace(',', '')}
                        </span>
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold">{event.title}</h3>
                        <p className={isDarkMode ? 'text-gray-300' : 'text-gray-600'}>
                          {event.time} • {event.location}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.section>
        </div>

        {/* Location/Map Section */}
        <motion.section id="location" className="mb-20" variants={itemVariants}>
          <div className={`${sectionBgColor} rounded-2xl shadow-xl overflow-hidden border ${borderColor}`}>
            <div className="md:flex">
              <div className="md:w-1/2 p-8 md:p-12">
                <h2 className="text-3xl font-bold mb-6 flex items-center">
                  <FaMapMarkedAlt className="mr-3 text-blue-500" /> Location & Boundaries
                </h2>
                <p className="mb-4">
                  Barangay San Agustin is strategically located in District V of Quezon City.
                </p>
                <div className="mb-6">
                  <h3 className="text-xl font-semibold mb-3">Our Boundaries:</h3>
                  <ul className="space-y-2">
                    <li><strong>North:</strong> Amaia</li>
                    <li><strong>North East:</strong> Greenfields-I</li>
                    <li><strong>North West:</strong> Interville-III Subdivision</li>
                    <li><strong>South:</strong> Millionaires Village</li>
                    <li><strong>South East:</strong> Pilares Drive</li>
                    <li><strong>South West:</strong> T.S. Cruz Subdivision</li>
                  </ul>
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-3">Areas within the Barangay:</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div>
                      <ul>
                        <li>Clemente Subdivision</li>
                        <li>Bagong Tuklas</li>
                        <li>St. Francis Village Subd.</li>
                        <li>Susano Road</li>
                        <li>T.S. Cruz Subd.</li>
                      </ul>
                    </div>
                    <div>
                      <ul>
                        <li>Millionaires Village</li>
                        <li>Part of Greenfields I</li>
                        <li>Greenfields-3</li>
                        <li>Blueville Subd.</li>
                        <li>De Jesus Compound</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
              <div className="md:w-1/2 bg-gray-200 h-auto min-h-[400px] relative">
                {/* This would be a map, but for now we'll use a placeholder */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center p-6">
                    <FaMapMarkedAlt className="text-5xl text-blue-500 mx-auto mb-4" />
                    <h3 className={`text-xl font-bold mb-2 ${isDarkMode ? 'text-gray-800' : 'text-gray-800'}`}>Barangay Hall Location</h3>
                    <p className={`mb-4 ${isDarkMode ? 'text-gray-700' : 'text-gray-700'}`}>Patnubay St. cor. Katarungan Ext. St. Francis Village, Subd.</p>
                    <p className={`text-sm ${isDarkMode ? 'text-gray-700' : 'text-gray-600'}`}>
                      <strong>Number of Streets:</strong> 350<br />
                      <strong>Number of Alleys:</strong> 55
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.section>

        {/* Community & Programs Section (Combined) */}
        <div className="flex flex-col lg:flex-row gap-8 mb-20">
          {/* Community Section */}
          <motion.section id="community" className="lg:w-1/2" variants={itemVariants}>
            <div className={`${sectionBgColor} rounded-2xl shadow-lg p-8 h-full border ${borderColor}`}>
              <h2 className="text-3xl font-bold mb-6 flex items-center">
                <FaUsers className="mr-3 text-blue-500" /> Our Community
              </h2>
              <p className="mb-6">
                Barangay San Agustin is home to a diverse and vibrant community of over 22,000 residents across more than 4,700 households.
              </p>
              <div className={`p-6 rounded-xl ${isDarkMode ? 'bg-gray-700' : 'bg-blue-50'} mb-6`}>
                <h3 className="text-xl font-semibold mb-3">Barangay Statistics</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span>Total Population:</span>
                    <span className="font-medium">22,284 (as of 2007)</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Total Households:</span>
                    <span className="font-medium">4,792</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Registered Voters:</span>
                    <span className="font-medium">11,082 (as of 2010)</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Voting Centers:</span>
                    <span className="font-medium">San Agustin Elementary School</span>
                  </div>
                </div>
              </div>
              <motion.button 
                className={`${buttonBgColor} ${buttonHoverBgColor} text-white px-6 py-3 rounded-lg shadow-md font-medium w-full`}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                Join Community Programs
              </motion.button>
            </div>
          </motion.section>

          {/* Programs Section */}
          <motion.section id="programs" className="lg:w-1/2" variants={itemVariants}>
            <div className={`${sectionBgColor} rounded-2xl shadow-lg p-8 h-full border ${borderColor}`}>
              <h2 className="text-3xl font-bold mb-6 flex items-center">
                <FaHandshake className="mr-3 text-blue-500" /> Programs
              </h2>
              <div className="space-y-6">
                {[
                  {
                    title: "Youth Development Program",
                    description: "Educational and recreational activities for the young residents of San Agustin.",
                    status: "Ongoing"
                  },
                  {
                    title: "Senior Citizen Welfare",
                    description: "Healthcare and social support for our elderly community members.",
                    status: "Active"
                  },
                  {
                    title: "Community Health Initiative",
                    description: "Free medical consultations and medicines for barangay residents.",
                    status: "Recruiting"
                  }
                ].map((program, index) => (
                  <motion.div
                    key={index}
                    className={`p-4 rounded-lg border ${
                      isDarkMode ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-white'
                    }`}
                    whileHover={{ y: -3 }}
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ 
                      opacity: 1, 
                      x: 0, 
                      transition: { delay: 0.1 * index } 
                    }}
                  >
                    <div className="flex justify-between items-start">
                      <h3 className="text-lg font-semibold">{program.title}</h3>
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        program.status === "Ongoing" 
                          ? isDarkMode ? "bg-green-900 text-green-200" : "bg-green-100 text-green-800"
                          : program.status === "Active" 
                            ? isDarkMode ? "bg-blue-900 text-blue-200" : "bg-blue-100 text-blue-800"
                            : isDarkMode ? "bg-yellow-900 text-yellow-200" : "bg-yellow-100 text-yellow-800"
                      }`}>
                        {program.status}
                      </span>
                    </div>
                    <p className={`mt-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                      {program.description}
                    </p>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.section>
        </div>

        {/* History Section */}
        <motion.section className="mb-20" variants={itemVariants}>
          <div className={`${sectionBgColor} rounded-2xl shadow-xl overflow-hidden border ${borderColor}`}>
            <div className="md:flex">
              <div className="md:w-1/2 p-8 md:p-12">
                <h2 className="text-3xl font-bold mb-6 flex items-center">
                  <FaHistory className="mr-3 text-purple-500" /> Our History
                </h2>
                <p className="mb-4">
                  Barangay San Agustin was established on June 25, 1975 through Executive Order No. 26, and has since evolved into one of the most progressive barangays in Quezon City.
                </p>
                <p className="mb-6">
                  Over the decades, our barangay has grown both in population and development, while maintaining our commitment to serving our community with integrity and dedication.
                </p>
                <div className={`p-4 rounded-lg ${isDarkMode ? 'bg-gray-700' : 'bg-blue-50'}`}>
                  <h3 className="text-lg font-semibold mb-2">Key Milestones:</h3>
                  <ul className="space-y-2 list-disc pl-5">
                    <li>Established on June 25, 1975 (Executive Order No. 26)</li>
                    <li>First Barangay Hall constructed in 1980</li>
                    <li>Community development programs initiated in 1990</li>
                    <li>Modern Barangay Hall completed in 2010</li>
                  </ul>
                </div>
              </div>
              <div className="md:w-1/2 bg-gradient-to-br from-purple-500 to-indigo-700 h-auto min-h-[300px] relative overflow-hidden">
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-white text-center px-8">
                    <h3 className="text-2xl font-bold mb-4">Serving Our Community Since 1975</h3>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between bg-white/10 backdrop-blur-sm rounded-lg p-3">
                        <span className="font-medium">Land Area</span>
                        <span>103,482 hectares</span>
                      </div>
                      <div className="flex items-center justify-between bg-white/10 backdrop-blur-sm rounded-lg p-3">
                        <span className="font-medium">Original Population</span>
                        <span>~5,000 residents</span>
                      </div>
                      <div className="flex items-center justify-between bg-white/10 backdrop-blur-sm rounded-lg p-3">
                        <span className="font-medium">Current Population</span>
                        <span>22,284+ residents</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.section>

        {/* Testimonials Section */}
        <motion.section id="testimonials" className="mb-20" variants={itemVariants}>
          <h2 className="text-3xl font-bold mb-8 text-center">Resident Testimonials</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                quote: "The barangay officials have been very responsive to our community's needs. Their programs really help improve our quality of life.",
                author: "Maria Santos",
                position: "Resident for 15 years"
              },
              {
                quote: "I reported an incident and was impressed by how quickly the barangay tanod personnel responded. Great service!",
                author: "Jose Reyes",
                position: "Small Business Owner"
              },
              {
                quote: "The healthcare initiatives conducted by the barangay have been very beneficial, especially for senior citizens like me.",
                author: "Elena Dizon",
                position: "Senior Citizen"
              }
            ].map((testimonial, index) => (
              <motion.div
                key={index}
                className={`${cardBgColor} rounded-xl shadow-lg p-6 relative`}
                whileHover={{ y: -5 }}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ 
                  opacity: 1, 
                  scale: 1,
                  transition: { delay: 0.1 * index } 
                }}
              >
                <FaQuoteLeft className={`text-3xl mb-4 ${isDarkMode ? 'text-blue-400' : 'text-blue-300'}`} />
                <p className="mb-6 italic">{testimonial.quote}</p>
                <div className="mt-4 flex items-center">
                  <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold">
                    {testimonial.author.charAt(0)}
                  </div>
                  <div className="ml-3">
                    <p className="font-semibold">{testimonial.author}</p>
                    <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>{testimonial.position}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.section>

        {/* Contact Section */}
        <motion.section id="contact" className="mb-10" variants={itemVariants}>
          <div className={`${sectionBgColor} rounded-2xl shadow-lg overflow-hidden border ${borderColor}`}>
            <div className="flex flex-col md:flex-row">
              <div className="md:w-1/2 p-8 md:p-12">
                <h2 className="text-3xl font-bold mb-6">Contact Us</h2>
                <p className="mb-6">Have questions or need assistance? Reach out to the Barangay San Agustin office through any of these channels:</p>
                
                <div className="space-y-4">
                  <div className="flex items-center">
                    <div className={`h-10 w-10 rounded-full ${isDarkMode ? 'bg-gray-700' : 'bg-blue-100'} flex items-center justify-center mr-3`}>
                      <FaEnvelope className={isDarkMode ? 'text-blue-400' : 'text-blue-600'} />
                    </div>
                    <div>
                      <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Email</p>
                      <p className="font-medium">brgysanagustin13@gmail.com</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center">
                    <div className={`h-10 w-10 rounded-full ${isDarkMode ? 'bg-gray-700' : 'bg-blue-100'} flex items-center justify-center mr-3`}>
                      <FaPhone className={isDarkMode ? 'text-blue-400' : 'text-blue-600'} />
                    </div>
                    <div>
                      <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Phone</p>
                      <p className="font-medium">289361295</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center">
                    <div className={`h-10 w-10 rounded-full ${isDarkMode ? 'bg-gray-700' : 'bg-blue-100'} flex items-center justify-center mr-3`}>
                      <FaBuilding className={isDarkMode ? 'text-blue-400' : 'text-blue-600'} />
                    </div>
                    <div>
                      <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Office Address</p>
                      <p className="font-medium">Patnubay St. cor. Katarungan Ext. St. Francis Village, Subd.</p>
                    </div>
                  </div>
                </div>
                
                <div className="mt-8">
                  <motion.button 
                    className={`${buttonBgColor} ${buttonHoverBgColor} text-white px-6 py-3 rounded-lg shadow-md font-medium inline-flex items-center`}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleReportClick}
                  >
                    <FaExclamationTriangle className="mr-2" />
                    Report an Incident
                  </motion.button>
                </div>
              </div>
              
              <div className="md:w-1/2 bg-gradient-to-br from-blue-500 to-indigo-600 p-8 md:p-12 text-white">
                <h3 className="text-2xl font-bold mb-4">Emergency Contacts</h3>
                <p className="mb-6">For urgent matters requiring immediate attention:</p>
                
                <div className="space-y-6">
                  <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
                    <h4 className="font-bold text-lg mb-1">Barangay Emergency Hotline</h4>
                    <p className="text-xl font-bold">289361295</p>
                    <p className="text-sm text-white/80 mt-1">Available 24/7</p>
                  </div>
                  
                  <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
                    <h4 className="font-bold text-lg mb-1">Facebook Page</h4>
                    <a 
                      href="https://www.facebook.com/profile.php?id=100078837556845" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-xl font-bold hover:underline"
                    >
                      Barangay San Agustin
                    </a>
                    <p className="text-sm text-white/80 mt-1">Follow us for updates</p>
                  </div>
                  
                  <motion.button 
                    className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg shadow-md font-medium w-full flex items-center justify-center"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setShowEmergencyForm(true)}
                  >
                    <FaExclamationTriangle className="mr-2" />
                    Report Emergency
                  </motion.button>
                </div>
              </div>
            </div>
          </div>
        </motion.section>
      </motion.div>

      {/* Footer with improved contrast */}
      <footer className={`${isDarkMode ? 'bg-gray-800 border-t border-gray-700' : 'bg-gray-100 border-t border-gray-200'} py-8`}>
        <div className="container mx-auto px-4 text-center">
          <div className="flex items-center justify-center mb-4">
            <img src="/icon.png" alt="Barangay Logo" className="h-8 w-8 mr-2" />
            <span className="text-xl font-bold">Barangay San Agustin</span>
          </div>
          <p className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'} mb-4`}>
            Patnubay St. cor. Katarungan Ext. St. Francis Village, Subd.
          </p>
          <p className={`text-sm ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}>
            © {new Date().getFullYear()} Barangay San Agustin, Quezon City. All Rights Reserved
          </p>
        </div>
      </footer>

      {/* Modals */}
      <AnimatePresence>
        {showReportModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="w-full max-w-xl"
            >
              <ReportIncidents 
                onClose={handleReportClose} 
                setShowEmergencyForm={setShowEmergencyForm}
                setShowReportModal={setShowReportModal}
              />
            </motion.div>
          </motion.div>
        )}

        {showEmergencyForm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          >
            <EmergencyReportForm 
              onClose={handleEmergencyFormClose} 
              // Pass additional props to help with state management
              setShowEmergencyForm={setShowEmergencyForm}
            />
          </motion.div>
        )}
        
        {showTicketLookup && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="w-full max-w-xl"
            >
              <TicketLookup onClose={handleTicketLookupClose} />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Home;
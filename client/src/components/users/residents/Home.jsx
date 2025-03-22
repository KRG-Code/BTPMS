import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { FaBars, FaTimes, FaShieldAlt, FaExclamationTriangle, FaBuilding, FaNewspaper, FaCalendarAlt, FaUsers, FaHandshake, FaQuoteLeft, FaEnvelope, FaPhone } from "react-icons/fa";
import { useTheme } from "../../../contexts/ThemeContext";
import ReportIncidents from "./ReportIncident";
import EmergencyReportForm from "./EmergencyReportForm";

const Home = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [showEmergencyForm, setShowEmergencyForm] = useState(false);
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
    setShowReportModal(true);
  };

  const handleTanodClick = () => {
    navigate("/Tanodevaluation");
  };

  const handleReportClose = () => {
    setShowReportModal(false);
  };

  const handleEmergencyFormClose = () => {
    setShowEmergencyForm(false);
  };

  // Theme-aware colors
  const bgColor = isDarkMode ? "bg-gray-900" : "bg-gray-50";
  const textColor = isDarkMode ? "text-gray-100" : "text-gray-800";
  const sectionBgColor = isDarkMode ? "bg-gray-800" : "bg-white";
  const cardBgColor = isDarkMode ? "bg-gray-800" : "bg-white";
  const cardHoverBgColor = isDarkMode ? "hover:bg-gray-700" : "hover:bg-blue-50";
  const buttonBgColor = isDarkMode ? "bg-blue-600" : "bg-blue-500";
  const buttonHoverBgColor = isDarkMode ? "hover:bg-blue-700" : "hover:bg-blue-600";
  const navbarBgColor = isDarkMode ? "bg-gray-800 bg-opacity-90" : "bg-white bg-opacity-90";
  const navLinkHoverColor = isDarkMode ? "hover:bg-gray-700" : "hover:bg-gray-100";
  
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
            <FaShieldAlt className="h-8 w-8 text-blue-600 mr-2" />
            <span className="text-xl font-bold">BTPMS</span>
          </motion.div>
          
          {/* Desktop Navigation Links */}
          <div className="hidden md:flex space-x-6">
            {['About', 'Services', 'News', 'Events', 'Community', 'Programs', 'Contact'].map((item, index) => (
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
          
          {/* Mobile Menu Button */}
          <motion.button
            className="md:hidden p-2 rounded-md text-gray-500 hover:text-blue-600 focus:outline-none"
            onClick={toggleMenu}
            whileTap={{ scale: 0.9 }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            {isMenuOpen ? <FaTimes size={24} /> : <FaBars size={24} />}
          </motion.button>
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
                {['About', 'Services', 'News', 'Events', 'Community', 'Programs', 'Contact'].map((item) => (
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

      {/* Hero Section */}
      <section className="relative pt-16 overflow-hidden">
        <div 
          className={`${
            isDarkMode 
              ? "bg-gradient-to-r from-blue-900 via-indigo-900 to-purple-900" 
              : "bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500"
          } h-[500px] w-full absolute top-0 left-0 -z-10 opacity-90`}
        ></div>
        <div className="absolute inset-0 -z-10 opacity-20">
          {/* Background pattern */}
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
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight">
              Welcome to the Barangay Tanod Patrol Management System
            </h1>
            <p className="text-lg md:text-xl text-white/90 mb-8">
              Ensuring community safety and responsive security services for all residents
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
                onClick={handleTanodClick}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-6 py-3 bg-blue-700 text-white rounded-lg shadow-lg font-medium w-full sm:w-auto flex items-center justify-center"
              >
                <FaShieldAlt className="mr-2" /> View Tanod Personnel
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
          <div className={`${sectionBgColor} rounded-2xl shadow-xl overflow-hidden`}>
            <div className="md:flex">
              <div className="md:w-1/2 p-8 md:p-12">
                <h2 className="text-3xl font-bold mb-6 flex items-center">
                  <FaBuilding className="mr-3 text-blue-500" /> About Our LGU
                </h2>
                <p className="mb-4">
                  The Barangay is committed to ensuring the safety and security of all residents through our dedicated Tanod patrol system. Our local government unit works tirelessly to maintain peace and order in our community.
                </p>
                <p>
                  With our newly implemented Patrol Management System, we aim to enhance the efficiency and effectiveness of our security personnel, ensuring rapid response to incidents and maintaining visibility in all areas of our barangay.
                </p>
              </div>
              <div className="md:w-1/2 bg-blue-600 h-auto min-h-[300px] relative overflow-hidden">
                {/* Replace with your actual image */}
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-indigo-700 flex items-center justify-center">
                  <FaShieldAlt className="text-white h-32 w-32 opacity-20" />
                </div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-white text-center px-8">
                    <h3 className="text-2xl font-bold mb-4">Our Mission</h3>
                    <p className="text-white/90">
                      To provide a safe, secure, and peaceful environment for all residents through proactive community engagement and responsive security measures.
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
                title: "24/7 Patrol",
                description: "Round-the-clock security patrols to ensure community safety at all times.",
                icon: <FaShieldAlt className="h-8 w-8 text-blue-500" />
              },
              {
                title: "Incident Response",
                description: "Quick and efficient response to reported incidents within the barangay.",
                icon: <FaExclamationTriangle className="h-8 w-8 text-orange-500" />
              },
              {
                title: "Community Watch",
                description: "Collaborative security initiatives involving residents and tanod personnel.",
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
            <div className={`${sectionBgColor} rounded-2xl shadow-lg p-8 h-full`}>
              <h2 className="text-3xl font-bold mb-6 flex items-center">
                <FaNewspaper className="mr-3 text-blue-500" /> Latest News
              </h2>
              <div className="space-y-6">
                {[
                  {
                    title: "New Patrol Management System Launched",
                    date: "June 15, 2024",
                    summary: "The barangay has successfully implemented the new Tanod Patrol Management System to enhance security operations."
                  },
                  {
                    title: "Safety Training for Tanod Personnel",
                    date: "May 28, 2024",
                    summary: "All tanod personnel completed comprehensive safety and emergency response training last month."
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
            <div className={`${sectionBgColor} rounded-2xl shadow-lg p-8 h-full`}>
              <h2 className="text-3xl font-bold mb-6 flex items-center">
                <FaCalendarAlt className="mr-3 text-blue-500" /> Upcoming Events
              </h2>
              <div className="space-y-6">
                {[
                  {
                    title: "Community Safety Workshop",
                    date: "July 10, 2024",
                    time: "9:00 AM - 12:00 PM",
                    location: "Barangay Hall"
                  },
                  {
                    title: "Barangay Emergency Drill",
                    date: "July 15, 2024",
                    time: "2:00 PM - 4:00 PM",
                    location: "Community Plaza"
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

        {/* Community & Programs Section (Combined) */}
        <div className="flex flex-col lg:flex-row gap-8 mb-20">
          {/* Community Section */}
          <motion.section id="community" className="lg:w-1/2" variants={itemVariants}>
            <div className={`${sectionBgColor} rounded-2xl shadow-lg p-8 h-full`}>
              <h2 className="text-3xl font-bold mb-6 flex items-center">
                <FaUsers className="mr-3 text-blue-500" /> Our Community
              </h2>
              <p className="mb-6">
                Our barangay is home to a diverse and vibrant community. We believe in the power of community participation in ensuring the safety and wellbeing of all residents.
              </p>
              <div className={`p-6 rounded-xl ${isDarkMode ? 'bg-gray-700' : 'bg-blue-50'} mb-6`}>
                <h3 className="text-xl font-semibold mb-3">Community Statistics</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span>Total Population:</span>
                    <span className="font-medium">4,526</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Households:</span>
                    <span className="font-medium">978</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Average Safety Rating:</span>
                    <span className="font-medium">4.7/5.0</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Active Tanod Personnel:</span>
                    <span className="font-medium">24</span>
                  </div>
                </div>
              </div>
              <motion.button 
                className={`${buttonBgColor} ${buttonHoverBgColor} text-white px-6 py-3 rounded-lg shadow-md font-medium w-full`}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                Join Community Watch Program
              </motion.button>
            </div>
          </motion.section>

          {/* Programs Section */}
          <motion.section id="programs" className="lg:w-1/2" variants={itemVariants}>
            <div className={`${sectionBgColor} rounded-2xl shadow-lg p-8 h-full`}>
              <h2 className="text-3xl font-bold mb-6 flex items-center">
                <FaHandshake className="mr-3 text-blue-500" /> Programs
              </h2>
              <div className="space-y-6">
                {[
                  {
                    title: "Youth Safety Education",
                    description: "Educational program for young residents about community safety and emergency preparedness.",
                    status: "Ongoing"
                  },
                  {
                    title: "Senior Citizen Safety Network",
                    description: "Special security monitoring for senior citizens living alone in our community.",
                    status: "Active"
                  },
                  {
                    title: "Neighborhood Watch Coalition",
                    description: "Volunteer program where residents help monitor their immediate neighborhood.",
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

        {/* Testimonials Section */}
        <motion.section id="testimonials" className="mb-20" variants={itemVariants}>
          <h2 className="text-3xl font-bold mb-8 text-center">Resident Testimonials</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                quote: "The new patrol system has significantly improved our community's security. I feel much safer now.",
                author: "Maria Santos",
                position: "Resident for 15 years"
              },
              {
                quote: "I reported an incident and was impressed by how quickly the tanod personnel responded. Great service!",
                author: "Jose Reyes",
                position: "Small Business Owner"
              },
              {
                quote: "The safety workshops conducted by the tanod team have been very informative and helpful for our family.",
                author: "Elena Dizon",
                position: "Parent & Community Volunteer"
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
          <div className={`${sectionBgColor} rounded-2xl shadow-lg overflow-hidden`}>
            <div className="flex flex-col md:flex-row">
              <div className="md:w-1/2 p-8 md:p-12">
                <h2 className="text-3xl font-bold mb-6">Contact Us</h2>
                <p className="mb-6">Have questions or need assistance? Reach out to our barangay office through any of these channels:</p>
                
                <div className="space-y-4">
                  <div className="flex items-center">
                    <div className={`h-10 w-10 rounded-full ${isDarkMode ? 'bg-gray-700' : 'bg-blue-100'} flex items-center justify-center mr-3`}>
                      <FaEnvelope className={isDarkMode ? 'text-blue-400' : 'text-blue-600'} />
                    </div>
                    <div>
                      <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Email</p>
                      <p className="font-medium">barangay@lgu1.com</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center">
                    <div className={`h-10 w-10 rounded-full ${isDarkMode ? 'bg-gray-700' : 'bg-blue-100'} flex items-center justify-center mr-3`}>
                      <FaPhone className={isDarkMode ? 'text-blue-400' : 'text-blue-600'} />
                    </div>
                    <div>
                      <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Phone</p>
                      <p className="font-medium">(123) 456-7890</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center">
                    <div className={`h-10 w-10 rounded-full ${isDarkMode ? 'bg-gray-700' : 'bg-blue-100'} flex items-center justify-center mr-3`}>
                      <FaBuilding className={isDarkMode ? 'text-blue-400' : 'text-blue-600'} />
                    </div>
                    <div>
                      <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Office Address</p>
                      <p className="font-medium">123 Barangay St., City, Philippines</p>
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
                    <p className="text-xl font-bold">911</p>
                    <p className="text-sm text-white/80 mt-1">Available 24/7</p>
                  </div>
                  
                  <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
                    <h4 className="font-bold text-lg mb-1">Tanod Command Center</h4>
                    <p className="text-xl font-bold">(123) 555-7890</p>
                    <p className="text-sm text-white/80 mt-1">24-hour patrol dispatch</p>
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

      {/* Footer */}
      <footer className={`${isDarkMode ? 'bg-gray-800' : 'bg-gray-100'} py-8`}>
        <div className="container mx-auto px-4 text-center">
          <div className="flex items-center justify-center mb-4">
            <FaShieldAlt className="h-6 w-6 text-blue-600 mr-2" />
            <span className="text-xl font-bold">BTPMS</span>
          </div>
          <p className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'} mb-4`}>
            Barangay Tanod Patrol Management System
          </p>
          <p className={`text-sm ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}>
            © {new Date().getFullYear()} All Rights Reserved
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
            <EmergencyReportForm onClose={handleEmergencyFormClose} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Home;
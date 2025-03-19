import React, { useState } from "react";
import { FaBars, FaTimes, FaExclamationTriangle, FaShieldAlt } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import ReportIncidents from "./ReportIncident";
import EmergencyReportForm from "./EmergencyReportForm"; // Add this import

const Home = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [showEmergencyForm, setShowEmergencyForm] = useState(false);
  const navigate = useNavigate();

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const handleReportClick = () => {
    setShowReportModal(true);
  };

  const handleTanodClick = () => {
    navigate('/Tanodevaluation');
  };

  const handleReportClose = () => {
    setShowReportModal(false);
    setShowEmergencyForm(false);
  };

  return (
    <div className="bg-gradient-to-r from-green-400 via-blue-500 to-indigo-600 min-h-screen text-white overflow-x-hidden">
      {/* Header - Remove buttons from here */}
      <header className="fixed w-full bg-black bg-opacity-70 backdrop-blur-md flex justify-between items-center p-6 z-50">
        <div className="text-2xl font-bold tracking-wider text-yellow-300">LGU</div>
        
        {/* Mobile Menu Button */}
        <button className="md:hidden text-white" onClick={toggleMenu}>
          {isMenuOpen ? <FaTimes size={24} /> : <FaBars size={24} />}
        </button>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex space-x-6 text-lg">
          {["About", "Services", "News", "Events", "Community", "Programs", "Testimonials", "Contact"].map((item) => (
            <a
              key={item}
              href={`#${item.toLowerCase()}`}
              className="hover:text-yellow-300 transition-all duration-300 transform hover:scale-110"
            >
              {item}
            </a>
          ))}
        </nav>

        {/* Mobile Navigation */}
        <nav className={`md:hidden fixed inset-0 bg-black bg-opacity-95 ${isMenuOpen ? 'flex' : 'hidden'} flex-col items-center justify-center space-y-8 text-xl animate__animated ${isMenuOpen ? 'animate__fadeIn' : 'animate__fadeOut'}`}>
          {["About", "Services", "News", "Events", "Community", "Programs", "Testimonials", "Contact"].map((item) => (
            <a
              key={item}
              href={`#${item.toLowerCase()}`}
              className="hover:text-yellow-300 transition-all duration-300 transform hover:scale-110"
              onClick={() => setIsMenuOpen(false)}
            >
              {item}
            </a>
          ))}
        </nav>
      </header>

      {/* Hero Section - Updated with new button placement */}
      <section className="h-screen flex justify-center items-center text-center bg-cover bg-center bg-no-repeat relative animate__animated animate__fadeIn animate__delay-1s" 
        style={{ backgroundImage: 'url("https://source.unsplash.com/random/landscape")' }}>
        <div className="bg-black bg-opacity-50 p-8 rounded-lg shadow-lg animate__animated animate__fadeIn animate__delay-1s max-w-4xl w-full mx-4">
          <h1 className="text-5xl font-extrabold tracking-wider mb-4 text-yellow-300">Welcome to Your Local Government</h1>
          <p className="text-lg mb-8 text-yellow-100">Empowering Communities. Building Futures.</p>
          
          {/* Action Buttons Container */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl mx-auto mb-8">
            {/* Emergency Report Button */}
            <button
              onClick={handleReportClick}
              className="bg-red-500 hover:bg-red-600 text-white px-6 py-4 rounded-lg flex items-center justify-center gap-3 transition-all duration-300 transform hover:scale-105 group"
            >
              <FaExclamationTriangle className="text-2xl group-hover:animate-pulse" />
              <div className="text-left">
                <div className="font-bold text-lg">Report Incident</div>
                <div className="text-sm opacity-90">Submit emergency or incident reports</div>
              </div>
            </button>

            {/* Tanod Personnel Button */}
            <button
              onClick={handleTanodClick}
              className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-4 rounded-lg flex items-center justify-center gap-3 transition-all duration-300 transform hover:scale-105 group"
            >
              <FaShieldAlt className="text-2xl group-hover:animate-bounce" />
              <div className="text-left">
                <div className="font-bold text-lg">Tanod Personnel</div>
                <div className="text-sm opacity-90">View our community safety officers</div>
              </div>
            </button>
          </div>

          {/* Learn More Button */}
          <a href="#about" className="bg-yellow-500 text-black px-8 py-3 rounded-full text-xl font-semibold hover:bg-yellow-400 transition duration-300 transform hover:scale-110 inline-block">
            Learn More
          </a>
        </div>
      </section>

      {/* Vision and Mission Section */}
      <section id="about" className="py-20 bg-white text-black animate__animated animate__fadeIn animate__delay-2s">
        <div className="container mx-auto text-center">
          <h2 className="text-4xl font-bold mb-8 text-indigo-600">Our Vision & Mission</h2>
          <p className="text-lg px-4 md:px-0 max-w-2xl mx-auto mb-8">
            <strong>Vision:</strong> To become a progressive and sustainable community that thrives on inclusivity, innovation, and environmental responsibility.
          </p>
          <p className="text-lg px-4 md:px-0 max-w-2xl mx-auto">
            <strong>Mission:</strong> To deliver efficient and accessible public services, support social welfare, and foster a conducive environment for the welfare of all residents.
          </p>
        </div>
      </section>

      {/* Services Section - Enhanced */}
      <section id="services" className="py-20 bg-gray-800 text-white">
        <div className="container mx-auto px-4">
          <h2 className="text-4xl font-bold mb-12 text-center text-yellow-500 animate__animated animate__fadeIn">Our Services</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                title: 'Public Health',
                description: 'Comprehensive healthcare services including vaccination, medical consultations, and health education programs.',
                icon: '🏥'
              },
              {
                title: 'Education',
                description: 'Quality education initiatives, scholarship programs, and educational support for all learners.',
                icon: '📚'
              },
              {
                title: 'Infrastructure',
                description: 'Development and maintenance of roads, bridges, and public facilities for better community access.',
                icon: '🏗️'
              },
              {
                title: 'Community Services',
                description: 'Social welfare programs, community development initiatives, and support services for residents.',
                icon: '🤝'
              },
              {
                title: 'Public Safety',
                description: 'Emergency response, disaster preparedness, and community security measures.',
                icon: '🚔'
              },
              {
                title: 'Local Economy',
                description: 'Business development support, job creation programs, and economic growth initiatives.',
                icon: '💼'
              }
            ].map((service, index) => (
              <div
                key={index}
                className="bg-gray-900 p-8 rounded-xl shadow-lg transform hover:scale-105 hover:shadow-2xl transition-all duration-300 animate__animated animate__fadeIn"
                style={{ animationDelay: `${index * 0.2}s` }}
              >
                <div className="text-4xl mb-4">{service.icon}</div>
                <h3 className="text-2xl font-semibold mb-4 text-yellow-400">{service.title}</h3>
                <p className="text-gray-300">{service.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* News Section - Updated with actual images */}
      <section id="news" className="py-20 bg-white text-black">
        <div className="container mx-auto px-4">
          <h2 className="text-4xl font-bold mb-12 text-center text-indigo-600 animate__animated animate__fadeIn">Latest News & Updates</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                title: "New Healthcare Initiative Launched",
                date: "March 15, 2025",
                description: "A comprehensive healthcare program providing free medical services to senior citizens.",
                image: "https://images.unsplash.com/photo-1551076805-e1869033e561?ixlib=rb-4.0.3"
              },
              {
                title: "Upcoming Town Hall Meeting",
                date: "March 20, 2025",
                description: "Join us for an important discussion about upcoming community developments.",
                image: "https://images.unsplash.com/photo-1577962917302-cd874c4e31d2?ixlib=rb-4.0.3"
              },
              {
                title: "New Road Construction Project",
                date: "March 25, 2025",
                description: "Major infrastructure improvements beginning next month to enhance connectivity.",
                image: "https://images.unsplash.com/photo-1485965120184-e220f721d03e?ixlib=rb-4.0.3"
              }
            ].map((news, index) => (
              <div
                key={index}
                className="bg-white rounded-xl shadow-xl overflow-hidden transform hover:scale-105 transition-all duration-300 animate__animated animate__fadeIn"
                style={{ animationDelay: `${index * 0.2}s` }}
              >
                <img src={news.image} alt={news.title} className="w-full h-48 object-cover" />
                <div className="p-6">
                  <div className="text-sm text-indigo-600 mb-2">{news.date}</div>
                  <h3 className="text-xl font-bold mb-2">{news.title}</h3>
                  <p className="text-gray-600">{news.description}</p>
                  <button className="mt-4 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors duration-300">
                    Read More
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Upcoming Events Section */}
      <section id="events" className="py-20 bg-indigo-600 text-white">
        <div className="container mx-auto text-center">
          <h2 className="text-4xl font-bold mb-8 text-yellow-300 animate__animated animate__fadeIn animate__delay-3s">Upcoming Events</h2>
          <div className="space-y-6">
            {[
              "Annual Health Fair - April 2025",
              "Community Cleanup Drive - May 2025",
              "Town Hall Meeting - June 2025"
            ].map((event, index) => (
              <div key={index} className="bg-white p-6 rounded-lg shadow-md hover:shadow-2xl transition-all duration-300 transform hover:scale-105 text-black">
                <h3 className="text-2xl font-semibold mb-2">{event}</h3>
                <p className="text-lg">Join us for these exciting community events aimed at making our locality better!</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Community Engagement Section - Fixed */}
      <section id="community" className="py-20 bg-gray-100 text-black">
        <div className="container mx-auto text-center px-4">
          <h2 className="text-4xl font-bold mb-8 text-indigo-600 animate__animated animate__fadeIn animate__delay-4s">
            Community Engagement
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
            <div className="bg-white p-6 rounded-lg shadow-lg hover:shadow-xl transition-all duration-300">
              <h3 className="text-xl font-bold mb-4 text-indigo-600">Volunteer Programs</h3>
              <p className="text-gray-600">Join our community volunteer programs and make a difference in your neighborhood.</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-lg hover:shadow-xl transition-all duration-300">
              <h3 className="text-xl font-bold mb-4 text-indigo-600">Community Meetings</h3>
              <p className="text-gray-600">Participate in regular community meetings to voice your opinions and concerns.</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-lg hover:shadow-xl transition-all duration-300">
              <h3 className="text-xl font-bold mb-4 text-indigo-600">Local Initiatives</h3>
              <p className="text-gray-600">Support and participate in local initiatives that improve our community.</p>
            </div>
          </div>
          <a href="#contact" className="bg-yellow-500 text-black px-8 py-3 rounded-full text-xl font-semibold hover:bg-yellow-400 transition duration-300 transform hover:scale-110 inline-block">
            Get Involved
          </a>
        </div>
      </section>

      {/* Local Programs Section */}
      <section id="programs" className="py-20 bg-white text-black">
        <div className="container mx-auto text-center">
          <h2 className="text-4xl font-bold mb-8 text-indigo-600 animate__animated animate__fadeIn animate__delay-5s">Public Programs</h2>
          <div className="space-y-6">
            {[
              "Nutrition Assistance Program - March 2025",
              "Youth Leadership Initiative - April 2025",
              "Sustainable Farming Training - May 2025"
            ].map((program, index) => (
              <div key={index} className="bg-gray-100 p-6 rounded-lg shadow-md hover:shadow-2xl transition-all duration-300 transform hover:scale-105">
                <h3 className="text-2xl font-semibold mb-2">{program}</h3>
                <p className="text-lg">Join our public programs to contribute to local development and sustainability.</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section - Fixed */}
      <section id="testimonials" className="py-20 bg-indigo-600 text-white">
        <div className="container mx-auto text-center px-4">
          <h2 className="text-4xl font-bold mb-12 animate__animated animate__fadeIn animate__delay-6s">
            What Our Residents Say
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              { name: "Jane D.", feedback: "The local government has been incredibly helpful in improving healthcare access. I feel safe and supported!" },
              { name: "John P.", feedback: "Thanks to the educational initiatives, my children have had the opportunity to attend amazing schools." },
              { name: "Luis T.", feedback: "I appreciate how the government is focusing on infrastructure. The new roads have made commuting much easier!" }
            ].map((testimonial, index) => (
              <div key={index} className="bg-white text-black rounded-lg shadow-xl p-6 transform hover:scale-105 transition-all duration-300">
                <p className="text-lg italic mb-4">"{testimonial.feedback}"</p>
                <p className="font-semibold text-indigo-600">{testimonial.name}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Section - Enhanced */}
      <section id="contact" className="py-20 bg-indigo-600 text-white">
        <div className="container mx-auto text-center px-4">
          <h2 className="text-4xl font-bold mb-8 animate__animated animate__fadeIn animate__delay-6s">Get in Touch</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto mb-12">
            <div className="bg-white text-black p-6 rounded-lg shadow-lg">
              <h3 className="text-xl font-bold mb-4 text-indigo-600">Visit Us</h3>
              <p>123 Main Street<br /> City, ST 12345</p>
            </div>
            <div className="bg-white text-black p-6 rounded-lg shadow-lg">
              <h3 className="text-xl font-bold mb-4 text-indigo-600">Call Us</h3>
              <p>Phone: (123) 456-7890<br />Emergency: 911</p>
            </div>
            <div className="bg-white text-black p-6 rounded-lg shadow-lg">
              <h3 className="text-xl font-bold mb-4 text-indigo-600">Email Us</h3>
              <p>info@lgu.gov<br />support@lgu.gov</p>
            </div>
          </div>
          <a href="mailto:lgu@example.com" className="bg-yellow-500 text-black px-8 py-3 rounded-full text-xl font-semibold hover:bg-yellow-400 transition duration-300 transform hover:scale-110 inline-block">
            Send Email
          </a>
        </div>
      </section>

      {/* Footer - Enhanced */}
      <footer className="bg-black text-white py-12">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
            <div>
              <h3 className="text-xl font-bold mb-4 text-yellow-300">About LGU</h3>
              <p className="text-gray-400">Serving our community with dedication and excellence.</p>
            </div>
            <div>
              <h3 className="text-xl font-bold mb-4 text-yellow-300">Quick Links</h3>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#about" className="hover:text-yellow-300">About</a></li>
                <li><a href="#services" className="hover:text-yellow-300">Services</a></li>
                <li><a href="#contact" className="hover:text-yellow-300">Contact</a></li>
              </ul>
            </div>
            <div>
              <h3 className="text-xl font-bold mb-4 text-yellow-300">Connect With Us</h3>
              <div className="flex space-x-4">
                <a href="https://facebook.com" className="text-gray-400 hover:text-yellow-300">Facebook</a>
                <a href="https://twitter.com" className="text-gray-400 hover:text-yellow-300">Twitter</a>
                <a href="https://instagram.com" className="text-gray-400 hover:text-yellow-300">Instagram</a>
              </div>
            </div>
          </div>
          <div className="border-t border-gray-800 pt-8 text-center text-gray-400">
            <p>© 2025 Local Government Unit. All Rights Reserved.</p>
          </div>
        </div>
      </footer>

      {/* Report Incident Modal */}
      {showReportModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 overflow-y-auto">
          <div className="min-h-screen px-4 flex items-center justify-center">
            <div className="relative my-8" onClick={(e) => e.stopPropagation()}>
              <ReportIncidents 
                onClose={handleReportClose}
                setShowEmergencyForm={setShowEmergencyForm}
                setShowReportModal={setShowReportModal}
              />
            </div>
          </div>
        </div>
      )}

      {/* Emergency Form Modal */}
      {showEmergencyForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 overflow-y-auto">
          <div className="min-h-screen px-4 flex items-center justify-center">
            <div className="relative my-8" onClick={(e) => e.stopPropagation()}>
              <EmergencyReportForm onClose={() => setShowEmergencyForm(false)} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Home;

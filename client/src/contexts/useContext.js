import React, { createContext, useState, useEffect, useContext, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify'; 

export const CombinedContext = createContext();

export const CombinedProvider = ({ children }) => {
  const navigate = useNavigate();
  
  // State for token and userType
  const [token, setToken] = useState(() => localStorage.getItem('token'));
  const [userType, setUserType] = useState(() => localStorage.getItem('userType'));

  // State for dark mode and side nav
  const [isDarkMode, setIsDarkMode] = useState(localStorage.getItem('theme') === 'dark');
  const [isOpen, setIsOpen] = useState(false);
  
  // Fetch user data to get userType
  const fetchData = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setUserType(null);
        return;
      }

      const response = await fetch(`${process.env.REACT_APP_API_URL}/auth/me`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setUserType(data.userType);
        localStorage.setItem('userType', data.userType); // Persist userType
      } else {
        setUserType(null);
        localStorage.removeItem('userType'); // Clear userType if session expired
        toast.error('Session expired. Please log in again.');
        navigate('/login'); // Redirect to login if session expired
      }
    } catch (error) {
      toast.error('Error fetching user data');
      setUserType(null);
    }
  }, [navigate]);

  useEffect(() => {
    if (token) {
      fetchData();
    }
  }, [token, fetchData]);

  const login = async (newToken) => {
    localStorage.setItem('token', newToken);
    setToken(newToken);
    await fetchData();
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userType'); // Clear userType on logout
    setToken(null);
    setUserType(null);
    navigate('/');
  };

  useEffect(() => {
    document.body.classList.toggle('dark-mode', isDarkMode);
    localStorage.setItem('theme', isDarkMode ? 'dark' : 'light');
  }, [isDarkMode]);

  const toggleSideNav = () => setIsOpen((prev) => !prev);
  const closeSideNav = () => setIsOpen(false);

  return (
    <CombinedContext.Provider
      value={{
        token,
        userType,
        login,
        logout,
        isDarkMode,
        toggleTheme: () => setIsDarkMode(prev => !prev),
        isOpen,
        toggleSideNav,
        closeSideNav,
      }}
    >
      {children}
    </CombinedContext.Provider>
  );
};

export const useCombinedContext = () => useContext(CombinedContext);

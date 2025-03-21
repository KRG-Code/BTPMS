import React, { createContext, useState, useEffect, useContext, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify'; 

export const CombinedContext = createContext();

export const CombinedProvider = ({ children }) => {
  const navigate = useNavigate();
  
  // State for token and userType
  const [token, setToken] = useState(() => localStorage.getItem('token'));
  const [userType, setUserType] = useState(() => localStorage.getItem('userType'));

  // State for side nav only - remove dark mode state
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
        navigate('/'); // Redirect to login if session expired
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
    localStorage.removeItem('isTracking'); // Add this line
    setToken(null);
    setUserType(null);
    navigate('/');
  };

  const refetchUserProfile = async () => {
    await fetchData();
  };

  // Remove theme-related code and effects

  const toggleSideNav = () => setIsOpen((prev) => !prev);
  const closeSideNav = () => setIsOpen(false);

  return (
    <CombinedContext.Provider
      value={{
        token,
        userType,
        login,
        logout,
        // Remove isDarkMode and toggleTheme
        isOpen,
        toggleSideNav,
        closeSideNav,
        refetchUserProfile,
      }}
    >
      {children}
    </CombinedContext.Provider>
  );
};

export const useCombinedContext = () => useContext(CombinedContext);

export const UserContext = CombinedContext; // Export UserContext

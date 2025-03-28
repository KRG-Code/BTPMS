import React, { createContext, useState, useEffect, useContext, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom'; // Add useLocation
import { toast } from 'react-toastify'; 

export const CombinedContext = createContext();

// Define public routes that don't need authentication
const PUBLIC_ROUTES = ["/Home", "/Tanodevaluation", "/Reportincidents"];

export const CombinedProvider = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation(); // Add location to check current route
  
  // State for token and userType
  const [token, setToken] = useState(() => localStorage.getItem('token'));
  const [userType, setUserType] = useState(() => localStorage.getItem('userType'));

  // State for side nav only - remove dark mode state
  const [isOpen, setIsOpen] = useState(false);
  
  // Check if current route is public
  const isPublicRoute = PUBLIC_ROUTES.some(route => 
    location.pathname === route || location.pathname.startsWith(route)
  );
  
  // Fetch user data to get userType
  const fetchData = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      
      // Skip token validation for public routes
      if (isPublicRoute) {
        return;
      }
      
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
      // Only show error for non-public routes
      if (!isPublicRoute) {
        toast.error('Error fetching user data');
      }
      setUserType(null);
    }
  }, [navigate, isPublicRoute]);

  useEffect(() => {
    // Only fetch data if we have a token AND we're not on a public route
    if (token && !isPublicRoute) {
      fetchData();
    }
  }, [token, fetchData, isPublicRoute]);

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
    navigate('/tanod-login'); // Redirect to login page
  };

  const refetchUserProfile = async () => {
    await fetchData();
  };

  const toggleSideNav = () => setIsOpen((prev) => !prev);
  const closeSideNav = () => setIsOpen(false);

  return (
    <CombinedContext.Provider
      value={{
        token,
        userType,
        login,
        logout,
        isOpen,
        toggleSideNav,
        closeSideNav,
        refetchUserProfile,
        isPublicRoute, // Expose this to components
      }}
    >
      {children}
    </CombinedContext.Provider>
  );
};

export const useCombinedContext = () => useContext(CombinedContext);

export const UserContext = CombinedContext; // Export UserContext

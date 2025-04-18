import React, { createContext, useState, useEffect, useContext, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'react-toastify'; 

export const CombinedContext = createContext();

// Define public routes that don't need authentication - Updated to match all public routes
const PUBLIC_ROUTES = [
  "/", 
  "/tanod-login", 
  "/signup", 
  "/resident-signup", 
  "/Tanodevaluation", 
  "/Reportincidents", 
  "/forgot-password", 
  "/reset-password", 
  "/reset-pin"
];

export const CombinedProvider = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  
  // State for token and userType
  const [token, setToken] = useState(() => localStorage.getItem('token'));
  const [userType, setUserType] = useState(() => localStorage.getItem('userType'));
  // Track authentication state
  const [isAuthenticated, setIsAuthenticated] = useState(!!localStorage.getItem('token'));
  const [isLoading, setIsLoading] = useState(true);

  // State for side nav only
  const [isOpen, setIsOpen] = useState(false);
  
  // Enhanced check for public routes - now handles path params like tokens
  const checkIsPublicRoute = useCallback((path) => {
    // Check exact matches first
    if (PUBLIC_ROUTES.includes(path)) {
      return true;
    }
    
    // Check for routes with parameters (like reset-password/:token)
    return PUBLIC_ROUTES.some(route => {
      if (route.endsWith("password") || route.endsWith("pin")) {
        return path.startsWith(route);
      }
      return false;
    });
  }, []);

  // Getter function to check if current route is public
  const isPublicRoute = useCallback(() => {
    return checkIsPublicRoute(location.pathname);
  }, [location.pathname, checkIsPublicRoute]);

  // Fetch user data to get userType
  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const storedToken = localStorage.getItem('token');
      
      // Skip token validation for public routes
      if (isPublicRoute()) {
        setIsLoading(false);
        return;
      }
      
      if (!storedToken) {
        setUserType(null);
        setIsAuthenticated(false);
        setIsLoading(false);
        return;
      }

      const response = await fetch(`${process.env.REACT_APP_API_URL}/auth/me`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${storedToken}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setUserType(data.userType);
        setIsAuthenticated(true);
        localStorage.setItem('userType', data.userType);
      } else {
        // Clear auth data on error
        setUserType(null);
        setIsAuthenticated(false);
        localStorage.removeItem('token');
        localStorage.removeItem('userType');
        
        // Only show error and redirect for non-public routes
        if (!isPublicRoute()) {
          toast.error('Session expired. Please log in again.');
          navigate('/tanod-login');
        }
      }
    } catch (error) {
      // Only show error for non-public routes
      if (!isPublicRoute()) {
        toast.error('Error fetching user data');
      }
      setUserType(null);
      setIsAuthenticated(false);
    } finally {
      setIsLoading(false);
    }
  }, [navigate, isPublicRoute]);

  // Check authentication status when component mounts and when route changes
  useEffect(() => {
    fetchData();
  }, [fetchData, location.pathname]);

  const login = async (newToken) => {
    localStorage.setItem('token', newToken);
    setToken(newToken);
    setIsAuthenticated(true);
    await fetchData();
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userType');
    localStorage.removeItem('isTracking');
    setToken(null);
    setUserType(null);
    setIsAuthenticated(false);
    navigate('/tanod-login');
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
        isPublicRoute: isPublicRoute(),
        isAuthenticated,
        isLoading
      }}
    >
      {children}
    </CombinedContext.Provider>
  );
};

export const useCombinedContext = () => useContext(CombinedContext);

export const UserContext = CombinedContext;

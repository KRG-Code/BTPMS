import React, { useEffect } from "react";
import { Navigate, useNavigate, useLocation } from "react-router-dom";
import { useCombinedContext } from "../contexts/useContext";
import { toast } from 'react-toastify';

export default function ProtectedRoute({ userTypeAllowed, children }) {
  const { userType, token, isLoading, isAuthenticated } = useCombinedContext();
  const navigate = useNavigate();
  const location = useLocation();
  
  useEffect(() => {
    // Handle navigation after login if we have a saved destination
    const lastLoginDestination = localStorage.getItem("lastLoginDestination");
    if (lastLoginDestination && isAuthenticated) {
      // Clear the saved destination and navigate there
      localStorage.removeItem("lastLoginDestination");
      navigate(lastLoginDestination, { replace: true });
    }
  }, [navigate, isAuthenticated]);

  // If still loading, show nothing yet (prevents flash of redirect)
  if (isLoading) {
    return null;
  }
  
  // Check if user is currently logging in (to prevent redirects during login process)
  const isCurrentlyLoggingIn = localStorage.getItem('isCurrentlyLoggingIn');
  
  // If user is currently in the login process, allow access temporarily
  if (isCurrentlyLoggingIn) {
    return children;
  }

  // If user is not logged in or doesn't have the allowed user type, redirect them
  if (!token || !userTypeAllowed.includes(userType)) {
    // Store the current location to return after login (only for non-public routes)
    if (location.pathname !== '/tanod-login') {
      localStorage.setItem('redirectAfterLogin', location.pathname);
    }
    
    // Redirect to login page with a message only if there was a token but it's invalid/expired
    if (localStorage.getItem('token') && !token) {
      toast.info('Your session has expired. Please login again.');
    }
    
    return <Navigate to="/tanod-login" replace />;
  }

  // Otherwise, render the children components (the protected route content)
  return children;
}

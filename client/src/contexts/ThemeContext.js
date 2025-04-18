import React, { createContext, useState, useContext, useEffect } from 'react';

// Create context with default values
const ThemeContext = createContext({
  isDarkMode: false,
  toggleTheme: () => {},
  theme: 'light'
});

export const ThemeProvider = ({ children }) => {
  // Check localStorage for saved preference, or use system preference
  const getInitialTheme = () => {
    try {
      const savedTheme = localStorage.getItem('theme');
      
      if (savedTheme) {
        return savedTheme === 'dark';
      }
      
      // Check system preference
      if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        return true;
      }
    } catch (error) {
      console.error('Error retrieving theme preference:', error);
    }
    
    // Default to light mode
    return false;
  };

  const [isDarkMode, setIsDarkMode] = useState(getInitialTheme());

  // Apply theme to document when it changes
  useEffect(() => {
    try {
      if (document && document.documentElement) {
        document.documentElement.classList.toggle('dark-mode', isDarkMode);
        document.documentElement.classList.toggle('light-mode', !isDarkMode);
        
        // Update body class for broader compatibility
        if (document.body) {
          document.body.classList.toggle('dark-mode', isDarkMode);
          document.body.classList.toggle('light-mode', !isDarkMode);
        }
        
        // Store preference in localStorage
        localStorage.setItem('theme', isDarkMode ? 'dark' : 'light');
      }
    } catch (error) {
      console.error('Error applying theme:', error);
    }
    
    // Cleanup function
    return () => {
      try {
        // No need to clean up on unmount as theme should persist
      } catch (error) {
        console.error('Error in theme cleanup:', error);
      }
    };
  }, [isDarkMode]);

  // Toggle theme function with error handling
  const toggleTheme = () => {
    try {
      setIsDarkMode(prev => !prev);
    } catch (error) {
      console.error('Error toggling theme:', error);
    }
  };

  // Create a stable context value object that won't trigger unnecessary re-renders
  const contextValue = React.useMemo(() => ({
    isDarkMode, 
    toggleTheme,
    theme: isDarkMode ? 'dark' : 'light'
  }), [isDarkMode]);

  return (
    <ThemeContext.Provider value={contextValue}>
      {children}
    </ThemeContext.Provider>
  );
};

// Custom hook for consuming the theme context with error handling
export const useTheme = () => {
  const context = useContext(ThemeContext);
  
  if (context === undefined) {
    console.warn('useTheme was called outside of ThemeProvider, using default values');
    // Return default values instead of throwing an error
    return { 
      isDarkMode: false, 
      toggleTheme: () => {
        console.warn('Theme toggle attempted outside provider');
      },
      theme: 'light'
    };
  }
  
  return context;
};

export default ThemeContext;

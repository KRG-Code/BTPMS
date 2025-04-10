import React, { useState, useEffect } from 'react';

// This is a temporary component to help debug authentication issues
const TokenDebug = () => {
  const [token, setToken] = useState('');
  const [userId, setUserId] = useState('');
  const [tokenValid, setTokenValid] = useState(false);
  const [tokenDecoded, setTokenDecoded] = useState({});
  
  useEffect(() => {
    // Get tokens from local storage
    const storedToken = localStorage.getItem('token');
    const storedUserId = localStorage.getItem('userId');
    
    setToken(storedToken || 'No token found');
    setUserId(storedUserId || 'No user ID found');
    
    // Basic check if token exists
    setTokenValid(!!storedToken);
    
    // Try to decode the token (note: this isn't verification, just decoding)
    if (storedToken) {
      try {
        // Extract the payload part of the JWT and decode
        const base64Url = storedToken.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const decoded = JSON.parse(window.atob(base64));
        setTokenDecoded(decoded);
      } catch (error) {
        console.error("Error decoding token:", error);
        setTokenDecoded({ error: 'Invalid token format' });
      }
    }
  }, []);
  
  return (
    <div className="bg-white dark:bg-gray-800 border border-red-500 p-4 rounded-lg mb-4">
      <h3 className="text-lg font-bold mb-2 text-red-600">Auth Debug (Remove in Production)</h3>
      <div className="grid grid-cols-1 gap-2 text-sm">
        <div>
          <span className="font-medium">Token Status:</span> 
          <span className={tokenValid ? "text-green-500" : "text-red-500"}>
            {tokenValid ? "Present" : "Missing"}
          </span>
        </div>
        <div>
          <span className="font-medium">User ID:</span> {userId}
        </div>
        <div>
          <span className="font-medium">Token Expiry:</span> {tokenDecoded.exp ? new Date(tokenDecoded.exp * 1000).toLocaleString() : 'N/A'}
        </div>
        <div>
          <span className="font-medium">Token Subject:</span> {tokenDecoded.id || 'N/A'}
        </div>
        <div className="mt-2">
          <button 
            onClick={() => {
              localStorage.removeItem('token');
              localStorage.removeItem('userId');
              window.location.reload();
            }}
            className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-xs"
          >
            Clear Token
          </button>
        </div>
      </div>
    </div>
  );
};

export default TokenDebug;

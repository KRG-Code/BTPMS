const validateAuth = (req, res, next) => {
  // Check for API key first
  const apiKey = req.header('X-API-Key');
  
  // Check for token
  const token = req.header('Authorization');

  // Allow if either API key or token is valid
  if ((apiKey && apiKey === process.env.INTEGRATION_API_KEY) || token) {
    return next();
  }

  return res.status(401).json({
    success: false,
    message: 'Authentication required'
  });
};

module.exports = { validateAuth };

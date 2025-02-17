const express = require('express');
const connectDB = require('./config/db');
const dotenv = require('dotenv');
const cors = require('cors');
const path = require('path');
const admin = require('firebase-admin');
const notificationRoutes = require('./routes/notificationRoutes');
const messageRoutes = require('./routes/messageRoutes');
const polygonRoutes = require('./routes/polygonRoutes');

dotenv.config(); // Load environment variables from .env
const app = express();
connectDB(); // Initialize MongoDB or other DB connection

// Firebase Admin Setup
const serviceAccount = {
  projectId: process.env.FIREBASE_PROJECT_ID,
  clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
  privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'), // Handle newlines
};

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
});

// Middleware
app.use(express.json());

// Enable CORS depending on environment
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? 'https://barangaypatrol.lgu1.com'  // Production front-end URL
    : 'http://localhost:3000',            // Development front-end URL
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],  // Allowed methods
  allowedHeaders: ['Content-Type', 'Authorization'],     // Allowed headers
  credentials: true,  // Enable cookies and authorization headers
}));

// Handle preflight requests (for CORS)
app.options('*', cors());

// Explicitly handle OPTIONS preflight requests
app.use((req, res, next) => {
  if (req.method === 'OPTIONS') {
    res.header('Access-Control-Allow-Origin', process.env.NODE_ENV === 'production' 
      ? 'https://barangaypatrol.lgu1.com' 
      : 'http://localhost:3000');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    return res.status(200).json({});
  }
  next();
});

// Serve uploaded images
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Auth Routes
const authRoutes = require('./routes/authRoutes');
app.use('/api/auth', authRoutes);

// Equipment Routes
const equipmentRoutes = require('./routes/authEquipment');
app.use('/api/equipments', equipmentRoutes);

app.use('/api/polygons', polygonRoutes);

// Tanod Rating Routes
const tanodRatingRoutes = require('./routes/authRoutes');
app.use('/api/tanods', tanodRatingRoutes);

// Notifications and Messages Routes
app.use('/api/notifications', notificationRoutes);
app.use('/api/messages', messageRoutes);

// Serve static files from the React app in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, 'client/build')));

  // Handle React routing, return all requests to the index.html
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'client/build', 'index.html'));
  });
}

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send({ message: 'An unexpected error occurred', error: err.message });
});

// Start the server (for local or production)
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
});

module.exports = app;

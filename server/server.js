require('dotenv').config();
const express = require('express');
const http = require('http');
const { initializeWebSocket } = require('./websocket'); // Import WebSocket initialization function
const connectDB = require('./config/db');
const dotenv = require('dotenv');
const cors = require('cors');
const path = require('path');
const admin = require('firebase-admin');
const notificationRoutes = require('./routes/notificationRoutes');
const messageRoutes = require('./routes/messageRoutes');
const polygonRoutes = require('./routes/polygonRoutes');
const incidentReportRoutes = require('./routes/incidentReportRoutes');
const cctvLocationRoutes = require("./routes/cctvLocationRoutes");
const assistanceRequestRoutes = require('./routes/assistanceRequestRoutes');
const assistanceIntegrationRoutes = require('./routes/assistanceIntegrationRoutes');
const locationRoutes = require('./routes/locationRoutes'); // Add this line
const Schedule = require('./models/Schedule');
const dashboardRoutes = require('./routes/dashboardRoutes');
const noteRoutes = require('./routes/noteRoutes');
const falseAlarmRoutes = require('./routes/falseAlarmRoutes'); // Import the new routes
const zipRoutes = require('./routes/zipRoutes'); // Import zip routes

dotenv.config(); // Load environment variables from .env
const app = express();
const server = http.createServer(app);
initializeWebSocket(server); // Initialize WebSocket server

// Update your change stream setup in server.js to handle errors
const setupScheduleChangeStream = () => {
  try {
    const scheduleChangeStream = Schedule.watch({
      fullDocument: 'updateLookup' // Include this option to get the full updated document
    });
    
    scheduleChangeStream.on('change', async (change) => {
      const io = require('./websocket').getIO();
      
      try {
        if (change.operationType === 'update' || change.operationType === 'insert') {
          const schedule = await Schedule.findById(change.documentKey._id)
            .populate('patrolArea')
            .populate('tanods');
            
          io.to('schedules').emit('scheduleUpdate', {
            type: change.operationType,
            schedule
          });
        }
      } catch (error) {
        console.error('Error processing schedule change:', error);
      }
    });

    scheduleChangeStream.on('error', (error) => {
      console.error('Schedule change stream error in server.js:', error);
      // Retry connection after a delay
      setTimeout(setupScheduleChangeStream, 5000);
    });
  } catch (error) {
    console.error('Error setting up schedule change stream:', error);
    setTimeout(setupScheduleChangeStream, 5000);
  }
};

// Call this after your MongoDB connection
connectDB().then(() => {
  setupScheduleChangeStream();
  // ...rest of your server startup code...
}).catch(error => {
  console.error('Failed to connect to database:', error);
});

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
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Set Permissions-Policy header
app.use((req, res, next) => {
  res.setHeader('Permissions-Policy', 'geolocation=(self), microphone=()');
  next();
});

// Enable CORS depending on environment
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? 'https://barangaypatrol.lgu1.com'  // Production front-end URL
    : ['http://localhost:3000', 'http://127.0.0.1:3000'],            // Development front-end URL
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],  // Allowed methods
  allowedHeaders: ['Content-Type', 'Authorization'],     // Allowed headers
  credentials: true,  // Enable cookies and authorization headers
}));

// Add this before your routes
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header(
    'Access-Control-Allow-Headers',
    'Origin, X-Requested-With, Content-Type, Accept, Authorization'
  );
  next();
});

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

// Add this to your existing server.js file to serve static files
app.use(express.static(path.join(__dirname, 'public')));

// Fix location routes mounting - make sure it's mounted at /api/locations
app.use('/api/locations', locationRoutes); // Update path

// Remove or comment out any duplicate route mounting
// app.use('/locations', locationRoutes); // Remove this if it exists

// Auth Routes
const authRoutes = require('./routes/authRoutes');
app.use('/api/auth', authRoutes);
// Also mount the /public/tanods route without auth protection
app.use('/api/public/tanods', require('./routes/publicRoutes'));

app.use('/api/polygons', polygonRoutes);

// Tanod Rating Routes
const tanodRatingRoutes = require('./routes/authRoutes');
app.use('/api/tanods', tanodRatingRoutes);

// Notifications and Messages Routes
app.use('/api/notifications', notificationRoutes);
app.use('/api/messages', messageRoutes);

// Incident Report Routes
app.use('/api/incident-reports', incidentReportRoutes);

// CCTV Location Routes
app.use("/api/cctv-locations", cctvLocationRoutes);

// Equipment Routes
const equipmentRoutes = require('./routes/authEquipment');
app.use('/api/equipments', equipmentRoutes);

// Add assistance request routes
app.use('/api/assistance-requests', assistanceRequestRoutes);

// Add assistance integration routes
app.use('/api/integration', assistanceIntegrationRoutes);

// Add incident report integration routes
const incidentReportIntegrationRoutes = require('./routes/incidentReportIntegrationRoutes');
app.use('/api/integration/incident-reports', incidentReportIntegrationRoutes);

// Vehicle Routes - Update to ensure consistent path for all vehicle endpoints
const vehicleRoutes = require('./routes/vehicleRoutes');

// Mount vehicle routes at BOTH paths to ensure compatibility during testing
// This way we guarantee at least one path works
app.use('/api/vehicles', vehicleRoutes);
app.use('/vehicles', vehicleRoutes);

// Add dashboard routes
app.use('/api/dashboard', dashboardRoutes);

// Add note routes
app.use('/api/notes', noteRoutes);

// Add false alarm routes
app.use('/api/false-alarms', falseAlarmRoutes);

// Use zip routes
app.use('/api/zip', zipRoutes);

// Add or ensure these routes are set up
app.use('/auth/inventory', require('./routes/inventoryRoutes'));
app.use('/equipments', require('./routes/authEquipment'));
app.use('/vehicles', require('./routes/vehicleRoutes'));

// Add resident routes
const residentRoutes = require('./routes/residentsRoute');
app.use('/api/residents', residentRoutes);

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
server.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
});

module.exports = app;

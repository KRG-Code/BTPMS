const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const TanodLocation = require('./models/TanodLocation');
const mongoose = require('mongoose');
const IncidentReport = require('./models/IncidentReport');
const Schedule = require('./models/Schedule'); // Add this import

let io;
let activeLocations = new Map();

const initializeWebSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: process.env.NODE_ENV === 'production' 
        ? 'https://barangaypatrol.lgu1.com'
        : ['http://localhost:3000', 'http://127.0.0.1:3000'],
      methods: ['GET', 'POST'],
      credentials: true,
    },
    pingTimeout: 60000,
    pingInterval: 25000,
    transports: ['websocket', 'polling'], // Allow both WebSocket and polling
  });

  // Add authentication middleware
  io.use((socket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) {
      return next(new Error('Authentication error'));
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.userId = decoded.id;
      next();
    } catch (err) {
      next(new Error('Authentication error'));
    }
  });

  // Set up change streams
  const incidentChangeStream = IncidentReport.watch();
  const locationChangeStream = TanodLocation.watch();
  const scheduleChangeStream = Schedule.watch();

  // Handle incident changes
  incidentChangeStream.on('change', async (change) => {
    if (change.operationType === 'insert' || change.operationType === 'update') {
      try {
        const incident = await IncidentReport.findById(change.documentKey._id)
          .populate('reporter', 'firstName lastName')
          .populate('responder', 'firstName lastName');
          
        io.to('incidents').emit('incidentUpdate', {
          type: change.operationType,
          incident
        });
      } catch (error) {
        console.error('Error processing incident change:', error);
      }
    }
  });

  // Handle location changes
  locationChangeStream.on('change', async (change) => {
    try {
      if (change.operationType === 'update' || change.operationType === 'insert') {
        const location = await TanodLocation.findById(change.documentKey._id)
          .populate('userId', 'firstName lastName profilePicture')
          .populate({
            path: 'currentScheduleId',
            populate: {
              path: 'patrolArea',
              select: 'color legend'
            }
          });

        if (location && location.isActive) {
          io.to('tracking').emit('locationUpdate', {
            ...location.toObject(),
            markerColor: location.markerColor,
            isOnPatrol: location.isOnPatrol
          });
        }
      }
    } catch (error) {
      console.error('Error processing location change:', error);
    }
  });

  // Add schedule change stream handler
  scheduleChangeStream.on('change', async (change) => {
    try {
      if (change.operationType === 'update') {
        const schedule = await Schedule.findById(change.documentKey._id);
        
        // Update location markers for affected tanods
        const affectedTanods = schedule.patrolStatus
          .filter(status => status.status === 'Started')
          .map(status => status.tanodId);

        for (const tanodId of affectedTanods) {
          await TanodLocation.findOneAndUpdate(
            { userId: tanodId, isActive: true },
            { 
              markerColor: schedule.patrolArea?.color || 'red',
              isOnPatrol: true,
              currentScheduleId: schedule._id
            },
            { new: true }
          ).populate('userId', 'firstName lastName profilePicture');
        }
      }
    } catch (error) {
      console.error('Error processing schedule change:', error);
    }
  });

  io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);

    // Add WebRTC signaling handlers
    socket.on('rtc-offer', ({ target, offer, from }) => {
      io.to(`user_${target}`).emit('rtc-offer', { offer, from });
    });

    socket.on('rtc-answer', ({ target, answer }) => {
      io.to(`user_${target}`).emit('rtc-answer', { answer });
    });

    socket.on('rtc-ice-candidate', ({ target, candidate }) => {
      io.to(`user_${target}`).emit('rtc-ice-candidate', { candidate });
    });

    // Join user's personal room for direct messages
    socket.join(`user_${socket.userId}`);

    socket.on('joinTrackingRoom', async () => {
      socket.join('tracking');
      console.log('Client joined tracking room:', socket.id);
      
      // Send current active locations to newly connected client
      try {
        const locations = await TanodLocation.find({ isActive: true })
          .populate('userId', 'firstName lastName profilePicture')
          .populate({
            path: 'currentScheduleId',
            populate: {
              path: 'patrolArea'
            }
          });
        socket.emit('initializeLocations', locations);
      } catch (error) {
        console.error('Error fetching initial locations:', error);
      }
    });

    socket.on('joinConversation', (conversationId) => {
      // Leave all previous conversation rooms
      Array.from(socket.rooms)
        .filter(room => room.startsWith('conversation_'))
        .forEach(room => socket.leave(room));

      // Join new conversation room
      const roomName = `conversation_${conversationId}`;
      socket.join(roomName);
      console.log(`Client ${socket.id} joined conversation: ${conversationId}`);
    });

    socket.on('leaveConversation', (conversationId) => {
      socket.leave(`conversation_${conversationId}`);
      console.log(`Client ${socket.id} left conversation: ${conversationId}`);
    });

    socket.on('joinIncidentRoom', () => {
      socket.join('incidents');
    });

    socket.on('leaveIncidentRoom', () => {
      socket.leave('incidents');
    });

    socket.on('locationUpdate', async (data) => {
      try {
        const { userId, latitude, longitude, currentScheduleId } = data;
        
        // Update location in database
        const location = await TanodLocation.findOneAndUpdate(
          { userId },
          { 
            userId,
            latitude,
            longitude,
            currentScheduleId,
            lastUpdate: new Date(),
            isActive: true
          },
          { 
            upsert: true, 
            new: true,
            setDefaultsOnInsert: true
          }
        ).populate('userId', 'firstName lastName profilePicture');
    
        // Broadcast to all clients in tracking room
        socket.to('tracking').emit('locationUpdate', location);
      } catch (error) {
        console.error('Error processing location update:', error);
      }
    });

    socket.on('joinScheduleRoom', () => {
      socket.join('schedules');
      console.log('Client joined schedule room:', socket.id);
    });

    socket.on('leaveScheduleRoom', () => {
      socket.leave('schedules');
      console.log('Client left schedule room:', socket.id);
    });

    // Clean up stale locations periodically
    const cleanup = setInterval(() => {
      const now = Date.now();
      const staleThreshold = 5 * 60 * 1000; // 5 minutes

      for (const [userId, location] of activeLocations.entries()) {
        if (now - location.lastUpdate > staleThreshold) {
          activeLocations.delete(userId);
        }
      }
    }, 60000); // Run every minute

    socket.on('disconnect', () => {
      clearInterval(cleanup);
      console.log('Client disconnected:', socket.id);
    });

    socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
      if (error.message === 'Authentication error') {
        toast.error('Authentication failed. Please log in again.');
        stopTracking();
      } else {
        // Add retry logic
        setTimeout(() => {
          socket.connect();
        }, 1000);
        toast.error('Connection error. Retrying...');
      }
    });
  });
};

module.exports = { 
  initializeWebSocket,
  getIO: () => io 
};

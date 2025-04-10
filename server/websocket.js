const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const TanodLocation = require('./models/TanodLocation');
const mongoose = require('mongoose');
const IncidentReport = require('./models/IncidentReport');
const Schedule = require('./models/Schedule'); 
const Notification = require('./models/Notification');
const VehicleRequest = require('./models/VehicleRequest'); // Add this import
const Vehicle = require('./models/Vehicle'); // Add this import

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
    // Allow connection without token for public pages (query param token)
    if (socket.handshake.query && socket.handshake.query.token) {
      try {
        const decoded = jwt.verify(socket.handshake.query.token, process.env.JWT_SECRET);
        socket.userId = decoded.id;
        return next();
      } catch (err) {
        // Fall through to regular auth check
      }
    }
    
    const token = socket.handshake.auth.token || socket.handshake.query.token;
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
  const notificationChangeStream = Notification.watch();
  
  // Add vehicle request change stream
  const vehicleRequestChangeStream = VehicleRequest.watch();
  // Add vehicle change stream
  const vehicleChangeStream = Vehicle.watch();

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

  // Add notification change stream handler
  notificationChangeStream.on('change', async (change) => {
    try {
      if (change.operationType === 'insert') {
        const notification = await Notification.findById(change.documentKey._id);
        if (notification) {
          // Emit to specific user's room
          io.to(`user_${notification.userId}`).emit('notificationUpdate', {
            type: 'new',
            notification
          });
        }
      }
    } catch (error) {
      console.error('Error processing notification change:', error);
    }
  });

  // Handle vehicle request changes
  vehicleRequestChangeStream.on('change', async (change) => {
    try {
      if (change.operationType === 'insert' || change.operationType === 'update' || 
          change.operationType === 'replace') {
        
        // Get the updated vehicle request document with populated fields
        const vehicleRequest = await VehicleRequest.findById(change.documentKey._id)
          .populate('vehicleId', 'name licensePlate status condition imageUrl')
          .populate('requesterId', 'firstName lastName');
          
        if (vehicleRequest) {
          console.log(`Broadcasting vehicle request update: ${change.operationType}, ID: ${vehicleRequest._id}`);
          
          // Emit to admin room for resource management
          io.to('vehicle-requests').emit('vehicleRequestUpdate', {
            type: 'vehicleRequestUpdate',
            request: vehicleRequest,
            action: change.operationType
          });
          
          // Also emit to the specific user who made the request
          const userRoomId = `user-${vehicleRequest.requesterId._id}`;
          console.log(`Broadcasting to user room: ${userRoomId}`);
          io.to(userRoomId).emit('vehicleRequestUpdate', {
            type: 'vehicleRequestUpdate',
            request: vehicleRequest,
            action: change.operationType
          });
        }
      }
    } catch (error) {
      console.error('Error processing vehicle request change:', error);
    }
  });
  
  // Handle vehicle status changes
  vehicleChangeStream.on('change', async (change) => {
    try {
      if (change.operationType === 'update' || change.operationType === 'replace') {
        // Get the updated vehicle document
        const vehicle = await Vehicle.findById(change.documentKey._id)
          .populate('assignedDriver', 'firstName lastName');
        
        if (vehicle) {
          // Emit to vehicle rooms
          io.to('vehicles').emit('vehicleStatusUpdate', {
            type: change.operationType,
            vehicle: vehicle
          });
          
          // If in use, also emit to user's room
          if (vehicle.status === 'In Use' && vehicle.currentUserId) {
            io.to(`user-${vehicle.currentUserId}`).emit('vehicleStatusUpdate', {
              type: change.operationType,
              vehicle: vehicle
            });
          }
        }
      }
    } catch (error) {
      console.error('Error processing vehicle change:', error);
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
    // Also join the user-specific room with hyphen format for vehicle updates
    socket.join(`user-${socket.userId}`);

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
    
    // Add vehicle request rooms
    socket.on('join', (data) => {
      if (data && data.room) {
        socket.join(data.room);
        console.log(`Client ${socket.id} joined room: ${data.room}`);
      }
    });
    
    socket.on('leave', (data) => {
      if (data && data.room) {
        socket.leave(data.room);
        console.log(`Client ${socket.id} left room: ${data.room}`);
      }
    });

    // Add vehicle room handlers
    socket.on('joinVehicleRoom', () => {
      socket.join('vehicles');
      console.log('Client joined vehicles room:', socket.id);
    });
    
    socket.on('leaveVehicleRoom', () => {
      socket.leave('vehicles');
      console.log('Client left vehicles room:', socket.id);
    });
    
    socket.on('joinVehicleRequestsRoom', () => {
      socket.join('vehicle-requests');
      console.log('Client joined vehicle-requests room:', socket.id);
    });
    
    socket.on('leaveVehicleRequestsRoom', () => {
      socket.leave('vehicle-requests');
      console.log('Client left vehicle-requests room:', socket.id);
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

    // Add this handler for notifications
    socket.on('joinNotificationRoom', () => {
      socket.join(`user_${socket.userId}`);
      console.log('Client joined notification room:', socket.id);
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
        socket.emit('authError', { message: 'Authentication failed. Please log in again.' });
      } else {
        // Add retry logic
        setTimeout(() => {
          socket.connect();
        }, 1000);
        socket.emit('connectionError', { message: 'Connection error. Retrying...' });
      }
    });
  });
};

// Update the function to broadcast vehicle request updates
const broadcastVehicleRequestUpdate = (request, action = 'update') => {
  // Check if request has populated requesterId
  let requestWithUser = request;
  
  // Get the WebSocket clients in the vehicle-requests room
  const room = rooms.get('vehicle-requests') || [];
  
  // Also notify the requester directly
  const userId = request.requesterId?._id?.toString() || request.requesterId?.toString();
  const userRoom = rooms.get(`user-${userId}`);
  
  // Debug logging
  console.log(`Broadcasting vehicle request update to ${room.length} clients in vehicle-requests room`);
  if (userRoom && userRoom.length) {
    console.log(`Also broadcasting to ${userRoom.length} clients in user-${userId} room`);
  }
  
  // Broadcast to all admin clients in the vehicle-requests room
  room.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify({
        type: 'vehicleRequestUpdate',
        request: requestWithUser,
        action: action
      }));
    }
  });
  
  // Also send to the specific user
  if (userRoom) {
    userRoom.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify({
          type: 'vehicleRequestUpdate',
          request: requestWithUser,
          action: action
        }));
      }
    });
  }
};

module.exports = { 
  initializeWebSocket,
  getIO: () => io 
};

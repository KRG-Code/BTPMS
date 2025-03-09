const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');

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
    transports: ['polling', 'websocket'],
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

    socket.on('joinTrackingRoom', () => {
      socket.join('tracking');
      console.log('Client joined tracking room:', socket.id);
      
      // Send current active locations to newly connected client
      const locations = Array.from(activeLocations.values());
      socket.emit('initializeLocations', locations);
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

    socket.on('locationUpdate', (location) => {
      console.log('Location update received:', location);
      activeLocations.set(location.userId, {
        ...location,
        lastUpdate: Date.now()
      });
      io.to('tracking').emit('locationUpdate', location);
    });

    // Remove the messageReceived event handler as it's now handled directly in the controller

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
  });
};

module.exports = { 
  initializeWebSocket,
  getIO: () => io 
};

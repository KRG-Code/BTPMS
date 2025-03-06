const { Server } = require('socket.io');

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

  io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);

    socket.on('joinTrackingRoom', () => {
      socket.join('tracking');
      console.log('Client joined tracking room:', socket.id);
      
      // Send current active locations to newly connected client
      const locations = Array.from(activeLocations.values());
      socket.emit('initializeLocations', locations);
    });

    socket.on('joinConversation', (conversationId) => {
      socket.join(`conversation_${conversationId}`);
      console.log('Client joined conversation:', conversationId);
    });

    socket.on('locationUpdate', (location) => {
      console.log('Location update received:', location);
      activeLocations.set(location.userId, {
        ...location,
        lastUpdate: Date.now()
      });
      io.to('tracking').emit('locationUpdate', location);
    });

    socket.on('newMessage', (message) => {
      io.to(`conversation_${message.conversationId}`).emit('messageReceived', message);
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
  });
};

module.exports = { 
  initializeWebSocket,
  getIO: () => io 
};

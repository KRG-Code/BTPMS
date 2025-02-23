const { Server } = require('socket.io');

let io;

const initializeWebSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: process.env.NODE_ENV === 'production' 
        ? 'https://barangaypatrol.lgu1.com'  // Production front-end URL
        : 'http://localhost:3000',            // Development front-end URL
      methods: ['GET', 'POST'],
      credentials: true,  // Enable cookies and authorization headers
    },
    transports: ['websocket', 'polling'], // Ensure WebSocket and polling transports are used
    allowEIO3: true, // Allow EIO3 for compatibility with older clients
  });

  io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);

    socket.on('locationUpdate', (location) => {
      console.log('Location update from Tanod:', location); // Log the received location update
      io.emit('locationUpdate', location); // Broadcast location update to all clients
      io.of('/admin').emit('locationUpdate', location); // Broadcast location update to admin namespace
    });

    socket.on('disconnect', () => {
      console.log('Client disconnected:', socket.id);
    });
  });
};

module.exports = { initializeWebSocket };

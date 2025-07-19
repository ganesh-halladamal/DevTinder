require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const { createServer } = require('http');
const { Server } = require('socket.io');
const passport = require('passport');
const net = require('net');

// Import routes
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const matchRoutes = require('./routes/matches');
const messageRoutes = require('./routes/messages');
const projectRoutes = require('./routes/projects');

// Import socket handlers
const { setupSocketHandlers } = require('./services/socket');

// Import database connection
const connectDB = require('./config/database');

// Try to import MongoDB memory server - for development only
let memoryServerSetup;
try {
  memoryServerSetup = require('../mongodb.config');
} catch (err) {
  console.log('MongoDB memory server not available, using regular connection');
}

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    methods: ['GET', 'POST']
  }
});

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));
app.use(express.json());
app.use(passport.initialize());

// Initialize passport config
require('./config/passport');

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/matches', matchRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/projects', projectRoutes);

// Socket.io setup
setupSocketHandlers(io);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    message: err.message || 'Internal Server Error',
    error: process.env.NODE_ENV === 'development' ? err : {}
  });
});

// Function to check if a port is in use
const isPortInUse = (port) => {
  return new Promise((resolve) => {
    const server = net.createServer()
      .once('error', () => resolve(true))
      .once('listening', () => {
        server.close();
        resolve(false);
      })
      .listen(port);
  });
};

// Find an available port starting from the preferred one
const findAvailablePort = async (preferredPort, maxAttempts = 10) => {
  let port = preferredPort;
  let attempts = 0;
  
  while (await isPortInUse(port) && attempts < maxAttempts) {
    port++;
    attempts++;
    console.log(`Port ${preferredPort} is in use, trying port ${port}`);
  }
  
  if (attempts >= maxAttempts) {
    throw new Error('Could not find an available port after multiple attempts');
  }
  
  return port;
};

// Main function to start everything
const startServer = async () => {
  try {
    // Try using memory server in development
    if (memoryServerSetup && process.env.NODE_ENV !== 'production') {
      const uri = await memoryServerSetup.startMemoryServer();
      process.env.MEMORY_SERVER_URI = uri;
    }

    // Connect to database
    await connectDB();

    // Find an available port
    const preferredPort = parseInt(process.env.PORT || 5000, 10);
    const port = await findAvailablePort(preferredPort);
    
    if (port !== preferredPort) {
      console.log(`Port ${preferredPort} is in use, using port ${port} instead`);
      process.env.PORT = port.toString();
    }

    // Start HTTP server
    httpServer.listen(port, () => {
      console.log(`Server running on port ${port}`);
    });
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
};

// Handle server shutdown
process.on('SIGINT', async () => {
  console.log('Shutting down server...');
  if (memoryServerSetup) {
    await memoryServerSetup.stopMemoryServer();
  }
  process.exit(0);
});

// Start the server
startServer(); 
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const { createServer } = require('http');
const { Server } = require('socket.io');
const passport = require('passport');
const net = require('net');

// Set default environment variables if not provided
if (!process.env.JWT_SECRET) {
  process.env.JWT_SECRET = 'devtinder_jwt_secret_key';
  console.log('JWT_SECRET:', process.env.JWT_SECRET);
}

if (!process.env.JWT_EXPIRES_IN) {
  process.env.JWT_EXPIRES_IN = '30d';
  console.log('JWT_EXPIRES_IN:', process.env.JWT_EXPIRES_IN);
}

// Import routes
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const matchRoutes = require('./routes/matches');
const messageRoutes = require('./routes/messages');
const projectRoutes = require('./routes/projects');
const settingsRoutes = require('./routes/settings');

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
    origin: ['http://localhost:3000', 'http://localhost:5173', 'http://localhost:3001'],
    methods: ['GET', 'POST'],
    credentials: true
  }
});

// Middleware - Allow multiple origins for development
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:5173',
  'http://localhost:3001'
];

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1 || process.env.NODE_ENV === 'development') {
      callback(null, true);
    } else {
      console.log('CORS blocked origin:', origin);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));
app.use(express.json());
app.use(passport.initialize());

// Simple test route
app.get('/api/test', (req, res) => {
  res.json({ message: 'API is working!' });
});

// Initialize passport config
require('./config/passport');

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/matches', matchRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/settings', settingsRoutes);

// Socket.io setup
setupSocketHandlers(io);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error occurred:', err);
  console.error('Stack trace:', err.stack);
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
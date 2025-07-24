// Load environment variables as early as possible
require('dotenv').config();
const { createServer } = require('http');
const { Server } = require('socket.io');
const net = require('net');
const fs = require('fs');
const path = require('path');
const connectDB = require('./config/database');
const app = require('./app');

// Set default environment variables if not provided
if (!process.env.JWT_SECRET) {
  process.env.JWT_SECRET = 'devtinder_jwt_secret_key';
  console.log('Using default JWT_SECRET as none was provided in environment');
} else {
  console.log('Using JWT_SECRET from environment');
}

if (!process.env.JWT_EXPIRES_IN) {
  process.env.JWT_EXPIRES_IN = '30d';
  console.log('Using default JWT_EXPIRES_IN:', process.env.JWT_EXPIRES_IN);
}

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) {
  console.log('Creating uploads directory...');
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Import socket handlers
const { setupSocketHandlers } = require('./services/socket');

// Create HTTP server and Socket.IO instance
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: ['http://localhost:3000', 'http://localhost:5173', 'http://localhost:3001'],
    methods: ['GET', 'POST'],
    credentials: true
  }
});

// Set up socket handlers
setupSocketHandlers(io);

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
      console.log(`Socket.IO server is running`);
    });
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
};

// Handle server shutdown
process.on('SIGINT', async () => {
  console.log('Shutting down server...');
  process.exit(0);
});

// Start the server
startServer(); 
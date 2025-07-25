   const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const srcApp = require('./src/app');  // Import the main app from src

const app = express();

// Configure CORS
const corsOptions = {
  origin: function(origin, callback) {
    const allowedOrigins = [process.env.FRONTEND_URL, 'http://localhost:3000', 'http://localhost:5173'];
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};

app.use(cors(corsOptions));

// Mount the src/app.js routes under /api
app.use('/api', srcApp);

// Serve static files from uploads directory
const uploadsPath = path.join(__dirname, 'uploads');
console.log('Uploads directory path:', uploadsPath);

// Ensure uploads directory exists
if (!fs.existsSync(uploadsPath)) {
  fs.mkdirSync(uploadsPath, { recursive: true });
}

// Debug middleware to log all requests
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// Configure static file serving with CORS headers and debugging
app.use('/uploads', (req, res, next) => {
  console.log('Accessing uploads:', req.url);
  console.log('File path:', path.join(uploadsPath, req.url));
  
  // Check if file exists
  if (fs.existsSync(path.join(uploadsPath, req.url))) {
    console.log('File exists');
  } else {
    console.log('File does not exist');
  }

  res.set('Access-Control-Allow-Origin', 'http://localhost:3000');
  res.set('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
  next();
}, express.static(uploadsPath, { index: false }));

// Serve uploads at api/uploads path as well with debugging
app.use('/api/uploads', (req, res, next) => {
  console.log('Accessing api/uploads:', req.url);
  console.log('File path:', path.join(uploadsPath, req.url));
  
  // Check if file exists
  if (fs.existsSync(path.join(uploadsPath, req.url))) {
    console.log('File exists');
  } else {
    console.log('File does not exist');
  }

  res.set('Access-Control-Allow-Origin', 'http://localhost:3000');
  res.set('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
  next();
}, express.static(uploadsPath, { index: false }));

console.log('Serving uploads from:', uploadsPath);
console.log('Uploads will be accessible at:');
console.log('- http://localhost:[PORT]/uploads/[filename]');
console.log('- http://localhost:[PORT]/api/uploads/[filename]');

// Log available routes on startup
console.log('API Routes:');
console.log('- Auth: /api/auth/*');
console.log('- Users: /api/users/*');
console.log('- Matches: /api/matches/*');
console.log('- Messages: /api/messages/*');
console.log('- Projects: /api/projects/*');
console.log('- Settings: /api/settings/*');
console.log('Static Files:');
console.log('- Uploads: /uploads/*');

// Start the server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`Access the API at http://localhost:${PORT}/api`);
}); 
const express = require("express");
const path = require("path");
const cors = require("cors");
const passport = require('passport');

// Import routes
const authRoutes = require("./routes/auth");
const userRoutes = require("./routes/users");
const matchesRoutes = require("./routes/matches");
const messagesRoutes = require("./routes/messages");
const projectsRoutes = require("./routes/projects");
const settingsRoutes = require("./routes/settings");

const app = express();

// Configure CORS
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:5173',
  'http://localhost:3001',
  process.env.FRONTEND_URL
].filter(Boolean);

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

// Middleware to parse JSON request bodies
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(passport.initialize());

// Initialize passport config
require('./config/passport');

// Serve static files
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// API Routes
app.use('/auth', authRoutes);
app.use('/users', userRoutes);
app.use('/matches', matchesRoutes);
app.use('/messages', messagesRoutes);
app.use('/projects', projectsRoutes);
app.use('/settings', settingsRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    message: err.message || 'Internal Server Error'
  });
});

module.exports = app;
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/matches', matchesRoutes);
app.use('/api/messages', messagesRoutes);
app.use('/api/projects', projectsRoutes);
app.use('/api/settings', settingsRoutes);

// Root route
app.get('/', (req, res) => {
  res.send('DevTinder API is running');
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Server error', error: err.message });
});

module.exports = app;

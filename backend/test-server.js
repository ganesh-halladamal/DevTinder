const express = require('express');
const path = require('path');
const cors = require('cors');

const app = express();

// Enable CORS with specific options
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173', // Your frontend URL
  credentials: true
}));

// Configure static file serving
const uploadsPath = path.join(__dirname, 'uploads');
console.log('Serving uploads from:', uploadsPath);

// Serve static files from the uploads directory
app.use('/uploads', express.static(uploadsPath));
app.use(express.json());

// Test route to check if the server is working
app.get('/test', (req, res) => {
  res.json({ message: 'Server is working' });
});

// Test route to check if a specific file exists
app.get('/check-file/:filename', (req, res) => {
  const filePath = path.join(uploadsPath, req.params.filename);
  if (require('fs').existsSync(filePath)) {
    res.json({ exists: true, path: filePath });
  } else {
    res.json({ exists: false, path: filePath });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Uploads directory: ${uploadsPath}`);
});

const fs = require('fs');
const path = require('path');

// Function to ensure uploads directory exists
const ensureUploadsDirectory = () => {
  const uploadsPath = path.join(__dirname, '../uploads');
  
  if (!fs.existsSync(uploadsPath)) {
    console.log('Creating uploads directory...');
    fs.mkdirSync(uploadsPath, { recursive: true });
  }
  
  // Log existing files in uploads directory
  console.log('Files in uploads directory:');
  const files = fs.readdirSync(uploadsPath);
  files.forEach(file => {
    console.log(`- ${file}`);
  });
};

ensureUploadsDirectory();

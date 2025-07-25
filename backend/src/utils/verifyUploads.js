const fs = require('fs');
const path = require('path');

// Function to verify uploads directory
const verifyUploads = () => {
  const uploadsPath = path.join(__dirname, '../uploads');
  
  console.log('Checking uploads directory:', uploadsPath);
  
  // Create directory if it doesn't exist
  if (!fs.existsSync(uploadsPath)) {
    console.log('Creating uploads directory...');
    fs.mkdirSync(uploadsPath, { recursive: true });
  }
  
  // List all files in the uploads directory
  console.log('\nFiles in uploads directory:');
  const files = fs.readdirSync(uploadsPath);
  files.forEach(file => {
    const stats = fs.statSync(path.join(uploadsPath, file));
    console.log(`- ${file} (${stats.size} bytes)`);
  });
  
  // Check permissions
  try {
    const testPath = path.join(uploadsPath, 'test.txt');
    fs.writeFileSync(testPath, 'test');
    fs.unlinkSync(testPath);
    console.log('\n✅ Write permissions OK');
  } catch (error) {
    console.error('\n❌ Write permissions ERROR:', error.message);
  }
};

verifyUploads();

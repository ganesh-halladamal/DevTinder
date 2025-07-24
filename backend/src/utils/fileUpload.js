const fs = require('fs');
const path = require('path');
const { promisify } = require('util');
const writeFileAsync = promisify(fs.writeFile);
const mkdirAsync = promisify(fs.mkdir);

// Maximum file size in bytes (100KB)
const MAX_FILE_SIZE = 100 * 1024; 

/**
 * Validates and saves an image from base64 data
 * @param {string} base64Data - The base64 encoded image data
 * @param {string} userId - User ID to use in the filename
 * @returns {Promise<string>} - The path to the saved image
 */
exports.saveBase64Image = async (base64Data, userId) => {
  console.log('Starting image upload process for user:', userId);
  
  // Validate the data
  if (!base64Data || typeof base64Data !== 'string') {
    console.error('Invalid image data: Data is null, undefined, or not a string');
    throw new Error('Invalid image data');
  }
  
  // Extract the MIME type and actual base64 data
  const matches = base64Data.match(/^data:([A-Za-z-+/]+);base64,(.+)$/);
  if (!matches || matches.length !== 3) {
    console.error('Invalid base64 format: Could not extract MIME type and data');
    throw new Error('Invalid base64 format');
  }
  
  // Get the MIME type and the actual base64 data
  const mimeType = matches[1].toLowerCase();
  const imageData = matches[2];
  
  console.log('Image MIME type:', mimeType);
  
  // Check if it's an image and specifically JPG or PNG
  if (!mimeType.startsWith('image/')) {
    console.error('Not an image format:', mimeType);
    throw new Error('Not an image format');
  }
  
  if (mimeType !== 'image/jpeg' && mimeType !== 'image/png') {
    console.error('Unsupported image format. Only JPEG and PNG are allowed.');
    throw new Error('Unsupported image format. Only JPEG and PNG are allowed.');
  }
  
  // Decode base64 data to get file size
  const buffer = Buffer.from(imageData, 'base64');
  const fileSizeKB = Math.round(buffer.length / 1024);
  console.log(`Image size: ${fileSizeKB}KB`);
  
  // Check file size
  if (buffer.length > MAX_FILE_SIZE) {
    console.error(`Image size exceeds the limit: ${fileSizeKB}KB > ${MAX_FILE_SIZE / 1024}KB`);
    throw new Error(`Image size exceeds the limit of ${MAX_FILE_SIZE / 1024}KB`);
  }
  
  // Create uploads directory if it doesn't exist
  const uploadsDir = path.join(__dirname, '../../uploads');
  console.log('Uploads directory path:', uploadsDir);
  
  try {
    await mkdirAsync(uploadsDir, { recursive: true });
    console.log('Uploads directory created or already exists');
  } catch (error) {
    console.error('Error creating uploads directory:', error);
    if (error.code !== 'EEXIST') {
      throw error;
    }
  }
  
  // Generate a unique filename
  const fileExtension = mimeType === 'image/jpeg' ? 'jpg' : 'png';
  const filename = `${userId}_${Date.now()}.${fileExtension}`;
  const filepath = path.join(uploadsDir, filename);
  
  console.log(`Saving image as: ${filename}`);
  
  try {
    // Save the file
    await writeFileAsync(filepath, buffer);
    console.log('Image saved successfully');
    
    // Return the relative path for storing in database
    const relativePath = `/uploads/${filename}`;
    console.log('Relative path for database:', relativePath);
    return relativePath;
  } catch (error) {
    console.error('Error saving image file:', error);
    throw new Error(`Failed to save image: ${error.message}`);
  }
}; 
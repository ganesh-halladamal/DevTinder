// Serve static files
const uploadsPath = path.join(__dirname, '../uploads');
console.log('Serving uploads from:', uploadsPath);
console.log('Uploads will be accessible at: http://localhost:[PORT]/uploads/[filename]');
app.use('/uploads', express.static(uploadsPath));

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
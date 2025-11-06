# DevTinder 🚀

A developer-focused networking platform inspired by Tinder, designed to connect developers for collaboration, mentorship, and networking.

## Repositories

- **Frontend**: [DevTinder](https://github.com/ganesh-halladamal/DevTinder) (Current Repository)
- **Backend**: [DevTinder-Server](https://github.com/ganesh-halladamal/DevTiner-Server)

## Features

- 👤 User Authentication & Profiles
  - Email/password signup
  - OAuth integration (GitHub, Google)
  - Customizable developer profiles
  - Skills and project showcase

- 🔄 Matching System
  - Tinder-style swiping interface
  - Smart matching based on skills and interests
  - Project compatibility scoring

- 💬 Real-time Chat
  - Instant messaging between matches
  - Code snippet sharing
  - Read receipts and typing indicators

- 🔍 Advanced Search & Filters
  - Filter by skills, interests, or location
  - Project type matching
  - Experience level compatibility

## Tech Stack

### Backend
- Node.js
- Express.js
- MongoDB
- Socket.IO for real-time communication
- JWT & Passport.js for authentication

### Frontend
- React with TypeScript
- Vite for build tooling
- TailwindCSS & ShadCN UI
- Zustand for state management
- Socket.IO client

## Getting Started

### Prerequisites
- Node.js (v16.20.1 or higher)
- MongoDB
- npm or yarn

### Installation & Setup

1. Clone the repositories
```bash
# Clone frontend
git clone https://github.com/ganesh-halladamal/DevTinder.git
cd DevTinder

# Clone backend (in a separate directory)
git clone https://github.com/ganesh-halladamal/DevTiner-Server.git
```

2. Backend Setup
```bash
cd DevTiner-Server
npm install
# Create .env file with required environment variables
npm run dev
```

Required backend environment variables (.env):
```env
PORT=5000
NODE_ENV=development
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
JWT_EXPIRES_IN=7d
FRONTEND_URL=http://localhost:5173
GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
```

3. Frontend Setup
```bash
cd DevTinder
npm install
# Create .env file with required environment variables
npm run dev
```

Required frontend environment variables (.env):
```env
VITE_API_URL=http://localhost:5000/api
VITE_SOCKET_URL=http://localhost:5000
VITE_GITHUB_CLIENT_ID=your_github_client_id
VITE_GOOGLE_CLIENT_ID=your_google_client_id
VITE_REDIRECT_URL=http://localhost:5173
```

### Running the Application

1. Start the backend server:
```bash
cd DevTiner-Server
npm run dev
```

2. Start the frontend development server:
```bash
cd DevTinder
npm run dev
```

The application will be available at:
- Frontend: http://localhost:5173 (Vite default port)
- Backend API: http://localhost:5000
- API Documentation: http://localhost:5000/api-docs

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Author

Ganesh Halladamal







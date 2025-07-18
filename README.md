# DevTinder 🚀

A developer-focused networking platform inspired by Tinder, designed to connect developers for collaboration, mentorship, and networking.

## Features

- 👤 User Authentication & Profiles
- 🔄 Tinder-style Swiping Interface
- 💬 Real-time Chat
- 🔍 Advanced Developer Search
- 📂 Project Showcase
- 👮‍♂️ Admin Panel & Moderation

## Tech Stack

### Backend
- Node.js
- Express.js
- MongoDB
- Socket.IO for real-time communication
- JWT for authentication

### Frontend
- React
- Material-UI & ShadCN
- Context API/Redux for state management
- Socket.IO client

## Getting Started

### Prerequisites
- Node.js (v18 or higher)
- MongoDB
- npm or yarn

### Installation

1. Clone the repository
```bash
git clone https://github.com/yourusername/devtinder.git
cd devtinder
```

2. Install backend dependencies
```bash
cd backend
npm install
```

3. Install frontend dependencies
```bash
cd ../frontend
npm install
```

4. Set up environment variables
- Create `.env` files in both backend and frontend directories
- Follow the `.env.example` templates

5. Start the development servers
```bash
# Backend (from backend directory)
npm run dev

# Frontend (from frontend directory)
npm run dev
```

## Project Structure

```
devtinder/
├── backend/              # Express.js server
│   ├── src/
│   │   ├── config/      # Configuration files
│   │   ├── controllers/ # Route controllers
│   │   ├── middleware/  # Custom middleware
│   │   ├── models/      # MongoDB models
│   │   ├── routes/      # API routes
│   │   ├── services/    # Business logic
│   │   └── utils/       # Utility functions
│   └── tests/           # Backend tests
├── frontend/            # React application
│   ├── src/
│   │   ├── components/ # Reusable components
│   │   ├── context/    # React Context
│   │   ├── hooks/      # Custom hooks
│   │   ├── pages/      # Page components
│   │   ├── services/   # API services
│   │   └── utils/      # Utility functions
│   └── tests/          # Frontend tests
└── README.md           # Project documentation
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details. 
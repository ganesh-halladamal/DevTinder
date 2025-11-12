# API Configuration Guide

## Overview

All API endpoints are now prefixed with `/api` to match the backend deployment on AWS.

## Environment Configuration

### Development

Create a `.env` or `.env.local` file in the frontend root:

```env
VITE_API_URL=http://localhost:5000/api
VITE_SOCKET_URL=http://localhost:5000
VITE_APP_NAME=DevTinder
VITE_GITHUB_CLIENT_ID=your_github_client_id
VITE_GOOGLE_CLIENT_ID=your_google_client_id
VITE_REDIRECT_URL=http://localhost:5173
```

### Production

Create a `.env.production` file:

```env
VITE_API_URL=https://your-backend-domain.com/api
VITE_SOCKET_URL=https://your-backend-domain.com
VITE_APP_NAME=DevTinder
VITE_GITHUB_CLIENT_ID=your_production_github_client_id
VITE_GOOGLE_CLIENT_ID=your_production_google_client_id
VITE_REDIRECT_URL=https://your-frontend-domain.com
```

## API Endpoints

All endpoints are automatically prefixed with `/api` by the axios instance:

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `GET /api/auth/me` - Get current user

### Users
- `GET /api/users` - Get users list
- `GET /api/users/profile/:id` - Get user profile
- `PUT /api/users/profile` - Update user profile
- `GET /api/users/matches/potential` - Get potential matches
- `POST /api/users/matches/like/:userId` - Like a user
- `POST /api/users/matches/dislike/:userId` - Dislike a user

### Matches
- `GET /api/matches/my-matches` - Get user's matches
- `GET /api/matches/:matchId` - Get match details
- `GET /api/matches/potential` - Get potential matches
- `POST /api/matches/like/:userId` - Like a user
- `POST /api/matches/dislike/:userId` - Dislike a user
- `POST /api/matches/reject` - Reject a user
- `PUT /api/matches/:matchId/bookmark` - Toggle bookmark
- `PUT /api/matches/:matchId/status` - Update match status

### Messages
- `GET /api/messages/conversations` - Get all conversations
- `GET /api/messages/conversation/:userId` - Get or create conversation
- `GET /api/messages/:conversationId` - Get messages
- `GET /api/messages/:conversationId/preview` - Get message preview
- `POST /api/messages/:conversationId` - Send message
- `POST /api/messages/:conversationId/read` - Mark as read
- `GET /api/messages/unread/counts` - Get unread counts

### Projects
- `GET /api/projects/user/:userId` - Get user projects
- `POST /api/projects` - Add project
- `PUT /api/projects/:id` - Update project
- `DELETE /api/projects/:id` - Delete project

### Settings
- `GET /api/settings` - Get user settings
- `PUT /api/settings` - Update settings
- `DELETE /api/settings/account` - Delete account

### Notifications
- `GET /api/notifications` - Get notifications
- `GET /api/notifications/unread-count` - Get unread count
- `PUT /api/notifications/:id/read` - Mark as read
- `PUT /api/notifications/read-all` - Mark all as read
- `DELETE /api/notifications/:id` - Delete notification

## Backend CORS Configuration

Ensure your backend `.env` includes:

```env
FRONTEND_URL=https://your-frontend-domain.com
CORS_ORIGIN=https://your-frontend-domain.com
```

For development:
```env
FRONTEND_URL=http://localhost:5173
CORS_ORIGIN=http://localhost:5173
```

## Socket.IO Configuration

Socket.IO connects to the URL specified in `VITE_SOCKET_URL`:
- Development: `http://localhost:5000`
- Production: `https://your-backend-domain.com`

The socket service automatically handles authentication using JWT tokens.

## Testing the Configuration

1. Start the backend server
2. Start the frontend development server
3. Check browser console for connection logs:
   - "API URL: http://localhost:5000/api"
   - "Connecting to socket at: http://localhost:5000"

## Troubleshooting

### CORS Errors
- Verify `FRONTEND_URL` in backend `.env` matches your frontend URL
- Check backend CORS middleware configuration

### 404 Errors
- Ensure all API calls use the `/api` prefix
- Verify `VITE_API_URL` includes `/api` at the end

### Socket Connection Issues
- Check `VITE_SOCKET_URL` points to backend root (without `/api`)
- Verify WebSocket is enabled on your backend server
- Check firewall/security group settings in AWS

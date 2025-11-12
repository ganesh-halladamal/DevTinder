# Deployment Checklist

## Frontend Configuration ✅

- [x] Updated `.env` with development API URLs
- [x] Created `.env.production` with production placeholders
- [x] Created `.env.example` for reference
- [x] Updated `src/services/api.ts` to use correct base URL
- [x] Fixed `src/services/socket.ts` import and configuration
- [x] All API endpoints use `/api` prefix automatically

## Backend Configuration (To Do)

- [ ] Update backend `.env` with production settings:
  - [ ] `FRONTEND_URL=https://your-frontend-domain.com`
  - [ ] `CORS_ORIGIN=https://your-frontend-domain.com`
  - [ ] Verify all routes are mounted under `/api`
  
## Before Deploying to Production

### Frontend
1. [ ] Update `.env.production` with actual AWS backend URL
2. [ ] Update OAuth client IDs for production
3. [ ] Build the frontend: `npm run build`
4. [ ] Test the production build locally: `npm run preview`

### Backend
1. [ ] Verify CORS configuration allows production frontend URL
2. [ ] Ensure all routes are under `/api` prefix
3. [ ] Update environment variables in AWS
4. [ ] Test API endpoints with production URL

### Testing
1. [ ] Test authentication flow
2. [ ] Test user profile operations
3. [ ] Test matching functionality
4. [ ] Test real-time messaging
5. [ ] Test Socket.IO connection
6. [ ] Verify OAuth redirects work correctly

## API Endpoint Structure

All endpoints should follow this pattern:
```
https://your-backend-domain.com/api/{resource}/{action}
```

Examples:
- `https://your-backend-domain.com/api/auth/login`
- `https://your-backend-domain.com/api/users/profile/123`
- `https://your-backend-domain.com/api/matches/my-matches`

## Environment Variables Reference

### Frontend (.env.production)
```env
VITE_API_URL=https://your-backend-domain.com/api
VITE_SOCKET_URL=https://your-backend-domain.com
VITE_APP_NAME=DevTinder
VITE_GITHUB_CLIENT_ID=production_github_client_id
VITE_GOOGLE_CLIENT_ID=production_google_client_id
VITE_REDIRECT_URL=https://your-frontend-domain.com
```

### Backend (.env)
```env
PORT=5000
NODE_ENV=production
MONGODB_URI=production_mongodb_uri
JWT_SECRET=production_jwt_secret
JWT_EXPIRES_IN=7d
FRONTEND_URL=https://your-frontend-domain.com
CORS_ORIGIN=https://your-frontend-domain.com
GITHUB_CLIENT_ID=production_github_client_id
GITHUB_CLIENT_SECRET=production_github_client_secret
GOOGLE_CLIENT_ID=production_google_client_id
GOOGLE_CLIENT_SECRET=production_google_client_secret
```

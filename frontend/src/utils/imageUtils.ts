import { API_URL } from '../services/api';

export const formatAvatarUrl = (avatarPath?: string) => {
  if (!avatarPath) return '/default-avatar.png';
  
  if (avatarPath.startsWith('http://') || avatarPath.startsWith('https://')) {
    return avatarPath;
  }
  
  // Remove any leading slashes and 'uploads/' if present
  const path = avatarPath.replace(/^\/?(uploads\/)?/, '');
  
  // Construct the full URL using the base API URL
  const baseUrl = API_URL.replace(/\/api\/?$/, '');
  return `${baseUrl}/uploads/${path}`;
};

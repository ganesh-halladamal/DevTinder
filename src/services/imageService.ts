/**
 * Formats the URL for avatar images
 * @param avatarPath - The path to the avatar image
 * @returns The complete URL to the avatar image
 */
export const formatAvatarUrl = (avatarPath?: string): string => {
  if (!avatarPath || avatarPath.trim() === '') return '/default-avatar.png';
  
  if (avatarPath.startsWith('http://') || avatarPath.startsWith('https://')) {
    return avatarPath;
  }
  
  // Remove any leading slashes and 'uploads/' if present
  const path = avatarPath.replace(/^\/?(uploads\/)?/, '');
  
  // Construct the full URL using the base API URL from environment
  const baseUrl = import.meta.env.VITE_API_URL?.replace(/\/api\/?$/, '') || 'http://localhost:5000';
  return `${baseUrl}/uploads/${path}`;
};

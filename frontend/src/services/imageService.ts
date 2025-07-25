/**
 * Formats the URL for avatar images
 * @param avatarPath - The path to the avatar image
 * @returns The complete URL to the avatar image
 */
export const formatAvatarUrl = (avatarPath?: string): string => {
  if (!avatarPath) return '/default-avatar.png';
  
  if (avatarPath.startsWith('http://') || avatarPath.startsWith('https://')) {
    return avatarPath;
  }
  
  const baseUrl = import.meta.env.VITE_API_URL?.replace(/\/api$/, '') || 'http://localhost:5000';
  
  // Clean up the avatar path
  const cleanPath = avatarPath.startsWith('/') ? avatarPath : `/${avatarPath}`;
  
  // Handle both /uploads and /api/uploads paths
  if (cleanPath.startsWith('/uploads/')) {
    return `${baseUrl}${cleanPath}`;
  } else {
    return `${baseUrl}/uploads${cleanPath.startsWith('/') ? cleanPath : `/${cleanPath}`}`;
  }
};

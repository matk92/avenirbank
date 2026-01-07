/**
 * API Configuration
 * Handles API URL resolution for both client and server environments
 */

export function getApiUrl(): string {
  // Client-side: use NEXT_PUBLIC_API_URL or relative path through Nginx
  if (typeof window !== 'undefined') {
    return process.env.NEXT_PUBLIC_API_URL || '/api';
  }

  // Server-side: use INTERNAL_API_URL for internal communication
  return process.env.INTERNAL_API_URL || 'http://localhost:3001';
}

export function getBackendUrl(): string {
  // For server-side operations, get the full backend URL
  if (typeof window !== 'undefined') {
    // Client-side shouldn't call this, but fallback to API URL
    return process.env.NEXT_PUBLIC_API_URL || '/api';
  }

  // Server-side: use internal URL for backend communication
  return process.env.INTERNAL_API_URL || 'http://localhost:3001';
}

/**
 * Build a full API endpoint URL
 * @param path - The API path (e.g., '/auth/register')
 * @returns Full URL for the API endpoint
 */
export function buildApiUrl(path: string): string {
  const baseUrl = getApiUrl();
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${baseUrl}${cleanPath}`;
}

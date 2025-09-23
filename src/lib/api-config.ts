// API configuration utilities

/**
 * Get the base URL for API requests
 * Uses REACT_APP_API_URL environment variable for Express server URL
 */
export function getApiBaseUrl(): string {
  // Use environment variable for API URL (points to Express server)
  const apiUrl = process.env.REACT_APP_API_URL;
  
  if (apiUrl) {
    return apiUrl;
  }
  
  // Fallback for local development
  return 'http://localhost:3001/api';
}

/**
 * Get the API endpoint URL
 * Returns full URL to Express server endpoint
 */
export function getApiEndpoint(endpoint: string): string {
  // Ensure endpoint starts with /
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  
  // Get base URL and append endpoint
  const baseUrl = getApiBaseUrl();
  
  // If baseUrl already includes /api, don't add it again
  if (baseUrl.endsWith('/api')) {
    return `${baseUrl}${cleanEndpoint}`;
  }
  
  return `${baseUrl}/api${cleanEndpoint}`;
}
// API configuration utilities

/**
 * Get the base URL for API requests
 * Uses REACT_APP_API_URL environment variable for Express server URL
 */
export function getApiBaseUrl(): string {
  const apiUrl = import.meta.env.VITE_API_URL;
  const isDevelopment = import.meta.env.DEV;
  
  // In production, API URL must be set
  if (!isDevelopment && !apiUrl) {
    throw new Error(
      'VITE_API_URL environment variable is required in production. ' +
      'Please set it to your Express server URL (e.g., https://your-api.onrender.com/api)'
    );
  }
  
  // Use environment variable if available
  if (apiUrl) {
    return apiUrl;
  }
  
  // Development fallback only
  if (isDevelopment) {
    return 'http://localhost:3001/api';
  }
  
  // This should never be reached due to the error above
  throw new Error('Unable to determine API URL');
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

/**
 * Debug function to log current API configuration
 * Useful for troubleshooting in production
 */
export function debugApiConfig(): void {
  console.log('🔧 API Configuration Debug:');
  console.log('MODE:', import.meta.env.MODE);
  console.log('DEV:', import.meta.env.DEV);
  console.log('PROD:', import.meta.env.PROD);
  console.log('VITE_API_URL:', import.meta.env.VITE_API_URL);
  try {
    const baseUrl = getApiBaseUrl();
    console.log('Resolved API Base URL:', baseUrl);
    console.log('Example endpoint URL:', getApiEndpoint('/health'));
  } catch (error) {
    console.error('❌ API Configuration Error:', error);
  }
}
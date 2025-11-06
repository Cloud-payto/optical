# URL Generation Fix - Test Cases

## ✅ Fixed Double Slash Issue

### Before (❌ Broken):
```
VITE_API_URL = "https://optical-express-api.onrender.com/api"
getApiEndpoint("/emails/1") = "https://optical-express-api.onrender.com/api//emails/1"
                                                                          ↑↑ Double slash
```

### After (✅ Fixed):
```
VITE_API_URL = "https://optical-express-api.onrender.com/api"
getApiEndpoint("/emails/1") = "https://optical-express-api.onrender.com/api/emails/1"
                                                                          ↑ Single slash
```

## Test Cases

### Case 1: VITE_API_URL with /api suffix
```javascript
// Environment: VITE_API_URL = "https://optical-express-api.onrender.com/api"
getApiBaseUrl() → "https://optical-express-api.onrender.com/api"
getApiEndpoint("/emails/1") → "https://optical-express-api.onrender.com/api/emails/1"
getApiEndpoint("/health") → "https://optical-express-api.onrender.com/api/health"
getApiEndpoint("inventory/123") → "https://optical-express-api.onrender.com/api/inventory/123"
```

### Case 2: VITE_API_URL with trailing slash
```javascript
// Environment: VITE_API_URL = "https://optical-express-api.onrender.com/api/"
getApiBaseUrl() → "https://optical-express-api.onrender.com/api/"
// After normalization in getApiEndpoint:
getApiEndpoint("/emails/1") → "https://optical-express-api.onrender.com/api/emails/1"
```

### Case 3: VITE_API_URL without /api suffix (domain only)
```javascript
// Environment: VITE_API_URL = "https://optical-express-api.onrender.com"
getApiBaseUrl() → "https://optical-express-api.onrender.com"
getApiEndpoint("/emails/1") → "https://optical-express-api.onrender.com/api/emails/1"
```

### Case 4: Development fallback
```javascript
// Environment: VITE_API_URL not set, import.meta.env.DEV = true
getApiBaseUrl() → "http://localhost:3001/api"
getApiEndpoint("/emails/1") → "http://localhost:3001/api/emails/1"
```

## How the Fix Works

1. **Normalize base URL**: Remove trailing slash from base URL
2. **Check for /api suffix**: If base URL ends with `/api`, append endpoint directly
3. **Clean endpoint**: Ensure endpoint starts with `/` but no double slashes
4. **Concatenate safely**: Join base URL and endpoint with proper slash handling

## Code Changes Made

```typescript
// OLD (caused double slash):
export function getApiEndpoint(endpoint: string): string {
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const baseUrl = getApiBaseUrl();
  
  if (baseUrl.endsWith('/api')) {
    return `${baseUrl}${cleanEndpoint}`; // Could create double slash
  }
  
  return `${baseUrl}/api${cleanEndpoint}`;
}

// NEW (prevents double slash):
export function getApiEndpoint(endpoint: string): string {
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const baseUrl = getApiBaseUrl().replace(/\/$/, ''); // Remove trailing slash
  
  if (baseUrl.endsWith('/api')) {
    return `${baseUrl}${cleanEndpoint}`; // Safe now
  }
  
  return `${baseUrl}/api${cleanEndpoint}`;
}
```

## Testing Your Deployment

After deployment, you can test the URL generation in the browser console:

```javascript
import { debugApiConfig } from './lib/api-config';
debugApiConfig();
```

This will show you exactly what URLs are being generated.
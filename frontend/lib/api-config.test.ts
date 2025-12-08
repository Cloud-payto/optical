// Test file to verify API configuration logic
// This is for documentation purposes - not actually run in the build

import { getApiBaseUrl } from './api-config';

// Test scenarios:

// 1. Development with no env var set
// import.meta.env.DEV = true
// import.meta.env.VITE_API_URL = undefined
// Expected: 'http://localhost:3001/api'

// 2. Development with env var set
// import.meta.env.DEV = true
// import.meta.env.VITE_API_URL = 'https://my-api.onrender.com/api'
// Expected: 'https://my-api.onrender.com/api'

// 3. Production with env var set
// import.meta.env.DEV = false
// import.meta.env.VITE_API_URL = 'https://my-api.onrender.com/api'
// Expected: 'https://my-api.onrender.com/api'

// 4. Production with no env var set
// import.meta.env.DEV = false
// import.meta.env.VITE_API_URL = undefined
// Expected: Error thrown

export {};
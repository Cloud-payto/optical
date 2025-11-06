# Environment Variables Checklist

## Required Environment Variables for Production

### Vite React App (Static Site on Render/Vercel)
```bash
# REQUIRED: URL to your Express server API
VITE_API_URL=https://your-express-app.onrender.com/api

# REQUIRED: Supabase client credentials
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# OPTIONAL: Base URL for the React app itself
VITE_BASE_URL=https://your-react-app.onrender.com
```

### Express Server (Web Service on Render)
```bash
# REQUIRED: Supabase server credentials
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# REQUIRED: CORS configuration
CORS_ORIGIN=https://your-react-app.onrender.com

# OPTIONAL: Environment and port (usually auto-set by Render)
NODE_ENV=production
PORT=10000

# OPTIONAL: Webhook and API keys
EMAIL_WEBHOOK_SECRET=your-cloudmailin-secret
SAFILO_API_KEY=your-safilo-api-key
MODERN_OPTICAL_API_KEY=your-modern-optical-api-key
```

## Testing Your Configuration

### 1. Local Development
```bash
# In your React app directory
npm run dev
# Should connect to http://localhost:3001/api
```

### 2. Production Build Test
```bash
# Test build without deploying
npm run build
# Should succeed without errors
```

### 3. Production Runtime Check
Once deployed, you can add this to your React app to debug API configuration:

```javascript
import { debugApiConfig } from './lib/api-config';

// Add this in development tools console
debugApiConfig();
```

### 4. API Health Check
Visit these URLs after deployment:
- Express Health: `https://your-express-app.onrender.com/health`
- API Health: `https://your-express-app.onrender.com/api/health`

## Common Issues

### ❌ "localhost:3001" in Production
- **Problem**: React app still trying to connect to localhost
- **Solution**: Ensure `REACT_APP_API_URL` is set in production environment

### ❌ CORS Errors
- **Problem**: Express server rejecting requests from React app
- **Solution**: Set `CORS_ORIGIN` in Express server to match React app URL

### ❌ "VITE_API_URL environment variable is required"
- **Problem**: Missing environment variable in production
- **Solution**: Add `VITE_API_URL` to your deployment platform

### ❌ Supabase Connection Failed
- **Problem**: Invalid Supabase credentials
- **Solution**: Verify `SUPABASE_URL` and service keys are correct

## Environment Variable Sources

### From Vercel (Copy These)
- `SUPABASE_URL` → Use for both React and Express
- `SUPABASE_ANON_KEY` → Use as `VITE_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` → Use for Express server

### Set After Deployment
- `VITE_API_URL` → Set to your deployed Express server URL
- `CORS_ORIGIN` → Set to your deployed React app URL
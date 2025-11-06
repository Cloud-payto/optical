# Vite Environment Variables Guide

## ✅ Fixed: Now Using Vite Environment Variables

The React app now correctly uses Vite's `import.meta.env.VITE_*` syntax instead of Create React App's `process.env.REACT_APP_*`.

## Environment Variable Syntax

### ❌ Old (Incorrect for Vite):
```javascript
process.env.REACT_APP_API_URL
process.env.REACT_APP_SUPABASE_URL
process.env.NODE_ENV
```

### ✅ New (Correct for Vite):
```javascript
import.meta.env.VITE_API_URL
import.meta.env.VITE_SUPABASE_URL
import.meta.env.DEV // true in development
import.meta.env.PROD // true in production
import.meta.env.MODE // 'development' or 'production'
```

## Required Environment Variables

### Development (.env.local):
```bash
VITE_API_URL=http://localhost:3001/api
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

### Production (Deployment Platform):
```bash
VITE_API_URL=https://your-express-app.onrender.com/api
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

## How It Works Now

### Development Mode:
- If `VITE_API_URL` is set → uses that URL
- If `VITE_API_URL` is not set → defaults to `http://localhost:3001/api`

### Production Mode:
- If `VITE_API_URL` is set → uses that URL
- If `VITE_API_URL` is not set → **throws error** ❌

## Testing Your Configuration

### 1. Debug in Browser Console:
```javascript
import { debugApiConfig } from './lib/api-config';
debugApiConfig();
```

### 2. Check Environment Variables:
```javascript
console.log('API URL:', import.meta.env.VITE_API_URL);
console.log('Supabase URL:', import.meta.env.VITE_SUPABASE_URL);
console.log('Development mode:', import.meta.env.DEV);
console.log('Production mode:', import.meta.env.PROD);
```

## Important Notes

1. **Vite only exposes variables that start with `VITE_`**
2. **Environment variables are embedded at build time**
3. **Restart dev server after changing environment variables**
4. **Never commit real API keys to version control**

## File Structure Updated:
- ✅ `src/lib/api-config.ts` - Uses `import.meta.env.VITE_API_URL`
- ✅ `src/lib/supabase.ts` - Uses `import.meta.env.VITE_SUPABASE_*`
- ✅ `src/lib/utils.ts` - Uses `import.meta.env.VITE_BASE_URL`
- ✅ `src/env.d.ts` - TypeScript definitions for environment variables
- ✅ `.env.example` - Updated with `VITE_` prefixes
- ✅ All documentation updated
# Supabase Authentication Debugging Guide

This guide helps diagnose and fix Supabase authentication issues in production.

## Quick Checks

1. **Access the Debug Page**
   ```
   https://your-app.vercel.app/debug
   ```
   This page shows:
   - Environment variable status
   - Supabase configuration
   - Browser environment
   - Connection test results

2. **Check Browser Console**
   Look for these log messages:
   ```
   [SUPABASE INIT] Starting Supabase client initialization...
   [SUPABASE INIT] URL present: true/false
   [SUPABASE INIT] Key present: true/false
   [AUTH CONTEXT] Initializing authentication...
   ```

## Common Issues & Solutions

### Issue: "Cannot read properties of undefined (reading 'session')"
**Cause:** Supabase client is undefined
**Solution:** 
1. Check if environment variables are set in Vercel
2. Ensure variables are prefixed with `VITE_`
3. Redeploy after setting variables

### Issue: Environment variables not available in production
**Possible Causes:**
1. Variables not set in Vercel dashboard
2. Build cache issue
3. Variables not exposed during build

**Solutions:**
1. In Vercel Dashboard:
   - Go to Settings → Environment Variables
   - Add: `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`
   - Ensure they're enabled for Production
   
2. Force rebuild:
   ```bash
   vercel --force
   ```

3. Clear build cache in Vercel:
   - Settings → Advanced → Delete Build Cache

### Issue: Authentication works locally but not in production
**Check:**
1. Supabase project is not paused
2. API keys are for the correct project
3. CORS is configured in Supabase

## Debugging Steps

### 1. Validate Environment Variables

**Local:**
```bash
npm run validate:env
```

**In Vercel:**
- Check build logs for `[VITE CONFIG]` messages
- Look for "Environment variables loaded: X" count

### 2. Test Supabase Connection

**Via Debug Page:**
1. Navigate to `/debug`
2. Click "Test Supabase Connection"
3. Check results and console logs

**Via API:**
```bash
curl https://your-api.onrender.com/api/health
```

### 3. Check Build Output

In Vercel build logs, look for:
```
[VITE DEBUG] Environment variables:
[VITE DEBUG]   VITE_SUPABASE_URL: https://...
[VITE DEBUG]   VITE_SUPABASE_ANON_KEY: [REDACTED]
```

### 4. Verify in Browser

1. Open DevTools Console
2. Look for initialization logs
3. Check Network tab for failed Supabase requests
4. Verify no CORS errors

## Build-Time Validation

The app includes automatic validation:

1. **Pre-build validation** (`npm run prebuild`)
   - Checks required environment variables
   - Creates `env-validation.json` report

2. **Vite Debug Plugin**
   - Logs configuration during build
   - Injects debug meta tags in HTML

3. **Runtime checks**
   - Graceful fallbacks for missing config
   - Detailed error messages

## Manual Verification

### Check if import.meta.env is available:
```javascript
console.log('import.meta:', typeof import.meta);
console.log('import.meta.env:', typeof import.meta.env);
console.log('VITE vars:', Object.keys(import.meta.env).filter(k => k.startsWith('VITE_')));
```

### Test Supabase directly:
```javascript
import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL;
const key = import.meta.env.VITE_SUPABASE_ANON_KEY;

console.log('Config:', { url: !!url, key: !!key });

if (url && key) {
  const client = createClient(url, key);
  client.auth.getSession().then(console.log).catch(console.error);
}
```

## Deployment Checklist

Before deploying:

- [ ] Run `npm run validate:env` locally
- [ ] Check `.env.local` has correct values
- [ ] Verify Vercel has environment variables set
- [ ] Variables are enabled for Production environment
- [ ] Clear Vercel build cache if updating variables
- [ ] Check Supabase project is active (not paused)

After deploying:

- [ ] Visit `/debug` page
- [ ] Check browser console for errors
- [ ] Test authentication flow
- [ ] Verify API health endpoint

## Getting Help

1. **Collect Debug Info:**
   - Visit `/debug` and download debug info
   - Copy console logs
   - Note error messages

2. **Check Logs:**
   - Vercel: Function logs
   - Browser: Console logs
   - API: Health endpoint response

3. **Common Fixes:**
   - Redeploy with `vercel --force`
   - Clear browser cache
   - Regenerate Supabase API keys
   - Check Supabase service status

## Emergency Fallback

If authentication is completely broken:
1. The app will show login page with error message
2. Users can access `/debug` without authentication
3. Error boundary will catch crashes and show diagnostic info
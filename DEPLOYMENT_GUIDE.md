# Deployment Guide: Express Server to Render.com + React App

## Prerequisites

You should have these environment variables available from your Vercel setup:
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `SUPABASE_ANON_KEY` (for React app)

## Step 1: Deploy Express Server to Render.com

### 1.1 Prepare the Server
```bash
cd server
npm install
```

### 1.2 Deploy to Render
1. Go to [Render.com](https://render.com) and sign up/login
2. Click "New +" → "Web Service"
3. Connect your GitHub repository
4. Configure the service:
   - **Name**: `optiprofit-express-api`
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Health Check Path**: `/health`

### 1.3 Set Environment Variables in Render
Go to Environment tab and add:
```
NODE_ENV=production
PORT=10000
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
CORS_ORIGIN=https://your-react-app.onrender.com
EMAIL_WEBHOOK_SECRET=your-cloudmailin-secret
```

### 1.4 Deploy
Click "Create Web Service" and wait for deployment to complete.

## Step 2: Deploy React App

### 2.1 Update React Environment Variables
Create `.env.production` in the root directory:
```
REACT_APP_SUPABASE_URL=https://your-project.supabase.co
REACT_APP_SUPABASE_ANON_KEY=your-supabase-anon-key
REACT_APP_API_URL=https://your-express-app.onrender.com/api
```

### 2.2 Deploy React App to Render
1. Click "New +" → "Static Site"
2. Connect your GitHub repository
3. Configure:
   - **Name**: `optiprofit-react-app`
   - **Build Command**: `npm run build`
   - **Publish Directory**: `dist`

### 2.3 Set React Environment Variables
In the Environment tab, add:
```
REACT_APP_SUPABASE_URL=https://your-project.supabase.co
REACT_APP_SUPABASE_ANON_KEY=your-supabase-anon-key
REACT_APP_API_URL=https://your-express-app.onrender.com/api
```

## Step 3: Update CORS Configuration

After both apps are deployed:
1. Go back to your Express server on Render
2. Update the `CORS_ORIGIN` environment variable to your React app's URL:
   ```
   CORS_ORIGIN=https://your-react-app.onrender.com
   ```
3. Redeploy the Express server

## Step 4: Configure Webhooks

### CloudMailin Webhook URL
Update your CloudMailin webhook URL to:
```
https://your-express-app.onrender.com/api/webhook/email
```

## Step 5: Verify Deployment

### Check Express Server Health
Visit: `https://your-express-app.onrender.com/health`

Should return:
```json
{
  "status": "OK",
  "message": "Express server is running",
  "timestamp": "2025-01-23T...",
  "uptime": 123.45,
  "version": "1.0.0"
}
```

### Check API Endpoints
Visit: `https://your-express-app.onrender.com/api/health`

### Test React App
Visit your React app URL and verify:
- App loads correctly
- API calls work (check browser network tab)
- No CORS errors in console

## Step 6: Database Schema Setup

Make sure your Supabase database has the required tables. You may need to run migrations or create tables manually:

### Required Tables:
- `emails` - for storing processed emails
- `inventory` - for inventory items
- `orders` - for order tracking
- `accounts` - for user accounts (if using multi-tenancy)

## Troubleshooting

### Common Issues:

1. **CORS Errors**: Make sure `CORS_ORIGIN` in Express server matches your React app URL exactly

2. **Supabase Connection Failed**: Verify `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are correct

3. **Health Check Failing**: Make sure `/health` endpoint is accessible and returns 200 status

4. **Environment Variables Not Loading**: Ensure all environment variables are set correctly in Render dashboard

### Logs
- Express Server logs: Render dashboard → your service → Logs tab
- React App build logs: Render dashboard → your static site → Events tab

## Security Notes

- Never commit real environment variables to git
- Use Render's environment variable encryption
- Regularly rotate API keys and secrets
- Monitor access logs for unusual activity
# Vercel Deployment Migration Guide

## Overview
This guide helps you migrate your optical business intelligence platform to Vercel.

## Pre-Deployment Checklist

### 1. Database Setup
- [ ] Create a Vercel Postgres database or connect external PostgreSQL
- [ ] Run the schema migration: `database/schema.sql`
- [ ] Update `DATABASE_URL` in Vercel environment variables

### 2. Environment Variables
Copy `.env.example` to `.env.local` and update all values in Vercel dashboard:

Required:
- `DATABASE_URL`
- `NEXTAUTH_SECRET` (generate with `openssl rand -base64 32`)
- `JWT_SECRET`
- `EMAIL_WEBHOOK_SECRET`

Optional:
- Vendor API keys
- AWS credentials for file storage
- Stripe keys for payments
- SendGrid for emails

### 3. CloudMailin Configuration
1. Create CloudMailin account
2. Set webhook URL to: `https://your-domain.vercel.app/api/webhook`
3. Add `EMAIL_WEBHOOK_SECRET` to authenticate requests

### 4. File Structure Changes

#### From (Current):
```
project/
├── server/          # Express backend
├── src/            # React frontend
└── vendor-comparison/
```

#### To (Vercel-Ready):
```
optical-app/
├── api/            # Vercel serverless functions
├── frontend/       # Next.js app
├── services/       # Shared business logic
├── lib/           # Utilities
└── database/      # Schema and migrations
```

## Deployment Steps

### 1. Install Dependencies
```bash
cd optical-app
npm install
```

### 2. Test Locally
```bash
npm run dev
# Visit http://localhost:3000
```

### 3. Deploy to Vercel
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Follow prompts to link to your Vercel account
```

### 4. Configure Production
1. Go to Vercel Dashboard
2. Add all environment variables
3. Configure custom domain
4. Set up CloudMailin webhook

## API Endpoint Changes

### Old Express Routes → New Vercel Functions

| Old Route | New Route | Description |
|-----------|-----------|-------------|
| `/api/webhook/email` | `/api/webhook` | CloudMailin webhook |
| `/api/safilo/process` | `/api/parse-safilo` | Safilo PDF parser |
| `/api/orders` | `/api/orders` | Order management |
| `/api/inventory` | `/api/inventory` | Inventory tracking |

## Code Migration Examples

### Express Route → Vercel Function
```javascript
// Old (Express)
router.post('/process', upload.single('pdf'), async (req, res) => {
  // logic
});

// New (Vercel)
export default async function handler(req, res) {
  if (req.method === 'POST') {
    // logic
  }
}
```

### Database Calls
```javascript
// Old (JSON file)
const { saveEmail } = require('./db/database');

// New (PostgreSQL)
import { saveEmail } from '../lib/database';
```

## Testing

### Local Testing
```bash
# Run tests
npm test

# Test API endpoints
curl http://localhost:3000/api/webhook
```

### Production Testing
1. Send test email to CloudMailin address
2. Check Vercel Function logs
3. Verify data in database

## Monitoring

### Vercel Dashboard
- Function execution logs
- Performance metrics
- Error tracking

### Database Monitoring
- Query performance
- Connection pooling
- Storage usage

## Troubleshooting

### Common Issues

1. **Database Connection Errors**
   - Check `DATABASE_URL` format
   - Verify SSL settings
   - Check connection limits

2. **Function Timeouts**
   - PDF parsing may need extended timeout
   - Configure in `vercel.json`

3. **CORS Issues**
   - Headers configured in `vercel.json`
   - Check origin settings

4. **Environment Variables**
   - Must be set in Vercel dashboard
   - Not `.env` files in production

## Performance Optimization

1. **Database Indexes**
   - Already included in schema
   - Monitor slow queries

2. **Function Size**
   - Keep under 50MB compressed
   - Use dynamic imports

3. **Caching**
   - Use Vercel Edge Cache
   - Implement Redis for session data

## Security

1. **Authentication**
   - NextAuth.js configured
   - JWT tokens for API

2. **Rate Limiting**
   - Implement with Vercel Edge Middleware
   - Configure per endpoint

3. **Encryption**
   - API keys encrypted in database
   - Use environment variables

## Support

- Vercel Documentation: https://vercel.com/docs
- Next.js Documentation: https://nextjs.org/docs
- PostgreSQL: https://www.postgresql.org/docs/

## Next Steps

1. Complete environment setup
2. Run database migrations
3. Deploy to Vercel
4. Configure CloudMailin
5. Test end-to-end flow
6. Monitor and optimize
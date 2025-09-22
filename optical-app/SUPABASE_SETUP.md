# Supabase Setup Guide

## Your Configuration

### Project Details
- **Project URL**: https://bllrhafpqvzqahwxauzg.supabase.co
- **API Key (anon)**: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJsbHJoYWZwcXZ6cWFod3hhdXpnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg1MDAzNDMsImV4cCI6MjA3NDA3NjM0M30.gk06EKic3gJvsyfIjTZDovEtWoPBezUBIeYF2HkBNuY

## Required Steps

### 1. Get Missing Credentials

You need to get these from your Supabase dashboard:

1. **Service Role Key**: 
   - Go to Settings → API
   - Copy the `service_role` key
   - Add to your `.env.local` file

2. **Database Password**:
   - Go to Settings → Database
   - Copy your database password
   - Update the DATABASE_URL in `.env.local`

### 2. Update .env.local File

Replace these placeholders in your `.env.local`:

```env
# Replace with your service role key
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.YOUR_SERVICE_ROLE_KEY_HERE

# Replace [YOUR-PASSWORD] with your actual database password
DATABASE_URL=postgresql://postgres:YOUR_ACTUAL_PASSWORD@db.bllrhafpqvzqahwxauzg.supabase.co:5432/postgres
```

### 3. Set Up Database Schema

1. Go to your Supabase dashboard
2. Navigate to SQL Editor
3. Copy and paste the contents of `database/schema.sql`
4. Run the SQL to create all tables

### 4. Configure RLS (Row Level Security)

Add these RLS policies in Supabase SQL Editor:

```sql
-- Enable RLS on all tables
ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE emails ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory ENABLE ROW LEVEL SECURITY;

-- Create policies for multi-tenant security
CREATE POLICY "Users can only see their own account data" ON accounts
    FOR ALL USING (id = auth.jwt() ->> 'account_id'::text);

CREATE POLICY "Users can only see their own user data" ON users
    FOR ALL USING (account_id::text = auth.jwt() ->> 'account_id'::text);

CREATE POLICY "Users can only see their own emails" ON emails
    FOR ALL USING (account_id::text = auth.jwt() ->> 'account_id'::text);

CREATE POLICY "Users can only see their own orders" ON orders
    FOR ALL USING (account_id::text = auth.jwt() ->> 'account_id'::text);

CREATE POLICY "Users can only see their own inventory" ON inventory
    FOR ALL USING (account_id::text = auth.jwt() ->> 'account_id'::text);
```

### 5. Set Up Storage Bucket

1. Go to Storage in Supabase dashboard
2. Create a new bucket named `optiprofit-files`
3. Set the bucket to public if needed for file access

### 6. Environment Variables for Deployment

When deploying to Vercel, add these environment variables:

```
NEXT_PUBLIC_SUPABASE_URL=https://bllrhafpqvzqahwxauzg.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJsbHJoYWZwcXZ6cWFod3hhdXpnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg1MDAzNDMsImV4cCI6MjA3NDA3NjM0M30.gk06EKic3gJvsyfIjTZDovEtWoPBezUBIeYF2HkBNuY
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
DATABASE_URL=postgresql://postgres:your-password@db.bllrhafpqvzqahwxauzg.supabase.co:5432/postgres
NEXTAUTH_SECRET=iWR2c9oQrxHea+647UheEvvDpNtqmqNg+yxqhfJM8Tg=
JWT_SECRET=LyvVD2UJwzrSbNxw3ULI6ewdwmk6pNQmHI8071gz9hI=
ENCRYPTION_KEY=92KL5oE2ae49kuqPENz0YFFLbS0KDBB8Zs9A8IqDm2o=
```

## Testing the Setup

### 1. Local Development

```bash
cd optical-app
npm install
npm run dev
```

Visit http://localhost:3000

### 2. Test Database Connection

Create a test user account or run API endpoints to verify Supabase connectivity.

### 3. Test Email Webhook

Set up CloudMailin webhook URL: `https://your-domain.com/api/webhook`

## Features Configured

### ✅ Database
- PostgreSQL with full schema
- Multi-tenant architecture
- Row Level Security
- Triggers and views

### ✅ Authentication
- NextAuth.js with Supabase
- JWT tokens
- Role-based access

### ✅ API Routes
- `/api/webhook` - Email processing
- `/api/parse-safilo` - Safilo parser
- `/api/parse-modern` - Modern Optical parser
- `/api/inventory` - Inventory management
- `/api/orders` - Order management
- `/api/dashboard/stats` - Dashboard statistics

### ✅ File Storage
- Supabase Storage for PDF attachments
- Public/private bucket configuration

### ✅ Real-time Features
- Supabase real-time subscriptions
- Live updates for inventory changes

## Troubleshooting

### Connection Issues
- Verify environment variables are correct
- Check Supabase project status
- Ensure database password is correct

### RLS Errors
- Verify RLS policies are created
- Check JWT token contains account_id
- Test with service role key for admin operations

### CORS Issues
- Verify CORS settings in vercel.json
- Check Supabase dashboard CORS configuration

## Next Steps

1. Complete environment variable setup
2. Run database migration
3. Test local development
4. Deploy to Vercel
5. Configure CloudMailin webhook
6. Test end-to-end email processing

## Support

- Supabase Docs: https://supabase.com/docs
- Next.js Docs: https://nextjs.org/docs
- NextAuth.js Docs: https://next-auth.js.org
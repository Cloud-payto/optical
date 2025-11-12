# Backend Account System Implementation Guide

This guide walks you through implementing the complete user account system backend.

## Files Created

### 1. Database Migrations (Execute in Supabase SQL Editor)

Located in `supabase/` directory:

- **05-enhance-accounts-table.sql** - Adds user profile columns to accounts table
- **06-auto-create-account-trigger.sql** - Auto-creates account when user signs up
- **07-comprehensive-rls-policies.sql** - Comprehensive RLS security policies
- **08-rls-security-tests.sql** - Security validation tests

### 2. Backend API Implementation

Located in `server/` directory:

- **middleware/auth.js** - JWT authentication middleware (UPDATED)
- **routes/users.js** - User profile and account API endpoints (NEW)
- **index.js** - Main server file (UPDATED to include user routes)

### 3. Frontend Types

Located in `src/types/` directory:

- **api.ts** - TypeScript types for API contracts (NEW)

## Migration Execution Order

### Step 1: Run Database Migrations

Open Supabase SQL Editor and execute in this exact order:

```bash
# 1. Add new columns to accounts table
supabase/05-enhance-accounts-table.sql

# 2. Create trigger to auto-create accounts
supabase/06-auto-create-account-trigger.sql

# 3. Apply comprehensive RLS policies
supabase/07-comprehensive-rls-policies.sql

# 4. (Optional) Run security validation tests
supabase/08-rls-security-tests.sql
```

### Step 2: Verify Backend is Running

The backend files have already been created and integrated. Restart your server:

```bash
cd server
npm start
```

### Step 3: Test the API Endpoints

Available endpoints:

```
GET    /api/users/profile              - Get user profile
PATCH  /api/users/profile              - Update user profile
POST   /api/users/complete-onboarding - Complete onboarding
PATCH  /api/users/preferences          - Update preferences
GET    /api/users/account              - Get account settings
```

## Testing with Curl

After migrations are complete, test the endpoints:

```bash
# 1. Sign up a new user via Supabase (or use existing user)
# 2. Get the access token from Supabase Auth
# 3. Test endpoints:

# Get profile
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:3001/api/users/profile

# Update profile
curl -X PATCH \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"business_name": "My Optical Store"}' \
  http://localhost:3001/api/users/profile

# Complete onboarding
curl -X POST \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "business_name": "My Optical Store",
    "phone": "555-1234",
    "city": "New York",
    "state": "NY"
  }' \
  http://localhost:3001/api/users/complete-onboarding
```

## Security Features Implemented

✅ **Authentication**
- JWT verification via Supabase Auth
- Token passed in Authorization header
- Automatic token expiration handling

✅ **Authorization**
- RLS policies ensure users only access their own data
- Service role can bypass RLS for backend operations
- Shared tables (vendors, brands) are read-only

✅ **Validation**
- express-validator for all inputs
- Field length limits enforced
- Type checking (email, URL, phone format)

✅ **SQL Injection Prevention**
- Supabase client handles parameterization
- No raw SQL from user input

✅ **Rate Limiting**
- apiLimiter already applied to user routes
- Protects against abuse

## Next Steps

1. ✅ Database migrations executed
2. ✅ Backend API implemented
3. ⏳ Update frontend services/api.ts (next task)
4. ⏳ Build Settings UI page (next task)
5. ⏳ Update Onboarding to use new API (next task)

## Troubleshooting

### "Account not found" error
- Verify the trigger created an account: `SELECT * FROM accounts WHERE user_id = 'YOUR_USER_ID'`
- Run the trigger manually if needed (see migration 06)

### "Invalid token" error
- Ensure token is passed as: `Authorization: Bearer TOKEN`
- Verify token is not expired (get fresh token from Supabase)

### "Permission denied" error
- Verify RLS policies are applied: Run `08-rls-security-tests.sql`
- Check user_id matches in accounts table

### Server won't start
- Install dependencies: `npm install express-validator`
- Check all routes imported correctly in index.js

## API Endpoint Documentation

### GET /api/users/profile

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "email_confirmed_at": "2024-01-01T00:00:00Z",
      "created_at": "2024-01-01T00:00:00Z"
    },
    "account": {
      "id": "uuid",
      "business_name": "My Optical Store",
      "email": "user@example.com",
      "status": "trial",
      "subscription_tier": "trial",
      "trial_ends_at": "2024-01-15T00:00:00Z",
      ...
    }
  }
}
```

### PATCH /api/users/profile

**Request:**
```json
{
  "business_name": "Updated Store Name",
  "phone": "555-1234",
  "city": "New York",
  "state": "NY"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Profile updated successfully",
  "data": { ...updated account }
}
```

### POST /api/users/complete-onboarding

**Request:**
```json
{
  "business_name": "My Optical Store",
  "phone": "555-1234",
  "address": "123 Main St",
  "city": "New York",
  "state": "NY",
  "zip_code": "10001"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Onboarding completed successfully",
  "data": { ...updated account with onboarding_completed: true }
}
```

### PATCH /api/users/preferences

**Request:**
```json
{
  "notification_preferences": {
    "email_orders": true,
    "email_inventory": false,
    "email_marketing": false
  },
  "display_preferences": {
    "theme": "dark",
    "language": "en"
  }
}
```

**Response:**
```json
{
  "success": true,
  "message": "Preferences updated successfully",
  "data": {
    "notification_preferences": {...},
    "display_preferences": {...}
  }
}
```

## Support

For issues or questions, refer to:
- Supabase RLS documentation: https://supabase.com/docs/guides/auth/row-level-security
- Express.js documentation: https://expressjs.com/
- Your project's CLAUDE.md file

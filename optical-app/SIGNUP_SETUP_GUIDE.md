# Sign Up Setup Guide for OptiProfit

## Overview

Your optical software now has complete user registration functionality. Here's how to create your first account and manage user registrations.

## Creating Your First Admin Account

### Option 1: Quick Admin Setup (Recommended for First Account)

1. Navigate to: `https://your-domain.vercel.app/auth/setup`
2. Fill in the form:
   - Business Name: Your optical practice name
   - Admin Email: Your email address
   - Admin Password: Choose a strong password (8+ characters)
   - First/Last Name: Optional (defaults to "Admin User")
   - Phone: Optional

3. Click "Create Admin Account"
4. You'll be redirected to sign in
5. Use your email and password to log in

**Note**: The `/auth/setup` endpoint only works if no accounts exist yet. After the first account is created, it will be disabled for security.

### Option 2: Regular Sign Up Process

1. Navigate to: `https://your-domain.vercel.app/auth/signin`
2. Click "Sign up" link at the bottom
3. Fill in the complete registration form:
   - Practice/Business Name
   - First and Last Name
   - Email Address
   - Phone Number (optional)
   - Password (minimum 8 characters)
   - Confirm Password
   - Account Type (Owner/Admin/User)

4. Click "Create Account"
5. Return to sign in page
6. Log in with your credentials

## What Was Added

### 1. Sign In Page Updates
- Added "Sign up" link below the sign in button
- Links to the new registration page

### 2. Sign Up Page (`/auth/signup`)
- Complete registration form
- Form validation (email format, password strength, matching passwords)
- Three account types: Owner, Admin, User
- Responsive design matching your sign in page

### 3. Sign Up API Endpoint (`/api/auth/signup`)
- Server-side account creation
- Creates records in:
  - Supabase auth.users table
  - Your custom accounts table
  - Your custom users table
- Proper error handling
- Email validation

### 4. Admin Setup Page (`/auth/setup`)
- Quick setup for the first admin account
- Bypasses email verification
- Only works if no accounts exist
- Automatically disabled after first use

### 5. Admin Setup API (`/api/auth/setup-admin`)
- Creates first admin with full permissions
- Sets account status to "active" immediately
- Professional tier subscription
- Owner role (highest permission)

## Account Structure

When a user signs up, the following records are created:

1. **Supabase Auth Record**
   - Email and password authentication
   - User metadata (name, account type)

2. **Accounts Table Record**
   - Business information
   - Subscription details
   - Contact information

3. **Users Table Record**
   - Links to account
   - Role and permissions
   - Personal information

## Security Features

- Password minimum 8 characters
- Email format validation
- Duplicate email prevention
- Account type/role assignment
- Secure password hashing (bcrypt)

## Next Steps After First Account

1. **Configure Environment**
   - Ensure all Supabase credentials are set
   - Verify database connections

2. **Set Up Vendors**
   - Add API keys for Safilo, Modern Optical, etc.
   - Configure vendor parsers

3. **Configure CloudMailin**
   - Set webhook URL: `https://your-domain.vercel.app/api/webhook`
   - Add webhook secret to environment

4. **Invite Team Members**
   - Use the regular sign up process
   - Assign appropriate roles (Admin/User)

## Troubleshooting

### "Setup already completed" Error
- This means an account already exists
- Use the regular sign up process instead

### "Email already exists" Error
- The email is already registered
- Use sign in instead or use a different email

### Cannot Access Dashboard
- Ensure you're signed in
- Check browser console for errors
- Verify Supabase connection

## Account Types/Roles

- **Owner**: Full access, billing management, all features
- **Admin**: Full access except billing
- **User**: Limited access, operational tasks only

## Deployment Notes

After deploying these changes:

1. Run `vercel --prod` to deploy
2. Ensure all environment variables are set in Vercel
3. Test sign up flow in production
4. Create your first admin account
5. Disable or remove `/auth/setup` endpoint after initial setup (optional)

Your optical software is now ready for multi-user access!
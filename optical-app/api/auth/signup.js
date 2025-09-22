import { createServerSupabaseClient } from '../../lib/supabase';
import { createAccount, createUser } from '../../lib/database';

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const {
    email,
    password,
    firstName,
    lastName,
    businessName,
    phone,
    accountType = 'owner'
  } = req.body;

  // Validation
  if (!email || !password || !firstName || !lastName || !businessName) {
    return res.status(400).json({
      error: 'Missing required fields'
    });
  }

  if (password.length < 8) {
    return res.status(400).json({
      error: 'Password must be at least 8 characters'
    });
  }

  try {
    // Use service role client for admin operations
    const supabase = createServerSupabaseClient();

    // Step 1: Create Supabase auth user
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Auto-confirm email for now
      user_metadata: {
        first_name: firstName,
        last_name: lastName,
        account_type: accountType
      }
    });

    if (authError) {
      console.error('Auth error:', authError);
      if (authError.message?.includes('already registered')) {
        return res.status(400).json({
          error: 'An account with this email already exists'
        });
      }
      throw authError;
    }

    if (!authData.user) {
      throw new Error('Failed to create auth user');
    }

    // Step 2: Create account record
    const accountData = await createAccount({
      name: businessName,
      businessName: businessName,
      email: email,
      phone: phone || null,
      country: 'USA',
      timezone: 'America/New_York',
      status: 'trial',
      subscription_tier: 'trial'
    });

    // Step 3: Create user record in our users table
    const userData = await createUser(accountData.id, {
      email: email,
      password: password,
      firstName: firstName,
      lastName: lastName,
      role: accountType
    });

    // Return success
    return res.status(200).json({
      success: true,
      message: 'Account created successfully',
      user: {
        id: userData.id,
        email: userData.email,
        firstName: userData.first_name,
        lastName: userData.last_name,
        accountId: accountData.id,
        businessName: accountData.business_name
      }
    });

  } catch (error) {
    console.error('Signup error:', error);
    
    // Clean up if partial creation occurred
    // This would need to be implemented based on your needs
    
    return res.status(500).json({
      error: 'Failed to create account',
      message: error.message || 'An unexpected error occurred'
    });
  }
}
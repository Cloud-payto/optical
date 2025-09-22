import { createServerSupabaseClient } from '../../../lib/supabase';
import { createAccount, createUser } from '../../../lib/database';

// This is a setup endpoint to create the first admin account
// Should be disabled after initial setup
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Check if this is the first account
  try {
    const supabase = createServerSupabaseClient();
    
    // Check if any accounts exist
    const { data: existingAccounts, error: checkError } = await supabase
      .from('accounts')
      .select('id')
      .limit(1);
    
    if (checkError) {
      console.error('Error checking accounts:', checkError);
    }
    
    if (existingAccounts && existingAccounts.length > 0) {
      return res.status(403).json({
        error: 'Setup already completed',
        message: 'Admin account already exists. Please use the regular signup process.'
      });
    }

    const {
      email,
      password,
      firstName = 'Admin',
      lastName = 'User',
      businessName,
      phone
    } = req.body;

    // Validation
    if (!email || !password || !businessName) {
      return res.status(400).json({
        error: 'Missing required fields: email, password, businessName'
      });
    }

    // Create Supabase auth user with auto-confirmed email
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        first_name: firstName,
        last_name: lastName,
        account_type: 'owner',
        is_setup_admin: true
      }
    });

    if (authError) {
      console.error('Auth error:', authError);
      throw authError;
    }

    // Create account record
    const accountData = await createAccount({
      name: businessName,
      businessName: businessName,
      email: email,
      phone: phone || null,
      country: 'USA',
      timezone: 'America/New_York',
      status: 'active', // Active immediately for admin
      subscription_tier: 'professional' // Give admin full access
    });

    // Create user record
    const userData = await createUser(accountData.id, {
      email: email,
      password: password,
      firstName: firstName,
      lastName: lastName,
      role: 'owner' // Highest permission level
    });

    return res.status(200).json({
      success: true,
      message: 'Admin account created successfully',
      credentials: {
        email: email,
        accountId: accountData.id,
        userId: userData.id
      },
      nextSteps: [
        '1. Sign in with your email and password',
        '2. Configure vendor API keys',
        '3. Set up CloudMailin webhook',
        '4. Start processing orders'
      ]
    });

  } catch (error) {
    console.error('Setup error:', error);
    return res.status(500).json({
      error: 'Setup failed',
      message: error.message || 'An unexpected error occurred'
    });
  }
}
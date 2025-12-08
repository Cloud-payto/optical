const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth');
const { supabase } = require('../lib/supabase');
const { body, validationResult } = require('express-validator');

// ============================================
// GET /api/users/profile
// Get current user's profile and account info
// ============================================
router.get('/profile', requireAuth, async (req, res) => {
  try {
    const userId = req.userId;

    // Fetch account with all details
    const { data: account, error } = await supabase
      .from('accounts')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error) {
      console.error('Error fetching profile:', error);
      return res.status(404).json({
        error: 'Profile not found',
        message: 'Could not find account for this user'
      });
    }

    // Return combined user + account data
    res.json({
      success: true,
      data: {
        user: {
          id: req.user.id,
          email: req.user.email,
          email_confirmed_at: req.user.email_confirmed_at,
          created_at: req.user.created_at
        },
        account: account
      }
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      error: 'Failed to fetch profile',
      message: error.message
    });
  }
});

// ============================================
// PATCH /api/users/profile
// Update user profile/account information
// ============================================
router.patch('/profile',
  requireAuth,
  [
    body('full_name').optional().trim().isLength({ min: 1, max: 255 }),
    body('business_name').optional().trim().isLength({ min: 1, max: 255 }),
    body('phone').optional().trim().matches(/^\+?[\d\s\-\(\)]+$/),
    body('address').optional().trim().isLength({ max: 500 }),
    body('city').optional().trim().isLength({ max: 100 }),
    body('state').optional().trim().isLength({ max: 50 }),
    body('zip_code').optional().trim().isLength({ max: 20 }),
    body('country').optional().trim().isLength({ max: 100 }),
    body('timezone').optional().trim().isLength({ max: 100 }),
    body('avatar_url').optional().trim().isURL(),
  ],
  async (req, res) => {
    try {
      // Validate input
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          error: 'Validation failed',
          errors: errors.array()
        });
      }

      const userId = req.userId;
      const updates = {};

      // Only include fields that were provided
      const allowedFields = [
        'full_name', 'business_name', 'phone', 'address',
        'city', 'state', 'zip_code', 'country', 'timezone', 'avatar_url'
      ];

      allowedFields.forEach(field => {
        if (req.body[field] !== undefined) {
          updates[field] = req.body[field];
        }
      });

      // Add updated_at timestamp
      updates.updated_at = new Date().toISOString();

      // Update account
      const { data, error } = await supabase
        .from('accounts')
        .update(updates)
        .eq('user_id', userId)
        .select()
        .single();

      if (error) {
        console.error('Error updating profile:', error);
        return res.status(500).json({
          error: 'Update failed',
          message: 'Could not update profile'
        });
      }

      res.json({
        success: true,
        message: 'Profile updated successfully',
        data: data
      });
    } catch (error) {
      console.error('Update profile error:', error);
      res.status(500).json({
        error: 'Failed to update profile',
        message: error.message
      });
    }
  }
);

// ============================================
// POST /api/users/complete-onboarding
// Mark onboarding as completed
// ============================================
router.post('/complete-onboarding',
  requireAuth,
  [
    body('business_name').trim().notEmpty().isLength({ min: 1, max: 255 }),
    body('phone').optional().trim(),
    body('address').optional().trim(),
    body('city').optional().trim(),
    body('state').optional().trim(),
    body('zip_code').optional().trim(),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          error: 'Validation failed',
          errors: errors.array()
        });
      }

      const userId = req.userId;
      const { business_name, phone, address, city, state, zip_code } = req.body;

      // Update account with onboarding data
      const { data, error } = await supabase
        .from('accounts')
        .update({
          business_name,
          phone,
          address,
          city,
          state,
          zip_code,
          onboarding_completed: true,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId)
        .select()
        .single();

      if (error) {
        console.error('Error completing onboarding:', error);
        return res.status(500).json({
          error: 'Onboarding failed',
          message: 'Could not complete onboarding'
        });
      }

      res.json({
        success: true,
        message: 'Onboarding completed successfully',
        data: data
      });
    } catch (error) {
      console.error('Complete onboarding error:', error);
      res.status(500).json({
        error: 'Failed to complete onboarding',
        message: error.message
      });
    }
  }
);

// ============================================
// PATCH /api/users/preferences
// Update user preferences (notifications, display)
// ============================================
router.patch('/preferences',
  requireAuth,
  [
    body('notification_preferences').optional().isObject(),
    body('notification_preferences.email_orders').optional().isBoolean(),
    body('notification_preferences.email_inventory').optional().isBoolean(),
    body('notification_preferences.email_marketing').optional().isBoolean(),
    body('display_preferences').optional().isObject(),
    body('display_preferences.theme').optional().isIn(['light', 'dark', 'auto']),
    body('display_preferences.language').optional().isLength({ min: 2, max: 5 }),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          error: 'Validation failed',
          errors: errors.array()
        });
      }

      const userId = req.userId;
      const updates = {};

      // Handle notification preferences
      if (req.body.notification_preferences) {
        updates.notification_preferences = req.body.notification_preferences;
      }

      // Handle display preferences
      if (req.body.display_preferences) {
        updates.display_preferences = req.body.display_preferences;
      }

      updates.updated_at = new Date().toISOString();

      // Update preferences
      const { data, error } = await supabase
        .from('accounts')
        .update(updates)
        .eq('user_id', userId)
        .select()
        .single();

      if (error) {
        console.error('Error updating preferences:', error);
        return res.status(500).json({
          error: 'Update failed',
          message: 'Could not update preferences'
        });
      }

      res.json({
        success: true,
        message: 'Preferences updated successfully',
        data: {
          notification_preferences: data.notification_preferences,
          display_preferences: data.display_preferences
        }
      });
    } catch (error) {
      console.error('Update preferences error:', error);
      res.status(500).json({
        error: 'Failed to update preferences',
        message: error.message
      });
    }
  }
);

// ============================================
// GET /api/users/account
// Get account settings (subscription, status)
// ============================================
router.get('/account', requireAuth, async (req, res) => {
  try {
    const userId = req.userId;

    const { data: account, error } = await supabase
      .from('accounts')
      .select('status, subscription_tier, subscription_start_date, subscription_end_date, trial_ends_at, created_at')
      .eq('user_id', userId)
      .single();

    if (error) {
      console.error('Error fetching account:', error);
      return res.status(404).json({
        error: 'Account not found'
      });
    }

    res.json({
      success: true,
      data: account
    });
  } catch (error) {
    console.error('Get account error:', error);
    res.status(500).json({
      error: 'Failed to fetch account',
      message: error.message
    });
  }
});

module.exports = router;

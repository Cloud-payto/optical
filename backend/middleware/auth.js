const { supabase } = require('../lib/supabase');

/**
 * Authentication middleware - verifies Supabase JWT token
 * Extracts user from Authorization header and attaches to req.user
 */
const authenticate = async (req, res, next) => {
  try {
    // Extract token from Authorization header
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        error: 'Authentication required',
        message: 'No authorization token provided'
      });
    }

    const token = authHeader.split(' ')[1];

    // Verify token with Supabase
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      return res.status(401).json({
        error: 'Invalid token',
        message: 'Authentication token is invalid or expired'
      });
    }

    // Fetch account information
    const { data: account, error: accountError } = await supabase
      .from('accounts')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (accountError && accountError.code !== 'PGRST116') {
      console.error('Error fetching account:', accountError);
      return res.status(500).json({
        error: 'Database error',
        message: 'Failed to fetch account information'
      });
    }

    // Attach user and account to request
    req.user = user;
    req.account = account;
    req.userId = user.id;
    req.accountId = account?.id || user.id;

    next();
  } catch (error) {
    console.error('Authentication error:', error);
    return res.status(500).json({
      error: 'Authentication failed',
      message: 'An error occurred during authentication'
    });
  }
};

/**
 * Optional authentication - doesn't require auth but attaches user if present
 */
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      // No auth provided, continue without user
      req.user = null;
      req.account = null;
      return next();
    }

    // Try to authenticate, but don't fail if it doesn't work
    await authenticate(req, res, next);
  } catch (error) {
    // If auth fails, continue without user
    req.user = null;
    req.account = null;
    next();
  }
};

/**
 * Require authentication - fails if no valid user
 */
const requireAuth = authenticate;

module.exports = {
  authenticate,
  optionalAuth,
  requireAuth
};

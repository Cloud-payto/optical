/**
 * Demo System Constants
 *
 * Central location for all demo-related configuration values
 */

/**
 * Demo User ID
 *
 * This is the UUID of the special demo user account in the database.
 * All demo data (vendor, email, order, inventory) is associated with this user.
 *
 * When demo mode is active, API calls should use this ID instead of the
 * real user's ID to fetch demo data from the backend.
 */
export const DEMO_USER_ID = '3251cae7-ee61-4c5f-be4c-4312c17ef4fd';

/**
 * Demo Starting Route
 *
 * The page where the demo begins (Orders page with pending frames)
 */
export const DEMO_START_ROUTE = '/frames/orders';

/**
 * Demo Duration (minutes)
 *
 * How long the demo session should last before expiring
 */
export const DEMO_DURATION_MINUTES = 60;

/**
 * Demo Data IDs
 *
 * Fixed UUIDs for demo entities (for consistent testing)
 */
export const DEMO_DATA_IDS = {
  VENDOR_ID: 'f1d2aaf8-1877-4579-9ed0-083541dae7e7', // Modern Optical
  ORDER_ID: '50fa0961-9d44-4190-95ce-b57be229ba62',   // Order #6817
  EMAIL_ID: 'dda6c11f-59b3-426c-88d0-a300b79e2dab',   // Order email
};

/**
 * Demo Order Details
 */
export const DEMO_ORDER = {
  ORDER_NUMBER: '6817',
  VENDOR_NAME: 'Modern Optical',
  CUSTOMER_NAME: 'MARANA EYE CARE',
  ACCOUNT_NUMBER: '93277',
  TOTAL_PIECES: 18,
  REP_NAME: 'Payton Millet',
};

/**
 * Get User ID for API Calls
 *
 * Returns the demo user ID if demo is active, otherwise returns the provided user ID.
 * Use this function for ALL API calls that require a user ID.
 *
 * @param realUserId - The actual authenticated user's ID
 * @param isDemoMode - Whether demo mode is currently active
 * @returns The appropriate user ID to use for API calls
 *
 * @example
 * const { isActive } = useDemo();
 * const { user } = useAuth();
 * const userId = getUserIdForApi(user?.id, isActive);
 * const response = await fetch(`/api/orders/${userId}`);
 */
export const getUserIdForApi = (realUserId: string | undefined, isDemoMode: boolean): string => {
  if (isDemoMode) {
    console.log('🎭 Demo mode active - using demo user ID for API call');
    return DEMO_USER_ID;
  }

  if (!realUserId) {
    console.warn('⚠️ No user ID provided and not in demo mode');
    return '';
  }

  return realUserId;
};

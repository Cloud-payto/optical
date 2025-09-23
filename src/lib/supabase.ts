import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Debug logging for initialization
console.log('[SUPABASE INIT] Starting Supabase client initialization...');
console.log('[SUPABASE INIT] Environment:', import.meta.env.MODE);
console.log('[SUPABASE INIT] Build mode - Dev:', import.meta.env.DEV, 'Prod:', import.meta.env.PROD);

// Check if import.meta.env is available
if (typeof import === 'undefined' || !import.meta || !import.meta.env) {
  console.error('[SUPABASE INIT] CRITICAL: import.meta.env is not available!');
  console.error('[SUPABASE INIT] This suggests a build/bundling issue');
}

// Get Supabase configuration from environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Detailed logging of environment variables
console.log('[SUPABASE INIT] URL present:', !!supabaseUrl);
console.log('[SUPABASE INIT] Key present:', !!supabaseAnonKey);
console.log('[SUPABASE INIT] URL starts with:', supabaseUrl ? supabaseUrl.substring(0, 20) + '...' : 'undefined');
console.log('[SUPABASE INIT] Key length:', supabaseAnonKey ? supabaseAnonKey.length : 0);

// List all VITE_ prefixed env vars (for debugging)
console.log('[SUPABASE INIT] All VITE_ env vars:', 
  Object.keys(import.meta.env)
    .filter(key => key.startsWith('VITE_'))
    .map(key => `${key}: ${key.includes('KEY') || key.includes('SECRET') ? '[REDACTED]' : import.meta.env[key]}`)
);

// Check if we have the required environment variables
export const isSupabaseConfigured = !!(supabaseUrl && supabaseAnonKey);

if (!isSupabaseConfigured) {
  console.error('[SUPABASE INIT] ❌ Missing Supabase environment variables!');
  console.error('[SUPABASE INIT] VITE_SUPABASE_URL:', supabaseUrl || 'NOT SET');
  console.error('[SUPABASE INIT] VITE_SUPABASE_ANON_KEY:', supabaseAnonKey ? 'SET' : 'NOT SET');
  console.warn('[SUPABASE INIT] Authentication features will be disabled.');
  console.warn('[SUPABASE INIT] Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY');
}

let supabaseClient: SupabaseClient | null = null;

try {
  console.log('[SUPABASE INIT] Creating Supabase client...');
  
  // Create Supabase client for React app (client-side)
  // Use dummy values if not configured to prevent crashes
  supabaseClient = createClient(
    supabaseUrl || 'https://placeholder.supabase.co', 
    supabaseAnonKey || 'placeholder-key',
    {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        storage: {
          getItem: (key: string) => {
            if (typeof window === 'undefined') {
              console.warn('[SUPABASE INIT] Window undefined, cannot access localStorage');
              return null;
            }
            return window.localStorage.getItem(key);
          },
          setItem: (key: string, value: string) => {
            if (typeof window === 'undefined') {
              console.warn('[SUPABASE INIT] Window undefined, cannot access localStorage');
              return;
            }
            window.localStorage.setItem(key, value);
          },
          removeItem: (key: string) => {
            if (typeof window === 'undefined') {
              console.warn('[SUPABASE INIT] Window undefined, cannot access localStorage');
              return;
            }
            window.localStorage.removeItem(key);
          },
        },
      },
    }
  );
  
  console.log('[SUPABASE INIT] ✅ Supabase client created successfully');
  
  // Test the client immediately if configured
  if (isSupabaseConfigured && typeof window !== 'undefined') {
    console.log('[SUPABASE INIT] Testing client with getSession()...');
    supabaseClient.auth.getSession().then(({ data, error }) => {
      if (error) {
        console.error('[SUPABASE INIT] ❌ Session test failed:', error.message);
      } else {
        console.log('[SUPABASE INIT] ✅ Session test successful');
        console.log('[SUPABASE INIT] Session exists:', !!data.session);
      }
    }).catch(err => {
      console.error('[SUPABASE INIT] ❌ Session test exception:', err);
    });
  }
  
} catch (error) {
  console.error('[SUPABASE INIT] ❌ CRITICAL ERROR creating Supabase client:', error);
  console.error('[SUPABASE INIT] Error details:', {
    name: error instanceof Error ? error.name : 'Unknown',
    message: error instanceof Error ? error.message : String(error),
    stack: error instanceof Error ? error.stack : 'No stack trace'
  });
}

// Export the client (or null if creation failed)
export const supabase = supabaseClient || createClient(
  'https://placeholder.supabase.co',
  'placeholder-key'
);

// Helper function to get current user
export const getCurrentUser = async () => {
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error) throw error;
  return user;
};

// Helper function to sign out
export const signOut = async () => {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
};

export default supabase;
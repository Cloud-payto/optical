/**
 * CORS Headers for Supabase Edge Functions
 *
 * IMPORTANT: Update 'Access-Control-Allow-Origin' with your production domain
 * Current: '*' allows all origins (development only)
 * Production: Use your actual frontend URL (e.g., 'https://optiprofit.com')
 */

export const corsHeaders = {
  'Access-Control-Allow-Origin': '*', // TODO: Update with your frontend domain in production
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, PATCH, DELETE, OPTIONS',
};

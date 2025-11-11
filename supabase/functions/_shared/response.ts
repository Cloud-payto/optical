/**
 * Standard Response Helpers for Supabase Edge Functions
 *
 * Provides consistent response formatting across all endpoints
 */

import { corsHeaders } from './cors.ts';

/**
 * Success response helper
 * @param data - The data to return
 * @param status - HTTP status code (default: 200)
 */
export function successResponse(data: any, status = 200): Response {
  return new Response(
    JSON.stringify({ success: true, data }),
    {
      status,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      },
    }
  );
}

/**
 * Error response helper
 * @param error - Error message
 * @param code - Error code for client-side handling
 * @param status - HTTP status code (default: 400)
 */
export function errorResponse(error: string, code: string, status = 400): Response {
  return new Response(
    JSON.stringify({
      success: false,
      error,
      code
    }),
    {
      status,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      },
    }
  );
}

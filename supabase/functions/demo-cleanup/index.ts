/**
 * DELETE /demo-cleanup
 *
 * Marks demo session as inactive (cleanup)
 * Query params: sessionId (required)
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';
import { successResponse, errorResponse } from '../_shared/response.ts';
import { validateUUID } from '../_shared/validation.ts';

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization')!;
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return errorResponse('Unauthorized', 'AUTH_REQUIRED', 401);
    }

    const url = new URL(req.url);
    const sessionId = url.searchParams.get('sessionId');

    if (!sessionId || !validateUUID(sessionId)) {
      return errorResponse('Invalid session ID', 'INVALID_SESSION_ID', 400);
    }

    // Mark session as inactive
    const { data, error } = await supabase
      .from('demo_data')
      .update({
        is_active: false,
        last_activity_at: new Date().toISOString(),
      })
      .eq('session_id', sessionId)
      .eq('user_id', user.id)
      .select('session_id, is_active')
      .single();

    if (error || !data) {
      return errorResponse('Failed to cleanup session', 'CLEANUP_FAILED', 400);
    }

    return successResponse({
      sessionId: data.session_id,
      isActive: data.is_active,
      cleanedUpAt: new Date().toISOString(),
    });

  } catch (error) {
    console.error('Error:', error);
    return errorResponse('Internal server error', 'INTERNAL_ERROR', 500);
  }
});

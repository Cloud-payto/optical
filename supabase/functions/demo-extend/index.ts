/**
 * POST /demo-extend
 *
 * Extends demo session expiration by 1 hour
 * Body: { sessionId }
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

    const { sessionId } = await req.json();

    if (!sessionId || !validateUUID(sessionId)) {
      return errorResponse('Invalid session ID', 'INVALID_SESSION_ID', 400);
    }

    // Call the extend function
    const { error: extendError } = await supabase.rpc('extend_demo_session', {
      p_session_id: sessionId,
    });

    if (extendError) {
      console.error('Extend error:', extendError);
      return errorResponse('Failed to extend session', 'EXTEND_FAILED', 400);
    }

    // Fetch updated session
    const { data, error } = await supabase
      .from('demo_data')
      .select('session_id, expires_at')
      .eq('session_id', sessionId)
      .eq('user_id', user.id)
      .single();

    if (error || !data) {
      return errorResponse('Session not found', 'SESSION_NOT_FOUND', 404);
    }

    return successResponse({
      sessionId: data.session_id,
      expiresAt: data.expires_at,
      extended: true,
    });

  } catch (error) {
    console.error('Error:', error);
    return errorResponse('Internal server error', 'INTERNAL_ERROR', 500);
  }
});

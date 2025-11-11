/**
 * PATCH /demo-progress
 *
 * Updates demo session progress (current step, completed steps)
 * Body: { sessionId, currentStep, completedSteps }
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

    const { sessionId, currentStep, completedSteps } = await req.json();

    if (!sessionId || !validateUUID(sessionId)) {
      return errorResponse('Invalid session ID', 'INVALID_SESSION_ID', 400);
    }

    const { data, error } = await supabase
      .from('demo_data')
      .update({
        step_progress: currentStep,
        completed_steps: completedSteps,
        last_activity_at: new Date().toISOString(),
      })
      .eq('session_id', sessionId)
      .eq('user_id', user.id)
      .select('session_id, step_progress, completed_steps, last_activity_at')
      .single();

    if (error || !data) {
      return errorResponse('Failed to update progress', 'UPDATE_FAILED', 400);
    }

    return successResponse({
      sessionId: data.session_id,
      stepProgress: data.step_progress,
      completedSteps: data.completed_steps,
      lastActivityAt: data.last_activity_at,
    });

  } catch (error) {
    console.error('Error:', error);
    return errorResponse('Internal server error', 'INTERNAL_ERROR', 500);
  }
});

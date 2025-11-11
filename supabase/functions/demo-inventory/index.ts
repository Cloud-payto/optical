/**
 * GET /demo-inventory
 *
 * Returns demo inventory items, optionally filtered by status
 * Query params: sessionId (required), status (optional: pending, current, sold, etc.)
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
    const statusFilter = url.searchParams.get('status'); // pending, current, sold, etc.

    if (!sessionId || !validateUUID(sessionId)) {
      return errorResponse('Invalid session ID', 'INVALID_SESSION_ID', 400);
    }

    const { data, error } = await supabase
      .from('demo_data')
      .select('inventory_items')
      .eq('session_id', sessionId)
      .eq('user_id', user.id)
      .eq('is_active', true)
      .single();

    if (error || !data) {
      return errorResponse('Demo session not found', 'SESSION_NOT_FOUND', 404);
    }

    let items = data.inventory_items;

    // Filter by status if provided
    if (statusFilter) {
      items = items.filter((item: any) => item.status === statusFilter);
    }

    // Calculate status counts
    const statusCounts = data.inventory_items.reduce((acc: any, item: any) => {
      acc[item.status] = (acc[item.status] || 0) + 1;
      return acc;
    }, {});

    return successResponse({
      items,
      totalItems: items.length,
      statusCounts,
    });

  } catch (error) {
    console.error('Error:', error);
    return errorResponse('Internal server error', 'INTERNAL_ERROR', 500);
  }
});

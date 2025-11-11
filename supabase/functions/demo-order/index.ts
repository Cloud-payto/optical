/**
 * GET /demo-order
 *
 * Returns parsed demo order from Modern Optical email
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

    const { data, error } = await supabase
      .from('demo_data')
      .select('order_data, inventory_items, vendor_id, vendor_name')
      .eq('session_id', sessionId)
      .eq('user_id', user.id)
      .eq('is_active', true)
      .single();

    if (error || !data) {
      return errorResponse('Demo session not found', 'SESSION_NOT_FOUND', 404);
    }

    // Combine order data with items
    const orderWithItems = {
      ...data.order_data,
      vendorId: data.vendor_id,
      orderDate: new Date().toISOString().split('T')[0],
      items: data.inventory_items,
    };

    return successResponse(orderWithItems);

  } catch (error) {
    console.error('Error:', error);
    return errorResponse('Internal server error', 'INTERNAL_ERROR', 500);
  }
});

/**
 * GET /demo-vendor
 *
 * Returns demo vendor data (Modern Optical) for a given session
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

    // Get session ID from query params
    const url = new URL(req.url);
    const sessionId = url.searchParams.get('sessionId');

    if (!sessionId || !validateUUID(sessionId)) {
      return errorResponse('Invalid session ID', 'INVALID_SESSION_ID', 400);
    }

    // Fetch demo data
    const { data, error } = await supabase
      .from('demo_data')
      .select('vendor_id, vendor_name, vendor_account_number, vendor_email, vendor_phone, vendor_rep_name, vendor_rep_email, vendor_rep_phone, brand_pricing')
      .eq('session_id', sessionId)
      .eq('user_id', user.id)
      .eq('is_active', true)
      .single();

    if (error || !data) {
      return errorResponse('Demo session not found', 'SESSION_NOT_FOUND', 404);
    }

    // Extract brands from pricing data
    const brands = data.brand_pricing.map((pricing: any) => ({
      id: pricing.id,
      name: pricing.name,
      category: pricing.category,
      tier: pricing.tier,
    }));

    return successResponse({
      id: data.vendor_id,
      name: data.vendor_name,
      accountNumber: data.vendor_account_number,
      email: data.vendor_email,
      phone: data.vendor_phone,
      rep: {
        name: data.vendor_rep_name,
        email: data.vendor_rep_email,
        phone: data.vendor_rep_phone,
      },
      brands,
    });

  } catch (error) {
    console.error('Error:', error);
    return errorResponse('Internal server error', 'INTERNAL_ERROR', 500);
  }
});

/**
 * GET /demo-pricing
 *
 * Returns brand pricing data, optionally filtered by brand name
 * Query params: sessionId (required), brandName (optional)
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
    const brandName = url.searchParams.get('brandName');

    if (!sessionId || !validateUUID(sessionId)) {
      return errorResponse('Invalid session ID', 'INVALID_SESSION_ID', 400);
    }

    const { data, error } = await supabase
      .from('demo_data')
      .select('brand_pricing, vendor_id, vendor_name')
      .eq('session_id', sessionId)
      .eq('user_id', user.id)
      .eq('is_active', true)
      .single();

    if (error || !data) {
      return errorResponse('Demo session not found', 'SESSION_NOT_FOUND', 404);
    }

    let brands = data.brand_pricing;

    // Filter by brand name if provided
    if (brandName) {
      brands = brands.filter((brand: any) =>
        brand.name.toLowerCase().includes(brandName.toLowerCase())
      );
    }

    // Add vendor info to each brand
    brands = brands.map((brand: any) => ({
      ...brand,
      vendorId: data.vendor_id,
      vendorName: data.vendor_name,
    }));

    return successResponse({ brands });

  } catch (error) {
    console.error('Error:', error);
    return errorResponse('Internal server error', 'INTERNAL_ERROR', 500);
  }
});

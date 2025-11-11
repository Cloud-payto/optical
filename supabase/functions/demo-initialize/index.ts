/**
 * POST /demo-initialize
 *
 * Initializes a new demo session with pre-populated demo data
 * Returns complete demo data including vendor, order, inventory, and pricing
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';
import { successResponse, errorResponse } from '../_shared/response.ts';

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Get authenticated user
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

    // Parse request body
    const { durationMinutes = 60 } = await req.json().catch(() => ({}));

    // Generate unique session ID
    const sessionId = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + durationMinutes * 60 * 1000).toISOString();

    console.log(`Initializing demo session for user ${user.id}, sessionId: ${sessionId}`);

    // Insert demo session with default data from table defaults
    const { data, error } = await supabase
      .from('demo_data')
      .insert({
        session_id: sessionId,
        user_id: user.id,
        expires_at: expiresAt,
        is_active: true,
      })
      .select()
      .single();

    if (error) {
      console.error('Database error:', error);
      return errorResponse('Failed to initialize demo', 'DEMO_INIT_FAILED', 500);
    }

    // Return complete demo data
    return successResponse({
      sessionId: data.session_id,
      expiresAt: data.expires_at,
      vendor: {
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
      },
      order: data.order_data,
      inventoryItems: data.inventory_items,
      brandPricing: data.brand_pricing,
    }, 201);

  } catch (error) {
    console.error('Error:', error);
    return errorResponse('Internal server error', 'INTERNAL_ERROR', 500);
  }
});

const express = require('express');
const router = express.Router();
const { supabase } = require('../lib/supabase');

// ============================================
// GET /api/locations/:accountId
// List all locations for an account
// ============================================
router.get('/:accountId', async (req, res) => {
  try {
    const { accountId } = req.params;
    const { includeInactive } = req.query;

    let query = supabase
      .from('practice_locations')
      .select('*')
      .eq('account_id', accountId)
      .order('is_primary', { ascending: false })
      .order('name', { ascending: true });

    // By default, only return active locations
    if (includeInactive !== 'true') {
      query = query.eq('is_active', true);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching locations:', error);
      return res.status(500).json({ error: 'Failed to fetch locations' });
    }

    res.json({
      locations: data || [],
      count: data?.length || 0,
      isMultiLocation: (data?.length || 0) > 1
    });
  } catch (error) {
    console.error('Error in GET /locations:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ============================================
// GET /api/locations/:accountId/summary
// Get location count and multi-location status
// NOTE: This route must be defined BEFORE /:accountId/:locationId
// ============================================
router.get('/:accountId/summary', async (req, res) => {
  try {
    const { accountId } = req.params;

    const { data, error } = await supabase
      .from('practice_locations')
      .select('id, is_primary')
      .eq('account_id', accountId)
      .eq('is_active', true);

    if (error) {
      console.error('Error fetching location summary:', error);
      return res.status(500).json({ error: 'Failed to fetch location summary' });
    }

    const locations = data || [];
    const primaryLocation = locations.find(l => l.is_primary);

    res.json({
      totalLocations: locations.length,
      isMultiLocation: locations.length > 1,
      hasPrimaryLocation: !!primaryLocation,
      primaryLocationId: primaryLocation?.id || null,
      // If single location, always return that location's ID
      defaultLocationId: locations.length === 1 ? locations[0].id : primaryLocation?.id || null
    });
  } catch (error) {
    console.error('Error in GET /locations/summary:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ============================================
// GET /api/locations/:accountId/:locationId
// Get a single location
// ============================================
router.get('/:accountId/:locationId', async (req, res) => {
  try {
    const { accountId, locationId } = req.params;

    const { data, error } = await supabase
      .from('practice_locations')
      .select('*')
      .eq('id', locationId)
      .eq('account_id', accountId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({ error: 'Location not found' });
      }
      console.error('Error fetching location:', error);
      return res.status(500).json({ error: 'Failed to fetch location' });
    }

    res.json(data);
  } catch (error) {
    console.error('Error in GET /locations/:locationId:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ============================================
// POST /api/locations/:accountId
// Create a new location
// ============================================
router.post('/:accountId', async (req, res) => {
  try {
    const { accountId } = req.params;
    const { name, address, city, state, zip_code, phone, is_primary } = req.body;

    // Validate required fields
    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Location name is required' });
    }

    // Check for duplicate name
    const { data: existing } = await supabase
      .from('practice_locations')
      .select('id')
      .eq('account_id', accountId)
      .ilike('name', name.trim())
      .single();

    if (existing) {
      return res.status(400).json({ error: 'A location with this name already exists' });
    }

    const locationData = {
      account_id: accountId,
      name: name.trim(),
      address: address?.trim() || null,
      city: city?.trim() || null,
      state: state?.trim() || null,
      zip_code: zip_code?.trim() || null,
      phone: phone?.trim() || null,
      is_primary: is_primary || false,
      is_active: true
    };

    const { data, error } = await supabase
      .from('practice_locations')
      .insert(locationData)
      .select()
      .single();

    if (error) {
      console.error('Error creating location:', error);
      return res.status(500).json({ error: 'Failed to create location' });
    }

    console.log(`Created location "${name}" for account ${accountId}`);
    res.status(201).json(data);
  } catch (error) {
    console.error('Error in POST /locations:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ============================================
// PUT /api/locations/:accountId/:locationId
// Update a location
// ============================================
router.put('/:accountId/:locationId', async (req, res) => {
  try {
    const { accountId, locationId } = req.params;
    const { name, address, city, state, zip_code, phone, is_primary, is_active } = req.body;

    // Validate that location belongs to account
    const { data: existing, error: fetchError } = await supabase
      .from('practice_locations')
      .select('id, name')
      .eq('id', locationId)
      .eq('account_id', accountId)
      .single();

    if (fetchError || !existing) {
      return res.status(404).json({ error: 'Location not found' });
    }

    // If name is changing, check for duplicates
    if (name && name.trim() !== existing.name) {
      const { data: duplicate } = await supabase
        .from('practice_locations')
        .select('id')
        .eq('account_id', accountId)
        .ilike('name', name.trim())
        .neq('id', locationId)
        .single();

      if (duplicate) {
        return res.status(400).json({ error: 'A location with this name already exists' });
      }
    }

    const updateData = {
      ...(name !== undefined && { name: name.trim() }),
      ...(address !== undefined && { address: address?.trim() || null }),
      ...(city !== undefined && { city: city?.trim() || null }),
      ...(state !== undefined && { state: state?.trim() || null }),
      ...(zip_code !== undefined && { zip_code: zip_code?.trim() || null }),
      ...(phone !== undefined && { phone: phone?.trim() || null }),
      ...(is_primary !== undefined && { is_primary }),
      ...(is_active !== undefined && { is_active }),
      updated_at: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('practice_locations')
      .update(updateData)
      .eq('id', locationId)
      .eq('account_id', accountId)
      .select()
      .single();

    if (error) {
      console.error('Error updating location:', error);
      return res.status(500).json({ error: 'Failed to update location' });
    }

    console.log(`Updated location ${locationId} for account ${accountId}`);
    res.json(data);
  } catch (error) {
    console.error('Error in PUT /locations:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ============================================
// DELETE /api/locations/:accountId/:locationId
// Delete (soft delete) a location
// ============================================
router.delete('/:accountId/:locationId', async (req, res) => {
  try {
    const { accountId, locationId } = req.params;
    const { permanent } = req.query;

    // Validate that location belongs to account
    const { data: existing, error: fetchError } = await supabase
      .from('practice_locations')
      .select('id, is_primary')
      .eq('id', locationId)
      .eq('account_id', accountId)
      .single();

    if (fetchError || !existing) {
      return res.status(404).json({ error: 'Location not found' });
    }

    // Check if this is the only location
    const { count } = await supabase
      .from('practice_locations')
      .select('*', { count: 'exact', head: true })
      .eq('account_id', accountId)
      .eq('is_active', true);

    if (count <= 1) {
      return res.status(400).json({
        error: 'Cannot delete the only active location. Create another location first.'
      });
    }

    // Check if there's inventory at this location
    const { count: inventoryCount } = await supabase
      .from('inventory')
      .select('*', { count: 'exact', head: true })
      .eq('location_id', locationId)
      .eq('status', 'current');

    if (permanent === 'true') {
      // Hard delete - only if no current inventory
      if (inventoryCount > 0) {
        return res.status(400).json({
          error: `Cannot permanently delete location with ${inventoryCount} current inventory items. Move or archive inventory first.`
        });
      }

      const { error } = await supabase
        .from('practice_locations')
        .delete()
        .eq('id', locationId)
        .eq('account_id', accountId);

      if (error) {
        console.error('Error deleting location:', error);
        return res.status(500).json({ error: 'Failed to delete location' });
      }

      console.log(`Permanently deleted location ${locationId}`);
    } else {
      // Soft delete - set is_active to false
      const { error } = await supabase
        .from('practice_locations')
        .update({
          is_active: false,
          updated_at: new Date().toISOString()
        })
        .eq('id', locationId)
        .eq('account_id', accountId);

      if (error) {
        console.error('Error deactivating location:', error);
        return res.status(500).json({ error: 'Failed to deactivate location' });
      }

      // If this was the primary location, set another as primary
      if (existing.is_primary) {
        await supabase
          .from('practice_locations')
          .update({ is_primary: true })
          .eq('account_id', accountId)
          .eq('is_active', true)
          .neq('id', locationId)
          .order('created_at', { ascending: true })
          .limit(1);
      }

      console.log(`Soft deleted location ${locationId}`);
    }

    res.json({
      success: true,
      message: permanent === 'true' ? 'Location permanently deleted' : 'Location deactivated',
      inventoryAffected: inventoryCount || 0
    });
  } catch (error) {
    console.error('Error in DELETE /locations:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ============================================
// POST /api/locations/:accountId/:locationId/set-primary
// Set a location as primary
// ============================================
router.post('/:accountId/:locationId/set-primary', async (req, res) => {
  try {
    const { accountId, locationId } = req.params;

    // Validate that location belongs to account and is active
    const { data: existing, error: fetchError } = await supabase
      .from('practice_locations')
      .select('id, is_active')
      .eq('id', locationId)
      .eq('account_id', accountId)
      .single();

    if (fetchError || !existing) {
      return res.status(404).json({ error: 'Location not found' });
    }

    if (!existing.is_active) {
      return res.status(400).json({ error: 'Cannot set inactive location as primary' });
    }

    // Database trigger will handle unsetting other primaries
    const { data, error } = await supabase
      .from('practice_locations')
      .update({
        is_primary: true,
        updated_at: new Date().toISOString()
      })
      .eq('id', locationId)
      .select()
      .single();

    if (error) {
      console.error('Error setting primary location:', error);
      return res.status(500).json({ error: 'Failed to set primary location' });
    }

    console.log(`Set location ${locationId} as primary for account ${accountId}`);
    res.json(data);
  } catch (error) {
    console.error('Error in POST /locations/set-primary:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;

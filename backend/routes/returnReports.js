/**
 * Return Reports API Routes
 * Handles CRUD operations for return report metadata
 */

const express = require('express');
const router = express.Router();
const { supabase } = require('../lib/supabase');
const { requireAuth } = require('../middleware/auth');

/**
 * POST /api/return-reports
 * Save return report metadata to database
 */
router.post('/', requireAuth, async (req, res) => {
  try {
    const {
      account_id,
      vendor_name,
      vendor_account_number,
      report_number,
      filename,
      pdf_path,
      item_count,
      total_quantity,
      status = 'generated',
      vendor_id
    } = req.body;

    // Validate required fields
    if (!account_id || !report_number || !filename || !pdf_path) {
      return res.status(400).json({
        error: 'Missing required fields',
        required: ['account_id', 'report_number', 'filename', 'pdf_path']
      });
    }

    // Ensure user can only create reports for their own account
    if (account_id !== req.user.id) {
      return res.status(403).json({ error: 'Unauthorized: Cannot create reports for other accounts' });
    }

    console.log('💾 Saving return report metadata:', {
      account_id,
      vendor_name,
      vendor_account_number,
      report_number,
      filename,
      item_count,
      total_quantity
    });

    const { data, error } = await supabase
      .from('return_reports')
      .insert([{
        account_id,
        vendor_id,
        vendor_name,
        vendor_account_number,
        report_number,
        filename,
        pdf_path,
        item_count: item_count || 0,
        total_quantity: total_quantity || 0,
        status,
        generated_date: new Date().toISOString()
      }])
      .select()
      .single();

    if (error) {
      console.error('❌ Error saving return report:', error);
      throw error;
    }

    console.log('✅ Return report saved successfully:', data.id);

    res.json({ success: true, data });
  } catch (error) {
    console.error('Error in POST /api/return-reports:', error);

    // Handle duplicate report_number
    if (error.code === '23505') {
      return res.status(409).json({
        error: 'A report with this number already exists',
        code: 'DUPLICATE_REPORT_NUMBER'
      });
    }

    res.status(500).json({
      error: 'Failed to save return report',
      details: error.message
    });
  }
});

/**
 * GET /api/return-reports
 * Get all return reports for authenticated user
 */
router.get('/', requireAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const { status, limit = 100 } = req.query;

    console.log('📋 Fetching return reports for user:', userId);

    let query = supabase
      .from('return_reports')
      .select('*')
      .eq('account_id', userId)
      .order('generated_date', { ascending: false })
      .limit(parseInt(limit));

    // Optional status filter
    if (status && status !== 'all') {
      query = query.eq('status', status);
    }

    const { data, error } = await query;

    if (error) {
      console.error('❌ Error fetching return reports:', error);
      throw error;
    }

    console.log(`✅ Found ${data?.length || 0} return reports`);

    res.json({ success: true, data: data || [] });
  } catch (error) {
    console.error('Error in GET /api/return-reports:', error);
    res.status(500).json({
      error: 'Failed to fetch return reports',
      details: error.message
    });
  }
});

/**
 * GET /api/return-reports/:id
 * Get a specific return report by ID
 */
router.get('/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const { data, error } = await supabase
      .from('return_reports')
      .select('*')
      .eq('id', id)
      .eq('account_id', userId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({ error: 'Return report not found' });
      }
      throw error;
    }

    res.json({ success: true, data });
  } catch (error) {
    console.error('Error in GET /api/return-reports/:id:', error);
    res.status(500).json({
      error: 'Failed to fetch return report',
      details: error.message
    });
  }
});

/**
 * PATCH /api/return-reports/:id
 * Update return report status or metadata
 */
router.patch('/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const { status, notes, sent_to_email, sent_at } = req.body;

    // Build update object with only provided fields
    const updates = { updated_at: new Date().toISOString() };
    if (status) updates.status = status;
    if (notes !== undefined) updates.notes = notes;
    if (sent_to_email) updates.sent_to_email = sent_to_email;
    if (sent_at) updates.sent_at = sent_at;

    const { data, error } = await supabase
      .from('return_reports')
      .update(updates)
      .eq('id', id)
      .eq('account_id', userId)
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({ error: 'Return report not found' });
      }
      throw error;
    }

    console.log('✅ Return report updated:', id);

    res.json({ success: true, data });
  } catch (error) {
    console.error('Error in PATCH /api/return-reports/:id:', error);
    res.status(500).json({
      error: 'Failed to update return report',
      details: error.message
    });
  }
});

/**
 * DELETE /api/return-reports/:id
 * Delete a return report and its associated PDF from storage
 */
router.delete('/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // First, get the report to find its pdf_path
    const { data: report, error: fetchError } = await supabase
      .from('return_reports')
      .select('pdf_path')
      .eq('id', id)
      .eq('account_id', userId)
      .single();

    if (fetchError) {
      if (fetchError.code === 'PGRST116') {
        return res.status(404).json({ error: 'Return report not found' });
      }
      throw fetchError;
    }

    // Delete from database
    const { error: deleteError } = await supabase
      .from('return_reports')
      .delete()
      .eq('id', id)
      .eq('account_id', userId);

    if (deleteError) throw deleteError;

    // Delete PDF from storage (if path exists)
    if (report.pdf_path) {
      const { error: storageError } = await supabase.storage
        .from('return-reports')
        .remove([report.pdf_path]);

      if (storageError) {
        console.warn('⚠️  Could not delete PDF from storage:', storageError.message);
        // Don't fail the request if storage delete fails
      } else {
        console.log('✅ PDF deleted from storage:', report.pdf_path);
      }
    }

    console.log('✅ Return report deleted:', id);

    res.json({ success: true, message: 'Return report deleted successfully' });
  } catch (error) {
    console.error('Error in DELETE /api/return-reports/:id:', error);
    res.status(500).json({
      error: 'Failed to delete return report',
      details: error.message
    });
  }
});

module.exports = router;

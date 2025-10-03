const express = require('express');
const router = express.Router();
const { emailOperations, supabase } = require('../lib/supabase');

/**
 * POST /api/emails/create
 * Create an email record (for n8n workflow compatibility)
 *
 * Body: {
 *   accountId: string,
 *   from: string,
 *   subject: string,
 *   html: string,
 *   plainText: string,
 *   parsedData?: object (optional - already parsed order data)
 * }
 */
router.post('/create', async (req, res) => {
  try {
    const { accountId, from, subject, html, plainText, parsedData } = req.body;

    console.log('[EMAIL CREATE] Request received');
    console.log('  Account ID:', accountId);
    console.log('  From:', from);
    console.log('  Subject:', subject);
    console.log('  Has HTML:', !!html);
    console.log('  Has plainText:', !!plainText);
    console.log('  Has parsedData:', !!parsedData);

    // Validate required fields
    if (!accountId || !from || !subject) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: accountId, from, and subject are required'
      });
    }

    // Validate account exists
    const { data: accountExists, error: accountError } = await supabase
      .from('accounts')
      .select('id')
      .eq('id', accountId)
      .single();

    if (accountError || !accountExists) {
      console.error(`[EMAIL CREATE] Unknown account: ${accountId}`, accountError);
      return res.status(404).json({
        success: false,
        error: `Account not found: ${accountId}`
      });
    }

    // Create email record
    const emailRecord = await emailOperations.saveEmail({
      account_id: accountId,
      from_email: from,
      to_email: `n8n-created-${accountId}@system.local`, // Synthetic "to" address
      subject: subject,
      message_id: `n8n-${Date.now()}@system.local`, // Synthetic message ID
      spam_score: 0,
      spam_status: 'n8n',
      attachments_count: 0,
      raw_data: JSON.stringify({ source: 'n8n', timestamp: new Date().toISOString() }),
      plain_text: plainText || '',
      html_text: html || '',
      received_at: new Date().toISOString()
    });

    console.log('[EMAIL CREATE] Email record created with ID:', emailRecord.id);

    // If parsedData is provided, update the email with it
    if (parsedData) {
      await emailOperations.updateEmailWithParsedData(emailRecord.id, parsedData);
      console.log('[EMAIL CREATE] Email updated with parsed data');
    }

    return res.status(201).json({
      success: true,
      message: 'Email record created successfully',
      emailId: emailRecord.id,
      email: emailRecord
    });

  } catch (error) {
    console.error('[EMAIL CREATE] Error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to create email record',
      message: error.message
    });
  }
});

// GET /api/emails/:userId - Get emails for a user
router.get('/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const emails = await emailOperations.getEmailsByAccount(userId);
    
    res.json({
      success: true,
      count: emails.length,
      emails: emails
    });
  } catch (error) {
    console.error('Error fetching emails:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// DELETE /api/emails/:userId/:emailId - Delete email
router.delete('/:userId/:emailId', async (req, res) => {
  try {
    const { userId, emailId } = req.params;

    // Debug logging
    console.log('DELETE request received:', {
      emailId: emailId,
      typeof: typeof emailId,
      fullParams: req.params,
      fullUrl: req.url
    });

    // Validate emailId is provided and looks like a valid UUID
    if (!emailId || emailId === 'undefined' || emailId === 'null') {
      return res.status(400).json({
        success: false,
        error: 'Invalid email ID provided'
      });
    }
    
    // Basic UUID format validation (8-4-4-4-12 hex characters)
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(emailId)) {
      return res.status(400).json({
        success: false,
        error: `Invalid email ID format: ${emailId}. Expected UUID format.`
      });
    }
    
    // Pass emailId as string (not parsed as integer)
    await emailOperations.deleteEmail(emailId, userId);
    
    res.json({
      success: true,
      message: 'Email deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting email:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;
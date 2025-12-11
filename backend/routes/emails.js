const express = require('express');
const router = express.Router();
const { emailOperations, supabase } = require('../lib/supabase');
const vendorDetectionService = require('../services/vendorDetection');

/**
 * POST /api/emails/create
 * Create an email record (for n8n workflow compatibility)
 *
 * Body: {
 *   accountId: string,
 *   vendorId?: string (optional - vendor UUID),
 *   vendor?: string (optional - vendor name),
 *   from: string,
 *   subject: string,
 *   html: string,
 *   plainText: string,
 *   parsedData?: object (optional - already parsed order data)
 * }
 */
router.post('/create', async (req, res) => {
  try {
    const { accountId, vendorId, vendor, from, subject, html, plainText, parsedData } = req.body;

    console.log('[EMAIL CREATE] Request received');
    console.log('  Account ID:', accountId);
    console.log('  Vendor ID:', vendorId);
    console.log('  Vendor:', vendor);
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
      vendor_id: vendorId || null, // Include vendor ID from n8n workflow
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

      // Save vendor account number if present in parsedData
      const accountNumber = parsedData.account_number || parsedData.order?.account_number;
      if (accountNumber && vendorId && accountId) {
        try {
          await emailOperations.saveOrUpdateVendorAccountNumber(accountId, vendorId, accountNumber);
          console.log('[EMAIL CREATE] Vendor account number saved:', accountNumber);
        } catch (accountNumError) {
          console.error('[EMAIL CREATE] Failed to save vendor account number:', accountNumError.message);
          // Don't fail the request, just log the error
        }
      }
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

/**
 * POST /api/emails/detect-vendor
 * Detect which vendor sent an email using hierarchical pattern matching
 *
 * Body: {
 *   from: string (required) - Email sender address
 *   subject: string - Email subject line
 *   html: string - HTML email body
 *   plainText: string - Plain text email body
 * }
 *
 * Response (Success): {
 *   success: true,
 *   vendor: string - vendor code (e.g., "safilo")
 *   vendorId: string - vendor UUID
 *   vendorName: string - vendor name (e.g., "Safilo")
 *   confidence: number - confidence score (0-100)
 *   method: string - detection method used ("domain", "body_signature", "weak_patterns")
 *   signals: object - matched patterns
 *   executionTime: number - milliseconds
 * }
 *
 * Response (Unknown): {
 *   success: false,
 *   vendor: "unknown",
 *   confidence: number,
 *   needsManualReview: true,
 *   message: string,
 *   debug: object - all vendor scores for debugging
 *   executionTime: number
 * }
 */
router.post('/detect-vendor', async (req, res) => {
  try {
    const { from, subject, html, plainText } = req.body;

    console.log('\n🚀 [DETECT-VENDOR] Request received');
    console.log('  From:', from);
    console.log('  Subject:', subject);

    // Validate required field
    if (!from) {
      return res.status(400).json({
        success: false,
        error: 'Missing required field: from'
      });
    }

    // Call vendor detection service
    const result = await vendorDetectionService.detectVendor({
      from,
      subject,
      html,
      plainText
    });

    // Return appropriate status code based on result
    const statusCode = result.success ? 200 : 200; // Always 200 for valid requests

    console.log(`\n✅ [DETECT-VENDOR] Response: ${result.vendor} (${result.confidence}%)`);
    console.log(`  Execution time: ${result.executionTime}ms\n`);

    return res.status(statusCode).json(result);

  } catch (error) {
    console.error('\n❌ [DETECT-VENDOR] Error:', error);
    return res.status(500).json({
      success: false,
      vendor: 'unknown',
      confidence: 0,
      needsManualReview: true,
      error: 'Internal server error during vendor detection',
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
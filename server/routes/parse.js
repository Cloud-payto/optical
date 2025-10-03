const express = require('express');
const router = express.Router();
const { parseModernOpticalHtml } = require('../parsers/modernOpticalParser');

/**
 * POST /api/parse/modernoptical
 * Parse Modern Optical HTML email content
 *
 * Body: { html, plainText, accountId }
 * Returns: { success, accountId, vendor, order, items, unique_frames }
 */
router.post('/modernoptical', async (req, res) => {
  try {
    const { html, plainText, accountId } = req.body;

    console.log('[PARSE] Modern Optical parse request received');
    console.log('  Account ID:', accountId);
    console.log('  HTML length:', html?.length || 0);
    console.log('  Plain text length:', plainText?.length || 0);

    // Validate input
    if (!html && !plainText) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: html or plainText must be provided'
      });
    }

    // Parse the email content
    const parseResult = parseModernOpticalHtml(html, plainText);

    console.log('[PARSE] Parse completed successfully');
    console.log('  Order number:', parseResult.order?.order_number);
    console.log('  Items found:', parseResult.items?.length || 0);
    console.log('  Unique frames:', parseResult.unique_frames?.length || 0);

    // Return the parsed data
    return res.status(200).json({
      success: true,
      accountId: accountId,
      vendor: parseResult.vendor || 'modern_optical',
      order: parseResult.order,
      items: parseResult.items,
      unique_frames: parseResult.unique_frames
    });

  } catch (error) {
    console.error('[PARSE] Error parsing Modern Optical email:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to parse Modern Optical email',
      message: error.message
    });
  }
});

module.exports = router;

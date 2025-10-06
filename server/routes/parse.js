const express = require('express');
const router = express.Router();
const { parseModernOpticalHtml } = require('../parsers/modernopticalparser');
const SafiloService = require('../parsers/SafiloService');
const { parseLuxotticaHtml } = require('../parsers/luxotticaParser');
const EtniaBarcelonaService = require('../parsers/EtniaBarcelonaService');

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

/**
 * POST /api/parse/safilo
 * Parse Safilo PDF order content
 *
 * Body: { pdfBase64, accountId }
 * Returns: { success, accountId, vendor, order, items }
 */
router.post('/safilo', async (req, res) => {
  try {
    const { pdfBase64, accountId } = req.body;

    console.log('[PARSE] Safilo parse request received');
    console.log('  Account ID:', accountId);
    console.log('  PDF base64 length:', pdfBase64?.length || 0);

    // Validate input
    if (!pdfBase64) {
      return res.status(400).json({
        success: false,
        error: 'Missing required field: pdfBase64'
      });
    }

    // Convert base64 to buffer
    const pdfBuffer = Buffer.from(pdfBase64, 'base64');
    console.log('  PDF buffer size:', pdfBuffer.length, 'bytes');

    // Parse the PDF
    const safiloService = new SafiloService();
    const result = await safiloService.processOrder(pdfBuffer);

    console.log('[PARSE] Parse completed successfully');
    console.log('  Order number:', result.orderInfo?.orderNumber);
    console.log('  Frames found:', result.frames?.length || 0);
    console.log('  Total pieces:', result.statistics?.totalFrames || 0);

    // Return the parsed data
    return res.status(200).json({
      success: true,
      accountId: accountId,
      vendor: 'safilo',
      order: {
        order_number: result.orderInfo.orderNumber,
        customer_name: result.orderInfo.customerName,
        order_date: result.orderInfo.orderDate,
        total_pieces: result.statistics.totalFrames,
        reference_number: result.orderInfo.referenceNumber,
        account_number: result.orderInfo.accountNumber
      },
      items: result.frames.map(frame => ({
        brand: frame.brand,
        model: frame.model,
        color: frame.colorName,
        color_code: frame.colorCode,
        size: frame.size,
        quantity: frame.quantity || 1,
        upc: frame.enrichedData?.upc,
        wholesale_price: frame.enrichedData?.wholesale,
        msrp: frame.enrichedData?.msrp
      }))
    });

  } catch (error) {
    console.error('[PARSE] Error parsing Safilo PDF:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to parse Safilo PDF',
      message: error.message
    });
  }
});

/**
 * POST /api/parse/luxottica
 * Parse Luxottica HTML email content
 *
 * Body: { html, plainText, accountId }
 * Returns: { success, accountId, vendor, order, items, unique_frames }
 */
router.post('/luxottica', async (req, res) => {
  try {
    const { html, plainText, accountId } = req.body;

    console.log('[PARSE] Luxottica parse request received');
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
    const parseResult = parseLuxotticaHtml(html, plainText);

    console.log('[PARSE] Parse completed successfully');
    console.log('  Cart number:', parseResult.order?.order_number);
    console.log('  Items found:', parseResult.items?.length || 0);
    console.log('  Unique frames:', parseResult.unique_frames?.length || 0);

    // Return the parsed data
    return res.status(200).json({
      success: true,
      accountId: accountId,
      vendor: parseResult.vendor || 'luxottica',
      order: parseResult.order,
      items: parseResult.items,
      unique_frames: parseResult.unique_frames
    });

  } catch (error) {
    console.error('[PARSE] Error parsing Luxottica email:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to parse Luxottica email',
      message: error.message
    });
  }
});

/**
 * POST /api/parse/etnia-barcelona
 * Parse Etnia Barcelona PDF order
 *
 * Body: { pdfBuffer (base64), accountId }
 * Returns: { success, accountId, vendor, order, items, unique_frames }
 */
router.post('/etnia-barcelona', async (req, res) => {
  try {
    const { pdfBuffer, accountId } = req.body;

    console.log('[PARSE] Etnia Barcelona parse request received');
    console.log('  Account ID:', accountId);
    console.log('  PDF buffer length:', pdfBuffer?.length || 0);

    // Validate input
    if (!pdfBuffer) {
      return res.status(400).json({
        success: false,
        error: 'Missing required field: pdfBuffer must be provided'
      });
    }

    // Convert base64 to buffer if needed
    let buffer;
    if (typeof pdfBuffer === 'string') {
      buffer = Buffer.from(pdfBuffer, 'base64');
    } else if (Buffer.isBuffer(pdfBuffer)) {
      buffer = pdfBuffer;
    } else {
      return res.status(400).json({
        success: false,
        error: 'Invalid pdfBuffer format'
      });
    }

    // Parse the PDF using Etnia Barcelona service
    const etniaService = new EtniaBarcelonaService({ debug: false });
    const result = await etniaService.processOrder(buffer);

    console.log('[PARSE] Parse completed successfully');
    console.log('  Order number:', result.orderInfo?.orderNumber);
    console.log('  Items found:', result.frames?.length || 0);

    // Map to standard format
    const items = result.frames.map(frame => ({
      brand: frame.brand,
      model: frame.model,
      color: frame.colorName,
      color_code: frame.colorCode,
      size: frame.size,
      quantity: frame.quantity || 1,
      upc: frame.upc,
      wholesale_price: frame.wholesalePrice,
      sku: frame.sku,
      full_size: frame.fullSize,
      temple_length: frame.temple,
      material: frame.material,
      frame_type: frame.frameType
    }));

    // Get unique frames (brand + model combinations)
    const uniqueFramesSet = new Set();
    const uniqueFrames = [];
    result.frames.forEach(frame => {
      const key = `${frame.brand}-${frame.model}`;
      if (!uniqueFramesSet.has(key)) {
        uniqueFramesSet.add(key);
        uniqueFrames.push({
          brand: frame.brand,
          model: frame.model
        });
      }
    });

    // Return the parsed data
    return res.status(200).json({
      success: true,
      accountId: accountId,
      vendor: 'etnia_barcelona',
      order: {
        order_number: result.orderInfo.orderNumber,
        customer_name: result.orderInfo.customerName,
        order_date: result.orderInfo.orderDate,
        total_pieces: result.statistics.totalPieces,
        account_number: result.orderInfo.accountNumber,
        reference_number: result.orderInfo.customerReference
      },
      items: items,
      unique_frames: uniqueFrames
    });

  } catch (error) {
    console.error('[PARSE] Error parsing Etnia Barcelona PDF:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to parse Etnia Barcelona PDF',
      message: error.message
    });
  }
});

module.exports = router;

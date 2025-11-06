const express = require('express');
const router = express.Router();
const { parseModernOpticalHtml } = require('../parsers/modernopticalparser');
const SafiloService = require('../parsers/SafiloService');
const { parseLuxotticaHtml } = require('../parsers/luxotticaParser');
const EtniaBarcelonaService = require('../parsers/EtniaBarcelonaService');
const { parseLamyamericaHtml, validateParsedData } = require('../parsers/lamyamericaParser');
const LamyamericaService = require('../parsers/LamyamericaService');
const { parseIdealOpticsHtml } = require('../parsers/idealOpticsParser');
const IdealOpticsService = require('../parsers/IdealOpticsService');
const { supabase } = require('../lib/supabase');

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


    // Validate input
    if (!html && !plainText) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: html or plainText must be provided'
      });
    }

    // Parse the email content
    const parseResult = parseModernOpticalHtml(html, plainText);


    // Get vendor ID from database
    const { data: vendor } = await supabase
      .from('vendors')
      .select('id')
      .eq('code', 'MODERN')
      .single();

    // Return the parsed data
    return res.status(200).json({
      success: true,
      accountId: accountId,
      vendor: parseResult.vendor || 'modern_optical',
      vendorId: vendor?.id,
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

    // Validate input
    if (!pdfBase64) {
      return res.status(400).json({
        success: false,
        error: 'Missing required field: pdfBase64'
      });
    }

    // Convert base64 to buffer
    const pdfBuffer = Buffer.from(pdfBase64, 'base64');

    // Parse the PDF
    const safiloService = new SafiloService();
    const result = await safiloService.processOrder(pdfBuffer);


    // Get vendor ID from database
    const { data: vendor } = await supabase
      .from('vendors')
      .select('id')
      .eq('code', 'SAFILO')
      .single();

    // Return the parsed data
    return res.status(200).json({
      success: true,
      accountId: accountId,
      vendor: 'safilo',
      vendorId: vendor?.id,
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


    // Validate input
    if (!html && !plainText) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: html or plainText must be provided'
      });
    }

    // Parse the email content
    const parseResult = parseLuxotticaHtml(html, plainText);


    // Get vendor ID from database
    const { data: vendor } = await supabase
      .from('vendors')
      .select('id')
      .eq('code', 'LUX')
      .single();

    // Return the parsed data
    return res.status(200).json({
      success: true,
      accountId: accountId,
      vendor: parseResult.vendor || 'luxottica',
      vendorId: vendor?.id,
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
 * Body: { pdfBase64, accountId }
 * Returns: { success, accountId, vendor, order, items, unique_frames }
 */
router.post('/etnia-barcelona', async (req, res) => {
  try {
    const { pdfBase64, accountId } = req.body;

    // Validate input
    if (!pdfBase64) {
      return res.status(400).json({
        success: false,
        error: 'Missing required field: pdfBase64'
      });
    }

    // Convert base64 to buffer
    const pdfBuffer = Buffer.from(pdfBase64, 'base64');

    // Parse the PDF using Etnia Barcelona service
    const etniaService = new EtniaBarcelonaService({ debug: false });
    const result = await etniaService.processOrder(pdfBuffer);


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

    // Get vendor ID from database
    const { data: vendor } = await supabase
      .from('vendors')
      .select('id')
      .eq('code', 'ETNIA')
      .single();

    // Return the parsed data
    return res.status(200).json({
      success: true,
      accountId: accountId,
      vendor: 'etnia_barcelona',
      vendorId: vendor?.id,
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

/**
 * POST /api/parse/lamy
 * Parse L'amyamerica HTML email content with UPC-based API enrichment
 *
 * Body: { html, plainText, accountId }
 * Returns: { success, accountId, vendor, order, items, unique_frames, enrichment }
 */
router.post('/lamy', async (req, res) => {
  try {
    const { html, plainText, accountId } = req.body;


    // Validate input
    if (!html && !plainText) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: html or plainText must be provided'
      });
    }

    // Phase 1: Parse the email content
    const parsedData = parseLamyamericaHtml(html, plainText);

    // Validate parsed data
    const validation = validateParsedData(parsedData);
    if (!validation.valid) {
      console.error('[PARSE] Validation failed:', validation.errors);
      return res.status(400).json({
        success: false,
        error: 'Email parsing validation failed',
        errors: validation.errors,
        warnings: validation.warnings
      });
    }

    if (validation.warnings.length > 0) {
      console.warn('[PARSE] Warnings:', validation.warnings);
    }

    // Phase 2: Enrich with API data using UPCs
    let enrichedData = parsedData;
    try {
      const lamyService = new LamyamericaService({ debug: false });
      enrichedData = await lamyService.enrichOrderData(parsedData);
    } catch (enrichmentError) {
      console.error('[PARSE] API enrichment failed:', enrichmentError.message);
      // Continue with non-enriched data
    }

    // Get unique frames (brand + model combinations)
    const uniqueFramesSet = new Set();
    const uniqueFrames = [];
    enrichedData.items.forEach(item => {
      const key = `${item.brand}-${item.model}`;
      if (!uniqueFramesSet.has(key)) {
        uniqueFramesSet.add(key);
        uniqueFrames.push({
          brand: item.brand,
          model: item.model
        });
      }
    });

    // Map items to standard format
    const items = enrichedData.items.map(item => ({
      brand: item.brand,
      model: item.model,
      color: item.color,
      color_code: item.colorCode,
      color_name: item.colorName,
      size: item.size,
      eye_size: item.eyeSize,
      bridge: item.bridge,
      temple: item.temple,
      quantity: item.quantity,
      upc: item.upc,
      image_url: item.imageUrl,
      // Enriched data from API
      wholesale_price: item.enrichedData?.wholesale,
      msrp: item.enrichedData?.msrp,
      in_stock: item.enrichedData?.inStock,
      availability: item.enrichedData?.availability,
      material: item.enrichedData?.material,
      frame_type: item.enrichedData?.frameType,
      shape: item.enrichedData?.shape,
      gender: item.enrichedData?.gender,
      country_of_origin: item.enrichedData?.countryOfOrigin,
      // Validation info
      validated: item.validation?.validated,
      validation_confidence: item.validation?.confidence
    }));

    // Calculate total pieces and wholesale total
    const totalPieces = items.reduce((sum, item) => sum + item.quantity, 0);
    const totalWholesale = items.reduce((sum, item) => {
      const price = item.wholesale_price || 0;
      return sum + (price * item.quantity);
    }, 0);

    // Get vendor ID from database
    const { data: vendor } = await supabase
      .from('vendors')
      .select('id')
      .eq('code', 'lamyamerica')
      .single();

    // Return the parsed and enriched data
    return res.status(200).json({
      success: true,
      accountId: accountId,
      vendor: 'lamyamerica',
      vendorId: vendor?.id,
      order: {
        order_number: enrichedData.orderNumber,
        customer_name: enrichedData.customerName,
        order_date: enrichedData.orderDate,
        rep_name: enrichedData.repName,
        account_number: enrichedData.accountNumber,
        total_pieces: totalPieces,
        total_wholesale: totalWholesale > 0 ? totalWholesale : null
      },
      items: items,
      unique_frames: uniqueFrames,
      enrichment: enrichedData.enrichment || null,
      validation: {
        warnings: validation.warnings
      }
    });

  } catch (error) {
    console.error('[PARSE] Error parsing L\'amyamerica email:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to parse L\'amyamerica email',
      message: error.message
    });
  }
});

/**
 * POST /api/parse/idealoptics
 * Parse Ideal Optics HTML email content with web enrichment
 *
 * Body: { html, plainText, accountId }
 * Returns: { success, accountId, vendor, order, items, unique_frames, enrichment }
 */
router.post('/idealoptics', async (req, res) => {
  try {
    const { html, plainText, accountId } = req.body;


    // Validate input
    if (!html && !plainText) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: html or plainText must be provided'
      });
    }

    // Phase 1: Parse the email content
    const parsedData = parseIdealOpticsHtml(html, plainText);

    // Phase 2: Web enrichment is handled separately during confirmation
    // Not during initial parsing to keep webhook fast
    const enrichedData = parsedData;

    // Get unique frames (brand + model combinations)
    const uniqueFramesSet = new Set();
    const uniqueFrames = [];
    enrichedData.items.forEach(item => {
      const key = `${item.brand}-${item.model}`;
      if (!uniqueFramesSet.has(key)) {
        uniqueFramesSet.add(key);
        uniqueFrames.push({
          brand: item.brand,
          model: item.model
        });
      }
    });

    // Map items to standard format
    const items = enrichedData.items.map(item => ({
      brand: item.brand,
      model: item.model,
      color: item.color,
      color_code: item.colorCode || item.color_code,
      color_name: item.colorName || item.color_name,
      size: item.full_size || item.size,
      eye_size: item.eye_size,
      bridge: item.bridge,
      temple_length: item.temple_length,
      quantity: item.quantity,
      upc: item.upc,
      sku: item.sku,
      // Enriched data from web scraping
      wholesale_price: item.enrichedData?.wholesale,
      msrp: item.enrichedData?.msrp,
      in_stock: item.in_stock !== undefined ? item.in_stock : item.enrichedData?.inStock,
      material: item.material || item.enrichedData?.material,
      gender: item.gender || item.enrichedData?.gender,
      // Validation info
      validated: item.validation?.validated || item.api_verified,
      validation_confidence: item.validation?.confidence || item.confidence_score
    }));

    // Calculate total pieces and wholesale total
    const totalPieces = items.reduce((sum, item) => sum + item.quantity, 0);
    const totalWholesale = items.reduce((sum, item) => {
      const price = item.wholesale_price || 0;
      return sum + (price * item.quantity);
    }, 0);

    // Get vendor ID from database
    const { data: vendor } = await supabase
      .from('vendors')
      .select('id')
      .eq('code', 'ideal_optics')
      .single();

    // Return the parsed and enriched data
    return res.status(200).json({
      success: true,
      accountId: accountId,
      vendor: 'ideal_optics',
      vendorId: vendor?.id,
      order: {
        order_number: enrichedData.orderNumber,
        customer_name: enrichedData.customerName,
        order_date: enrichedData.orderDate,
        ordered_by: enrichedData.orderedBy,
        account_number: enrichedData.accountNumber,
        total_pieces: totalPieces,
        total_wholesale: totalWholesale > 0 ? totalWholesale : null,
        ship_method: enrichedData.shipMethod,
        purchase_order: enrichedData.purchaseOrder,
        notes: enrichedData.notes,
        promotional_code: enrichedData.promotionalCode
      },
      shipping_address: {
        address: enrichedData.shippingAddress,
        city: enrichedData.shippingCity,
        state: enrichedData.shippingState,
        postal_code: enrichedData.shippingPostalCode
      },
      items: items,
      unique_frames: uniqueFrames,
      enrichment: enrichedData.enrichment || null
    });

  } catch (error) {
    console.error('[PARSE] Error parsing Ideal Optics email:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to parse Ideal Optics email',
      message: error.message
    });
  }
});

module.exports = router;

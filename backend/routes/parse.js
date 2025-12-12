const express = require('express');
const router = express.Router();
const { parseModernOpticalHtml } = require('../parsers/modernOpticalParser');
const SafiloService = require('../parsers/SafiloService');
const { parseLuxotticaHtml } = require('../parsers/luxotticaParser');
const EtniaBarcelonaService = require('../parsers/EtniaBarcelonaService');
const { parseLamyamericaHtml, validateParsedData } = require('../parsers/lamyamericaParser');
const LamyamericaService = require('../parsers/LamyamericaService');
const { parseIdealOpticsHtml } = require('../parsers/idealOpticsParser');
const IdealOpticsService = require('../parsers/IdealOpticsService');
const { parseKenmarkHtml, validateParsedData: validateKenmarkData } = require('../parsers/kenmarkParser');
const KenmarkService = require('../parsers/KenmarkService');
const { parseEuropaHtml, validateParsedData: validateEuropaData } = require('../parsers/europaParser');
const { parseMarchonHtml, validateParsedData: validateMarchonData } = require('../parsers/marchonParser');
const { parseClearVisionHtml, validateParsedData: validateClearVisionData } = require('../parsers/clearvisionParser');
const { normalizeEmail, detectProviders } = require('../utils/emailNormalizer');
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
 * Body: { pdfBase64, accountId } OR { attachments, accountId }
 * Returns: { success, accountId, vendor, order, items }
 *
 * Supports two modes:
 * 1. Direct pdfBase64: Pass the PDF content directly
 * 2. Attachments array: Extract PDF from CloudMailin attachments format
 */
router.post('/safilo', async (req, res) => {
  try {
    const { pdfBase64, attachments, accountId } = req.body;

    let pdfBuffer;

    // Mode 1: Direct pdfBase64 provided
    if (pdfBase64) {
      pdfBuffer = Buffer.from(pdfBase64, 'base64');
    }
    // Mode 2: Extract PDF from attachments array (CloudMailin format)
    else if (attachments && Array.isArray(attachments) && attachments.length > 0) {
      // Find PDF attachment - CloudMailin format has content_type and content (base64)
      const pdfAttachment = attachments.find(att =>
        att.content_type === 'application/pdf' ||
        att.content_type === 'application/octet-stream' ||
        (att.file_name && att.file_name.toLowerCase().endsWith('.pdf'))
      );

      if (!pdfAttachment) {
        return res.status(400).json({
          success: false,
          error: 'No PDF attachment found in email',
          attachmentTypes: attachments.map(a => ({ name: a.file_name, type: a.content_type }))
        });
      }

      // CloudMailin provides content as base64
      const base64Content = pdfAttachment.content || pdfAttachment.data;
      if (!base64Content) {
        return res.status(400).json({
          success: false,
          error: 'PDF attachment found but no content available',
          attachment: { name: pdfAttachment.file_name, type: pdfAttachment.content_type }
        });
      }

      pdfBuffer = Buffer.from(base64Content, 'base64');
      console.log(`[PARSE] Safilo: Extracted PDF from attachment: ${pdfAttachment.file_name}`);
    }
    // No valid PDF source
    else {
      return res.status(400).json({
        success: false,
        error: 'Missing required field: pdfBase64 or attachments with PDF',
        hint: 'Safilo orders require a PDF attachment. Either provide pdfBase64 directly or pass the attachments array from the email.'
      });
    }

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
 * Body: { pdfBase64, accountId } OR { attachments, accountId }
 * Returns: { success, accountId, vendor, order, items, unique_frames }
 *
 * Supports two modes:
 * 1. Direct pdfBase64: Pass the PDF content directly
 * 2. Attachments array: Extract PDF from CloudMailin attachments format
 */
router.post('/etnia-barcelona', async (req, res) => {
  try {
    const { pdfBase64, attachments, accountId } = req.body;

    let pdfBuffer;

    // Mode 1: Direct pdfBase64 provided
    if (pdfBase64) {
      pdfBuffer = Buffer.from(pdfBase64, 'base64');
    }
    // Mode 2: Extract PDF from attachments array (CloudMailin format)
    else if (attachments && Array.isArray(attachments) && attachments.length > 0) {
      // Find PDF attachment
      const pdfAttachment = attachments.find(att =>
        att.content_type === 'application/pdf' ||
        att.content_type === 'application/octet-stream' ||
        (att.file_name && att.file_name.toLowerCase().endsWith('.pdf'))
      );

      if (!pdfAttachment) {
        return res.status(400).json({
          success: false,
          error: 'No PDF attachment found in email',
          attachmentTypes: attachments.map(a => ({ name: a.file_name, type: a.content_type }))
        });
      }

      const base64Content = pdfAttachment.content || pdfAttachment.data;
      if (!base64Content) {
        return res.status(400).json({
          success: false,
          error: 'PDF attachment found but no content available',
          attachment: { name: pdfAttachment.file_name, type: pdfAttachment.content_type }
        });
      }

      pdfBuffer = Buffer.from(base64Content, 'base64');
      console.log(`[PARSE] Etnia Barcelona: Extracted PDF from attachment: ${pdfAttachment.file_name}`);
    }
    // No valid PDF source
    else {
      return res.status(400).json({
        success: false,
        error: 'Missing required field: pdfBase64 or attachments with PDF',
        hint: 'Etnia Barcelona orders require a PDF attachment. Either provide pdfBase64 directly or pass the attachments array from the email.'
      });
    }

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
    const { data: vendor, error: vendorError } = await supabase
      .from('vendors')
      .select('id')
      .eq('code', 'LAMY')
      .single();

    if (vendorError) {
      console.warn(`[PARSE] Vendor lookup warning for LAMY:`, vendorError.message);
    } else {
      console.log(`✓ Found vendor ID: ${vendor?.id} for LAMY`);
    }

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

/**
 * POST /api/parse/kenmark
 * Parse Kenmark HTML email content with UPC-based API enrichment
 *
 * Body: { html, plainText, accountId }
 * Returns: { success, accountId, vendor, order, items, unique_frames, enrichment }
 */
router.post('/kenmark', async (req, res) => {
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
    const parsedData = parseKenmarkHtml(html, plainText);

    // Validate parsed data
    const validation = validateKenmarkData(parsedData);
    if (!validation.valid) {
      console.error('[PARSE] Kenmark validation failed:', validation.errors);
      return res.status(400).json({
        success: false,
        error: 'Email parsing validation failed',
        errors: validation.errors,
        warnings: validation.warnings
      });
    }

    if (validation.warnings.length > 0) {
      console.warn('[PARSE] Kenmark warnings:', validation.warnings);
    }

    // Phase 2: Enrich with API data using UPCs
    let enrichedData = parsedData;
    try {
      const kenmarkService = new KenmarkService({ debug: false });
      enrichedData = await kenmarkService.enrichOrderData(parsedData);
    } catch (enrichmentError) {
      console.error('[PARSE] Kenmark API enrichment failed:', enrichmentError.message);
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
      .eq('code', 'KENMARK')
      .single();

    // Return the parsed and enriched data
    return res.status(200).json({
      success: true,
      accountId: accountId,
      vendor: 'kenmark',
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
    console.error('[PARSE] Error parsing Kenmark email:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to parse Kenmark email',
      message: error.message
    });
  }
});

/**
 * POST /api/parse/europa
 * Parse Europa HTML email content
 *
 * Body: { html, plainText, accountId }
 * Returns: { success, accountId, vendor, order, items, unique_frames }
 */
router.post('/europa', async (req, res) => {
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
    const parsedData = parseEuropaHtml(html, plainText);

    // Validate parsed data
    const validation = validateEuropaData(parsedData);
    if (!validation.valid) {
      console.error('[PARSE] Europa validation failed:', validation.errors);
      return res.status(400).json({
        success: false,
        error: 'Email parsing validation failed',
        errors: validation.errors,
        warnings: validation.warnings
      });
    }

    if (validation.warnings.length > 0) {
      console.warn('[PARSE] Europa warnings:', validation.warnings);
    }

    // Get unique frames (brand + model combinations)
    const uniqueFramesSet = new Set();
    const uniqueFrames = [];
    parsedData.items.forEach(item => {
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
    const items = parsedData.items.map(item => ({
      brand: item.brand,
      model: item.model,
      color: item.color,
      color_code: item.colorCode,
      color_name: item.colorName,
      size: item.size,
      eye_size: item.eyeSize,
      quantity: item.quantity,
      order_type: item.orderType,
      in_stock: item.inStock,
      availability: item.availability
    }));

    // Calculate total pieces
    const totalPieces = items.reduce((sum, item) => sum + item.quantity, 0);

    // Get vendor ID from database
    const { data: vendor } = await supabase
      .from('vendors')
      .select('id')
      .eq('code', 'EUROPA')
      .single();

    // Return the parsed data
    return res.status(200).json({
      success: true,
      accountId: accountId,
      vendor: 'europa',
      vendorId: vendor?.id,
      order: {
        order_number: parsedData.orderNumber,
        customer_name: parsedData.customerName,
        order_date: parsedData.orderDate,
        rep_name: parsedData.repName,
        account_number: parsedData.accountNumber,
        total_pieces: totalPieces,
        terms: parsedData.terms,
        ship_method: parsedData.shipMethod
      },
      customer: {
        name: parsedData.customerName,
        address: parsedData.customerAddress,
        city: parsedData.customerCity,
        state: parsedData.customerState,
        postal_code: parsedData.customerPostalCode,
        phone: parsedData.customerPhone
      },
      shipping_address: {
        name: parsedData.shipToName,
        address: parsedData.shipToAddress,
        city: parsedData.shipToCity,
        state: parsedData.shipToState,
        postal_code: parsedData.shipToPostalCode
      },
      items: items,
      unique_frames: uniqueFrames,
      validation: {
        warnings: validation.warnings
      }
    });

  } catch (error) {
    console.error('[PARSE] Error parsing Europa email:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to parse Europa email',
      message: error.message
    });
  }
});

/**
 * POST /api/parse/marchon
 * Parse Marchon HTML email content
 *
 * Body: { html, plainText, accountId }
 * Returns: { success, accountId, vendor, order, items, unique_frames }
 */
router.post('/marchon', async (req, res) => {
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
    const parsedData = parseMarchonHtml(html, plainText);

    // Validate parsed data
    const validation = validateMarchonData(parsedData);
    if (!validation.valid) {
      console.error('[PARSE] Marchon validation failed:', validation.errors);
      return res.status(400).json({
        success: false,
        error: 'Email parsing validation failed',
        errors: validation.errors,
        warnings: validation.warnings
      });
    }

    if (validation.warnings.length > 0) {
      console.warn('[PARSE] Marchon warnings:', validation.warnings);
    }

    // Get unique frames (brand + model combinations)
    const uniqueFramesSet = new Set();
    const uniqueFrames = [];
    parsedData.items.forEach(item => {
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
    const items = parsedData.items.map(item => ({
      brand: item.brand,
      model: item.model,
      color: item.color,
      color_code: item.colorCode,
      color_name: item.colorName,
      size: item.size,
      eye_size: item.eyeSize,
      quantity: item.quantity,
      image_url: item.imageUrl,
      product_url: item.productUrl
    }));

    // Calculate total pieces
    const totalPieces = items.reduce((sum, item) => sum + item.quantity, 0);

    // Get vendor ID from database
    const { data: vendor } = await supabase
      .from('vendors')
      .select('id')
      .eq('code', 'MARCHON')
      .single();

    // Return the parsed data
    return res.status(200).json({
      success: true,
      accountId: accountId,
      vendor: 'marchon',
      vendorId: vendor?.id,
      order: {
        order_number: parsedData.orderNumber,
        customer_name: parsedData.customerName,
        order_date: parsedData.orderDate,
        rep_name: parsedData.repName,
        account_number: parsedData.accountNumber,
        total_pieces: totalPieces,
        terms: parsedData.terms,
        promotions: parsedData.promotions,
        order_note: parsedData.orderNote
      },
      customer: {
        name: parsedData.customerName,
        address: parsedData.customerAddress,
        city: parsedData.customerCity,
        state: parsedData.customerState,
        postal_code: parsedData.customerPostalCode
      },
      shipping_address: {
        name: parsedData.shipToName,
        address: parsedData.shipToAddress,
        city: parsedData.shipToCity,
        state: parsedData.shipToState,
        postal_code: parsedData.shipToPostalCode
      },
      items: items,
      unique_frames: uniqueFrames,
      validation: {
        warnings: validation.warnings
      }
    });

  } catch (error) {
    console.error('[PARSE] Error parsing Marchon email:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to parse Marchon email',
      message: error.message
    });
  }
});

/**
 * POST /api/parse/clearvision
 * Parse ClearVision Optical HTML email content
 *
 * Body: { html, plainText, accountId }
 * Returns: { success, accountId, vendor, order, items, unique_frames }
 */
router.post('/clearvision', async (req, res) => {
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
    const parsedData = parseClearVisionHtml(html, plainText);

    // Validate parsed data
    const validation = validateClearVisionData(parsedData);
    if (!validation.valid) {
      console.error('[PARSE] ClearVision validation failed:', validation.errors);
      return res.status(400).json({
        success: false,
        error: 'Email parsing validation failed',
        errors: validation.errors,
        warnings: validation.warnings
      });
    }

    if (validation.warnings.length > 0) {
      console.warn('[PARSE] ClearVision warnings:', validation.warnings);
    }

    // Get unique frames (brand + model combinations)
    const uniqueFramesSet = new Set();
    const uniqueFrames = [];
    parsedData.items.forEach(item => {
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
    const items = parsedData.items.map(item => ({
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
      sku: item.sku,
      part_number: item.partNumber,
      wholesale_price: item.listPrice,
      description: item.description,
      image_url: item.imageUrl
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
      .eq('code', 'CLEARVISION')
      .single();

    // Return the parsed data
    return res.status(200).json({
      success: true,
      accountId: accountId,
      vendor: 'clearvision',
      vendorId: vendor?.id,
      order: {
        order_number: parsedData.orderNumber,
        customer_name: parsedData.customerName,
        order_date: parsedData.orderDate,
        rep_name: parsedData.repName,
        account_number: parsedData.accountNumber,
        total_pieces: totalPieces,
        total_wholesale: totalWholesale > 0 ? totalWholesale : null,
        terms: parsedData.terms,
        ship_method: parsedData.shipMethod,
        territory: parsedData.territory
      },
      customer: {
        name: parsedData.customerName,
        address: parsedData.customerAddress,
        city: parsedData.customerCity,
        state: parsedData.customerState,
        postal_code: parsedData.customerPostalCode,
        phone: parsedData.customerPhone
      },
      shipping_address: {
        name: parsedData.shipToName,
        address: parsedData.shipToAddress,
        city: parsedData.shipToCity,
        state: parsedData.shipToState,
        postal_code: parsedData.shipToPostalCode
      },
      items: items,
      unique_frames: uniqueFrames,
      validation: {
        warnings: validation.warnings
      }
    });

  } catch (error) {
    console.error('[PARSE] Error parsing ClearVision email:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to parse ClearVision email',
      message: error.message
    });
  }
});

/**
 * POST /api/parse/clean-email
 * Clean/normalize forwarded email HTML by stripping provider-specific wrappers
 *
 * This endpoint should be called BEFORE vendor-specific parsing to ensure
 * consistent HTML structure regardless of email provider (Zoho, Gmail, Outlook).
 *
 * Body: { html, vendor? }
 * - html: The raw HTML content from the forwarded email
 * - vendor: (optional) Vendor identifier to help extract relevant content
 *
 * Returns: {
 *   success: boolean,
 *   cleanedHtml: string,        // The normalized HTML
 *   detectedProviders: string[], // Which email providers were detected
 *   metadata: {
 *     originalLength: number,
 *     cleanedLength: number,
 *     reductionPercent: number
 *   }
 * }
 */
router.post('/clean-email', async (req, res) => {
  try {
    const { html, vendor } = req.body;

    // Validate input
    if (!html) {
      return res.status(400).json({
        success: false,
        error: 'Missing required field: html'
      });
    }

    console.log('[CLEAN-EMAIL] Processing email...');
    console.log('[CLEAN-EMAIL] Original HTML length:', html.length);

    // Normalize the email HTML
    const result = normalizeEmail(html);

    console.log('[CLEAN-EMAIL] Detected providers:', result.detectedProviders.join(', ') || 'none');
    console.log('[CLEAN-EMAIL] Cleaned HTML length:', result.metadata.cleanedLength);
    console.log('[CLEAN-EMAIL] Reduction:', result.metadata.reductionPercent + '%');

    return res.status(200).json({
      success: true,
      cleanedHtml: result.cleanedHtml,
      detectedProviders: result.detectedProviders,
      metadata: result.metadata
    });

  } catch (error) {
    console.error('[CLEAN-EMAIL] Error normalizing email:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to normalize email',
      message: error.message
    });
  }
});

/**
 * POST /api/parse/detect-provider
 * Detect which email provider(s) wrapped the email
 *
 * Body: { html }
 * Returns: { success, providers: string[] }
 */
router.post('/detect-provider', async (req, res) => {
  try {
    const { html } = req.body;

    if (!html) {
      return res.status(400).json({
        success: false,
        error: 'Missing required field: html'
      });
    }

    const providers = detectProviders(html);

    return res.status(200).json({
      success: true,
      providers
    });

  } catch (error) {
    console.error('[DETECT-PROVIDER] Error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to detect email provider',
      message: error.message
    });
  }
});

module.exports = router;

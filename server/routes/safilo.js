const express = require('express');
const multer = require('multer');
const router = express.Router();
const SafiloService = require('../parsers/SafiloService');
const { saveInventoryItems, updateEmailWithParsedData, getEmailsByAccount } = require('../db/database');

// Configure multer for file uploads
const upload = multer({ 
  storage: multer.memoryStorage(),
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are allowed'), false);
    }
  },
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  }
});

// Initialize SafiloService
const safiloService = new SafiloService({
  debug: process.env.NODE_ENV !== 'production',
  minConfidence: 50,
  batchSize: 5,
  timeout: 15000
});

/**
 * Transform SafiloService result to match existing database schema
 * @param {object} safiloResult - Result from SafiloService.processOrder
 * @returns {object} Transformed data for database
 */
function transformSafiloResult(safiloResult) {
  const { orderInfo, frames, statistics } = safiloResult;
  
  // Transform frames to items format expected by database
  const items = frames.map(frame => ({
    // Basic frame data
    sku: `${frame.brand.replace(/\s+/g, '_')}-${frame.model.replace(/[\s\/]/g, '_')}-${frame.colorCode}`,
    brand: frame.brand,
    model: frame.model,
    color: frame.colorName,
    color_code: frame.colorCode,
    color_name: frame.colorName,
    size: frame.size,
    full_size: frame.size,
    temple_length: frame.temple,
    quantity: frame.quantity || 1,
    vendor: 'Safilo',
    
    // Enriched API data (if available)
    upc: frame.enrichedData?.upc || null,
    ean: frame.enrichedData?.ean || null,
    wholesale_price: frame.enrichedData?.wholesale || null,
    msrp: frame.enrichedData?.msrp || null,
    in_stock: frame.enrichedData?.inStock || null,
    availability: frame.enrichedData?.availability || null,
    material: frame.enrichedData?.material || null,
    country_of_origin: frame.enrichedData?.countryOfOrigin || null,
    
    // Validation data
    api_verified: frame.validation?.validated || false,
    confidence_score: frame.validation?.confidence || 0,
    validation_reason: frame.validation?.reason || null
  }));
  
  return {
    vendor: 'Safilo',
    account_number: orderInfo.accountNumber,
    brands: [...new Set(frames.map(f => f.brand))],
    order: {
      order_number: orderInfo.orderNumber,
      reference_number: orderInfo.referenceNumber,
      vendor: 'Safilo',
      account_number: orderInfo.accountNumber,
      customer_name: orderInfo.customerName,
      customer_code: orderInfo.customerCode,
      placed_by: orderInfo.placedBy,
      order_date: orderInfo.orderDate,
      phone: orderInfo.customerPhone,
      total_pieces: items.reduce((sum, item) => sum + item.quantity, 0),
      parse_status: 'parsed'
    },
    items: items,
    parsed_at: new Date().toISOString(),
    parser_version: 'SafiloService-1.0',
    // Include statistics for monitoring
    enrichment_stats: statistics
  };
}

/**
 * POST /api/safilo/process - Manual PDF processing endpoint
 */
router.post('/process', upload.single('pdf'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No PDF file uploaded'
      });
    }

    console.log('📄 Processing Safilo PDF manually:', req.file.originalname);

    // Process the PDF with SafiloService
    const result = await safiloService.processOrder(req.file.buffer);

    res.json({
      success: true,
      data: result,
      summary: {
        totalFrames: result.frames.length,
        validatedFrames: result.statistics.validated,
        validationRate: result.statistics.validationRate,
        processingTime: result.statistics.processingTimeSeconds,
        framesPerSecond: result.statistics.framesPerSecond
      }
    });

  } catch (error) {
    console.error('SafiloService processing error:', error);
    res.status(500).json({
      success: false,
      error: 'Processing failed',
      message: error.message
    });
  }
});

/**
 * POST /api/safilo/reprocess - Re-process existing order with API enrichment
 */
router.post('/reprocess', async (req, res) => {
  try {
    const { emailId, accountId } = req.body;

    if (!emailId || !accountId) {
      return res.status(400).json({
        success: false,
        error: 'emailId and accountId are required'
      });
    }

    console.log(`🔄 Re-processing Safilo order for email ${emailId}`);

    // Get the original email data
    const emails = getEmailsByAccount(accountId);
    const email = emails.find(e => e.id === parseInt(emailId));

    if (!email) {
      return res.status(404).json({
        success: false,
        error: 'Email not found'
      });
    }

    // Check if email has PDF attachment
    let pdfAttachment = null;
    if (email.raw_data) {
      const rawData = JSON.parse(email.raw_data);
      pdfAttachment = rawData.attachments?.find(att => 
        att.content_type === 'application/pdf' || 
        att.file_name?.toLowerCase().endsWith('.pdf')
      );
    }

    if (!pdfAttachment) {
      return res.status(400).json({
        success: false,
        error: 'No PDF attachment found in original email'
      });
    }

    // Convert base64 to buffer
    const pdfBuffer = Buffer.from(pdfAttachment.content, 'base64');

    // Re-process with SafiloService
    const enrichedResult = await safiloService.processOrder(pdfBuffer);

    // Transform result to database format
    const transformedData = transformSafiloResult(enrichedResult);

    // Update email with new enriched data
    updateEmailWithParsedData(emailId, {
      ...transformedData,
      reprocessed_at: new Date().toISOString(),
      reprocessing_stats: enrichedResult.statistics
    });

    // Save/update inventory items with enriched data
    saveInventoryItems(accountId, transformedData.items.map(item => ({
      ...item,
      status: 'pending', // Keep as pending for review
      email_id: emailId,
      reprocessed: true
    })));

    res.json({
      success: true,
      message: 'Order re-processed successfully',
      emailId: emailId,
      summary: {
        totalFrames: enrichedResult.frames.length,
        validatedFrames: enrichedResult.statistics.validated,
        validationRate: enrichedResult.statistics.validationRate,
        processingTime: enrichedResult.statistics.processingTimeSeconds
      }
    });

  } catch (error) {
    console.error('Re-processing error:', error);
    res.status(500).json({
      success: false,
      error: 'Re-processing failed',
      message: error.message
    });
  }
});

/**
 * GET /api/safilo/orders/:orderId/enriched - Get enriched order data
 */
router.get('/orders/:orderId/enriched', (req, res) => {
  try {
    const { orderId } = req.params;
    
    // TODO: Implement order retrieval with enriched data
    // This would fetch the order and include all enriched API data
    
    res.json({
      success: true,
      message: 'Enriched order data endpoint - TODO: Implement'
    });

  } catch (error) {
    console.error('Error fetching enriched order:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/safilo/statistics - Get processing statistics
 */
router.get('/statistics', (req, res) => {
  try {
    const { accountId } = req.query;
    
    if (!accountId) {
      return res.status(400).json({
        success: false,
        error: 'accountId is required'
      });
    }

    // Get recent emails with Safilo data
    const emails = getEmailsByAccount(accountId);
    const safiloEmails = emails.filter(email => 
      email.parsed_data?.vendor === 'Safilo' && 
      email.parsed_data?.enrichment_stats
    );

    // Aggregate statistics
    const stats = {
      totalOrders: safiloEmails.length,
      totalFrames: 0,
      totalValidated: 0,
      averageConfidence: 0,
      processingTimes: [],
      validationRates: []
    };

    safiloEmails.forEach(email => {
      const enrichStats = email.parsed_data.enrichment_stats;
      if (enrichStats) {
        stats.totalFrames += enrichStats.totalFrames || 0;
        stats.totalValidated += enrichStats.validated || 0;
        stats.processingTimes.push(parseFloat(enrichStats.processingTimeSeconds) || 0);
        stats.validationRates.push(parseInt(enrichStats.validationRate?.replace('%', '') || '0'));
      }
    });

    // Calculate averages
    if (stats.processingTimes.length > 0) {
      stats.averageProcessingTime = (stats.processingTimes.reduce((a, b) => a + b, 0) / stats.processingTimes.length).toFixed(2);
    }
    
    if (stats.validationRates.length > 0) {
      stats.averageValidationRate = Math.round(stats.validationRates.reduce((a, b) => a + b, 0) / stats.validationRates.length);
    }

    res.json({
      success: true,
      statistics: stats
    });

  } catch (error) {
    console.error('Error fetching statistics:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;
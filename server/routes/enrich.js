const express = require('express');
const router = express.Router();
const parserRegistry = require('../parsers');
const { supabase, inventoryOperations } = require('../lib/supabase');

/**
 * POST /api/enrich/modernoptical
 * Enrich Modern Optical items with web scraping data
 *
 * Body: {
 *   accountId: string (UUID),
 *   orderNumber: string,
 *   items?: array (optional - if provided, enrich these items; otherwise fetch from DB)
 * }
 *
 * Returns: {
 *   success: boolean,
 *   message: string,
 *   enrichedItems: array,
 *   enrichedCount: number
 * }
 */
router.post('/modernoptical', async (req, res) => {
  try {
    const { accountId, orderNumber, items } = req.body;

    console.log('[ENRICH] Modern Optical enrichment request received');
    console.log('  Account ID:', accountId);
    console.log('  Order Number:', orderNumber);
    console.log('  Items provided:', items ? items.length : 'No, will fetch from DB');

    // Validate required fields
    if (!accountId || !orderNumber) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: accountId and orderNumber are required'
      });
    }

    // Get the Modern Optical service
    const modernOpticalService = parserRegistry.getModernOpticalService();
    if (!modernOpticalService) {
      return res.status(500).json({
        success: false,
        error: 'Modern Optical service not available'
      });
    }

    let itemsToEnrich = items;

    // If items not provided, fetch pending items from database
    if (!itemsToEnrich || itemsToEnrich.length === 0) {
      console.log('[ENRICH] Fetching pending items from database...');

      // Get all pending items for this user
      const { data: allPendingItems, error: inventoryError } = await supabase
        .from('inventory')
        .select('*')
        .eq('account_id', accountId)
        .eq('status', 'pending');

      if (inventoryError) {
        console.error('[ENRICH] Error fetching items:', inventoryError);
        return res.status(500).json({
          success: false,
          error: 'Failed to fetch pending items',
          message: inventoryError.message
        });
      }

      // Filter items that match the order number
      itemsToEnrich = allPendingItems?.filter(item => {
        // Check if enriched_data contains the order number
        if (item.enriched_data?.order_number === orderNumber) return true;
        if (item.enriched_data?.order?.order_number === orderNumber) return true;
        return false;
      }) || [];

      console.log(`[ENRICH] Found ${itemsToEnrich.length} pending items for order ${orderNumber}`);

      if (itemsToEnrich.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'No pending items found for this order',
          message: `No pending items found for order ${orderNumber}`
        });
      }
    }

    // Separate items that need scraping vs already have cached data
    const itemsNeedingScraping = [];
    const itemsWithCachedData = [];

    itemsToEnrich.forEach(item => {
      // Check if item already has enriched data from catalog cache
      const hasWholesalePrice = item.wholesale_price && item.wholesale_price > 0;
      const hasUpc = item.upc && item.upc.length > 0;
      const alreadyEnriched = item.api_verified === true;

      if (alreadyEnriched || (hasWholesalePrice && hasUpc)) {
        console.log(`✅ Skipping scrape for ${item.brand} ${item.model} - already has cached data`);
        itemsWithCachedData.push(item);
      } else {
        console.log(`🔍 Will scrape ${item.brand} ${item.model} - needs enrichment`);
        itemsNeedingScraping.push(item);
      }
    });

    console.log(`[ENRICH] ${itemsWithCachedData.length} items already have cached data, ${itemsNeedingScraping.length} need scraping`);

    let enrichedItems = [];

    // Only scrape items that need it
    if (itemsNeedingScraping.length > 0) {
      console.log(`[ENRICH] Starting web enrichment for ${itemsNeedingScraping.length} items...`);
      const scrapedItems = await modernOpticalService.enrichPendingItems(itemsNeedingScraping);
      console.log(`[ENRICH] Web enrichment completed for ${scrapedItems.length} items`);
      enrichedItems = enrichedItems.concat(scrapedItems);
    } else {
      console.log('[ENRICH] No items need scraping - all have cached data!');
    }

    // Add items that were already cached (no scraping needed)
    enrichedItems = enrichedItems.concat(itemsWithCachedData);

    // Count how many were actually enriched (have api_verified = true)
    const enrichedCount = enrichedItems.filter(item => item.api_verified === true).length;
    console.log(`[ENRICH] Total: ${enrichedItems.length} items (${itemsNeedingScraping.length} scraped, ${itemsWithCachedData.length} from cache)`);

    // Update items in database with enriched data
    try {
      console.log('[ENRICH] Updating items in database...');
      console.log('[ENRICH] Sample enriched item structure:', {
        id: enrichedItems[0]?.id,
        upc: enrichedItems[0]?.upc,
        api_verified: enrichedItems[0]?.api_verified,
        hasEnrichedData: !!enrichedItems[0]?.enriched_data
      });

      const updatePromises = enrichedItems.map(enrichedItem => {
        if (!enrichedItem.id) {
          console.error('[ENRICH] Item missing ID:', enrichedItem);
          return Promise.resolve({ error: 'Missing ID', data: null });
        }

        return supabase
          .from('inventory')
          .update({
            upc: enrichedItem.upc || null,
            wholesale_price: enrichedItem.wholesale_price || null,
            msrp: enrichedItem.msrp || null,
            in_stock: enrichedItem.in_stock || null,
            api_verified: enrichedItem.api_verified || false,
            enriched_data: {
              ...enrichedItem.enriched_data,
              web_enriched: true,
              enriched_at: new Date().toISOString(),
              confidence_score: enrichedItem.confidence_score,
              validation_reason: enrichedItem.validation_reason,
              // Store extra fields in enriched_data since they don't exist as columns
              color_name: enrichedItem.color_name,
              color_code: enrichedItem.color_code,
              full_size: enrichedItem.full_size,
              temple_length: enrichedItem.temple_length,
              material: enrichedItem.material,
              gender: enrichedItem.gender,
              hinge_type: enrichedItem.hinge_type
            }
          })
          .eq('id', enrichedItem.id)
          .select();
      });

      const results = await Promise.all(updatePromises);
      const errors = results.filter(r => r.error);

      if (errors.length > 0) {
        console.error('[ENRICH] Errors updating items:');
        errors.forEach((err, idx) => {
          console.error(`  Error ${idx + 1}:`, err.error);
        });
      }

      const updatedItems = results.map(r => r.data?.[0]).filter(Boolean);
      console.log(`[ENRICH] Successfully updated ${updatedItems.length} items in database`);

      return res.status(200).json({
        success: true,
        message: `Enriched ${enrichedCount} of ${enrichedItems.length} items with web data`,
        enrichedItems: enrichedItems,
        enrichedCount: enrichedCount,
        totalItems: enrichedItems.length,
        updatedInDb: updatedItems.length
      });

    } catch (updateError) {
      console.error('[ENRICH] Error updating database:', updateError);
      // Still return enriched data even if DB update fails
      return res.status(200).json({
        success: true,
        message: `Enriched ${enrichedCount} items but failed to update database`,
        enrichedItems: enrichedItems,
        enrichedCount: enrichedCount,
        totalItems: enrichedItems.length,
        dbUpdateError: updateError.message
      });
    }

  } catch (error) {
    console.error('[ENRICH] Error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to enrich Modern Optical items',
      message: error.message
    });
  }
});

/**
 * POST /api/enrich/modernoptical/single
 * Enrich a single Modern Optical product (test endpoint)
 *
 * Body: {
 *   brand: string,
 *   model: string
 * }
 */
router.post('/modernoptical/single', async (req, res) => {
  try {
    const { brand, model } = req.body;

    console.log('[ENRICH] Single product enrichment request');
    console.log('  Brand:', brand);
    console.log('  Model:', model);

    if (!brand || !model) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: brand and model are required'
      });
    }

    const modernOpticalService = parserRegistry.getModernOpticalService();
    if (!modernOpticalService) {
      return res.status(500).json({
        success: false,
        error: 'Modern Optical service not available'
      });
    }

    console.log(`[ENRICH] Scraping web data for: ${brand} - ${model}`);
    const webData = await modernOpticalService.webService.scrapeProduct(brand, model);

    console.log('[ENRICH] Web scraping completed');
    console.log('  Found:', webData.found);
    console.log('  Variants:', webData.variants?.length || 0);

    return res.status(200).json({
      success: true,
      found: webData.found,
      brand: brand,
      model: model,
      webData: webData
    });

  } catch (error) {
    console.error('[ENRICH] Error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to scrape product data',
      message: error.message
    });
  }
});

/**
 * POST /api/enrich/idealoptics
 * Enrich Ideal Optics items with web scraping data
 *
 * Body: {
 *   accountId: string (UUID),
 *   orderNumber: string,
 *   items?: array (optional - if provided, enrich these items; otherwise fetch from DB)
 * }
 *
 * Returns: {
 *   success: boolean,
 *   message: string,
 *   enrichedItems: array,
 *   enrichedCount: number
 * }
 */
router.post('/idealoptics', async (req, res) => {
  try {
    const { accountId, orderNumber, items } = req.body;

    console.log('[ENRICH] Ideal Optics enrichment request received');
    console.log('  Account ID:', accountId);
    console.log('  Order Number:', orderNumber);
    console.log('  Items provided:', items ? items.length : 'No, will fetch from DB');

    // Validate required fields
    if (!accountId || !orderNumber) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: accountId and orderNumber are required'
      });
    }

    // Get the Ideal Optics service
    const idealOpticsService = parserRegistry.getIdealOpticsService();
    if (!idealOpticsService) {
      return res.status(500).json({
        success: false,
        error: 'Ideal Optics service not available'
      });
    }

    let itemsToEnrich = items;

    // If items not provided, fetch pending items from database
    if (!itemsToEnrich || itemsToEnrich.length === 0) {
      console.log('[ENRICH] Fetching pending items from database...');

      // Get all pending items for this user
      const { data: allPendingItems, error: inventoryError } = await supabase
        .from('inventory')
        .select('*')
        .eq('account_id', accountId)
        .eq('status', 'pending');

      if (inventoryError) {
        console.error('[ENRICH] Error fetching items:', inventoryError);
        return res.status(500).json({
          success: false,
          error: 'Failed to fetch pending items',
          message: inventoryError.message
        });
      }

      // Filter items that match the order number
      itemsToEnrich = allPendingItems?.filter(item => {
        // Check if enriched_data contains the order number
        if (item.enriched_data?.order_number === orderNumber) return true;
        if (item.enriched_data?.order?.order_number === orderNumber) return true;
        return false;
      }) || [];

      console.log(`[ENRICH] Found ${itemsToEnrich.length} pending items for order ${orderNumber}`);

      if (itemsToEnrich.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'No pending items found for this order',
          message: `No pending items found for order ${orderNumber}`
        });
      }
    }

    // Separate items that need scraping vs already have cached data
    const itemsNeedingScraping = [];
    const itemsWithCachedData = [];

    itemsToEnrich.forEach(item => {
      // Check if item already has enriched data from catalog cache
      const hasWholesalePrice = item.wholesale_price && item.wholesale_price > 0;
      const hasUpc = item.upc && item.upc.length > 0;
      const alreadyEnriched = item.api_verified === true;

      if (alreadyEnriched || (hasWholesalePrice && hasUpc)) {
        console.log(`✅ Skipping scrape for ${item.brand} ${item.model} - already has cached data`);
        itemsWithCachedData.push(item);
      } else {
        console.log(`🔍 Will scrape ${item.brand} ${item.model} - needs enrichment`);
        itemsNeedingScraping.push(item);
      }
    });

    console.log(`[ENRICH] ${itemsWithCachedData.length} items already have cached data, ${itemsNeedingScraping.length} need scraping`);

    let enrichedItems = [];

    // Only scrape items that need it
    if (itemsNeedingScraping.length > 0) {
      console.log(`[ENRICH] Starting web enrichment for ${itemsNeedingScraping.length} items...`);
      const scrapedItems = await idealOpticsService.enrichPendingItems(itemsNeedingScraping);
      console.log(`[ENRICH] Web enrichment completed for ${scrapedItems.length} items`);
      enrichedItems = enrichedItems.concat(scrapedItems);
    } else {
      console.log('[ENRICH] No items need scraping - all have cached data!');
    }

    // Add items that were already cached (no scraping needed)
    enrichedItems = enrichedItems.concat(itemsWithCachedData);

    // Count how many were actually enriched (have api_verified = true)
    const enrichedCount = enrichedItems.filter(item => item.api_verified === true).length;
    console.log(`[ENRICH] Total: ${enrichedItems.length} items (${itemsNeedingScraping.length} scraped, ${itemsWithCachedData.length} from cache)`);

    // Update items in database with enriched data
    try {
      console.log('[ENRICH] Updating items in database...');
      console.log('[ENRICH] Sample enriched item structure:', {
        id: enrichedItems[0]?.id,
        upc: enrichedItems[0]?.upc,
        api_verified: enrichedItems[0]?.api_verified,
        hasEnrichedData: !!enrichedItems[0]?.enriched_data
      });

      const updatePromises = enrichedItems.map(enrichedItem => {
        if (!enrichedItem.id) {
          console.error('[ENRICH] Item missing ID:', enrichedItem);
          return Promise.resolve({ error: 'Missing ID', data: null });
        }

        return supabase
          .from('inventory')
          .update({
            upc: enrichedItem.upc || null,
            wholesale_price: enrichedItem.wholesale_price || null,
            msrp: enrichedItem.msrp || null,
            in_stock: enrichedItem.in_stock || null,
            api_verified: enrichedItem.api_verified || false,
            enriched_data: {
              ...enrichedItem.enriched_data,
              web_enriched: true,
              enriched_at: new Date().toISOString(),
              confidence_score: enrichedItem.confidence_score,
              validation_reason: enrichedItem.validation_reason,
              // Store extra fields in enriched_data since they don't exist as columns
              color_name: enrichedItem.color_name,
              color_code: enrichedItem.color_code,
              full_size: enrichedItem.full_size,
              eye_size: enrichedItem.eye_size,
              bridge: enrichedItem.bridge,
              temple_length: enrichedItem.temple_length,
              a: enrichedItem.a,
              b: enrichedItem.b,
              dbl: enrichedItem.dbl,
              ed: enrichedItem.ed,
              material: enrichedItem.material,
              gender: enrichedItem.gender,
              fit_type: enrichedItem.fit_type
            }
          })
          .eq('id', enrichedItem.id)
          .select();
      });

      const results = await Promise.all(updatePromises);
      const errors = results.filter(r => r.error);

      if (errors.length > 0) {
        console.error('[ENRICH] Errors updating items:');
        errors.forEach((err, idx) => {
          console.error(`  Error ${idx + 1}:`, err.error);
        });
      }

      const updatedItems = results.map(r => r.data?.[0]).filter(Boolean);
      console.log(`[ENRICH] Successfully updated ${updatedItems.length} items in database`);

      return res.status(200).json({
        success: true,
        message: `Enriched ${enrichedCount} of ${enrichedItems.length} items with web data`,
        enrichedItems: enrichedItems,
        enrichedCount: enrichedCount,
        totalItems: enrichedItems.length,
        updatedInDb: updatedItems.length
      });

    } catch (updateError) {
      console.error('[ENRICH] Error updating database:', updateError);
      // Still return enriched data even if DB update fails
      return res.status(200).json({
        success: true,
        message: `Enriched ${enrichedCount} items but failed to update database`,
        enrichedItems: enrichedItems,
        enrichedCount: enrichedCount,
        totalItems: enrichedItems.length,
        dbUpdateError: updateError.message
      });
    }

  } catch (error) {
    console.error('[ENRICH] Error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to enrich Ideal Optics items',
      message: error.message
    });
  }
});

/**
 * POST /api/enrich/idealoptics/single
 * Enrich a single Ideal Optics product (test endpoint)
 *
 * Body: {
 *   model: string
 * }
 */
router.post('/idealoptics/single', async (req, res) => {
  try {
    const { model } = req.body;

    console.log('[ENRICH] Single product enrichment request');
    console.log('  Model:', model);

    if (!model) {
      return res.status(400).json({
        success: false,
        error: 'Missing required field: model is required'
      });
    }

    const idealOpticsService = parserRegistry.getIdealOpticsService();
    if (!idealOpticsService) {
      return res.status(500).json({
        success: false,
        error: 'Ideal Optics service not available'
      });
    }

    console.log(`[ENRICH] Scraping web data for: ${model}`);
    const webData = await idealOpticsService.webService.scrapeProduct(model);

    console.log('[ENRICH] Web scraping completed');
    console.log('  Found:', webData.found);
    console.log('  Variants:', webData.variants?.length || 0);

    return res.status(200).json({
      success: true,
      found: webData.found,
      model: model,
      webData: webData
    });

  } catch (error) {
    console.error('[ENRICH] Error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to scrape product data',
      message: error.message
    });
  }
});

module.exports = router;

const express = require('express');
const router = express.Router();
const parserRegistry = require('../parsers');
const { supabase, inventoryOperations } = require('../lib/supabase');
const ModernOpticalCatalogCrawler = require('../services/ModernOpticalCatalogCrawler');

/**
 * POST /api/enrich/modernoptical
 * Enrich Modern Optical items with API data (UPC, wholesale price, stock status)
 * Uses the new ModernOpticalCatalogCrawler for direct API access
 *
 * Body: {
 *   accountId: string (UUID),
 *   orderNumber: string,
 *   items?: array (optional - if provided, enrich these items; otherwise fetch from DB),
 *   skipDbUpdate?: boolean (if true, only return enriched data without updating DB)
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
    const { accountId, orderNumber, items, skipDbUpdate } = req.body;

    console.log('[ENRICH] Modern Optical API enrichment request received');
    console.log('  Account ID:', accountId);
    console.log('  Order Number:', orderNumber);
    console.log('  Items provided:', items ? items.length : 'No, will fetch from DB');
    console.log('  Skip DB Update:', skipDbUpdate ? 'Yes' : 'No');

    // Validate required fields
    if (!accountId || !orderNumber) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: accountId and orderNumber are required'
      });
    }

    // Create Modern Optical catalog crawler instance
    const modernOpticalCrawler = new ModernOpticalCatalogCrawler();

    let itemsToEnrich = items;

    // If items not provided, fetch pending items from database
    if (!itemsToEnrich || itemsToEnrich.length === 0) {
      console.log('[ENRICH] Fetching pending items from database...');

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

    // Separate items that need enrichment vs already have cached data
    const itemsNeedingEnrichment = [];
    const itemsWithCachedData = [];

    itemsToEnrich.forEach(item => {
      const hasWholesalePrice = item.wholesale_price && item.wholesale_price > 0;
      const hasUpc = item.upc && item.upc.length > 0;
      const alreadyEnriched = item.api_verified === true;

      if (alreadyEnriched || (hasWholesalePrice && hasUpc)) {
        console.log(`✅ Skipping enrichment for ${item.brand} ${item.model} - already has cached data`);
        itemsWithCachedData.push(item);
      } else {
        console.log(`🔍 Will enrich ${item.brand} ${item.model} - needs API data`);
        itemsNeedingEnrichment.push(item);
      }
    });

    console.log(`[ENRICH] ${itemsWithCachedData.length} items already have cached data, ${itemsNeedingEnrichment.length} need enrichment`);

    let enrichedItems = [];

    // Only enrich items that need it using the API
    if (itemsNeedingEnrichment.length > 0) {
      console.log(`[ENRICH] Starting Modern Optical API enrichment for ${itemsNeedingEnrichment.length} items...`);
      const apiEnrichedItems = await modernOpticalCrawler.enrichItems(itemsNeedingEnrichment);
      console.log(`[ENRICH] API enrichment completed for ${apiEnrichedItems.length} items`);
      enrichedItems = enrichedItems.concat(apiEnrichedItems);
    } else {
      console.log('[ENRICH] No items need enrichment - all have cached data!');
    }

    // Add items that were already cached (no enrichment needed)
    enrichedItems = enrichedItems.concat(itemsWithCachedData);

    // Count how many were actually enriched (have api_verified = true)
    const enrichedCount = enrichedItems.filter(item => item.api_verified === true).length;
    console.log(`[ENRICH] Total: ${enrichedItems.length} items (${itemsNeedingEnrichment.length} enriched via API, ${itemsWithCachedData.length} from cache)`);

    // If skipDbUpdate is true, just return the enriched data
    if (skipDbUpdate) {
      console.log('[ENRICH] Skipping DB update - returning enriched items for bulk-add');
      return res.status(200).json({
        success: true,
        message: `Enriched ${enrichedCount} of ${enrichedItems.length} items with API data (DB update skipped)`,
        enrichedItems: enrichedItems,
        enrichedCount: enrichedCount,
        totalItems: enrichedItems.length,
        skippedDbUpdate: true
      });
    }

    // Update items in database with enriched data (only if items have IDs)
    try {
      console.log('[ENRICH] Updating items in database...');

      const itemsWithIds = enrichedItems.filter(item => item.id);
      const itemsWithoutIds = enrichedItems.filter(item => !item.id);

      if (itemsWithoutIds.length > 0) {
        console.log(`[ENRICH] ${itemsWithoutIds.length} items don't have DB IDs yet - skipping their DB update`);
      }

      if (itemsWithIds.length === 0) {
        console.log('[ENRICH] No items have DB IDs - returning enriched data only');
        return res.status(200).json({
          success: true,
          message: `Enriched ${enrichedCount} of ${enrichedItems.length} items with API data (no DB IDs to update)`,
          enrichedItems: enrichedItems,
          enrichedCount: enrichedCount,
          totalItems: enrichedItems.length,
          updatedInDb: 0,
          note: 'Items do not have database IDs yet - enriched data returned for bulk-add'
        });
      }

      const updatePromises = itemsWithIds.map(enrichedItem => {
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
              modern_optical_api: true,
              web_enriched: true,
              enriched_at: new Date().toISOString(),
              confidence_score: enrichedItem.confidence_score,
              validation_reason: enrichedItem.validation_reason,
              // Store all sizing fields in enriched_data
              color_name: enrichedItem.color_name,
              color_code: enrichedItem.color_code,
              full_size: enrichedItem.full_size,
              eye_size: enrichedItem.eye_size,
              bridge: enrichedItem.bridge,
              temple: enrichedItem.temple,
              a: enrichedItem.a,
              b: enrichedItem.b,
              dbl: enrichedItem.dbl,
              ed: enrichedItem.ed,
              material: enrichedItem.material,
              gender: enrichedItem.gender,
              sku: enrichedItem.sku
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
        message: `Enriched ${enrichedCount} of ${enrichedItems.length} items with API data`,
        enrichedItems: enrichedItems,
        enrichedCount: enrichedCount,
        totalItems: enrichedItems.length,
        updatedInDb: updatedItems.length
      });

    } catch (updateError) {
      console.error('[ENRICH] Error updating database:', updateError);
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
 * Enrich a single Modern Optical product using the API (test endpoint)
 *
 * Body: {
 *   model: string (required - style/model name),
 *   color?: string (optional - color code to filter results),
 *   size?: string (optional - eye size to filter results)
 * }
 */
router.post('/modernoptical/single', async (req, res) => {
  try {
    const { model, color, size } = req.body;

    console.log('[ENRICH] Single Modern Optical product enrichment request');
    console.log('  Model:', model);
    console.log('  Color:', color || '(all colors)');
    console.log('  Size:', size || '(all sizes)');

    if (!model) {
      return res.status(400).json({
        success: false,
        error: 'Missing required field: model is required'
      });
    }

    // Create Modern Optical catalog crawler instance
    const modernOpticalCrawler = new ModernOpticalCatalogCrawler();

    console.log(`[ENRICH] Querying Modern Optical API for: ${model}`);
    const apiResponse = await modernOpticalCrawler.makeApiRequest({ search: model });

    if (!apiResponse || !Array.isArray(apiResponse) || apiResponse.length === 0) {
      return res.status(200).json({
        success: true,
        found: false,
        model: model,
        message: 'No products found matching this model',
        apiData: { totalVariants: 0, variants: [] }
      });
    }

    console.log(`[ENRICH] API returned ${apiResponse.length} products`);

    // Extract all variants from the API response
    const allVariants = [];
    for (const product of apiResponse) {
      if (!product.colorGroup || product.colorGroup.length === 0) continue;

      for (const colorGroup of product.colorGroup) {
        if (!colorGroup.sizes || colorGroup.sizes.length === 0) continue;

        for (const sizeInfo of colorGroup.sizes) {
          allVariants.push({
            brand: product.collectionName || 'Modern Optical',
            model: product.styleCode || product.model,
            styleName: product.styleName,
            colorCode: colorGroup.color,
            colorName: colorGroup.colorName,
            eyeSize: sizeInfo.eyeSize || sizeInfo.a,
            bridge: sizeInfo.bridge || sizeInfo.dbl,
            temple: sizeInfo.temple,
            fullSize: sizeInfo.size,
            sku: sizeInfo.sku,
            upc: sizeInfo.upc,
            ean: sizeInfo.ean || sizeInfo.frameId,
            wholesalePrice: parseFloat(sizeInfo.wholesale) || parseFloat(sizeInfo.price) || null,
            msrp: parseFloat(sizeInfo.msrp) || null,
            inStock: sizeInfo.isInStock || false,
            availability: sizeInfo.availableStatus || sizeInfo.availability
          });
        }
      }
    }

    // Filter by color if specified
    let filteredVariants = allVariants;
    if (color) {
      const colorUpper = color.toUpperCase().trim();
      filteredVariants = filteredVariants.filter(v => {
        const variantColor = (v.colorCode || '').toUpperCase().trim();
        return variantColor === colorUpper ||
               variantColor.includes(colorUpper) ||
               colorUpper.includes(variantColor);
      });
    }

    // Filter by size if specified
    if (size) {
      filteredVariants = filteredVariants.filter(v => {
        const variantSize = String(v.eyeSize || '');
        return variantSize === size || variantSize.includes(size);
      });
    }

    console.log('[ENRICH] API query completed');
    console.log('  Found:', filteredVariants.length > 0);
    console.log('  Total Variants:', allVariants.length);
    console.log('  Filtered Variants:', filteredVariants.length);

    return res.status(200).json({
      success: true,
      found: filteredVariants.length > 0,
      model: model,
      color: color || null,
      size: size || null,
      apiData: {
        totalVariants: allVariants.length,
        filteredVariants: filteredVariants.length,
        variants: filteredVariants,
        rawProductCount: apiResponse.length
      }
    });

  } catch (error) {
    console.error('[ENRICH] Error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to query Modern Optical API',
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
 *   items?: array (optional - if provided, enrich these items; otherwise fetch from DB),
 *   skipDbUpdate?: boolean (if true, only return enriched data without updating DB - useful for pre-bulk-add enrichment)
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
    const { accountId, orderNumber, items, skipDbUpdate } = req.body;

    console.log('[ENRICH] Ideal Optics enrichment request received');
    console.log('  Account ID:', accountId);
    console.log('  Order Number:', orderNumber);
    console.log('  Items provided:', items ? items.length : 'No, will fetch from DB');
    console.log('  Skip DB Update:', skipDbUpdate ? 'Yes' : 'No');

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

    // If skipDbUpdate is true, just return the enriched data without updating the database
    // This is used during the n8n workflow before items are bulk-added (no IDs yet)
    if (skipDbUpdate) {
      console.log('[ENRICH] Skipping DB update - returning enriched items for bulk-add');
      return res.status(200).json({
        success: true,
        message: `Enriched ${enrichedCount} of ${enrichedItems.length} items with web data (DB update skipped)`,
        enrichedItems: enrichedItems,
        enrichedCount: enrichedCount,
        totalItems: enrichedItems.length,
        skippedDbUpdate: true
      });
    }

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

/**
 * POST /api/enrich/marchon
 * Enrich Marchon items with API data (UPC, pricing, stock status)
 *
 * Body: {
 *   accountId: string (UUID),
 *   orderNumber: string,
 *   items?: array (optional - if provided, enrich these items; otherwise fetch from DB),
 *   skipDbUpdate?: boolean (if true, only return enriched data without updating DB - useful for pre-bulk-add enrichment)
 * }
 *
 * Returns: {
 *   success: boolean,
 *   message: string,
 *   enrichedItems: array,
 *   enrichedCount: number
 * }
 */
router.post('/marchon', async (req, res) => {
  try {
    const { accountId, orderNumber, items, skipDbUpdate } = req.body;

    console.log('[ENRICH] Marchon enrichment request received');
    console.log('  Account ID:', accountId);
    console.log('  Order Number:', orderNumber);
    console.log('  Items provided:', items ? items.length : 'No, will fetch from DB');
    console.log('  Skip DB Update:', skipDbUpdate ? 'Yes' : 'No');

    // Validate required fields
    if (!accountId || !orderNumber) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: accountId and orderNumber are required'
      });
    }

    // Get the Marchon service
    const marchonService = parserRegistry.getMarchonService();
    if (!marchonService) {
      return res.status(500).json({
        success: false,
        error: 'Marchon service not available'
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

    // Separate items that need enrichment vs already have cached data
    const itemsNeedingEnrichment = [];
    const itemsWithCachedData = [];

    itemsToEnrich.forEach(item => {
      // Check if item already has enriched data
      const hasWholesalePrice = item.wholesale_price && item.wholesale_price > 0;
      const hasUpc = item.upc && item.upc.length > 0;
      const alreadyEnriched = item.api_verified === true;

      if (alreadyEnriched || (hasWholesalePrice && hasUpc)) {
        console.log(`✅ Skipping enrichment for ${item.brand} ${item.model} - already has cached data`);
        itemsWithCachedData.push(item);
      } else {
        console.log(`🔍 Will enrich ${item.brand} ${item.model} - needs API data`);
        itemsNeedingEnrichment.push(item);
      }
    });

    console.log(`[ENRICH] ${itemsWithCachedData.length} items already have cached data, ${itemsNeedingEnrichment.length} need enrichment`);

    let enrichedItems = [];

    // Only enrich items that need it
    if (itemsNeedingEnrichment.length > 0) {
      console.log(`[ENRICH] Starting API enrichment for ${itemsNeedingEnrichment.length} items...`);
      const apiEnrichedItems = await marchonService.enrichPendingItems(itemsNeedingEnrichment);
      console.log(`[ENRICH] API enrichment completed for ${apiEnrichedItems.length} items`);
      enrichedItems = enrichedItems.concat(apiEnrichedItems);
    } else {
      console.log('[ENRICH] No items need enrichment - all have cached data!');
    }

    // Add items that were already cached (no enrichment needed)
    enrichedItems = enrichedItems.concat(itemsWithCachedData);

    // Count how many were actually enriched (have api_verified = true)
    const enrichedCount = enrichedItems.filter(item => item.api_verified === true).length;
    console.log(`[ENRICH] Total: ${enrichedItems.length} items (${itemsNeedingEnrichment.length} enriched via API, ${itemsWithCachedData.length} from cache)`);

    // If skipDbUpdate is true, just return the enriched data without updating the database
    // This is useful when enrichment happens BEFORE items are bulk-added to the database
    if (skipDbUpdate) {
      console.log('[ENRICH] Skipping DB update - returning enriched items for bulk-add');
      return res.status(200).json({
        success: true,
        message: `Enriched ${enrichedCount} of ${enrichedItems.length} items with API data (DB update skipped)`,
        enrichedItems: enrichedItems,
        enrichedCount: enrichedCount,
        totalItems: enrichedItems.length,
        skippedDbUpdate: true
      });
    }

    // Update items in database with enriched data (only if items have IDs)
    try {
      console.log('[ENRICH] Updating items in database...');

      // Filter out items without IDs - they haven't been created in DB yet
      const itemsWithIds = enrichedItems.filter(item => item.id);
      const itemsWithoutIds = enrichedItems.filter(item => !item.id);

      if (itemsWithoutIds.length > 0) {
        console.log(`[ENRICH] ${itemsWithoutIds.length} items don't have DB IDs yet - skipping their DB update`);
      }

      if (itemsWithIds.length === 0) {
        console.log('[ENRICH] No items have DB IDs - returning enriched data only');
        return res.status(200).json({
          success: true,
          message: `Enriched ${enrichedCount} of ${enrichedItems.length} items with API data (no DB IDs to update)`,
          enrichedItems: enrichedItems,
          enrichedCount: enrichedCount,
          totalItems: enrichedItems.length,
          updatedInDb: 0,
          note: 'Items do not have database IDs yet - enriched data returned for bulk-add'
        });
      }

      const updatePromises = itemsWithIds.map(enrichedItem => {
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
              marchon_api: enrichedItem.enriched_data?.marchon_api,
              web_enriched: true,
              enriched_at: new Date().toISOString(),
              confidence_score: enrichedItem.confidence_score,
              validation_reason: enrichedItem.validation_reason
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
        message: `Enriched ${enrichedCount} of ${enrichedItems.length} items with API data`,
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
      error: 'Failed to enrich Marchon items',
      message: error.message
    });
  }
});

/**
 * POST /api/enrich/europa
 * Enrich Europa items via web scraping (UPC, sizing, materials)
 *
 * Note: Europa does NOT expose pricing to non-logged-in users.
 * listPrice and customerPrice will always be null.
 *
 * Body: {
 *   accountId: string (UUID),
 *   orderNumber: string,
 *   items?: array (optional - if provided, enrich these items; otherwise fetch from DB),
 *   skipDbUpdate?: boolean (if true, only return enriched data without updating DB - useful for pre-bulk-add enrichment)
 * }
 */
router.post('/europa', async (req, res) => {
  try {
    const { accountId, orderNumber, items, skipDbUpdate } = req.body;

    console.log('[ENRICH] Europa enrichment request received');
    console.log('  Account ID:', accountId);
    console.log('  Order Number:', orderNumber);
    console.log('  Items provided:', items ? items.length : 'No, will fetch from DB');
    console.log('  Skip DB Update:', skipDbUpdate ? 'Yes' : 'No');

    // Validate required fields
    if (!accountId || !orderNumber) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: accountId and orderNumber are required'
      });
    }

    // Get the Europa service
    const europaService = parserRegistry.getEuropaService();
    if (!europaService) {
      return res.status(500).json({
        success: false,
        error: 'Europa service not available'
      });
    }

    let itemsToEnrich = items;

    // If items not provided, fetch pending items from database
    if (!itemsToEnrich || itemsToEnrich.length === 0) {
      console.log('[ENRICH] Fetching pending items from database...');

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

    // Separate items that need enrichment vs already have cached data
    const itemsNeedingEnrichment = [];
    const itemsWithCachedData = [];

    itemsToEnrich.forEach(item => {
      const hasUpc = item.upc && item.upc.length > 0;
      const alreadyEnriched = item.api_verified === true;

      if (alreadyEnriched || hasUpc) {
        console.log(`✅ Skipping enrichment for ${item.brand} ${item.model} - already has cached data`);
        itemsWithCachedData.push(item);
      } else {
        console.log(`🔍 Will enrich ${item.brand} ${item.model} - needs web data`);
        itemsNeedingEnrichment.push(item);
      }
    });

    console.log(`[ENRICH] ${itemsWithCachedData.length} items already have cached data, ${itemsNeedingEnrichment.length} need enrichment`);

    let enrichedItems = [];

    // Only enrich items that need it
    if (itemsNeedingEnrichment.length > 0) {
      console.log(`[ENRICH] Starting web enrichment for ${itemsNeedingEnrichment.length} items...`);
      const webEnrichedItems = await europaService.enrichPendingItems(itemsNeedingEnrichment);
      console.log(`[ENRICH] Web enrichment completed for ${webEnrichedItems.length} items`);
      enrichedItems = enrichedItems.concat(webEnrichedItems);
    } else {
      console.log('[ENRICH] No items need enrichment - all have cached data!');
    }

    // Add items that were already cached
    enrichedItems = enrichedItems.concat(itemsWithCachedData);

    // Count how many were actually enriched
    const enrichedCount = enrichedItems.filter(item => item.api_verified === true).length;
    console.log(`[ENRICH] Total: ${enrichedItems.length} items (${itemsNeedingEnrichment.length} enriched via web, ${itemsWithCachedData.length} from cache)`);

    // If skipDbUpdate is true, just return the enriched data without updating the database
    // This is useful when enrichment happens BEFORE items are bulk-added to the database
    if (skipDbUpdate) {
      console.log('[ENRICH] Skipping DB update - returning enriched items for bulk-add');
      return res.status(200).json({
        success: true,
        message: `Enriched ${enrichedCount} of ${enrichedItems.length} items with web data (DB update skipped)`,
        enrichedItems: enrichedItems,
        enrichedCount: enrichedCount,
        totalItems: enrichedItems.length,
        skippedDbUpdate: true,
        note: 'Europa does not expose pricing to non-logged-in users'
      });
    }

    // Update items in database with enriched data (only if items have IDs)
    try {
      console.log('[ENRICH] Updating items in database...');

      // Filter out items without IDs - they haven't been created in DB yet
      const itemsWithIds = enrichedItems.filter(item => item.id);
      const itemsWithoutIds = enrichedItems.filter(item => !item.id);

      if (itemsWithoutIds.length > 0) {
        console.log(`[ENRICH] ${itemsWithoutIds.length} items don't have DB IDs yet - skipping their DB update`);
      }

      if (itemsWithIds.length === 0) {
        console.log('[ENRICH] No items have DB IDs - returning enriched data only');
        return res.status(200).json({
          success: true,
          message: `Enriched ${enrichedCount} of ${enrichedItems.length} items with web data (no DB IDs to update)`,
          enrichedItems: enrichedItems,
          enrichedCount: enrichedCount,
          totalItems: enrichedItems.length,
          updatedInDb: 0,
          note: 'Items do not have database IDs yet - enriched data returned for bulk-add'
        });
      }

      const updatePromises = itemsWithIds.map(enrichedItem => {

        return supabase
          .from('inventory')
          .update({
            upc: enrichedItem.upc || null,
            api_verified: enrichedItem.api_verified || false,
            enriched_data: {
              ...enrichedItem.enriched_data,
              europa_web: enrichedItem.enriched_data?.europa_web,
              web_enriched: true,
              enriched_at: new Date().toISOString(),
              confidence_score: enrichedItem.confidence_score,
              validation_reason: enrichedItem.validation_reason
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
        updatedInDb: updatedItems.length,
        note: 'Europa does not expose pricing to non-logged-in users'
      });

    } catch (updateError) {
      console.error('[ENRICH] Error updating database:', updateError);
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
      error: 'Failed to enrich Europa items',
      message: error.message
    });
  }
});

/**
 * POST /api/enrich/europa/single
 * Look up a single Europa product by stock number (test endpoint)
 *
 * Body: {
 *   stockNo: string (e.g., "MRX104153-18")
 * }
 */
router.post('/europa/single', async (req, res) => {
  try {
    const { stockNo } = req.body;

    console.log('[ENRICH] Single Europa product lookup request');
    console.log('  Stock Number:', stockNo);

    if (!stockNo) {
      return res.status(400).json({
        success: false,
        error: 'Missing required field: stockNo is required'
      });
    }

    const europaService = parserRegistry.getEuropaService();
    if (!europaService) {
      return res.status(500).json({
        success: false,
        error: 'Europa service not available'
      });
    }

    console.log(`[ENRICH] Scraping Europa website for: ${stockNo}`);
    const webData = await europaService.scrapeProductPage(stockNo);

    console.log('[ENRICH] Web scrape completed');
    console.log('  Found:', webData.found);
    console.log('  Variants:', webData.totalVariants || 0);

    return res.status(200).json({
      success: true,
      found: webData.found,
      stockNo: stockNo,
      webData: webData
    });

  } catch (error) {
    console.error('[ENRICH] Error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to scrape Europa website',
      message: error.message
    });
  }
});

/**
 * POST /api/enrich/lamy (also /api/enrich/lamyamerica)
 * Enrich L'amyamerica items with API data (UPC, pricing, stock status)
 * Uses model-based search when UPC is not available
 *
 * Body: {
 *   accountId: string (UUID),
 *   orderNumber: string,
 *   items?: array (optional - if provided, enrich these items; otherwise fetch from DB),
 *   skipDbUpdate?: boolean (if true, only return enriched data without updating DB)
 * }
 *
 * Returns: {
 *   success: boolean,
 *   message: string,
 *   enrichedItems: array,
 *   enrichedCount: number
 * }
 */
const lamyEnrichHandler = async (req, res) => {
  try {
    const { accountId, orderNumber, items, skipDbUpdate } = req.body;

    console.log('[ENRICH] L\'amyamerica enrichment request received');
    console.log('  Account ID:', accountId);
    console.log('  Order Number:', orderNumber);
    console.log('  Items provided:', items ? items.length : 'No, will fetch from DB');
    console.log('  Skip DB Update:', skipDbUpdate ? 'Yes' : 'No');

    // Validate required fields
    if (!accountId || !orderNumber) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: accountId and orderNumber are required'
      });
    }

    // Get the L'amyamerica service
    const lamyService = parserRegistry.getLamyamericaService();
    if (!lamyService) {
      return res.status(500).json({
        success: false,
        error: 'L\'amyamerica service not available'
      });
    }

    let itemsToEnrich = items;

    // If items not provided, fetch pending items from database
    if (!itemsToEnrich || itemsToEnrich.length === 0) {
      console.log('[ENRICH] Fetching pending items from database...');

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

    // Separate items that need enrichment vs already have cached data
    const itemsNeedingEnrichment = [];
    const itemsWithCachedData = [];

    itemsToEnrich.forEach(item => {
      const hasWholesalePrice = item.wholesale_price && item.wholesale_price > 0;
      const hasUpc = item.upc && item.upc.length > 0;
      const alreadyEnriched = item.api_verified === true;

      if (alreadyEnriched || (hasWholesalePrice && hasUpc)) {
        console.log(`✅ Skipping enrichment for ${item.brand} ${item.model} - already has cached data`);
        itemsWithCachedData.push(item);
      } else {
        console.log(`🔍 Will enrich ${item.brand} ${item.model} - needs API data`);
        itemsNeedingEnrichment.push(item);
      }
    });

    console.log(`[ENRICH] ${itemsWithCachedData.length} items already have cached data, ${itemsNeedingEnrichment.length} need enrichment`);

    let enrichedItems = [];

    // Only enrich items that need it
    if (itemsNeedingEnrichment.length > 0) {
      console.log(`[ENRICH] Starting API enrichment for ${itemsNeedingEnrichment.length} items...`);
      const apiEnrichedItems = await lamyService.enrichPendingItems(itemsNeedingEnrichment);
      console.log(`[ENRICH] API enrichment completed for ${apiEnrichedItems.length} items`);
      enrichedItems = enrichedItems.concat(apiEnrichedItems);
    } else {
      console.log('[ENRICH] No items need enrichment - all have cached data!');
    }

    // Add items that were already cached (no enrichment needed)
    enrichedItems = enrichedItems.concat(itemsWithCachedData);

    // Count how many were actually enriched (have api_verified = true)
    const enrichedCount = enrichedItems.filter(item => item.api_verified === true).length;
    console.log(`[ENRICH] Total: ${enrichedItems.length} items (${itemsNeedingEnrichment.length} enriched via API, ${itemsWithCachedData.length} from cache)`);

    // If skipDbUpdate is true, just return the enriched data
    if (skipDbUpdate) {
      console.log('[ENRICH] Skipping DB update - returning enriched items for bulk-add');
      return res.status(200).json({
        success: true,
        message: `Enriched ${enrichedCount} of ${enrichedItems.length} items with API data (DB update skipped)`,
        enrichedItems: enrichedItems,
        enrichedCount: enrichedCount,
        totalItems: enrichedItems.length,
        skippedDbUpdate: true
      });
    }

    // Update items in database with enriched data (only if items have IDs)
    try {
      console.log('[ENRICH] Updating items in database...');

      const itemsWithIds = enrichedItems.filter(item => item.id);
      const itemsWithoutIds = enrichedItems.filter(item => !item.id);

      if (itemsWithoutIds.length > 0) {
        console.log(`[ENRICH] ${itemsWithoutIds.length} items don't have DB IDs yet - skipping their DB update`);
      }

      if (itemsWithIds.length === 0) {
        console.log('[ENRICH] No items have DB IDs - returning enriched data only');
        return res.status(200).json({
          success: true,
          message: `Enriched ${enrichedCount} of ${enrichedItems.length} items with API data (no DB IDs to update)`,
          enrichedItems: enrichedItems,
          enrichedCount: enrichedCount,
          totalItems: enrichedItems.length,
          updatedInDb: 0,
          note: 'Items do not have database IDs yet - enriched data returned for bulk-add'
        });
      }

      const updatePromises = itemsWithIds.map(enrichedItem => {
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
              lamy_api: enrichedItem.enriched_data?.lamy_api,
              web_enriched: true,
              enriched_at: new Date().toISOString(),
              confidence_score: enrichedItem.confidence_score,
              validation_reason: enrichedItem.validation_reason
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
        message: `Enriched ${enrichedCount} of ${enrichedItems.length} items with API data`,
        enrichedItems: enrichedItems,
        enrichedCount: enrichedCount,
        totalItems: enrichedItems.length,
        updatedInDb: updatedItems.length
      });

    } catch (updateError) {
      console.error('[ENRICH] Error updating database:', updateError);
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
      error: 'Failed to enrich L\'amyamerica items',
      message: error.message
    });
  }
};

// Register both route aliases for L'amy enrichment
router.post('/lamy', lamyEnrichHandler);
router.post('/lamyamerica', lamyEnrichHandler);

/**
 * POST /api/enrich/lamy/single
 * Enrich a single L'amyamerica product by model name (test endpoint)
 *
 * Body: {
 *   model: string (e.g., "CAPER", "FLOW")
 *   color?: string (optional, e.g., "C01")
 * }
 */
router.post('/lamy/single', async (req, res) => {
  try {
    const { model, color } = req.body;

    console.log('[ENRICH] Single L\'amyamerica product enrichment request');
    console.log('  Model:', model);
    console.log('  Color:', color || '(all colors)');

    if (!model) {
      return res.status(400).json({
        success: false,
        error: 'Missing required field: model is required'
      });
    }

    const lamyService = parserRegistry.getLamyamericaService();
    if (!lamyService) {
      return res.status(500).json({
        success: false,
        error: 'L\'amyamerica service not available'
      });
    }

    console.log(`[ENRICH] Querying L'amy API for: ${model}`);
    const apiData = await lamyService.makeModelAPIRequest(model);

    console.log('[ENRICH] API query completed');
    console.log('  Found:', apiData.found);
    console.log('  Variants:', apiData.totalVariants || 0);

    // If color specified, filter variants
    let filteredData = apiData;
    if (color && apiData.found && apiData.variants) {
      const colorUpper = color.toUpperCase().trim();
      const matchingVariants = apiData.variants.filter(v => {
        const variantColor = (v.colorCode || '').toUpperCase().trim();
        return variantColor === colorUpper ||
               variantColor.includes(colorUpper) ||
               colorUpper.includes(variantColor);
      });

      filteredData = {
        ...apiData,
        variants: matchingVariants,
        totalVariants: matchingVariants.length,
        filteredByColor: color
      };
    }

    return res.status(200).json({
      success: true,
      found: filteredData.found,
      model: model,
      color: color || null,
      apiData: filteredData
    });

  } catch (error) {
    console.error('[ENRICH] Error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to query L\'amyamerica API',
      message: error.message
    });
  }
});

/**
 * POST /api/enrich/marchon/single
 * Enrich a single Marchon product (test endpoint)
 *
 * Body: {
 *   model: string (style name, e.g., "SF2223N" or "CK19119")
 * }
 */
router.post('/marchon/single', async (req, res) => {
  try {
    const { model } = req.body;

    console.log('[ENRICH] Single Marchon product enrichment request');
    console.log('  Model:', model);

    if (!model) {
      return res.status(400).json({
        success: false,
        error: 'Missing required field: model is required'
      });
    }

    const marchonService = parserRegistry.getMarchonService();
    if (!marchonService) {
      return res.status(500).json({
        success: false,
        error: 'Marchon service not available'
      });
    }

    console.log(`[ENRICH] Querying Marchon API for: ${model}`);
    const apiData = await marchonService.makeAPIRequest(model);

    console.log('[ENRICH] API query completed');
    console.log('  Found:', apiData.found);
    console.log('  Variants:', apiData.totalVariants || 0);

    return res.status(200).json({
      success: true,
      found: apiData.found,
      model: model,
      apiData: apiData
    });

  } catch (error) {
    console.error('[ENRICH] Error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to query Marchon API',
      message: error.message
    });
  }
});

module.exports = router;

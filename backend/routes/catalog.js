const express = require('express');
const router = express.Router();
const { supabase } = require('../lib/supabase');

/**
 * VENDOR CATALOG ROUTES
 *
 * These endpoints manage the centralized vendor_catalog table.
 * This table is shared across all users and contains product data
 * for vendor comparison and fast lookups.
 *
 * Node 1: Check Catalog - POST /api/catalog/check
 * Node 2: Cache to Catalog - POST /api/catalog/cache
 */

/**
 * NODE 1: Check Catalog
 *
 * Check if items exist in the vendor_catalog and return cached data
 * This is called AFTER parsing but BEFORE web scraping
 *
 * POST /api/catalog/check
 * Body: {
 *   vendorId: "uuid",
 *   items: [{ brand, model, color, eye_size }]
 * }
 *
 * Returns: {
 *   success: true,
 *   items: [{ ...originalItem, cached: true/false, catalogData: {...} }],
 *   cacheHits: 2,
 *   cacheMisses: 1
 * }
 */
router.post('/check', async (req, res) => {
    try {
        const { vendorId, items } = req.body;

        // Allow null vendorId - we'll just return items without cache matches
        if (!items || !Array.isArray(items)) {
            return res.status(400).json({
                success: false,
                error: 'Missing required field: items (array)'
            });
        }

        // If vendorId is null/undefined, return items as cache misses (no DB lookup possible)
        if (!vendorId) {
            console.log(`⚠️ Catalog check: vendorId is null, returning ${items.length} items as cache misses`);
            const uncachedItems = items.map(item => ({
                ...item,
                cached: false,
                needsEnrichment: true
            }));
            return res.status(200).json({
                success: true,
                items: uncachedItems,
                cacheHits: 0,
                cacheMisses: items.length,
                vendorIdMissing: true
            });
        }

        console.log(`📋 Checking catalog for ${items.length} items from vendor ${vendorId}`);

        const enrichedItems = [];
        let cacheHits = 0;
        let cacheMisses = 0;

        for (const item of items) {
            // Extract eye size - handle various formats like "50", "50-18-140", etc.
            const rawEyeSize = item.eye_size || item.size || '';
            // Extract just the eye measurement (first 2 digits)
            const eyeSizeMatch = String(rawEyeSize).match(/^(\d{2})/);
            const eyeSizeNum = eyeSizeMatch ? eyeSizeMatch[1] : rawEyeSize;

            // Tier 1: Exact match (vendor + model + color + size)
            let catalogMatch = await supabase
                .from('vendor_catalog')
                .select('*')
                .eq('vendor_id', vendorId)
                .ilike('model', item.model || '')
                .ilike('color', item.color || '')
                .eq('eye_size', rawEyeSize)
                .limit(1)
                .single();

            // Tier 1.5: Try matching with just eye size number (e.g., "50" matches "50-18-140")
            if (catalogMatch.error && eyeSizeNum && eyeSizeNum !== rawEyeSize) {
                catalogMatch = await supabase
                    .from('vendor_catalog')
                    .select('*')
                    .eq('vendor_id', vendorId)
                    .ilike('model', item.model || '')
                    .ilike('color', item.color || '')
                    .or(`eye_size.eq.${eyeSizeNum},eye_size.like.${eyeSizeNum}-%,eye_size.like.${eyeSizeNum}/%`)
                    .limit(1)
                    .single();
            }

            // Tier 2: UPC match (if available)
            if (catalogMatch.error && item.upc) {
                catalogMatch = await supabase
                    .from('vendor_catalog')
                    .select('*')
                    .eq('vendor_id', vendorId)
                    .eq('upc', item.upc)
                    .limit(1)
                    .single();
            }

            // Tier 3: Model + color fuzzy match (without size - may return wrong size variant)
            if (catalogMatch.error && item.model && item.color) {
                catalogMatch = await supabase
                    .from('vendor_catalog')
                    .select('*')
                    .eq('vendor_id', vendorId)
                    .ilike('model', `%${item.model}%`)
                    .ilike('color', item.color)
                    .limit(1)
                    .single();
            }

            if (catalogMatch.data) {
                // CACHE HIT! Enrich item with catalog data
                const hasUpc = catalogMatch.data.upc || item.upc;
                const hasWholesale = catalogMatch.data.wholesale_cost != null;
                const isComplete = hasUpc && hasWholesale;

                console.log(`✅ Cache HIT for ${item.model} ${item.color} (size: ${rawEyeSize} → catalog: ${catalogMatch.data.eye_size}) [UPC: ${catalogMatch.data.upc || 'NONE'}, Wholesale: ${catalogMatch.data.wholesale_cost || 'NONE'}]`);

                enrichedItems.push({
                    ...item,
                    cached: true,
                    // Flag if cached but incomplete - may need enrichment
                    needsEnrichment: !isComplete,
                    cacheIncomplete: !isComplete,
                    // Enrich with catalog data
                    upc: catalogMatch.data.upc || item.upc,
                    ean: catalogMatch.data.ean || item.ean,
                    wholesale_cost: catalogMatch.data.wholesale_cost,
                    wholesale_price: catalogMatch.data.wholesale_cost, // alias
                    msrp: catalogMatch.data.msrp,
                    map_price: catalogMatch.data.map_price,
                    material: catalogMatch.data.material || item.material,
                    gender: catalogMatch.data.gender || item.gender,
                    fit_type: catalogMatch.data.fit_type || item.fit_type,
                    a_measurement: catalogMatch.data.a_measurement || item.a,
                    b_measurement: catalogMatch.data.b_measurement || item.b,
                    dbl: catalogMatch.data.dbl || item.dbl,
                    ed: catalogMatch.data.ed || item.ed,
                    in_stock: catalogMatch.data.in_stock,
                    availability_status: catalogMatch.data.availability_status,
                    api_verified: true,
                    confidence_score: catalogMatch.data.confidence_score,
                    validation_reason: isComplete ? 'Vendor catalog match' : 'Vendor catalog match (incomplete data)'
                });

                cacheHits++;

                // Update times_ordered counter
                await supabase
                    .from('vendor_catalog')
                    .update({
                        times_ordered: catalogMatch.data.times_ordered + 1,
                        last_updated: new Date().toISOString()
                    })
                    .eq('id', catalogMatch.data.id);

            } else {
                // CACHE MISS - needs enrichment
                console.log(`❌ Cache MISS for ${item.model} ${item.color} (searched size: ${rawEyeSize}, eyeNum: ${eyeSizeNum})`);
                enrichedItems.push({
                    ...item,
                    cached: false,
                    needsEnrichment: true
                });
                cacheMisses++;
            }
        }

        console.log(`📊 Cache stats: ${cacheHits} hits, ${cacheMisses} misses (${Math.round(cacheHits / items.length * 100)}% hit rate)`);

        return res.json({
            success: true,
            items: enrichedItems,
            cacheHits,
            cacheMisses,
            hitRate: Math.round(cacheHits / items.length * 100),
            message: `Found ${cacheHits} of ${items.length} items in catalog`
        });

    } catch (error) {
        console.error('❌ Error checking catalog:', error);
        return res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * NODE 2: Cache to Catalog
 *
 * Save enriched items to vendor_catalog for future use
 * This is called AFTER web scraping/API enrichment
 *
 * POST /api/catalog/cache
 * Body: {
 *   vendorId: "uuid",
 *   vendorName: "Safilo",
 *   items: [{ brand, model, color, eye_size, upc, wholesale_cost, ... }]
 * }
 *
 * Returns: {
 *   success: true,
 *   cached: 3,
 *   updated: 1,
 *   skipped: 0
 * }
 */
router.post('/cache', async (req, res) => {
    try {
        const { vendorId, vendorName, items } = req.body;

        if (!vendorId || !items || !Array.isArray(items)) {
            return res.status(400).json({
                success: false,
                error: 'Missing required fields: vendorId, items (array)'
            });
        }

        console.log(`💾 Caching ${items.length} items to vendor catalog for ${vendorName || vendorId}`);

        let cached = 0;
        let updated = 0;
        let skipped = 0;

        for (const item of items) {
            // Skip items that were already cached (came from catalog)
            if (item.cached === true) {
                console.log(`⏭️  Skipping ${item.model} - already in catalog`);
                skipped++;
                continue;
            }

            // Skip items without minimum required data
            if (!item.model || !item.brand) {
                console.log(`⚠️  Skipping item - missing model or brand`);
                skipped++;
                continue;
            }

            // Prepare catalog entry
            const catalogEntry = {
                vendor_id: vendorId,
                vendor_name: vendorName,
                brand: item.brand,
                model: item.model,
                color: item.color || item.color_name,
                color_code: item.color_code,
                sku: item.sku,
                upc: item.upc,
                ean: item.ean,
                wholesale_cost: item.wholesale_cost || item.wholesale_price,
                msrp: item.msrp,
                map_price: item.map_price,
                eye_size: item.eye_size || item.size,
                bridge: item.bridge,
                temple_length: item.temple_length,
                full_size: item.full_size,
                material: item.material,
                gender: item.gender,
                fit_type: item.fit_type,
                a_measurement: item.a_measurement || item.a,
                b_measurement: item.b_measurement || item.b,
                dbl: item.dbl,
                ed: item.ed,
                in_stock: item.in_stock,
                availability_status: item.availability || item.availability_status,
                confidence_score: item.confidence_score || 100,
                data_source: item.data_source || (item.api_verified ? 'api' : 'web_scrape'),
                verified: item.api_verified || false,
                metadata: item.metadata || {}
            };

            // Upsert: Insert new or update existing
            const { data, error } = await supabase
                .from('vendor_catalog')
                .upsert(catalogEntry, {
                    onConflict: 'vendor_id,model,color,eye_size',
                    ignoreDuplicates: false
                })
                .select();

            if (error) {
                console.error(`❌ Error caching ${item.model}:`, error.message);
                continue;
            }

            if (data && data.length > 0) {
                // Check if this was an insert or update
                const isNew = data[0].times_ordered === 1;
                if (isNew) {
                    console.log(`✅ Cached NEW: ${item.brand} ${item.model} ${item.color}`);
                    cached++;
                } else {
                    console.log(`🔄 Updated: ${item.brand} ${item.model} ${item.color}`);
                    updated++;
                }
            }
        }

        console.log(`💾 Cache complete: ${cached} new, ${updated} updated, ${skipped} skipped`);

        return res.json({
            success: true,
            cached,
            updated,
            skipped,
            total: items.length,
            message: `Cached ${cached} new items, updated ${updated} existing items`
        });

    } catch (error) {
        console.error('❌ Error caching to catalog:', error);
        return res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * HELPER: Get Catalog Statistics
 *
 * GET /api/catalog/stats
 * Query: ?vendorId=uuid (optional)
 *
 * Returns statistics about the vendor catalog
 */
router.get('/stats', async (req, res) => {
    try {
        const { vendorId } = req.query;

        let query = supabase
            .from('vendor_catalog')
            .select('vendor_name, brand, times_ordered', { count: 'exact' });

        if (vendorId) {
            query = query.eq('vendor_id', vendorId);
        }

        const { data, error, count } = await query;

        if (error) throw error;

        // Calculate statistics
        const brandCounts = {};
        let totalOrders = 0;

        data.forEach(item => {
            if (!brandCounts[item.brand]) {
                brandCounts[item.brand] = { count: 0, orders: 0 };
            }
            brandCounts[item.brand].count++;
            brandCounts[item.brand].orders += item.times_ordered;
            totalOrders += item.times_ordered;
        });

        return res.json({
            success: true,
            totalItems: count,
            totalOrders,
            brands: Object.keys(brandCounts).length,
            brandBreakdown: Object.entries(brandCounts).map(([brand, stats]) => ({
                brand,
                uniqueItems: stats.count,
                totalOrders: stats.orders,
                avgOrdersPerItem: Math.round(stats.orders / stats.count * 10) / 10
            })).sort((a, b) => b.totalOrders - a.totalOrders)
        });

    } catch (error) {
        console.error('❌ Error getting catalog stats:', error);
        return res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * GET VENDOR CATALOG ANALYTICS
 *
 * GET /api/catalog/vendor/:vendorId
 *
 * Returns detailed analytics for a specific vendor's catalog including:
 * - Brand breakdown with counts and pricing
 * - Average/median wholesale costs
 * - Price ranges
 * - Most popular brands
 */
router.get('/vendor/:vendorId', async (req, res) => {
    try {
        const { vendorId } = req.params;

        // Fetch all catalog items in batches to bypass Supabase 1000 row limit
        let allData = [];
        let fromIndex = 0;
        const batchSize = 1000;
        let hasMore = true;

        while (hasMore) {
            const { data, error } = await supabase
                .from('vendor_catalog')
                .select('*')
                .eq('vendor_id', vendorId)
                .range(fromIndex, fromIndex + batchSize - 1);

            if (error) throw error;

            if (data && data.length > 0) {
                allData = allData.concat(data);
                fromIndex += batchSize;

                // If we got less than batchSize, we've reached the end
                if (data.length < batchSize) {
                    hasMore = false;
                }
            } else {
                hasMore = false;
            }
        }

        if (allData.length === 0) {
            return res.json({
                success: true,
                vendorId,
                totalProducts: 0,
                brands: [],
                message: 'No catalog data found for this vendor'
            });
        }

        // Group by brand and calculate stats
        const brandStats = {};
        allData.forEach(item => {
            const brand = item.brand;
            if (!brandStats[brand]) {
                brandStats[brand] = {
                    brand: brand,
                    productCount: 0,
                    totalOrders: 0,
                    wholesalePrices: [],
                    msrps: [],
                    inStockCount: 0,
                    models: new Set()
                };
            }

            brandStats[brand].productCount++;
            brandStats[brand].totalOrders += item.times_ordered || 0;
            brandStats[brand].models.add(item.model);

            if (item.wholesale_cost) {
                brandStats[brand].wholesalePrices.push(parseFloat(item.wholesale_cost));
            }
            if (item.msrp) {
                brandStats[brand].msrps.push(parseFloat(item.msrp));
            }
            if (item.in_stock) {
                brandStats[brand].inStockCount++;
            }
        });

        // Calculate averages and format output
        const brands = Object.values(brandStats).map(brand => {
            const avgWholesale = brand.wholesalePrices.length > 0
                ? brand.wholesalePrices.reduce((a, b) => a + b, 0) / brand.wholesalePrices.length
                : null;

            const avgMsrp = brand.msrps.length > 0
                ? brand.msrps.reduce((a, b) => a + b, 0) / brand.msrps.length
                : null;

            const minWholesale = brand.wholesalePrices.length > 0
                ? Math.min(...brand.wholesalePrices)
                : null;

            const maxWholesale = brand.wholesalePrices.length > 0
                ? Math.max(...brand.wholesalePrices)
                : null;

            return {
                brand: brand.brand,
                productCount: brand.productCount,
                modelCount: brand.models.size,
                totalOrders: brand.totalOrders,
                avgWholesaleCost: avgWholesale ? Math.round(avgWholesale * 100) / 100 : null,
                avgMsrp: avgMsrp ? Math.round(avgMsrp * 100) / 100 : null,
                minWholesaleCost: minWholesale ? Math.round(minWholesale * 100) / 100 : null,
                maxWholesaleCost: maxWholesale ? Math.round(maxWholesale * 100) / 100 : null,
                inStockCount: brand.inStockCount,
                inStockPercentage: Math.round((brand.inStockCount / brand.productCount) * 100)
            };
        }).sort((a, b) => b.productCount - a.productCount); // Sort by product count

        // Calculate overall vendor stats
        const allWholesalePrices = allData
            .map(item => item.wholesale_cost)
            .filter(price => price !== null && price !== undefined)
            .map(price => parseFloat(price));

        const overallAvgWholesale = allWholesalePrices.length > 0
            ? allWholesalePrices.reduce((a, b) => a + b, 0) / allWholesalePrices.length
            : null;

        return res.json({
            success: true,
            vendorId,
            vendorName: allData[0]?.vendor_name || 'Unknown',
            totalProducts: allData.length,
            totalBrands: brands.length,
            totalOrders: allData.reduce((sum, item) => sum + (item.times_ordered || 0), 0),
            avgWholesaleCost: overallAvgWholesale ? Math.round(overallAvgWholesale * 100) / 100 : null,
            brands: brands
        });

    } catch (error) {
        console.error('❌ Error getting vendor catalog analytics:', error);
        return res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

module.exports = router;

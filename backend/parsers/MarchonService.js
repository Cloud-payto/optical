const axios = require('axios');

/**
 * MARCHON SERVICE - Style/Model-Based API Enrichment
 *
 * This service provides a complete solution for processing Marchon orders:
 * 1. Parse HTML -> Extract order info and frame data with color codes from URLs
 * 2. Enrich -> Query Marchon API using style name for pricing, stock, and product details
 * 3. Validate -> Cross-reference with Marchon API data to find exact variant
 *
 * KEY ADVANTAGE: Uses style name + color code + size from email URLs to query API
 * Email URL format: detail.cfm?frame=SF2223N&coll=SF&pickColor=744&pickSize=5417
 *                   - frame = style name (SF2223N)
 *                   - pickColor = color code (744)
 *                   - pickSize = eye size + bridge (54 + 17)
 *
 * API Endpoint: https://www.mymarchon.com/ProductCatologWebWeb/Frame/sku
 * Returns: UPC, MSRP, wholesale (retail), stock status, sizes, and more
 *
 * Usage:
 *   const service = new MarchonService();
 *   const result = await service.enrichOrderData(parsedData);
 */
class MarchonService {
    constructor(options = {}) {
        this.config = {
            // API Configuration (note: double slash is required)
            apiUrl: 'https://www.mymarchon.com//ProductCatologWebWeb/Frame/sku',
            timeout: options.timeout || 15000,
            maxRetries: options.maxRetries || 3,
            retryDelay: options.retryDelay || 1000,
            batchSize: options.batchSize || 5,

            // Validation Configuration
            minConfidence: options.minConfidence || 50,

            // Debug Mode
            debug: options.debug || false,

            // Headers for API requests
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
        };

        // Initialize caches and stats
        this.cache = new Map();
        this.resetStats();
    }

    resetStats() {
        this.stats = {
            totalFrames: 0,
            enrichedFrames: 0,
            failedFrames: 0,
            apiErrors: 0,
            cacheHits: 0,
            processingStartTime: null,
            processingEndTime: null
        };
    }

    log(...args) {
        if (this.config.debug) {
            console.log('[MarchonService]', ...args);
        }
    }

    // ===========================================
    // MAIN ENRICHMENT FLOW
    // ===========================================

    /**
     * Main entry point - enriches parsed order data with API information
     * @param {Object} parsedData - Data from marchonParser.js
     * @returns {Object} Enriched order data with pricing and product details
     */
    async enrichOrderData(parsedData) {
        this.resetStats();
        this.stats.processingStartTime = Date.now();

        try {
            console.log('🔍 Enriching Marchon order data...\n');

            if (!parsedData.items || parsedData.items.length === 0) {
                throw new Error('No items found in parsed data');
            }

            this.stats.totalFrames = parsedData.items.length;
            console.log(`📦 Processing ${this.stats.totalFrames} items\n`);

            // Process frames in batches
            const enrichedItems = await this.processItemsInBatches(parsedData.items);

            this.stats.processingEndTime = Date.now();
            const processingTime = ((this.stats.processingEndTime - this.stats.processingStartTime) / 1000).toFixed(2);

            console.log(`\n🎉 Enrichment complete in ${processingTime}s`);
            console.log(`📊 Results: ${this.stats.enrichedFrames}/${this.stats.totalFrames} enriched`);
            console.log(`💾 Cache hits: ${this.stats.cacheHits}`);

            return {
                ...parsedData,
                items: enrichedItems,
                enrichment: {
                    enrichedAt: new Date().toISOString(),
                    totalItems: this.stats.totalFrames,
                    enrichedItems: this.stats.enrichedFrames,
                    failedItems: this.stats.failedFrames,
                    apiErrors: this.stats.apiErrors,
                    cacheHits: this.stats.cacheHits,
                    enrichmentRate: `${Math.round((this.stats.enrichedFrames / this.stats.totalFrames) * 100)}%`,
                    processingTimeSeconds: processingTime
                }
            };

        } catch (error) {
            console.error('❌ MarchonService error:', error.message);
            throw error;
        }
    }

    // ===========================================
    // BATCH PROCESSING
    // ===========================================

    /**
     * Process items in batches to avoid overwhelming the API
     */
    async processItemsInBatches(items) {
        const results = [];
        const batchSize = this.config.batchSize;

        for (let i = 0; i < items.length; i += batchSize) {
            const batch = items.slice(i, Math.min(i + batchSize, items.length));
            const batchNumber = Math.floor(i / batchSize) + 1;
            const totalBatches = Math.ceil(items.length / batchSize);

            this.log(`Processing batch ${batchNumber}/${totalBatches}`);

            const batchResults = await Promise.all(
                batch.map((item, idx) => this.processItem(item, i + idx, items.length))
            );

            results.push(...batchResults);

            // Small delay between batches
            if (i + batchSize < items.length) {
                await new Promise(resolve => setTimeout(resolve, 500));
            }
        }

        return results;
    }

    /**
     * Process individual item with API enrichment
     */
    async processItem(item, index, total) {
        const model = item.apiParams?.frame || item.model;
        const colorCode = item.apiParams?.pickColor || item.colorCode;

        console.log(`[${index + 1}/${total}] Processing: ${item.brand} ${model} (Color: ${colorCode || 'N/A'})`);

        // Skip if no model name
        if (!model) {
            console.log(`    ⚠️  No model found - skipping API enrichment`);
            this.stats.failedFrames++;
            return {
                ...item,
                apiData: null,
                enrichedData: null,
                validation: {
                    validated: false,
                    reason: 'No model name available'
                }
            };
        }

        // Make API request using model name
        const apiData = await this.makeAPIRequest(model);

        if (!apiData.found) {
            console.log(`    ❌ Not found in API: ${apiData.reason || 'Unknown error'}`);
            this.stats.failedFrames++;
            return {
                ...item,
                apiData: null,
                enrichedData: null,
                validation: {
                    validated: false,
                    reason: apiData.reason || 'No API data found for model'
                }
            };
        }

        // Cross-reference to find exact variant
        const validation = this.crossReferenceItem(item, apiData);

        if (validation.validated) {
            console.log(`    ✅ Validated (${validation.confidence}% confidence) - UPC: ${validation.bestMatch?.upcNumber?.trim() || 'N/A'}`);
            this.stats.enrichedFrames++;
        } else {
            console.log(`    ⚠️  Validation warning (${validation.confidence}% confidence): ${validation.reason}`);
            // Still count as enriched if we have any API data
            if (validation.bestMatch) {
                this.stats.enrichedFrames++;
            } else {
                this.stats.failedFrames++;
            }
        }

        // Enrich with API data
        const enrichedData = validation.bestMatch ? {
            // Basic product data
            upc: validation.bestMatch.upcNumber?.trim(),
            style: validation.bestMatch.style,
            styleName: validation.bestMatch.styleName,

            // Pricing (retail = wholesale in Marchon's API)
            wholesale: parseFloat(validation.bestMatch.retail) || 0,
            msrp: parseFloat(validation.bestMatch.msrp) || 0,

            // Availability
            inStock: validation.bestMatch.stockStatus === 'Available',
            stockStatus: validation.bestMatch.stockStatus,
            backOrderDate: validation.bestMatch.backOrderDate || null,

            // Size data from API
            eyeSize: validation.bestMatch.SSA,
            bridge: validation.bestMatch.SSDBL,
            temple: parseInt(validation.bestMatch.templeLength) || null,
            bSize: validation.bestMatch.SSB,
            edSize: validation.bestMatch.SSED,
            circumference: validation.bestMatch.SSCIRC,

            // Color info
            colorCode: validation.bestMatch.color,
            colorDescription: validation.bestMatch.colorDescription,
            familyColorCode: validation.bestMatch.familyColorCode,
            familyColorDesc: validation.bestMatch.familyColorDesc,
            familyColorHex: validation.bestMatch.familyColorHex?.trim(),

            // Product details
            material: validation.bestMatch.planMaterial,
            gender: validation.bestMatch.gender,
            rimType: validation.bestMatch.rimType,
            fit: validation.bestMatch.fit || null,
            caseName: validation.bestMatch.caseName,

            // Marketing/Collection
            marketingGroupCode: validation.bestMatch.marketingGroupCode?.trim(),
            marketingGroupDescription: validation.bestMatch.marketingGroupDescription,

            // Images
            styleDefImageURL: validation.bestMatch.styleDefImageURL,
            colorImageURL: validation.bestMatch.colorImageURL,

            // Additional flags
            vtoIndicator: validation.bestMatch.vtoIndicator || false,
            consignable: validation.bestMatch.consignable || false
        } : null;

        // Use API data as source of truth if validated
        const finalBrand = (validation.validated && apiData.marketingGroupDescription)
            ? apiData.marketingGroupDescription
            : item.brand;

        return {
            ...item,
            brand: finalBrand,
            upc: enrichedData?.upc || item.upc,
            apiData: apiData,
            validation: validation,
            enrichedData: enrichedData
        };
    }

    // ===========================================
    // API INTERACTION
    // ===========================================

    /**
     * Make API request with retry logic and caching
     * @param {string} styleName - Style/model name to search for (e.g., "SF2223N")
     * @returns {Object} API response data
     */
    async makeAPIRequest(styleName) {
        const cacheKey = styleName.toUpperCase();
        if (this.cache.has(cacheKey)) {
            this.log(`Cache hit: ${styleName}`);
            this.stats.cacheHits++;
            return this.cache.get(cacheKey);
        }

        // Marchon API requires POST with JSON body
        const payload = {
            style: styleName,
            itemType: 'FRAME',
            orderType: 'STOCK',
            salesOrg: '2010',
            distChannel: '10',
            userCredential: {
                salesOrg: '2010',
                language: 'en_US',
                countryCode: 'US'
            }
        };

        for (let attempt = 1; attempt <= this.config.maxRetries; attempt++) {
            try {
                // Marchon API expects POST request with JSON body
                const response = await axios.post(this.config.apiUrl, payload, {
                    headers: this.config.headers,
                    timeout: this.config.timeout
                });

                const result = this.processAPIResponse(response.data, styleName);
                this.cache.set(cacheKey, result);
                return result;

            } catch (error) {
                if (attempt === this.config.maxRetries) {
                    this.log(`API Error after ${attempt} attempts: ${error.message}`);
                    this.stats.apiErrors++;
                    return {
                        found: false,
                        error: error.message,
                        reason: `API request failed: ${error.message}`
                    };
                }

                await new Promise(resolve => setTimeout(resolve, this.config.retryDelay * attempt));
            }
        }
    }

    /**
     * Process API response to extract product data
     */
    processAPIResponse(data, searchQuery) {
        // Check for API error response
        if (data.serviceStatus?.resultCode !== 0) {
            return {
                found: false,
                reason: data.serviceStatus?.message || 'API returned error'
            };
        }

        // Check for SKU details
        if (!data.skuDetail || data.skuDetail.length === 0) {
            return {
                found: false,
                reason: 'No SKU details returned'
            };
        }

        // Extract common product info
        const firstSku = data.skuDetail[0];

        return {
            found: true,
            searchQuery: searchQuery,
            styleName: firstSku.styleName,
            style: firstSku.style,
            marketingGroupCode: firstSku.marketingGroupCode,
            marketingGroupDescription: firstSku.marketingGroupDescription,
            templeMaterial: data.templeMaterial,
            styleFront: data.styleFront,
            templeLength: data.templeLength,
            lensProgram: data.lensProgram,
            variants: data.skuDetail,
            totalVariants: data.skuDetail.length
        };
    }

    // ===========================================
    // VALIDATION
    // ===========================================

    /**
     * Cross-reference parsed item with API data to find exact variant
     */
    crossReferenceItem(parsedItem, apiData) {
        if (!apiData.found) {
            return {
                validated: false,
                reason: 'API data not found',
                confidence: 0,
                matches: {}
            };
        }

        let highestScore = 0;
        let bestMatch = null;

        const targetColorCode = parsedItem.apiParams?.pickColor || parsedItem.colorCode;
        const targetEyeSize = parsedItem.apiParams?.eyeSize || parsedItem.eyeSize;
        const targetBridge = parsedItem.apiParams?.bridge || parsedItem.bridge;

        // Look for matching variant
        for (const variant of apiData.variants) {
            let variantScore = 0;
            const matches = {
                colorCode: false,
                eyeSize: false,
                bridge: false
            };

            // Color code match (highest priority)
            if (targetColorCode && variant.color) {
                const parsedColor = targetColorCode.toString().toUpperCase().trim();
                const apiColor = variant.color.toString().toUpperCase().trim();

                if (apiColor === parsedColor) {
                    matches.colorCode = true;
                    variantScore += 40;
                } else if (apiColor.includes(parsedColor) || parsedColor.includes(apiColor)) {
                    matches.colorCode = true;
                    variantScore += 20;
                }
            }

            // Eye size match
            if (targetEyeSize && variant.SSA) {
                const parsedEye = parseInt(targetEyeSize);
                const apiEye = parseInt(variant.SSA);

                if (apiEye === parsedEye) {
                    matches.eyeSize = true;
                    variantScore += 30;
                }
            }

            // Bridge size match
            if (targetBridge && variant.SSDBL) {
                const parsedBridge = parseInt(targetBridge);
                const apiBridge = parseInt(variant.SSDBL);

                if (apiBridge === parsedBridge) {
                    matches.bridge = true;
                    variantScore += 20;
                }
            }

            // Temple length match (if available)
            if (parsedItem.temple && variant.templeLength) {
                if (parseInt(variant.templeLength) === parseInt(parsedItem.temple)) {
                    variantScore += 10;
                }
            }

            // Track best match
            if (variantScore > highestScore) {
                highestScore = variantScore;
                bestMatch = {
                    variant: variant,
                    matches: matches,
                    score: variantScore,
                    ...variant
                };
            }
        }

        // If no good match found, use first variant as fallback
        if (!bestMatch && apiData.variants.length > 0) {
            bestMatch = {
                variant: apiData.variants[0],
                matches: {},
                score: 10,
                ...apiData.variants[0]
            };
            highestScore = 10;
        }

        const isValidated = highestScore >= this.config.minConfidence;

        return {
            validated: isValidated,
            confidence: highestScore,
            matches: bestMatch ? bestMatch.matches : {},
            bestMatch: bestMatch,
            reason: isValidated ? 'Cross-reference successful' : 'Insufficient matches - using best available variant'
        };
    }

    /**
     * Enrich pending inventory items (called by enrich route)
     */
    async enrichPendingItems(items) {
        const enrichedItems = [];

        for (let i = 0; i < items.length; i++) {
            const item = items[i];

            // Build search params from item
            const model = item.model || item.enriched_data?.model;
            if (!model) {
                enrichedItems.push({
                    ...item,
                    api_verified: false,
                    validation_reason: 'No model name available'
                });
                continue;
            }

            // Query API
            const apiData = await this.makeAPIRequest(model);

            if (!apiData.found) {
                enrichedItems.push({
                    ...item,
                    api_verified: false,
                    validation_reason: apiData.reason || 'Not found in API'
                });
                continue;
            }

            // Find best matching variant based on color and size
            const colorCode = item.color_code || item.enriched_data?.colorCode;
            const eyeSize = item.eye_size || item.enriched_data?.eyeSize;

            const validation = this.crossReferenceItem({
                apiParams: {
                    pickColor: colorCode,
                    eyeSize: eyeSize
                },
                colorCode: colorCode,
                eyeSize: eyeSize
            }, apiData);

            if (validation.bestMatch) {
                enrichedItems.push({
                    ...item,
                    upc: validation.bestMatch.upcNumber?.trim(),
                    wholesale_price: parseFloat(validation.bestMatch.retail) || null,
                    msrp: parseFloat(validation.bestMatch.msrp) || null,
                    in_stock: validation.bestMatch.stockStatus === 'Available',
                    api_verified: validation.validated,
                    confidence_score: validation.confidence,
                    validation_reason: validation.reason,
                    enriched_data: {
                        ...item.enriched_data,
                        marchon_api: validation.bestMatch
                    }
                });
            } else {
                enrichedItems.push({
                    ...item,
                    api_verified: false,
                    validation_reason: 'No matching variant found'
                });
            }
        }

        return enrichedItems;
    }

    /**
     * Clear cache (useful for testing or after updates)
     */
    clearCache() {
        this.cache.clear();
        console.log('🗑️  Marchon cache cleared');
    }
}

module.exports = MarchonService;

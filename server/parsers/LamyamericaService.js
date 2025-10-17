const axios = require('axios');

/**
 * LAMYAMERICA SERVICE - UPC-Based API Enrichment
 *
 * This service provides a complete solution for processing L'amyamerica orders:
 * 1. Parse HTML → Extract order info and frame data with UPCs from image URLs
 * 2. Enrich → Query L'amy API using UPC codes for pricing, stock, and product details
 * 3. Validate → Cross-reference with L'amy API data
 *
 * KEY ADVANTAGE: Uses UPC codes from image URLs instead of model name searches!
 * Image URL format: https://imageserver.jiecosystem.net/image/lamy/730638445897
 *                   The last segment (730638445897) is the UPC/barcode
 *
 * Usage:
 *   const service = new LamyamericaService();
 *   const result = await service.enrichOrderData(parsedData);
 */
class LamyamericaService {
    constructor(options = {}) {
        this.config = {
            // API Configuration
            apiUrl: 'https://www.lamyamerica.com/US/api/CatalogAPI/filter',
            timeout: options.timeout || 10000,
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
            console.log('[LamyamericaService]', ...args);
        }
    }

    // ===========================================
    // MAIN ENRICHMENT FLOW
    // ===========================================

    /**
     * Main entry point - enriches parsed order data with API information
     * @param {Object} parsedData - Data from lamyamericaParser.js
     * @returns {Object} Enriched order data with pricing and product details
     */
    async enrichOrderData(parsedData) {
        this.resetStats();
        this.stats.processingStartTime = Date.now();

        try {
            console.log('🔍 Enriching L\'amyamerica order data...\n');

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
            console.error('❌ LamyamericaService error:', error.message);
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
        console.log(`[${index + 1}/${total}] Processing: ${item.brand} ${item.model} (UPC: ${item.upc || 'N/A'})`);

        // Skip if no UPC
        if (!item.upc) {
            console.log(`    ⚠️  No UPC found - skipping API enrichment`);
            this.stats.failedFrames++;
            return {
                ...item,
                apiData: null,
                enrichedData: null,
                validation: {
                    validated: false,
                    reason: 'No UPC available'
                }
            };
        }

        // Make API request using UPC
        const apiData = await this.makeAPIRequest(item.upc);

        if (!apiData.found) {
            console.log(`    ❌ Not found in API`);
            this.stats.failedFrames++;
            return {
                ...item,
                apiData: null,
                enrichedData: null,
                validation: {
                    validated: false,
                    reason: 'No API data found for UPC'
                }
            };
        }

        // Cross-reference the data
        const validation = this.crossReferenceItem(item, apiData);

        if (validation.validated) {
            console.log(`    ✅ Validated (${validation.confidence}% confidence)`);
            this.stats.enrichedFrames++;
        } else {
            console.log(`    ⚠️  Validation warning (${validation.confidence}% confidence): ${validation.reason}`);
            this.stats.enrichedFrames++; // Still count as enriched since we have API data
        }

        // Enrich with API data
        const enrichedData = validation.bestMatch ? {
            // Basic product data
            upc: validation.bestMatch.upc,
            ean: validation.bestMatch.ean,
            sku: validation.bestMatch.sku,

            // Pricing
            wholesale: validation.bestMatch.wholesale,
            msrp: validation.bestMatch.msrp,

            // Availability
            inStock: validation.bestMatch.inStock,
            availability: validation.bestMatch.availability,
            availableDate: validation.bestMatch.availableDate,

            // Size data from API
            apiEyeSize: validation.bestMatch.eyeSize,
            apiBridge: validation.bestMatch.bridge,
            apiTemple: validation.bestMatch.temple,
            apiSize: validation.bestMatch.size,

            // Product details
            material: validation.bestMatch.material,
            frontMaterial: validation.bestMatch.frontMaterial,
            templeMaterial: validation.bestMatch.templeMaterial,
            shape: validation.bestMatch.shape,
            frameType: validation.bestMatch.frameType,
            gender: validation.bestMatch.gender,

            // Manufacturing
            countryOfOrigin: validation.bestMatch.countryOfOrigin,
            fitting: validation.bestMatch.fitting,

            // Additional info
            isNewStyle: validation.bestMatch.isNewStyle,
            isBestSeller: validation.bestMatch.isBestSeller
        } : null;

        // Use API brand/model as source of truth if validated
        const finalBrand = (validation.validated && apiData.brand) ? apiData.brand : item.brand;
        const finalModel = (validation.validated && apiData.model) ? apiData.model : item.model;

        return {
            ...item,
            brand: finalBrand,
            model: finalModel,
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
     * @param {string} upc - UPC code to search for
     * @returns {Object} API response data
     */
    async makeAPIRequest(upc) {
        const cacheKey = upc;
        if (this.cache.has(cacheKey)) {
            this.log(`Cache hit: ${upc}`);
            this.stats.cacheHits++;
            return this.cache.get(cacheKey);
        }

        for (let attempt = 1; attempt <= this.config.maxRetries; attempt++) {
            try {
                const response = await axios.post(this.config.apiUrl, {
                    "Collections": [],
                    "ColorFamily": [],
                    "Shapes": [],
                    "FrameTypes": [],
                    "Genders": [],
                    "FrameMaterials": [],
                    "FrontMaterials": [],
                    "HingeTypes": [],
                    "RimTypes": [],
                    "TempleMaterials": [],
                    "LensMaterials": [],
                    "FITTING": [],
                    "COUNTRYOFORIGIN": [],
                    "NewStyles": false,
                    "BestSellers": false,
                    "RxAvailable": false,
                    "InStock": false,
                    "Readers": false,
                    "ASizes": {"min": -1, "max": -1},
                    "BSizes": {"min": -1, "max": -1},
                    "EDSizes": {"min": -1, "max": -1},
                    "DBLSizes": {"min": -1, "max": -1},
                    "search": upc
                }, {
                    headers: this.config.headers,
                    timeout: this.config.timeout
                });

                const result = this.processAPIResponse(response.data, upc);
                this.cache.set(cacheKey, result);
                return result;

            } catch (error) {
                if (attempt === this.config.maxRetries) {
                    this.log(`API Error after ${attempt} attempts: ${error.message}`);
                    this.stats.apiErrors++;
                    return { found: false, error: error.message };
                }

                await new Promise(resolve => setTimeout(resolve, this.config.retryDelay * attempt));
            }
        }
    }

    /**
     * Process API response to extract product data
     */
    processAPIResponse(data, searchQuery) {
        if (!Array.isArray(data) || data.length === 0) {
            return { found: false, reason: 'No results returned' };
        }

        const product = data[0];

        if (!product.colorGroup || product.colorGroup.length === 0) {
            return { found: false, reason: 'No color variants found' };
        }

        // Extract all available colors and sizes
        const variants = [];
        for (const colorGroup of product.colorGroup) {
            if (colorGroup.sizes && colorGroup.sizes.length > 0) {
                for (const size of colorGroup.sizes) {
                    variants.push({
                        colorCode: colorGroup.color,
                        colorName: colorGroup.colorName || '',
                        eyeSize: size.eyeSize || size.a,
                        bridge: size.bridge || size.dbl,
                        temple: size.temple,
                        size: size.size,
                        alternateSize: size.alternateFrameSize,
                        upc: size.upc,
                        ean: size.ean || size.frameId,
                        sku: size.sku,
                        wholesale: parseFloat(size.wholesale) || parseFloat(size.price) || 0,
                        msrp: parseFloat(size.msrp) || 0,
                        inStock: size.isInStock || false,
                        availability: size.availableStatus || size.availability,
                        material: size.material,
                        frontMaterial: size.frontMaterial,
                        templeMaterial: size.templeMaterial,
                        shape: size.shape,
                        frameType: size.frameType,
                        gender: size.gender,
                        productRank: size.productRank,
                        isNewStyle: size.isNewStyle || false,
                        isBestSeller: size.isBestSeller || false,
                        availableDate: size.availableDate,
                        countryOfOrigin: size.additionalData?.find(d => d.name === 'COUNTRY OF ORIGIN')?.value,
                        fitting: size.additionalData?.find(d => d.name === 'FITTING')?.value
                    });
                }
            }
        }

        return {
            found: true,
            searchQuery: searchQuery,
            brand: product.collectionName,
            model: product.styleCode,
            description: product.description,
            category: product.category,
            variants: variants,
            totalVariants: variants.length
        };
    }

    // ===========================================
    // VALIDATION
    // ===========================================

    /**
     * Cross-reference parsed item with API data
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

        let confidence = 0;
        let bestMatch = null;

        // Look for matching variant
        for (const variant of apiData.variants) {
            let variantScore = 0;
            const matches = {
                upc: false,
                colorCode: false,
                eyeSize: false,
                bridge: false,
                temple: false
            };

            // UPC match (highest priority since we searched by UPC)
            if (variant.upc === parsedItem.upc) {
                matches.upc = true;
                variantScore += 50; // Very high score for UPC match
            }

            // Color code match
            if (parsedItem.colorCode && variant.colorCode) {
                const parsedColor = parsedItem.colorCode.toUpperCase().trim();
                const apiColor = variant.colorCode.toUpperCase().trim();

                if (apiColor === parsedColor ||
                    apiColor.includes(parsedColor) ||
                    parsedColor.includes(apiColor)) {
                    matches.colorCode = true;
                    variantScore += 20;
                }
            }

            // Size matches (from email if available)
            if (parsedItem.eyeSize && variant.eyeSize == parsedItem.eyeSize) {
                matches.eyeSize = true;
                variantScore += 10;
            }

            if (parsedItem.bridge && variant.bridge == parsedItem.bridge) {
                matches.bridge = true;
                variantScore += 10;
            }

            if (parsedItem.temple && variant.temple == parsedItem.temple) {
                matches.temple = true;
                variantScore += 10;
            }

            // Track best match
            if (variantScore > confidence) {
                confidence = variantScore;
                bestMatch = {
                    variant: variant,
                    matches: matches,
                    score: variantScore
                };
            }
        }

        const isValidated = confidence >= this.config.minConfidence;

        return {
            validated: isValidated,
            confidence: confidence,
            matches: bestMatch ? bestMatch.matches : {},
            bestMatch: bestMatch ? bestMatch.variant : null,
            reason: isValidated ? 'Cross-reference successful' : 'Insufficient matches'
        };
    }

    /**
     * Clear cache (useful for testing or after updates)
     */
    clearCache() {
        this.cache.clear();
        console.log('🗑️  L\'amyamerica cache cleared');
    }
}

module.exports = LamyamericaService;

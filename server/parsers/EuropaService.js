const axios = require('axios');
const cheerio = require('cheerio');

/**
 * EUROPA SERVICE - Web Scraping Enrichment
 *
 * This service enriches Europa parsed data by scraping product pages from europaeye.com.
 * Europa doesn't have a public API, but product data is embedded as JSON in the HTML
 * within a Vue.js component's :init-variations attribute.
 *
 * URL Pattern: https://europaeye.com/products/{stockNo}
 * Stock Number Format: {shortCode}{colorNo}{eyeSize}-{bridge}
 * Example: MRX104153-18 = MRX-104 + color 1 + 53 eye + 18 bridge
 *
 * Data Available:
 * - UPC Code
 * - Full sizing (eye, bridge, temple)
 * - Materials (front, temple)
 * - Color family, gender, shape
 * - Availability status
 * - NO PRICING (requires login) - listPrice and customerPrice are null for guests
 *
 * Usage:
 *   const service = new EuropaService();
 *   const result = await service.enrichOrderData(parsedData);
 */
class EuropaService {
    constructor(options = {}) {
        this.config = {
            // Base URL for product pages
            baseUrl: 'https://europaeye.com/products',
            timeout: options.timeout || 15000,
            maxRetries: options.maxRetries || 3,
            retryDelay: options.retryDelay || 1000,
            batchSize: options.batchSize || 3, // Lower batch size for web scraping

            // Validation Configuration
            minConfidence: options.minConfidence || 50,

            // Debug Mode
            debug: options.debug || false,

            // Headers for web requests
            headers: {
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
                'Accept-Language': 'en-US,en;q=0.5',
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            }
        };

        // Brand code mappings (short code -> brand name)
        this.brandCodes = {
            'MR': 'Michael Ryen',
            'MRX': 'Michael Ryen',
            'SH': 'Scott Harris',
            'SHV': 'Scott Harris',
            'CDA': 'Cote d\'Azur',
            'AO': 'American Optical',
            'CZ': 'Cinzia',
            'AD': 'Adams',
            'SRX': 'Saratoga Rx'
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
            webErrors: 0,
            cacheHits: 0,
            processingStartTime: null,
            processingEndTime: null
        };
    }

    log(...args) {
        if (this.config.debug) {
            console.log('[EuropaService]', ...args);
        }
    }

    // ===========================================
    // MAIN ENRICHMENT FLOW
    // ===========================================

    /**
     * Main entry point - enriches parsed order data with web-scraped information
     * @param {Object} parsedData - Data from europaParser.js
     * @returns {Object} Enriched order data with UPC and product details
     */
    async enrichOrderData(parsedData) {
        this.resetStats();
        this.stats.processingStartTime = Date.now();

        try {
            console.log('🔍 Enriching Europa order data via web scraping...\n');

            if (!parsedData.items || parsedData.items.length === 0) {
                throw new Error('No items found in parsed data');
            }

            this.stats.totalFrames = parsedData.items.length;
            console.log(`📦 Processing ${this.stats.totalFrames} items\n`);

            // Process frames in batches (web scraping needs throttling)
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
                    webErrors: this.stats.webErrors,
                    cacheHits: this.stats.cacheHits,
                    enrichmentRate: `${Math.round((this.stats.enrichedFrames / this.stats.totalFrames) * 100)}%`,
                    processingTimeSeconds: processingTime,
                    note: 'Europa does not expose pricing to non-logged-in users'
                }
            };

        } catch (error) {
            console.error('❌ EuropaService error:', error.message);
            throw error;
        }
    }

    // ===========================================
    // BATCH PROCESSING
    // ===========================================

    /**
     * Process items in batches to avoid overwhelming the server
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

            // Longer delay between batches for web scraping
            if (i + batchSize < items.length) {
                await new Promise(resolve => setTimeout(resolve, 1000));
            }
        }

        return results;
    }

    /**
     * Process individual item with web scraping enrichment
     */
    async processItem(item, index, total) {
        console.log(`[${index + 1}/${total}] Processing: ${item.brand} ${item.model} - Color ${item.colorCode}`);

        // Build stock number from parsed data
        const stockNo = this.buildStockNumber(item);

        if (!stockNo) {
            console.log(`    ⚠️  Could not build stock number - skipping enrichment`);
            this.stats.failedFrames++;
            return {
                ...item,
                webData: null,
                enrichedData: null,
                validation: {
                    validated: false,
                    reason: 'Could not construct stock number from parsed data'
                }
            };
        }

        console.log(`    Stock Number: ${stockNo}`);

        // Scrape product page
        const webData = await this.scrapeProductPage(stockNo);

        if (!webData.found) {
            console.log(`    ❌ Not found on website: ${webData.reason || 'Unknown error'}`);
            this.stats.failedFrames++;
            return {
                ...item,
                stockNo: stockNo,
                webData: null,
                enrichedData: null,
                validation: {
                    validated: false,
                    reason: webData.reason || 'Product not found on Europa website'
                }
            };
        }

        // Cross-reference to find exact variant
        const validation = this.crossReferenceItem(item, webData);

        if (validation.validated) {
            console.log(`    ✅ Validated (${validation.confidence}% confidence) - UPC: ${validation.bestMatch?.data?.upcCode || 'N/A'}`);
            this.stats.enrichedFrames++;
        } else {
            console.log(`    ⚠️  Validation warning (${validation.confidence}% confidence): ${validation.reason}`);
            if (validation.bestMatch) {
                this.stats.enrichedFrames++;
            } else {
                this.stats.failedFrames++;
            }
        }

        // Enrich with web data
        const enrichedData = validation.bestMatch ? {
            // UPC from website
            upc: validation.bestMatch.data?.upcCode || null,

            // Stock/SKU info
            stockNo: validation.bestMatch.id,
            shortCode: validation.bestMatch.data?.shortCode,

            // Sizing
            eyeSize: validation.bestMatch.data?.eyeSizeA,
            bSize: validation.bestMatch.data?.eyeSizeB,
            bridge: validation.bestMatch.data?.bridgeDbl,
            temple: validation.bestMatch.data?.templeTmp,
            effDiameter: validation.bestMatch.data?.effDiameter,

            // Color info
            colorNo: validation.bestMatch.data?.colorNo,
            color: validation.bestMatch.data?.color,
            colorFamily: validation.bestMatch.data?.colorFamily || validation.bestMatch.color_family,

            // Product details
            collectionName: validation.bestMatch.data?.collectionName,
            productName: validation.bestMatch.data?.productName,
            description: validation.bestMatch.data?.descriptionLong,

            // Materials
            frontMaterial: validation.bestMatch.data?.frontMaterial,
            templeMaterial: validation.bestMatch.data?.templeMaterial,
            hinge: validation.bestMatch.data?.hinge,
            bridgeType: validation.bestMatch.data?.bridgeType,

            // Category info
            gender: validation.bestMatch.gender,
            productType: validation.bestMatch.product_type,
            frontShape: validation.bestMatch.front_shape,

            // Availability
            isAvailable: validation.bestMatch.isAvailable,
            availabilityText: validation.bestMatch.availabilityText,
            isOnBackOrder: validation.bestMatch.isOnBackOrder,
            isOutOfStock: validation.bestMatch.isOutOfStock,

            // Images
            frontImageUrl: validation.bestMatch.frontImageUrl,
            profileImageUrl: validation.bestMatch.profileImageUrl,
            images: validation.bestMatch.images,

            // Pricing (null for non-logged-in users)
            listPrice: validation.bestMatch.data?.listPrice,
            customerPrice: validation.bestMatch.data?.customerPrice,

            // URL
            productUrl: validation.bestMatch.url
        } : null;

        return {
            ...item,
            stockNo: stockNo,
            upc: enrichedData?.upc || item.upc,
            webData: webData,
            validation: validation,
            enrichedData: enrichedData
        };
    }

    // ===========================================
    // STOCK NUMBER CONSTRUCTION
    // ===========================================

    /**
     * Build Europa stock number from parsed item data
     * Format: {shortCode}{colorNo}{eyeSize}-{bridge}
     * Example: MRX104153-18
     *
     * @param {Object} item - Parsed item from email
     * @returns {string|null} Stock number or null if can't construct
     */
    buildStockNumber(item) {
        // Extract short code from model (remove dashes and spaces)
        let shortCode = this.extractShortCode(item.model, item.brand);
        if (!shortCode) {
            this.log('Could not extract short code from:', item.model);
            return null;
        }

        // Get color number (usually a single digit)
        const colorNo = item.colorCode || '1';

        // Get eye size (just the number, e.g., "53" from "53-18-140")
        let eyeSize = item.eyeSize || item.size;
        if (eyeSize && eyeSize.includes('-')) {
            eyeSize = eyeSize.split('-')[0];
        }
        if (!eyeSize) {
            this.log('Could not extract eye size');
            return null;
        }

        // Get bridge size (if available from size string like "53-18-140")
        let bridge = '';
        if (item.size && item.size.includes('-')) {
            const sizeParts = item.size.split('-');
            if (sizeParts.length >= 2) {
                bridge = sizeParts[1];
            }
        }

        // Europa uses bridge in stock number, but sometimes it's not in the email
        // Try common bridge sizes if not available
        if (!bridge) {
            // Will try multiple bridge sizes when scraping
            bridge = '18'; // Default, most common
        }

        // Build stock number: shortCode + colorNo + eyeSize + "-" + bridge
        // Note: shortCode already has no dashes (e.g., "MRX104" not "MRX-104")
        const stockNo = `${shortCode}${colorNo}${eyeSize}-${bridge}`;

        return stockNo;
    }

    /**
     * Extract short code from model name
     * Examples:
     *   "MRX-104" -> "MRX104"
     *   "Michael Ryen Sport 104" -> "MRX104" (based on brand mapping)
     *   "CDA-422" -> "CDA422"
     */
    extractShortCode(model, brand) {
        if (!model) return null;

        // If model is already in short code format (e.g., "MRX-104")
        const shortCodeMatch = model.match(/^([A-Z]+)-?(\d+[A-Z]?)$/i);
        if (shortCodeMatch) {
            // Remove dash and return: "MRX-104" -> "MRX104"
            return shortCodeMatch[1].toUpperCase() + shortCodeMatch[2];
        }

        // Try to extract from full product name
        // e.g., "Michael Ryen Sport 104" -> look for number and use brand code
        const numberMatch = model.match(/(\d+[A-Z]?)$/);
        if (numberMatch && brand) {
            const brandCode = this.getBrandCode(brand);
            if (brandCode) {
                return brandCode + numberMatch[1];
            }
        }

        // Try extracting any alphanumeric code
        const alphanumMatch = model.match(/([A-Z]{2,4})[\s-]?(\d+[A-Z]?)/i);
        if (alphanumMatch) {
            return alphanumMatch[1].toUpperCase() + alphanumMatch[2];
        }

        return null;
    }

    /**
     * Get brand code from brand name
     */
    getBrandCode(brandName) {
        if (!brandName) return null;

        const brandLower = brandName.toLowerCase();

        if (brandLower.includes('michael ryen')) return 'MR';
        if (brandLower.includes('scott harris')) return 'SH';
        if (brandLower.includes('cote d\'azur') || brandLower.includes('cote d azur')) return 'CDA';
        if (brandLower.includes('american optical')) return 'AO';
        if (brandLower.includes('cinzia')) return 'CZ';

        return null;
    }

    // ===========================================
    // WEB SCRAPING
    // ===========================================

    /**
     * Scrape product page and extract JSON data
     * @param {string} stockNo - Stock number (e.g., "MRX104153-18")
     * @returns {Object} Product data or error
     */
    async scrapeProductPage(stockNo) {
        const cacheKey = stockNo.toUpperCase();
        if (this.cache.has(cacheKey)) {
            this.log(`Cache hit: ${stockNo}`);
            this.stats.cacheHits++;
            return this.cache.get(cacheKey);
        }

        const url = `${this.config.baseUrl}/${stockNo}`;

        for (let attempt = 1; attempt <= this.config.maxRetries; attempt++) {
            try {
                this.log(`Fetching: ${url} (attempt ${attempt})`);

                const response = await axios.get(url, {
                    headers: this.config.headers,
                    timeout: this.config.timeout
                });

                const result = this.parseProductPage(response.data, stockNo);
                this.cache.set(cacheKey, result);
                return result;

            } catch (error) {
                if (error.response?.status === 404) {
                    // Try alternate bridge sizes
                    const alternateResult = await this.tryAlternateBridgeSizes(stockNo);
                    if (alternateResult) {
                        this.cache.set(cacheKey, alternateResult);
                        return alternateResult;
                    }

                    return {
                        found: false,
                        reason: 'Product not found (404)'
                    };
                }

                if (attempt === this.config.maxRetries) {
                    this.log(`Web Error after ${attempt} attempts: ${error.message}`);
                    this.stats.webErrors++;
                    return {
                        found: false,
                        error: error.message,
                        reason: `Web request failed: ${error.message}`
                    };
                }

                await new Promise(resolve => setTimeout(resolve, this.config.retryDelay * attempt));
            }
        }
    }

    /**
     * Try alternate bridge sizes if initial request fails
     */
    async tryAlternateBridgeSizes(stockNo) {
        const basePart = stockNo.split('-')[0];
        const commonBridges = ['16', '17', '18', '19', '20'];

        for (const bridge of commonBridges) {
            const altStockNo = `${basePart}-${bridge}`;
            if (altStockNo === stockNo) continue; // Skip the one we already tried

            try {
                const url = `${this.config.baseUrl}/${altStockNo}`;
                const response = await axios.get(url, {
                    headers: this.config.headers,
                    timeout: this.config.timeout
                });

                const result = this.parseProductPage(response.data, altStockNo);
                if (result.found) {
                    this.log(`Found with alternate bridge: ${altStockNo}`);
                    return result;
                }
            } catch (error) {
                // Continue trying other bridge sizes
            }
        }

        return null;
    }

    /**
     * Parse product page HTML and extract JSON data from Vue component
     */
    parseProductPage(html, stockNo) {
        try {
            const $ = cheerio.load(html);

            // Find the router-view component with :init-variations attribute
            const routerView = $('router-view[\\:init-variations]');
            if (!routerView.length) {
                return {
                    found: false,
                    reason: 'Could not find product data in page'
                };
            }

            // Extract the JSON string from the attribute
            const jsonString = routerView.attr(':init-variations');
            if (!jsonString) {
                return {
                    found: false,
                    reason: 'No variations data found'
                };
            }

            // Parse the JSON
            let variations;
            try {
                variations = JSON.parse(jsonString);
            } catch (parseError) {
                // Try decoding HTML entities
                const decoded = jsonString
                    .replace(/&quot;/g, '"')
                    .replace(/&#39;/g, "'")
                    .replace(/&amp;/g, '&');
                variations = JSON.parse(decoded);
            }

            if (!variations || variations.length === 0) {
                return {
                    found: false,
                    reason: 'No product variations found'
                };
            }

            // Extract product info from first variation
            const firstVar = variations[0];

            return {
                found: true,
                stockNo: stockNo,
                productName: firstVar.productName,
                shortCode: firstVar.data?.shortCode || firstVar.short_code,
                collectionName: firstVar.data?.collectionName,
                variations: variations,
                totalVariants: variations.length
            };

        } catch (error) {
            this.log(`Parse error: ${error.message}`);
            return {
                found: false,
                reason: `Failed to parse page: ${error.message}`
            };
        }
    }

    // ===========================================
    // VALIDATION
    // ===========================================

    /**
     * Cross-reference parsed item with web data to find exact variant
     */
    crossReferenceItem(parsedItem, webData) {
        if (!webData.found) {
            return {
                validated: false,
                reason: 'Web data not found',
                confidence: 0,
                matches: {}
            };
        }

        let highestScore = 0;
        let bestMatch = null;

        const targetColorNo = parsedItem.colorCode;
        const targetEyeSize = parsedItem.eyeSize || parsedItem.size?.split('-')[0];

        // Look for matching variant
        for (const variant of webData.variations) {
            let variantScore = 0;
            const matches = {
                colorNo: false,
                eyeSize: false
            };

            // Color number match (highest priority)
            if (targetColorNo && variant.data?.colorNo) {
                const parsedColor = parseInt(targetColorNo);
                const webColor = parseInt(variant.data.colorNo);

                if (webColor === parsedColor) {
                    matches.colorNo = true;
                    variantScore += 50;
                }
            }

            // Eye size match
            if (targetEyeSize && variant.data?.eyeSizeA) {
                const parsedEye = parseInt(targetEyeSize);
                const webEye = parseInt(variant.data.eyeSizeA);

                if (webEye === parsedEye) {
                    matches.eyeSize = true;
                    variantScore += 40;
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
        if (!bestMatch && webData.variations.length > 0) {
            bestMatch = {
                variant: webData.variations[0],
                matches: {},
                score: 10,
                ...webData.variations[0]
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

            // Build stock number from item
            const stockNo = this.buildStockNumber({
                model: item.model || item.enriched_data?.model,
                brand: item.brand || item.enriched_data?.brand,
                colorCode: item.color_code || item.enriched_data?.colorCode,
                eyeSize: item.eye_size || item.enriched_data?.eyeSize,
                size: item.size || item.enriched_data?.size
            });

            if (!stockNo) {
                enrichedItems.push({
                    ...item,
                    api_verified: false,
                    validation_reason: 'Could not build stock number'
                });
                continue;
            }

            // Scrape product page
            const webData = await this.scrapeProductPage(stockNo);

            if (!webData.found) {
                enrichedItems.push({
                    ...item,
                    api_verified: false,
                    validation_reason: webData.reason || 'Not found on website'
                });
                continue;
            }

            // Find best matching variant
            const validation = this.crossReferenceItem({
                colorCode: item.color_code || item.enriched_data?.colorCode,
                eyeSize: item.eye_size || item.enriched_data?.eyeSize
            }, webData);

            if (validation.bestMatch) {
                enrichedItems.push({
                    ...item,
                    upc: validation.bestMatch.data?.upcCode || null,
                    stock_no: stockNo,
                    api_verified: validation.validated,
                    confidence_score: validation.confidence,
                    validation_reason: validation.reason,
                    enriched_data: {
                        ...item.enriched_data,
                        europa_web: validation.bestMatch.data
                    }
                });
            } else {
                enrichedItems.push({
                    ...item,
                    api_verified: false,
                    validation_reason: 'No matching variant found'
                });
            }

            // Add delay between items for web scraping
            if (i < items.length - 1) {
                await new Promise(resolve => setTimeout(resolve, 500));
            }
        }

        return enrichedItems;
    }

    /**
     * Clear cache
     */
    clearCache() {
        this.cache.clear();
        console.log('🗑️  Europa cache cleared');
    }
}

module.exports = EuropaService;

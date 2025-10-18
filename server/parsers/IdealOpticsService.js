const { parseIdealOpticsHtml } = require('./idealOpticsParser');
const IdealOpticsWebService = require('./IdealOpticsWebService');

/**
 * Ideal Optics Service - Integrates email parsing with web enrichment
 * Follows the same pattern as ModernOpticalService for consistency
 *
 * Flow:
 * 1. Parse email HTML to extract order info and items
 * 2. Enrich items with web data (UPC, precise measurements)
 * 3. Note: Pricing (wholesale/MSRP) is NOT available from Ideal Optics website
 */
class IdealOpticsService {
    constructor(options = {}) {
        this.webService = new IdealOpticsWebService({
            timeout: options.timeout || 15000,
            maxRetries: options.maxRetries || 3,
            retryDelay: options.retryDelay || 1000
        });
        this.debug = options.debug || false;
        this.enableWebEnrichment = options.enableWebEnrichment !== false; // Default to true

        console.log('🏭 IdealOpticsService initialized');
        console.log(`🌐 Web enrichment: ${this.enableWebEnrichment ? 'enabled' : 'disabled'}`);
    }

    /**
     * Parse Ideal Optics email (HTML format)
     * @param {string} html - HTML content of the email
     * @param {string} plainText - Plain text content of the email
     * @returns {object} Parsed order data
     */
    parseEmail(html, plainText) {
        console.log('📧 Parsing Ideal Optics email...');

        try {
            const parsedData = parseIdealOpticsHtml(html, plainText);

            if (this.debug) {
                console.log('📊 Email Parse Result:');
                console.log('- Vendor:', parsedData.vendor);
                console.log('- Account Number:', parsedData.account_number);
                console.log('- Order Number:', parsedData.order?.order_number);
                console.log('- Customer Name:', parsedData.order?.customer_name);
                console.log('- Items Count:', parsedData.items?.length);
                console.log('- Unique Frames:', parsedData.unique_frames?.length);
            }

            return parsedData;
        } catch (error) {
            console.error('❌ Error parsing Ideal Optics email:', error);
            throw error;
        }
    }

    /**
     * Enrich pending items with web data (called during confirmation process)
     * @param {Array} pendingItems - Array of pending inventory items
     * @returns {Promise<Array>} Enriched items
     */
    async enrichPendingItems(pendingItems) {
        if (!this.enableWebEnrichment) {
            console.log('🔄 Web enrichment disabled, returning items as-is');
            return pendingItems;
        }

        console.log(`🌐 Starting web enrichment for ${pendingItems.length} Ideal Optics items...`);

        try {
            // Group items by unique frame (model only, since brand is always "Ideal Optics")
            const frameGroups = this.groupItemsByFrame(pendingItems);
            console.log(`📦 Grouped ${pendingItems.length} items into ${frameGroups.length} unique frames`);

            const enrichedItems = [];

            // Process each frame group
            for (const frameGroup of frameGroups) {
                const { model, items } = frameGroup;

                console.log(`🔍 Enriching frame: ${model} (${items.length} items)`);

                try {
                    // Scrape web data for this frame
                    const webData = await this.webService.scrapeProduct(model);

                    if (webData.found && webData.variants?.length > 0) {
                        console.log(`✅ Found web data with ${webData.variants.length} variants`);

                        // Enrich each item in this frame group
                        for (const item of items) {
                            const enrichedItem = this.enrichItemWithWebData(item, webData);
                            enrichedItems.push(enrichedItem);
                        }
                    } else {
                        console.log(`⚠️  No web data found for ${model}, keeping original data`);
                        // Add items without enrichment
                        enrichedItems.push(...items);
                    }

                    // Add delay between requests to be respectful
                    if (frameGroups.indexOf(frameGroup) < frameGroups.length - 1) {
                        await this.sleep(1000); // 1 second delay
                    }

                } catch (scrapeError) {
                    console.error(`❌ Error scraping ${model}:`, scrapeError.message);
                    // Add items without enrichment on error
                    enrichedItems.push(...items);
                }
            }

            console.log(`✅ Web enrichment completed. Processed ${enrichedItems.length} items`);
            return enrichedItems;

        } catch (error) {
            console.error('❌ Error during web enrichment:', error);
            // Return original items if enrichment fails completely
            return pendingItems;
        }
    }

    /**
     * Group items by unique frame (model only)
     * @param {Array} items - Array of inventory items
     * @returns {Array} Array of frame groups
     */
    groupItemsByFrame(items) {
        const frameMap = new Map();

        for (const item of items) {
            const frameKey = item.model;

            if (!frameMap.has(frameKey)) {
                frameMap.set(frameKey, {
                    brand: 'Ideal Optics',
                    model: item.model,
                    items: []
                });
            }

            frameMap.get(frameKey).items.push(item);
        }

        return Array.from(frameMap.values());
    }

    /**
     * Enrich a single item with web data
     * @param {object} item - Original inventory item
     * @param {object} webData - Data from web scraping
     * @returns {object} Enriched item
     */
    enrichItemWithWebData(item, webData) {
        const enrichedItem = { ...item };

        try {
            // Find matching variant by color
            const matchingVariant = this.findMatchingVariant(item, webData.variants);

            if (matchingVariant) {
                console.log(`  🎯 Found matching variant for ${item.color}`);

                // Add enriched data from web scraping
                enrichedItem.upc = matchingVariant.upc || item.upc;
                enrichedItem.color_name = matchingVariant.colorName || item.color_name || item.color;
                enrichedItem.color_code = matchingVariant.colorCode || item.color_code;

                // Update measurements with precise web data
                enrichedItem.eye_size = matchingVariant.eyeSize || item.eye_size;
                enrichedItem.bridge = matchingVariant.bridge || item.bridge;
                enrichedItem.temple_length = matchingVariant.temple || item.temple_length;
                enrichedItem.a = matchingVariant.a;
                enrichedItem.b = matchingVariant.b;
                enrichedItem.dbl = matchingVariant.dbl;
                enrichedItem.ed = matchingVariant.ed;
                enrichedItem.fit_type = matchingVariant.fitType;

                // Update material and gender from web data
                enrichedItem.material = webData.material || item.material;
                enrichedItem.gender = webData.gender || item.gender;

                // Set API verification status
                enrichedItem.api_verified = true;
                enrichedItem.confidence_score = this.calculateConfidenceScore(item, matchingVariant);
                enrichedItem.validation_reason = 'Ideal Optics website match';

            } else {
                console.log(`  ⚠️  No matching variant found for color: ${item.color}`);

                // Still add some general enrichment
                enrichedItem.material = webData.material || item.material;
                enrichedItem.gender = webData.gender || item.gender;
                enrichedItem.api_verified = false;
                enrichedItem.confidence_score = 20; // Low confidence without color match
                enrichedItem.validation_reason = 'Product found but color not matched';
            }

        } catch (enrichError) {
            console.error(`Error enriching item ${item.sku}:`, enrichError.message);
            // Return item with minimal enrichment on error
            enrichedItem.api_verified = false;
            enrichedItem.validation_reason = `Enrichment error: ${enrichError.message}`;
        }

        return enrichedItem;
    }

    /**
     * Find matching variant by color name
     * @param {object} item - Inventory item with color
     * @param {Array} variants - Array of web variants
     * @returns {object|null} Matching variant or null
     */
    findMatchingVariant(item, variants) {
        if (!variants || variants.length === 0) return null;

        const itemColor = (item.color || '').toLowerCase().trim();

        // Try different matching strategies
        for (const variant of variants) {
            const variantColor = (variant.colorName || '').toLowerCase().trim();
            const variantCode = (variant.colorCode || '').toLowerCase().trim();

            // Exact match
            if (itemColor === variantColor || itemColor === variantCode) {
                return variant;
            }

            // Partial match (contains)
            if (itemColor && variantColor &&
                (itemColor.includes(variantColor) || variantColor.includes(itemColor))) {
                return variant;
            }
        }

        // If no match found, return first variant (fallback)
        if (variants.length > 0) {
            console.log(`  📍 Using first variant as fallback for ${itemColor}`);
            return variants[0];
        }

        return null;
    }

    /**
     * Calculate confidence score for enrichment
     * @param {object} item - Original item
     * @param {object} variant - Matched variant
     * @returns {number} Confidence score (0-100)
     */
    calculateConfidenceScore(item, variant) {
        let score = 50; // Base score for finding the product

        // Increase score for exact color match
        if (item.color && variant.colorName &&
            item.color.toLowerCase() === variant.colorName.toLowerCase()) {
            score += 30;
        }

        // Increase score for having UPC
        if (variant.upc) {
            score += 20;
        }

        return Math.min(100, score);
    }

    /**
     * Sleep utility
     * @param {number} ms - Milliseconds to sleep
     * @returns {Promise}
     */
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Process complete order (email parsing + web enrichment)
     * @param {string} html - HTML content
     * @param {string} plainText - Plain text content
     * @param {boolean} enrichOnParse - Whether to enrich immediately (default: false)
     * @returns {Promise<object>} Complete processed order data
     */
    async processOrder(html, plainText, enrichOnParse = false) {
        console.log('🏭 Processing Ideal Optics order...');

        // 1. Parse email
        const parsedData = this.parseEmail(html, plainText);

        // 2. Optionally enrich immediately (not recommended for webhook processing)
        if (enrichOnParse && this.enableWebEnrichment) {
            console.log('🌐 Enriching items immediately...');
            parsedData.items = await this.enrichPendingItems(parsedData.items);
        }

        return parsedData;
    }

    /**
     * Get service status
     * @returns {object} Service status information
     */
    getStatus() {
        return {
            service: 'IdealOpticsService',
            version: '1.0.0',
            webEnrichment: this.enableWebEnrichment,
            webService: this.webService.getStatus(),
            debug: this.debug
        };
    }
}

module.exports = IdealOpticsService;

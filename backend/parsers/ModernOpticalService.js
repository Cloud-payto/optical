const { parseModernOpticalHtml } = require('./modernopticalparser');
const ModernOpticalWebService = require('./ModernOpticalWebService');

/**
 * Modern Optical Service - Integrates email parsing with web enrichment
 * Follows the same pattern as SafiloService for consistency
 */
class ModernOpticalService {
    constructor(options = {}) {
        this.webService = new ModernOpticalWebService({
            timeout: options.timeout || 15000,
            maxRetries: options.maxRetries || 3,
            retryDelay: options.retryDelay || 1000
        });
        this.debug = options.debug || false;
        this.enableWebEnrichment = options.enableWebEnrichment !== false; // Default to true
        
        console.log('🏭 ModernOpticalService initialized');
        console.log(`🌐 Web enrichment: ${this.enableWebEnrichment ? 'enabled' : 'disabled'}`);
    }

    /**
     * Parse Modern Optical email (HTML format)
     * @param {string} html - HTML content of the email
     * @param {string} plainText - Plain text content of the email
     * @returns {object} Parsed order data
     */
    parseEmail(html, plainText) {
        console.log('📧 Parsing Modern Optical email...');
        
        try {
            const parsedData = parseModernOpticalHtml(html, plainText);
            
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
            console.error('❌ Error parsing Modern Optical email:', error);
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

        console.log(`🌐 Starting web enrichment for ${pendingItems.length} Modern Optical items...`);
        
        try {
            // Group items by unique frame (brand + model combination)
            const frameGroups = this.groupItemsByFrame(pendingItems);
            console.log(`📦 Grouped ${pendingItems.length} items into ${frameGroups.length} unique frames`);
            
            const enrichedItems = [];
            
            // Process each frame group
            for (const frameGroup of frameGroups) {
                const { brand, model, items } = frameGroup;
                
                console.log(`🔍 Enriching frame: ${brand} - ${model} (${items.length} items)`);
                
                try {
                    // Scrape web data for this frame
                    const webData = await this.webService.scrapeProduct(brand, model);
                    
                    if (webData.found && webData.variants?.length > 0) {
                        console.log(`✅ Found web data with ${webData.variants.length} variants`);
                        
                        // Enrich each item in this frame group
                        for (const item of items) {
                            const enrichedItem = this.enrichItemWithWebData(item, webData);
                            enrichedItems.push(enrichedItem);
                        }
                    } else {
                        console.log(`⚠️  No web data found for ${brand} - ${model}, keeping original data`);
                        // Add items without enrichment
                        enrichedItems.push(...items);
                    }
                    
                    // Add delay between requests to be respectful
                    if (frameGroups.indexOf(frameGroup) < frameGroups.length - 1) {
                        await this.sleep(1000); // 1 second delay
                    }
                    
                } catch (scrapeError) {
                    console.error(`❌ Error scraping ${brand} - ${model}:`, scrapeError.message);
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
     * Group items by unique frame (brand + model)
     * @param {Array} items - Array of inventory items
     * @returns {Array} Array of frame groups
     */
    groupItemsByFrame(items) {
        const frameMap = new Map();
        
        for (const item of items) {
            const frameKey = `${item.brand}-${item.model}`;
            
            if (!frameMap.has(frameKey)) {
                frameMap.set(frameKey, {
                    brand: item.brand,
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
                enrichedItem.full_size = this.formatSize(matchingVariant) || item.full_size;
                enrichedItem.temple_length = matchingVariant.temple || item.temple_length;
                enrichedItem.in_stock = matchingVariant.inStock !== false; // Default to true if not specified
                enrichedItem.material = webData.material || item.material;
                
                // Set API verification status
                enrichedItem.api_verified = true;
                enrichedItem.confidence_score = this.calculateConfidenceScore(item, matchingVariant);
                enrichedItem.validation_reason = 'Modern Optical website match';
                
            } else {
                console.log(`  ⚠️  No matching variant found for color: ${item.color}`);
                
                // Still add some general enrichment
                enrichedItem.material = webData.material || item.material;
                enrichedItem.api_verified = false;
                enrichedItem.confidence_score = 20; // Low confidence without color match
                enrichedItem.validation_reason = 'Product found but color not matched';
            }
            
            // Add general product data
            enrichedItem.gender = webData.gender || item.gender;
            enrichedItem.hinge_type = webData.hinge || item.hinge_type;
            
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
        const itemColorNormalized = (item.color_normalized || '').toLowerCase().trim();
        
        // Try different matching strategies
        for (const variant of variants) {
            const variantColor = (variant.colorName || '').toLowerCase().trim();
            const variantCode = (variant.colorCode || '').toLowerCase().trim();
            
            // Exact match
            if (itemColor === variantColor || itemColorNormalized === variantColor) {
                return variant;
            }
            
            // Color code match
            if (itemColor === variantCode || itemColorNormalized === variantCode) {
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
     * Format size from variant measurements
     * @param {object} variant - Variant with measurements
     * @returns {string} Formatted size string
     */
    formatSize(variant) {
        if (!variant) return '';
        
        const parts = [];
        
        if (variant.eyeSize) parts.push(variant.eyeSize);
        if (variant.bridge) parts.push(variant.bridge);
        if (variant.temple) parts.push(variant.temple);
        
        return parts.length > 0 ? parts.join('-') : '';
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
        console.log('🏭 Processing Modern Optical order...');
        
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
            service: 'ModernOpticalService',
            version: '1.0.0',
            webEnrichment: this.enableWebEnrichment,
            webService: this.webService.getStatus(),
            debug: this.debug
        };
    }
}

module.exports = ModernOpticalService;
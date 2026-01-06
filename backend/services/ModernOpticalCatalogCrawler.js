// Load environment variables first
require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });

const axios = require('axios');
const { supabase } = require('../lib/supabase');

/**
 * MODERN OPTICAL FULL CATALOG CRAWLER (NO AUTH REQUIRED)
 *
 * This service crawls the ENTIRE Modern Optical catalog using their public search API
 * and populates the vendor_catalog table.
 *
 * Modern Optical uses the same jiecosystem backend as Kenmark and Safilo, so we use
 * the same "Alphabet Soup" technique to capture ALL products.
 *
 * How it works - "Alphabet Soup" Approach:
 * - Searches for every single letter (A-Z) and digit (0-9) = 36 API calls
 * - Each search returns products containing that character
 * - Automatically deduplicates products found in multiple searches
 * - Brand name is extracted from API response (collectionName field)
 * - Stores all product variants in the vendor_catalog table
 *
 * Usage:
 *   const crawler = new ModernOpticalCatalogCrawler();
 *   await crawler.crawlFullCatalog();
 *
 * Or for single product enrichment:
 *   const result = await crawler.enrichItem({ brand: 'MODZ', model: 'AUSTIN', color: 'BROWN' });
 */
class ModernOpticalCatalogCrawler {
    constructor(options = {}) {
        this.config = {
            apiUrl: 'https://modernoptical.com/US/api/CatalogAPI/filter',
            timeout: options.timeout || 30000,
            maxRetries: options.maxRetries || 3,
            retryDelay: options.retryDelay || 2000,
            batchSize: options.batchSize || 50,
            rateLimitDelay: options.rateLimitDelay || 1000, // 1 second between requests
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
        };

        this.stats = {
            totalProcessed: 0,
            totalCached: 0,
            totalUpdated: 0,
            totalErrors: 0,
            startTime: null,
            endTime: null
        };

        this.vendorId = null;
        console.log('🏭 ModernOpticalCatalogCrawler initialized');
    }

    /**
     * Main entry point - crawl entire Modern Optical catalog
     */
    async crawlFullCatalog() {
        console.log('🚀 Starting full Modern Optical catalog crawl...');
        this.stats.startTime = Date.now();

        try {
            // 1. Get Modern Optical vendor ID from database
            await this.getVendorId();

            // 2. Get all search terms (A-Z, 0-9)
            const searchTerms = this.getAllSearchTerms();
            console.log(`📦 Using "Alphabet Soup" approach: ${searchTerms.length} search terms (A-Z, 0-9)`);

            // 3. Crawl using alphabet soup approach
            const allProducts = new Map(); // Deduplicate across all searches
            let searchCount = 0;

            for (const searchTerm of searchTerms) {
                searchCount++;
                console.log(`\n[${searchCount}/${searchTerms.length}] Searching: "${searchTerm}"`);

                try {
                    const response = await this.makeApiRequest({ search: searchTerm });

                    if (!response || !Array.isArray(response) || response.length === 0) {
                        console.log(`   No products found`);
                        continue;
                    }

                    console.log(`   Found ${response.length} products`);

                    // Add products to map (deduplicates automatically)
                    for (const product of response) {
                        const key = `${product.styleCode || product.model}`;
                        if (!allProducts.has(key)) {
                            allProducts.set(key, product);
                        }
                    }

                    console.log(`   📊 Total unique products so far: ${allProducts.size}`);

                } catch (error) {
                    console.error(`   ❌ Error searching "${searchTerm}":`, error.message);
                    this.stats.totalErrors++;
                }

                // Rate limiting - be nice to the API
                await this.sleep(this.config.rateLimitDelay);
            }

            console.log(`\n🎉 Search complete! Found ${allProducts.size} unique products`);

            // 4. Process all products
            const products = Array.from(allProducts.values());
            await this.processAllProducts(products);

            this.stats.endTime = Date.now();
            this.printSummary();

            return {
                success: true,
                stats: this.stats
            };

        } catch (error) {
            console.error('❌ Catalog crawl failed:', error.message);
            this.stats.endTime = Date.now();
            throw error;
        }
    }

    /**
     * Enrich a single item by looking it up in the Modern Optical API
     * @param {object} item - Item with brand, model, color, size
     * @returns {object} Enriched item with UPC, wholesale price, etc.
     */
    async enrichItem(item) {
        const { brand, model, color, size, eye_size } = item;
        console.log(`🔍 Enriching Modern Optical item: ${brand} ${model} ${color}`);

        try {
            // Search by model name
            const response = await this.makeApiRequest({ search: model });

            if (!response || !Array.isArray(response) || response.length === 0) {
                console.log(`   ⚠️ No products found for model: ${model}`);
                return { ...item, api_verified: false, enriched: false };
            }

            // Find the matching product
            const product = response.find(p => {
                const styleMatch = (p.styleCode || '').toUpperCase() === model.toUpperCase() ||
                                   (p.styleName || '').toUpperCase() === model.toUpperCase();
                const brandMatch = !brand ||
                                   (p.collectionName || '').toUpperCase().includes(brand.toUpperCase()) ||
                                   brand.toUpperCase().includes((p.collectionName || '').toUpperCase());
                return styleMatch && brandMatch;
            });

            if (!product) {
                console.log(`   ⚠️ No exact match found for ${brand} ${model}`);
                return { ...item, api_verified: false, enriched: false };
            }

            // Find matching color/size variant
            const variant = this.findMatchingVariant(product, color, size || eye_size);

            if (variant) {
                console.log(`   ✅ Found matching variant: UPC=${variant.upc}, Wholesale=$${variant.wholesale}`);
                console.log(`   📏 Full sizing: ${variant.eyeSize}-${variant.bridge}-${variant.temple} (A:${variant.a}, B:${variant.b}, DBL:${variant.dbl}, ED:${variant.ed})`);
                return {
                    ...item,
                    upc: variant.upc || item.upc,
                    wholesale_price: variant.wholesale || variant.price || item.wholesale_price,
                    msrp: variant.msrp || item.msrp,
                    eye_size: variant.eyeSize || item.eye_size,
                    bridge: variant.bridge || item.bridge,
                    temple: variant.temple || item.temple,
                    full_size: variant.size || item.full_size,
                    // Include all measurements from API
                    a: variant.a || item.a,
                    b: variant.b || item.b,
                    dbl: variant.dbl || item.dbl,
                    ed: variant.ed || item.ed,
                    sku: variant.sku || item.sku,
                    in_stock: variant.isInStock || variant.availableStatus === 'in stock',
                    material: variant.material || product.material || item.material,
                    gender: variant.gender || product.gender || item.gender,
                    color_code: variant.colorCode || item.color_code,
                    color_name: variant.color || item.color_name,
                    api_verified: true,
                    enriched: true,
                    confidence_score: 100,
                    validation_reason: 'Modern Optical API match'
                };
            } else {
                console.log(`   ⚠️ Product found but no matching color/size variant`);
                return { ...item, api_verified: false, enriched: false };
            }

        } catch (error) {
            console.error(`   ❌ Error enriching item:`, error.message);
            return { ...item, api_verified: false, enriched: false, error: error.message };
        }
    }

    /**
     * Enrich multiple items
     * @param {Array} items - Array of items to enrich
     * @returns {Array} Enriched items
     */
    async enrichItems(items) {
        console.log(`🏭 Starting Modern Optical API enrichment for ${items.length} items...`);

        // Ensure we have vendor ID
        if (!this.vendorId) {
            await this.getVendorId();
        }

        const enrichedItems = [];

        for (const item of items) {
            const enrichedItem = await this.enrichItem(item);
            enrichedItems.push(enrichedItem);

            // Small delay between requests
            await this.sleep(200);
        }

        const enrichedCount = enrichedItems.filter(i => i.enriched).length;
        console.log(`✅ Enrichment complete: ${enrichedCount}/${items.length} items enriched`);

        return enrichedItems;
    }

    /**
     * Find matching variant by color and size
     */
    findMatchingVariant(product, targetColor, targetSize) {
        if (!product.colorGroup || product.colorGroup.length === 0) {
            return null;
        }

        const normalizedTargetColor = (targetColor || '').toUpperCase().trim();
        const normalizedTargetSize = (targetSize || '').toString().trim();

        for (const colorGroup of product.colorGroup) {
            const colorName = (colorGroup.color || '').toUpperCase().trim();

            // Check if color matches
            const colorMatches = !targetColor ||
                colorName === normalizedTargetColor ||
                colorName.includes(normalizedTargetColor) ||
                normalizedTargetColor.includes(colorName);

            if (!colorMatches) continue;

            // Look through sizes for this color
            if (colorGroup.sizes && colorGroup.sizes.length > 0) {
                // Try to match by size first
                if (targetSize) {
                    const sizeMatch = colorGroup.sizes.find(s =>
                        s.eyeSize === normalizedTargetSize ||
                        s.eyeSize === parseInt(normalizedTargetSize) ||
                        (s.size || '').includes(normalizedTargetSize)
                    );
                    if (sizeMatch) return sizeMatch;
                }

                // If no size match or no target size, return first size
                return colorGroup.sizes[0];
            }
        }

        // Fallback: return first available variant
        if (product.colorGroup[0]?.sizes?.[0]) {
            console.log(`   📍 Using first variant as fallback`);
            return product.colorGroup[0].sizes[0];
        }

        return null;
    }

    /**
     * Get Modern Optical vendor ID from database
     */
    async getVendorId() {
        const { data, error } = await supabase
            .from('vendors')
            .select('id')
            .ilike('name', '%modern%optical%')
            .single();

        if (error || !data) {
            // Try by code
            const { data: data2, error: error2 } = await supabase
                .from('vendors')
                .select('id')
                .ilike('code', '%modern%')
                .single();

            if (error2 || !data2) {
                throw new Error('Could not find Modern Optical vendor in database. Please add it first.');
            }
            this.vendorId = data2.id;
        } else {
            this.vendorId = data.id;
        }

        console.log(`✅ Modern Optical vendor ID: ${this.vendorId}`);
    }

    /**
     * Get search terms for crawling the entire catalog
     * Uses "Alphabet Soup" approach - searching every letter and digit
     */
    getAllSearchTerms() {
        const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
        const digits = '0123456789'.split('');
        return [...letters, ...digits];
    }

    /**
     * Make API request to Modern Optical with retry logic
     */
    async makeApiRequest(params, retryCount = 0) {
        try {
            const response = await axios.post(
                this.config.apiUrl,
                {
                    "Collections": params.collections || [],
                    "Colors": [],
                    "ColorFamily": [],
                    "Statuses": [],
                    "Sizes": [],
                    "EyeSizes": [],
                    "TempleSizes": [],
                    "BridgeSizes": [],
                    "Shapes": [],
                    "FrameTypes": [],
                    "Genders": [],
                    "FrameMaterials": [],
                    "HingeTypes": [],
                    "RimTypes": [],
                    "BridgeTypes": [],
                    "PriceGroup": [],
                    "NewStyles": false,
                    "BestSellers": false,
                    "ASizes": { "min": -1, "max": -1 },
                    "BSizes": { "min": -1, "max": -1 },
                    "EDSizes": { "min": -1, "max": -1 },
                    "DBLSizes": { "min": -1, "max": -1 },
                    "brandName": params.brandName || "",
                    "search": params.search || ""
                },
                {
                    headers: this.config.headers,
                    timeout: this.config.timeout
                }
            );

            return response.data;

        } catch (error) {
            if (retryCount < this.config.maxRetries) {
                console.log(`   ⚠️  Request failed, retrying (${retryCount + 1}/${this.config.maxRetries})...`);
                await this.sleep(this.config.retryDelay * (retryCount + 1));
                return this.makeApiRequest(params, retryCount + 1);
            }

            throw error;
        }
    }

    /**
     * Process all products and save to database
     */
    async processAllProducts(products) {
        console.log(`\n📝 Processing ${products.length} products...`);

        for (let i = 0; i < products.length; i += this.config.batchSize) {
            const batch = products.slice(i, i + this.config.batchSize);
            const batchNum = Math.floor(i / this.config.batchSize) + 1;
            const totalBatches = Math.ceil(products.length / this.config.batchSize);

            console.log(`\n📦 Processing batch ${batchNum}/${totalBatches}`);

            for (const product of batch) {
                try {
                    const brand = product.collectionName || 'Modern Optical';
                    await this.processProduct(product, brand);
                } catch (error) {
                    console.error(`   ❌ Error processing product:`, error.message);
                    this.stats.totalErrors++;
                }
            }

            console.log(`   ✅ Batch ${batchNum} complete (${Math.min(i + this.config.batchSize, products.length)} / ${products.length})`);

            if (i + this.config.batchSize < products.length) {
                await this.sleep(500);
            }
        }
    }

    /**
     * Process a single product with all its color/size variants
     */
    async processProduct(product, brand) {
        // Each product can have multiple color groups and sizes
        if (!product.colorGroup || product.colorGroup.length === 0) {
            return;
        }

        for (const colorGroup of product.colorGroup) {
            if (!colorGroup.sizes || colorGroup.sizes.length === 0) {
                continue;
            }

            for (const size of colorGroup.sizes) {
                await this.cacheProductVariant(product, brand, colorGroup, size);
                this.stats.totalProcessed++;
            }
        }
    }

    /**
     * Cache a single product variant to vendor_catalog
     */
    async cacheProductVariant(product, brand, colorGroup, size) {
        // Build catalog entry from Modern Optical API response
        const catalogEntry = {
            vendor_id: this.vendorId,
            vendor_name: 'Modern Optical',
            brand: brand,
            model: product.styleCode || product.styleName || product.model,
            color: colorGroup.color || colorGroup.colorName,
            color_code: size.colorCode || colorGroup.color,
            sku: size.sku || `${product.styleCode}-${colorGroup.color}-${size.eyeSize}`,
            upc: size.upc || null,
            ean: size.ean || size.frameId || null,
            wholesale_cost: parseFloat(size.wholesale) || parseFloat(size.price) || null,
            msrp: size.msrp ? parseFloat(size.msrp) : null,
            map_price: null,
            eye_size: size.eyeSize || size.a || null,
            bridge: size.bridge || size.dbl || null,
            temple_length: size.temple || null,
            full_size: size.size || size.alternateFrameSize || null,
            material: size.material || product.material || null,
            gender: size.gender || product.gender || null,
            fit_type: product.fitting || product.fitType || null,
            a_measurement: size.a || size.eyeSize || null,
            b_measurement: size.b || null,
            dbl: size.dbl || size.bridge || null,
            ed: size.ed || null,
            in_stock: size.isInStock || size.availableStatus === 'in stock',
            availability_status: size.availableStatus || size.availability || null,
            confidence_score: 95,
            data_source: 'api',
            verified: true,
            metadata: {
                crawled_at: new Date().toISOString(),
                product_data: {
                    styleCode: product.styleCode,
                    styleName: product.styleName,
                    colorCode: colorGroup.color,
                    colorName: colorGroup.colorName,
                    size: size.size,
                    frameId: size.frameId,
                    hingeType: size.hingeType,
                    shape: size.shape,
                    description: size.description
                }
            }
        };

        // Upsert to database
        const { data, error } = await supabase
            .from('vendor_catalog')
            .upsert(catalogEntry, {
                onConflict: 'vendor_id,model,color,eye_size',
                ignoreDuplicates: false
            })
            .select();

        if (error) {
            throw error;
        }

        if (data && data.length > 0) {
            this.stats.totalCached++;
        } else {
            this.stats.totalUpdated++;
        }
    }

    /**
     * Sleep utility
     */
    async sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Print summary statistics
     */
    printSummary() {
        const duration = (this.stats.endTime - this.stats.startTime) / 1000;

        console.log('\n' + '='.repeat(60));
        console.log('📊 MODERN OPTICAL CATALOG CRAWL SUMMARY');
        console.log('='.repeat(60));
        console.log(`⏱️  Duration: ${duration.toFixed(2)} seconds`);
        console.log(`📦 Products Processed: ${this.stats.totalProcessed}`);
        console.log(`✅ New Products Cached: ${this.stats.totalCached}`);
        console.log(`🔄 Existing Products Updated: ${this.stats.totalUpdated}`);
        console.log(`❌ Errors: ${this.stats.totalErrors}`);
        console.log(`🎯 Success Rate: ${((this.stats.totalProcessed / (this.stats.totalProcessed + this.stats.totalErrors)) * 100).toFixed(2)}%`);
        console.log('='.repeat(60) + '\n');
    }
}

module.exports = ModernOpticalCatalogCrawler;

// CLI usage: node backend/services/ModernOpticalCatalogCrawler.js
if (require.main === module) {
    (async () => {
        const crawler = new ModernOpticalCatalogCrawler();
        try {
            await crawler.crawlFullCatalog();
            console.log('✅ Catalog crawl completed successfully!');
            process.exit(0);
        } catch (error) {
            console.error('❌ Catalog crawl failed:', error);
            process.exit(1);
        }
    })();
}

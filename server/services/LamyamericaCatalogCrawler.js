// Load environment variables first
require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });

const axios = require('axios');
const { supabase } = require('../lib/supabase');

/**
 * L'AMYAMERICA FULL CATALOG CRAWLER (NO AUTH REQUIRED)
 *
 * This service crawls the ENTIRE L'amyamerica catalog using their public search API
 * and populates the vendor_catalog table.
 *
 * NO AUTHENTICATION REQUIRED! Uses the "Alphabet Soup" technique to capture
 * ALL products across ALL brands without needing a Lamyamerica account.
 *
 * How it works - "Alphabet Soup" Approach:
 * - Searches for every single letter (A-Z) and digit (0-9) = 36 API calls
 * - Each search returns products containing that character
 * - Automatically deduplicates products found in multiple searches
 * - Brand name is extracted from API response (collectionName field)
 * - Stores all product variants in the vendor_catalog table
 *
 * Why this works:
 * - The search API does substring matching on model names
 * - Every product model contains at least one letter or digit
 * - This guarantees we find every product in their catalog!
 *
 * Performance:
 * - 36 API calls total (one per character)
 * - ~1 second delay between calls = ~40 seconds for search phase
 * - Then processes and stores all unique products to database
 *
 * Use this to build a complete database of L'amyamerica frames for:
 * - Vendor comparison features
 * - Fast lookups (no need to scrape every order)
 * - Price tracking over time
 *
 * Usage:
 *   const crawler = new LamyamericaCatalogCrawler();
 *   await crawler.crawlFullCatalog();
 */
class LamyamericaCatalogCrawler {
    constructor(options = {}) {
        this.config = {
            apiUrl: 'https://www.lamyamerica.com/US/api/CatalogAPI/filter',
            timeout: options.timeout || 30000,
            maxRetries: options.maxRetries || 3,
            retryDelay: options.retryDelay || 2000,
            batchSize: options.batchSize || 50,
            rateLimitDelay: options.rateLimitDelay || 1000, // 1 second between requests
            cookies: options.cookies || '', // Session cookies for authentication
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
        };

        // Add cookies to headers if provided
        if (this.config.cookies) {
            this.config.headers['Cookie'] = this.config.cookies;
        }

        this.stats = {
            totalProcessed: 0,
            totalCached: 0,
            totalUpdated: 0,
            totalErrors: 0,
            startTime: null,
            endTime: null
        };

        this.vendorId = null;
        console.log('🕷️  LamyamericaCatalogCrawler initialized');
    }

    /**
     * Main entry point - crawl entire L'amyamerica catalog
     */
    async crawlFullCatalog() {
        console.log('🚀 Starting full L\'amyamerica catalog crawl...');
        this.stats.startTime = Date.now();

        try {
            // 1. Get L'amyamerica vendor ID from database
            await this.getVendorId();

            // 2. Get all search terms (A-Z, 0-9)
            const searchTerms = await this.getAllSearchTerms();
            console.log(`📦 Using "Alphabet Soup" approach: ${searchTerms.length} search terms (A-Z, 0-9)`);

            // 3. Crawl using alphabet soup approach
            const allProducts = new Map(); // Deduplicate across all searches
            let searchCount = 0;

            for (const searchTerm of searchTerms) {
                searchCount++;
                console.log(`\n[${searchCount}/${searchTerms.length}] Searching: "${searchTerm}"`);

                try {
                    const response = await this.makeApiRequest(searchTerm);

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
     * Get L'amyamerica vendor ID from database
     */
    async getVendorId() {
        const { data, error } = await supabase
            .from('vendors')
            .select('id')
            .eq('code', 'lamyamerica')
            .single();

        if (error || !data) {
            throw new Error('Could not find L\'amyamerica vendor in database. Please add it first.');
        }

        this.vendorId = data.id;
        console.log(`✅ L'amyamerica vendor ID: ${this.vendorId}`);
    }

    /**
     * Get search terms for crawling the entire catalog
     * Uses "Alphabet Soup" approach - searching every letter and digit
     * This captures ALL products regardless of brand!
     *
     * Returns array of search characters (A-Z, 0-9)
     */
    async getAllSearchTerms() {
        // Generate A-Z and 0-9
        const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
        const digits = '0123456789'.split('');

        return [...letters, ...digits];
    }

    /**
     * Process all products and save to database
     */
    async processAllProducts(products) {
        console.log(`\n📝 Processing ${products.length} products...`);

        // Process in batches to avoid overwhelming the database
        for (let i = 0; i < products.length; i += this.config.batchSize) {
            const batch = products.slice(i, i + this.config.batchSize);
            const batchNum = Math.floor(i / this.config.batchSize) + 1;
            const totalBatches = Math.ceil(products.length / this.config.batchSize);

            console.log(`\n📦 Processing batch ${batchNum}/${totalBatches}`);

            // Process each product in the batch
            for (const product of batch) {
                try {
                    // Brand name comes from API response
                    const brand = product.collectionName || 'UNKNOWN';
                    await this.processBatch([product], brand);
                } catch (error) {
                    console.error(`   ❌ Error processing product:`, error.message);
                    this.stats.totalErrors++;
                }
            }

            console.log(`   ✅ Batch ${batchNum} complete (${Math.min(i + this.config.batchSize, products.length)} / ${products.length})`);

            // Small delay between batches
            if (i + this.config.batchSize < products.length) {
                await this.sleep(500);
            }
        }
    }

    /**
     * Make API request to L'amyamerica with retry logic
     * Uses search field (no authentication required)
     */
    async makeApiRequest(searchQuery, retryCount = 0) {
        try {
            const response = await axios.post(
                this.config.apiUrl,
                {
                    "Collections": [],
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
                    "AgeGroup": [],
                    "Brand": [], // Empty - using search instead
                    "SpecialtyFit": [],
                    "Clip-Ons": false,
                    "NewStyles": false,
                    "InStock": false,
                    "Sunglasses": false,
                    "ASizes": {"min": -1, "max": -1},
                    "BSizes": {"min": -1, "max": -1},
                    "EDSizes": {"min": -1, "max": -1},
                    "DBLSizes": {"min": -1, "max": -1},
                    "search": searchQuery // Use search field (works without auth)
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
                return this.makeApiRequest(searchQuery, retryCount + 1);
            }

            throw error;
        }
    }

    /**
     * Process a batch of products and save to vendor_catalog
     */
    async processBatch(products, brand) {
        for (const product of products) {
            try {
                // Each product can have multiple color groups and sizes
                // We need to flatten these into individual catalog entries
                if (!product.colorGroup || product.colorGroup.length === 0) {
                    continue;
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
            } catch (error) {
                console.error(`   ❌ Error caching product ${product.styleCode || product.model || product.modelCode}:`, error.message);
                this.stats.totalErrors++;
            }
        }
    }

    /**
     * Cache a single product variant to vendor_catalog
     */
    async cacheProductVariant(product, brand, colorGroup, size) {
        // Build catalog entry from L'amyamerica API response
        const catalogEntry = {
            vendor_id: this.vendorId,
            vendor_name: 'L\'amyamerica',
            brand: brand,
            model: product.styleCode || product.model || product.modelCode,
            color: colorGroup.colorName || colorGroup.color,
            color_code: colorGroup.color,
            sku: size.sku || `${product.model}-${colorGroup.color}-${size.size}`,
            upc: size.upc,
            ean: size.ean || size.frameId,
            wholesale_cost: parseFloat(size.wholesale) || parseFloat(size.price) || null,
            msrp: parseFloat(size.msrp) || null,
            map_price: null, // Not in response
            eye_size: size.eyeSize || size.a,
            bridge: size.bridge || size.dbl,
            temple_length: size.temple,
            full_size: size.size || size.alternateFrameSize,
            material: product.material || product.frontMaterial,
            gender: product.gender,
            fit_type: product.fitting || product.fitType,
            a_measurement: size.a || size.eyeSize,
            b_measurement: size.b,
            dbl: size.dbl || size.bridge,
            ed: size.ed,
            in_stock: size.isInStock || false,
            availability_status: size.availableStatus || size.availability,
            confidence_score: 95, // High confidence from API
            data_source: 'api',
            verified: true,
            metadata: {
                crawled_at: new Date().toISOString(),
                product_data: {
                    styleCode: product.styleCode,
                    model: product.model,
                    colorCode: colorGroup.color,
                    colorName: colorGroup.colorName,
                    size: size.size
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

        // Check if new or updated
        if (data && data.length > 0) {
            if (data[0].times_ordered === 1) {
                this.stats.totalCached++;
            } else {
                this.stats.totalUpdated++;
            }
        }
    }

    /**
     * Extract size component from size string
     */
    extractSize(sizeString, index) {
        if (!sizeString) return null;

        const parts = sizeString.split(/[-\s/]/);
        return parts[index] || null;
    }

    /**
     * Format full size string
     */
    formatFullSize(product) {
        const eye = product.eyeSize;
        const bridge = product.bridge;
        const temple = product.templeLength;

        if (eye && bridge && temple) {
            return `${eye}-${bridge}-${temple}`;
        }

        return product.size || null;
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
        console.log('📊 L\'AMYAMERICA CATALOG CRAWL SUMMARY');
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

module.exports = LamyamericaCatalogCrawler;

// CLI usage: node server/services/LamyamericaCatalogCrawler.js
if (require.main === module) {
    (async () => {
        const crawler = new LamyamericaCatalogCrawler();
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

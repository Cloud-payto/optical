// Load environment variables first
require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });

const axios = require('axios');
const { supabase } = require('../lib/supabase');

/**
 * KENMARK FULL CATALOG CRAWLER (NO AUTH REQUIRED)
 *
 * This service crawls the ENTIRE Kenmark catalog using their public search API
 * and populates the vendor_catalog table.
 *
 * Kenmark uses the same jiecosystem backend as Safilo, so we use the same
 * "Alphabet Soup" technique to capture ALL products.
 *
 * How it works - "Alphabet Soup" Approach:
 * - Searches for every single letter (A-Z) and digit (0-9) = 36 API calls
 * - Each search returns products containing that character
 * - Automatically deduplicates products found in multiple searches
 * - Brand name is extracted from API response (collectionName field)
 * - Stores all product variants in the vendor_catalog table
 *
 * Usage:
 *   const crawler = new KenmarkCatalogCrawler();
 *   await crawler.crawlFullCatalog();
 */
class KenmarkCatalogCrawler {
    constructor(options = {}) {
        this.config = {
            apiUrl: 'https://www.kenmarkeyewear.com/US/api/CatalogAPI/filter',
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
        console.log('🕷️  KenmarkCatalogCrawler initialized');
    }

    /**
     * Main entry point - crawl entire Kenmark catalog
     */
    async crawlFullCatalog() {
        console.log('🚀 Starting full Kenmark catalog crawl...');
        this.stats.startTime = Date.now();

        try {
            // 1. Get Kenmark vendor ID from database
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
     * Get Kenmark vendor ID from database
     */
    async getVendorId() {
        const { data, error } = await supabase
            .from('vendors')
            .select('id')
            .ilike('name', '%kenmark%')
            .single();

        if (error || !data) {
            // Try by code
            const { data: data2, error: error2 } = await supabase
                .from('vendors')
                .select('id')
                .ilike('code', '%kenmark%')
                .single();

            if (error2 || !data2) {
                throw new Error('Could not find Kenmark vendor in database. Please add it first.');
            }
            this.vendorId = data2.id;
        } else {
            this.vendorId = data.id;
        }

        console.log(`✅ Kenmark vendor ID: ${this.vendorId}`);
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
     * Make API request to Kenmark with retry logic
     */
    async makeApiRequest(searchQuery, retryCount = 0) {
        try {
            const response = await axios.post(
                this.config.apiUrl,
                {
                    "Collections": [],
                    "Colors": [],
                    "ColorFamily": [],
                    "Statuses": [],
                    "EyeSizes": [],
                    "TempleSizes": [],
                    "BridgeSizes": [],
                    "Shapes": [],
                    "FrameTypes": [],
                    "Genders": [],
                    "FrameMaterials": [],
                    "FrontMaterials": [],
                    "HingeTypes": [],
                    "RimTypes": [],
                    "BridgeTypes": [],
                    "TempleMaterials": [],
                    "LensMaterials": [],
                    "Segment": [],
                    "MadeIn": [],
                    "NewStyles": false,
                    "RxAvailable": false,
                    "Polarized": false,
                    "Sunglasses": false,
                    "ASizes": {"min": -1, "max": -1},
                    "BSizes": {"min": -1, "max": -1},
                    "EDSizes": {"min": -1, "max": -1},
                    "DBLSizes": {"min": -1, "max": -1},
                    "search": searchQuery
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
                    const brand = product.collectionName || 'Kenmark';
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
        // Build catalog entry from Kenmark API response
        const catalogEntry = {
            vendor_id: this.vendorId,
            vendor_name: 'Kenmark',
            brand: brand,
            model: product.styleCode || product.model || product.modelCode,
            color: colorGroup.colorName || colorGroup.color,
            color_code: colorGroup.color,
            sku: size.sku || `${product.model || product.styleCode}-${colorGroup.color}-${size.size}`,
            upc: size.upc || null,
            ean: size.ean || size.frameId || null,
            wholesale_cost: parseFloat(size.wholesale) || parseFloat(size.price) || null,
            msrp: parseFloat(size.msrp) || null,
            map_price: null,
            eye_size: size.eyeSize || size.a || null,
            bridge: size.bridge || size.dbl || null,
            temple_length: size.temple || null,
            full_size: size.size || size.alternateFrameSize || null,
            material: product.material || product.frontMaterial || null,
            gender: product.gender || null,
            fit_type: product.fitting || product.fitType || null,
            a_measurement: size.a || size.eyeSize || null,
            b_measurement: size.b || null,
            dbl: size.dbl || size.bridge || null,
            ed: size.ed || null,
            in_stock: size.isInStock || false,
            availability_status: size.availableStatus || size.availability || null,
            confidence_score: 95,
            data_source: 'api',
            verified: true,
            metadata: {
                crawled_at: new Date().toISOString(),
                product_data: {
                    styleCode: product.styleCode,
                    model: product.model,
                    colorCode: colorGroup.color,
                    colorName: colorGroup.colorName,
                    size: size.size,
                    frameId: size.frameId
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
        console.log('📊 KENMARK CATALOG CRAWL SUMMARY');
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

module.exports = KenmarkCatalogCrawler;

// CLI usage: node backend/services/KenmarkCatalogCrawler.js
if (require.main === module) {
    (async () => {
        const crawler = new KenmarkCatalogCrawler();
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

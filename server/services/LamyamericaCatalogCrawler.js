const axios = require('axios');
const { supabase } = require('../lib/supabase');

/**
 * L'AMYAMERICA FULL CATALOG CRAWLER
 *
 * This service crawls the entire L'amyamerica catalog using their API
 * (same API structure as Safilo - https://www.lamyamerica.com/US/api/CatalogAPI/filter)
 * and populates the vendor_catalog table.
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

            // 2. Get all L'amyamerica brands
            const brands = await this.getAllBrands();
            console.log(`📦 Found ${brands.length} L'amyamerica brands to crawl`);

            // 3. Crawl each brand
            for (const brand of brands) {
                console.log(`\n🏷️  Crawling brand: ${brand}`);
                await this.crawlBrand(brand);

                // Rate limiting - be nice to the API
                await this.sleep(this.config.rateLimitDelay);
            }

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
     * Get all L'amyamerica brands
     * These are the brands distributed by L'amy Group
     */
    async getAllBrands() {
        return [
            'L\'AMY',
            'LAMY',
            'MODO',
            'ECO',
            'SUNS',
            'O\'NEILL',
            'ISTYLE',
            'LIGHTEC',
            'STEPPER',
            'CATHERINE DENEUVE',
            'FABIANO',
            'VIVA',
            'WOODYS',
            'VANNI',
            'YALEA',
            'VISION\'S',
            'FACE A FACE'
        ];
    }

    /**
     * Crawl all frames for a specific brand
     */
    async crawlBrand(brand) {
        try {
            // Make API request for this brand
            const response = await this.makeApiRequest({
                brand: brand,
                pageSize: 1000, // Get as many as possible per request
                pageNumber: 1
            });

            if (!response || !response.products) {
                console.log(`⚠️  No products found for ${brand}`);
                return;
            }

            const products = response.products;
            console.log(`   Found ${products.length} products for ${brand}`);

            // Process in batches to avoid overwhelming the database
            for (let i = 0; i < products.length; i += this.config.batchSize) {
                const batch = products.slice(i, i + this.config.batchSize);
                await this.processBatch(batch, brand);

                console.log(`   Processed ${Math.min(i + this.config.batchSize, products.length)} / ${products.length}`);
            }

        } catch (error) {
            console.error(`❌ Error crawling ${brand}:`, error.message);
            this.stats.totalErrors++;
        }
    }

    /**
     * Make API request to L'amyamerica with retry logic
     */
    async makeApiRequest(params, retryCount = 0) {
        try {
            const response = await axios.post(
                this.config.apiUrl,
                params,
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
     * Process a batch of products and save to vendor_catalog
     */
    async processBatch(products, brand) {
        for (const product of products) {
            try {
                await this.cacheProduct(product, brand);
                this.stats.totalProcessed++;
            } catch (error) {
                console.error(`   ❌ Error caching product ${product.modelCode}:`, error.message);
                this.stats.totalErrors++;
            }
        }
    }

    /**
     * Cache a single product to vendor_catalog
     */
    async cacheProduct(product, brand) {
        // Build catalog entry from L'amyamerica API response
        const catalogEntry = {
            vendor_id: this.vendorId,
            vendor_name: 'L\'amyamerica',
            brand: brand,
            model: product.modelCode || product.model,
            color: product.colorDescription,
            color_code: product.colorCode,
            sku: product.sku || `${product.modelCode}-${product.colorCode}`,
            upc: product.upc,
            ean: product.ean,
            wholesale_cost: product.wholesalePrice || product.price,
            msrp: product.msrp || product.retailPrice,
            map_price: product.mapPrice,
            eye_size: product.eyeSize || this.extractSize(product.size, 0),
            bridge: product.bridge || this.extractSize(product.size, 1),
            temple_length: product.templeLength || this.extractSize(product.size, 2),
            full_size: product.size || this.formatFullSize(product),
            material: product.material,
            gender: product.gender,
            fit_type: product.fitType,
            a_measurement: product.aMeasurement,
            b_measurement: product.bMeasurement,
            dbl: product.dbl,
            ed: product.ed,
            in_stock: product.inStock !== false, // Default to true if not specified
            availability_status: product.availability || (product.inStock ? 'In Stock' : 'Out of Stock'),
            confidence_score: 95, // High confidence from API
            data_source: 'api',
            verified: true,
            metadata: {
                crawled_at: new Date().toISOString(),
                api_data: product
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

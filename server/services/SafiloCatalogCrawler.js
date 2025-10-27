// Load environment variables first
require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });

const axios = require('axios');
const { supabase } = require('../lib/supabase');

/**
 * SAFILO FULL CATALOG CRAWLER
 *
 * This service crawls the entire Safilo catalog using their API
 * and populates the vendor_catalog table.
 *
 * Use this to build a complete database of Safilo frames for:
 * - Vendor comparison features
 * - Fast lookups (no need to scrape every order)
 * - Price tracking over time
 *
 * Usage:
 *   const crawler = new SafiloCatalogCrawler();
 *   await crawler.crawlFullCatalog();
 */
class SafiloCatalogCrawler {
    constructor(options = {}) {
        this.config = {
            apiUrl: 'https://www.mysafilo.com/US/api/CatalogAPI/filter',
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
        console.log('🕷️  SafiloCatalogCrawler initialized');
    }

    /**
     * Main entry point - crawl entire Safilo catalog
     */
    async crawlFullCatalog() {
        console.log('🚀 Starting full Safilo catalog crawl...');
        this.stats.startTime = Date.now();

        try {
            // 1. Get Safilo vendor ID from database
            await this.getVendorId();

            // 2. Get all Safilo brands
            const brands = await this.getAllBrands();
            console.log(`📦 Found ${brands.length} Safilo brands to crawl`);

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
     * Get Safilo vendor ID from database
     */
    async getVendorId() {
        const { data, error } = await supabase
            .from('vendors')
            .select('id')
            .eq('code', 'SAFILO')
            .single();

        if (error || !data) {
            throw new Error('Could not find Safilo vendor in database. Please add it first.');
        }

        this.vendorId = data.id;
        console.log(`✅ Safilo vendor ID: ${this.vendorId}`);
    }

    /**
     * Get all Safilo brands from their API
     */
    async getAllBrands() {
        // Safilo brand codes (based on your SafiloService.js)
        return [
            'CARRERA',
            'CH', // Carolina Herrera
            'CHL', // Chloe
            'BOSS',
            'HBOSS', // Hugo Boss
            'JIMMY CHOO',
            'JC', // Jimmy Choo
            'KATE SPADE',
            'KS', // Kate Spade
            'MARC JACOBS',
            'MJ', // Marc Jacobs
            'MAX MARA',
            'MMAW', // Max Mara
            'POLAROID',
            'PLD', // Polaroid
            'FOSSIL',
            'FOS', // Fossil
            'LEVI\'S',
            'LS', // Levi's
            'BANANA REPUBLIC',
            'BR', // Banana Republic
            'MISSONI',
            'MIS', // Missoni
            'BOTTEGA VENETA',
            'BV', // Bottega Veneta
            'MOSCHINO',
            'MOS' // Moschino
        ];
    }

    /**
     * Crawl all frames for a specific brand
     */
    async crawlBrand(brand) {
        try {
            // Make API request for this brand using search query
            const response = await this.makeApiRequest(brand);

            if (!response || !Array.isArray(response) || response.length === 0) {
                console.log(`⚠️  No products found for ${brand}`);
                return;
            }

            const products = response;
            console.log(`   Found ${products.length} product models for ${brand}`);

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
     * Make API request to Safilo with retry logic
     */
    async makeApiRequest(searchQuery, retryCount = 0) {
        try {
            const response = await axios.post(
                this.config.apiUrl,
                {
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
                console.error(`   ❌ Error caching product ${product.model || product.modelCode}:`, error.message);
                this.stats.totalErrors++;
            }
        }
    }

    /**
     * Cache a single product variant to vendor_catalog
     */
    async cacheProductVariant(product, brand, colorGroup, size) {
        // Build catalog entry from Safilo API response
        const catalogEntry = {
            vendor_id: this.vendorId,
            vendor_name: 'Safilo',
            brand: brand,
            model: product.model || product.modelCode,
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
        console.log('📊 SAFILO CATALOG CRAWL SUMMARY');
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

module.exports = SafiloCatalogCrawler;

// CLI usage: node server/services/SafiloCatalogCrawler.js
if (require.main === module) {
    (async () => {
        const crawler = new SafiloCatalogCrawler();
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

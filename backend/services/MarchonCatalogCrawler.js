// Load environment variables first
require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });

const axios = require('axios');
const fs = require('fs');
const path = require('path');
const { supabase } = require('../lib/supabase');

/**
 * MARCHON FULL CATALOG CRAWLER
 *
 * This service crawls the Marchon catalog using their API and style codes
 * from a text file, then populates the vendor_catalog table.
 *
 * REQUIRES: A text file with style codes (one per line)
 * Default location: dev/marchon-styles.txt
 *
 * How it works:
 * 1. Reads style codes from text file (provided by user from Marchon website)
 * 2. Cleans style codes (removes MAG-SET suffix, etc.)
 * 3. Queries Marchon API for each style
 * 4. Saves all variants to vendor_catalog
 * 5. Outputs list of failed styles for manual review
 *
 * Usage:
 *   node backend/services/MarchonCatalogCrawler.js                    # Full crawl
 *   node backend/services/MarchonCatalogCrawler.js --test             # Test with sample styles
 *   node backend/services/MarchonCatalogCrawler.js --file path/to/styles.txt  # Custom file
 */
class MarchonCatalogCrawler {
    constructor(options = {}) {
        this.config = {
            // Note: double slash is required for this API
            apiUrl: 'https://www.mymarchon.com//ProductCatologWebWeb/Frame/sku',
            timeout: options.timeout || 30000,
            maxRetries: options.maxRetries || 3,
            retryDelay: options.retryDelay || 2000,
            batchSize: options.batchSize || 50,
            rateLimitDelay: options.rateLimitDelay || 250, // 250ms between requests
            stylesFile: options.stylesFile || path.resolve(__dirname, '../../dev/marchon-styles.txt'),
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
        };

        this.stats = {
            totalStyles: 0,
            successfulStyles: 0,
            failedStyles: 0,
            totalVariants: 0,
            totalCached: 0,
            totalUpdated: 0,
            totalErrors: 0,
            startTime: null,
            endTime: null
        };

        this.failedStyles = []; // Track styles that couldn't be found
        this.vendorId = null;
        console.log('🕷️  MarchonCatalogCrawler initialized');
    }

    /**
     * Main entry point - crawl Marchon catalog from style list
     */
    async crawlFullCatalog() {
        console.log('🚀 Starting Marchon catalog crawl...');
        this.stats.startTime = Date.now();

        try {
            // 1. Get Marchon vendor ID from database
            await this.getVendorId();

            // 2. Read and clean style codes from file
            const styles = await this.loadStylesFromFile();
            if (styles.length === 0) {
                throw new Error('No styles found in file. Please add style codes to: ' + this.config.stylesFile);
            }

            this.stats.totalStyles = styles.length;
            console.log(`📦 Loaded ${styles.length} style codes from file`);

            // 3. Process each style
            for (let i = 0; i < styles.length; i++) {
                const style = styles[i];
                const progress = `[${i + 1}/${styles.length}]`;

                try {
                    const result = await this.processStyle(style);

                    if (result.found) {
                        console.log(`${progress} ✅ ${style} - ${result.variants} variants`);
                        this.stats.successfulStyles++;
                        this.stats.totalVariants += result.variants;
                    } else {
                        console.log(`${progress} ❌ ${style} - Not found`);
                        this.stats.failedStyles++;
                        this.failedStyles.push({ original: style, cleaned: result.cleanedStyle, reason: result.reason });
                    }
                } catch (error) {
                    console.log(`${progress} ❌ ${style} - Error: ${error.message}`);
                    this.stats.failedStyles++;
                    this.stats.totalErrors++;
                    this.failedStyles.push({ original: style, reason: error.message });
                }

                // Rate limiting
                await this.sleep(this.config.rateLimitDelay);

                // Progress update every 100 styles
                if ((i + 1) % 100 === 0) {
                    console.log(`\n📊 Progress: ${i + 1}/${styles.length} (${this.stats.successfulStyles} found, ${this.stats.failedStyles} failed)\n`);
                }
            }

            this.stats.endTime = Date.now();
            this.printSummary();
            await this.saveFailedStyles();

            return {
                success: true,
                stats: this.stats,
                failedStyles: this.failedStyles
            };

        } catch (error) {
            console.error('❌ Catalog crawl failed:', error.message);
            this.stats.endTime = Date.now();
            throw error;
        }
    }

    /**
     * Load style codes from text file
     */
    async loadStylesFromFile() {
        if (!fs.existsSync(this.config.stylesFile)) {
            console.log(`⚠️  Styles file not found: ${this.config.stylesFile}`);
            console.log('   Please create the file with one style code per line.');
            return [];
        }

        const content = fs.readFileSync(this.config.stylesFile, 'utf-8');
        const lines = content.split('\n')
            .map(line => line.trim())
            .filter(line => line.length > 0 && !line.startsWith('#')); // Skip empty lines and comments

        // Clean and deduplicate
        const cleanedStyles = [...new Set(lines.map(style => this.cleanStyleCode(style)))];

        return cleanedStyles;
    }

    /**
     * Clean style code for API lookup
     * - Remove MAG-SET suffix
     * - Remove other known suffixes
     * - Trim whitespace
     */
    cleanStyleCode(style) {
        let cleaned = style.trim().toUpperCase();

        // Remove common suffixes that don't work in API
        const suffixesToRemove = ['-MAG-SET', 'MAG-SET', '-SET'];
        for (const suffix of suffixesToRemove) {
            if (cleaned.endsWith(suffix)) {
                cleaned = cleaned.slice(0, -suffix.length);
            }
        }

        return cleaned;
    }

    /**
     * Get Marchon vendor ID from database
     */
    async getVendorId() {
        const { data, error } = await supabase
            .from('vendors')
            .select('id')
            .or('code.eq.MARCHON,code.ilike.%marchon%,name.ilike.%marchon%')
            .single();

        if (error || !data) {
            throw new Error('Could not find Marchon vendor in database. Please add it first.');
        }

        this.vendorId = data.id;
        console.log(`✅ Marchon vendor ID: ${this.vendorId}`);
    }

    /**
     * Process a single style - query API and save to database
     */
    async processStyle(originalStyle) {
        const cleanedStyle = this.cleanStyleCode(originalStyle);

        // Query API
        const apiResult = await this.makeApiRequest(cleanedStyle);

        if (!apiResult.found) {
            return {
                found: false,
                cleanedStyle,
                reason: apiResult.reason
            };
        }

        // Save all variants to database
        for (const variant of apiResult.variants) {
            try {
                await this.cacheProductVariant(apiResult, variant);
            } catch (error) {
                this.stats.totalErrors++;
            }
        }

        return {
            found: true,
            cleanedStyle,
            variants: apiResult.variants.length
        };
    }

    /**
     * Make API request to Marchon with retry logic
     */
    async makeApiRequest(styleQuery, retryCount = 0) {
        try {
            const payload = {
                style: styleQuery,
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

            const response = await axios.post(
                this.config.apiUrl,
                payload,
                {
                    headers: this.config.headers,
                    timeout: this.config.timeout
                }
            );

            return this.processApiResponse(response.data, styleQuery);

        } catch (error) {
            if (retryCount < this.config.maxRetries) {
                await this.sleep(this.config.retryDelay * (retryCount + 1));
                return this.makeApiRequest(styleQuery, retryCount + 1);
            }

            return { found: false, reason: error.message };
        }
    }

    /**
     * Process API response to extract product data
     */
    processApiResponse(data, searchQuery) {
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
            marketingGroupCode: firstSku.marketingGroupCode?.trim(),
            marketingGroupDescription: firstSku.marketingGroupDescription,
            templeMaterial: data.templeMaterial,
            styleFront: data.styleFront,
            templeLength: data.templeLength,
            lensProgram: data.lensProgram,
            variants: data.skuDetail,
            totalVariants: data.skuDetail.length
        };
    }

    /**
     * Cache a single product variant to vendor_catalog
     */
    async cacheProductVariant(product, variant) {
        const brand = product.marketingGroupDescription || 'Marchon';

        const catalogEntry = {
            vendor_id: this.vendorId,
            vendor_name: 'Marchon',
            brand: brand,
            model: variant.style || product.style,
            color: variant.colorDescription || variant.color,
            color_code: variant.color,
            sku: variant.upcNumber?.trim() || `${variant.style}-${variant.color}-${variant.SSA}`,
            upc: variant.upcNumber?.trim() || null,
            ean: null,
            wholesale_cost: parseFloat(variant.retail) || null,
            msrp: parseFloat(variant.msrp) || null,
            map_price: null,
            eye_size: variant.SSA || null,
            bridge: variant.SSDBL || null,
            temple_length: parseInt(variant.templeLength) || parseInt(product.templeLength) || null,
            full_size: variant.SSA && variant.SSDBL && variant.templeLength
                ? `${variant.SSA}-${variant.SSDBL}-${variant.templeLength}`
                : null,
            material: variant.planMaterial || null,
            gender: variant.gender || null,
            fit_type: variant.fit || null,
            a_measurement: variant.SSA || null,
            b_measurement: variant.SSB || null,
            dbl: variant.SSDBL || null,
            ed: variant.SSED || null,
            in_stock: variant.stockStatus === 'Available',
            availability_status: variant.stockStatus || null,
            confidence_score: 95,
            data_source: 'api',
            verified: true,
            metadata: {
                crawled_at: new Date().toISOString(),
                product_data: {
                    style: variant.style,
                    styleName: variant.styleName,
                    colorCode: variant.color,
                    colorDescription: variant.colorDescription,
                    familyColorCode: variant.familyColorCode,
                    familyColorDesc: variant.familyColorDesc,
                    familyColorHex: variant.familyColorHex?.trim(),
                    marketingGroupCode: product.marketingGroupCode,
                    rimType: variant.rimType,
                    caseName: variant.caseName,
                    vtoIndicator: variant.vtoIndicator,
                    consignable: variant.consignable,
                    backOrderDate: variant.backOrderDate,
                    styleDefImageURL: variant.styleDefImageURL,
                    colorImageURL: variant.colorImageURL
                }
            }
        };

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
     * Save failed styles to a file for manual review
     */
    async saveFailedStyles() {
        if (this.failedStyles.length === 0) {
            console.log('🎉 No failed styles - 100% success rate!');
            return;
        }

        const failedFile = this.config.stylesFile.replace('.txt', '-failed.txt');
        const content = [
            '# Marchon styles that could not be found in API',
            '# Please cross-reference these on the Marchon website and find the correct API style code',
            '# Format: ORIGINAL_STYLE -> CORRECT_API_STYLE (or DELETE if discontinued)',
            '#',
            '# After fixing, update marchon-styles.txt and re-run the crawler',
            '',
            ...this.failedStyles.map(f => `${f.original}  # ${f.reason || 'Not found'}`)
        ].join('\n');

        fs.writeFileSync(failedFile, content);
        console.log(`\n📝 Failed styles saved to: ${failedFile}`);
        console.log('   Please review and update the styles file with correct API codes.');
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
        console.log('📊 MARCHON CATALOG CRAWL SUMMARY');
        console.log('='.repeat(60));
        console.log(`⏱️  Duration: ${duration.toFixed(2)} seconds`);
        console.log(`📦 Total Styles in File: ${this.stats.totalStyles}`);
        console.log(`✅ Successful Styles: ${this.stats.successfulStyles}`);
        console.log(`❌ Failed Styles: ${this.stats.failedStyles}`);
        console.log(`📊 Total Variants Found: ${this.stats.totalVariants}`);
        console.log(`💾 Cached to Database: ${this.stats.totalCached}`);
        console.log(`🔄 Updated in Database: ${this.stats.totalUpdated}`);
        console.log(`⚠️  Errors: ${this.stats.totalErrors}`);
        if (this.stats.totalStyles > 0) {
            const successRate = ((this.stats.successfulStyles / this.stats.totalStyles) * 100).toFixed(1);
            console.log(`🎯 Success Rate: ${successRate}%`);
        }
        console.log('='.repeat(60) + '\n');
    }

    /**
     * Quick test crawl - test with provided styles or defaults
     */
    async testCrawl(testStyles = null) {
        console.log('🧪 Running Marchon API test crawl...\n');

        const styles = testStyles || [
            'SF2223N', 'CV5064', 'CV5086', 'NK7130', 'FL600',
            'CK19119', 'LA2918', 'DR5000'
        ];

        let found = 0;
        for (const style of styles) {
            const result = await this.makeApiRequest(style);

            if (result.found) {
                const v = result.variants[0];
                console.log(`✅ ${style} - ${result.marketingGroupDescription}`);
                console.log(`   Variants: ${result.totalVariants} | UPC: ${v.upcNumber?.trim()} | MSRP: $${v.msrp}`);
                found++;
            } else {
                console.log(`❌ ${style} - ${result.reason}`);
            }

            await this.sleep(500);
        }

        console.log(`\n📊 Test Results: ${found}/${styles.length} found (${Math.round(found/styles.length*100)}%)`);
    }
}

module.exports = MarchonCatalogCrawler;

// CLI usage
if (require.main === module) {
    const args = process.argv.slice(2);
    const isTestMode = args.includes('--test');
    const fileArgIndex = args.indexOf('--file');
    const customFile = fileArgIndex !== -1 ? args[fileArgIndex + 1] : null;

    const options = {};
    if (customFile) {
        options.stylesFile = path.resolve(customFile);
    }

    const crawler = new MarchonCatalogCrawler(options);

    (async () => {
        try {
            if (isTestMode) {
                await crawler.testCrawl();
            } else {
                await crawler.crawlFullCatalog();
            }
            console.log('✅ Crawl completed!');
            process.exit(0);
        } catch (error) {
            console.error('❌ Crawl failed:', error);
            process.exit(1);
        }
    })();
}

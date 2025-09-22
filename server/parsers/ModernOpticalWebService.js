const axios = require('axios');
const cheerio = require('cheerio');

/**
 * Modern Optical Web Scraping Service
 * Complete service for scraping product data from modernoptical.com
 */
class ModernOpticalWebService {
    constructor(options = {}) {
        this.baseUrl = 'https://www.modernoptical.com';
        this.timeout = options.timeout || 15000;
        this.maxRetries = options.maxRetries || 3;
        this.retryDelay = options.retryDelay || 1000;
        this.userAgent = options.userAgent || 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
        
        // Cookie jar for session management
        this.cookies = new Map();
        
        // Color mapping for normalization - expanded based on email patterns
        this.colorMap = new Map([
            // Basic colors
            ['BLK', 'Black'], ['BLACK', 'Black'],
            ['GM', 'Gunmetal'], ['GUN', 'Gunmetal'], ['GUNMETAL', 'Gunmetal'],
            ['SIL', 'Silver'], ['SILVER', 'Silver'],
            ['GLD', 'Gold'], ['GOLD', 'Gold'],
            ['BR', 'Brown'], ['BROWN', 'Brown'],
            ['BL', 'Blue'], ['BLUE', 'Blue'],
            ['GR', 'Gray'], ['GRAY', 'Gray'], ['GREY', 'Grey'],
            ['GN', 'Green'], ['GREEN', 'Green'],
            ['RD', 'Red'], ['RED', 'Red'],
            ['WH', 'White'], ['WHITE', 'White'],
            ['CL', 'Clear'], ['CLEAR', 'Clear'],
            ['TORT', 'Tortoise'], ['TORTOISE', 'Tortoise'],
            ['DEMI', 'Demi'],
            
            // Additional colors from emails
            ['NAVY', 'Navy'], ['NVY', 'Navy'],
            ['AQUA', 'Aqua'],
            ['TEAL', 'Teal'],
            ['PINK', 'Pink'], ['PK', 'Pink'],
            ['RUST', 'Rust'],
            ['BURG', 'Burgundy'], ['BURGUNDY', 'Burgundy'],
            ['FADE', 'Fade'],
            ['CRY', 'Crystal'], ['CRYST', 'Crystal'], ['CRYSTAL', 'Crystal'],
            
            // Special patterns
            ['CLEO', 'Cleo']
        ]);
        
        console.log('🌐 ModernOpticalWebService initialized');
    }
    
    /**
     * Main entry point - scrape product data
     * @param {string} brand - Product brand (e.g., "B.M.E.C.")
     * @param {string} model - Product model (e.g., "BIG RIVER")
     * @returns {Promise<Object>} Complete product data
     */
    async scrapeProduct(brand, model) {
        console.log(`🔍 Starting scrape for: ${brand} - ${model}`);
        
        try {
            // 1. Build URL variations
            const urls = this.buildProductUrls(brand, model);
            console.log(`📋 Trying ${urls.length} URL variations`);
            
            // 2. Fetch page with retry logic
            let html = null;
            let successUrl = null;
            
            for (const url of urls) {
                console.log(`🌐 Attempting: ${url}`);
                const fetchResult = await this.fetchPageWithRetry(url);
                
                if (fetchResult && fetchResult.html && !this.isPageNotFound(fetchResult.html)) {
                    successUrl = url;
                    html = fetchResult.html;
                    console.log(`✅ Success with URL: ${url}`);
                    console.log(`   📊 Response: ${fetchResult.statusCode} ${fetchResult.statusText}`);
                    console.log(`   📄 Content length: ${fetchResult.html.length} characters`);
                    break;
                } else if (fetchResult) {
                    console.log(`❌ Failed for: ${url}`);
                    console.log(`   📊 Response: ${fetchResult.statusCode || 'No response'} ${fetchResult.statusText || ''}`);
                    console.log(`   📄 Content length: ${fetchResult.html?.length || 0} characters`);
                    if (fetchResult.html && this.isPageNotFound(fetchResult.html)) {
                        console.log(`   🚫 Detected 404/Not Found page`);
                    }
                } else {
                    console.log(`❌ No response for: ${url}`);
                }
            }
            
            if (!html) {
                throw new Error(`No valid page found for ${brand} - ${model}`);
            }
            
            // 3. Parse HTML
            const productData = await this.parseProductPage(html, successUrl);
            
            // 4. Format data to match expected structure
            const formattedData = {
                found: true,
                url: successUrl,
                brand: brand,
                model: model,
                priceGroup: productData.productInfo?.priceGroup || '',
                gender: productData.attributes?.gender?.toLowerCase() || '',
                material: productData.attributes?.material || '',
                hinge: productData.productInfo?.hingeType || '',
                newRelease: productData.attributes?.newRelease || false,
                variants: productData.variants?.map(variant => ({
                    colorCode: variant.color,
                    colorName: variant.colorNormalized,
                    upc: variant.upc,
                    eyeSize: variant.eye,
                    bridge: variant.bridge,
                    temple: variant.temple,
                    a: variant.a,
                    b: variant.b,
                    dbl: variant.dbl,
                    ed: variant.ed,
                    inStock: !productData.stockStatus?.outOfStock,
                    preOrder: productData.stockStatus?.preOrder || false
                })) || [],
                authStatus: {
                    isLoggedIn: productData.authStatus?.loggedIn || false,
                    hasPricing: productData.authStatus?.hasPricing || false,
                    message: productData.authStatus?.message || 'Authentication status unknown'
                }
            };
            
            console.log(`✅ Successfully scraped ${brand} - ${model}`);
            console.log(`📊 Found ${formattedData.variants?.length || 0} variants`);
            
            return formattedData;
            
        } catch (error) {
            console.error(`❌ Error scraping ${brand} - ${model}:`, error.message);
            return {
                found: false,
                url: null,
                brand: brand,
                model: model,
                priceGroup: '',
                gender: '',
                material: '',
                hinge: '',
                newRelease: false,
                variants: [],
                authStatus: {
                    isLoggedIn: false,
                    hasPricing: false,
                    message: `Scraping failed: ${error.message}`
                }
            };
        }
    }
    
    /**
     * Build all possible product URL variations
     * @param {string} brand 
     * @param {string} model 
     * @returns {Array<string>} Array of URLs to try
     */
    buildProductUrls(brand, model) {
        const urls = [];
        
        // Brand variations based on successful pattern
        const brandVariations = [
            brand.replace(/[.\s]/g, ''),     // "B.M.E.C." → "BMEC" (PRIORITY - this worked!)
            this.normalizeForUrl(brand),     // Standard normalization
            brand.toUpperCase(),             // All caps
            brand                            // Original
        ];
        
        // Model variations: spaces to hyphens, underscores, or removed
        const modelVariations = [
            model.replace(/\s+/g, '-'),      // "BIG RIVER" → "BIG-RIVER" (PRIORITY - this worked!)
            model.replace(/\s+/g, '_'),      // "BIG RIVER" → "BIG_RIVER"  
            model.replace(/\s+/g, ''),       // "BIG RIVER" → "BIGRIVER"
            model.toLowerCase().replace(/\s+/g, '-'), // "big-river"
            model,                           // Original with spaces
            model.toUpperCase()              // All caps
        ];
        
        // Remove duplicates
        const uniqueBrands = [...new Set(brandVariations)];
        const uniqueModels = [...new Set(modelVariations)];
        
        // Build URLs - prioritize the successful pattern first
        uniqueBrands.forEach(brandVar => {
            uniqueModels.forEach(modelVar => {
                const modelClean = this.normalizeForUrl(modelVar);
                urls.push(`${this.baseUrl}/Detail/${brandVar}/${modelClean}`);
            });
        });
        
        return urls;
    }
    
    /**
     * Normalize text for URL usage
     * @param {string} text 
     * @returns {string}
     */
    normalizeForUrl(text) {
        return text
            .replace(/[^a-zA-Z0-9\s\-_.]/g, '') // Remove special chars except spaces, hyphens, underscores, periods
            .replace(/\s+/g, '-')               // Spaces to hyphens
            .replace(/--+/g, '-')               // Multiple hyphens to single
            .replace(/^-+|-+$/g, '');           // Remove leading/trailing hyphens
    }
    
    /**
     * Fetch page with retry logic and proper headers
     * @param {string} url 
     * @returns {Promise<Object>} Object with html, statusCode, statusText
     */
    async fetchPageWithRetry(url) {
        for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
            try {
                console.log(`🔄 Attempt ${attempt}/${this.maxRetries} for: ${url}`);
                
                const headers = {
                    'User-Agent': this.userAgent,
                    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
                    'Accept-Language': 'en-US,en;q=0.5',
                    'Accept-Encoding': 'gzip, deflate, br',
                    'Connection': 'keep-alive',
                    'Upgrade-Insecure-Requests': '1'
                };
                
                // Add cookies if we have them
                if (this.cookies.size > 0) {
                    const cookieString = Array.from(this.cookies.entries())
                        .map(([key, value]) => `${key}=${value}`)
                        .join('; ');
                    headers['Cookie'] = cookieString;
                }
                
                const response = await axios({
                    method: 'GET',
                    url: url,
                    headers: headers,
                    timeout: this.timeout,
                    validateStatus: function (status) {
                        return status < 500; // Accept anything less than 500 as we'll handle 404s
                    }
                });
                
                // Update cookies from response
                this.updateCookies(response.headers['set-cookie']);
                
                const html = response.data;
                const result = {
                    html: html,
                    statusCode: response.status,
                    statusText: response.statusText,
                    url: url,
                    attempt: attempt
                };
                
                console.log(`   📡 HTTP ${response.status} ${response.statusText} (${html?.length || 0} chars)`);
                
                if (response.status >= 400) {
                    console.log(`   ⚠️  HTTP error but continuing to check content...`);
                }
                
                if (!html || html.length < 1000) {
                    console.log(`   ⚠️  Response too short (${html?.length || 0} chars), retrying...`);
                    throw new Error(`Response too short or empty (${html?.length || 0} characters)`);
                }
                
                return result;
                
            } catch (error) {
                console.log(`   ⚠️  Attempt ${attempt} failed: ${error.message}`);
                
                if (error.response) {
                    console.log(`   📡 HTTP ${error.response.status} ${error.response.statusText}`);
                }
                
                if (attempt === this.maxRetries) {
                    console.log(`   💀 All ${this.maxRetries} attempts failed for: ${url}`);
                    return null;
                }
                
                // Wait before retry
                console.log(`   ⏱️  Waiting ${this.retryDelay * attempt}ms before retry...`);
                await this.sleep(this.retryDelay * attempt);
            }
        }
        
        return null;
    }
    
    /**
     * Check if page is a 404/not found
     * @param {string} html 
     * @returns {boolean}
     */
    isPageNotFound(html) {
        if (!html || html.length < 100) {
            console.log(`   🔍 Page check: Too short (${html?.length || 0} chars) - considering as not found`);
            return true;
        }
        
        // More specific 404 indicators - avoid false positives
        const strongIndicators = [
            'Page Not Found',
            'Error 404',
            'HTTP 404',
            'The resource you are looking for has been removed',
            'Server Error in',
            'does not exist'
        ];
        
        const lowerHtml = html.toLowerCase();
        
        // Check for strong 404 indicators first
        for (const indicator of strongIndicators) {
            if (lowerHtml.includes(indicator.toLowerCase())) {
                console.log(`   🔍 Page check: Found STRONG "${indicator}" indicator - page not found`);
                return true;
            }
        }
        
        // Check if it's a Modern Optical product page by looking for specific elements
        const modernOpticalProductElements = [
            'product-data-table',
            'gallery_09',
            'lnkCollection',
            'MainContentArea',
            'label-custom-green'
        ];
        
        const hasModernOpticalElements = modernOpticalProductElements.some(element => 
            html.includes(element)
        );
        
        if (hasModernOpticalElements) {
            console.log(`   🔍 Page check: Found Modern Optical product elements - valid page`);
            return false;
        }
        
        // Only check for weak "404" indicator if no product elements found
        if (lowerHtml.includes('404') && !hasModernOpticalElements) {
            // Look for context around "404" to see if it's really an error
            const context404 = this.getContextAroundText(html, '404', 50);
            console.log(`   🔍 Page check: Found "404" in context: "${context404}"`);
            
            // If "404" appears in error context, it's probably a real 404
            if (context404.toLowerCase().includes('error') || 
                context404.toLowerCase().includes('not found') ||
                context404.toLowerCase().includes('page')) {
                console.log(`   🔍 Page check: "404" appears in error context - page not found`);
                return true;
            } else {
                console.log(`   🔍 Page check: "404" found but not in error context - might be valid page`);
            }
        }
        
        console.log(`   🔍 Page check: No clear 404 indicators, treating as valid (${html.length} chars)`);
        return false;
    }
    
    /**
     * Get text context around a search term
     * @param {string} text 
     * @param {string} searchTerm 
     * @param {number} contextLength 
     * @returns {string}
     */
    getContextAroundText(text, searchTerm, contextLength = 50) {
        const index = text.toLowerCase().indexOf(searchTerm.toLowerCase());
        if (index === -1) return '';
        
        const start = Math.max(0, index - contextLength);
        const end = Math.min(text.length, index + searchTerm.length + contextLength);
        
        return text.substring(start, end).trim();
    }
    
    /**
     * Parse the product page HTML
     * @param {string} html 
     * @param {string} url 
     * @returns {Object} Structured product data
     */
    async parseProductPage(html, url) {
        const $ = cheerio.load(html);
        
        console.log('📖 Parsing product page HTML...');
        
        const productData = {
            // Basic info
            productInfo: this.extractProductInfo($),
            
            // Variants with UPCs
            variants: this.extractVariantsTable($),
            
            // Product attributes  
            attributes: this.extractProductAttributes($),
            
            // Color options
            colors: this.extractColorOptions($),
            
            // Stock status
            stockStatus: this.extractStockStatus($, html),
            
            // Authentication status
            authStatus: this.detectAuthStatus(html),
            
            // Raw data for debugging
            debugInfo: {
                url: url,
                hasProductTable: $('.product-data-table table.table').length > 0,
                hasColorSelector: $('#gallery_09').length > 0,
                titleFound: $('h1.label-custom-green').text().trim()
            }
        };
        
        console.log(`📊 Parsed data: ${productData.variants.length} variants, ${productData.colors.length} colors`);
        
        return productData;
    }
    
    /**
     * Extract product header information
     * @param {*} $ Cheerio instance
     * @returns {Object} Product info
     */
    extractProductInfo($) {
        const info = {
            modelName: '',
            collection: '',
            brand: '',
            priceGroup: '',
            hingeType: ''
        };
        
        try {
            // Model name from h1
            info.modelName = $('h1.label-custom-green').text().trim();
            
            // Collection/Brand from link
            const collectionLink = $('a[id*="lnkCollection"]').first();
            info.collection = collectionLink.text().trim();
            info.brand = info.collection; // Often the same
            
            // Price group
            const priceGroupLink = $('a[id*="lnkPriceGroup"]').first();
            info.priceGroup = priceGroupLink.text().trim();
            
            // Hinge type
            const hingeLink = $('a[id*="lnkHinge"]').first();
            info.hingeType = hingeLink.text().trim();
            
            console.log(`📋 Product info: ${info.modelName} (${info.collection})`);
            
        } catch (error) {
            console.error('Error extracting product info:', error.message);
        }
        
        return info;
    }
    
    /**
     * Extract variants table with UPCs
     * @param {*} $ Cheerio instance
     * @returns {Array} Variant objects
     */
    extractVariantsTable($) {
        const variants = [];
        
        try {
            const table = $('.product-data-table table.table').first();
            if (!table.length) {
                console.log('⚠️  No product data table found');
                return variants;
            }
            
            console.log('📊 Found product data table, extracting variants...');
            
            // Find header row to understand column structure
            const headerCells = table.find('thead tr th, tbody tr:first td').map((i, cell) => 
                $(cell).text().trim().toLowerCase()
            ).get();
            
            console.log('Table headers:', headerCells);
            
            // Process data rows
            table.find('tbody tr').each((rowIndex, row) => {
                const $row = $(row);
                const cells = $row.find('td');
                
                if (cells.length < 7) return; // Skip incomplete rows
                
                const variant = {
                    color: cells.eq(0).text().trim(),
                    eye: cells.eq(1).text().trim(),
                    a: cells.eq(2).text().trim(),
                    b: cells.eq(3).text().trim(),
                    dbl: cells.eq(4).text().trim(),
                    ed: cells.eq(5).text().trim(),
                    temple: cells.eq(6).text().trim(),
                    bridge: cells.eq(7).text().trim(),
                    upc: ''
                };
                
                // Extract UPC from span with specific ID pattern
                const upcSpan = $row.find('span[id*="Label1"], span[id*="UPC"], span[id*="upc"]').first();
                if (upcSpan.length) {
                    variant.upc = upcSpan.text().trim();
                }
                
                // Normalize color name
                variant.colorNormalized = this.normalizeColorName(variant.color);
                
                if (variant.color && variant.upc) {
                    variants.push(variant);
                    console.log(`   ✓ ${variant.color} (${variant.eye}) - UPC: ${variant.upc}`);
                } else {
                    console.log(`   ⚠️  Incomplete variant: ${variant.color}`);
                }
            });
            
        } catch (error) {
            console.error('Error extracting variants table:', error.message);
        }
        
        return variants;
    }
    
    /**
     * Extract product attributes from accordion section
     * @param {*} $ Cheerio instance
     * @returns {Object} Attributes
     */
    extractProductAttributes($) {
        const attributes = {
            gender: '',
            material: '',
            newRelease: false
        };
        
        try {
            // Gender - look for text after "Gender" label
            const genderSection = $(':contains("Gender")').filter((i, el) => 
                $(el).text().trim().toLowerCase() === 'gender'
            );
            if (genderSection.length) {
                const genderText = genderSection.parent().find('p, span').first().text().trim();
                attributes.gender = genderText;
            }
            
            // Material - look for text after "Material" label
            const materialSection = $(':contains("Material")').filter((i, el) => 
                $(el).text().trim().toLowerCase() === 'material'
            );
            if (materialSection.length) {
                const materialText = materialSection.parent().find('p, span').first().text().trim();
                attributes.material = materialText;
            }
            
            // New Release status
            const newReleaseLabel = $('label.newreleaselable-custom, .newrelease, [class*="newrelease"]');
            attributes.newRelease = newReleaseLabel.length > 0;
            
            console.log(`🏷️  Attributes: Gender=${attributes.gender}, Material=${attributes.material}, NewRelease=${attributes.newRelease}`);
            
        } catch (error) {
            console.error('Error extracting attributes:', error.message);
        }
        
        return attributes;
    }
    
    /**
     * Extract color options from gallery
     * @param {*} $ Cheerio instance  
     * @returns {Array} Color objects
     */
    extractColorOptions($) {
        const colors = [];
        
        try {
            const gallery = $('#gallery_09');
            if (!gallery.length) {
                console.log('⚠️  No color gallery found');
                return colors;
            }
            
            console.log('🎨 Extracting color options from gallery...');
            
            gallery.find('div[data-colorid]').each((i, colorDiv) => {
                const $colorDiv = $(colorDiv);
                const colorId = $colorDiv.attr('data-colorid');
                const colorName = $colorDiv.find('h6').text().trim();
                
                if (colorName) {
                    colors.push({
                        id: colorId,
                        name: colorName,
                        normalized: this.normalizeColorName(colorName)
                    });
                    console.log(`   🎨 ${colorName} (ID: ${colorId})`);
                }
            });
            
        } catch (error) {
            console.error('Error extracting colors:', error.message);
        }
        
        return colors;
    }
    
    /**
     * Extract stock status from page
     * @param {*} $ Cheerio instance
     * @param {string} html Raw HTML for JavaScript parsing
     * @returns {Object} Stock status
     */
    extractStockStatus($, html) {
        const status = {
            inStock: true,
            outOfStock: false,
            preOrder: false,
            message: ''
        };
        
        try {
            // Check for out of stock div
            const outOfStockDiv = $('#ctl00_MainContentArea_outofstock');
            if (outOfStockDiv.length && outOfStockDiv.css('display') !== 'none') {
                status.outOfStock = true;
                status.inStock = false;
                status.message = outOfStockDiv.text().trim();
            }
            
            // Check for pre-order div
            const preOrderDiv = $('#ctl00_MainContentArea_PreOrder');
            if (preOrderDiv.length && preOrderDiv.css('display') !== 'none') {
                status.preOrder = true;
                status.message = preOrderDiv.text().trim();
            }
            
            // Look for stock indicators in JavaScript
            if (html.includes('OutOfStock') || html.includes('out of stock')) {
                status.outOfStock = true;
                status.inStock = false;
            }
            
            console.log(`📦 Stock status: InStock=${status.inStock}, OutOfStock=${status.outOfStock}, PreOrder=${status.preOrder}`);
            
        } catch (error) {
            console.error('Error extracting stock status:', error.message);
        }
        
        return status;
    }
    
    /**
     * Normalize color names using mapping - enhanced for complex color descriptions
     * @param {string} colorName 
     * @returns {string}
     */
    normalizeColorName(colorName) {
        if (!colorName) return '';
        
        // Handle compound colors with slashes first
        if (colorName.includes('/')) {
            const parts = colorName.split('/').map(part => this.normalizeColorPart(part.trim()));
            return parts.join('/');
        }
        
        // Handle multi-word color descriptions like "CLEO BLACK CRY"
        if (colorName.includes(' ')) {
            const words = colorName.split(' ').map(word => this.normalizeColorPart(word.trim()));
            return words.join(' ');
        }
        
        // Single color part
        return this.normalizeColorPart(colorName);
    }
    
    /**
     * Normalize a single color part
     * @param {string} colorPart 
     * @returns {string}
     */
    normalizeColorPart(colorPart) {
        if (!colorPart) return '';
        
        const upperColor = colorPart.toUpperCase();
        
        // Try exact match first
        if (this.colorMap.has(upperColor)) {
            return this.colorMap.get(upperColor);
        }
        
        // For longer words, try partial matches
        for (const [abbrev, fullName] of this.colorMap.entries()) {
            if (upperColor === abbrev || 
                (colorPart.length <= 4 && upperColor.includes(abbrev)) ||
                (abbrev.length > 3 && upperColor.includes(abbrev))) {
                return fullName;
            }
        }
        
        // Return original with proper case if no mapping found
        return colorPart.charAt(0).toUpperCase() + colorPart.slice(1).toLowerCase();
    }
    
    /**
     * Detect authentication status
     * @param {string} html 
     * @returns {Object} Auth status
     */
    detectAuthStatus(html) {
        const status = {
            loggedIn: false,
            hasUpcAccess: false,
            hasPricing: false,
            message: ''
        };
        
        try {
            // Check for login indicators
            if (html.includes('Sign Out') || html.includes('My Account') || html.includes('Welcome,')) {
                status.loggedIn = true;
            }
            
            // Check for UPC access - UPCs are typically restricted
            if (html.includes('UPC') && !html.includes('Login to see UPC')) {
                status.hasUpcAccess = true;
            }
            
            // Check for pricing access
            if (html.includes('$') || html.includes('Price:') || html.includes('MSRP')) {
                status.hasPricing = true;
            }
            
            // Set message based on status
            if (status.loggedIn) {
                status.message = 'Logged in - full access';
            } else {
                status.message = 'Not logged in - limited access';
            }
            
            console.log(`🔐 Auth status: ${status.message}`);
            
        } catch (error) {
            console.error('Error detecting auth status:', error.message);
            status.message = 'Unable to determine auth status';
        }
        
        return status;
    }
    
    /**
     * Update cookies from response headers
     * @param {string} setCookieHeader 
     */
    updateCookies(setCookieHeader) {
        if (!setCookieHeader) return;
        
        const cookies = Array.isArray(setCookieHeader) ? setCookieHeader : [setCookieHeader];
        
        cookies.forEach(cookie => {
            const [nameValue] = cookie.split(';');
            const [name, value] = nameValue.split('=');
            
            if (name && value) {
                this.cookies.set(name.trim(), value.trim());
                console.log(`🍪 Updated cookie: ${name.trim()}`);
            }
        });
    }
    
    /**
     * Sleep utility
     * @param {number} ms 
     * @returns {Promise}
     */
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    
    /**
     * Get service status and configuration
     * @returns {Object} Status info
     */
    getStatus() {
        return {
            service: 'ModernOpticalWebService',
            version: '1.0.0',
            baseUrl: this.baseUrl,
            timeout: this.timeout,
            maxRetries: this.maxRetries,
            cookiesStored: this.cookies.size,
            colorMappings: this.colorMap.size
        };
    }
    
    /**
     * Testing interface for quick scraper testing
     * @param {string} brand - Optional brand (defaults to 'BMEC')
     * @param {string} model - Optional model (defaults to 'BIG RIVER')
     * @returns {Promise<Object>} Scraping result in formatted structure
     */
    async testScraper(brand = 'BMEC', model = 'BIG RIVER') {
        console.log('🧪 Testing Modern Optical Web Scraper');
        console.log(`🎯 Target: ${brand} - ${model}`);
        console.log('='.repeat(50));
        
        const result = await this.scrapeProduct(brand, model);
        
        console.log('\n📋 SCRAPING RESULT:');
        console.log(JSON.stringify(result, null, 2));
        
        console.log('\n📊 SUMMARY:');
        console.log(`Found: ${result.found ? '✅ Yes' : '❌ No'}`);
        console.log(`Variants: ${result.variants?.length || 0}`);
        console.log(`Auth Status: ${result.authStatus?.isLoggedIn ? '🔓 Logged In' : '🔒 Not Logged In'}`);
        console.log(`URL: ${result.url || 'N/A'}`);
        
        return result;
    }
}

module.exports = ModernOpticalWebService;
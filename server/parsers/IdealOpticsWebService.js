const axios = require('axios');
const cheerio = require('cheerio');

/**
 * Ideal Optics Web Scraping Service
 * Scrapes product data from i-dealoptics.com to enrich email data with:
 * - UPC codes
 * - Precise frame measurements (A, B, DBL, ED)
 * - Gender
 * - Material
 * - Fit type
 *
 * NOTE: Wholesale pricing and MSRP are NOT available on the website
 */
class IdealOpticsWebService {
    constructor(options = {}) {
        this.baseUrl = 'https://www.i-dealoptics.com';
        this.timeout = options.timeout || 15000;
        this.maxRetries = options.maxRetries || 3;
        this.retryDelay = options.retryDelay || 1000;
        this.userAgent = options.userAgent || 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

        // Cookie jar for session management
        this.cookies = new Map();

        console.log('🌐 IdealOpticsWebService initialized');
    }

    /**
     * Main entry point - scrape product data
     * @param {string} model - Product model (e.g., "R1030")
     * @returns {Promise<Object>} Complete product data
     */
    async scrapeProduct(model) {
        console.log(`🔍 Starting scrape for Ideal Optics: ${model}`);

        try {
            // 1. Try autocomplete API first to get the correct URL
            console.log(`🔎 Using autocomplete API to find product URL...`);
            const autocompleteResult = await this.getProductUrlFromAutocomplete(model);

            let html = null;
            let successUrl = null;

            if (autocompleteResult && autocompleteResult.url) {
                // Autocomplete found the URL - use it directly
                console.log(`✅ Autocomplete found URL: ${autocompleteResult.url}`);
                const fetchResult = await this.fetchPageWithRetry(autocompleteResult.url);

                if (fetchResult && fetchResult.html && !this.isPageNotFound(fetchResult.html)) {
                    successUrl = autocompleteResult.url;
                    html = fetchResult.html;
                    console.log(`✅ Successfully fetched product page`);
                    console.log(`   📊 Response: ${fetchResult.statusCode} ${fetchResult.statusText}`);
                    console.log(`   📄 Content length: ${fetchResult.html.length} characters`);
                } else {
                    console.log(`⚠️  Autocomplete URL failed, falling back to brute force...`);
                }
            } else {
                console.log(`⚠️  Autocomplete returned no results, falling back to brute force...`);
            }

            // 2. Fallback to brute force URL guessing if autocomplete failed
            if (!html) {
                console.log(`📋 Falling back to brute force URL search...`);
                const urls = this.buildProductUrls(model);
                console.log(`📋 Trying ${urls.length} URL variations`);

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
                    }
                }
            }

            if (!html) {
                throw new Error(`No valid page found for model: ${model}`);
            }

            // 3. Parse HTML
            const productData = await this.parseProductPage(html, successUrl);

            // 4. Format data to match expected structure
            const formattedData = {
                found: true,
                url: successUrl,
                brand: 'Ideal Optics',
                model: model,
                gender: productData.attributes?.gender || '',
                material: productData.attributes?.material || '',
                fitType: productData.fitType || '',
                variants: productData.variants?.map(variant => ({
                    colorCode: variant.colorCode,
                    colorName: variant.colorName,
                    upc: variant.upc,
                    eyeSize: variant.eyeSize,
                    bridge: variant.bridge,
                    temple: variant.temple,
                    a: variant.a,
                    b: variant.b,
                    dbl: variant.bridge, // DBL same as bridge for Ideal
                    ed: variant.ed,
                    fitType: variant.fitType,
                    inStock: true // Ideal Optics doesn't show stock status on product pages
                })) || [],
                authStatus: {
                    isLoggedIn: productData.authStatus?.loggedIn || false,
                    hasPricing: false, // Ideal Optics doesn't show pricing on website
                    message: 'Ideal Optics does not display wholesale or retail pricing on website'
                }
            };

            console.log(`✅ Successfully scraped ${model}`);
            console.log(`📊 Found ${formattedData.variants?.length || 0} color variants`);

            return formattedData;

        } catch (error) {
            console.error(`❌ Error scraping ${model}:`, error.message);
            return {
                found: false,
                url: null,
                brand: 'Ideal Optics',
                model: model,
                gender: '',
                material: '',
                fitType: '',
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
     * Use autocomplete API to find the correct product URL
     * @param {string} model - Product model (e.g., "R1030")
     * @returns {Promise<Object|null>} Object with url and metadata, or null if not found
     */
    async getProductUrlFromAutocomplete(model) {
        try {
            const autocompleteUrl = `${this.baseUrl}/Home/SearchFrames/?q=${encodeURIComponent(model)}`;

            console.log(`📡 Calling autocomplete API: ${autocompleteUrl}`);

            const headers = {
                'User-Agent': this.userAgent,
                'Accept': 'application/json, text/javascript, */*; q=0.01',
                'Accept-Language': 'en-US,en;q=0.5',
                'X-Requested-With': 'XMLHttpRequest', // Important for AJAX requests
                'Connection': 'keep-alive',
                'Referer': this.baseUrl
            };

            const response = await axios({
                method: 'GET',
                url: autocompleteUrl,
                headers: headers,
                timeout: this.timeout,
                validateStatus: function (status) {
                    return status < 500;
                }
            });

            if (response.status === 200 && response.data) {
                console.log(`✅ Autocomplete API response received`);

                const data = response.data;

                // Check if we have suggestions
                if (data.suggestions && data.suggestions.length > 0) {
                    const suggestion = data.suggestions[0];
                    console.log(`📋 Found suggestion: ${suggestion.value}`);

                    if (suggestion.data && suggestion.data.BrandUrl && suggestion.data.CollectionUrl && suggestion.data.StyleUrl) {
                        const { BrandUrl, CollectionUrl, StyleUrl } = suggestion.data;

                        // Build the product URL from autocomplete data
                        const productUrl = `${this.baseUrl}/catalog/${BrandUrl}/${CollectionUrl}/${StyleUrl}`;

                        console.log(`🎯 Built product URL: ${productUrl}`);
                        console.log(`   Brand: ${BrandUrl}`);
                        console.log(`   Collection: ${CollectionUrl}`);
                        console.log(`   Style: ${StyleUrl}`);

                        return {
                            url: productUrl,
                            brandUrl: BrandUrl,
                            collectionUrl: CollectionUrl,
                            styleUrl: StyleUrl,
                            displayName: suggestion.value
                        };
                    } else {
                        console.log(`⚠️  Suggestion missing URL data:`, suggestion);
                    }
                } else {
                    console.log(`⚠️  No suggestions returned for: ${model}`);
                }
            } else {
                console.log(`⚠️  Autocomplete API returned status: ${response.status}`);
            }

            return null;

        } catch (error) {
            console.error(`❌ Autocomplete API error:`, error.message);
            return null;
        }
    }

    /**
     * Build all possible product URL variations (FALLBACK METHOD)
     * Ideal Optics URL structure: https://www.i-dealoptics.com/catalog/{collection}/{collection}/{model}
     *
     * Collections include: casino, elegante, elevate, focus-eyewear, haggar, jbx,
     * jelly-bean, rafaella, reflections, rio-ray, suntrends, clearance
     */
    buildProductUrls(model) {
        const urls = [];

        // Known collections from the website
        const collections = [
            'clearance',      // Try clearance first (common for samples)
            'casino',
            'elegante',
            'elevate',
            'focus-eyewear',
            'haggar',
            'jbx',
            'jelly-bean',
            'rafaella',
            'reflections',
            'rio-ray',
            'suntrends'
        ];

        // Model variations
        const modelVariations = [
            model.toLowerCase(),          // "r1030"
            model.toUpperCase(),          // "R1030"
            model                         // Original
        ];

        // Remove duplicates
        const uniqueModels = [...new Set(modelVariations)];

        // Build URLs - try each collection with each model variation
        // Ideal Optics uses structure: /catalog/{collection}/{collection}/{model}
        collections.forEach(collection => {
            uniqueModels.forEach(modelVar => {
                // New format: /catalog/{collection}/{collection}/{model}
                urls.push(`${this.baseUrl}/catalog/${collection}/${collection}/${modelVar}`);

                // Also try old format as fallback: /{collection}/{model}
                urls.push(`${this.baseUrl}/${collection}/${modelVar}`);
            });
        });

        return urls;
    }

    /**
     * Fetch page with retry logic
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
                        return status < 500;
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

                if (!html || html.length < 1000) {
                    console.log(`   ⚠️  Response too short (${html?.length || 0} chars), retrying...`);
                    throw new Error(`Response too short or empty`);
                }

                return result;

            } catch (error) {
                console.log(`   ⚠️  Attempt ${attempt} failed: ${error.message}`);

                if (attempt === this.maxRetries) {
                    console.log(`   💀 All ${this.maxRetries} attempts failed for: ${url}`);
                    return null;
                }

                // Wait before retry
                await this.sleep(this.retryDelay * attempt);
            }
        }

        return null;
    }

    /**
     * Check if page is a 404/not found
     */
    isPageNotFound(html) {
        if (!html || html.length < 100) {
            return true;
        }

        // Check for 404 indicators
        const notFoundIndicators = [
            'Page Not Found',
            'Error 404',
            'HTTP 404',
            'does not exist'
        ];

        const lowerHtml = html.toLowerCase();

        for (const indicator of notFoundIndicators) {
            if (lowerHtml.includes(indicator.toLowerCase())) {
                console.log(`   🔍 Found "${indicator}" indicator - page not found`);
                return true;
            }
        }

        // Check if it's actually a product page
        const idealOpticsProductElements = [
            'stylePartial',
            'frameDetailOwlCarousel',
            'styleDescriptions',
            'fitTypeValue'
        ];

        const hasProductElements = idealOpticsProductElements.some(element =>
            html.includes(element)
        );

        if (hasProductElements) {
            console.log(`   🔍 Found Ideal Optics product elements - valid page`);
            return false;
        }

        return false;
    }

    /**
     * Parse the product page HTML
     */
    async parseProductPage(html, url) {
        const $ = cheerio.load(html);

        console.log('📖 Parsing Ideal Optics product page HTML...');

        const productData = {
            // Product attributes
            attributes: this.extractProductAttributes($),

            // Variants with UPCs from carousel images
            variants: this.extractVariants($, html),

            // Fit type from JavaScript
            fitType: this.extractFitType(html),

            // Authentication status
            authStatus: this.detectAuthStatus(html),

            // Raw data for debugging
            debugInfo: {
                url: url,
                hasCarousel: $('#frameDetailOwlCarousel').length > 0,
                hasStyleInfo: $('.style-detail').length > 0,
                titleFound: $('h2.text-uppercase').text().trim()
            }
        };

        console.log(`📊 Parsed: ${productData.variants.length} variants`);

        return productData;
    }

    /**
     * Extract product attributes (measurements, material, gender)
     */
    extractProductAttributes($) {
        const attributes = {
            gender: '',
            material: '',
            springHinge: false,
            eyeSize: '',
            bridge: '',
            temple: '',
            a: '',
            b: '',
            ed: ''
        };

        try {
            // Extract measurements from style-detail section
            const measurementSection = $('.style-detail');

            if (measurementSection.length) {
                // Get the measurement values from the second paragraph
                const values = measurementSection.find('p.text-small').eq(1).find('span');

                if (values.length >= 6) {
                    attributes.eyeSize = values.eq(0).text().trim();
                    attributes.bridge = values.eq(1).text().trim();
                    attributes.temple = values.eq(2).text().trim();
                    attributes.a = values.eq(3).text().trim();
                    attributes.b = values.eq(4).text().trim();
                    attributes.ed = values.eq(5).text().trim();
                }
            }

            // Extract gender, material, and hinge from descriptions
            const descriptionSection = $('#styleDescriptions');

            if (descriptionSection.length) {
                const spans = descriptionSection.find('.text-small');

                spans.each((i, elem) => {
                    const text = $(elem).text().trim();

                    if (text.match(/womens|mens|unisex/i)) {
                        attributes.gender = text;
                    } else if (text.match(/acetate|metal|stainless|titanium|plastic/i)) {
                        attributes.material = text;
                    } else if (text.toLowerCase().includes('spring hinge')) {
                        attributes.springHinge = true;
                    }
                });
            }

            console.log(`🏷️  Attributes: Gender=${attributes.gender}, Material=${attributes.material}`);
            console.log(`📏 Measurements: Eye=${attributes.eyeSize}, Bridge=${attributes.bridge}, Temple=${attributes.temple}`);

        } catch (error) {
            console.error('Error extracting attributes:', error.message);
        }

        return attributes;
    }

    /**
     * Extract variants (colors with UPCs) from carousel images
     */
    extractVariants($, html) {
        const variants = [];

        try {
            // Ideal Optics stores UPCs in image URLs like:
            // /Image/ShowImage?w=770&sku=R1030EBY53&upc=842691109583

            const carouselImages = $('#frameDetailOwlCarousel .item img');

            console.log(`🎨 Found ${carouselImages.length} carousel images`);

            carouselImages.each((i, img) => {
                const $img = $(img);
                const src = $img.attr('src') || '';
                const dataUpc = $img.attr('data-upc') || '';

                // Extract UPC from data attribute or src URL
                let upc = dataUpc;

                if (!upc && src) {
                    const upcMatch = src.match(/[?&]upc=(\d+)/i);
                    if (upcMatch) {
                        upc = upcMatch[1];
                    }
                }

                // Extract SKU from src URL
                let sku = '';
                if (src) {
                    const skuMatch = src.match(/[?&]sku=([^&]+)/i);
                    if (skuMatch) {
                        sku = skuMatch[1];
                    }
                }

                if (upc) {
                    variants.push({
                        upc: upc,
                        sku: sku,
                        colorCode: '', // Will be extracted from color links
                        colorName: '', // Will be extracted from color links
                        eyeSize: '',
                        bridge: '',
                        temple: '',
                        a: '',
                        b: '',
                        ed: '',
                        fitType: ''
                    });

                    console.log(`   ✓ Variant: SKU=${sku}, UPC=${upc}`);
                }
            });

            // Extract color names from color links
            const colorLinks = $('.text-uppercase.top-margin a.goTo');
            const colorNames = [];

            colorLinks.each((i, link) => {
                const colorName = $(link).text().trim();
                if (colorName) {
                    colorNames.push(colorName);
                }
            });

            console.log(`🎨 Found ${colorNames.length} color options: ${colorNames.join(', ')}`);

            // Match color names to variants
            if (colorNames.length === variants.length) {
                variants.forEach((variant, index) => {
                    variant.colorName = colorNames[index];
                    variant.colorCode = colorNames[index].toUpperCase();
                });
            }

            // Get measurements from attributes (same for all variants)
            const measurementSection = $('.style-detail');
            if (measurementSection.length) {
                const values = measurementSection.find('p.text-small').eq(1).find('span');

                if (values.length >= 6) {
                    const measurements = {
                        eyeSize: values.eq(0).text().trim(),
                        bridge: values.eq(1).text().trim(),
                        temple: values.eq(2).text().trim(),
                        a: values.eq(3).text().trim(),
                        b: values.eq(4).text().trim(),
                        ed: values.eq(5).text().trim()
                    };

                    // Apply measurements to all variants
                    variants.forEach(variant => {
                        variant.eyeSize = measurements.eyeSize;
                        variant.bridge = measurements.bridge;
                        variant.temple = measurements.temple;
                        variant.a = measurements.a;
                        variant.b = measurements.b;
                        variant.ed = measurements.ed;
                    });
                }
            }

            // Extract fit type from JavaScript
            const fitType = this.extractFitType(html);
            if (fitType) {
                variants.forEach(variant => {
                    variant.fitType = fitType;
                });
            }

        } catch (error) {
            console.error('Error extracting variants:', error.message);
        }

        return variants;
    }

    /**
     * Extract fit type from JavaScript fitTypeLookup
     */
    extractFitType(html) {
        try {
            // Look for fitTypeLookup in JavaScript
            const fitTypeMatch = html.match(/fitTypeLookup\['(\d+)'\]\s*=\s*'([^']+)'/);

            if (fitTypeMatch && fitTypeMatch[2]) {
                const fitType = fitTypeMatch[2];
                console.log(`👔 Fit Type: ${fitType}`);
                return fitType;
            }
        } catch (error) {
            console.error('Error extracting fit type:', error.message);
        }

        return '';
    }

    /**
     * Detect authentication status
     */
    detectAuthStatus(html) {
        const status = {
            loggedIn: false,
            message: ''
        };

        try {
            // Check for login indicators
            if (html.includes('Log Out') || html.includes('My Account')) {
                status.loggedIn = true;
                status.message = 'Logged in';
            } else {
                status.message = 'Not logged in (public access)';
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
     */
    updateCookies(setCookieHeader) {
        if (!setCookieHeader) return;

        const cookies = Array.isArray(setCookieHeader) ? setCookieHeader : [setCookieHeader];

        cookies.forEach(cookie => {
            const [nameValue] = cookie.split(';');
            const [name, value] = nameValue.split('=');

            if (name && value) {
                this.cookies.set(name.trim(), value.trim());
            }
        });
    }

    /**
     * Sleep utility
     */
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Get service status
     */
    getStatus() {
        return {
            service: 'IdealOpticsWebService',
            version: '1.0.0',
            baseUrl: this.baseUrl,
            timeout: this.timeout,
            maxRetries: this.maxRetries,
            cookiesStored: this.cookies.size
        };
    }
}

module.exports = IdealOpticsWebService;

const pdfParse = require('pdf-parse');
const axios = require('axios');

/**
 * SAFILO SERVICE - Unified PDF Processing & API Enrichment
 * 
 * This service provides a complete solution for processing Safilo order PDFs:
 * 1. Parse PDF → Extract order info and frame data
 * 2. Validate → Cross-reference with Safilo API 
 * 3. Enrich → Add pricing, stock, and product details
 * 
 * Usage:
 *   const service = new SafiloService();
 *   const result = await service.processOrder(pdfBuffer);
 */
class SafiloService {
    constructor(options = {}) {
        this.config = {
            // API Configuration
            apiUrl: 'https://www.mysafilo.com/US/api/CatalogAPI/filter',
            timeout: options.timeout || 10000,
            maxRetries: options.maxRetries || 3,
            retryDelay: options.retryDelay || 1000,
            batchSize: options.batchSize || 5,
            
            // Validation Configuration
            minConfidence: options.minConfidence || 50,
            
            // Debug Mode
            debug: options.debug || false,
            
            // Headers for API requests
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
        };
        
        // Initialize caches and stats
        this.cache = new Map();
        this.resetStats();
    }
    
    resetStats() {
        this.stats = {
            totalFrames: 0,
            validatedFrames: 0,
            failedFrames: 0,
            apiErrors: 0,
            processingStartTime: null,
            processingEndTime: null
        };
    }
    
    log(...args) {
        if (this.config.debug) {
            console.log(...args);
        }
    }
    
    // ===========================================
    // PHASE 1: PDF PARSING
    // ===========================================
    
    /**
     * Main entry point - processes PDF buffer and returns enriched data
     */
    async processOrder(pdfBuffer, options = {}) {
        this.resetStats();
        this.stats.processingStartTime = Date.now();
        
        try {
            console.log('🔍 Processing Safilo order PDF...\n');
            
            // Phase 1: Parse PDF
            const parsedData = await this.parsePDF(pdfBuffer);
            console.log(`✅ Parsed ${parsedData.frames.length} frames from PDF\n`);
            
            // Phase 2: Enrich with API data
            const enrichedData = await this.enrichWithAPI(parsedData);
            
            this.stats.processingEndTime = Date.now();
            const processingTime = ((this.stats.processingEndTime - this.stats.processingStartTime) / 1000).toFixed(2);
            
            console.log(`🎉 Processing complete in ${processingTime}s`);
            console.log(`📊 Results: ${this.stats.validatedFrames}/${this.stats.totalFrames} validated`);
            
            return enrichedData;
            
        } catch (error) {
            console.error('❌ SafiloService error:', error.message);
            throw error;
        }
    }
    
    /**
     * Parse PDF buffer into structured data
     */
    async parsePDF(pdfBuffer) {
        const pdfData = await pdfParse(pdfBuffer);
        const text = pdfData.text;
        
        this.log('PDF Info:', {
            pages: pdfData.numpages,
            textLength: text.length
        });
        
        // Parse order header
        const orderInfo = this.parseOrderHeader(text);
        
        // Parse frame lines
        const frames = this.parseFrames(text);
        
        return {
            metadata: {
                parsedAt: new Date().toISOString(),
                pdfPages: pdfData.numpages,
                textLength: text.length,
                framesFound: frames.length,
                serviceVersion: '1.0'
            },
            orderInfo: orderInfo,
            frames: frames
        };
    }
    
    /**
     * Parse order header information
     */
    parseOrderHeader(text) {
        const lines = text.split('\n').map(line => line.trim());
        
        const orderInfo = {
            accountNumber: '',
            orderNumber: '', 
            referenceNumber: '',
            eyeRepOrderNumber: '', // Store EyeRep number separately
            placedBy: '',
            placedByNumber: '',
            orderDate: '',
            customerName: '',
            customerCode: '',
            customerAddress: '',
            customerPhone: '',
            shipToName: '',
            shipToCode: '',
            shipToAddress: '',
            shipToPhone: ''
        };
        
        // Find the header numbers section - try multiple patterns
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            
            // Pattern 1: Account Number: followed by values
            if (line === 'Account Number:' && i + 5 < lines.length) {
                // Based on PDF structure:
                // Line i+0: "Account Number:"
                // Line i+1: "EyeRep Order Number:"  
                // Line i+2: "Order Reference Number:"
                // Line i+3: "1111708" (Account Number)
                // Line i+4: "5002949163" (EyeRep Order Number)
                // Line i+5: "113006337" (Order Reference Number - CORRECT!)
                orderInfo.accountNumber = lines[i + 3] || '';
                orderInfo.eyeRepOrderNumber = lines[i + 4] || '';  // EyeRep number
                orderInfo.orderNumber = lines[i + 5] || '';        // Order Reference Number (CORRECT!)
                break;
            }
            
            // Pattern 2: Look for Order Reference Number (the correct field)
            if (line.includes('Order Reference Number')) {
                const orderMatch = line.match(/Order Reference Number[:\s]*(\d+)/);
                if (orderMatch) {
                    orderInfo.orderNumber = orderMatch[1];
                }
            }
            
            // Pattern 2b: Also capture EyeRep Order Number for reference
            if (line.includes('EyeRep Order Number')) {
                const eyeRepMatch = line.match(/EyeRep Order Number[:\s]*(\d+)/);
                if (eyeRepMatch) {
                    orderInfo.eyeRepOrderNumber = eyeRepMatch[1]; // Store separately
                }
            }
            
            // Pattern 3: Account number in line
            if (line.includes('Account') && line.match(/\d{6,}/)) {
                const accountMatch = line.match(/(\d{6,})/);
                if (accountMatch && !orderInfo.accountNumber) {
                    orderInfo.accountNumber = accountMatch[1];
                }
            }
        }
        
        // Parse Placed By
        for (let i = 0; i < lines.length; i++) {
            if (lines[i] === 'Placed By:' && i + 2 < lines.length) {
                const placedByLine = lines[i + 2];
                const match = placedByLine.match(/^(\d+)\s+(.+)$/);
                if (match) {
                    orderInfo.placedByNumber = match[1];
                    orderInfo.placedBy = match[2];
                } else {
                    orderInfo.placedBy = placedByLine;
                }
                break;
            }
        }
        
        // Parse Date - try multiple patterns
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            
            // Pattern 1: "Date:" on its own line, value on next line
            if (line === 'Date:' && i + 1 < lines.length) {
                const nextLine = lines[i + 1].trim();
                if (nextLine.match(/\d{2}\/\d{2}\/\d{4}/)) {
                    orderInfo.orderDate = nextLine;
                    break;
                }
            }
            
            // Pattern 2: "Date:" with value on same line
            if (line.startsWith('Date:')) {
                const dateMatch = line.match(/Date:\s*(\d{2}\/\d{2}\/\d{4})/);
                if (dateMatch) {
                    orderInfo.orderDate = dateMatch[1];
                    break;
                }
            }
            
            // Pattern 3: Just find any line with the date format near "Date:"
            if (line.includes('Date:')) {
                const dateMatch = line.match(/(\d{2}\/\d{2}\/\d{4})/);
                if (dateMatch) {
                    orderInfo.orderDate = dateMatch[1];
                    break;
                }
            }
            
            // Pattern 4: Legacy - Date 2 lines after "Date:" label
            if (line === 'Date:' && i + 2 < lines.length) {
                const dateLine = lines[i + 2].trim();
                if (dateLine.match(/\d{2}\/\d{2}\/\d{4}/)) {
                    orderInfo.orderDate = dateLine;
                    break;
                }
            }
        }
        
        // Parse Customer
        const customerMatch = text.match(/Customer:\s*([^(]+)\s*\(([^)]+)\)/);
        if (customerMatch) {
            orderInfo.customerName = customerMatch[1].trim();
            orderInfo.customerCode = customerMatch[2];
        }
        
        // Parse Customer Address
        for (let i = 0; i < lines.length; i++) {
            if (lines[i].includes('PETELIN VISION @ PEORIA') && lines[i].includes('US1213995')) {
                const addressLines = [];
                for (let j = i + 1; j < lines.length && j < i + 4; j++) {
                    if (lines[j] && !lines[j].startsWith('Phone:') && !lines[j].includes('Ship to:')) {
                        addressLines.push(lines[j]);
                    } else {
                        break;
                    }
                }
                orderInfo.customerAddress = addressLines.join(', ');
                break;
            }
        }
        
        // Parse Phone - NOT NEEDED (commented out as per requirements)
        // const phoneMatch = text.match(/Phone:(\d+)/);
        // if (phoneMatch) {
        //     orderInfo.customerPhone = phoneMatch[1];
        // }
        
        // Ship to same as customer for this format
        orderInfo.shipToName = orderInfo.customerName;
        orderInfo.shipToCode = orderInfo.customerCode;
        orderInfo.shipToAddress = orderInfo.customerAddress;
        orderInfo.shipToPhone = orderInfo.customerPhone;
        
        // Debug logging to verify parsing
        console.log('📋 Parsed Order Info:');
        console.log('  - Account Number:', orderInfo.accountNumber);
        console.log('  - Order Reference Number (CORRECT):', orderInfo.orderNumber);
        console.log('  - EyeRep Order Number (reference only):', orderInfo.eyeRepOrderNumber);
        console.log('  - Date:', orderInfo.orderDate);
        console.log('  - Customer:', orderInfo.customerName);
        console.log('  - Placed By:', orderInfo.placedBy);
        
        return orderInfo;
    }
    
    /**
     * Parse frames from PDF text
     */
    parseFrames(text) {
        const lines = text.split('\n').map(line => line.trim());
        const frames = [];
        
        // Find where frame data starts
        let startIndex = -1;
        for (let i = 0; i < lines.length; i++) {
            if (lines[i].includes('Item Description')) {
                startIndex = i + 1;
                break;
            }
        }
        
        if (startIndex === -1) {
            return frames;
        }
        
        // Process frames - they span multiple lines
        for (let i = startIndex; i < lines.length; i++) {
            let line = lines[i];
            
            // Skip empty lines and totals
            if (!line || line.includes('Total') || line.includes('*Date Available')) {
                continue;
            }
            
            // Look for frame start patterns
            if (!line.match(/^\s*(CARRERA|VICTORY|CARDUC|CH\s|KS\s|CATRINA|JOLIET|MIS\s)/)) {
                continue;
            }
            
            // Collect multi-line frame data
            let frameLine = line;
            let nextIndex = i + 1;
            
            while (nextIndex < lines.length && nextIndex < i + 4) {
                const nextLine = lines[nextIndex].trim();
                
                // Stop if we hit another frame or section
                if (nextLine.match(/^\s*(CARRERA|VICTORY|CARDUC|CH\s|KS\s|CATRINA|JOLIET|MIS\s|KSP\s|Total)/)) {
                    break;
                }
                
                // Stop if we hit a date line
                if (nextLine.match(/^\d+\/\d+\/\d+/)) {
                    break;
                }
                
                // Add temple size if it's just 3 digits
                if (nextLine.match(/^\d{3}$/)) {
                    frameLine += ' ' + nextLine;
                    nextIndex++;
                    continue;
                }
                
                // Add line if it looks like continuation
                if (nextLine && nextLine.length > 3 && !nextLine.match(/^\d+$/)) {
                    frameLine += ' ' + nextLine;
                    nextIndex++;
                } else {
                    break;
                }
            }
            
            // Parse the complete frame line
            const frameInfo = this.parseFrameLine(frameLine, i + 1);
            if (frameInfo) {
                frames.push(frameInfo);
            }
            
            // Skip the lines we consumed
            i = nextIndex - 1;
        }
        
        return frames;
    }
    
    /**
     * Parse individual frame line
     */
    parseFrameLine(line, lineNumber) {
        // Clean up the line
        line = line.replace(/\s+/g, ' ').trim();
        
        // Remove date stamps that might interfere
        line = line.replace(/\d{5}\/\d{2}\/\d{4}\.?/g, '');
        line = line.replace(/\s+/g, ' ').trim();
        
        // Look for size pattern (XX/XX XXX)
        const sizeMatch = line.match(/(\d{2})\/(\d{2})\s+(\d{3})/);
        if (!sizeMatch) {
            return null;
        }
        
        const eyeSize = sizeMatch[1];
        const bridge = sizeMatch[2];  
        const temple = sizeMatch[3];
        
        // Split at the size pattern
        const sizeIndex = line.indexOf(sizeMatch[0]);
        const beforeSize = line.substring(0, sizeIndex).trim();
        
        const parts = beforeSize.split(/\s+/);
        if (parts.length < 3) {
            return null;
        }
        
        let brand = '';
        let model = '';
        let colorCode = '';
        let colorName = '';
        
        // Brand-specific parsing
        if (beforeSize.startsWith('CARRERA ')) {
            brand = 'CARRERA';
            model = parts[1];
            colorCode = parts[2];
            colorName = parts.slice(3).join(' ');
        } else if (beforeSize.startsWith('VICTORY ')) {
            brand = 'CARRERA';
            model = parts.slice(0, 3).join(' ');
            colorCode = parts[3];
            colorName = parts.slice(4).join(' ');
        } else if (beforeSize.startsWith('CARDUC ')) {
            brand = 'CARRERA DUCATI';
            model = parts.slice(0, 2).join(' ');
            colorCode = parts[2];
            colorName = parts.slice(3).join(' ');
        } else if (beforeSize.startsWith('CH ')) {
            brand = 'CHESTERFIELD';
            model = parts.slice(0, 2).join(' ');
            colorCode = parts[2];
            colorName = parts.slice(3).join(' ');
        } else if (beforeSize.startsWith('KS ')) {
            brand = 'KATE SPADE';
            model = parts.slice(0, 3).join(' ');
            colorCode = parts[3];
            colorName = parts.slice(4).join(' ');
        } else if (beforeSize.startsWith('CATRINA') || beforeSize.startsWith('JOLIET')) {
            brand = 'KATE SPADE';
            model = parts[0];
            colorCode = parts[1];
            colorName = parts.slice(2).join(' ');
        } else if (beforeSize.startsWith('MIS ')) {
            brand = 'MISSONI';
            model = parts.slice(0, 2).join(' ');
            colorCode = parts[2];
            colorName = parts.slice(3).join(' ');
        } else {
            // Fallback
            brand = parts[0];
            model = parts.slice(0, 2).join(' ');
            colorCode = parts[2];
            colorName = parts.slice(3).join(' ');
        }
        
        // Clean up color name
        colorName = colorName.replace(/_/g, ' ').replace(/\s+/g, ' ').trim();
        
        return {
            lineNumber: lineNumber,
            originalLine: line,
            brand: brand,
            model: model,
            colorCode: colorCode,
            colorName: colorName,
            eyeSize: eyeSize,
            bridge: bridge,
            temple: temple,
            size: `${eyeSize}/${bridge}/${temple}`,
            quantity: 1
        };
    }
    
    // ===========================================
    // PHASE 2: API ENRICHMENT
    // ===========================================
    
    /**
     * Enrich parsed data with API information
     */
    async enrichWithAPI(parsedData) {
        console.log('🔍 Starting API validation and enrichment...\n');
        
        this.stats.totalFrames = parsedData.frames.length;
        
        // Process frames in batches
        const enrichedFrames = await this.processFramesInBatches(parsedData.frames);
        
        const processingTime = this.stats.processingEndTime 
            ? ((this.stats.processingEndTime - this.stats.processingStartTime) / 1000).toFixed(2)
            : ((Date.now() - this.stats.processingStartTime) / 1000).toFixed(2);
        
        return {
            metadata: {
                ...parsedData.metadata,
                enrichedAt: new Date().toISOString(),
                processingTimeSeconds: processingTime
            },
            orderInfo: parsedData.orderInfo,
            frames: enrichedFrames,
            statistics: {
                totalFrames: this.stats.totalFrames,
                validated: this.stats.validatedFrames,
                failed: this.stats.failedFrames,
                apiErrors: this.stats.apiErrors,
                validationRate: `${Math.round((this.stats.validatedFrames / this.stats.totalFrames) * 100)}%`,
                processingTimeSeconds: processingTime,
                framesPerSecond: (this.stats.totalFrames / parseFloat(processingTime)).toFixed(2)
            }
        };
    }
    
    /**
     * Process frames in batches to avoid overwhelming the API
     */
    async processFramesInBatches(frames) {
        const results = [];
        const batchSize = this.config.batchSize;
        
        for (let i = 0; i < frames.length; i += batchSize) {
            const batch = frames.slice(i, Math.min(i + batchSize, frames.length));
            const batchNumber = Math.floor(i / batchSize) + 1;
            const totalBatches = Math.ceil(frames.length / batchSize);
            
            this.log(`Processing batch ${batchNumber}/${totalBatches}`);
            
            const batchResults = await Promise.all(
                batch.map((frame, idx) => this.processFrame(frame, i + idx, frames.length))
            );
            
            results.push(...batchResults);
            
            // Small delay between batches
            if (i + batchSize < frames.length) {
                await new Promise(resolve => setTimeout(resolve, 500));
            }
        }
        
        return results;
    }
    
    /**
     * Process individual frame with API validation
     */
    async processFrame(frame, index, total) {
        console.log(`[${index + 1}/${total}] Processing: ${frame.brand} ${frame.model}`);
        
        const searchVariations = this.generateSearchVariations(frame);
        let apiData = null;
        
        // Try each search variation until we find a match
        for (const searchTerm of searchVariations) {
            apiData = await this.makeAPIRequest(searchTerm);
            if (apiData.found) {
                console.log(`    ✅ Found with: "${searchTerm}"`);
                break;
            }
        }
        
        if (!apiData.found) {
            console.log(`    ❌ Not found after ${searchVariations.length} attempts`);
            this.stats.failedFrames++;
            return {
                ...frame,
                apiData: null,
                validation: {
                    validated: false,
                    reason: 'No API data found',
                    searchAttempts: searchVariations.length
                },
                enrichedData: null
            };
        }
        
        // Cross-reference the data
        const validation = this.crossReferenceFrame(frame, apiData);
        
        if (validation.validated) {
            console.log(`    ✅ Validated (${validation.confidence}% confidence)`);
            this.stats.validatedFrames++;
        } else {
            console.log(`    ⚠️  Validation failed (${validation.confidence}% confidence): ${validation.reason}`);
            this.stats.failedFrames++;
        }
        
        // Enrich with API data
        const enrichedData = validation.bestMatch ? {
            // Basic product data
            upc: validation.bestMatch.upc,
            ean: validation.bestMatch.ean,
            sku: validation.bestMatch.sku,
            
            // Pricing
            wholesale: validation.bestMatch.wholesale,
            msrp: validation.bestMatch.msrp,
            
            // Availability
            inStock: validation.bestMatch.inStock,
            availability: validation.bestMatch.availability,
            availableDate: validation.bestMatch.availableDate,
            
            // Size data from API
            apiEyeSize: validation.bestMatch.eyeSize,
            apiBridge: validation.bestMatch.bridge,
            apiTemple: validation.bestMatch.temple,
            apiSize: validation.bestMatch.size,
            
            // Product details
            material: validation.bestMatch.material,
            frontMaterial: validation.bestMatch.frontMaterial,
            templeMaterial: validation.bestMatch.templeMaterial,
            shape: validation.bestMatch.shape,
            frameType: validation.bestMatch.frameType,
            gender: validation.bestMatch.gender,
            
            // Manufacturing
            countryOfOrigin: validation.bestMatch.countryOfOrigin,
            fitting: validation.bestMatch.fitting
        } : null;
        
        return {
            ...frame,
            apiData: apiData,
            validation: validation,
            enrichedData: enrichedData
        };
    }
    
    /**
     * Make API request with retry logic and caching
     */
    async makeAPIRequest(searchQuery) {
        const cacheKey = searchQuery.toLowerCase();
        if (this.cache.has(cacheKey)) {
            this.log(`Cache hit: ${searchQuery}`);
            return this.cache.get(cacheKey);
        }
        
        for (let attempt = 1; attempt <= this.config.maxRetries; attempt++) {
            try {
                const response = await axios.post(this.config.apiUrl, {
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
                }, {
                    headers: this.config.headers,
                    timeout: this.config.timeout
                });
                
                const result = this.processAPIResponse(response.data, searchQuery);
                this.cache.set(cacheKey, result);
                return result;
                
            } catch (error) {
                if (attempt === this.config.maxRetries) {
                    this.log(`API Error after ${attempt} attempts: ${error.message}`);
                    this.stats.apiErrors++;
                    return { found: false, error: error.message };
                }
                
                await new Promise(resolve => setTimeout(resolve, this.config.retryDelay * attempt));
            }
        }
    }
    
    /**
     * Process API response to extract product data
     */
    processAPIResponse(data, searchQuery) {
        if (!Array.isArray(data) || data.length === 0) {
            return { found: false, reason: 'No results returned' };
        }
        
        const product = data[0];
        
        if (!product.colorGroup || product.colorGroup.length === 0) {
            return { found: false, reason: 'No color variants found' };
        }
        
        // Extract all available colors and sizes
        const variants = [];
        for (const colorGroup of product.colorGroup) {
            if (colorGroup.sizes && colorGroup.sizes.length > 0) {
                for (const size of colorGroup.sizes) {
                    variants.push({
                        colorCode: colorGroup.color,
                        colorName: colorGroup.colorName || '',
                        eyeSize: size.eyeSize || size.a,
                        bridge: size.bridge || size.dbl,
                        temple: size.temple,
                        size: size.size,
                        alternateSize: size.alternateFrameSize,
                        upc: size.upc,
                        ean: size.ean || size.frameId,
                        sku: size.sku,
                        wholesale: parseFloat(size.wholesale) || parseFloat(size.price) || 0,
                        msrp: parseFloat(size.msrp) || 0,
                        inStock: size.isInStock || false,
                        availability: size.availableStatus || size.availability,
                        material: size.material,
                        frontMaterial: size.frontMaterial,
                        templeMaterial: size.templeMaterial,
                        shape: size.shape,
                        frameType: size.frameType,
                        gender: size.gender,
                        productRank: size.productRank,
                        isNewStyle: size.isNewStyle || false,
                        isBestSeller: size.isBestSeller || false,
                        availableDate: size.availableDate,
                        countryOfOrigin: size.additionalData?.find(d => d.name === 'COUNTRY OF ORIGIN')?.value,
                        fitting: size.additionalData?.find(d => d.name === 'FITTING')?.value
                    });
                }
            }
        }
        
        return {
            found: true,
            searchQuery: searchQuery,
            brand: product.collectionName,
            model: product.styleCode,
            description: product.description,
            category: product.category,
            variants: variants,
            totalVariants: variants.length
        };
    }
    
    /**
     * Cross-reference parsed frame with API data
     */
    crossReferenceFrame(parsedFrame, apiData) {
        if (!apiData.found) {
            return {
                validated: false,
                reason: 'API data not found',
                confidence: 0,
                matches: {}
            };
        }
        
        let confidence = 0;
        let bestMatch = null;
        
        // Look for matching variant
        for (const variant of apiData.variants) {
            let variantScore = 0;
            const matches = {
                brand: false,
                model: false,
                colorCode: false,
                eyeSize: false,
                bridge: false,
                temple: false
            };
            
            // Brand match
            if (parsedFrame.brand.toLowerCase().includes(apiData.brand.toLowerCase()) || 
                apiData.brand.toLowerCase().includes(parsedFrame.brand.toLowerCase())) {
                matches.brand = true;
                variantScore += 20;
            }
            
            // Model match
            const parsedModel = parsedFrame.model.replace(/\s+/g, ' ').trim();
            const apiModel = apiData.model.replace(/\s+/g, ' ').trim();
            if (parsedModel.toLowerCase() === apiModel.toLowerCase() ||
                apiModel.includes(parsedModel) || parsedModel.includes(apiModel)) {
                matches.model = true;
                variantScore += 25;
            }
            
            // Color code match (flexible)
            if (variant.colorCode === parsedFrame.colorCode || 
                variant.colorCode.includes(parsedFrame.colorCode) ||
                parsedFrame.colorCode.includes(variant.colorCode)) {
                matches.colorCode = true;
                variantScore += 20;
            }
            
            // Size matches
            if (variant.eyeSize && variant.eyeSize == parsedFrame.eyeSize) {
                matches.eyeSize = true;
                variantScore += 10;
            }
            
            if (variant.bridge && variant.bridge == parsedFrame.bridge) {
                matches.bridge = true;
                variantScore += 10;
            }
            
            if (variant.temple && variant.temple == parsedFrame.temple) {
                matches.temple = true;
                variantScore += 10;
            }
            
            // Track best match
            if (variantScore > confidence) {
                confidence = variantScore;
                bestMatch = {
                    variant: variant,
                    matches: matches,
                    score: variantScore
                };
            }
        }
        
        const isValidated = confidence >= this.config.minConfidence;
        
        return {
            validated: isValidated,
            confidence: confidence,
            matches: bestMatch ? bestMatch.matches : {},
            bestMatch: bestMatch ? bestMatch.variant : null,
            reason: isValidated ? 'Cross-reference successful' : 'Insufficient matches'
        };
    }
    
    /**
     * Generate search variations for a frame
     */
    generateSearchVariations(frame) {
        const variations = new Set();
        
        // Primary searches
        variations.add(frame.model);
        variations.add(`${frame.brand} ${frame.model}`);
        
        // Remove brand prefix if redundant
        if (frame.model.startsWith(frame.brand.split(' ')[0])) {
            variations.add(frame.model);
        } else {
            variations.add(`${frame.brand.split(' ')[0]} ${frame.model}`);
        }
        
        // Handle special cases
        if (frame.model.startsWith('CH ')) {
            variations.add(`CHESTERFIELD ${frame.model}`);
            variations.add(`CHESTERFIELD ${frame.model.substring(3)}`);
        }
        
        if (frame.model.startsWith('KS ')) {
            variations.add(`KATE SPADE ${frame.model}`);
            variations.add(`KATE SPADE ${frame.model.substring(3)}`);
        }
        
        if (frame.model.startsWith('MIS ')) {
            variations.add(`MISSONI ${frame.model}`);
            variations.add(`MISSONI ${frame.model.substring(4)}`);
        }
        
        return Array.from(variations);
    }
}

module.exports = SafiloService;
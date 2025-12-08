const SafiloService = require('./SafiloService');
const ModernOpticalService = require('./ModernOpticalService');
const IdealOpticsService = require('./IdealOpticsService');
const { parseLamyamericaHtml } = require('./lamyamericaParser');
const LamyamericaService = require('./LamyamericaService');
const { parseKenmarkHtml } = require('./kenmarkParser');
const KenmarkService = require('./KenmarkService');
const { parseLuxotticaHtml } = require('./luxotticaParser');
const { parseEuropaHtml } = require('./europaParser');
const EuropaService = require('./EuropaService');
const { parseMarchonHtml } = require('./marchonParser');
const MarchonService = require('./MarchonService');

/**
 * Parser Registry - Maps vendor domains to their parsers
 * Easily extensible for adding new vendor parsers
 */
class ParserRegistry {
    constructor() {
        // Map vendor domains to their parser functions
        this.parsers = new Map([
            ['modernoptical.com', this.processModernOpticalWithService.bind(this)],
            ['modern-optical.com', this.processModernOpticalWithService.bind(this)],
            ['safilo.com', { parser: this.processSafiloWithService.bind(this), type: 'pdf' }],
            ['safilogroup.com', { parser: this.processSafiloWithService.bind(this), type: 'pdf' }],
            ['noreply@safilo.com', { parser: this.processSafiloWithService.bind(this), type: 'pdf' }], // Add full email format
            ['i-dealoptics.com', this.processIdealOpticsWithService.bind(this)],
            ['lamyamerica.com', this.processLamyamericaWithService.bind(this)],
            ['kenmarkeyewear.com', this.processKenmarkWithService.bind(this)],
            ['luxottica.com', parseLuxotticaHtml],
            ['europaeye.com', this.processEuropaWithService.bind(this)],
            ['marchon.com', this.processMarchonWithService.bind(this)],
            // Add more vendor parsers here as needed
        ]);

        // Initialize SafiloService instance
        this.safiloService = new SafiloService({
            debug: process.env.NODE_ENV !== 'production',
            minConfidence: 50,
            batchSize: 5,
            timeout: 15000
        });

        // Initialize ModernOpticalService instance
        this.modernOpticalService = new ModernOpticalService({
            debug: process.env.NODE_ENV !== 'production',
            timeout: 15000,
            maxRetries: 3,
            enableWebEnrichment: true
        });

        // Initialize IdealOpticsService instance
        this.idealOpticsService = new IdealOpticsService({
            debug: process.env.NODE_ENV !== 'production',
            timeout: 15000,
            maxRetries: 3,
            enableWebEnrichment: true
        });

        // Initialize LamyamericaService instance
        this.lamyamericaService = new LamyamericaService({
            debug: process.env.NODE_ENV !== 'production',
            timeout: 15000,
            maxRetries: 3,
            batchSize: 5
        });

        // Initialize KenmarkService instance
        this.kenmarkService = new KenmarkService({
            debug: process.env.NODE_ENV !== 'production',
            timeout: 15000,
            maxRetries: 3,
            batchSize: 5
        });

        // Initialize MarchonService instance
        this.marchonService = new MarchonService({
            debug: process.env.NODE_ENV !== 'production',
            timeout: 15000,
            maxRetries: 3,
            batchSize: 5
        });

        // Initialize EuropaService instance
        this.europaService = new EuropaService({
            debug: process.env.NODE_ENV !== 'production',
            timeout: 15000,
            maxRetries: 3,
            batchSize: 3 // Lower for web scraping
        });
    }

    /**
     * Process Safilo PDF using SafiloService
     * @param {Buffer} pdfBuffer - PDF buffer
     * @returns {object} Processed order data
     */
    async processSafiloWithService(pdfBuffer) {
        try {
            console.log('🚀 Processing Safilo PDF with enhanced SafiloService...');
            
            // Use SafiloService to process the PDF with API enrichment
            const enrichedResult = await this.safiloService.processOrder(pdfBuffer);
            
            console.log('📊 SafiloService Raw Result:');
            console.log('- Order Info:', enrichedResult.orderInfo);
            console.log('- Frames Count:', enrichedResult.frames?.length);
            console.log('- Statistics:', enrichedResult.statistics);
            
            // Transform SafiloService output to match existing database format
            const transformedResult = this.transformSafiloResult(enrichedResult);
            
            console.log('📋 Transformed Result:');
            console.log('- Account Number:', transformedResult.account_number);
            console.log('- Order Number:', transformedResult.order?.order_number);
            console.log('- Customer Name:', transformedResult.order?.customer_name);
            console.log('- Items Count:', transformedResult.items?.length);
            
            return transformedResult;
            
        } catch (error) {
            console.error('SafiloService processing failed:', error);
            // Fallback to basic parsing if service fails
            throw error;
        }
    }
    
    /**
     * Process Modern Optical HTML using ModernOpticalService
     * @param {string} html - HTML content
     * @param {string} plainText - Plain text content
     * @returns {object} Processed order data
     */
    processModernOpticalWithService(html, plainText) {
        try {
            console.log('🚀 Processing Modern Optical email with ModernOpticalService...');

            // Use ModernOpticalService to parse the email
            const parsedResult = this.modernOpticalService.parseEmail(html, plainText);

            console.log('📊 ModernOpticalService Result:');
            console.log('- Vendor:', parsedResult.vendor);
            console.log('- Order Number:', parsedResult.order?.order_number);
            console.log('- Customer:', parsedResult.order?.customer_name);
            console.log('- Items Count:', parsedResult.items?.length);
            console.log('- Unique Frames:', parsedResult.unique_frames?.length);

            return parsedResult;

        } catch (error) {
            console.error('ModernOpticalService processing failed:', error);
            throw error;
        }
    }

    /**
     * Process Ideal Optics HTML using IdealOpticsService
     * @param {string} html - HTML content
     * @param {string} plainText - Plain text content
     * @returns {object} Processed order data
     */
    processIdealOpticsWithService(html, plainText) {
        try {
            console.log('🚀 Processing Ideal Optics email with IdealOpticsService...');

            // Use IdealOpticsService to parse the email
            const parsedResult = this.idealOpticsService.parseEmail(html, plainText);

            console.log('📊 IdealOpticsService Result:');
            console.log('- Vendor:', parsedResult.vendor);
            console.log('- Order Number:', parsedResult.order?.order_number);
            console.log('- Customer:', parsedResult.order?.customer_name);
            console.log('- Items Count:', parsedResult.items?.length);
            console.log('- Unique Frames:', parsedResult.unique_frames?.length);

            return parsedResult;

        } catch (error) {
            console.error('IdealOpticsService processing failed:', error);
            throw error;
        }
    }

    /**
     * Process L'amyamerica HTML using LamyamericaService
     * @param {string} html - HTML content
     * @param {string} plainText - Plain text content
     * @returns {Promise<object>} Processed order data
     */
    async processLamyamericaWithService(html, plainText) {
        try {
            console.log('🚀 Processing L\'amyamerica email with LamyamericaService...');

            // Parse the email first
            const parsedResult = parseLamyamericaHtml(html, plainText);

            console.log('📊 Initial Parse Result:');
            console.log('- Vendor:', parsedResult.vendor);
            console.log('- Order Number:', parsedResult.orderNumber);
            console.log('- Customer:', parsedResult.customerName);
            console.log('- Items Count:', parsedResult.items?.length);

            // Enrich with API data using UPCs
            const enrichedResult = await this.lamyamericaService.enrichOrderData(parsedResult);

            console.log('📊 Enrichment Complete:');
            console.log('- Enriched Items:', enrichedResult.enrichment?.enrichedItems || 0);
            console.log('- Failed Items:', enrichedResult.enrichment?.failedItems || 0);

            // Transform to standard format
            return this.transformLamyamericaResult(enrichedResult);

        } catch (error) {
            console.error('LamyamericaService processing failed:', error);
            throw error;
        }
    }

    /**
     * Process Kenmark HTML using KenmarkService
     * @param {string} html - HTML content
     * @param {string} plainText - Plain text content
     * @returns {Promise<object>} Processed order data
     */
    async processKenmarkWithService(html, plainText) {
        try {
            console.log('🚀 Processing Kenmark email with KenmarkService...');

            // Parse the email first
            const parsedResult = parseKenmarkHtml(html, plainText);

            console.log('📊 Initial Parse Result:');
            console.log('- Vendor:', parsedResult.vendor);
            console.log('- Order Number:', parsedResult.orderNumber);
            console.log('- Account Number:', parsedResult.accountNumber);
            console.log('- Customer:', parsedResult.customerName);
            console.log('- Items Count:', parsedResult.items?.length);

            // Enrich with API data using UPCs
            const enrichedResult = await this.kenmarkService.enrichOrderData(parsedResult);

            console.log('📊 Enrichment Complete:');
            console.log('- Enriched Items:', enrichedResult.enrichment?.enrichedItems || 0);
            console.log('- Failed Items:', enrichedResult.enrichment?.failedItems || 0);

            // Transform to standard format
            return this.transformKenmarkResult(enrichedResult);

        } catch (error) {
            console.error('KenmarkService processing failed:', error);
            throw error;
        }
    }

    /**
     * Transform L'amyamerica result to match existing database schema
     * @param {object} lamyResult - Result from LamyamericaService
     * @returns {object} Transformed data for database
     */
    transformLamyamericaResult(lamyResult) {
        const items = lamyResult.items.map(item => ({
            sku: `${item.brand.replace(/\s+/g, '_')}-${item.model.replace(/\s+/g, '_')}-${item.colorCode || item.color.replace(/\s+/g, '_')}`,
            brand: item.brand,
            model: item.model,
            color: item.colorName || item.color,
            color_code: item.colorCode,
            color_name: item.colorName,
            size: item.size,
            full_size: item.size,
            temple_length: item.temple,
            quantity: item.quantity || 1,
            vendor: 'L\'amyamerica',

            // UPC from email image URL
            upc: item.upc || null,

            // Enriched API data
            ean: item.enrichedData?.ean || null,
            wholesale_price: item.enrichedData?.wholesale || null,
            msrp: item.enrichedData?.msrp || null,
            in_stock: item.enrichedData?.inStock || null,
            availability: item.enrichedData?.availability || null,
            material: item.enrichedData?.material || null,
            frame_type: item.enrichedData?.frameType || null,
            shape: item.enrichedData?.shape || null,
            gender: item.enrichedData?.gender || null,
            country_of_origin: item.enrichedData?.countryOfOrigin || null,

            // Validation data
            api_verified: item.validation?.validated || false,
            confidence_score: item.validation?.confidence || 0
        }));

        return {
            vendor: 'L\'amyamerica',
            account_number: lamyResult.accountNumber,
            brands: [...new Set(items.map(i => i.brand))],
            order: {
                order_number: lamyResult.orderNumber,
                vendor: 'L\'amyamerica',
                account_number: lamyResult.accountNumber,
                rep_name: lamyResult.repName,
                order_date: lamyResult.orderDate,
                customer_name: lamyResult.customerName,
                phone: lamyResult.customerPhone,
                total_pieces: items.reduce((sum, item) => sum + item.quantity, 0),
                parse_status: 'parsed'
            },
            items: items,
            unique_frames: [...new Set(items.map(i => `${i.brand}-${i.model}`))].map(key => {
                const [brand, model] = key.split('-');
                return { brand, model };
            }),
            parsed_at: new Date().toISOString(),
            parser_version: 'LamyamericaService-1.0',
            enrichment_stats: lamyResult.enrichment
        };
    }

    /**
     * Process Marchon HTML using MarchonService
     * @param {string} html - HTML content
     * @param {string} plainText - Plain text content
     * @returns {Promise<object>} Processed order data
     */
    async processMarchonWithService(html, plainText) {
        try {
            console.log('🚀 Processing Marchon email with MarchonService...');

            // Parse the email first
            const parsedResult = parseMarchonHtml(html, plainText);

            console.log('📊 Initial Parse Result:');
            console.log('- Vendor:', parsedResult.vendor);
            console.log('- Order Number:', parsedResult.orderNumber);
            console.log('- Account Number:', parsedResult.accountNumber);
            console.log('- Customer:', parsedResult.customerName);
            console.log('- Items Count:', parsedResult.items?.length);

            // Enrich with API data using style names and color codes
            const enrichedResult = await this.marchonService.enrichOrderData(parsedResult);

            console.log('📊 Enrichment Complete:');
            console.log('- Enriched Items:', enrichedResult.enrichment?.enrichedItems || 0);
            console.log('- Failed Items:', enrichedResult.enrichment?.failedItems || 0);

            // Transform to standard format
            return this.transformMarchonResult(enrichedResult);

        } catch (error) {
            console.error('MarchonService processing failed:', error);
            throw error;
        }
    }

    /**
     * Transform Marchon result to match existing database schema
     * @param {object} marchonResult - Result from MarchonService
     * @returns {object} Transformed data for database
     */
    transformMarchonResult(marchonResult) {
        const items = marchonResult.items.map(item => ({
            sku: `${item.brand.replace(/\s+/g, '_')}-${item.model.replace(/\s+/g, '_')}-${item.enrichedData?.colorCode || item.colorCode || item.color.replace(/\s+/g, '_')}`,
            brand: item.brand,
            model: item.model,
            color: item.enrichedData?.colorDescription || item.colorName || item.color,
            color_code: item.enrichedData?.colorCode || item.colorCode,
            color_name: item.enrichedData?.colorDescription || item.colorName,
            size: item.size,
            full_size: item.size,
            temple_length: item.enrichedData?.temple || null,
            quantity: item.quantity || 1,
            vendor: 'Marchon',

            // UPC from API enrichment
            upc: item.enrichedData?.upc || null,

            // Enriched API data
            wholesale_price: item.enrichedData?.wholesale || null,
            msrp: item.enrichedData?.msrp || null,
            in_stock: item.enrichedData?.inStock || null,
            stock_status: item.enrichedData?.stockStatus || null,
            material: item.enrichedData?.material || null,
            gender: item.enrichedData?.gender || null,
            rim_type: item.enrichedData?.rimType || null,
            case_name: item.enrichedData?.caseName || null,

            // Marketing info
            marketing_group: item.enrichedData?.marketingGroupDescription || null,

            // Validation data
            api_verified: item.validation?.validated || false,
            confidence_score: item.validation?.confidence || 0
        }));

        return {
            vendor: 'Marchon',
            account_number: marchonResult.accountNumber,
            brands: [...new Set(items.map(i => i.brand))],
            order: {
                order_number: marchonResult.orderNumber,
                vendor: 'Marchon',
                account_number: marchonResult.accountNumber,
                rep_name: marchonResult.repName,
                order_date: marchonResult.orderDate,
                customer_name: marchonResult.customerName,
                terms: marchonResult.terms,
                total_pieces: items.reduce((sum, item) => sum + item.quantity, 0),
                parse_status: 'parsed'
            },
            items: items,
            unique_frames: [...new Set(items.map(i => `${i.brand}-${i.model}`))].map(key => {
                const [brand, ...modelParts] = key.split('-');
                return { brand, model: modelParts.join('-') };
            }),
            parsed_at: new Date().toISOString(),
            parser_version: 'MarchonService-1.0',
            enrichment_stats: marchonResult.enrichment
        };
    }

    /**
     * Process Europa HTML using EuropaService
     * @param {string} html - HTML content
     * @param {string} plainText - Plain text content
     * @returns {Promise<object>} Processed order data
     */
    async processEuropaWithService(html, plainText) {
        try {
            console.log('🚀 Processing Europa email with EuropaService...');

            // Parse the email first
            const parsedResult = parseEuropaHtml(html, plainText);

            console.log('📊 Initial Parse Result:');
            console.log('- Vendor:', parsedResult.vendor);
            console.log('- Order Number:', parsedResult.orderNumber);
            console.log('- Account Number:', parsedResult.accountNumber);
            console.log('- Customer:', parsedResult.customerName);
            console.log('- Items Count:', parsedResult.items?.length);

            // Enrich with web scraped data (UPC, sizing, materials)
            const enrichedResult = await this.europaService.enrichOrderData(parsedResult);

            console.log('📊 Enrichment Complete:');
            console.log('- Enriched Items:', enrichedResult.enrichment?.enrichedItems || 0);
            console.log('- Failed Items:', enrichedResult.enrichment?.failedItems || 0);

            // Transform to standard format
            return this.transformEuropaResult(enrichedResult);

        } catch (error) {
            console.error('EuropaService processing failed:', error);
            throw error;
        }
    }

    /**
     * Transform Europa result to match existing database schema
     * @param {object} europaResult - Result from EuropaService
     * @returns {object} Transformed data for database
     */
    transformEuropaResult(europaResult) {
        const items = europaResult.items.map(item => ({
            sku: `${item.brand.replace(/\s+/g, '_')}-${item.model.replace(/\s+/g, '_')}-${item.enrichedData?.colorNo || item.colorCode || item.color.replace(/\s+/g, '_')}`,
            brand: item.brand,
            model: item.model,
            color: item.enrichedData?.color || item.colorName || item.color,
            color_code: item.enrichedData?.colorNo?.toString() || item.colorCode,
            color_name: item.enrichedData?.color || item.colorName,
            color_family: item.enrichedData?.colorFamily || null,
            size: item.size,
            full_size: item.enrichedData ? `${item.enrichedData.eyeSize}-${item.enrichedData.bridge}-${item.enrichedData.temple}` : item.size,
            eye_size: item.enrichedData?.eyeSize || null,
            bridge: item.enrichedData?.bridge || null,
            temple_length: item.enrichedData?.temple || null,
            quantity: item.quantity || 1,
            vendor: 'Europa',

            // UPC from web scraping
            upc: item.enrichedData?.upc || null,

            // Stock number for future lookups
            stock_no: item.stockNo || item.enrichedData?.stockNo || null,

            // Materials
            front_material: item.enrichedData?.frontMaterial || null,
            temple_material: item.enrichedData?.templeMaterial || null,
            hinge_type: item.enrichedData?.hinge || null,

            // Product details
            gender: item.enrichedData?.gender || null,
            front_shape: item.enrichedData?.frontShape || null,
            collection_name: item.enrichedData?.collectionName || null,

            // Availability from email + web
            in_stock: item.enrichedData?.isAvailable ?? item.inStock,
            availability: item.enrichedData?.availabilityText || item.availability,
            is_back_order: item.enrichedData?.isOnBackOrder || !item.inStock,

            // Images
            front_image_url: item.enrichedData?.frontImageUrl || null,
            profile_image_url: item.enrichedData?.profileImageUrl || null,

            // Validation data
            api_verified: item.validation?.validated || false,
            confidence_score: item.validation?.confidence || 0
        }));

        return {
            vendor: 'Europa',
            account_number: europaResult.accountNumber,
            brands: [...new Set(items.map(i => i.brand))],
            order: {
                order_number: europaResult.orderNumber,
                vendor: 'Europa',
                account_number: europaResult.accountNumber,
                rep_name: europaResult.repName,
                order_date: europaResult.orderDate,
                customer_name: europaResult.customerName,
                phone: europaResult.customerPhone,
                total_pieces: items.reduce((sum, item) => sum + item.quantity, 0),
                parse_status: 'parsed'
            },
            items: items,
            unique_frames: [...new Set(items.map(i => `${i.brand}-${i.model}`))].map(key => {
                const [brand, ...modelParts] = key.split('-');
                return { brand, model: modelParts.join('-') };
            }),
            parsed_at: new Date().toISOString(),
            parser_version: 'EuropaService-1.0',
            enrichment_stats: europaResult.enrichment
        };
    }

    /**
     * Transform Kenmark result to match existing database schema
     * @param {object} kenmarkResult - Result from KenmarkService
     * @returns {object} Transformed data for database
     */
    transformKenmarkResult(kenmarkResult) {
        const items = kenmarkResult.items.map(item => ({
            sku: `${item.brand.replace(/\s+/g, '_')}-${item.model.replace(/\s+/g, '_')}-${item.colorCode || item.color.replace(/\s+/g, '_')}`,
            brand: item.brand,
            model: item.model,
            color: item.colorName || item.color,
            color_code: item.colorCode,
            color_name: item.colorName,
            size: item.size,
            full_size: item.size,
            temple_length: item.temple,
            quantity: item.quantity || 1,
            vendor: 'Kenmark',

            // UPC from email image URL
            upc: item.upc || null,

            // Enriched API data
            ean: item.enrichedData?.ean || null,
            wholesale_price: item.enrichedData?.wholesale || null,
            msrp: item.enrichedData?.msrp || null,
            in_stock: item.enrichedData?.inStock || null,
            availability: item.enrichedData?.availability || null,
            material: item.enrichedData?.material || null,
            frame_type: item.enrichedData?.frameType || null,
            shape: item.enrichedData?.shape || null,
            gender: item.enrichedData?.gender || null,
            country_of_origin: item.enrichedData?.countryOfOrigin || null,

            // Validation data
            api_verified: item.validation?.validated || false,
            confidence_score: item.validation?.confidence || 0
        }));

        return {
            vendor: 'Kenmark',
            account_number: kenmarkResult.accountNumber,
            brands: [...new Set(items.map(i => i.brand))],
            order: {
                order_number: kenmarkResult.orderNumber,
                vendor: 'Kenmark',
                account_number: kenmarkResult.accountNumber,
                rep_name: kenmarkResult.repName,
                order_date: kenmarkResult.orderDate,
                customer_name: kenmarkResult.customerName,
                phone: kenmarkResult.customerPhone,
                total_pieces: items.reduce((sum, item) => sum + item.quantity, 0),
                parse_status: 'parsed'
            },
            items: items,
            unique_frames: [...new Set(items.map(i => `${i.brand}-${i.model}`))].map(key => {
                const [brand, model] = key.split('-');
                return { brand, model };
            }),
            parsed_at: new Date().toISOString(),
            parser_version: 'KenmarkService-1.0',
            enrichment_stats: kenmarkResult.enrichment
        };
    }

    /**
     * Transform SafiloService result to match existing database schema
     * @param {object} safiloResult - Result from SafiloService.processOrder
     * @returns {object} Transformed data for database
     */
    transformSafiloResult(safiloResult) {
        const { orderInfo, frames, statistics } = safiloResult;
        
        // Transform frames to items format expected by database
        const items = frames.map(frame => ({
            // Basic frame data
            sku: `${frame.brand.replace(/\s+/g, '_')}-${frame.model.replace(/[\s\/]/g, '_')}-${frame.colorCode}`,
            brand: frame.brand,
            model: frame.model,
            color: frame.colorName,
            color_code: frame.colorCode,
            color_name: frame.colorName,
            size: frame.size,
            full_size: frame.size,
            temple_length: frame.temple,
            quantity: frame.quantity || 1,
            vendor: 'Safilo',
            
            // Enriched API data (if available)
            upc: frame.enrichedData?.upc || null,
            ean: frame.enrichedData?.ean || null,
            wholesale_price: frame.enrichedData?.wholesale || null,
            msrp: frame.enrichedData?.msrp || null,
            in_stock: frame.enrichedData?.inStock || null,
            availability: frame.enrichedData?.availability || null,
            material: frame.enrichedData?.material || null,
            country_of_origin: frame.enrichedData?.countryOfOrigin || null,
            
            // Validation data
            api_verified: frame.validation?.validated || false,
            confidence_score: frame.validation?.confidence || 0,
            validation_reason: frame.validation?.reason || null
        }));
        
        return {
            vendor: 'Safilo',
            account_number: orderInfo.accountNumber,
            brands: [...new Set(frames.map(f => f.brand))],
            order: {
                order_number: orderInfo.orderNumber, // Now the correct Order Reference Number
                reference_number: orderInfo.eyeRepOrderNumber, // Store EyeRep number as reference
                vendor: 'Safilo',
                account_number: orderInfo.accountNumber,
                customer_name: orderInfo.customerName,
                customer_code: orderInfo.customerCode,
                placed_by: orderInfo.placedBy,
                order_date: orderInfo.orderDate,
                phone: orderInfo.customerPhone,
                total_pieces: items.reduce((sum, item) => sum + item.quantity, 0),
                parse_status: 'parsed'
            },
            items: items,
            parsed_at: new Date().toISOString(),
            parser_version: 'SafiloService-1.0',
            // Include statistics for monitoring
            enrichment_stats: statistics
        };
    }

    /**
     * Get parser for a vendor based on email domain
     * @param {string} fromEmail - The sender's email address
     * @returns {object|function|null} Parser info object or function, null if not found
     */
    getParser(fromEmail) {
        if (!fromEmail) return null;
        
        const domain = this.extractDomain(fromEmail);
        return this.parsers.get(domain) || null;
    }

    /**
     * Check if a vendor has a parser available
     * @param {string} fromEmail - The sender's email address
     * @returns {boolean} True if parser exists
     */
    hasParser(fromEmail) {
        return this.getParser(fromEmail) !== null;
    }

    /**
     * Parse email using appropriate vendor parser
     * @param {string} fromEmail - The sender's email address
     * @param {string} html - HTML content of the email
     * @param {string} plainText - Plain text content of the email
     * @param {object} attachments - Email attachments
     * @returns {object|null} Parsed data or null if no parser found
     */
    async parseEmail(fromEmail, html, plainText, attachments = []) {
        const parserInfo = this.getParser(fromEmail);
        if (!parserInfo) {
            return this.createFallbackData(fromEmail, html, plainText);
        }

        try {
            // Handle new parser format (object with parser and type)
            if (typeof parserInfo === 'object' && parserInfo.parser) {
                if (parserInfo.type === 'pdf') {
                    // For PDF parsers, look for PDF attachment
                    const pdfAttachment = attachments?.find(att => 
                        att.content_type === 'application/pdf' || 
                        att.file_name?.toLowerCase().endsWith('.pdf')
                    );
                    
                    if (pdfAttachment && pdfAttachment.content) {
                        // Convert base64 to buffer if needed
                        const pdfBuffer = Buffer.isBuffer(pdfAttachment.content) 
                            ? pdfAttachment.content 
                            : Buffer.from(pdfAttachment.content, 'base64');
                        return await parserInfo.parser(pdfBuffer);
                    } else {
                        console.log('No PDF attachment found for PDF parser');
                        return this.createFallbackData(fromEmail, html, plainText);
                    }
                }
            } else {
                // Legacy HTML parser format (direct function)
                return parserInfo(html, plainText);
            }
        } catch (error) {
            console.error(`Parser error for ${fromEmail}:`, error);
            return this.createFallbackData(fromEmail, html, plainText);
        }
    }

    /**
     * Extract domain from email address or return domain if already extracted
     * @param {string} emailOrDomain - Email address or domain
     * @returns {string} Domain part of the email
     */
    extractDomain(emailOrDomain) {
        // If it's already a domain (no @ symbol), return it as-is
        if (!emailOrDomain.includes('@')) {
            return emailOrDomain.toLowerCase();
        }
        
        // Otherwise extract domain from email
        const match = emailOrDomain.match(/@([^@]+)$/);
        return match ? match[1].toLowerCase() : '';
    }

    /**
     * Create fallback data for emails without specific parsers
     * @param {string} fromEmail - The sender's email address
     * @param {string} html - HTML content
     * @param {string} plainText - Plain text content
     * @returns {object} Basic parsed data structure
     */
    createFallbackData(fromEmail, html, plainText) {
        const domain = this.extractDomain(fromEmail);
        const vendorName = this.guessVendorName(domain);

        return {
            vendor: vendorName,
            account_number: '',
            brands: [],
            order: {
                order_number: '',
                vendor: vendorName,
                account_number: '',
                rep_name: '',
                order_date: '',
                customer_name: '',
                total_pieces: 0,
                parse_status: 'failed'
            },
            items: [],
            parsed_at: new Date().toISOString(),
            parser_version: 'fallback',
            raw_content: {
                html: html,
                plain_text: plainText
            }
        };
    }

    /**
     * Attempt to guess vendor name from domain
     * @param {string} domain - Email domain
     * @returns {string} Guessed vendor name
     */
    guessVendorName(domain) {
        // Remove common TLD and convert to title case
        const name = domain
            .replace(/\.(com|net|org|biz)$/, '')
            .split(/[-.]/)
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
        
        return name || 'Unknown Vendor';
    }

    /**
     * Register a new parser for a vendor domain
     * @param {string} domain - Vendor domain
     * @param {function|object} parser - Parser function or parser info object
     */
    registerParser(domain, parser) {
        this.parsers.set(domain.toLowerCase(), parser);
    }

    /**
     * Get list of supported vendor domains
     * @returns {string[]} Array of supported domains
     */
    getSupportedDomains() {
        return Array.from(this.parsers.keys());
    }

    /**
     * Check if vendor requires PDF attachment
     * @param {string} fromEmail - The sender's email address
     * @returns {boolean} True if vendor uses PDF parser
     */
    requiresPDF(fromEmail) {
        const parserInfo = this.getParser(fromEmail);
        return parserInfo && typeof parserInfo === 'object' && parserInfo.type === 'pdf';
    }

    /**
     * Get Modern Optical service instance for enrichment
     * @returns {ModernOpticalService} Service instance
     */
    getModernOpticalService() {
        return this.modernOpticalService;
    }

    /**
     * Get Safilo service instance
     * @returns {SafiloService} Service instance
     */
    getSafiloService() {
        return this.safiloService;
    }

    /**
     * Get Ideal Optics service instance for enrichment
     * @returns {IdealOpticsService} Service instance
     */
    getIdealOpticsService() {
        return this.idealOpticsService;
    }

    /**
     * Get L'amyamerica service instance for enrichment
     * @returns {LamyamericaService} Service instance
     */
    getLamyamericaService() {
        return this.lamyamericaService;
    }

    /**
     * Get Kenmark service instance for enrichment
     * @returns {KenmarkService} Service instance
     */
    getKenmarkService() {
        return this.kenmarkService;
    }

    /**
     * Get Marchon service instance for enrichment
     * @returns {MarchonService} Service instance
     */
    getMarchonService() {
        return this.marchonService;
    }

    /**
     * Get Europa service instance for enrichment
     * @returns {EuropaService} Service instance
     */
    getEuropaService() {
        return this.europaService;
    }
}

// Export singleton instance
const parserRegistry = new ParserRegistry();
module.exports = parserRegistry;
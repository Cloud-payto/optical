const SafiloService = require('./SafiloService');
const ModernOpticalService = require('./ModernOpticalService');

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
            // Add more vendor parsers here as needed
            // Example: ['luxottica.com', parseLuxotticaHtml],
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
            validation_reason: frame.validation?.reason || null,
            
            // Additional metadata
            full_name: `${frame.brand} ${frame.model}`
        }));
        
        return {
            vendor: 'Safilo',
            account_number: orderInfo.accountNumber,
            brands: [...new Set(frames.map(f => f.brand))],
            order: {
                order_number: orderInfo.orderNumber,
                reference_number: orderInfo.referenceNumber,
                vendor: 'Safilo',
                account_number: orderInfo.accountNumber,
                customer_name: orderInfo.customerName,
                customer_code: orderInfo.customerCode,
                placed_by: orderInfo.placedBy,
                order_date: orderInfo.orderDate,
                phone: orderInfo.customerPhone,
                total_pieces: items.reduce((sum, item) => sum + item.quantity, 0),
                parse_status: 'success'
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
}

// Export singleton instance
const parserRegistry = new ParserRegistry();
module.exports = parserRegistry;
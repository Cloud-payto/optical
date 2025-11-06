const pdfParse = require('pdf-parse');

/**
 * ETNIA BARCELONA SERVICE - PDF Processing
 *
 * This service processes Etnia Barcelona sales order PDFs and extracts:
 * 1. Order information (order number, date, customer details)
 * 2. Frame data (model, color, size, UPC, pricing, quantity)
 *
 * Usage:
 *   const service = new EtniaBarcelonaService();
 *   const result = await service.processOrder(pdfBuffer);
 */
class EtniaBarcelonaService {
    constructor(options = {}) {
        this.config = {
            debug: options.debug || false,
            vendor: 'etnia_barcelona'
        };

        this.resetStats();
    }

    resetStats() {
        this.stats = {
            totalFrames: 0,
            processingStartTime: null,
            processingEndTime: null
        };
    }

    log(...args) {
        if (this.config.debug) {
            console.log(...args);
        }
    }

    /**
     * Main entry point - processes PDF buffer and returns structured data
     */
    async processOrder(pdfBuffer, options = {}) {
        this.resetStats();
        this.stats.processingStartTime = Date.now();

        try {
            console.log('🔍 Processing Etnia Barcelona order PDF...\n');

            // Parse PDF
            const parsedData = await this.parsePDF(pdfBuffer);
            console.log(`✅ Parsed ${parsedData.frames.length} frames from PDF\n`);

            this.stats.processingEndTime = Date.now();
            const processingTime = ((this.stats.processingEndTime - this.stats.processingStartTime) / 1000).toFixed(2);

            console.log(`🎉 Processing complete in ${processingTime}s`);
            console.log(`📊 Results: ${this.stats.totalFrames} frames parsed`);

            return parsedData;

        } catch (error) {
            console.error('❌ EtniaBarcelonaService error:', error.message);
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

        this.stats.totalFrames = frames.length;

        // Calculate statistics
        const statistics = {
            totalFrames: frames.length,
            totalPieces: frames.reduce((sum, frame) => sum + (frame.quantity || 0), 0),
            totalValue: frames.reduce((sum, frame) => sum + (frame.finalPrice || 0), 0),
            uniqueModels: [...new Set(frames.map(f => f.model))].length
        };

        return {
            metadata: {
                parsedAt: new Date().toISOString(),
                pdfPages: pdfData.numpages,
                textLength: text.length,
                framesFound: frames.length,
                serviceVersion: '1.0',
                vendor: this.config.vendor
            },
            orderInfo: orderInfo,
            frames: frames,
            statistics: statistics
        };
    }

    /**
     * Parse order header information
     */
    parseOrderHeader(text) {
        const lines = text.split('\n').map(line => line.trim());

        const orderInfo = {
            orderNumber: '',
            orderDate: '',
            customerID: '',
            customerReference: '',
            customerName: '',
            customerAddress: '',
            shipToName: '',
            shipToAddress: '',
            accountNumber: ''
        };

        // Parse Order Number - "Sales Order 1201039424"
        const orderMatch = text.match(/Sales Order\s+(\d+)/);
        if (orderMatch) {
            orderInfo.orderNumber = orderMatch[1];
        }

        // Parse Date - format: 09/15/2025
        // The date can appear in different ways:
        // 1. In table format: "Date                09/15/2025" (with multiple spaces/tabs)
        // 2. On line items: "09/15/2025" at the start after reference
        const dateMatch = text.match(/Date[\s\t]+(\d{2}\/\d{2}\/\d{4})/i) ||
                          text.match(/\n(\d{2}\/\d{2}\/\d{4})\n/);
        if (dateMatch) {
            orderInfo.orderDate = dateMatch[1];
        }

        // Parse Customer ID - can have multiple spaces/tabs like the date
        // Also try matching across lines
        let customerIDMatch = text.match(/Customer ID[\s\t]+(\d+)/i);
        if (!customerIDMatch) {
            // Try matching across newlines
            customerIDMatch = text.match(/Customer ID[\s\t\n]+(\d+)/i);
        }
        if (customerIDMatch) {
            orderInfo.customerID = customerIDMatch[1];
            orderInfo.accountNumber = customerIDMatch[1]; // Use Customer ID as account number
        }

        // Parse Customer Reference - can have multiple spaces/tabs
        // Also try matching across lines
        let refMatch = text.match(/Customer Reference[\s\t]+([\w\-]+)/i);
        if (!refMatch) {
            // Try matching across newlines
            refMatch = text.match(/Customer Reference[\s\t\n]+([\w\-]+)/i);
        }
        if (refMatch) {
            orderInfo.customerReference = refMatch[1];
        }

        // Parse Billing Address - find customer name
        const billingMatch = text.match(/Billing Address:\s*\n\s*([A-Z][A-Z\s]+)\s*\n/);
        if (billingMatch) {
            orderInfo.customerName = billingMatch[1].trim();
        }

        // Parse full billing address
        const addressMatch = text.match(/Billing Address:\s*\n\s*([^\n]+)\s*\n\s*([^\n]+)\s*\n\s*([^\n]+)/);
        if (addressMatch) {
            orderInfo.customerAddress = `${addressMatch[2].trim()}, ${addressMatch[3].trim()}`;
        }

        // Parse Shipping Address (usually same as billing)
        const shippingMatch = text.match(/Shipping Address:\s*\n\s*([A-Z][A-Z\s]+)\s*\n/);
        if (shippingMatch) {
            orderInfo.shipToName = shippingMatch[1].trim();
        } else {
            orderInfo.shipToName = orderInfo.customerName;
        }

        const shipAddressMatch = text.match(/Shipping Address:\s*\n\s*([^\n]+)\s*\n\s*([^\n]+)\s*\n\s*([^\n]+)/);
        if (shipAddressMatch) {
            orderInfo.shipToAddress = `${shipAddressMatch[2].trim()}, ${shipAddressMatch[3].trim()}`;
        } else {
            orderInfo.shipToAddress = orderInfo.customerAddress;
        }

        // Debug logging
        console.log('📋 Parsed Order Info:');
        console.log('  - Order Number:', orderInfo.orderNumber);
        console.log('  - Date:', orderInfo.orderDate);
        console.log('  - Customer ID:', orderInfo.customerID);
        console.log('  - Customer:', orderInfo.customerName);
        console.log('  - Reference:', orderInfo.customerReference);

        return orderInfo;
    }

    /**
     * Parse frames from PDF text
     */
    parseFrames(text) {
        const lines = text.split('\n').map(line => line.trim());
        const frames = [];

        // Pattern to identify frame start lines
        // In the PDF, reference is split across two lines:
        // "ORDI-EB-"
        // "AAAFC600071"
        // Followed by date and item number

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];

            // Look for lines starting with date pattern followed by item number
            // Example: "09/15/2025100000000019343001"
            const dateItemMatch = line.match(/^(\d{2}\/\d{2}\/\d{4})(\d+)/);
            if (!dateItemMatch) {
                continue;
            }

            // This is a frame data line
            const orderDate = dateItemMatch[1];
            const referenceNumber = dateItemMatch[2];

            // Collect all lines for this frame
            // Structure:
            // Line i: Date + Item number
            // Line i+1: Model (e.g., "4 RANIA 53O TQGR")
            // Line i+2-4: Description (spans 2-3 lines, ends with size like "53-19-142 (O)")
            // Line after desc: UPC (13 digits)
            // Line after UPC: Pricing (e.g., "1.00 PC120.00 USD10.00%108.00 USD")

            if (i + 1 >= lines.length) continue;
            const modelLine = lines[i + 1];

            // Collect description lines until we hit a line that's just a 13-digit UPC
            const descLines = [];
            let currentLine = i + 2;
            while (currentLine < lines.length && currentLine < i + 6) {
                const line = lines[currentLine];
                // Stop if we hit a UPC (13 digits)
                if (line.match(/^\d{13}$/)) {
                    break;
                }
                // Stop if we hit pricing pattern
                if (line.match(/^\d+\.\d+\s+PC/)) {
                    break;
                }
                // Stop if we hit another frame
                if (line.match(/^\d{2}\/\d{2}\/\d{4}\d+/)) {
                    break;
                }
                descLines.push(line);
                currentLine++;
            }

            // Next line should be UPC
            if (currentLine >= lines.length) continue;
            const upcLine = lines[currentLine];

            // Next line should be pricing
            if (currentLine + 1 >= lines.length) continue;
            const priceLine = lines[currentLine + 1];

            // Parse this frame
            const frameInfo = this.parseFrameData({
                referenceNumber,
                modelLine,
                descLines: descLines,
                upcLine: upcLine,
                priceLine: priceLine,
                lineNumber: i + 1
            });

            if (frameInfo) {
                frames.push(frameInfo);
            }

            // Skip the lines we consumed
            i = currentLine + 1;
        }

        return frames;
    }

    /**
     * Parse individual frame data
     */
    parseFrameData(data) {
        const { referenceNumber, modelLine, descLines, upcLine, priceLine, lineNumber } = data;

        try {
            // Parse model line: "4 RANIA 53O TQGR" or "5 NILA 54S BKHV"
            const modelMatch = modelLine.match(/^[\d\s]+(.+)$/);
            if (!modelMatch) {
                this.log(`Line ${lineNumber}: Could not parse model from:`, modelLine);
                return null;
            }

            const fullModel = modelMatch[1].trim();

            // Combine all description lines into one string
            const fullDescription = descLines.join(' ').trim();

            // Parse description to get material, frame type, color, and size
            // Example: "RANIA 53O TQGR - METAL OPTICAL TURQUOISE. GREEN 53-19-142 (O)"
            // Or: "COCO Grey Havana - Acetate Optical Frame 51-16-140"

            let modelName = '';
            let material = '';
            let frameType = '';
            let colorDescription = '';
            let sizeString = '';

            // Pattern 1: Standard format with ALL-CAPS material and type
            // "RANIA 53O TQGR - METAL OPTICAL TURQUOISE. GREEN 53-19-142 (O)"
            // Material must be ALL CAPS, and there should NOT be "Frame" keyword after OPTICAL/SUN
            const pattern1 = /^.+?\s+-\s+([A-Z]+)\s+(OPTICAL|SUN)\s+(?!Frame\s)(.+?)\s+(\d{2}-\d{2}-\d{3})/i;
            const match1 = fullDescription.match(pattern1);

            if (match1) {
                material = match1[1].trim();
                frameType = match1[2].trim();
                // Extract just the color part (everything between frame type and size)
                colorDescription = match1[3].trim()
                    .replace(/\s*\(\w\)\s*$/, '') // Remove trailing (O) or (S)
                    .replace(/\.$/, '') // Remove trailing period
                    .trim();
                sizeString = match1[4].trim();

                // Extract model name from fullModel instead
                modelName = fullModel.split(/\s+\d+/)[0]; // Get the model name before the size code
            } else {
                // Pattern 2: Alternative format with "Frame" keyword
                // "COCO Grey Havana - Acetate Optical Frame 51-16-140"
                const pattern2 = /^(.+?)\s+-\s+([A-Za-z]+)\s+(Optical|Sun)\s+Frame\s+(\d{2}-\d{2}-\d{3})/i;
                const match2 = fullDescription.match(pattern2);

                if (match2) {
                    const fullModelAndColor = match2[1].trim();
                    material = match2[2].trim();
                    frameType = match2[3].trim().toUpperCase();
                    sizeString = match2[4].trim();

                    // For "COCO Grey Havana", extract "Grey Havana" as color
                    // Split by the model code pattern (e.g., "51O", "54S")
                    const modelColorSplit = fullModelAndColor.match(/^([A-Z]+)\s+(.+)$/);
                    if (modelColorSplit) {
                        modelName = modelColorSplit[1];
                        colorDescription = modelColorSplit[2];
                    } else {
                        // Fallback: first word is model
                        const parts = fullModelAndColor.split(/\s+/);
                        modelName = parts[0];
                        colorDescription = parts.slice(1).join(' ');
                    }
                } else {
                    // Pattern 3: Lowercase format
                    // "ROADRUNNER 56O HVGR - acetate optical frame havana verde 56-16-148"
                    const pattern3 = /^.+?\s+-\s+([a-z]+)\s+(optical|sun)\s+frame\s+(.+?)\s+(\d{2}-\d{2}-\d{3})/i;
                    const match3 = fullDescription.match(pattern3);

                    if (match3) {
                        material = match3[1].trim().toUpperCase();
                        frameType = match3[2].trim().toUpperCase();
                        colorDescription = match3[3].trim();
                        sizeString = match3[4].trim();
                        // Extract model name from fullModel instead
                        modelName = fullModel.split(/\s+\d+/)[0];
                    } else {
                        // Fallback: just extract size
                        const sizeOnlyMatch = fullDescription.match(/(\d{2}-\d{2}-\d{3})/);
                        if (sizeOnlyMatch) {
                            sizeString = sizeOnlyMatch[1];
                        }

                        // Use full description as color
                        colorDescription = fullDescription.replace(/\s*\(\w\)\s*$/, '').trim();

                        // Try to extract material and type from anywhere in description
                        if (fullDescription.match(/ACETATE/i)) material = 'ACETATE';
                        if (fullDescription.match(/METAL/i)) material = 'METAL';
                        if (fullDescription.match(/OPTICAL/i)) frameType = 'OPTICAL';
                        if (fullDescription.match(/SUN/i)) frameType = 'SUN';
                    }
                }
            }

            // Parse size string: "53-19-142" -> eye-bridge-temple
            let size = '';
            let eyeSize = '';
            let bridge = '';
            let temple = '';

            if (sizeString) {
                const sizeParts = sizeString.split('-');
                if (sizeParts.length === 3) {
                    eyeSize = sizeParts[0];
                    bridge = sizeParts[1];
                    temple = sizeParts[2];
                    size = sizeString;
                }
            }

            // Parse UPC (should be 13 digits)
            const upcMatch = upcLine.match(/(\d{13})/);
            const upc = upcMatch ? upcMatch[1] : '';

            // Parse pricing line: "1.00 PC120.00 USD10.00%108.00 USD" (NO SPACES!)
            // We want the Unit Price (wholesale), not the final discounted price
            const priceMatch = priceLine.match(/([\d.]+)\s*PC([\d.]+)\s*USD([\d.]+)%([\d.]+)\s*USD/);

            let quantity = 1;
            let unitPrice = 0;
            let discount = 0;
            let finalPrice = 0;

            if (priceMatch) {
                quantity = parseFloat(priceMatch[1]);
                unitPrice = parseFloat(priceMatch[2]); // This is the wholesale unit price
                discount = parseFloat(priceMatch[3]);
                finalPrice = parseFloat(priceMatch[4]); // This is discounted total
            }

            // Extract color code from model (last part usually)
            // Example: "RANIA 53O TQGR" -> color code is "TQGR"
            const colorCodeMatch = fullModel.match(/([A-Z]{4,6})$/);
            const colorCode = colorCodeMatch ? colorCodeMatch[1] : '';

            // Brand is always "ETNIA BARCELONA"
            const brand = 'ETNIA BARCELONA';

            // Create SKU
            const sku = `${brand.replace(/\s+/g, '_')}-${fullModel.replace(/\s+/g, '_')}`;

            return {
                // Reference
                referenceNumber: referenceNumber,

                // Frame identifiers
                brand: brand,
                model: fullModel,
                modelName: modelName || fullModel.split(' ')[0], // First word is usually model name
                colorCode: colorCode,
                colorName: colorDescription,

                // Size information
                size: size,
                eyeSize: eyeSize,
                bridge: bridge,
                temple: temple,
                fullSize: sizeString,

                // Product details
                material: material,
                frameType: frameType, // "OPTICAL" or "SUN"
                upc: upc,
                sku: sku,

                // Pricing - use unitPrice (wholesale) as the wholesale_price
                quantity: quantity,
                unitPrice: unitPrice, // Original unit price before discount
                discount: discount,
                wholesalePrice: unitPrice, // Use unit price as wholesale (what we store)
                finalPrice: finalPrice, // Discounted total for this quantity

                // Raw data for debugging
                rawDescription: fullDescription
            };
        } catch (error) {
            this.log(`Error parsing frame at line ${lineNumber}:`, error.message);
            return null;
        }
    }
}

module.exports = EtniaBarcelonaService;

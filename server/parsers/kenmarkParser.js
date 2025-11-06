const cheerio = require('cheerio');

/**
 * Parse Kenmark HTML emails
 *
 * Kenmark uses the jiecosystem backend (same as L'amyamerica and Modern Optical)
 * Email structure:
 * - Subject: "Kenmark Eyewear: Your Receipt for Order Number [number]"
 * - From: noreply@kenmarkeyewear.com
 * - HTML table with Order, Customer, Ship To, Order Items sections
 * - Image URLs contain UPC: https://imageserver.jiecosystem.net/image/kenmark/[UPC]
 *
 * @param {string} html - The HTML content of the email
 * @param {string} plainText - The plain text content of the email
 * @returns {object} Parsed order data
 */
function parseKenmarkHtml(html, plainText) {
    const textToUse = plainText || html;

    // Identify vendor
    const vendor = 'Kenmark';

    console.log('📋 Kenmark Parser - Starting...');

    // Extract order details
    const orderNumberMatch = textToUse.match(/(?:Order Number|Receipt for Order Number)[:\s]*(\d+)/i);
    const orderNumber = orderNumberMatch ? orderNumberMatch[1] : '';

    const repName = textToUse.match(/Placed By Rep:\s*([^\n]+)/)?.[1]?.trim() || '';
    const orderDate = textToUse.match(/Date:\s*([\d\/]+)/)?.[1]?.trim() || '';

    console.log('📋 Order Details:');
    console.log('  Order Number:', orderNumber);
    console.log('  Rep Name:', repName);
    console.log('  Order Date:', orderDate);

    // Extract customer information
    const customerInfo = extractCustomerInfo(textToUse, html);

    console.log('  Account Number:', customerInfo.accountNumber);
    console.log('  Customer Name:', customerInfo.customerName);

    // Extract items from HTML table
    const items = extractItems(html);

    console.log(`  Items Found: ${items.length}`);

    // Calculate total quantity
    const totalQuantity = items.reduce((sum, item) => sum + item.quantity, 0);

    return {
        vendor: vendor,
        vendorCode: 'kenmark',
        orderNumber: orderNumber,
        orderDate: orderDate,
        repName: repName,
        accountNumber: customerInfo.accountNumber,
        customerName: customerInfo.customerName,
        customerAddress: customerInfo.customerAddress,
        customerPhone: customerInfo.customerPhone,
        shipToName: customerInfo.shipToName,
        shipToAddress: customerInfo.shipToAddress,
        items: items,
        totalQuantity: totalQuantity,
        totalItems: items.length,
        metadata: {
            parsedAt: new Date().toISOString(),
            parserVersion: '1.0',
            source: 'email'
        }
    };
}

/**
 * Extract customer information from email
 */
function extractCustomerInfo(textToUse, html) {
    const customerInfo = {
        accountNumber: '',
        customerName: '',
        customerAddress: '',
        customerPhone: '',
        shipToName: '',
        shipToAddress: ''
    };

    // Extract account number - pattern: "CUSTOMER NAME (19903)"
    const accountMatch = textToUse.match(/\((\d{5,10})\)/);
    if (accountMatch) {
        customerInfo.accountNumber = accountMatch[1];
    }

    // Extract customer name using HTML parsing for accuracy
    if (html) {
        const $ = cheerio.load(html);

        // Look for customer section
        // Pattern: <h3>Customer</h3> followed by <p> with name and account
        $('h3').each((i, elem) => {
            const headerText = $(elem).text().trim();
            if (headerText === 'Customer') {
                const nextP = $(elem).next('p');
                if (nextP.length) {
                    const text = nextP.text();
                    // Extract name from pattern: "NAME (ACCOUNT)"
                    const nameMatch = text.match(/([A-Z][A-Za-z0-9\s&.,'-]+?)\s*\((\d{5,10})\)/);
                    if (nameMatch) {
                        customerInfo.customerName = nameMatch[1].trim();
                        customerInfo.accountNumber = nameMatch[2];
                    }

                    // Extract address (lines after name)
                    const lines = text.split('\n').map(l => l.trim()).filter(l => l);
                    if (lines.length > 1) {
                        // Skip first line (name with account), take next lines as address
                        const addressLines = lines.slice(1).filter(l =>
                            !l.match(/^Phone:/i) &&
                            !l.match(/^\(\d+\)$/)
                        );
                        customerInfo.customerAddress = addressLines.join(', ');
                    }

                    // Extract phone
                    const phoneMatch = text.match(/Phone:\s*([0-9().\s-]+)/i);
                    if (phoneMatch) {
                        customerInfo.customerPhone = phoneMatch[1].trim();
                    }
                }
            } else if (headerText === 'Ship To' || headerText === 'Ship to') {
                const nextP = $(elem).next('p');
                if (nextP.length) {
                    const text = nextP.text();
                    const lines = text.split('\n').map(l => l.trim()).filter(l => l);
                    if (lines.length > 0) {
                        // First line might contain name + account, extract just name
                        const firstLine = lines[0];
                        const nameMatch = firstLine.match(/([A-Z][A-Za-z0-9\s&.,'-]+?)\s*\(\d+\)/);
                        customerInfo.shipToName = nameMatch ? nameMatch[1].trim() : firstLine;

                        customerInfo.shipToAddress = lines.slice(1).filter(l =>
                            !l.match(/^Phone:/i)
                        ).join(', ');
                    }
                }
            }
        });
    }

    // Fallback to plain text parsing if HTML parsing didn't work
    if (!customerInfo.customerName) {
        const nameMatch = textToUse.match(/([A-Z][A-Za-z0-9\s&.,'-]{3,60}?)\s*\((\d{5,10})\)/);
        if (nameMatch) {
            customerInfo.customerName = nameMatch[1].trim();
            if (!customerInfo.accountNumber) {
                customerInfo.accountNumber = nameMatch[2];
            }
        }
    }

    return customerInfo;
}

/**
 * Extract items from HTML table
 * Key feature: Extract UPC from image URLs!
 * Image URL format: https://imageserver.jiecosystem.net/image/kenmark/715317146401
 * The last segment is the UPC/barcode
 */
function extractItems(html) {
    const items = [];

    try {
        const $ = cheerio.load(html);

        // Kenmark emails have items in table format
        // Table structure: Image | Model | Color | Size | Qty
        $('tbody tr').each((index, row) => {
            const $row = $(row);
            const cells = $row.find('td');

            // Skip empty separator rows or header rows
            if (cells.length < 5) {
                return; // continue to next row
            }

            // Extract data from each cell
            const imageCell = $(cells[0]);
            const modelCell = $(cells[1]).text().trim();
            const colorCell = $(cells[2]).text().trim();
            const sizeCell = $(cells[3]).text().trim();
            const qtyCell = $(cells[4]).text().trim();

            // Check if this row contains actual frame data
            if (modelCell && colorCell && qtyCell &&
                !modelCell.includes('Model') &&
                !modelCell.includes('Image')) {

                // Extract UPC from image URL
                let upc = '';
                const imgSrc = imageCell.find('img').attr('src');
                if (imgSrc) {
                    // Decode URL first (handles %2f encoding and linkprotect wrappers)
                    let decodedSrc = decodeURIComponent(imgSrc);

                    // Handle linkprotect URLs - extract actual URL
                    if (decodedSrc.includes('linkprotect.cudasvc.com')) {
                        const urlMatch = decodedSrc.match(/[?&]a=([^&]+)/);
                        if (urlMatch) {
                            decodedSrc = decodeURIComponent(urlMatch[1]);
                        }
                    }

                    // Extract UPC from URL: https://imageserver.jiecosystem.net/image/kenmark/715317146401
                    const upcMatch = decodedSrc.match(/\/kenmark\/(\d+)/) || imgSrc.match(/kenmark%2f(\d+)/i);
                    if (upcMatch) {
                        upc = upcMatch[1];
                    }
                }

                // Parse the model field which may contain "BRAND - MODEL" or just "MODEL"
                let brandPart = 'Kenmark'; // Default brand
                let modelPart = modelCell;

                if (modelCell.includes(' - ')) {
                    const parts = modelCell.split(' - ');
                    brandPart = parts[0].trim();
                    modelPart = parts[1].trim();
                }

                const cleanBrand = brandPart.trim();
                const cleanModel = modelPart.trim();
                const cleanColor = colorCell.trim();

                // Extract color code if present (e.g., "C01 BLACK" -> code: "C01", name: "BLACK")
                let colorCode = '';
                let colorName = cleanColor;
                const colorMatch = cleanColor.match(/^([A-Z0-9]{2,4})\s+(.+)$/);
                if (colorMatch) {
                    colorCode = colorMatch[1];
                    colorName = colorMatch[2];
                }

                // Parse size (may be just eye size or full size)
                const size = sizeCell.trim();
                const quantity = parseInt(qtyCell.trim()) || 1;

                // Parse size components if available
                let eyeSize = size;
                let bridge = '';
                let temple = '';
                const sizeMatch = size.match(/(\d{2})[-\/](\d{2})[-\/](\d{3})/);
                if (sizeMatch) {
                    eyeSize = sizeMatch[1];
                    bridge = sizeMatch[2];
                    temple = sizeMatch[3];
                }

                const item = {
                    brand: cleanBrand,
                    model: cleanModel,
                    colorCode: colorCode,
                    colorName: colorName,
                    color: cleanColor,
                    size: size,
                    eyeSize: eyeSize,
                    bridge: bridge,
                    temple: temple,
                    quantity: quantity,
                    upc: upc,
                    imageUrl: imgSrc || ''
                };

                items.push(item);

                console.log(`  ✓ ${item.brand} ${item.model} - ${item.color} (${item.size}) x${item.quantity} [UPC: ${item.upc || 'N/A'}]`);
            }
        });

    } catch (error) {
        console.error('❌ Error parsing items:', error.message);
    }

    return items;
}

/**
 * Validate parsed data
 */
function validateParsedData(parsedData) {
    const errors = [];
    const warnings = [];

    // Required fields
    if (!parsedData.orderNumber) {
        errors.push('Missing order number');
    }
    if (!parsedData.customerName) {
        warnings.push('Missing customer name');
    }
    if (!parsedData.items || parsedData.items.length === 0) {
        errors.push('No items found in order');
    }

    // Check items for UPCs
    const itemsWithoutUPC = parsedData.items.filter(item => !item.upc);
    if (itemsWithoutUPC.length > 0) {
        warnings.push(`${itemsWithoutUPC.length} items missing UPC codes (web enrichment may fail)`);
    }

    return {
        valid: errors.length === 0,
        errors,
        warnings
    };
}

module.exports = {
    parseKenmarkHtml,
    validateParsedData
};

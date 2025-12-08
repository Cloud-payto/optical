const cheerio = require('cheerio');

/**
 * Parse Europa (europaeye.com) HTML emails
 *
 * Europa email structure:
 * - Subject: "Customer Receipt: Your Receipt for Order #[number]"
 * - From: noreply@europaeye.com
 * - HTML tables with Customer, Ship Address, Order Items sections
 * - Model format: "Brand - Model" (e.g., "American Optical - Adams")
 * - Color format: "ColorCode ColorName - LensType" (e.g., "1 Black - Green Nylon Polarized - ST")
 *
 * Brands carried by Europa include:
 * - American Optical
 * - Cinzia
 * - Michael Ryen
 * - And others
 *
 * @param {string} html - The HTML content of the email
 * @param {string} plainText - The plain text content of the email
 * @returns {object} Parsed order data
 */
function parseEuropaHtml(html, plainText) {
    const textToUse = plainText || html;

    // Identify vendor
    const vendor = 'Europa';

    console.log('📋 Europa Parser - Starting...');

    // Extract order details from text
    const orderNumberMatch = textToUse.match(/Order\s*#[:\s]*(\d+)/i);
    const orderNumber = orderNumberMatch ? orderNumberMatch[1] : '';

    const repNameMatch = textToUse.match(/Order Placed By Rep[:\s]*([^\n<]+)/i);
    const repName = repNameMatch ? repNameMatch[1].trim() : '';

    const orderDateMatch = textToUse.match(/Date[:\s]*([\d\/]+)/i);
    const orderDate = orderDateMatch ? orderDateMatch[1].trim() : '';

    console.log('📋 Order Details:');
    console.log('  Order Number:', orderNumber);
    console.log('  Rep Name:', repName);
    console.log('  Order Date:', orderDate);

    // Extract customer information from HTML
    const customerInfo = extractCustomerInfo(html, textToUse);

    console.log('  Account Number:', customerInfo.accountNumber);
    console.log('  Customer Name:', customerInfo.customerName);

    // Extract items from HTML table
    const items = extractItems(html);

    console.log(`  Items Found: ${items.length}`);

    // Calculate total quantity
    const totalQuantity = items.reduce((sum, item) => sum + item.quantity, 0);

    return {
        vendor: vendor,
        vendorCode: 'europa',
        orderNumber: orderNumber,
        orderDate: orderDate,
        repName: repName,
        accountNumber: customerInfo.accountNumber,
        customerName: customerInfo.customerName,
        customerAddress: customerInfo.customerAddress,
        customerCity: customerInfo.customerCity,
        customerState: customerInfo.customerState,
        customerPostalCode: customerInfo.customerPostalCode,
        customerPhone: customerInfo.customerPhone,
        shipToName: customerInfo.shipToName,
        shipToAddress: customerInfo.shipToAddress,
        shipToCity: customerInfo.shipToCity,
        shipToState: customerInfo.shipToState,
        shipToPostalCode: customerInfo.shipToPostalCode,
        terms: customerInfo.terms,
        shipMethod: customerInfo.shipMethod,
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
function extractCustomerInfo(html, textToUse) {
    const customerInfo = {
        accountNumber: '',
        customerName: '',
        customerAddress: '',
        customerCity: '',
        customerState: '',
        customerPostalCode: '',
        customerPhone: '',
        shipToName: '',
        shipToAddress: '',
        shipToCity: '',
        shipToState: '',
        shipToPostalCode: '',
        terms: '',
        shipMethod: ''
    };

    if (!html) return customerInfo;

    const $ = cheerio.load(html);

    // Find the Customer table
    $('table').each((tableIndex, table) => {
        const $table = $(table);
        const headerText = $table.find('td.x_tableheader strong, td.x_tableheader').text().trim();

        if (headerText.includes('Customer')) {
            // Find the data row (skip header rows)
            const rows = $table.find('tr');
            rows.each((rowIndex, row) => {
                const cells = $(row).find('td');
                // Look for the data row (not header rows)
                if (cells.length >= 8 && !$(cells[0]).hasClass('x_tableheader') && !$(cells[0]).hasClass('x_secondaryheader')) {
                    customerInfo.accountNumber = $(cells[0]).text().trim();
                    customerInfo.customerName = $(cells[1]).text().trim();
                    customerInfo.customerAddress = $(cells[2]).text().trim();
                    // cells[3] is Address 2
                    const address2 = $(cells[3]).text().trim();
                    if (address2) {
                        customerInfo.customerAddress += ' ' + address2;
                    }
                    customerInfo.customerCity = $(cells[4]).text().trim();
                    customerInfo.customerState = $(cells[5]).text().trim();
                    customerInfo.customerPostalCode = $(cells[6]).text().trim();
                    customerInfo.customerPhone = $(cells[7]).text().trim();
                }
            });
        }

        if (headerText.includes('Ship Address')) {
            const rows = $table.find('tr');
            rows.each((rowIndex, row) => {
                const cells = $(row).find('td');
                if (cells.length >= 6 && !$(cells[0]).hasClass('x_tableheader') && !$(cells[0]).hasClass('x_secondaryheader')) {
                    customerInfo.shipToName = $(cells[0]).text().trim();
                    customerInfo.shipToAddress = $(cells[1]).text().trim();
                    const address2 = $(cells[2]).text().trim();
                    if (address2) {
                        customerInfo.shipToAddress += ' ' + address2;
                    }
                    customerInfo.shipToCity = $(cells[3]).text().trim();
                    customerInfo.shipToState = $(cells[4]).text().trim();
                    customerInfo.shipToPostalCode = $(cells[5]).text().trim();
                }
            });
        }
    });

    // Extract terms and ship method from the bottom section
    const termsMatch = textToUse.match(/Terms[:\s]*([^\n<]+)/i);
    if (termsMatch) {
        customerInfo.terms = termsMatch[1].trim();
    }

    const shipMethodMatch = textToUse.match(/Ship Method[:\s]*([^\n<]+)/i);
    if (shipMethodMatch) {
        customerInfo.shipMethod = shipMethodMatch[1].trim();
    }

    return customerInfo;
}

/**
 * Extract items from HTML table
 * Europa table structure:
 * Order Type | Model | Color | Size | Qty | Available Status
 */
function extractItems(html) {
    const items = [];

    if (!html) return items;

    try {
        const $ = cheerio.load(html);

        // Find the Order Items table
        $('table').each((tableIndex, table) => {
            const $table = $(table);
            const headerText = $table.find('td.x_tableheader strong, td.x_tableheader').text().trim();

            if (headerText.includes('Order Items')) {
                const rows = $table.find('tr');

                rows.each((rowIndex, row) => {
                    const cells = $(row).find('td');

                    // Skip header rows and separator rows
                    if (cells.length < 5) return;
                    if ($(cells[0]).hasClass('x_tableheader') || $(cells[0]).hasClass('x_secondaryheader')) return;

                    // Check for colspan (separator or note row)
                    const firstCell = $(cells[0]);
                    if (firstCell.attr('colspan')) return;

                    const orderType = $(cells[0]).text().trim();
                    const modelCell = $(cells[1]).text().trim();
                    const colorCell = $(cells[2]).text().trim();
                    const sizeCell = $(cells[3]).text().trim();
                    const qtyCell = $(cells[4]).text().trim();
                    const availabilityCell = cells.length > 5 ? $(cells[5]).text().trim() : '';

                    // Skip if no model data (empty rows or display items)
                    if (!modelCell || modelCell.includes('Displays / POP')) {
                        return;
                    }

                    // Parse model field: "Brand - Model" format
                    let brand = 'Europa';
                    let model = modelCell;

                    if (modelCell.includes(' - ')) {
                        const parts = modelCell.split(' - ');
                        brand = parts[0].trim();
                        model = parts.slice(1).join(' - ').trim();
                    }

                    // Parse color field: "ColorCode ColorName - LensType" format
                    // Examples: "1 Black - Green Nylon Polarized - ST"
                    //           "3 Burlwood Pearl - Demo - ST"
                    //           "1 Peacock Demi"
                    let colorCode = '';
                    let colorName = colorCell;

                    // Try to extract color code (usually a number at the start)
                    const colorMatch = colorCell.match(/^(\d+)\s+(.+)$/);
                    if (colorMatch) {
                        colorCode = colorMatch[1];
                        colorName = colorMatch[2];
                    }

                    // Parse size
                    const size = sizeCell.trim();
                    const quantity = parseInt(qtyCell.trim()) || 1;

                    // Parse availability
                    const availability = availabilityCell;
                    const inStock = availability.toLowerCase() !== 'back-ordered';

                    const item = {
                        brand: brand,
                        model: model,
                        colorCode: colorCode,
                        colorName: colorName,
                        color: colorCell,
                        size: size,
                        eyeSize: size, // Europa only shows eye size typically
                        quantity: quantity,
                        orderType: orderType,
                        availability: availability,
                        inStock: inStock
                    };

                    items.push(item);

                    console.log(`  ✓ ${item.brand} ${item.model} - ${item.color} (${item.size}) x${item.quantity} [${item.availability}]`);
                });
            }
        });

    } catch (error) {
        console.error('❌ Error parsing Europa items:', error.message);
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
    if (!parsedData.accountNumber) {
        warnings.push('Missing account number');
    }
    if (!parsedData.items || parsedData.items.length === 0) {
        errors.push('No items found in order');
    }

    // Check for back-ordered items
    const backOrderedItems = parsedData.items.filter(item => !item.inStock);
    if (backOrderedItems.length > 0) {
        warnings.push(`${backOrderedItems.length} items are back-ordered`);
    }

    return {
        valid: errors.length === 0,
        errors,
        warnings
    };
}

module.exports = {
    parseEuropaHtml,
    validateParsedData
};

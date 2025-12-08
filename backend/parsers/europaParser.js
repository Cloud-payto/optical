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
 * Check if a cell is a header cell (works with both CSS classes and inline styles)
 * Used by extractCustomerInfo before the helper functions are defined
 */
function isCustomerHeaderCell($, cell) {
    const $cell = $(cell);

    // Check for CSS classes (original email format)
    if ($cell.hasClass('x_tableheader') || $cell.hasClass('x_secondaryheader')) {
        return true;
    }

    // Check for inline styles (forwarded email format)
    const style = $cell.attr('style') || '';

    // Dark blue header: rgb(11, 27, 87)
    if (style.includes('rgb(11, 27, 87)') || style.includes('#0B1B57') || style.includes('#0b1b57')) {
        return true;
    }

    // Gray secondary header: rgb(204, 204, 204)
    if (style.includes('rgb(204, 204, 204)') || style.includes('#CCCCCC') || style.includes('#cccccc')) {
        return true;
    }

    // Check for background property with these colors
    if (style.includes('background') && (style.includes('204') || style.includes('11, 27, 87'))) {
        return true;
    }

    return false;
}

/**
 * Find the innermost table containing a specific header text
 * Works with both CSS-classed and inline-styled headers
 * IMPORTANT: Returns the innermost table (closest to the header), not outer wrapper tables
 */
function findCustomerTableByHeader($, headerText) {
    let foundTable = null;
    let foundDepth = -1;

    // Helper to calculate nesting depth of a table
    function getTableDepth(table) {
        let depth = 0;
        let parent = $(table).parent();
        while (parent.length) {
            if (parent.is('table')) depth++;
            parent = parent.parent();
        }
        return depth;
    }

    $('table').each((tableIndex, table) => {
        const $table = $(table);
        const tableDepth = getTableDepth(table);

        // Check direct children only (not nested tables)
        const directRows = $table.find('> tbody > tr, > tr');
        let hasDirectHeader = false;

        directRows.each((rowIdx, row) => {
            const cells = $(row).find('> td');
            cells.each((cellIdx, cell) => {
                const $cell = $(cell);
                const cellText = $cell.text().trim();

                // Skip cells that have nested tables
                if ($cell.find('table').length > 0) return;

                // Check for CSS class header
                if ($cell.hasClass('x_tableheader')) {
                    const strongText = $cell.find('strong').text().trim() || cellText;
                    if (strongText === headerText) {
                        hasDirectHeader = true;
                        return false;
                    }
                }

                // Check for inline style header (dark blue background)
                const style = $cell.attr('style') || '';
                if (style.includes('rgb(11, 27, 87)') || style.includes('#0B1B57') || style.includes('#0b1b57')) {
                    const strongText = $cell.find('strong, b').text().trim() || cellText;
                    if (strongText === headerText) {
                        hasDirectHeader = true;
                        return false;
                    }
                }
            });
            if (hasDirectHeader) return false;
        });

        // If this table directly has the header and is deeper than previous match, use it
        if (hasDirectHeader && tableDepth > foundDepth) {
            foundTable = table;
            foundDepth = tableDepth;
        }
    });

    return foundTable;
}

/**
 * Extract customer information from email
 * Handles both original emails (with CSS classes) and forwarded emails (with inline styles)
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

    // Find the Customer table using flexible header detection
    const customerTable = findCustomerTableByHeader($, 'Customer');
    if (customerTable) {
        const $table = $(customerTable);
        const rows = $table.find('tr');

        rows.each((rowIndex, row) => {
            const cells = $(row).find('td');

            // Look for the data row (8 columns: Account, Name, Address, Address2, City, Province, PostalCode, Phone)
            // Skip header rows
            if (cells.length >= 8 && !isCustomerHeaderCell($, cells[0])) {
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

    // Find the Ship Address table
    const shipTable = findCustomerTableByHeader($, 'Ship Address');
    if (shipTable) {
        const $table = $(shipTable);
        const rows = $table.find('tr');

        rows.each((rowIndex, row) => {
            const cells = $(row).find('td');

            // Look for the data row (6 columns: Name, Address, Address2, City, Province, PostalCode)
            // Skip header rows
            if (cells.length >= 6 && !isCustomerHeaderCell($, cells[0])) {
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

    // Extract terms and ship method from the bottom section (text-based, works for both formats)
    const termsMatch = textToUse.match(/Terms[:\s]*([^\n\r<]+)/i);
    if (termsMatch) {
        customerInfo.terms = termsMatch[1].trim();
    }

    const shipMethodMatch = textToUse.match(/Ship Method[:\s]*([^\n\r<]+)/i);
    if (shipMethodMatch) {
        customerInfo.shipMethod = shipMethodMatch[1].trim();
    }

    return customerInfo;
}

/**
 * Check if a table cell is a header cell (either by class or inline style)
 * @param {object} $ - Cheerio instance
 * @param {object} cell - The cell element
 * @returns {boolean} True if it's a header cell
 */
function isHeaderCell($, cell) {
    const $cell = $(cell);

    // Check for CSS classes (original email format)
    if ($cell.hasClass('x_tableheader') || $cell.hasClass('x_secondaryheader')) {
        return true;
    }

    // Check for inline styles (forwarded email format)
    const style = $cell.attr('style') || '';

    // Dark blue header: rgb(11, 27, 87) or #0B1B57
    if (style.includes('rgb(11, 27, 87)') || style.includes('#0B1B57') || style.includes('#0b1b57')) {
        return true;
    }

    // Gray secondary header: rgb(204, 204, 204) or #CCCCCC
    if (style.includes('rgb(204, 204, 204)') || style.includes('#CCCCCC') || style.includes('#cccccc')) {
        return true;
    }

    // Check for background property with these colors
    if (style.includes('background') && (style.includes('204') || style.includes('11, 27, 87'))) {
        return true;
    }

    return false;
}

/**
 * Find the innermost table by looking for header text content
 * Works with both CSS-classed headers and inline-styled headers
 * IMPORTANT: Returns the innermost table (closest to the header), not outer wrapper tables
 * @param {object} $ - Cheerio instance
 * @param {string} headerText - The header text to search for (e.g., "Order Items")
 * @returns {object|null} The table element or null
 */
function findTableByHeader($, headerText) {
    let foundTable = null;
    let foundDepth = -1;

    // Helper to calculate nesting depth of a table
    function getTableDepth(table) {
        let depth = 0;
        let parent = $(table).parent();
        while (parent.length) {
            if (parent.is('table')) depth++;
            parent = parent.parent();
        }
        return depth;
    }

    $('table').each((tableIndex, table) => {
        const $table = $(table);
        const tableDepth = getTableDepth(table);

        // We want the deepest (innermost) table that directly contains the header
        // Check if this table has the header as a direct child (not in nested tables)

        // Method 1: Look for text in td.x_tableheader (original format) - direct children only
        const directRows = $table.find('> tbody > tr, > tr');
        let hasDirectHeader = false;

        directRows.each((rowIdx, row) => {
            const cells = $(row).find('> td');
            cells.each((cellIdx, cell) => {
                const $cell = $(cell);
                const cellText = $cell.text().trim();

                // Check if this cell directly contains the header text (not from nested content)
                // Skip cells that have nested tables (they would have their own content)
                if ($cell.find('table').length > 0) return;

                // Check for CSS class header
                if ($cell.hasClass('x_tableheader')) {
                    const strongText = $cell.find('strong').text().trim() || cellText;
                    if (strongText === headerText) {
                        hasDirectHeader = true;
                        return false;
                    }
                }

                // Check for inline style header (dark blue background)
                const style = $cell.attr('style') || '';
                if (style.includes('rgb(11, 27, 87)') || style.includes('#0B1B57') || style.includes('#0b1b57')) {
                    const strongText = $cell.find('strong, b').text().trim() || cellText;
                    if (strongText === headerText) {
                        hasDirectHeader = true;
                        return false;
                    }
                }
            });
            if (hasDirectHeader) return false;
        });

        // If this table directly has the header and is deeper than previous match, use it
        if (hasDirectHeader && tableDepth > foundDepth) {
            foundTable = table;
            foundDepth = tableDepth;
        }
    });

    return foundTable;
}

/**
 * Extract items from HTML table
 * Europa table structure:
 * Order Type | Model | Color | Size | Qty | Available Status
 *
 * Handles both original emails (with CSS classes) and forwarded emails (with inline styles)
 */
function extractItems(html) {
    const items = [];

    if (!html) return items;

    try {
        const $ = cheerio.load(html);

        // Find the Order Items table using flexible header detection
        const orderItemsTable = findTableByHeader($, 'Order Items');

        if (!orderItemsTable) {
            console.log('  ⚠️ Could not find Order Items table');
            return items;
        }

        const $table = $(orderItemsTable);
        const rows = $table.find('tr');

        console.log(`  📊 Found Order Items table with ${rows.length} rows`);

        rows.each((rowIndex, row) => {
            const cells = $(row).find('td');

            // Skip rows with too few cells
            if (cells.length < 5) return;

            // Skip header rows (detected by class or inline style)
            if (isHeaderCell($, cells[0])) return;

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

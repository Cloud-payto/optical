const cheerio = require('cheerio');

/**
 * Ideal Optics Email HTML Parser
 * Parses order confirmation emails from I-Deal Optics
 *
 * Email structure:
 * - Order info in table format
 * - Account info table with account number
 * - Shipping address table
 * - Items table with: Style Name, Color, Size, Quantity, Notes
 */

/**
 * Parse Ideal Optics email HTML
 * @param {string} html - HTML content of the email
 * @param {string} plainText - Plain text content (optional)
 * @returns {object} Parsed order data
 */
function parseIdealOpticsHtml(html, plainText) {
    console.log('📧 Starting Ideal Optics HTML parse...');

    try {
        // Handle forwarded emails - extract the actual email content
        let cleanHtml = html;

        // Look for the I-Deal Optics logo or header to find the actual email
        const idealMarker = html.indexOf('i-deal-optics-logo-mail.png');
        if (idealMarker > -1) {
            // Find the nearest opening div/table before the logo
            const beforeLogo = html.substring(0, idealMarker);
            const lastDiv = Math.max(
                beforeLogo.lastIndexOf('<div'),
                beforeLogo.lastIndexOf('<table')
            );
            if (lastDiv > -1) {
                cleanHtml = html.substring(lastDiv);
                console.log('📧 Extracted forwarded email content (cleaned from forwarding wrapper)');
            }
        }

        const $ = cheerio.load(cleanHtml);

        // Extract Web Order Number and Order Date
        const orderInfo = extractOrderInfo($);

        // Extract Account Information
        const accountInfo = extractAccountInfo($);

        // Extract Shipping Address
        const shippingInfo = extractShippingAddress($);

        // Extract Order Items
        const items = extractOrderItems($);

        // Calculate total quantity
        const totalQuantity = items.reduce((sum, item) => sum + item.quantity, 0);

        // FLAT STRUCTURE - matches L'amyamerica, Modern Optical, etc.
        const result = {
            vendor: 'Ideal Optics',
            vendorCode: 'ideal_optics',
            orderNumber: orderInfo.webOrderNumber,
            orderDate: orderInfo.orderDate,
            orderedBy: orderInfo.orderedBy,
            accountNumber: accountInfo.accountNumber,
            customerName: accountInfo.contactName,
            purchaseOrder: orderInfo.purchaseOrder || '',
            notes: orderInfo.notes || '',
            shipMethod: orderInfo.shipMethod || '',
            promotionalCode: orderInfo.promotionalCode || '',
            shippingAddress: shippingInfo.address,
            shippingCity: shippingInfo.city,
            shippingState: shippingInfo.state,
            shippingPostalCode: shippingInfo.postal_code,
            items: items,
            totalQuantity: totalQuantity,
            totalItems: items.length,
            metadata: {
                parsedAt: new Date().toISOString(),
                parserVersion: '1.0',
                source: 'email'
            }
        };

        console.log('✅ Ideal Optics parse complete');
        console.log(`   Order: ${result.orderNumber}`);
        console.log(`   Customer: ${result.customerName}`);
        console.log(`   Account: ${result.accountNumber}`);
        console.log(`   Items: ${result.items.length}`);
        console.log(`   Unique Frames: ${result.totalItems}`);

        return result;

    } catch (error) {
        console.error('❌ Error parsing Ideal Optics email:', error);
        throw new Error(`Failed to parse Ideal Optics email: ${error.message}`);
    }
}

/**
 * Extract order information (web order number, date, etc.)
 */
function extractOrderInfo($) {
    const orderInfo = {
        webOrderNumber: '',
        orderDate: '',
        orderedBy: '',
        purchaseOrder: '',
        notes: '',
        shipMethod: '',
        promotionalCode: ''
    };

    try {
        // Find all table cells and check for bold labels
        $('td').each((i, elem) => {
            const $elem = $(elem);
            const text = $elem.text().trim();

            // Check if this cell contains a bold label (either with class or <b> tag)
            const isBold = $elem.hasClass('x_boldtext') || $elem.find('b').length > 0;

            if (!isBold) return;

            const $nextTd = $elem.next('td');

            if (text.includes('Web Order #')) {
                orderInfo.webOrderNumber = $nextTd.text().trim();
            } else if (text.includes('Order Date')) {
                orderInfo.orderDate = $nextTd.text().trim();
            } else if (text.includes('Ordered By')) {
                orderInfo.orderedBy = $nextTd.text().trim();
            } else if (text.includes('Purchase Order')) {
                orderInfo.purchaseOrder = $nextTd.text().trim();
            } else if (text.includes('Notes') && !text.includes('Style')) {
                orderInfo.notes = $nextTd.text().trim();
            } else if (text.includes('Ship Method')) {
                orderInfo.shipMethod = $nextTd.text().trim();
            } else if (text.includes('Promotional Code')) {
                orderInfo.promotionalCode = $nextTd.text().trim();
            }
        });

        console.log(`📋 Order Info: ${orderInfo.webOrderNumber} (${orderInfo.orderDate})`);

    } catch (error) {
        console.error('Error extracting order info:', error.message);
    }

    return orderInfo;
}

/**
 * Extract account information
 */
function extractAccountInfo($) {
    const accountInfo = {
        accountNumber: '',
        contactName: '',
        address: '',
        city: '',
        state: '',
        postalCode: ''
    };

    try {
        // Find the Account Information table - look for text containing "Account Information"
        let accountTable = $('td').filter((i, elem) => {
            const text = $(elem).text().trim();
            return text.includes('Account Information');
        }).closest('table');

        if (accountTable.length) {
            console.log('🔍 Found Account Information table');

            // Find the data row (skip header rows)
            accountTable.find('tr').each((i, row) => {
                const $row = $(row);
                const cells = $row.find('td');

                // Skip rows with less than 5 cells
                if (cells.length < 5) return;

                // Skip header rows - check for x_secondaryheader class or x_tableheader class
                if (cells.eq(0).hasClass('x_secondaryheader') || cells.eq(0).hasClass('x_tableheader')) return;

                // Skip rows with strong tags (these are headers)
                if (cells.eq(0).find('strong').length > 0) return;

                // Skip rows where the first cell contains header text
                const firstCellText = cells.eq(0).text().trim();
                if (firstCellText.includes('Account Information') ||
                    firstCellText === 'Account' ||
                    firstCellText === 'Contact Name') return;

                // This should be the data row - verify it looks like account data
                const account = firstCellText;
                const contact = cells.eq(1).text().trim();

                // Account numbers typically start with a letter and are alphanumeric
                // Contact names are typically longer and contain spaces
                if (account && account.length > 0 && account.length < 20) {
                    accountInfo.accountNumber = account;
                    accountInfo.contactName = contact;
                    accountInfo.address = cells.eq(2).text().trim();
                    accountInfo.city = cells.eq(3).text().trim();
                    accountInfo.state = cells.eq(4).text().trim();
                    accountInfo.postalCode = cells.eq(5).text().trim();
                    console.log(`🔍 Found account data row: ${account}, ${contact}`);
                    return false; // Break out of loop
                }
            });
        } else {
            console.log('⚠️ Account Information table not found');
        }

        console.log(`🏢 Account: ${accountInfo.accountNumber} - ${accountInfo.contactName}`);

    } catch (error) {
        console.error('Error extracting account info:', error.message);
    }

    return accountInfo;
}

/**
 * Extract shipping address
 */
function extractShippingAddress($) {
    const shipping = {
        address: '',
        city: '',
        state: '',
        postal_code: ''
    };

    try {
        // Find the Shipping Address table - look for text containing "Shipping Address"
        let shippingTable = $('td').filter((i, elem) => {
            const text = $(elem).text().trim();
            return text.includes('Shipping Address') && $(elem).find('strong').length > 0;
        }).closest('table');

        if (shippingTable.length) {
            console.log('🔍 Found Shipping Address table');

            // Find the data row (skip header rows)
            shippingTable.find('tr').each((i, row) => {
                const $row = $(row);
                const cells = $row.find('td');

                // Skip rows with less than 4 cells
                if (cells.length < 4) return;

                // Skip header rows - check for x_secondaryheader class or x_tableheader class
                if (cells.eq(0).hasClass('x_secondaryheader') || cells.eq(0).hasClass('x_tableheader')) return;

                // Skip rows with strong tags (these are headers)
                if (cells.eq(0).find('strong').length > 0) return;

                // Skip rows where first cell contains header text
                const firstCellText = cells.eq(0).text().trim();
                if (firstCellText.includes('Shipping Address') ||
                    firstCellText === 'City' ||
                    firstCellText === 'State') return;

                // This should be the data row - verify it looks like an address
                const address = firstCellText;

                // Addresses are typically longer than 5 characters
                if (address && address.length > 5) {
                    shipping.address = address;
                    shipping.city = cells.eq(1).text().trim();
                    shipping.state = cells.eq(2).text().trim();
                    shipping.postal_code = cells.eq(3).text().trim();
                    console.log(`🔍 Found shipping data row: ${address}`);
                    return false; // Break out of loop
                }
            });
        } else {
            console.log('⚠️ Shipping Address table not found');
        }

        console.log(`📦 Shipping: ${shipping.city}, ${shipping.state} ${shipping.postal_code}`);

    } catch (error) {
        console.error('Error extracting shipping address:', error.message);
    }

    return shipping;
}

/**
 * Extract order items from the items table
 */
function extractOrderItems($) {
    const items = [];

    try {
        // Find the items table (has headers: Style Name, Color, Size, Quantity, Notes)
        let itemsTable = $('td.x_secondaryheader').filter((i, elem) => {
            return $(elem).text().trim() === 'Style Name';
        }).closest('table');

        // If not found with old method, try finding table with "Style Name" header in gray background
        if (!itemsTable.length) {
            itemsTable = $('td').filter((i, elem) => {
                const $elem = $(elem);
                const text = $elem.text().trim();
                const bg = $elem.css('background') || '';
                const style = $elem.attr('style') || '';
                const hasGrayBG = bg.includes('CCCCCC') || style.includes('background:#CCCCCC') || style.includes('background-color:#CCCCCC');
                return text === 'Style Name' && hasGrayBG;
            }).closest('table');
        }

        // If still not found, try finding table with just "Style Name" text (less strict)
        if (!itemsTable.length) {
            console.log('⚠️  Trying less strict Style Name search...');
            itemsTable = $('td').filter((i, elem) => {
                return $(elem).text().trim() === 'Style Name';
            }).closest('table');
        }

        if (!itemsTable.length) {
            console.warn('⚠️  Items table not found');
            console.log('🔍 Debugging: Looking for all td elements containing "Style"...');
            $('td').each((i, elem) => {
                const text = $(elem).text().trim();
                if (text.toLowerCase().includes('style')) {
                    console.log(`   Found td with "style": "${text}"`);
                }
            });
            return items;
        }

        console.log('✅ Items table found');

        // Process each data row
        itemsTable.find('tr').each((i, row) => {
            const $row = $(row);
            const cells = $row.find('td');

            // Skip header rows and empty rows
            if (cells.length < 4) return;
            if (cells.eq(0).hasClass('x_secondaryheader')) return;

            // Check for gray background (header rows) - handles multiple formats:
            // - #CCCCCC (hex format from original email)
            // - rgb(204, 204, 204) (rgb format from forwarded/cleaned emails)
            const bg = cells.eq(0).css('background') || cells.eq(0).attr('style') || '';
            if (bg.includes('CCCCCC') || bg.includes('#CCCCCC') ||
                bg.includes('rgb(204, 204, 204)') || bg.includes('rgb(204,204,204)')) return;

            const styleName = cells.eq(0).text().trim();
            const color = cells.eq(1).text().trim();
            const size = cells.eq(2).text().trim();
            const quantityText = cells.eq(3).text().trim();
            const notes = cells.eq(4) ? cells.eq(4).text().trim() : '';

            // Skip if style name is empty, contains only whitespace/nbsp, or is a total/summary row
            // Also skip header rows where first cell is exactly "Style Name"
            // Also skip rows where style name contains "Total" or "Quantity" (summary rows)
            if (!styleName ||
                styleName.length === 0 ||
                styleName === '\u00A0' || // Non-breaking space
                styleName === 'Style Name' || // Header row text
                styleName.toLowerCase().includes('total') ||
                styleName.toLowerCase().includes('quantity')) return;

            const quantity = parseInt(quantityText) || 1;

            // Parse size (e.g., "53-16-140" -> eye: 53, bridge: 16, temple: 140)
            const sizeParts = size.split('-');
            const eyeSize = sizeParts[0] || '';
            const bridge = sizeParts[1] || '';
            const temple = sizeParts[2] || '';

            const item = {
                brand: 'Ideal Optics', // Brand is always Ideal Optics
                model: styleName,
                color: color,
                color_name: color,
                full_size: size,
                eye_size: eyeSize,
                bridge: bridge,
                temple_length: temple,
                quantity: quantity,
                notes: notes,
                sku: `${styleName}-${color}-${size}`.replace(/\s+/g, '-'),
                upc: '', // Will be enriched from website
                material: '',
                gender: '',
                hinge_type: '',
                in_stock: true,
                api_verified: false,
                confidence_score: 0,
                validation_reason: 'Parsed from email'
            };

            items.push(item);
        });

        console.log(`📦 Found ${items.length} items`);

    } catch (error) {
        console.error('Error extracting order items:', error.message);
    }

    return items;
}

/**
 * Generate unique frames list (for web scraping efficiency)
 */
function generateUniqueFrames(items) {
    const frameMap = new Map();

    for (const item of items) {
        const frameKey = `${item.model}`;

        if (!frameMap.has(frameKey)) {
            frameMap.set(frameKey, {
                brand: item.brand,
                model: item.model,
                count: 0,
                colors: []
            });
        }

        const frame = frameMap.get(frameKey);
        frame.count += item.quantity;

        if (!frame.colors.includes(item.color)) {
            frame.colors.push(item.color);
        }
    }

    return Array.from(frameMap.values());
}

module.exports = {
    parseIdealOpticsHtml
};

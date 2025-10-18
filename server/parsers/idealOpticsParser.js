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
        const $ = cheerio.load(html);

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
        // Find "Web Order #" row
        $('td.x_boldtext').each((i, elem) => {
            const $elem = $(elem);
            const text = $elem.text().trim();
            const $nextTd = $elem.next('td');

            if (text === 'Web Order # :') {
                orderInfo.webOrderNumber = $nextTd.text().trim();
            } else if (text === 'Order Date :') {
                orderInfo.orderDate = $nextTd.text().trim();
            } else if (text === 'Ordered By :') {
                orderInfo.orderedBy = $nextTd.text().trim();
            } else if (text === 'Purchase Order :') {
                orderInfo.purchaseOrder = $nextTd.text().trim();
            } else if (text === 'Notes :') {
                orderInfo.notes = $nextTd.text().trim();
            } else if (text === 'Ship Method :') {
                // Ship method might have multiple td elements
                orderInfo.shipMethod = $nextTd.text().trim();
            } else if (text === 'Promotional Code:') {
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
        // Find the Account Information table
        const accountTable = $('td.x_tableheader').filter((i, elem) => {
            return $(elem).text().trim() === 'Account Information';
        }).closest('table');

        if (accountTable.length) {
            // Extract account number and contact name from the data row
            const dataRow = accountTable.find('tr').eq(2); // Third row contains data
            const cells = dataRow.find('td');

            accountInfo.accountNumber = cells.eq(0).text().trim(); // Account column
            accountInfo.contactName = cells.eq(1).text().trim(); // Contact Name column
            accountInfo.address = cells.eq(2).text().trim(); // Address column
            accountInfo.city = cells.eq(3).text().trim(); // City column
            accountInfo.state = cells.eq(4).text().trim(); // State column
            accountInfo.postalCode = cells.eq(5).text().trim(); // Postal Code column
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
        // Find the Shipping Address table
        const shippingTable = $('td.x_tableheader').filter((i, elem) => {
            return $(elem).text().trim() === 'Shipping Address';
        }).closest('table');

        if (shippingTable.length) {
            // Extract shipping data from the data row
            const dataRow = shippingTable.find('tr').eq(2); // Third row contains data
            const cells = dataRow.find('td');

            shipping.address = cells.eq(0).text().trim();
            shipping.city = cells.eq(1).text().trim();
            shipping.state = cells.eq(2).text().trim();
            shipping.postal_code = cells.eq(3).text().trim();
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
        const itemsTable = $('td.x_secondaryheader').filter((i, elem) => {
            return $(elem).text().trim() === 'Style Name';
        }).closest('table');

        if (!itemsTable.length) {
            console.warn('⚠️  Items table not found');
            return items;
        }

        // Process each data row
        itemsTable.find('tr').each((i, row) => {
            const $row = $(row);
            const cells = $row.find('td');

            // Skip header rows and empty rows
            if (cells.length < 4) return;
            if (cells.eq(0).hasClass('x_secondaryheader')) return;

            const styleName = cells.eq(0).text().trim();
            const color = cells.eq(1).text().trim();
            const size = cells.eq(2).text().trim();
            const quantityText = cells.eq(3).text().trim();
            const notes = cells.eq(4) ? cells.eq(4).text().trim() : '';

            // Skip if style name is empty or is a total/summary row
            if (!styleName || styleName.toLowerCase().includes('total')) return;

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

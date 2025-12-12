const cheerio = require('cheerio');

/**
 * Parse ClearVision Optical (cvoptical.com) HTML emails
 *
 * ClearVision email structure:
 * - Subject: "[Rep Name] - New CVOGo Order: [OrderNumber]"
 * - From: [rep]@cvoptical.com
 * - HTML tables with order info and line items
 * - SKU format: "ADMT69GUN5417" (Brand prefix + Model + Color code + Size)
 * - Description format: "ADV MT69 GUNMETAL MATTE/GREEN 54/17/145"
 *
 * Brands carried by ClearVision include:
 * - Advantage (ADV) - value line
 * - Aspire
 * - Dilli Dalli
 * - Jessica McClintock
 * - Izod
 * - And others
 *
 * @param {string} html - The HTML content of the email
 * @param {string} plainText - The plain text content of the email (optional)
 * @returns {object} Parsed order data
 */
function parseClearVisionHtml(html, plainText) {
    const textToUse = plainText || html;
    const vendor = 'ClearVision';

    console.log('📋 ClearVision Parser - Starting...');

    const $ = cheerio.load(html);

    // Extract order number from header or subject
    // Format: "ClearVision Optical Order Reference #718492025023"
    const orderNumberMatch = textToUse.match(/Order\s*(?:Reference\s*)?#[:\s]*(\d+)/i) ||
                             textToUse.match(/CVOGo\s*Order[:\s]*(\d+)/i);
    const orderNumber = orderNumberMatch ? orderNumberMatch[1] : '';

    // Extract order date
    // Format: "Date: 09/10/2025"
    const orderDateMatch = textToUse.match(/Date[:\s]*([\d\/]+)/i);
    const orderDate = orderDateMatch ? orderDateMatch[1].trim() : '';

    // Extract rep name from subject line, email header, or signature
    // Subject format: "Preston Samuelson - New CVOGo Order: 718492025023"
    // Email signature: "Kind regards,\nPreston Samuelson"
    // From header: "From: Samuelson, Preston <psamuelson@cvoptical.com>"
    let repName = '';

    // Try subject line - look for "Subject:...Preston Samuelson - New CVOGo"
    const subjectMatch = textToUse.match(/Subject[:\s]*(?:[A-Za-z]+,\s*)?([A-Za-z]+\s+[A-Za-z]+)\s*-\s*New\s*CVOGo/i);
    if (subjectMatch) {
        repName = subjectMatch[1].trim();
    }

    // Try From header with "Last, First" format
    if (!repName) {
        const fromMatch = textToUse.match(/From[^<]*?([A-Za-z]+),\s*([A-Za-z]+)\s*(?:<|&lt;)/i);
        if (fromMatch) {
            repName = fromMatch[2] + ' ' + fromMatch[1];
        }
    }

    // Try signature - look for "Kind regards," followed by a name
    if (!repName) {
        const sigMatch = textToUse.match(/Kind\s+regards,?\s*[\n\r<br>]*\s*([A-Za-z]+\s+[A-Za-z]+)/i);
        if (sigMatch) {
            repName = sigMatch[1].trim();
        }
    }

    console.log('📋 Order Details:');
    console.log('  Order Number:', orderNumber);
    console.log('  Order Date:', orderDate);
    console.log('  Rep Name:', repName);

    // Extract customer information
    const customerInfo = extractCustomerInfo($, textToUse);

    console.log('  Account Number:', customerInfo.accountNumber);
    console.log('  Customer Name:', customerInfo.customerName);

    // Extract items from HTML table
    const items = extractItems($);

    console.log(`  Items Found: ${items.length}`);

    // Calculate totals
    const totalQuantity = items.reduce((sum, item) => sum + item.quantity, 0);
    const totalPrice = items.reduce((sum, item) => sum + (item.listPrice * item.quantity), 0);

    return {
        vendor: vendor,
        vendorCode: 'clearvision',
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
        territory: customerInfo.territory,
        items: items,
        totalQuantity: totalQuantity,
        totalItems: items.length,
        totalPrice: totalPrice,
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
function extractCustomerInfo($, textToUse) {
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
        shipMethod: '',
        territory: ''
    };

    // Extract Customer ID (Account Number)
    // Format: "Customer ID: 060212"
    const customerIdMatch = textToUse.match(/Customer\s*ID[:\s]*(\d+)/i);
    if (customerIdMatch) {
        customerInfo.accountNumber = customerIdMatch[1];
    }

    // Extract Customer Name
    // Format: "Customer: Arizona Vision Therapy Center"
    // Note: Must NOT match "Customer ID:" - use negative lookahead
    const customerNameMatch = textToUse.match(/Customer(?!\s*ID)[:\s]+([^\n<]+?)(?:\s*Customer Email|\s*$)/im);
    if (customerNameMatch) {
        customerInfo.customerName = customerNameMatch[1].trim();
    }

    // Extract Territory
    const territoryMatch = textToUse.match(/Territory[:\s]*(\d+)/i);
    if (territoryMatch) {
        customerInfo.territory = territoryMatch[1];
    }

    // Extract Terms
    const termsMatch = textToUse.match(/Terms[:\s]*([^\n<]+)/i);
    if (termsMatch) {
        customerInfo.terms = termsMatch[1].trim();
    }

    // Extract Ship Via/Method
    const shipViaMatch = textToUse.match(/Ship\s*Via[:\s]*([^\n<]+)/i);
    if (shipViaMatch) {
        customerInfo.shipMethod = shipViaMatch[1].trim();
    }

    // Extract addresses from the Bill-to/Ship-to table
    $('table').each((tableIndex, table) => {
        const $table = $(table);
        const headerRow = $table.find('th');

        // Look for Bill-to/Ship-to address table
        let hasBillTo = false;
        let hasShipTo = false;

        headerRow.each((i, th) => {
            const text = $(th).text().trim().toLowerCase();
            if (text.includes('bill-to')) hasBillTo = true;
            if (text.includes('ship-to')) hasShipTo = true;
        });

        if (hasBillTo && hasShipTo) {
            // Found the address table
            const dataRow = $table.find('tr').eq(1);
            const cells = dataRow.find('td');

            if (cells.length >= 2) {
                // Parse Bill-to address
                const billToHtml = $(cells[0]).html() || '';
                const billToParts = billToHtml.split(/<br\s*\/?>/i).map(p =>
                    cheerio.load(p).text().trim()
                ).filter(p => p);

                if (billToParts.length > 0) {
                    customerInfo.customerName = billToParts[0] || customerInfo.customerName;
                    // Parse address parts - typically: name, blank, blank, address lines, city/state/zip
                    const addressParts = billToParts.slice(1).filter(p => p && !p.includes('Phone:') && !p.includes('Customer Type:'));
                    if (addressParts.length > 0) {
                        // Last non-empty part before Phone/Customer Type should be city, state, zip
                        const lastPart = addressParts[addressParts.length - 1];
                        const cityStateZipMatch = lastPart.match(/^([^,]+),\s*([A-Z]{2}),?\s*([\d-]+)/i);
                        if (cityStateZipMatch) {
                            customerInfo.customerCity = cityStateZipMatch[1].trim();
                            customerInfo.customerState = cityStateZipMatch[2].trim();
                            customerInfo.customerPostalCode = cityStateZipMatch[3].trim();
                            // Clean up address - remove trailing commas and extra spaces
                            customerInfo.customerAddress = addressParts.slice(0, -1)
                                .map(p => p.replace(/,\s*$/, '').trim())
                                .filter(p => p)
                                .join(', ');
                        } else {
                            customerInfo.customerAddress = addressParts.join(', ');
                        }
                    }
                }

                // Parse Ship-to address
                const shipToHtml = $(cells[1]).html() || '';
                const shipToParts = shipToHtml.split(/<br\s*\/?>/i).map(p =>
                    cheerio.load(p).text().trim()
                ).filter(p => p);

                if (shipToParts.length > 0) {
                    customerInfo.shipToName = shipToParts[0];
                    const addressParts = shipToParts.slice(1).filter(p => p && !p.includes('Phone:') && !p.includes('Customer Type:'));
                    if (addressParts.length > 0) {
                        const lastPart = addressParts[addressParts.length - 1];
                        const cityStateZipMatch = lastPart.match(/^([^,]+),\s*([A-Z]{2}),?\s*([\d-]+)/i);
                        if (cityStateZipMatch) {
                            customerInfo.shipToCity = cityStateZipMatch[1].trim();
                            customerInfo.shipToState = cityStateZipMatch[2].trim();
                            customerInfo.shipToPostalCode = cityStateZipMatch[3].trim();
                            // Clean up address - remove trailing commas and extra spaces
                            customerInfo.shipToAddress = addressParts.slice(0, -1)
                                .map(p => p.replace(/,\s*$/, '').trim())
                                .filter(p => p)
                                .join(', ');
                        } else {
                            customerInfo.shipToAddress = addressParts.join(', ');
                        }
                    }
                }
            }
        }
    });

    return customerInfo;
}

/**
 * Map brand prefixes to full brand names
 */
const BRAND_PREFIXES = {
    'ADV': 'Advantage',
    'ASP': 'Aspire',
    'DD': 'Dilli Dalli',
    'JMC': 'Jessica McClintock',
    'IZ': 'Izod',
    'IZX': 'Izod Xtreme',
    'PT': 'Project Runway',
    'JM': 'Jessica McClintock',
    'OP': 'OP Ocean Pacific',
    'CVO': 'CVO',
    'BD': 'BD Eyewear'
};

/**
 * Parse SKU to extract brand prefix
 * SKU format: ADMT69GUN5417 -> AD (brand) + MT69 (model) + GUN (color) + 5417 (size)
 */
function parseSku(sku) {
    // Try to match known brand prefixes
    for (const [prefix, brandName] of Object.entries(BRAND_PREFIXES)) {
        if (sku.toUpperCase().startsWith(prefix)) {
            return {
                brandPrefix: prefix,
                brandName: brandName,
                remainder: sku.substring(prefix.length)
            };
        }
    }

    // Default: first 2-3 characters might be brand
    const match = sku.match(/^([A-Z]{2,3})(.+)$/i);
    if (match) {
        return {
            brandPrefix: match[1].toUpperCase(),
            brandName: match[1].toUpperCase(),
            remainder: match[2]
        };
    }

    return {
        brandPrefix: '',
        brandName: 'ClearVision',
        remainder: sku
    };
}

/**
 * Parse description to extract brand, model, color, and size
 * Description format: "ADV MT69 GUNMETAL MATTE/GREEN 54/17/145"
 */
function parseDescription(description, model) {
    const result = {
        brand: 'ClearVision',
        colorName: '',
        eyeSize: '',
        bridge: '',
        temple: ''
    };

    if (!description) return result;

    // Try to extract size from end: "54/17/145" or "54-17-145"
    const sizeMatch = description.match(/(\d{2})[\/\-](\d{1,2})[\/\-](\d{2,3})$/);
    if (sizeMatch) {
        result.eyeSize = sizeMatch[1];
        result.bridge = sizeMatch[2];
        result.temple = sizeMatch[3];
    }

    // Remove size from description to get color
    let colorPart = description;
    if (sizeMatch) {
        colorPart = description.substring(0, description.lastIndexOf(sizeMatch[0])).trim();
    }

    // Try to identify brand prefix and remove it along with model
    for (const [prefix, brandName] of Object.entries(BRAND_PREFIXES)) {
        if (colorPart.toUpperCase().startsWith(prefix + ' ')) {
            result.brand = brandName;
            colorPart = colorPart.substring(prefix.length + 1).trim();
            break;
        }
    }

    // Remove model from color part
    if (model && colorPart.toUpperCase().startsWith(model.toUpperCase())) {
        colorPart = colorPart.substring(model.length).trim();
    }

    result.colorName = colorPart;

    return result;
}

/**
 * Extract items from HTML table
 */
function extractItems($) {
    const items = [];

    // Find the items table (has headers: Line No., SKU, Model, Description, Qty, List Price)
    $('table').each((tableIndex, table) => {
        const $table = $(table);
        const headerRow = $table.find('tr').first();

        // Try to find headers - some emails use <th>, others use <td> with <b> tags
        let headers = headerRow.find('th');
        let headerCells = headers;

        // If no <th> elements, check for <td> elements (ClearVision uses <td> with <b> tags)
        if (headers.length === 0) {
            headerCells = headerRow.find('td');
        }

        // Check if this is the items table
        let hasSku = false;
        let hasModel = false;
        let hasQty = false;

        headerCells.each((i, cell) => {
            const text = $(cell).text().trim().toLowerCase();
            if (text === 'sku') hasSku = true;
            if (text === 'model') hasModel = true;
            if (text.includes('qty')) hasQty = true;
        });

        if (!hasSku || !hasModel || !hasQty) return;

        console.log('  📊 Found items table');

        // Get column indices
        const columnIndices = {};
        headerCells.each((i, cell) => {
            const text = $(cell).text().trim().toLowerCase();
            if (text === 'line no.') columnIndices.lineNo = i;
            if (text === 'sku') columnIndices.sku = i;
            if (text === 'model') columnIndices.model = i;
            if (text === 'description') columnIndices.description = i;
            if (text.includes('qty')) columnIndices.qty = i;
            if (text.includes('list price') || text.includes('price')) columnIndices.price = i;
            if (text === 'note') columnIndices.note = i;
        });

        // There's an empty column for the image between Line No. and SKU
        // Adjust indices if needed
        const rows = $table.find('tr').slice(1); // Skip header

        rows.each((rowIndex, row) => {
            const cells = $(row).find('td');

            // Skip total row (has colspan)
            if ($(cells[0]).attr('colspan')) return;

            // Skip if not enough cells
            if (cells.length < 6) return;

            // Account for image column (index 1)
            const lineNo = $(cells[0]).text().trim();
            // cells[1] is the image
            const sku = $(cells[2]).text().trim();
            const model = $(cells[3]).text().trim();
            const description = $(cells[4]).text().trim();
            const qtyText = $(cells[5]).text().trim();
            const priceText = cells.length > 6 ? $(cells[6]).text().trim() : '';

            // Skip empty rows
            if (!sku || !model) return;

            const quantity = parseInt(qtyText) || 1;
            const listPrice = parseFloat(priceText.replace(/[$,]/g, '')) || 0;

            // Parse SKU for brand info
            const skuInfo = parseSku(sku);

            // Parse description for color and size
            const descInfo = parseDescription(description, model);

            // Use brand from description if found, otherwise from SKU
            const brand = descInfo.brand !== 'ClearVision' ? descInfo.brand : skuInfo.brandName;

            // Extract image URL from img tag if present
            const imgCell = $(cells[1]);
            const imgSrc = imgCell.find('img').attr('src') || '';

            // Try to extract part number from image URL
            let partNumber = sku;
            const partMatch = imgSrc.match(/part_number[=:]([A-Z0-9]+)/i);
            if (partMatch) {
                partNumber = partMatch[1];
            }

            const item = {
                lineNumber: parseInt(lineNo) || rowIndex + 1,
                sku: sku,
                partNumber: partNumber,
                brand: brand,
                model: model,
                colorName: descInfo.colorName,
                color: descInfo.colorName,
                eyeSize: descInfo.eyeSize,
                bridge: descInfo.bridge,
                temple: descInfo.temple,
                size: descInfo.eyeSize ? `${descInfo.eyeSize}/${descInfo.bridge}/${descInfo.temple}` : '',
                quantity: quantity,
                listPrice: listPrice,
                description: description,
                imageUrl: imgSrc
            };

            items.push(item);

            console.log(`  ✓ ${item.brand} ${item.model} - ${item.colorName} (${item.size}) x${item.quantity} @ $${item.listPrice}`);
        });
    });

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
        warnings.push('Missing account number (Customer ID)');
    }
    if (!parsedData.items || parsedData.items.length === 0) {
        errors.push('No items found in order');
    }

    // Check items for completeness
    if (parsedData.items) {
        parsedData.items.forEach((item, index) => {
            if (!item.sku) {
                warnings.push(`Item ${index + 1}: Missing SKU`);
            }
            if (!item.brand || item.brand === 'ClearVision') {
                warnings.push(`Item ${index + 1}: Could not determine brand from "${item.sku}"`);
            }
        });
    }

    return {
        valid: errors.length === 0,
        errors,
        warnings
    };
}

module.exports = {
    parseClearVisionHtml,
    validateParsedData
};

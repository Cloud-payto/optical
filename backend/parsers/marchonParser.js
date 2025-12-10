const cheerio = require('cheerio');

/**
 * Parse Marchon (marchon.com) HTML emails
 *
 * Marchon email structure:
 * - Subject: "Marchon Order Confirmation for [CUSTOMER NAME]"
 * - From: noreply@marchon.com
 * - HTML tables with frame data
 * - Style format: "MODEL COLOR" (e.g., "SF2223N LIGHT GOLD/BURGUNDY")
 * - Size format: "(54 eye)" in parentheses
 *
 * Brands carried by Marchon include:
 * - Salvatore Ferragamo (SF prefix)
 * - Calvin Klein (CK prefix)
 * - Nike (NK prefix)
 * - Columbia (C prefix)
 * - Dragon
 * - Flexon
 * - Lacoste
 * - Longchamp
 * - Marchon NYC
 * - Nine West
 * - And many more
 *
 * @param {string} html - The HTML content of the email
 * @param {string} plainText - The plain text content of the email
 * @returns {object} Parsed order data
 */
function parseMarchonHtml(html, plainText) {
    const textToUse = plainText || html;

    // Identify vendor
    const vendor = 'Marchon';

    console.log('📋 Marchon Parser - Starting...');

    // Extract order details from text
    const orderIdMatch = textToUse.match(/Order ID[:\s]*([A-Z0-9]+)/i);
    const orderId = orderIdMatch ? orderIdMatch[1].trim() : '';

    const repNameMatch = textToUse.match(/SALES REP[:\s]*([^\n<]+)/i);
    const repName = repNameMatch ? repNameMatch[1].trim() : '';

    const orderDateMatch = textToUse.match(/DATE[:\s]*([\d-]+)/i);
    const orderDate = orderDateMatch ? orderDateMatch[1].trim() : '';

    console.log('📋 Order Details:');
    console.log('  Order ID:', orderId);
    console.log('  Rep Name:', repName);
    console.log('  Order Date:', orderDate);

    // Extract customer information
    const customerInfo = extractCustomerInfo(html, textToUse);

    console.log('  Account Number:', customerInfo.accountNumber);
    console.log('  Customer Name:', customerInfo.customerName);

    // Extract terms
    const termsMatch = textToUse.match(/Terms Requested[:\s]*<strong>([^<]+)<\/strong>/i) ||
                       textToUse.match(/Terms Requested[:\s]*\*\*([^*]+)\*\*/i) ||
                       textToUse.match(/Terms Requested[:\s]*([^\n<]+)/i);
    const terms = termsMatch ? termsMatch[1].trim() : '';

    // Extract promotions
    const promotionsMatch = textToUse.match(/Promotions Applied[:\s]*<strong>([^<]+)<\/strong>/i) ||
                            textToUse.match(/Promotions Applied[:\s]*([^\n<]+)/i);
    const promotions = promotionsMatch ? promotionsMatch[1].trim() : '';

    // Extract order note
    const orderNoteMatch = textToUse.match(/Order Note[:\s]*<strong>([^<]+)<\/strong>/i) ||
                           textToUse.match(/Order Note[:\s]*Note[:\s]*([^\n<]+)/i);
    const orderNote = orderNoteMatch ? orderNoteMatch[1].trim() : '';

    // Extract items from HTML table
    const items = extractItems(html);

    console.log(`  Items Found: ${items.length}`);

    // Calculate total quantity
    const totalQuantity = items.reduce((sum, item) => sum + item.quantity, 0);

    return {
        vendor: vendor,
        vendorCode: 'marchon',
        orderNumber: orderId,
        orderDate: orderDate,
        repName: repName,
        accountNumber: customerInfo.accountNumber,
        customerName: customerInfo.customerName,
        customerAddress: customerInfo.customerAddress,
        customerCity: customerInfo.customerCity,
        customerState: customerInfo.customerState,
        customerPostalCode: customerInfo.customerPostalCode,
        shipToName: customerInfo.shipToName,
        shipToAddress: customerInfo.shipToAddress,
        shipToCity: customerInfo.shipToCity,
        shipToState: customerInfo.shipToState,
        shipToPostalCode: customerInfo.shipToPostalCode,
        terms: terms,
        promotions: promotions,
        orderNote: orderNote,
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
 *
 * Handles multiple HTML formats from forwarded emails:
 * 1. Original: <strong>Customer:</strong><br>
 * 2. Zoho forwarded: <b><span class="font" style="...">Customer:</span></b><br>
 * 3. Gmail/Outlook forwarded: <strong><span style="...">Customer:</span></strong><br>
 * 4. Plain text: Customer:\r\n or *Customer:*\r\n (markdown style)
 */
function extractCustomerInfo(html, textToUse) {
    const customerInfo = {
        accountNumber: '',
        customerName: '',
        customerAddress: '',
        customerCity: '',
        customerState: '',
        customerPostalCode: '',
        shipToName: '',
        shipToAddress: '',
        shipToCity: '',
        shipToState: '',
        shipToPostalCode: ''
    };

    // Use Cheerio to parse the HTML and extract text more reliably
    let normalizedText = textToUse;

    // If we have HTML, try to use Cheerio to extract structured data
    if (html) {
        try {
            const $ = cheerio.load(html);

            // Get all text content, preserving line breaks
            normalizedText = $.text()
                .replace(/\r\n/g, '\n')
                .replace(/\r/g, '\n');
        } catch (e) {
            console.log('📋 Could not parse HTML with Cheerio, using text fallback');
        }
    }

    // Normalize the text for easier regex matching
    // Remove markdown asterisks around labels (e.g., *Customer:* -> Customer:)
    normalizedText = normalizedText.replace(/\*([^*]+)\*/g, '$1');

    // Multiple patterns to match customer info across different email formats
    // Pattern 1: Standard format - "Customer:" followed by "NAME (ACCOUNT)" on same or next line
    // Pattern 2: HTML format with <br> - "Customer:</...><br>NAME (ACCOUNT)<br>"
    // Pattern 3: Plain text with newlines - "Customer:\nNAME (ACCOUNT)\n"

    // First, try to find customer name and account using a flexible pattern
    // This looks for "Customer" label followed by NAME (7-digit account number)
    const customerPatterns = [
        // HTML with various tag wrappers followed by <br>
        /Customer[:\s]*(?:<\/[^>]+>)*(?:<[^>]*>)*<br[^>]*>\s*([^(<\n]+)\s*\((\d{7})\)/i,
        // Plain text with newline
        /Customer[:\s]*[\r\n]+\s*([^(\r\n]+)\s*\((\d{7})\)/i,
        // Same line (no line break)
        /Customer[:\s]+([^(\r\n<]+)\s*\((\d{7})\)/i,
        // Fallback: just look for NAME (7-digit) pattern after "Customer" within 200 chars
        /Customer[:\s\S]{0,50}?([A-Z][A-Z\s&'.,-]+[A-Z])\s*\((\d{7})\)/i
    ];

    for (const pattern of customerPatterns) {
        const match = textToUse.match(pattern) || normalizedText.match(pattern);
        if (match) {
            customerInfo.customerName = match[1].trim();
            customerInfo.accountNumber = match[2].trim();
            console.log(`📋 Customer found via pattern: ${customerInfo.customerName} (${customerInfo.accountNumber})`);
            break;
        }
    }

    // If still no customer info, try extracting from subject line or fallback
    if (!customerInfo.customerName) {
        // Try subject line pattern: "Marchon Order Confirmation for CUSTOMER NAME"
        const subjectMatch = textToUse.match(/Marchon Order Confirmation for\s+([^\r\n<]+)/i);
        if (subjectMatch) {
            customerInfo.customerName = subjectMatch[1].trim();
            console.log(`📋 Customer name from subject: ${customerInfo.customerName}`);
        }
    }

    // Extract customer address (follows customer name)
    // Pattern: NAME (ACCOUNT)<br>ADDRESS<br>CITY, STATE ZIP
    const addressPatterns = [
        // HTML with <br> tags
        /Customer[:\s\S]*?\(\d{7}\)[^<]*<br[^>]*>\s*([^<\n]+)<br[^>]*>\s*([^,<\n]+),\s*([A-Z]{2})\s*(\d{5})/i,
        // Plain text with newlines
        /Customer[:\s\S]*?\(\d{7}\)\s*[\r\n]+\s*([^\r\n]+)[\r\n]+\s*([^,\r\n]+),\s*([A-Z]{2})\s*(\d{5})/i
    ];

    for (const pattern of addressPatterns) {
        const match = textToUse.match(pattern) || normalizedText.match(pattern);
        if (match) {
            customerInfo.customerAddress = match[1].trim();
            customerInfo.customerCity = match[2].trim();
            customerInfo.customerState = match[3].trim();
            customerInfo.customerPostalCode = match[4].trim();
            console.log(`📋 Customer address found: ${customerInfo.customerAddress}, ${customerInfo.customerCity}, ${customerInfo.customerState} ${customerInfo.customerPostalCode}`);
            break;
        }
    }

    // Extract Ship To info
    // Similar pattern variations as Customer
    const shipToPatterns = [
        // HTML with various tag wrappers followed by <br>
        /Ship\s*To[:\s]*(?:<\/[^>]+>)*(?:<[^>]*>)*<br[^>]*>\s*([^(<\n]+)\s*\((\d{7})\)<br[^>]*>\s*([^<\n]+)<br[^>]*>\s*([^,<\n]+),\s*([A-Z]{2})\s*(\d{5})/i,
        // Plain text with newlines
        /Ship\s*To[:\s]*[\r\n]+\s*([^(\r\n]+)\s*\((\d{7})\)[\r\n]+\s*([^\r\n]+)[\r\n]+\s*([^,\r\n]+),\s*([A-Z]{2})\s*(\d{5})/i,
        // Fallback: just capture name and account
        /Ship\s*To[:\s\S]{0,50}?([A-Z][A-Z\s&'.,-]+[A-Z])\s*\((\d{7})\)/i
    ];

    for (const pattern of shipToPatterns) {
        const match = textToUse.match(pattern) || normalizedText.match(pattern);
        if (match) {
            customerInfo.shipToName = match[1].trim();
            // Check if we got full address info (6 groups) or just name/account (2 groups)
            if (match[3]) {
                customerInfo.shipToAddress = match[3].trim();
                customerInfo.shipToCity = match[4].trim();
                customerInfo.shipToState = match[5].trim();
                customerInfo.shipToPostalCode = match[6].trim();
            }
            console.log(`📋 Ship To found: ${customerInfo.shipToName}`);
            break;
        }
    }

    // If we still don't have an account number, try to find any 7-digit number in parentheses
    if (!customerInfo.accountNumber) {
        const fallbackAccountMatch = textToUse.match(/\((\d{7})\)/);
        if (fallbackAccountMatch) {
            customerInfo.accountNumber = fallbackAccountMatch[1];
            console.log(`📋 Account number from fallback: ${customerInfo.accountNumber}`);
        }
    }

    return customerInfo;
}

/**
 * Extract items from HTML table
 * Marchon table structure:
 * Style (with image link) | Style Name + Color | Qty
 *
 * Handles two HTML formats:
 * 1. Original format: text directly in <td> with newlines
 * 2. Forwarded email format: <p> tags with <br> separating style/size
 */
function extractItems(html) {
    const items = [];

    if (!html) return items;

    try {
        const $ = cheerio.load(html);

        // Find the main table with frame data
        $('table').each((tableIndex, table) => {
            const $table = $(table);

            // Look for tables with item rows
            const rows = $table.find('tr');

            rows.each((rowIndex, row) => {
                const cells = $(row).find('td');

                // Skip header rows (bgcolor="#B2B4B2" or background: rgb(178, 180, 178))
                const bgColor = $(row).attr('bgcolor');
                const style = $(row).attr('style') || '';
                if (bgColor === '#B2B4B2' || style.includes('178, 180, 178')) return;

                // Also check first cell's background
                const firstCellStyle = $(cells[0]).attr('style') || '';
                if (firstCellStyle.includes('178, 180, 178')) return;

                // Looking for rows with 3 cells (image, style info, qty)
                if (cells.length !== 3) return;

                // Get the style cell - handle both plain text and nested <p>/<span> elements
                const $styleCell = $(cells[1]);
                let styleCell = $styleCell.text().trim();

                // Get HTML to check for <br> tags which separate style from size
                const styleCellHtml = $styleCell.html() || '';

                const qtyCell = $(cells[2]).text().trim();

                // Skip if no style info or qty is not a number
                if (!styleCell) return;
                const quantity = parseInt(qtyCell);
                if (isNaN(quantity) || quantity === 0) return;

                // Parse style: "SF2223N LIGHT GOLD/BURGUNDY\n(54 eye)" or "SF2223N LIGHT GOLD/BURGUNDY (54 eye)"
                let styleLines = styleCell.split('\n').map(l => l.trim()).filter(l => l);

                // If only 1 line but contains eye size pattern, try to split on it
                if (styleLines.length === 1) {
                    // Check if the HTML has <br> tags - indicates format where br separates style from size
                    if (styleCellHtml.includes('<br')) {
                        // Split by the eye size pattern: "MODEL COLOR (XX eye)"
                        const eyeMatch = styleCell.match(/^(.+?)\s*\((\d+)\s*eye\)\s*$/i);
                        if (eyeMatch) {
                            styleLines = [eyeMatch[1].trim(), `(${eyeMatch[2]} eye)`];
                        }
                    }
                }

                if (styleLines.length < 2) return;

                const styleAndColor = styleLines[0];
                const sizeMatch = styleLines[1]?.match(/\((\d+)\s*eye\)/i);
                const size = sizeMatch ? sizeMatch[1] : '';

                // Parse style and color: "SF2223N LIGHT GOLD/BURGUNDY"
                // Model is usually the first part before the color
                const parts = styleAndColor.split(/\s+/);
                const model = parts[0] || '';
                const color = parts.slice(1).join(' ') || '';

                // Determine brand from model prefix
                const brand = getBrandFromModel(model);

                // Try to extract image URL for potential UPC
                const imageLink = $(cells[0]).find('a').attr('href') || '';
                const imageUrl = $(cells[0]).find('img').attr('src') || '';

                // Extract color code and size from product URL
                // URL format: ...detail.cfm?frame=SF2223N&coll=SF&pickColor=744&pickSize=5417
                const cleanedProductUrl = cleanUrl(imageLink);
                const urlParams = extractUrlParams(cleanedProductUrl);

                const item = {
                    brand: brand,
                    model: model,
                    color: color,
                    colorCode: urlParams.pickColor || '',
                    colorName: color,
                    size: size,
                    eyeSize: size,
                    bridge: urlParams.bridge || '',
                    quantity: quantity,
                    imageUrl: cleanUrl(imageUrl),
                    productUrl: cleanedProductUrl,
                    // Store extracted URL params for API lookup
                    apiParams: {
                        frame: urlParams.frame || model,
                        collection: urlParams.coll || '',
                        pickColor: urlParams.pickColor || '',
                        pickSize: urlParams.pickSize || ''
                    }
                };

                items.push(item);

                console.log(`  ✓ ${item.brand} ${item.model} - ${item.color} (${item.size}) x${item.quantity}`);
            });
        });

    } catch (error) {
        console.error('❌ Error parsing Marchon items:', error.message);
    }

    // Deduplicate items - nested tables can cause the same item to appear multiple times
    // Use model + color + size as a unique key and aggregate quantities
    const itemMap = new Map();
    for (const item of items) {
        const key = `${item.model}-${item.colorCode || item.color}-${item.size}`;
        if (itemMap.has(key)) {
            // Item already exists - don't double count (duplicates are from nested tables, not actual quantity)
            // Keep the first occurrence which typically has the most complete data
            continue;
        }
        itemMap.set(key, item);
    }

    const deduplicatedItems = Array.from(itemMap.values());

    if (deduplicatedItems.length !== items.length) {
        console.log(`  📋 Deduplicated: ${items.length} raw -> ${deduplicatedItems.length} unique items`);
    }

    return deduplicatedItems;
}

/**
 * Determine brand from model prefix
 */
function getBrandFromModel(model) {
    const prefixToBrand = {
        'SF': 'Salvatore Ferragamo',
        'CK': 'Calvin Klein',
        'CKJ': 'Calvin Klein Jeans',
        'NK': 'Nike',
        'NIKE': 'Nike',
        'COL': 'Columbia',
        'C': 'Columbia',
        'DG': 'Dragon',
        'DRAGON': 'Dragon',
        'FL': 'Flexon',
        'FLEXON': 'Flexon',
        'L': 'Lacoste',
        'LACOSTE': 'Lacoste',
        'LO': 'Longchamp',
        'MNY': 'Marchon NYC',
        'MNYC': 'Marchon NYC',
        'NW': 'Nine West',
        'SKAGA': 'Skaga',
        'SEAN': 'Sean John',
        'JOE': 'Joe by Joseph Abboud',
        'JSK': 'JS Kids',
        'MCM': 'MCM',
        'CHLOE': 'Chloe',
        'CH': 'Chloe',
        'LIU': 'Liu Jo',
        'KARL': 'Karl Lagerfeld',
        'KL': 'Karl Lagerfeld',
        'DKNY': 'DKNY',
        'DK': 'Donna Karan'
    };

    // Try exact prefix match first
    for (const [prefix, brand] of Object.entries(prefixToBrand)) {
        if (model.toUpperCase().startsWith(prefix)) {
            return brand;
        }
    }

    // Default to Marchon if no match
    return 'Marchon';
}

/**
 * Clean URL by removing link protection wrappers
 */
function cleanUrl(url) {
    if (!url) return '';

    // Handle linkprotect.cudasvc.com wrapper
    if (url.includes('linkprotect.cudasvc.com')) {
        const match = url.match(/[?&]a=([^&]+)/);
        if (match) {
            try {
                return decodeURIComponent(match[1]);
            } catch (e) {
                return url;
            }
        }
    }

    return url;
}

/**
 * Extract parameters from product URL
 * URL format: https://www.altaireyewear.com/detail.cfm?frame=SF2223N&coll=SF&pickColor=744&pickSize=5417
 * pickSize format: "5417" = 54 eye, 17 bridge
 */
function extractUrlParams(url) {
    const params = {
        frame: '',
        coll: '',
        pickColor: '',
        pickSize: '',
        eyeSize: '',
        bridge: ''
    };

    if (!url) return params;

    try {
        const urlObj = new URL(url);
        params.frame = urlObj.searchParams.get('frame') || '';
        params.coll = urlObj.searchParams.get('coll') || '';
        params.pickColor = urlObj.searchParams.get('pickColor') || '';
        params.pickSize = urlObj.searchParams.get('pickSize') || '';

        // Parse pickSize: "5417" = 54 eye, 17 bridge
        if (params.pickSize && params.pickSize.length === 4) {
            params.eyeSize = params.pickSize.substring(0, 2);
            params.bridge = params.pickSize.substring(2, 4);
        }
    } catch (e) {
        // Try regex fallback for malformed URLs
        const frameMatch = url.match(/frame=([^&]+)/i);
        const collMatch = url.match(/coll=([^&]+)/i);
        const colorMatch = url.match(/pickColor=([^&]+)/i);
        const sizeMatch = url.match(/pickSize=([^&]+)/i);

        params.frame = frameMatch ? frameMatch[1] : '';
        params.coll = collMatch ? collMatch[1] : '';
        params.pickColor = colorMatch ? colorMatch[1] : '';
        params.pickSize = sizeMatch ? sizeMatch[1] : '';

        if (params.pickSize && params.pickSize.length === 4) {
            params.eyeSize = params.pickSize.substring(0, 2);
            params.bridge = params.pickSize.substring(2, 4);
        }
    }

    return params;
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

    // Check for items without brand detection
    const unknownBrandItems = parsedData.items.filter(item => item.brand === 'Marchon');
    if (unknownBrandItems.length > 0) {
        warnings.push(`${unknownBrandItems.length} items could not be matched to a specific brand`);
    }

    return {
        valid: errors.length === 0,
        errors,
        warnings
    };
}

module.exports = {
    parseMarchonHtml,
    validateParsedData,
    getBrandFromModel
};

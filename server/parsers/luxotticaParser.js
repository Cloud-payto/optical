const cheerio = require('cheerio');

/**
 * Parse Luxottica HTML emails
 * Extracts plain text content from HTML and parses order details and line items
 * @param {string} html - The HTML content of the email
 * @param {string} plainText - The plain text content of the email (optional)
 * @returns {object} Parsed order data
 */
function parseLuxotticaHtml(html, plainText) {
    console.log('📧 Starting Luxottica email parsing...');

    // Extract content from HTML - we need the HTML within <pre> tag, not just text
    let contentToUse = html;

    if (html) {
        try {
            const $ = cheerio.load(html);
            // Luxottica emails have content in <pre> tags - get the HTML content
            const preElement = $('pre');
            if (preElement.length > 0) {
                // Get HTML content, not text
                contentToUse = preElement.html() || html;
                console.log('📄 Extracted HTML from <pre> tag, length:', contentToUse.length);
            }
        } catch (error) {
            console.error('❌ Error extracting from HTML:', error);
            contentToUse = html;
        }
    } else if (plainText) {
        contentToUse = plainText;
    }

    if (!contentToUse) {
        throw new Error('No content to parse');
    }

    // Identify vendor
    const vendor = 'luxottica';

    // Extract order header information
    const orderInfo = extractOrderInfo(contentToUse);
    console.log('📋 Order Info:', orderInfo);

    // Extract all items grouped by brand
    const items = extractItems(contentToUse, vendor, orderInfo.cartNumber);
    console.log('📦 Total items found:', items.length);

    // Get unique frames (brand + model combinations)
    const uniqueFrames = getUniqueFrames(items);
    console.log('🔍 Unique frames:', uniqueFrames.length);

    // Return in standard format
    return {
        vendor: vendor,
        account_number: orderInfo.accountNumber,
        order: {
            order_number: orderInfo.cartNumber,
            customer_name: orderInfo.customerName,
            order_date: orderInfo.orderDate,
            total_pieces: items.reduce((sum, item) => sum + item.quantity, 0),
            rep_name: orderInfo.repName,
            payment_terms: orderInfo.paymentTerms,
            promo_code: orderInfo.promoCode,
            total_value: orderInfo.totalValue
        },
        items: items,
        unique_frames: uniqueFrames
    };
}

/**
 * Extract order header information
 * @param {string} text - Plain text content
 * @returns {object} Order information
 */
function extractOrderInfo(text) {
    const info = {};

    // Agent reference: Risa Shaver (206098)
    const agentMatch = text.match(/Agent reference:\s*([^\(]+)\s*\((\d+)\)/);
    if (agentMatch) {
        info.repName = agentMatch[1].trim();
        info.repCode = agentMatch[2];
    }

    // Customer Reference: TATUM EYECARE 7070 TATUM EYECARE
    // Stop at <br> or "Customer code"
    const customerMatch = text.match(/Customer Reference:\s*([^<\n\r]+?)(?=\s*(?:<br|Customer code|$))/i);
    if (customerMatch) {
        info.customerName = customerMatch[1].trim();
    }

    // Customer code: 0001247652
    const accountMatch = text.match(/Customer code:\s*(\d+)/);
    if (accountMatch) {
        info.accountNumber = accountMatch[1];
    }

    // Cart number: 1757452162354
    const cartMatch = text.match(/Cart number:\s*(\d+)/);
    if (cartMatch) {
        info.cartNumber = cartMatch[1];
    }

    // Order date: 09-09-2025
    const dateMatch = text.match(/Order date:\s*([\d\-]+)/);
    if (dateMatch) {
        info.orderDate = dateMatch[1];
    }

    // Payment terms: 2%/10 EOM (stop at <br> or next field)
    const paymentMatch = text.match(/Payment terms:\s*([^<\n\r]+?)(?=\s*(?:<br|Promo code|$))/i);
    if (paymentMatch) {
        info.paymentTerms = paymentMatch[1].trim();
    }

    // Promo code: 116319 (stop at newline or BURBERRY)
    const promoMatch = text.match(/Promo code:\s*(\d+)/);
    if (promoMatch) {
        info.promoCode = promoMatch[1];
    }

    // Total: 4,894.44 USD (near the end)
    const totalMatch = text.match(/Total:\s*([\d,]+\.\d{2})\s*USD/);
    if (totalMatch) {
        info.totalValue = parseFloat(totalMatch[1].replace(/,/g, ''));
    }

    return info;
}

/**
 * Extract all items from the email, grouped by brand
 * @param {string} text - HTML content with <br> tags
 * @param {string} vendor - Vendor name
 * @param {string} orderNumber - Order/cart number
 * @returns {Array} Array of item objects
 */
function extractItems(text, vendor, orderNumber) {
    const items = [];

    // Look for brand headers like "BURBERRY (12)" or "DOLCE E GABBANA (12)"
    // These are in <font size="5"><b><i>BRAND NAME (count)</i></b></font>
    const brandPattern = /<font size="5"><b><i>([A-Z\s&]+)\s*\((\d+)\)\s*<\/i><\/b>\s*<\/font>/g;
    const brands = [];
    let match;

    while ((match = brandPattern.exec(text)) !== null) {
        const brandName = match[1].trim();
        // Skip if it looks like a model number (starts with digit or 0)
        if (/^\d/.test(brandName)) {
            continue;
        }
        brands.push({
            name: brandName,
            count: parseInt(match[2]),
            startIndex: match.index
        });
    }

    console.log('🏷️  Found brands:', brands.map(b => `${b.name} (${b.count})`).join(', '));

    // Extract items for each brand
    for (let i = 0; i < brands.length; i++) {
        const brand = brands[i];
        const nextBrand = brands[i + 1];

        // Get text section for this brand
        const sectionStart = brand.startIndex;
        const sectionEnd = nextBrand ? nextBrand.startIndex : text.indexOf('Total Number of Items');
        const brandText = text.substring(sectionStart, sectionEnd);

        // Extract items from this brand section
        const brandItems = extractBrandItems(brandText, brand.name, vendor, orderNumber);
        items.push(...brandItems);
    }

    return items;
}

/**
 * Extract brand name from section header
 * @param {string} section - Text section
 * @returns {string} Brand name
 */
function extractBrandName(section) {
    // Try to find brand name in bold italic tags or at start of section
    const brandMatch = section.match(/<i>([A-Z\s&]+)\s*\(\d+\)/);
    if (brandMatch) {
        return normalizeBrandName(brandMatch[1].trim());
    }

    // Fallback: look at first line
    const firstLine = section.split('\n')[0];
    if (firstLine) {
        return normalizeBrandName(firstLine.trim());
    }

    return 'Unknown';
}

/**
 * Normalize brand names to consistent format
 * @param {string} brand - Brand name
 * @returns {string} Normalized brand name
 */
function normalizeBrandName(brand) {
    const brandMap = {
        'BURBERRY': 'BURBERRY',
        'DOLCE E GABBANA': 'DOLCE & GABBANA',
        'D&G': 'DOLCE & GABBANA',
        'PRADA': 'PRADA',
        'RAY-BAN': 'RAY-BAN',
        'RAYBAN': 'RAY-BAN',
        'OAKLEY': 'OAKLEY',
        'VERSACE': 'VERSACE',
        'COACH': 'COACH',
        'MICHAEL KORS': 'MICHAEL KORS',
        'TORY BURCH': 'TORY BURCH',
        'VOGUE': 'VOGUE',
        'PERSOL': 'PERSOL',
        'POLO': 'POLO RALPH LAUREN',
        'RALPH LAUREN': 'RALPH LAUREN',
        'EMPORIO ARMANI': 'EMPORIO ARMANI',
        'GIORGIO ARMANI': 'GIORGIO ARMANI',
        'ARNETTE': 'ARNETTE',
        'ALAIN MIKLI': 'ALAIN MIKLI',
        'MIU MIU': 'MIU MIU'
    };

    const normalized = brand.toUpperCase().trim();
    return brandMap[normalized] || brand;
}

/**
 * Extract items from a brand section
 * @param {string} section - HTML section for one brand
 * @param {string} brandName - Name of the brand
 * @returns {Array} Array of item objects
 */
function extractBrandItems(section, brandName) {
    const items = [];

    // Pattern to match model headers (they look like products: 0BE3080, 0DG1355, 0PR 02ZV)
    // These are in <font size="5"><b><i>MODEL (count)</i></b></font>
    const modelPattern = /<font size="5"><b><i>([^<]+)<\/i><\/b><\/font>/g;
    const models = [];
    let modelMatch;

    while ((modelMatch = modelPattern.exec(section)) !== null) {
        const header = modelMatch[1].trim();
        // Skip the brand header itself
        if (header === brandName || header.includes(brandName)) {
            continue;
        }
        models.push({
            header: header,
            startIndex: modelMatch.index,
            endIndex: modelMatch.index + modelMatch[0].length
        });
    }

    console.log(`  📦 Found ${models.length} models for ${brandName}`);

    // Process each model section
    for (let i = 0; i < models.length; i++) {
        const model = models[i];
        const nextModel = models[i + 1];

        const modelStart = model.endIndex;
        const modelEnd = nextModel ? nextModel.startIndex : section.length;
        const modelText = section.substring(modelStart, modelEnd);

        // Extract model name and optional collection/tag
        const modelInfo = parseModelHeader(model.header);

        // Extract individual items (variants) for this model
        const variants = extractModelVariants(modelText, brandName, modelInfo);
        items.push(...variants);
    }

    return items;
}

/**
 * Parse model header to extract model name and optional collection/tag
 * @param {string} header - Model header text (e.g., "0BE1375 - DOUGLAS (1)", "0BE3080 (1)", or "0PR 02ZV (1)")
 * @returns {object} Model information
 */
function parseModelHeader(header) {
    // Pattern with collection: "0BE1375 - DOUGLAS (1)"
    // Pattern without collection: "0BE3080 (1)" or "0PR 02ZV (1)"

    // Try with collection first
    const withCollection = header.match(/^(.+?)\s*-\s*([^\(]+)\s*\((\d+)\)/);
    if (withCollection) {
        return {
            model: withCollection[1].trim(),
            collection: withCollection[2].trim(),
            count: parseInt(withCollection[3])
        };
    }

    // Try without collection: extract everything before (count)
    const withoutCollection = header.match(/^(.+?)\s*\((\d+)\)/);
    if (withoutCollection) {
        return {
            model: withoutCollection[1].trim(),
            collection: null,
            count: parseInt(withoutCollection[2])
        };
    }

    // Fallback: just use the header
    return {
        model: header.trim(),
        collection: null,
        count: 1
    };
}

/**
 * Extract individual variants (color/size combinations) for a model
 * @param {string} text - HTML text for one model (with <br> tags)
 * @param {string} brandName - Brand name
 * @param {object} modelInfo - Model information
 * @returns {Array} Array of item objects
 */
function extractModelVariants(text, brandName, modelInfo) {
    const items = [];

    // Split by <br> tags to get individual lines
    const lines = text.split(/<br\s*\/?>/i).map(line => {
        // Strip any remaining HTML tags and trim
        return line.replace(/<[^>]*>/g, '').trim();
    }).filter(line => line);

    let currentColorCode = null;
    let currentColorDesc = null;

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];

        // Check if this is a color line (has " - " separator)
        // Example: "114513  -  LIGHT GOLD / BROWN GRADIENT"
        const colorMatch = line.match(/^(\w+)\s*-\s*(.+)$/);
        if (colorMatch) {
            currentColorCode = colorMatch[1].trim();
            currentColorDesc = colorMatch[2].trim();
            continue;
        }

        // Check if this is an item detail line
        // Example: "59  8053672321005        USD 136.52     1       09-10-2025"
        const itemMatch = line.match(/^(\d+)\s+(\d+)\s+USD\s+([\d,]+\.\d{2})\s+(\d+)\s+([\d\-]+)/);
        if (itemMatch && currentColorCode && currentColorDesc) {
            const size = itemMatch[1];
            const upc = itemMatch[2];
            const price = parseFloat(itemMatch[3].replace(/,/g, ''));
            const quantity = parseInt(itemMatch[4]);
            const shippingDate = itemMatch[5];

            items.push({
                brand: brandName,
                model: modelInfo.model,
                collection: modelInfo.collection,
                color_code: currentColorCode,
                color: currentColorDesc,
                size: size,
                upc: upc,
                wholesale_price: price,
                quantity: quantity,
                shipping_date: shippingDate,
                sku: `${brandName}-${modelInfo.model}-${currentColorCode}-${size}`.replace(/\s+/g, '_')
            });
        }
    }

    return items;
}

/**
 * Get unique frames (brand + model combinations)
 * @param {Array} items - Array of items
 * @returns {Array} Array of unique frame identifiers
 */
function getUniqueFrames(items) {
    const frameSet = new Set();
    const uniqueFrames = [];

    items.forEach(item => {
        const frameKey = `${item.brand}-${item.model}`;
        if (!frameSet.has(frameKey)) {
            frameSet.add(frameKey);
            uniqueFrames.push({
                brand: item.brand,
                model: item.model,
                collection: item.collection
            });
        }
    });

    return uniqueFrames;
}

module.exports = {
    parseLuxotticaHtml
};

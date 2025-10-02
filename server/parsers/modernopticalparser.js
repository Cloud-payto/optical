const cheerio = require('cheerio');

// Color mapping for normalization - matches ModernOpticalWebService
const colorMap = new Map([
    // Basic colors
    ['BLK', 'Black'], ['BLACK', 'Black'],
    ['GM', 'Gunmetal'], ['GUN', 'Gunmetal'], ['GUNMETAL', 'Gunmetal'],
    ['SIL', 'Silver'], ['SILVER', 'Silver'],
    ['GLD', 'Gold'], ['GOLD', 'Gold'],
    ['BR', 'Brown'], ['BROWN', 'Brown'],
    ['BL', 'Blue'], ['BLUE', 'Blue'],
    ['GR', 'Gray'], ['GRAY', 'Gray'], ['GREY', 'Grey'],
    ['GN', 'Green'], ['GREEN', 'Green'],
    ['RD', 'Red'], ['RED', 'Red'],
    ['WH', 'White'], ['WHITE', 'White'],
    ['CL', 'Clear'], ['CLEAR', 'Clear'],
    ['TORT', 'Tortoise'], ['TORTOISE', 'Tortoise'],
    ['DEMI', 'Demi'],
    
    // Additional colors from emails
    ['NAVY', 'Navy'], ['NVY', 'Navy'],
    ['AQUA', 'Aqua'],
    ['TEAL', 'Teal'],
    ['PINK', 'Pink'], ['PK', 'Pink'],
    ['RUST', 'Rust'],
    ['BURG', 'Burgundy'], ['BURGUNDY', 'Burgundy'],
    ['FADE', 'Fade'],
    ['CRY', 'Crystal'], ['CRYST', 'Crystal'], ['CRYSTAL', 'Crystal'],
    
    // Special patterns
    ['CLEO', 'Cleo']
]);

/**
 * Normalize email color names to match website format
 * @param {string} colorName 
 * @returns {string}
 */
function normalizeEmailColor(colorName) {
    if (!colorName) return '';
    
    // Handle compound colors with slashes first
    if (colorName.includes('/')) {
        const parts = colorName.split('/').map(part => normalizeColorPart(part.trim()));
        return parts.join('/');
    }
    
    // Handle multi-word color descriptions like "CLEO BLACK CRY"
    if (colorName.includes(' ')) {
        const words = colorName.split(' ').map(word => normalizeColorPart(word.trim()));
        return words.join(' ');
    }
    
    // Single color part
    return normalizeColorPart(colorName);
}

/**
 * Normalize a single color part
 * @param {string} colorPart 
 * @returns {string}
 */
function normalizeColorPart(colorPart) {
    if (!colorPart) return '';
    
    const upperColor = colorPart.toUpperCase();
    
    // Try exact match first
    if (colorMap.has(upperColor)) {
        return colorMap.get(upperColor);
    }
    
    // For longer words, try partial matches
    for (const [abbrev, fullName] of colorMap.entries()) {
        if (upperColor === abbrev || 
            (colorPart.length <= 4 && upperColor.includes(abbrev)) ||
            (abbrev.length > 3 && upperColor.includes(abbrev))) {
            return fullName;
        }
    }
    
    // Return original with proper case if no mapping found
    return colorPart.charAt(0).toUpperCase() + colorPart.slice(1).toLowerCase();
}

/**
 * Parse Modern Optical HTML emails
 * @param {string} html - The HTML content of the email
 * @param {string} plainText - The plain text content of the email
 * @returns {object} Parsed order data
 */
function parseModernOpticalHtml(html, plainText) {
    // Temporarily disable HTML parsing to avoid cheerio dependency issues
    // const $ = cheerio.load(html);
    
    // Use plain text if provided, otherwise extract from HTML
    const textToUse = plainText || html;
    
    // Identify vendor
    const vendor = 'Modern Optical';
    
    // Extract order details - improved patterns
    const orderNumber = textToUse.match(/Order\s*(?:Number|#)?\s*:?\s*(\d+)/i)?.[1] || '';
    const repName = textToUse.match(/Placed By Rep:\s*([^\n]+)/)?.[1]?.trim() || '';
    const orderDate = textToUse.match(/Date:\s*([\d\/]+)/)?.[1]?.trim() || '';

    // Debug logging for order details
    console.log('📋 Modern Optical Parser - Order Details:');
    console.log('  Order Number:', orderNumber);
    console.log('  Rep Name:', repName);
    console.log('  Order Date:', orderDate);

    // Improved account number extraction
    function extractAccountNumber(text) {
        const patterns = [
            /\((\d{5,6})\)(?![\s\d-])/, // 5-6 digits in parentheses, not phone numbers
            /Customer[\s\S]*?([A-Z\s&.]+)\s*\((\d{4,6})\)/, // In customer section
            /Account\s*#?\s*:?\s*(\d{4,6})\b/i // Explicit account format
        ];
        
        for (const pattern of patterns) {
            const match = text.match(pattern);
            if (match) return match[match.length - 1];
        }
        return '';
    }
    
    // Improved customer name extraction
    function extractCustomerName(text) {
        console.log('\n🔍 CUSTOMER NAME EXTRACTION DEBUG:');

        // First, let's see what we're working with
        const customerSection = text.match(/Customer<\/h3>[\s\S]{0,300}/);
        if (customerSection) {
            console.log('📝 HTML Section Found:');
            console.log(customerSection[0].substring(0, 300));
            console.log('\n');
        } else {
            console.log('⚠️ No Customer<\/h3> found in HTML - trying plain text...\n');
        }

        // Pattern 1: Look for text after Customer header with account in parentheses
        // Match: "MARANA EYE CARE (93277)" or "CUSTOMER NAME (12345)"
        const pattern1 = text.match(/Customer<\/h3>[\s\S]*?<p[^>]*>\s*([A-Z][A-Z0-9\s&.,'@-]+?)\s*\((\d{4,6})\)/);
        if (pattern1) {
            const name = pattern1[1].trim();
            console.log('✓ Pattern 1 matched:', name);
            if (name && name.length > 2 && name !== 'Customer') {
                console.log('  ✅ Customer name extracted (Pattern 1):', name);
                return name;
            }
        } else {
            console.log('✗ Pattern 1 did not match');
        }

        // Pattern 2: Match first line after card-text that has capital letters
        const pattern2 = text.match(/Customer<\/h3>[\s\S]*?card-text[^>]*>[\s\n]*([A-Z][A-Z0-9\s&.,'@()-]+?)[\s\n]*(?:\(|\<br|<\/)/i);
        if (pattern2) {
            let name = pattern2[1].trim();
            // Clean up account number if it got captured
            name = name.replace(/\s*\(\d{4,6}\).*$/, '').trim();
            console.log('✓ Pattern 2 matched:', name);
            if (name && name.length > 2 && name !== 'Customer') {
                console.log('  ✅ Customer name extracted (Pattern 2):', name);
                return name;
            }
        } else {
            console.log('✗ Pattern 2 did not match');
        }

        // Pattern 3: Aggressive fallback - strip ALL HTML and find first valid line
        const pattern3 = text.match(/Customer<\/h3>[\s\S]{0,500}?<\/div>/);
        if (pattern3) {
            console.log('✓ Pattern 3 section found, processing...');
            const stripped = pattern3[0]
                .replace(/<[^>]*>/g, '\n') // Replace tags with newlines
                .split('\n')
                .map(line => line.trim())
                .filter(line => {
                    // Must start with capital, be longer than 2 chars, and not be "Customer"
                    return line &&
                           line.length > 2 &&
                           /^[A-Z]/.test(line) &&
                           line !== 'Customer' &&
                           !line.match(/^\d+$/) && // Not just numbers
                           !line.match(/^Phone:/i); // Not phone line
                });

            console.log('  Stripped lines:', stripped);

            if (stripped.length > 0) {
                let name = stripped[0];
                // Remove account number in parentheses
                name = name.replace(/\s*\(\d{4,6}\).*$/, '').trim();
                if (name) {
                    console.log('  ✅ Customer name extracted (Pattern 3):', name);
                    return name;
                }
            }
        } else {
            console.log('✗ Pattern 3 did not match');
        }

        // Pattern 4: Plain text fallback - look for customer name with account number
        // For forwarded emails or when HTML parsing fails
        console.log('🔄 Trying plain text patterns...');

        // Match patterns like "MARANA EYE CARE (93277)" in plain text
        const plainPattern1 = text.match(/([A-Z][A-Z0-9\s&.,'@-]{3,50}?)\s*\((\d{4,6})\)/);
        if (plainPattern1) {
            const name = plainPattern1[1].trim();
            // Make sure it's not an email subject or other metadata
            if (name &&
                name.length > 3 &&
                !name.match(/order|receipt|subject|from:|to:/i) &&
                !name.match(/^\d/) // Doesn't start with number
            ) {
                console.log('  ✅ Customer name extracted (Plain Text Pattern):', name);
                return name;
            }
        }

        console.log('❌ Customer name not found\n');
        return '';
    }
    
    let accountNumber = extractAccountNumber(textToUse);
    const customerName = extractCustomerName(html || textToUse); // Use HTML for better parsing

    // Debug logging for customer info
    console.log('  Account Number:', accountNumber);
    console.log('  Customer Name:', customerName);

    // Extract items and collect unique brands
    const items = [];
    const brands = new Set();
    const uniqueFrames = new Map(); // Track unique brand-model combinations
    
    try {
        // Load HTML with cheerio for proper parsing
        const $ = cheerio.load(html);
        
        // Modern Optical emails have items in table format
        // Look for table rows containing frame data
        $('tbody tr').each((index, row) => {
            const $row = $(row);
            const cells = $row.find('td');
            
            // Skip empty separator rows
            if (cells.length >= 5) {
                // Extract data from each cell
                const imageCell = $(cells[0]).text().trim();
                const modelCell = $(cells[1]).text().trim();
                const colorCell = $(cells[2]).text().trim();
                const sizeCell = $(cells[3]).text().trim();
                const qtyCell = $(cells[4]).text().trim();
                
                // Check if this row contains actual frame data
                if (modelCell && colorCell && sizeCell && qtyCell && 
                    !modelCell.includes('Model') && !modelCell.includes('Image') &&
                    modelCell.includes(' - ')) {
                    
                    // Parse the model field which contains "BRAND - MODEL"
                    const [brandPart, modelPart] = modelCell.split(' - ');
                    
                    if (brandPart && modelPart) {
                        const cleanBrand = brandPart.trim();
                        const cleanModel = modelPart.trim();
                        const cleanColor = colorCell.trim();
                        const normalizedColor = normalizeEmailColor(cleanColor);
                        const size = sizeCell.trim();
                        const quantity = parseInt(qtyCell.trim()) || 1;
                        
                        // Create unique frame identifier
                        const frameId = `${cleanBrand}-${cleanModel}`;
                        
                        brands.add(cleanBrand);
                        
                        // Track unique frames to avoid duplicates when webscraping
                        if (!uniqueFrames.has(frameId)) {
                            uniqueFrames.set(frameId, {
                                brand: cleanBrand,
                                model: cleanModel,
                                colorways: [],
                                totalQuantity: 0
                            });
                        }
                        
                        // Add this colorway to the frame
                        const frame = uniqueFrames.get(frameId);
                        frame.colorways.push({
                            color: cleanColor,
                            color_normalized: normalizedColor,
                            size: size,
                            quantity: quantity
                        });
                        frame.totalQuantity += quantity;
                        
                        // Still create individual items for each colorway (for backwards compatibility)
                        const sku = `${cleanBrand.replace(/\s+/g, '_')}-${cleanModel.replace(/\s+/g, '_')}-${cleanColor.replace(/[\s\/]/g, '_')}`;
                        items.push({
                            sku: sku,
                            brand: cleanBrand,
                            model: cleanModel,
                            color: cleanColor,
                            color_normalized: normalizedColor,
                            size: size,
                            quantity: quantity,
                            vendor,
                            status: 'pending',
                            order_number: orderNumber,
                            frame_id: frameId // Add frame identifier for grouping
                        });
                    }
                }
            }
        });
        
        // If no items found with table parsing, try alternative parsing methods
        if (items.length === 0) {
            // Try parsing from plain text patterns
            const lines = textToUse.split('\n');
            
            for (const line of lines) {
                const cleanLine = line.trim();
                
                // Look for frame patterns in text
                const frameMatch = cleanLine.match(/([A-Z\s\+&\.]+)\s*-\s*([A-Z\s]+)\s*-?\s*([A-Z\s\/\_\-]+)?\s+(\d+)?\s+(\d+)?/i);
                
                if (frameMatch && cleanLine.length > 10 && !cleanLine.includes('Total')) {
                    const [, brand, model, color, size, quantity] = frameMatch;
                    
                    // Skip obvious header/footer lines
                    if (brand && model && !brand.includes('ITEM') && !brand.includes('ORDER')) {
                        const cleanBrand = brand.trim().replace(/\s+/g, ' ');
                        const cleanModel = model.trim().replace(/\s+/g, ' ');
                        const cleanColor = (color || 'UNKNOWN').trim().replace(/\s+/g, ' ').replace(/_/g, ' ');
                        const itemSize = size || '55';
                        const itemQty = quantity || '1';
                        const sku = `${cleanBrand.replace(/\s+/g, '_')}-${cleanModel.replace(/\s+/g, '_')}-${cleanColor.replace(/[\s\/]/g, '_')}`;
                        
                        brands.add(cleanBrand);
                        items.push({
                            sku: sku,
                            brand: cleanBrand,
                            model: cleanModel,
                            color: cleanColor,
                            size: itemSize,
                            quantity: parseInt(itemQty) || 1,
                            vendor,
                            status: 'pending',
                            order_number: orderNumber
                        });
                    }
                }
            }
        }
        
    } catch (parseError) {
        console.error('Error parsing HTML:', parseError);
        
        // Fallback to text-based parsing if HTML parsing fails
        const lines = textToUse.split('\n');
        for (const line of lines) {
            const cleanLine = line.trim();
            if (cleanLine.includes('-') && cleanLine.length > 10 && !cleanLine.includes('Total')) {
                // Basic fallback parsing
                const parts = cleanLine.split(/\s+/);
                if (parts.length >= 3) {
                    const brand = parts[0] || 'UNKNOWN';
                    const model = parts[1] || 'MODEL';
                    const sku = `${brand}-${model}-${Date.now()}`;
                    
                    brands.add(brand);
                    items.push({
                        sku: sku,
                        brand: brand,
                        model: model,
                        color: 'UNKNOWN',
                        size: '55',
                        quantity: 1,
                        vendor,
                        status: 'pending',
                        order_number: orderNumber
                    });
                }
            }
        }
    }
    
    // Extract totals
    const totalPieces = textToUse.match(/Total Pieces:\s*(\d+)/)?.[1] || '0';
    
    return {
        vendor,
        account_number: accountNumber,
        brands: Array.from(brands),
        order: {
            order_number: orderNumber,
            vendor: vendor,
            account_number: accountNumber,
            rep_name: repName,
            order_date: orderDate,
            customer_name: customerName,
            total_pieces: parseInt(totalPieces),
            parse_status: 'parsed'
        },
        items: items,
        unique_frames: Array.from(uniqueFrames.values()), // Add unique frames for webscraping optimization
        frames_summary: {
            total_items: items.length,
            unique_frames: uniqueFrames.size,
            total_colorways: items.length
        },
        parsed_at: new Date().toISOString(),
        parser_version: '1.1.0'
    };
}

module.exports = {
    parseModernOpticalHtml
};
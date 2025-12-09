const cheerio = require('cheerio');

/**
 * Email Normalizer
 *
 * Strips email provider-specific wrappers (Zoho, Gmail, Outlook) from forwarded emails
 * to provide clean HTML that vendor-specific parsers can reliably parse.
 *
 * Provider-specific patterns detected:
 *
 * ZOHO:
 * - zmail_extra_hr, zmail_extra classes
 * - blockquote_zmail, blockquote id="blockquote_zmail"
 * - zm_* prefixed classes (e.g., zm_2660310629686955222_parse_*)
 * - data-zbluepencil-ignore attribute
 *
 * GMAIL:
 * - gmail_quote, gmail_quote_container classes
 * - gmail_attr class (forwarding header)
 * - gmail_sendername class
 * - msg-* prefixed classes (e.g., msg-1967548390234758888)
 * - m_-* prefixed classes
 *
 * OUTLOOK:
 * - WordSection1 class
 * - MsoNormal, MsoNormalTable classes
 * - <o:p> tags (Office namespace)
 * - xmlns:o, xmlns:v, xmlns:w, xmlns:m namespaces
 * - <!--[if !mso]> conditional comments
 * - x_* prefixed classes (when forwarded through other providers)
 */

/**
 * Detect which email provider(s) wrapped the email
 * @param {string} html - The HTML content
 * @returns {string[]} Array of detected providers
 */
function detectProviders(html) {
    const providers = [];

    // Zoho patterns
    if (html.includes('zmail_extra') ||
        html.includes('blockquote_zmail') ||
        html.includes('data-zbluepencil-ignore') ||
        /class="zm_\d+/.test(html)) {
        providers.push('zoho');
    }

    // Gmail patterns
    if (html.includes('gmail_quote') ||
        html.includes('gmail_attr') ||
        html.includes('gmail_sendername') ||
        /class="msg-\d+/.test(html) ||
        /class="m_-?\d+/.test(html)) {
        providers.push('gmail');
    }

    // Outlook patterns
    if (html.includes('WordSection1') ||
        html.includes('MsoNormal') ||
        html.includes('MsoNormalTable') ||
        html.includes('<o:p>') ||
        html.includes('xmlns:o=') ||
        html.includes('urn:schemas-microsoft-com:office')) {
        providers.push('outlook');
    }

    return providers;
}

/**
 * Clean Zoho-specific wrappers
 * @param {CheerioStatic} $ - Cheerio instance
 */
function cleanZoho($) {
    // Remove Zoho's horizontal rule divider
    $('.zmail_extra_hr').remove();

    // Remove the "Forwarded message" header div and clean zmail_extra class
    $('.zmail_extra').each((i, el) => {
        const $el = $(el);
        const text = $el.text();
        if (text.includes('Forwarded message') || text.includes('============')) {
            // Just remove the forwarding header, not the content
            $el.find('> div').first().remove();
        }
        // Remove the zmail_extra class but keep the element
        const classes = $el.attr('class') || '';
        const cleanedClasses = classes
            .split(' ')
            .filter(c => !c.startsWith('zmail_'))
            .join(' ');
        if (cleanedClasses) {
            $el.attr('class', cleanedClasses);
        } else {
            $el.removeAttr('class');
        }
    });

    // Unwrap blockquote_zmail - keep content, remove wrapper
    $('blockquote[id="blockquote_zmail"]').each((i, el) => {
        $(el).replaceWith($(el).html());
    });

    // Remove Zoho-specific class prefixes (zm_*)
    $('[class*="zm_"]').each((i, el) => {
        const $el = $(el);
        const classes = $el.attr('class') || '';
        const cleanedClasses = classes
            .split(' ')
            .filter(c => !c.startsWith('zm_'))
            .join(' ');
        if (cleanedClasses) {
            $el.attr('class', cleanedClasses);
        } else {
            $el.removeAttr('class');
        }
    });

    // Remove x_* prefixed classes (Zoho adds these to Outlook content)
    $('[class*="x_"]').each((i, el) => {
        const $el = $(el);
        const classes = $el.attr('class') || '';
        const cleanedClasses = classes
            .split(' ')
            .filter(c => !c.startsWith('x_'))
            .join(' ');
        if (cleanedClasses) {
            $el.attr('class', cleanedClasses);
        } else {
            $el.removeAttr('class');
        }
    });

    // Remove data-zbluepencil-ignore attribute
    $('[data-zbluepencil-ignore]').removeAttr('data-zbluepencil-ignore');
}

/**
 * Clean Gmail-specific wrappers
 * @param {CheerioStatic} $ - Cheerio instance
 */
function cleanGmail($) {
    // Remove Gmail's forwarding header
    $('.gmail_attr').remove();

    // Remove gmail_sendername wrapper but keep text
    $('.gmail_sendername').each((i, el) => {
        $(el).replaceWith($(el).text());
    });

    // Unwrap gmail_quote containers - keep content
    $('.gmail_quote_container').each((i, el) => {
        $(el).replaceWith($(el).html());
    });

    $('.gmail_quote').each((i, el) => {
        $(el).replaceWith($(el).html());
    });

    // Remove msg-* prefixed classes and wrappers
    $('[class*="msg-"]').each((i, el) => {
        const $el = $(el);
        const classes = $el.attr('class') || '';
        const cleanedClasses = classes
            .split(' ')
            .filter(c => !c.startsWith('msg-') && !c.startsWith('msg'))
            .join(' ');
        if (cleanedClasses) {
            $el.attr('class', cleanedClasses);
        } else {
            $el.removeAttr('class');
        }
    });

    // Remove m_-* prefixed classes (Gmail adds these)
    $('[class*="m_"]').each((i, el) => {
        const $el = $(el);
        const classes = $el.attr('class') || '';
        const cleanedClasses = classes
            .split(' ')
            .filter(c => !c.match(/^m_-?\d/))
            .join(' ');
        if (cleanedClasses) {
            $el.attr('class', cleanedClasses);
        } else {
            $el.removeAttr('class');
        }
    });
}

/**
 * Clean Outlook/Microsoft Office-specific wrappers
 * @param {CheerioStatic} $ - Cheerio instance
 */
function cleanOutlook($) {
    // Remove <o:p> tags (Office namespace empty paragraphs)
    $('o\\:p').each((i, el) => {
        const $el = $(el);
        const text = $el.text().trim();
        if (text === '' || text === '\u00A0') {
            $el.remove();
        } else {
            $el.replaceWith(text);
        }
    });

    // Clean MsoNormal classes - these add unnecessary Microsoft styling
    // Keep the elements but remove the Mso* classes
    $('[class*="Mso"]').each((i, el) => {
        const $el = $(el);
        const classes = $el.attr('class') || '';
        const cleanedClasses = classes
            .split(' ')
            .filter(c => !c.startsWith('Mso'))
            .join(' ');
        if (cleanedClasses) {
            $el.attr('class', cleanedClasses);
        } else {
            $el.removeAttr('class');
        }
    });

    // Remove WordSection1 wrapper but keep content
    $('.WordSection1').each((i, el) => {
        $(el).replaceWith($(el).html());
    });

    // Remove conditional comments for Microsoft Office
    // These appear as <!--[if !mso]> ... <![endif]-->
    // Cheerio doesn't parse these well, so we handle them in the HTML string later
}

/**
 * Remove forwarding headers across all providers
 * Common patterns: "---------- Forwarded message ---------", "From:", "Sent:", "To:", "Subject:"
 * @param {CheerioStatic} $ - Cheerio instance
 */
function removeForwardingHeaders($) {
    // Find and remove forwarding header blocks
    // These typically appear as divs or paragraphs with "Forwarded message" text
    $('p, div').each((i, el) => {
        const $el = $(el);
        const text = $el.text().trim();

        // Match common forwarding header patterns
        if (text.match(/^-{5,}\s*Forwarded message\s*-{5,}$/i) ||
            text.match(/^={5,}\s*Forwarded message\s*={5,}$/i) ||
            text === 'Forwarded message') {
            // Remove this element and following header lines
            $el.remove();
        }
    });

    // Remove standalone forwarding info divs (border-top style indicates header separator)
    $('div').each((i, el) => {
        const $el = $(el);
        const style = $el.attr('style') || '';
        const text = $el.text();

        // Check for header separator with From/Sent/To/Subject pattern
        if (style.includes('border-top') &&
            (text.includes('From:') && text.includes('Sent:') && text.includes('Subject:'))) {
            $el.remove();
        }
    });
}

/**
 * Clean URL wrappers from email security services
 * @param {CheerioStatic} $ - Cheerio instance
 */
function cleanUrlWrappers($) {
    // Handle linkprotect.cudasvc.com (Barracuda)
    $('a[href*="linkprotect.cudasvc.com"]').each((i, el) => {
        const $el = $(el);
        const href = $el.attr('href') || '';
        const match = href.match(/[?&]a=([^&]+)/);
        if (match) {
            try {
                const cleanUrl = decodeURIComponent(match[1]);
                $el.attr('href', cleanUrl);
            } catch (e) {
                // Keep original if decoding fails
            }
        }
    });

    $('img[src*="linkprotect.cudasvc.com"]').each((i, el) => {
        const $el = $(el);
        const src = $el.attr('src') || '';
        const match = src.match(/[?&]a=([^&]+)/);
        if (match) {
            try {
                const cleanUrl = decodeURIComponent(match[1]);
                $el.attr('src', cleanUrl);
            } catch (e) {
                // Keep original if decoding fails
            }
        }
    });

    // Handle Google URL redirect (google.com/url?q=)
    $('a[href*="google.com/url"]').each((i, el) => {
        const $el = $(el);
        const href = $el.attr('href') || '';
        const match = href.match(/[?&]q=([^&]+)/);
        if (match) {
            try {
                const cleanUrl = decodeURIComponent(match[1]);
                $el.attr('href', cleanUrl);
            } catch (e) {
                // Keep original if decoding fails
            }
        }
    });

    // Handle Outlook safelinks
    $('a[href*="safelinks.protection.outlook.com"]').each((i, el) => {
        const $el = $(el);
        const href = $el.attr('href') || '';
        const match = href.match(/[?&]url=([^&]+)/);
        if (match) {
            try {
                const cleanUrl = decodeURIComponent(match[1]);
                $el.attr('href', cleanUrl);
            } catch (e) {
                // Keep original if decoding fails
            }
        }
    });
}

/**
 * Remove Microsoft Office conditional comments from HTML string
 * @param {string} html - HTML string
 * @returns {string} Cleaned HTML string
 */
function removeMsoConditionalComments(html) {
    // Remove <!--[if ...]> ... <![endif]--> blocks
    return html.replace(/<!--\[if[^\]]*\]>[\s\S]*?<!\[endif\]-->/gi, '');
}

/**
 * Remove Office XML namespaces from HTML
 * @param {string} html - HTML string
 * @returns {string} Cleaned HTML string
 */
function removeOfficeNamespaces(html) {
    // Remove xmlns declarations for Office namespaces
    return html
        .replace(/\s*xmlns:[a-z]="[^"]*microsoft[^"]*"/gi, '')
        .replace(/\s*xmlns:[a-z]="[^"]*office[^"]*"/gi, '');
}

/**
 * Normalize email HTML by removing provider-specific wrappers
 * @param {string} html - The original HTML content from the email
 * @returns {object} { cleanedHtml, detectedProviders, metadata }
 */
function normalizeEmail(html) {
    if (!html) {
        return {
            cleanedHtml: '',
            detectedProviders: [],
            metadata: {
                originalLength: 0,
                cleanedLength: 0,
                reductionPercent: 0
            }
        };
    }

    const originalLength = html.length;
    const detectedProviders = detectProviders(html);

    // Pre-process HTML string for patterns that Cheerio doesn't handle well
    let processedHtml = html;

    // Remove Microsoft conditional comments
    processedHtml = removeMsoConditionalComments(processedHtml);

    // Remove Office namespaces
    processedHtml = removeOfficeNamespaces(processedHtml);

    // Load into Cheerio for DOM manipulation
    const $ = cheerio.load(processedHtml, {
        decodeEntities: false,
        xmlMode: false
    });

    // Apply provider-specific cleaning
    if (detectedProviders.includes('zoho')) {
        cleanZoho($);
    }

    if (detectedProviders.includes('gmail')) {
        cleanGmail($);
    }

    if (detectedProviders.includes('outlook')) {
        cleanOutlook($);
    }

    // Always clean URL wrappers and forwarding headers
    cleanUrlWrappers($);
    removeForwardingHeaders($);

    // Get the cleaned HTML
    let cleanedHtml = $.html();

    // Clean up excessive whitespace
    cleanedHtml = cleanedHtml
        .replace(/\r\n/g, '\n')
        .replace(/\n{3,}/g, '\n\n')
        .replace(/>\s+</g, '><');

    return {
        cleanedHtml,
        detectedProviders,
        metadata: {
            originalLength,
            cleanedLength: cleanedHtml.length,
            reductionPercent: Math.round((1 - cleanedHtml.length / originalLength) * 100)
        }
    };
}

/**
 * Extract the core vendor email content from a forwarded email
 * Finds the actual order confirmation content within the forwarding wrappers
 * @param {string} html - The HTML content
 * @param {string} vendorIdentifier - Optional vendor identifier to look for (e.g., "Marchon", "Kenmark")
 * @returns {string} The extracted core content
 */
function extractVendorContent(html, vendorIdentifier = null) {
    const $ = cheerio.load(html, {
        decodeEntities: false,
        xmlMode: false
    });

    // Strategy 1: Look for tables with order data (most vendors use tables)
    const tables = $('table');
    if (tables.length > 0) {
        // Find the outermost table that contains the order content
        // Usually the first table with background #f6f6f6 or similar
        let contentTable = null;
        tables.each((i, table) => {
            const $table = $(table);
            const style = $table.attr('style') || '';
            const bg = $table.attr('bgcolor') || '';

            // Common vendor email patterns
            if (style.includes('background:#f6f6f6') ||
                style.includes('background: rgb(246, 246, 246)') ||
                bg === '#f6f6f6' ||
                style.includes('background:#ffffff') ||
                style.includes('max-width:600px')) {
                if (!contentTable) {
                    contentTable = $table;
                }
            }
        });

        if (contentTable) {
            return contentTable.html();
        }
    }

    // Strategy 2: Look for vendor-specific content markers
    if (vendorIdentifier) {
        const searchText = vendorIdentifier.toLowerCase();
        $('div, td, p').each((i, el) => {
            const text = $(el).text().toLowerCase();
            if (text.includes(searchText + ' order confirmation') ||
                text.includes('order confirmation for')) {
                // Found the content area - return its parent container
                const parent = $(el).closest('table, div[style*="min-width"]');
                if (parent.length) {
                    return parent.html();
                }
            }
        });
    }

    // Strategy 3: Return normalized full content if no specific extraction worked
    return html;
}

module.exports = {
    normalizeEmail,
    detectProviders,
    extractVendorContent,
    cleanUrlWrappers,
    // Export individual cleaners for testing
    cleanZoho,
    cleanGmail,
    cleanOutlook
};

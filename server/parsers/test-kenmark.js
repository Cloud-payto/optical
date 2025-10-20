const fs = require('fs');
const path = require('path');
const { parseKenmarkHtml, validateParsedData } = require('./kenmarkParser');
const KenmarkService = require('./KenmarkService');

/**
 * Test Kenmark Parser and Web Service
 *
 * This script:
 * 1. Reads sample Kenmark email from dev-email-parsers
 * 2. Parses the HTML to extract order data and UPCs
 * 3. Enriches with Kenmark API data using UPC lookups
 * 4. Displays results
 */

async function testKenmarkParser() {
    console.log('═══════════════════════════════════════════════════════');
    console.log('  KENMARK PARSER & WEB SERVICE TEST');
    console.log('═══════════════════════════════════════════════════════\n');

    try {
        // Read sample email
        const emailPath = path.join(__dirname, '../../dev-email-parsers/Kenmark/email.txt');
        console.log(`📧 Reading email from: ${emailPath}\n`);

        if (!fs.existsSync(emailPath)) {
            console.error(`❌ Email file not found: ${emailPath}`);
            console.error('   Make sure you have a Kenmark email in dev-email-parsers/Kenmark/email.txt');
            return;
        }

        const html = fs.readFileSync(emailPath, 'utf-8');

        // ========================================
        // STEP 1: Parse Email HTML
        // ========================================
        console.log('═══════════════════════════════════════════════════════');
        console.log('STEP 1: PARSING EMAIL');
        console.log('═══════════════════════════════════════════════════════\n');

        const parsedData = parseKenmarkHtml(html, null);

        console.log('\n📋 PARSED ORDER DATA:');
        console.log('─────────────────────────────────────────────────────');
        console.log('Vendor:           ', parsedData.vendor);
        console.log('Order Number:     ', parsedData.orderNumber);
        console.log('Order Date:       ', parsedData.orderDate);
        console.log('Rep Name:         ', parsedData.repName);
        console.log('Account Number:   ', parsedData.accountNumber);
        console.log('Customer Name:    ', parsedData.customerName);
        console.log('Customer Phone:   ', parsedData.customerPhone);
        console.log('Total Items:      ', parsedData.totalItems);
        console.log('Total Quantity:   ', parsedData.totalQuantity);
        console.log('─────────────────────────────────────────────────────\n');

        // Display items
        console.log('📦 PARSED ITEMS:');
        console.log('─────────────────────────────────────────────────────');
        parsedData.items.forEach((item, index) => {
            console.log(`\nItem ${index + 1}:`);
            console.log(`  Brand:     ${item.brand}`);
            console.log(`  Model:     ${item.model}`);
            console.log(`  Color:     ${item.color}`);
            console.log(`  Size:      ${item.size}`);
            console.log(`  Quantity:  ${item.quantity}`);
            console.log(`  UPC:       ${item.upc || 'N/A'}`);
        });
        console.log('─────────────────────────────────────────────────────\n');

        // Validate
        const validation = validateParsedData(parsedData);
        console.log('✅ VALIDATION:');
        console.log('─────────────────────────────────────────────────────');
        console.log('Valid:    ', validation.valid);
        console.log('Errors:   ', validation.errors.length > 0 ? validation.errors.join(', ') : 'None');
        console.log('Warnings: ', validation.warnings.length > 0 ? validation.warnings.join(', ') : 'None');
        console.log('─────────────────────────────────────────────────────\n');

        if (!validation.valid) {
            console.error('❌ Validation failed, stopping here');
            return;
        }

        // ========================================
        // STEP 2: API Enrichment
        // ========================================
        console.log('\n═══════════════════════════════════════════════════════');
        console.log('STEP 2: API ENRICHMENT');
        console.log('═══════════════════════════════════════════════════════\n');

        const kenmarkService = new KenmarkService({ debug: false });
        const enrichedData = await kenmarkService.enrichOrderData(parsedData);

        console.log('\n💎 ENRICHED ORDER DATA:');
        console.log('─────────────────────────────────────────────────────');
        console.log('Enrichment Rate:  ', enrichedData.enrichment.enrichmentRate);
        console.log('Processing Time:  ', enrichedData.enrichment.processingTimeSeconds + 's');
        console.log('Enriched Items:   ', enrichedData.enrichment.enrichedItems);
        console.log('Failed Items:     ', enrichedData.enrichment.failedItems);
        console.log('API Errors:       ', enrichedData.enrichment.apiErrors);
        console.log('Cache Hits:       ', enrichedData.enrichment.cacheHits);
        console.log('─────────────────────────────────────────────────────\n');

        // Display enriched items
        console.log('💎 ENRICHED ITEMS (with API data):');
        console.log('─────────────────────────────────────────────────────');
        enrichedData.items.forEach((item, index) => {
            console.log(`\nItem ${index + 1}: ${item.brand} ${item.model}`);
            console.log(`  Color:        ${item.color}`);
            console.log(`  Size:         ${item.size}`);
            console.log(`  UPC:          ${item.upc || 'N/A'}`);
            console.log(`  Quantity:     ${item.quantity}`);

            if (item.validation.validated) {
                console.log(`  ✅ Validated:  ${item.validation.confidence}% confidence`);
            } else {
                console.log(`  ⚠️  Warning:    ${item.validation.reason}`);
            }

            if (item.enrichedData) {
                console.log(`  Wholesale:    $${item.enrichedData.wholesale || 'N/A'}`);
                console.log(`  MSRP:         $${item.enrichedData.msrp || 'N/A'}`);
                console.log(`  In Stock:     ${item.enrichedData.inStock ? 'Yes' : 'No'}`);
                console.log(`  Availability: ${item.enrichedData.availability || 'N/A'}`);
                console.log(`  Material:     ${item.enrichedData.material || 'N/A'}`);
                console.log(`  Shape:        ${item.enrichedData.shape || 'N/A'}`);
                console.log(`  Gender:       ${item.enrichedData.gender || 'N/A'}`);
                if (item.enrichedData.collectionName) {
                    console.log(`  Collection:   ${item.enrichedData.collectionName}`);
                }
            } else {
                console.log(`  ❌ No API data available`);
            }
        });
        console.log('─────────────────────────────────────────────────────\n');

        // ========================================
        // SUMMARY
        // ========================================
        console.log('\n═══════════════════════════════════════════════════════');
        console.log('  TEST SUMMARY');
        console.log('═══════════════════════════════════════════════════════\n');

        const successRate = enrichedData.enrichment.enrichmentRate;
        console.log(`✅ Parsing:     SUCCESS`);
        console.log(`✅ Validation:  ${validation.valid ? 'PASSED' : 'FAILED'}`);
        console.log(`📊 Enrichment:  ${successRate}`);
        console.log(`⏱️  Processing:  ${enrichedData.enrichment.processingTimeSeconds}s`);

        if (enrichedData.enrichment.enrichedItems === enrichedData.enrichment.totalItems) {
            console.log('\n🎉 ALL ITEMS SUCCESSFULLY ENRICHED!');
        } else {
            console.log(`\n⚠️  ${enrichedData.enrichment.failedItems} items could not be enriched`);
        }

        console.log('\n═══════════════════════════════════════════════════════\n');

    } catch (error) {
        console.error('\n❌ TEST FAILED:', error.message);
        console.error(error.stack);
    }
}

// Run the test
testKenmarkParser().then(() => {
    console.log('Test complete');
}).catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
});

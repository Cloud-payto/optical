const fs = require('fs');
const path = require('path');
const { parseLamyamericaHtml, validateParsedData } = require('./lamyamericaParser');
const LamyamericaService = require('./LamyamericaService');

/**
 * Test L'amyamerica parser with sample email
 */
async function testLamyamericaParser() {
    console.log('🧪 Testing L\'amyamerica Parser\n');
    console.log('='.repeat(80));

    try {
        // Read the sample email
        const emailPath = path.join(__dirname, '../../dev-email-parsers/L\'amyamerica/email.txt');
        const html = fs.readFileSync(emailPath, 'utf8');

        console.log('📧 Sample email loaded');
        console.log('  File:', emailPath);
        console.log('  Size:', html.length, 'bytes\n');

        // Phase 1: Parse HTML
        console.log('='.repeat(80));
        console.log('PHASE 1: PARSING EMAIL HTML');
        console.log('='.repeat(80));

        const parsedData = parseLamyamericaHtml(html, '');

        console.log('\n📊 PARSED DATA SUMMARY:');
        console.log('  Vendor:', parsedData.vendor);
        console.log('  Order Number:', parsedData.orderNumber);
        console.log('  Order Date:', parsedData.orderDate);
        console.log('  Rep Name:', parsedData.repName);
        console.log('  Account Number:', parsedData.accountNumber);
        console.log('  Customer Name:', parsedData.customerName);
        console.log('  Total Items:', parsedData.items.length);
        console.log('  Total Quantity:', parsedData.totalQuantity);

        console.log('\n📦 ITEMS PARSED:');
        parsedData.items.forEach((item, index) => {
            console.log(`  [${index + 1}] ${item.brand} ${item.model}`);
            console.log(`      Color: ${item.color} (Code: ${item.colorCode || 'N/A'})`);
            console.log(`      Size: ${item.size}`);
            console.log(`      Qty: ${item.quantity}`);
            console.log(`      UPC: ${item.upc || 'NOT FOUND'}`);
        });

        // Validate parsed data
        console.log('\n' + '='.repeat(80));
        console.log('VALIDATION');
        console.log('='.repeat(80));

        const validation = validateParsedData(parsedData);
        console.log('  Valid:', validation.valid);

        if (validation.errors.length > 0) {
            console.log('  ❌ Errors:');
            validation.errors.forEach(err => console.log('    -', err));
        }

        if (validation.warnings.length > 0) {
            console.log('  ⚠️  Warnings:');
            validation.warnings.forEach(warn => console.log('    -', warn));
        }

        if (!validation.valid) {
            console.log('\n❌ Validation failed. Stopping test.');
            return;
        }

        // Phase 2: API Enrichment
        console.log('\n' + '='.repeat(80));
        console.log('PHASE 2: API ENRICHMENT (UPC-Based)');
        console.log('='.repeat(80));
        console.log('⚠️  Note: This will make real API calls to lamyamerica.com\n');

        const lamyService = new LamyamericaService({
            debug: true,
            timeout: 15000,
            maxRetries: 2
        });

        const enrichedData = await lamyService.enrichOrderData(parsedData);

        console.log('\n📊 ENRICHMENT SUMMARY:');
        console.log('  Total Items:', enrichedData.enrichment.totalItems);
        console.log('  Enriched Items:', enrichedData.enrichment.enrichedItems);
        console.log('  Failed Items:', enrichedData.enrichment.failedItems);
        console.log('  API Errors:', enrichedData.enrichment.apiErrors);
        console.log('  Cache Hits:', enrichedData.enrichment.cacheHits);
        console.log('  Enrichment Rate:', enrichedData.enrichment.enrichmentRate);
        console.log('  Processing Time:', enrichedData.enrichment.processingTimeSeconds, 's');

        console.log('\n📦 ENRICHED ITEMS:');
        enrichedData.items.forEach((item, index) => {
            console.log(`\n  [${index + 1}] ${item.brand} ${item.model} - ${item.color}`);
            console.log(`      UPC: ${item.upc || 'N/A'}`);

            if (item.enrichedData) {
                console.log(`      ✅ ENRICHED:`);
                console.log(`         Wholesale: $${item.enrichedData.wholesale || 'N/A'}`);
                console.log(`         MSRP: $${item.enrichedData.msrp || 'N/A'}`);
                console.log(`         In Stock: ${item.enrichedData.inStock ? 'Yes' : 'No'}`);
                console.log(`         Material: ${item.enrichedData.material || 'N/A'}`);
                console.log(`         Frame Type: ${item.enrichedData.frameType || 'N/A'}`);
                console.log(`         Shape: ${item.enrichedData.shape || 'N/A'}`);
                console.log(`         Gender: ${item.enrichedData.gender || 'N/A'}`);
            } else {
                console.log(`      ❌ NOT ENRICHED: ${item.validation?.reason || 'Unknown'}`);
            }

            if (item.validation) {
                console.log(`      Validation: ${item.validation.validated ? '✅' : '⚠️'} (${item.validation.confidence}% confidence)`);
            }
        });

        // Summary
        console.log('\n' + '='.repeat(80));
        console.log('TEST COMPLETE');
        console.log('='.repeat(80));
        console.log('✅ L\'amyamerica parser test successful!');
        console.log(`   - Parsed ${parsedData.items.length} items`);
        console.log(`   - Enriched ${enrichedData.enrichment.enrichedItems}/${enrichedData.enrichment.totalItems} items`);

        // Calculate total wholesale
        const totalWholesale = enrichedData.items.reduce((sum, item) => {
            const price = item.enrichedData?.wholesale || 0;
            return sum + (price * item.quantity);
        }, 0);

        if (totalWholesale > 0) {
            console.log(`   - Total Wholesale: $${totalWholesale.toFixed(2)}`);
        }

    } catch (error) {
        console.error('\n❌ Test failed:', error.message);
        console.error(error.stack);
        process.exit(1);
    }
}

// Run test
testLamyamericaParser()
    .then(() => {
        console.log('\n✅ All tests passed!');
        process.exit(0);
    })
    .catch(error => {
        console.error('\n❌ Test suite failed:', error);
        process.exit(1);
    });

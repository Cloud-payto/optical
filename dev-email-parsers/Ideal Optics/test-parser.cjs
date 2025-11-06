const fs = require('fs');
const path = require('path');

// Import Ideal Optics parser and service
const IdealOpticsService = require('../../server/parsers/IdealOpticsService');

/**
 * Test the Ideal Optics email parser and web enrichment
 */
async function testIdealOpticsParser() {
    console.log('='.repeat(70));
    console.log('🧪 IDEAL OPTICS PARSER TEST');
    console.log('='.repeat(70));
    console.log();

    // Read the email HTML
    const emailHtml = fs.readFileSync(
        path.join(__dirname, 'email.txt'),
        'utf-8'
    );

    console.log('📧 Email HTML loaded');
    console.log(`   Length: ${emailHtml.length} characters`);
    console.log();

    // Initialize service
    const service = new IdealOpticsService({
        debug: true,
        enableWebEnrichment: false // Start with false to test email parsing first
    });

    try {
        // Test 1: Email Parsing Only
        console.log('📋 TEST 1: Email Parsing (No Web Enrichment)');
        console.log('-'.repeat(70));

        const parsedData = service.parseEmail(emailHtml, null);

        console.log('\n✅ PARSING RESULT:');
        console.log(JSON.stringify(parsedData, null, 2));

        console.log('\n📊 SUMMARY:');
        console.log(`   Vendor: ${parsedData.vendor}`);
        console.log(`   Account Number: ${parsedData.account_number}`);
        console.log(`   Order Number: ${parsedData.order.order_number}`);
        console.log(`   Order Date: ${parsedData.order.order_date}`);
        console.log(`   Customer: ${parsedData.order.customer_name}`);
        console.log(`   Ship Method: ${parsedData.order.ship_method}`);
        console.log(`   Items: ${parsedData.items.length}`);
        console.log(`   Unique Frames: ${parsedData.unique_frames.length}`);
        console.log();

        // Show items
        console.log('📦 ITEMS:');
        parsedData.items.forEach((item, index) => {
            console.log(`   ${index + 1}. ${item.model} - ${item.color} (${item.full_size}) x${item.quantity}`);
        });
        console.log();

        // Show unique frames
        console.log('🖼️  UNIQUE FRAMES:');
        parsedData.unique_frames.forEach((frame, index) => {
            console.log(`   ${index + 1}. ${frame.model} (${frame.colors.join(', ')}) - ${frame.count} total`);
        });
        console.log();

        // Test 2: Web Enrichment
        console.log('='.repeat(70));
        console.log('📋 TEST 2: Web Enrichment');
        console.log('-'.repeat(70));
        console.log();

        const enrichmentService = new IdealOpticsService({
            debug: true,
            enableWebEnrichment: true
        });

        console.log('🌐 Enriching items with web data...');
        const enrichedItems = await enrichmentService.enrichPendingItems(parsedData.items);

        console.log('\n✅ ENRICHMENT COMPLETE');
        console.log(`   Enriched ${enrichedItems.length} items`);
        console.log();

        // Show enrichment results
        console.log('📊 ENRICHMENT RESULTS:');
        enrichedItems.forEach((item, index) => {
            console.log(`\n   Item ${index + 1}: ${item.model} - ${item.color}`);
            console.log(`      UPC: ${item.upc || 'Not found'}`);
            console.log(`      Measurements: Eye=${item.eye_size}, Bridge=${item.bridge}, Temple=${item.temple_length}`);
            console.log(`      A=${item.a || 'N/A'}, B=${item.b || 'N/A'}, ED=${item.ed || 'N/A'}`);
            console.log(`      Material: ${item.material || 'N/A'}`);
            console.log(`      Gender: ${item.gender || 'N/A'}`);
            console.log(`      Fit Type: ${item.fit_type || 'N/A'}`);
            console.log(`      API Verified: ${item.api_verified ? '✅' : '❌'}`);
            console.log(`      Confidence: ${item.confidence_score}%`);
        });
        console.log();

        console.log('='.repeat(70));
        console.log('✅ ALL TESTS PASSED');
        console.log('='.repeat(70));

    } catch (error) {
        console.error('\n❌ TEST FAILED:', error);
        console.error('Stack trace:', error.stack);
    }
}

// Run the test
testIdealOpticsParser();

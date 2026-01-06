/**
 * Test script for Modern Optical parsing and API enrichment
 * Tests to verify full sizing information is being returned
 */

require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });

const fs = require('fs');
const path = require('path');
const { parseModernOpticalHtml } = require('../parsers/modernOpticalParser');
const ModernOpticalCatalogCrawler = require('../services/ModernOpticalCatalogCrawler');

async function testModernOpticalSizing() {
    console.log('='.repeat(70));
    console.log('MODERN OPTICAL SIZING TEST');
    console.log('='.repeat(70));

    // 1. Test email parsing
    console.log('\n📧 STEP 1: Testing Email Parser');
    console.log('-'.repeat(50));

    const emailPath = path.join(__dirname, '../../dev/email-parsers/Modern Optical/email.txt');
    const emailHtml = fs.readFileSync(emailPath, 'utf8');

    const parsed = parseModernOpticalHtml(emailHtml, '');

    console.log(`\n✅ Parsed ${parsed.items.length} items from email`);
    console.log('\nSample parsed items (first 3):');
    parsed.items.slice(0, 3).forEach((item, i) => {
        console.log(`\n  Item ${i + 1}: ${item.brand} - ${item.model}`);
        console.log(`    Color: ${item.color}`);
        console.log(`    Size (from email): ${item.size}`);
        console.log(`    UPC (from image): ${item.upc || 'N/A'}`);
        console.log(`    Full Size: ${item.full_size || 'NOT SET'}`);
        console.log(`    Bridge: ${item.bridge || 'NOT SET'}`);
        console.log(`    Temple: ${item.temple_length || item.temple || 'NOT SET'}`);
    });

    // 2. Test API enrichment for a single item
    console.log('\n\n🔍 STEP 2: Testing API Enrichment (CatalogCrawler)');
    console.log('-'.repeat(50));

    const crawler = new ModernOpticalCatalogCrawler();

    // Test with first item from email
    const testItem = parsed.items[0];
    console.log(`\nTesting enrichment for: ${testItem.brand} - ${testItem.model} (${testItem.color})`);

    try {
        const enriched = await crawler.enrichItem({
            brand: testItem.brand,
            model: testItem.model,
            color: testItem.color,
            size: testItem.size
        });

        console.log('\n📊 Enrichment Result:');
        console.log(`    API Verified: ${enriched.api_verified}`);
        console.log(`    Enriched: ${enriched.enriched}`);
        console.log(`    UPC: ${enriched.upc || 'NOT SET'}`);
        console.log(`    Eye Size: ${enriched.eye_size || 'NOT SET'}`);
        console.log(`    Bridge: ${enriched.bridge || 'NOT SET'}`);
        console.log(`    Temple: ${enriched.temple || 'NOT SET'}`);
        console.log(`    Full Size: ${enriched.full_size || 'NOT SET'}`);
        console.log(`    A: ${enriched.a || 'NOT SET'}`);
        console.log(`    B: ${enriched.b || 'NOT SET'}`);
        console.log(`    DBL: ${enriched.dbl || 'NOT SET'}`);
        console.log(`    ED: ${enriched.ed || 'NOT SET'}`);
        console.log(`    Material: ${enriched.material || 'NOT SET'}`);
        console.log(`    Gender: ${enriched.gender || 'NOT SET'}`);
        console.log(`    Wholesale: ${enriched.wholesale_price || 'NOT SET'}`);

        // Check if all sizing fields are present
        const hasFullSizing = enriched.eye_size && enriched.bridge && enriched.temple && enriched.full_size;
        const hasDetailedMeasurements = enriched.a && enriched.b && enriched.dbl && enriched.ed;

        if (enriched.enriched && hasFullSizing && hasDetailedMeasurements) {
            console.log('\n✅ SUCCESS: API returned FULL sizing information including A/B/DBL/ED!');
        } else if (enriched.enriched && hasFullSizing) {
            console.log('\n⚠️ PARTIAL: Has basic sizing but missing detailed measurements (A/B/DBL/ED)');
        } else if (enriched.enriched) {
            console.log('\n⚠️ PARTIAL: Enriched but missing some sizing data');
        } else {
            console.log('\n❌ API enrichment did not find matching data');
        }

    } catch (error) {
        console.error('\n❌ Enrichment error:', error.message);
    }

    // 3. Test raw API response to see actual structure
    console.log('\n\n🔬 STEP 3: Testing Raw API Response');
    console.log('-'.repeat(50));

    try {
        const response = await crawler.makeApiRequest({ search: testItem.model });

        if (response && response.length > 0) {
            const product = response[0];
            console.log('\n📦 Raw API Product Structure:');
            console.log(`    Style Code: ${product.styleCode}`);
            console.log(`    Style Name: ${product.styleName}`);
            console.log(`    Collection: ${product.collectionName}`);
            console.log(`    Material: ${product.material}`);
            console.log(`    Gender: ${product.gender}`);

            if (product.colorGroup && product.colorGroup.length > 0) {
                console.log(`\n    Color Groups: ${product.colorGroup.length}`);

                const firstColor = product.colorGroup[0];
                console.log(`\n    First Color Group:`);
                console.log(`      Color: ${firstColor.color || firstColor.colorName}`);

                if (firstColor.sizes && firstColor.sizes.length > 0) {
                    console.log(`      Sizes: ${firstColor.sizes.length}`);

                    const firstSize = firstColor.sizes[0];
                    console.log(`\n      First Size Variant:`);
                    console.log(`        Eye Size: ${firstSize.eyeSize}`);
                    console.log(`        Bridge: ${firstSize.bridge}`);
                    console.log(`        Temple: ${firstSize.temple}`);
                    console.log(`        A: ${firstSize.a}`);
                    console.log(`        B: ${firstSize.b}`);
                    console.log(`        DBL: ${firstSize.dbl}`);
                    console.log(`        ED: ${firstSize.ed}`);
                    console.log(`        UPC: ${firstSize.upc}`);
                    console.log(`        SKU: ${firstSize.sku}`);
                    console.log(`        Wholesale: ${firstSize.wholesale}`);
                    console.log(`        Full Size String: ${firstSize.size || firstSize.alternateFrameSize}`);
                }
            }

            console.log('\n\n📋 Full colorGroup[0] JSON:');
            console.log(JSON.stringify(product.colorGroup[0], null, 2));

        } else {
            console.log('No products found in API response');
        }

    } catch (error) {
        console.error('API error:', error.message);
    }

    // 4. Summary
    console.log('\n\n' + '='.repeat(70));
    console.log('SIZING DATA FLOW SUMMARY');
    console.log('='.repeat(70));
    console.log(`
1. EMAIL PARSING:
   - Extracts: eye size only (e.g., "54")
   - Does NOT extract: bridge, temple, full size string

2. API ENRICHMENT (CatalogCrawler.enrichItem):
   - Returns: eyeSize, bridge, temple, full_size, a, b, dbl, ed
   - Maps to: eye_size, bridge, temple, full_size fields

3. POTENTIAL ISSUES TO CHECK:
   - Is enrichItem() being called during the workflow?
   - Are the enriched fields being saved to database?
   - Is the frontend displaying the enriched fields?
`);

    console.log('\n✅ Test completed!');
}

// Run the test
testModernOpticalSizing().catch(console.error);

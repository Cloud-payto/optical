const SafiloService = require('./SafiloService');
const fs = require('fs');
const path = require('path');

/**
 * Test script to verify the Safilo parser correctly handles the PDF
 * Expected: 41 frames total (23 on page 1 + 18 on page 2)
 */
async function testPDF() {
    console.log('🧪 Testing Safilo PDF Parser\n');

    // Find the PDF file
    const pdfPath = path.join(__dirname, '../../dev-email-parsers/Safilo/Your Receipt for order 113006337.pdf');

    if (!fs.existsSync(pdfPath)) {
        console.error('❌ PDF file not found at:', pdfPath);
        console.log('\nPlease update the path to your PDF file in test-safilo-pdf.js');
        process.exit(1);
    }

    const service = new SafiloService({
        debug: false,  // Set to true for verbose output
        minConfidence: 50,
        batchSize: 5
    });

    try {
        console.log('📄 Reading PDF...');
        const pdfBuffer = fs.readFileSync(pdfPath);

        console.log('🔍 Parsing PDF (Phase 1 - Extract data)...\n');
        const parsedData = await service.parsePDF(pdfBuffer);

        console.log('📋 PARSING RESULTS:');
        console.log('==================');
        console.log(`Total frames parsed: ${parsedData.frames.length}`);
        console.log(`Expected: 41 frames\n`);

        // Show order info
        console.log('📦 ORDER INFORMATION:');
        console.log('  Order Number:', parsedData.orderInfo.orderNumber);
        console.log('  Order Date:', parsedData.orderInfo.orderDate);
        console.log('  Customer:', parsedData.orderInfo.customerName);
        console.log('  Placed By:', parsedData.orderInfo.placedBy);
        console.log('');

        // Check for the problematic KS CHERETTE2/US frame
        const cheretteFrame = parsedData.frames.find(f =>
            f.model.includes('CHERETTE') || f.originalLine.includes('CHERETTE')
        );

        if (cheretteFrame) {
            console.log('🔍 CHECKING PROBLEMATIC FRAME (CHERETTE):');
            console.log('  Original line:', cheretteFrame.originalLine);
            console.log('  Parsed brand:', cheretteFrame.brand);
            console.log('  Parsed model:', cheretteFrame.model);
            console.log('  ✅ Model should NOT contain /US suffix');
            console.log('  ✅ Result:', cheretteFrame.model.includes('/US') ? '❌ FAILED - Still has /US' : '✅ PASSED - Suffix removed');
            console.log('');
        }

        // Show all frames grouped by brand
        console.log('📊 FRAMES BY BRAND PREFIX:');
        const brandGroups = {};
        parsedData.frames.forEach(frame => {
            const brand = frame.brand;
            if (!brandGroups[brand]) {
                brandGroups[brand] = [];
            }
            brandGroups[brand].push(frame);
        });

        Object.keys(brandGroups).sort().forEach(brand => {
            console.log(`  ${brand}: ${brandGroups[brand].length} frames`);
        });
        console.log('');

        // List all KS frames to verify suffix removal
        const ksFrames = parsedData.frames.filter(f => f.brand === 'KS');
        if (ksFrames.length > 0) {
            console.log('🔍 ALL KS (KATE SPADE) FRAMES:');
            ksFrames.forEach((frame, idx) => {
                const hasSuffix = frame.model.match(/\/[A-Z]+/);
                console.log(`  ${idx + 1}. ${frame.model} ${frame.colorCode} - ${hasSuffix ? '❌ HAS SUFFIX' : '✅ CLEAN'}`);
            });
            console.log('');
        }

        // Test result
        const passed = parsedData.frames.length === 41;
        console.log('═══════════════════════════════════════');
        if (passed) {
            console.log('✅ TEST PASSED: All 41 frames parsed correctly!');
        } else {
            console.log(`❌ TEST FAILED: Expected 41 frames, got ${parsedData.frames.length}`);
            console.log('\nShowing all parsed frames:');
            parsedData.frames.forEach((frame, idx) => {
                console.log(`  ${idx + 1}. ${frame.brand} ${frame.model} ${frame.colorCode} (${frame.size})`);
            });
        }
        console.log('═══════════════════════════════════════\n');

        // Save detailed results to file
        const outputPath = path.join(__dirname, 'test-results.json');
        fs.writeFileSync(outputPath, JSON.stringify(parsedData, null, 2));
        console.log(`💾 Detailed results saved to: ${outputPath}\n`);

        return parsedData;

    } catch (error) {
        console.error('❌ Test failed with error:', error.message);
        console.error(error.stack);
        process.exit(1);
    }
}

// Run the test
testPDF().then(() => {
    console.log('✅ Test completed successfully');
    process.exit(0);
}).catch(error => {
    console.error('❌ Test failed:', error);
    process.exit(1);
});

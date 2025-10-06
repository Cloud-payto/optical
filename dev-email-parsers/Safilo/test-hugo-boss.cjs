const fs = require('fs');
const path = require('path');
const SafiloService = require('../../server/parsers/SafiloService');

async function testHugoBossPDFs() {
    console.log('🧪 Testing Safilo Parser with Hugo Boss PDFs\n');
    console.log('='.repeat(60));

    const testFiles = [
        'MySafilo Order 112947761.pdf',
        'MySafilo Order 112999238.pdf'
    ];

    const safiloService = new SafiloService({ debug: false });

    for (const filename of testFiles) {
        console.log(`\n\n📄 Testing: ${filename}`);
        console.log('='.repeat(60));

        try {
            const pdfPath = path.join(__dirname, filename);
            const pdfBuffer = fs.readFileSync(pdfPath);

            console.log(`📦 PDF Size: ${(pdfBuffer.length / 1024).toFixed(2)} KB\n`);

            // Process the PDF
            const result = await safiloService.processOrder(pdfBuffer);

            console.log('\n📊 RESULTS:');
            console.log('─'.repeat(60));
            console.log('Order Info:');
            console.log(`  - Order Number: ${result.orderInfo.orderNumber}`);
            console.log(`  - Account Number: ${result.orderInfo.accountNumber}`);
            console.log(`  - Date: ${result.orderInfo.orderDate}`);
            console.log(`  - Customer: ${result.orderInfo.customerName}`);

            console.log('\n📦 Frames Found:');
            if (result.frames.length === 0) {
                console.log('  ❌ NO FRAMES FOUND!');
            } else {
                result.frames.forEach((frame, idx) => {
                    console.log(`\n  [${idx + 1}] ${frame.brand} ${frame.model}`);
                    console.log(`      Color: ${frame.colorCode} - ${frame.colorName}`);
                    console.log(`      Size: ${frame.size}`);
                    console.log(`      Validated: ${frame.validation?.validated ? '✅' : '❌'} (${frame.validation?.confidence}%)`);
                    if (frame.enrichedData) {
                        console.log(`      UPC: ${frame.enrichedData.upc || 'N/A'}`);
                        console.log(`      Wholesale: $${frame.enrichedData.wholesale || 'N/A'}`);
                        console.log(`      MSRP: $${frame.enrichedData.msrp || 'N/A'}`);
                    }
                });
            }

            console.log('\n📈 Statistics:');
            console.log(`  - Total Frames: ${result.statistics.totalFrames}`);
            console.log(`  - Validated: ${result.statistics.validated}`);
            console.log(`  - Failed: ${result.statistics.failed}`);
            console.log(`  - Validation Rate: ${result.statistics.validationRate}`);
            console.log(`  - Processing Time: ${result.statistics.processingTimeSeconds}s`);

        } catch (error) {
            console.error('\n❌ ERROR:', error.message);
            console.error(error.stack);
        }
    }

    console.log('\n\n' + '='.repeat(60));
    console.log('✅ Test Complete');
    console.log('='.repeat(60));
}

// Run the test
testHugoBossPDFs().catch(console.error);

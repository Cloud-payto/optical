const fs = require('fs');
const path = require('path');
const EtniaBarcelonaService = require('../../server/parsers/EtniaBarcelonaService');

// Read the sample PDF
const pdfPath = path.join(__dirname, '1201039424.PDF');
const pdfBuffer = fs.readFileSync(pdfPath);

console.log('🧪 Testing Etnia Barcelona Parser');
console.log('='.repeat(60));

async function test() {
    try {
        const service = new EtniaBarcelonaService({ debug: false });
        const result = await service.processOrder(pdfBuffer);

        console.log('\n✅ PARSING SUCCESSFUL\n');

        console.log('📋 ORDER INFORMATION:');
        console.log('  Order Number:', result.orderInfo.orderNumber);
        console.log('  Date:', result.orderInfo.orderDate);
        console.log('  Customer ID:', result.orderInfo.customerID);
        console.log('  Customer Name:', result.orderInfo.customerName);
        console.log('  Customer Reference:', result.orderInfo.customerReference);
        console.log('  Address:', result.orderInfo.customerAddress);

        console.log('\n📦 ITEMS:');
        console.log('  Total Frames:', result.statistics.totalFrames);
        console.log('  Total Pieces:', result.statistics.totalPieces);
        console.log('  Total Value:', `$${result.statistics.totalValue.toFixed(2)}`);
        console.log('  Unique Models:', result.statistics.uniqueModels);

        // Group items by frame type
        const optical = result.frames.filter(f => f.frameType === 'OPTICAL');
        const sun = result.frames.filter(f => f.frameType === 'SUN');
        console.log(`\n  Optical Frames: ${optical.length}`);
        console.log(`  Sun Frames: ${sun.length}`);

        // Group by material
        const materialCounts = result.frames.reduce((acc, frame) => {
            const mat = frame.material || 'Unknown';
            acc[mat] = (acc[mat] || 0) + 1;
            return acc;
        }, {});
        console.log('\n  By Material:');
        Object.entries(materialCounts).forEach(([material, count]) => {
            console.log(`    ${material}: ${count}`);
        });

        console.log('\n📝 SAMPLE ITEMS (first 5):');
        result.frames.slice(0, 5).forEach((item, index) => {
            console.log(`\n  Item ${index + 1}:`);
            console.log(`    Brand: ${item.brand}`);
            console.log(`    Model: ${item.model}`);
            console.log(`    Color: ${item.colorName}`);
            console.log(`    Color Code: ${item.colorCode}`);
            console.log(`    Size: ${item.size} (${item.eyeSize}-${item.bridge}-${item.temple})`);
            console.log(`    Material: ${item.material}`);
            console.log(`    Type: ${item.frameType}`);
            console.log(`    UPC: ${item.upc}`);
            console.log(`    Unit Price: $${item.unitPrice.toFixed(2)}`);
            console.log(`    Discount: ${item.discount}%`);
            console.log(`    Final Price: $${item.wholesalePrice.toFixed(2)} per unit`);
            console.log(`    Quantity: ${item.quantity}`);
            console.log(`    SKU: ${item.sku}`);
        });

        // Verify totals
        console.log('\n✓ VERIFICATION:');
        const calculatedTotal = result.frames.reduce((sum, item) => sum + item.finalPrice, 0);
        console.log(`  Calculated total: $${calculatedTotal.toFixed(2)}`);
        console.log(`  Expected total: $${result.statistics.totalValue.toFixed(2)}`);

        if (Math.abs(calculatedTotal - result.statistics.totalValue) < 0.01) {
            console.log('  ✅ Totals match!');
        } else {
            console.log('  ⚠️  Totals do not match');
        }

        // Write result to JSON file for inspection
        const outputPath = path.join(__dirname, 'parsed-result.json');
        fs.writeFileSync(outputPath, JSON.stringify(result, null, 2));
        console.log(`\n💾 Full result saved to: ${outputPath}`);

    } catch (error) {
        console.error('\n❌ PARSING FAILED:');
        console.error(error);
        console.error('\nStack trace:', error.stack);
    }
}

test().then(() => {
    console.log('\n' + '='.repeat(60));
});

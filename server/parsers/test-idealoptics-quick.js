const fs = require('fs');
const path = require('path');
const { parseIdealOpticsHtml } = require('./idealOpticsParser');

/**
 * Quick test of Ideal Optics parser with sample email
 */
async function testIdealOpticsParser() {
    console.log('🧪 Testing Ideal Optics Parser\n');
    console.log('='.repeat(80));

    try {
        // Read the sample email
        const emailPath = path.join(__dirname, '../../dev-email-parsers/Ideal Optics/email.txt');
        const html = fs.readFileSync(emailPath, 'utf8');

        console.log('📧 Sample email loaded');
        console.log('  File:', emailPath);
        console.log('  Size:', html.length, 'bytes\n');

        // Parse HTML
        console.log('='.repeat(80));
        console.log('PARSING EMAIL HTML');
        console.log('='.repeat(80));

        const parsedData = parseIdealOpticsHtml(html, '');

        console.log('\n📊 PARSED DATA:');
        console.log(JSON.stringify(parsedData, null, 2));

        console.log('\n📊 SUMMARY:');
        console.log('  Vendor:', parsedData.vendor);
        console.log('  Order Number:', parsedData.orderNumber);
        console.log('  Order Date:', parsedData.orderDate);
        console.log('  Rep Name:', parsedData.repName);
        console.log('  Account Number:', parsedData.accountNumber);
        console.log('  Customer Name:', parsedData.customerName);
        console.log('  Total Items:', parsedData.items?.length || 0);
        console.log('  Total Quantity:', parsedData.totalQuantity);

        if (parsedData.items && parsedData.items.length > 0) {
            console.log('\n📦 ITEMS:');
            parsedData.items.forEach((item, index) => {
                console.log(`  [${index + 1}] ${item.brand || 'N/A'} ${item.model || 'N/A'}`);
                console.log(`      Color: ${item.color || 'N/A'}`);
                console.log(`      Size: ${item.size || 'N/A'}`);
                console.log(`      Qty: ${item.quantity || 'N/A'}`);
                console.log(`      UPC: ${item.upc || 'N/A'}`);
            });
        } else {
            console.log('\n❌ NO ITEMS PARSED!');
        }

        console.log('\n' + '='.repeat(80));
        if (parsedData.items && parsedData.items.length > 0) {
            console.log('✅ Parser is working!');
        } else {
            console.log('❌ Parser failed - no items extracted');
        }
        console.log('='.repeat(80));

    } catch (error) {
        console.error('\n❌ Test failed:', error.message);
        console.error(error.stack);
        process.exit(1);
    }
}

// Run test
testIdealOpticsParser()
    .then(() => {
        process.exit(0);
    })
    .catch(error => {
        console.error('\n❌ Test suite failed:', error);
        process.exit(1);
    });

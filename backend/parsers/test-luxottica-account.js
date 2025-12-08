const fs = require('fs');
const path = require('path');
const { parseLuxotticaHtml } = require('./luxotticaParser');

/**
 * Test Luxottica Parser - Account Number Extraction
 *
 * This script verifies that the Luxottica parser correctly extracts
 * the account number from the email (Customer code: 0001247652)
 */

async function testLuxotticaAccountExtraction() {
    console.log('═══════════════════════════════════════════════════════');
    console.log('  LUXOTTICA PARSER - ACCOUNT NUMBER TEST');
    console.log('═══════════════════════════════════════════════════════\n');

    try {
        // Read sample email
        const emailPath = path.join(__dirname, '../../dev-email-parsers/Luxottica/email.txt');
        console.log(`📧 Reading email from: ${emailPath}\n`);

        if (!fs.existsSync(emailPath)) {
            console.error(`❌ Email file not found: ${emailPath}`);
            return;
        }

        const html = fs.readFileSync(emailPath, 'utf-8');

        console.log('═══════════════════════════════════════════════════════');
        console.log('PARSING EMAIL');
        console.log('═══════════════════════════════════════════════════════\n');

        const parsedData = parseLuxotticaHtml(html, null);

        console.log('\n📋 PARSED ORDER DATA:');
        console.log('─────────────────────────────────────────────────────');
        console.log('Vendor:           ', parsedData.vendor);
        console.log('Order Number:     ', parsedData.order?.order_number || 'N/A');
        console.log('Customer Name:    ', parsedData.order?.customer_name || 'N/A');
        console.log('Account Number:   ', parsedData.account_number || 'MISSING!');
        console.log('Order Account:    ', parsedData.order?.account_number || 'N/A');
        console.log('Rep Name:         ', parsedData.order?.rep_name || 'N/A');
        console.log('Order Date:       ', parsedData.order?.order_date || 'N/A');
        console.log('Total Items:      ', parsedData.items?.length || 0);
        console.log('Total Pieces:     ', parsedData.order?.total_pieces || 0);
        console.log('─────────────────────────────────────────────────────\n');

        // Validation
        console.log('═══════════════════════════════════════════════════════');
        console.log('VALIDATION');
        console.log('═══════════════════════════════════════════════════════\n');

        const expectedAccountNumber = '0001247652';
        const actualAccountNumber = parsedData.account_number;

        if (actualAccountNumber === expectedAccountNumber) {
            console.log('✅ PASS - Account number correctly extracted');
            console.log(`   Expected: ${expectedAccountNumber}`);
            console.log(`   Actual:   ${actualAccountNumber}`);
        } else {
            console.log('❌ FAIL - Account number mismatch');
            console.log(`   Expected: ${expectedAccountNumber}`);
            console.log(`   Actual:   ${actualAccountNumber || 'MISSING'}`);
        }

        // Check if account number is also in order object
        if (parsedData.order?.account_number === expectedAccountNumber) {
            console.log('✅ PASS - Account number in order object');
        } else {
            console.log('⚠️  WARNING - Account number not in order object');
        }

        // Display sample items
        if (parsedData.items && parsedData.items.length > 0) {
            console.log('\n📦 SAMPLE ITEMS (first 3):');
            console.log('─────────────────────────────────────────────────────');
            parsedData.items.slice(0, 3).forEach((item, index) => {
                console.log(`\nItem ${index + 1}:`);
                console.log(`  Brand:     ${item.brand}`);
                console.log(`  Model:     ${item.model}`);
                console.log(`  Color:     ${item.color} (${item.color_code})`);
                console.log(`  Size:      ${item.size}`);
                console.log(`  UPC:       ${item.upc || 'N/A'}`);
                console.log(`  Price:     $${item.wholesale_price || 'N/A'}`);
                console.log(`  Quantity:  ${item.quantity}`);
            });
            console.log('─────────────────────────────────────────────────────');
        }

        console.log('\n═══════════════════════════════════════════════════════');
        console.log('  TEST COMPLETE');
        console.log('═══════════════════════════════════════════════════════\n');

    } catch (error) {
        console.error('\n❌ TEST FAILED:', error.message);
        console.error(error.stack);
    }
}

// Run the test
testLuxotticaAccountExtraction().then(() => {
    console.log('Test complete');
}).catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
});

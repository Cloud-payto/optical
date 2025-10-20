const fs = require('fs');
const path = require('path');
const { parseKenmarkHtml } = require('./kenmarkParser');
const { parseLamyamericaHtml } = require('./lamyamericaParser');
const { parseIdealOpticsHtml } = require('./idealOpticsParser');

/**
 * Test Account Number Extraction Across All Vendors
 *
 * This script verifies that account numbers are correctly extracted from emails
 * for Kenmark, L'amyamerica, and Ideal Optics
 */

function testAccountNumber(vendorName, emailPath, parser) {
    console.log(`\n${'═'.repeat(60)}`);
    console.log(`  ${vendorName.toUpperCase()} - ACCOUNT NUMBER TEST`);
    console.log(`${'═'.repeat(60)}\n`);

    try {
        // Check if email file exists
        if (!fs.existsSync(emailPath)) {
            console.log(`❌ Email file not found: ${emailPath}`);
            console.log(`   Please add a sample ${vendorName} email to test.\n`);
            return {
                vendor: vendorName,
                found: false,
                reason: 'Email file not found'
            };
        }

        // Read email
        const html = fs.readFileSync(emailPath, 'utf-8');
        console.log(`📧 Reading email from: ${emailPath}\n`);

        // Parse email
        const parsedData = parser(html, null);

        // Extract key fields
        const accountNumber = parsedData.accountNumber || parsedData.account_number;
        const customerName = parsedData.customerName || parsedData.customer_name;
        const orderNumber = parsedData.orderNumber || parsedData.order_number;

        console.log('📋 PARSED DATA:');
        console.log('─'.repeat(60));
        console.log(`Order Number:    ${orderNumber || 'NOT FOUND'}`);
        console.log(`Customer Name:   ${customerName || 'NOT FOUND'}`);
        console.log(`Account Number:  ${accountNumber || 'NOT FOUND'}`);
        console.log('─'.repeat(60));

        // Analyze the email text to find account number pattern
        console.log('\n🔍 SEARCHING FOR ACCOUNT NUMBER PATTERNS:\n');

        // Look for patterns like "Customer Name (ACCOUNT)" in the email
        const patterns = [
            /\(([A-Z0-9]{5,10})\)/g,  // Pattern: (ACCOUNT)
            /\(([ULD0-9]{8,10})\)/g,  // Pattern: (U00271302) or similar
            /\((\d{5,10})\)/g,        // Pattern: (19903) numeric
            /Account[:\s]+([A-Z0-9]{5,10})/gi,  // Pattern: Account: XXX
            /Customer[^(]*\(([A-Z0-9]{5,10})\)/gi  // Pattern: Customer Name (ACC)
        ];

        const foundPatterns = new Set();
        patterns.forEach((pattern, index) => {
            const matches = [...html.matchAll(pattern)];
            if (matches.length > 0) {
                matches.forEach(match => {
                    const value = match[1];
                    if (value && value.length >= 5) {
                        foundPatterns.add(value);
                        console.log(`  ✓ Pattern ${index + 1} found: "${value}"`);
                    }
                });
            }
        });

        if (foundPatterns.size === 0) {
            console.log('  ⚠️  No account number patterns found in email');
        }

        // Verify if parser captured the account number
        const success = accountNumber && accountNumber.length > 0;
        const uniquePatterns = Array.from(foundPatterns);

        console.log('\n📊 RESULT:');
        console.log('─'.repeat(60));
        if (success) {
            console.log(`✅ PASS - Account number extracted: "${accountNumber}"`);
            if (!uniquePatterns.includes(accountNumber)) {
                console.log(`⚠️  WARNING: Extracted value doesn't match found patterns`);
                console.log(`   Found in email: ${uniquePatterns.join(', ')}`);
            }
        } else {
            console.log(`❌ FAIL - Account number NOT extracted`);
            if (uniquePatterns.length > 0) {
                console.log(`   Possible values found in email: ${uniquePatterns.join(', ')}`);
            }
        }
        console.log('─'.repeat(60));
        console.log();

        return {
            vendor: vendorName,
            found: success,
            accountNumber: accountNumber,
            customerName: customerName,
            orderNumber: orderNumber,
            patternsFound: uniquePatterns
        };

    } catch (error) {
        console.error(`\n❌ TEST ERROR for ${vendorName}:`, error.message);
        console.error(error.stack);
        return {
            vendor: vendorName,
            found: false,
            reason: error.message
        };
    }
}

async function runAllTests() {
    console.log('\n');
    console.log('╔' + '═'.repeat(58) + '╗');
    console.log('║' + ' '.repeat(58) + '║');
    console.log('║' + '  ACCOUNT NUMBER EXTRACTION TEST SUITE'.padEnd(58) + '║');
    console.log('║' + ' '.repeat(58) + '║');
    console.log('╚' + '═'.repeat(58) + '╝');
    console.log('\n');

    const basePath = path.join(__dirname, '../../dev-email-parsers');

    // Test each vendor
    const results = [
        testAccountNumber(
            'Kenmark',
            path.join(basePath, 'Kenmark/email.txt'),
            parseKenmarkHtml
        ),
        testAccountNumber(
            'L\'amyamerica',
            path.join(basePath, 'L\'amyamerica/email.txt'),
            parseLamyamericaHtml
        ),
        testAccountNumber(
            'Ideal Optics',
            path.join(basePath, 'Ideal Optics/email.txt'),
            parseIdealOpticsHtml
        )
    ];

    // Summary
    console.log('\n');
    console.log('╔' + '═'.repeat(58) + '╗');
    console.log('║' + ' '.repeat(58) + '║');
    console.log('║' + '  TEST SUMMARY'.padEnd(58) + '║');
    console.log('║' + ' '.repeat(58) + '║');
    console.log('╚' + '═'.repeat(58) + '╝');
    console.log('\n');

    const passed = results.filter(r => r.found).length;
    const failed = results.filter(r => !r.found).length;

    results.forEach(result => {
        const status = result.found ? '✅ PASS' : '❌ FAIL';
        const accountInfo = result.accountNumber
            ? `Account: ${result.accountNumber}`
            : `No account extracted`;

        console.log(`${status} - ${result.vendor.padEnd(20)} ${accountInfo}`);

        if (result.patternsFound && result.patternsFound.length > 0 && !result.found) {
            console.log(`       Patterns found: ${result.patternsFound.join(', ')}`);
        }
    });

    console.log('\n');
    console.log(`Total Tests:  ${results.length}`);
    console.log(`✅ Passed:     ${passed}`);
    console.log(`❌ Failed:     ${failed}`);
    console.log(`Success Rate: ${Math.round((passed / results.length) * 100)}%`);
    console.log('\n');

    if (failed > 0) {
        console.log('⚠️  RECOMMENDATIONS:');
        console.log('─'.repeat(60));
        results.filter(r => !r.found).forEach(result => {
            console.log(`\n${result.vendor}:`);
            if (result.reason === 'Email file not found') {
                console.log(`  → Add sample email to dev-email-parsers/${result.vendor}/`);
            } else if (result.patternsFound && result.patternsFound.length > 0) {
                console.log(`  → Update parser regex to capture: ${result.patternsFound[0]}`);
                console.log(`  → Check parser file for account number extraction logic`);
            } else {
                console.log(`  → Inspect email HTML for account number location`);
                console.log(`  → May need to add new extraction pattern`);
            }
        });
        console.log('\n');
    }

    console.log('═'.repeat(60));
    console.log('\n');
}

// Run tests
runAllTests().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
});

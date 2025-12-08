/**
 * Europa Parser Tests
 * Tests parsing of both original and forwarded email formats
 */

const { parseEuropaHtml, validateParsedData } = require('../parsers/europaParser');
const fs = require('fs');
const path = require('path');

// Original email HTML (with CSS classes)
const originalEmailPath = path.join(__dirname, '../../dev/email-parsers/Europa/email.txt');

// Forwarded email HTML sample (with inline styles - simulating the n8n workflow input)
const forwardedEmailHtml = `<!DOCTYPE html PUBLIC "-//W3C//DTD HTML 4.01 Transitional//EN"><html><head><meta content="text/html;charset=UTF-8" http-equiv="Content-Type"></head><body><div class="zmail_extra"><blockquote><div><div><p>&nbsp;</p><div><div style="border: none; border-top: solid rgb(225, 225, 225) 1pt; padding: 3pt 0in 0in 0in"><p><b><span style="font-family:Calibri, sans-serif"><span style="font-size:11pt">From:</span></span></b><span style="font-family:Calibri, sans-serif"><span style="font-size:11pt"> noreply@europaeye.com &lt;noreply@europaeye.com&gt; <br> <b>Sent:</b> Tuesday, June 24, 2025 1:13 PM<br> <b>To:</b> Kaila Bucher &lt;manager@pveyecare.com&gt;<br> <b>Subject:</b> Customer Receipt: Your Receipt for Order #1484047</span></span></p></div></div><div><div align="center"><table cellpadding="0" cellspacing="0" border="0"><tbody><tr><td style="padding: 1.8pt" colspan="2"><p style="text-align: center;" align="center"><b><span style="color:black"><span style="font-family:Arial, sans-serif"><span style="font-size:9pt">PLEASE DO NOT REPLY TO THIS EMAIL<br> If you have questions or need to comment on an order, please contact your Europa sales representative</span></span></span></b></p></td></tr><tr><td style="padding: 1.8pt" colspan="2"><p><span style="color:black"><span style="font-family:Arial, sans-serif"><span style="font-size:9pt">&nbsp;</span></span></span></p></td></tr><tr><td style="padding: 1.8pt"><table cellpadding="0" cellspacing="1" border="0"><tbody><tr><td style="padding: 1.8pt"><p><b><span style="color:black"><span style="font-family:Arial, sans-serif"><span style="font-size:9pt">Order #:</span></span></span></b></p></td><td style="padding: 1.8pt"><p><span style="color:black"><span style="font-family:Arial, sans-serif"><span style="font-size:9pt">1484047</span></span></span></p></td></tr><tr><td style="padding: 1.8pt"><p><b><span style="color:black"><span style="font-family:Arial, sans-serif"><span style="font-size:9pt">Order Placed By Rep:</span></span></span></b></p></td><td style="padding: 1.8pt"><p><span style="color:black"><span style="font-family:Arial, sans-serif"><span style="font-size:9pt">NATALIE NELSON</span></span></span></p></td></tr><tr><td style="padding: 1.8pt"><p><b><span style="color:black"><span style="font-family:Arial, sans-serif"><span style="font-size:9pt">Date:</span></span></span></b></p></td><td style="padding: 1.8pt"><p><span style="color:black"><span style="font-family:Arial, sans-serif"><span style="font-size:9pt">6/24/2025</span></span></span></p></td></tr></tbody></table></td></tr><tr><td style="padding: 1.8pt"><table style="width: 100%" width="100%" cellpadding="0" cellspacing="1" border="0"><tbody><tr><td style="background: rgb(11, 27, 87); padding: 1.8pt" colspan="8"><p style="text-align: center;" align="center"><b><span style="color:white"><span style="font-family:Arial, sans-serif"><span style="font-size:9pt">Customer</span></span></span></b></p></td></tr><tr><td style="background: rgb(204, 204, 204); padding: 1.8pt"><p style="text-align: center;" align="center"><span style="color:black"><span style="font-family:Arial, sans-serif"><span style="font-size:9pt">Account</span></span></span></p></td><td style="background: rgb(204, 204, 204); padding: 1.8pt"><p><span style="color:black"><span style="font-family:Arial, sans-serif"><span style="font-size:9pt">Name</span></span></span></p></td><td style="background: rgb(204, 204, 204); padding: 1.8pt"><p><span style="color:black"><span style="font-family:Arial, sans-serif"><span style="font-size:9pt">Address</span></span></span></p></td><td style="background: rgb(204, 204, 204); padding: 1.8pt"><p><span style="color:black"><span style="font-family:Arial, sans-serif"><span style="font-size:9pt">Address 2</span></span></span></p></td><td style="background: rgb(204, 204, 204); padding: 1.8pt"><p><span style="color:black"><span style="font-family:Arial, sans-serif"><span style="font-size:9pt">City</span></span></span></p></td><td style="background: rgb(204, 204, 204); padding: 1.8pt"><p style="text-align: center;" align="center"><span style="color:black"><span style="font-family:Arial, sans-serif"><span style="font-size:9pt">Province</span></span></span></p></td><td style="background: rgb(204, 204, 204); padding: 1.8pt"><p style="text-align: center;" align="center"><span style="color:black"><span style="font-family:Arial, sans-serif"><span style="font-size:9pt">Postal Code</span></span></span></p></td><td style="background: rgb(204, 204, 204); padding: 1.8pt"><p style="text-align: center;" align="center"><span style="color:black"><span style="font-family:Arial, sans-serif"><span style="font-size:9pt">Phone</span></span></span></p></td></tr><tr><td style="padding: 1.8pt"><p style="text-align: center;" align="center"><span style="color:black"><span style="font-family:Arial, sans-serif"><span style="font-size:9pt">AZ6372</span></span></span></p></td><td style="padding: 1.8pt"><p><span style="color:black"><span style="font-family:Arial, sans-serif"><span style="font-size:9pt">PARADISE VALLEY EYECARE</span></span></span></p></td><td style="padding: 1.8pt"><p><span style="color:black"><span style="font-family:Arial, sans-serif"><span style="font-size:9pt">12450 N. 32ND ST.</span></span></span></p></td><td style="padding: 1.8pt"><p><span style="color:black"><span style="font-family:Arial, sans-serif"><span style="font-size:9pt">UNIT 1</span></span></span></p></td><td style="padding: 1.8pt"><p><span style="color:black"><span style="font-family:Arial, sans-serif"><span style="font-size:9pt">PHOENIX</span></span></span></p></td><td style="padding: 1.8pt"><p style="text-align: center;" align="center"><span style="color:black"><span style="font-family:Arial, sans-serif"><span style="font-size:9pt">AZ</span></span></span></p></td><td style="padding: 1.8pt"><p style="text-align: center;" align="center"><span style="color:black"><span style="font-family:Arial, sans-serif"><span style="font-size:9pt">85032</span></span></span></p></td><td style="padding: 1.8pt" nowrap=""><p style="text-align: center;" align="center"><span style="color:black"><span style="font-family:Arial, sans-serif"><span style="font-size:9pt">602-494-0054</span></span></span></p></td></tr></tbody></table></td></tr><tr><td style="padding: 1.8pt"><p><span style="color:black"><span style="font-family:Arial, sans-serif"><span style="font-size:9pt">&nbsp;</span></span></span></p></td></tr><tr><td style="padding: 1.8pt"><table style="width: 100%" width="100%" cellpadding="0" cellspacing="1" border="0"><tbody><tr><td style="background: rgb(11, 27, 87); padding: 1.8pt" colspan="6"><p style="text-align: center;" align="center"><b><span style="color:white"><span style="font-family:Arial, sans-serif"><span style="font-size:9pt">Ship Address</span></span></span></b></p></td></tr><tr><td style="background: rgb(204, 204, 204); padding: 1.8pt"><p><span style="color:black"><span style="font-family:Arial, sans-serif"><span style="font-size:9pt">Name</span></span></span></p></td><td style="background: rgb(204, 204, 204); padding: 1.8pt"><p><span style="color:black"><span style="font-family:Arial, sans-serif"><span style="font-size:9pt">Address</span></span></span></p></td><td style="background: rgb(204, 204, 204); padding: 1.8pt"><p><span style="color:black"><span style="font-family:Arial, sans-serif"><span style="font-size:9pt">Address 2</span></span></span></p></td><td style="background: rgb(204, 204, 204); padding: 1.8pt"><p><span style="color:black"><span style="font-family:Arial, sans-serif"><span style="font-size:9pt">City</span></span></span></p></td><td style="background: rgb(204, 204, 204); padding: 1.8pt"><p style="text-align: center;" align="center"><span style="color:black"><span style="font-family:Arial, sans-serif"><span style="font-size:9pt">Province</span></span></span></p></td><td style="background: rgb(204, 204, 204); padding: 1.8pt"><p style="text-align: center;" align="center"><span style="color:black"><span style="font-family:Arial, sans-serif"><span style="font-size:9pt">Postal Code</span></span></span></p></td></tr><tr><td style="padding: 1.8pt"><p><span style="color:black"><span style="font-family:Arial, sans-serif"><span style="font-size:9pt">PARADISE VALLEY EYECARE</span></span></span></p></td><td style="padding: 1.8pt"><p><span style="color:black"><span style="font-family:Arial, sans-serif"><span style="font-size:9pt">12450 N. 32ND ST.</span></span></span></p></td><td style="padding: 1.8pt"><p><span style="color:black"><span style="font-family:Arial, sans-serif"><span style="font-size:9pt">UNIT 1</span></span></span></p></td><td style="padding: 1.8pt"><p><span style="color:black"><span style="font-family:Arial, sans-serif"><span style="font-size:9pt">PHOENIX</span></span></span></p></td><td style="padding: 1.8pt"><p style="text-align: center;" align="center"><span style="color:black"><span style="font-family:Arial, sans-serif"><span style="font-size:9pt">AZ</span></span></span></p></td><td style="padding: 1.8pt"><p style="text-align: center;" align="center"><span style="color:black"><span style="font-family:Arial, sans-serif"><span style="font-size:9pt">85032</span></span></span></p></td></tr></tbody></table></td></tr><tr><td style="padding: 1.8pt"><p><span style="color:black"><span style="font-family:Arial, sans-serif"><span style="font-size:9pt">&nbsp;</span></span></span></p></td></tr><tr><td style="padding: 1.8pt"><table style="width: 100%" width="100%" cellpadding="0" cellspacing="1" border="0"><tbody><tr><td style="background: rgb(11, 27, 87); padding: 1.8pt" colspan="6"><p style="text-align: center;" align="center"><b><span style="color:white"><span style="font-family:Arial, sans-serif"><span style="font-size:9pt">Order Items</span></span></span></b></p></td></tr><tr><td style="background: rgb(204, 204, 204); padding: 1.8pt"><p style="text-align: center;" align="center"><span style="color:black"><span style="font-family:Arial, sans-serif"><span style="font-size:9pt">Order Type</span></span></span></p></td><td style="background: rgb(204, 204, 204); padding: 1.8pt"><p style="text-align: center;" align="center"><span style="color:black"><span style="font-family:Arial, sans-serif"><span style="font-size:9pt">Model</span></span></span></p></td><td style="background: rgb(204, 204, 204); padding: 1.8pt"><p style="text-align: center;" align="center"><span style="color:black"><span style="font-family:Arial, sans-serif"><span style="font-size:9pt">Color</span></span></span></p></td><td style="background: rgb(204, 204, 204); padding: 1.8pt"><p style="text-align: center;" align="center"><span style="color:black"><span style="font-family:Arial, sans-serif"><span style="font-size:9pt">Size</span></span></span></p></td><td style="background: rgb(204, 204, 204); padding: 1.8pt"><p style="text-align: center;" align="center"><span style="color:black"><span style="font-family:Arial, sans-serif"><span style="font-size:9pt">Qty</span></span></span></p></td><td style="background: rgb(204, 204, 204); padding: 1.8pt"><p style="text-align: center;" align="center"><span style="color:black"><span style="font-family:Arial, sans-serif"><span style="font-size:9pt">Available Status</span></span></span></p></td></tr><tr><td style="padding: 1.8pt"></td><td style="padding: 1.8pt"><p style="text-align: center;" align="center"><span style="color:black"><span style="font-family:Arial, sans-serif"><span style="font-size:9pt">American Optical - Adams</span></span></span></p></td><td style="padding: 1.8pt"><p style="text-align: center;" align="center"><span style="color:black"><span style="font-family:Arial, sans-serif"><span style="font-size:9pt">1 Black - Green Nylon Polarized - ST</span></span></span></p></td><td style="padding: 1.8pt"><p style="text-align: center;" align="center"><span style="color:black"><span style="font-family:Arial, sans-serif"><span style="font-size:9pt">52</span></span></span></p></td><td style="padding: 1.8pt"><p style="text-align: center;" align="center"><span style="color:black"><span style="font-family:Arial, sans-serif"><span style="font-size:9pt">1</span></span></span></p></td><td style="padding: 1.8pt"><p style="text-align: center;" align="center"><span style="color:black"><span style="font-family:Arial, sans-serif"><span style="font-size:9pt">Available</span></span></span></p></td></tr><tr><td style="padding: 1.8pt" colspan="6"></td></tr><tr><td style="padding: 1.8pt"></td><td style="padding: 1.8pt"><p style="text-align: center;" align="center"><span style="color:black"><span style="font-family:Arial, sans-serif"><span style="font-size:9pt">Cinzia - CIN-5080</span></span></span></p></td><td style="padding: 1.8pt"><p style="text-align: center;" align="center"><span style="color:black"><span style="font-family:Arial, sans-serif"><span style="font-size:9pt">1 Peacock Demi</span></span></span></p></td><td style="padding: 1.8pt"><p style="text-align: center;" align="center"><span style="color:black"><span style="font-family:Arial, sans-serif"><span style="font-size:9pt">53</span></span></span></p></td><td style="padding: 1.8pt"><p style="text-align: center;" align="center"><span style="color:black"><span style="font-family:Arial, sans-serif"><span style="font-size:9pt">1</span></span></span></p></td><td style="padding: 1.8pt"><p style="text-align: center;" align="center"><span style="color:black"><span style="font-family:Arial, sans-serif"><span style="font-size:9pt">Available</span></span></span></p></td></tr><tr><td style="padding: 1.8pt" colspan="6"></td></tr><tr><td style="padding: 1.8pt"></td><td style="padding: 1.8pt"><p style="text-align: center;" align="center"><span style="color:black"><span style="font-family:Arial, sans-serif"><span style="font-size:9pt">Michael Ryen - MR-314</span></span></span></p></td><td style="padding: 1.8pt"><p style="text-align: center;" align="center"><span style="color:black"><span style="font-family:Arial, sans-serif"><span style="font-size:9pt">1 Matte Black / Gunmetal</span></span></span></p></td><td style="padding: 1.8pt"><p style="text-align: center;" align="center"><span style="color:black"><span style="font-family:Arial, sans-serif"><span style="font-size:9pt">60</span></span></span></p></td><td style="padding: 1.8pt"><p style="text-align: center;" align="center"><span style="color:black"><span style="font-family:Arial, sans-serif"><span style="font-size:9pt">1</span></span></span></p></td><td style="padding: 1.8pt"><p style="text-align: center;" align="center"><span style="color:black"><span style="font-family:Arial, sans-serif"><span style="font-size:9pt">Available</span></span></span></p></td></tr></tbody></table></td></tr><tr><td style="padding: 1.8pt"><p><span style="color:black"><span style="font-family:Arial, sans-serif"><span style="font-size:9pt">&nbsp;</span></span></span></p></td></tr><tr><td style="padding: 1.8pt"><table cellpadding="0" cellspacing="1" border="0"><tbody><tr><td style="padding: 1.8pt"><p><b><span style="color:black"><span style="font-family:Arial, sans-serif"><span style="font-size:9pt">Total Pieces:</span></span></span></b></p></td><td style="padding: 1.8pt"><p style="text-align: right;" align="right"><span style="color:black"><span style="font-family:Arial, sans-serif"><span style="font-size:9pt">3</span></span></span></p></td></tr><tr><td style="padding: 1.8pt"><p><b><span style="color:black"><span style="font-family:Arial, sans-serif"><span style="font-size:9pt">Terms:</span></span></span></b></p></td><td style="padding: 1.8pt"><p style="text-align: right;" align="right"><span style="color:black"><span style="font-family:Arial, sans-serif"><span style="font-size:9pt">NET 60</span></span></span></p></td></tr><tr><td style="padding: 1.8pt"><p><b><span style="color:black"><span style="font-family:Arial, sans-serif"><span style="font-size:9pt">Ship Method:</span></span></span></b></p></td><td style="padding: 1.8pt"><p style="text-align: right;" align="right"><span style="color:black"><span style="font-family:Arial, sans-serif"><span style="font-size:9pt">UPS GROUND</span></span></span></p></td></tr></tbody></table></td></tr></tbody></table></div></div></div></blockquote></div></body></html>`;

const plainText = `Order #: 1484047
Order Placed By Rep: NATALIE NELSON
Date: 6/24/2025
Terms: NET 60
Ship Method: UPS GROUND`;

function runTests() {
    console.log('='.repeat(60));
    console.log('EUROPA PARSER TESTS');
    console.log('='.repeat(60));

    let passCount = 0;
    let failCount = 0;

    // Test 1: Original email format (with CSS classes)
    console.log('\n📧 Test 1: Original Email Format (CSS classes)');
    console.log('-'.repeat(40));
    try {
        const originalHtml = fs.readFileSync(originalEmailPath, 'utf8');
        const result = parseEuropaHtml(originalHtml, '');
        const validation = validateParsedData(result);

        console.log('Order Number:', result.orderNumber);
        console.log('Account Number:', result.accountNumber);
        console.log('Customer Name:', result.customerName);
        console.log('Items Count:', result.items.length);
        console.log('Validation:', validation.valid ? 'PASSED' : 'FAILED', validation.errors);

        if (validation.valid && result.items.length > 0 && result.orderNumber === '1484047') {
            console.log('✅ Test 1 PASSED');
            passCount++;
        } else {
            console.log('❌ Test 1 FAILED');
            failCount++;
        }
    } catch (error) {
        console.log('❌ Test 1 FAILED with error:', error.message);
        failCount++;
    }

    // Test 2: Forwarded email format (with inline styles)
    console.log('\n📧 Test 2: Forwarded Email Format (inline styles)');
    console.log('-'.repeat(40));
    try {
        const result = parseEuropaHtml(forwardedEmailHtml, plainText);
        const validation = validateParsedData(result);

        console.log('Order Number:', result.orderNumber);
        console.log('Account Number:', result.accountNumber);
        console.log('Customer Name:', result.customerName);
        console.log('Items Count:', result.items.length);
        console.log('Terms:', result.terms);
        console.log('Ship Method:', result.shipMethod);
        console.log('Validation:', validation.valid ? 'PASSED' : 'FAILED', validation.errors);

        if (result.items && result.items.length > 0) {
            console.log('\nItems found:');
            result.items.forEach((item, idx) => {
                console.log(`  ${idx + 1}. ${item.brand} - ${item.model} (${item.color}) Size: ${item.size}`);
            });
        }

        if (validation.valid && result.items.length === 3 && result.orderNumber === '1484047') {
            console.log('✅ Test 2 PASSED');
            passCount++;
        } else {
            console.log('❌ Test 2 FAILED');
            console.log('  Expected 3 items, got:', result.items.length);
            console.log('  Expected order #1484047, got:', result.orderNumber);
            failCount++;
        }
    } catch (error) {
        console.log('❌ Test 2 FAILED with error:', error.message);
        failCount++;
    }

    // Test 3: Customer info extraction from forwarded email
    console.log('\n📧 Test 3: Customer Info from Forwarded Email');
    console.log('-'.repeat(40));
    try {
        const result = parseEuropaHtml(forwardedEmailHtml, plainText);

        console.log('Account Number:', result.accountNumber);
        console.log('Customer Name:', result.customerName);
        console.log('Customer Address:', result.customerAddress);
        console.log('Customer City:', result.customerCity);
        console.log('Customer State:', result.customerState);
        console.log('Customer Phone:', result.customerPhone);

        const hasCustomerInfo = result.accountNumber === 'AZ6372' &&
                                result.customerName === 'PARADISE VALLEY EYECARE' &&
                                result.customerCity === 'PHOENIX' &&
                                result.customerState === 'AZ';

        if (hasCustomerInfo) {
            console.log('✅ Test 3 PASSED');
            passCount++;
        } else {
            console.log('❌ Test 3 FAILED');
            failCount++;
        }
    } catch (error) {
        console.log('❌ Test 3 FAILED with error:', error.message);
        failCount++;
    }

    // Summary
    console.log('\n' + '='.repeat(60));
    console.log(`SUMMARY: ${passCount} passed, ${failCount} failed`);
    console.log('='.repeat(60));

    return failCount === 0;
}

// Run tests if called directly
if (require.main === module) {
    const success = runTests();
    process.exit(success ? 0 : 1);
}

module.exports = { runTests };

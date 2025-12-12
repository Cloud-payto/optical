/**
 * Test script for ClearVision parser
 * Run: node test-clearvision-parser.cjs
 */

const fs = require('fs');
const path = require('path');

// Load the parser
const { parseClearVisionHtml, validateParsedData } = require('../../../backend/parsers/clearvisionParser');

// Read the sample email
const emailPath = path.join(__dirname, 'email.txt');
const html = fs.readFileSync(emailPath, 'utf-8');

console.log('='.repeat(60));
console.log('ClearVision Parser Test');
console.log('='.repeat(60));
console.log('');

// Parse the email
const result = parseClearVisionHtml(html);

console.log('');
console.log('='.repeat(60));
console.log('PARSED RESULT');
console.log('='.repeat(60));
console.log('');

// Display order info
console.log('ORDER INFORMATION:');
console.log('-'.repeat(40));
console.log('  Vendor:', result.vendor);
console.log('  Vendor Code:', result.vendorCode);
console.log('  Order Number:', result.orderNumber);
console.log('  Order Date:', result.orderDate);
console.log('  Rep Name:', result.repName);
console.log('');

console.log('CUSTOMER INFORMATION:');
console.log('-'.repeat(40));
console.log('  Account Number:', result.accountNumber);
console.log('  Customer Name:', result.customerName);
console.log('  Address:', result.customerAddress);
console.log('  City:', result.customerCity);
console.log('  State:', result.customerState);
console.log('  Postal Code:', result.customerPostalCode);
console.log('  Territory:', result.territory);
console.log('');

console.log('SHIPPING INFORMATION:');
console.log('-'.repeat(40));
console.log('  Ship To:', result.shipToName);
console.log('  Address:', result.shipToAddress);
console.log('  City:', result.shipToCity);
console.log('  State:', result.shipToState);
console.log('  Postal Code:', result.shipToPostalCode);
console.log('  Ship Method:', result.shipMethod);
console.log('  Terms:', result.terms);
console.log('');

console.log('ITEMS:');
console.log('-'.repeat(40));
result.items.forEach((item, index) => {
    console.log(`\n  [${index + 1}] ${item.brand} ${item.model}`);
    console.log(`      SKU: ${item.sku}`);
    console.log(`      Color: ${item.colorName}`);
    console.log(`      Size: ${item.size} (Eye: ${item.eyeSize}, Bridge: ${item.bridge}, Temple: ${item.temple})`);
    console.log(`      Quantity: ${item.quantity}`);
    console.log(`      List Price: $${item.listPrice.toFixed(2)}`);
    console.log(`      Description: ${item.description}`);
});
console.log('');

console.log('TOTALS:');
console.log('-'.repeat(40));
console.log('  Total Items:', result.totalItems);
console.log('  Total Quantity:', result.totalQuantity);
console.log('  Total Price: $' + result.totalPrice.toFixed(2));
console.log('');

// Validate
console.log('VALIDATION:');
console.log('-'.repeat(40));
const validation = validateParsedData(result);
console.log('  Valid:', validation.valid ? 'YES' : 'NO');
if (validation.errors.length > 0) {
    console.log('  Errors:');
    validation.errors.forEach(e => console.log('    - ' + e));
}
if (validation.warnings.length > 0) {
    console.log('  Warnings:');
    validation.warnings.forEach(w => console.log('    - ' + w));
}
console.log('');

// Save result to file
const outputPath = path.join(__dirname, 'parsed-result.json');
fs.writeFileSync(outputPath, JSON.stringify(result, null, 2));
console.log('Full result saved to:', outputPath);
console.log('');
console.log('='.repeat(60));

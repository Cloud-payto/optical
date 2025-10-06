const fs = require('fs');
const path = require('path');
const { parseLuxotticaHtml } = require('../../server/parsers/luxotticaParser');

// Read the sample email
const emailPath = path.join(__dirname, 'email.txt');
const html = fs.readFileSync(emailPath, 'utf-8');

console.log('🧪 Testing Luxottica Parser');
console.log('=' .repeat(60));

try {
    const result = parseLuxotticaHtml(html, null);

    console.log('\n✅ PARSING SUCCESSFUL\n');

    console.log('📋 ORDER INFORMATION:');
    console.log('  Vendor:', result.vendor);
    console.log('  Account Number:', result.account_number);
    console.log('  Cart/Order Number:', result.order.order_number);
    console.log('  Customer Name:', result.order.customer_name);
    console.log('  Order Date:', result.order.order_date);
    console.log('  Rep Name:', result.order.rep_name);
    console.log('  Payment Terms:', result.order.payment_terms);
    console.log('  Promo Code:', result.order.promo_code);
    console.log('  Total Pieces:', result.order.total_pieces);
    console.log('  Total Value:', result.order.total_value ? `$${result.order.total_value.toFixed(2)}` : 'N/A');

    console.log('\n📦 ITEMS:');
    console.log('  Total Items:', result.items.length);

    // Group items by brand
    const itemsByBrand = result.items.reduce((acc, item) => {
        if (!acc[item.brand]) {
            acc[item.brand] = [];
        }
        acc[item.brand].push(item);
        return acc;
    }, {});

    console.log('\n  Items by Brand:');
    Object.keys(itemsByBrand).forEach(brand => {
        console.log(`    ${brand}: ${itemsByBrand[brand].length} items`);
    });

    console.log('\n🔍 UNIQUE FRAMES:');
    console.log('  Total Unique Frames:', result.unique_frames.length);
    result.unique_frames.forEach(frame => {
        const collection = frame.collection ? ` - ${frame.collection}` : '';
        console.log(`    ${frame.brand} ${frame.model}${collection}`);
    });

    console.log('\n📝 SAMPLE ITEMS (first 5):');
    result.items.slice(0, 5).forEach((item, index) => {
        console.log(`\n  Item ${index + 1}:`);
        console.log(`    Brand: ${item.brand}`);
        console.log(`    Model: ${item.model}`);
        if (item.collection) console.log(`    Collection: ${item.collection}`);
        console.log(`    Color: ${item.color} (${item.color_code})`);
        console.log(`    Size: ${item.size}`);
        console.log(`    UPC: ${item.upc}`);
        console.log(`    Price: $${item.wholesale_price.toFixed(2)}`);
        console.log(`    Quantity: ${item.quantity}`);
        console.log(`    Shipping Date: ${item.shipping_date}`);
        console.log(`    SKU: ${item.sku}`);
    });

    // Verify totals
    console.log('\n✓ VERIFICATION:');
    const totalQty = result.items.reduce((sum, item) => sum + item.quantity, 0);
    const totalValue = result.items.reduce((sum, item) => sum + (item.wholesale_price * item.quantity), 0);
    console.log(`  Sum of quantities: ${totalQty}`);
    console.log(`  Calculated total value: $${totalValue.toFixed(2)}`);
    console.log(`  Order total value: $${result.order.total_value?.toFixed(2) || 'N/A'}`);

    if (Math.abs(totalValue - (result.order.total_value || 0)) < 0.01) {
        console.log('  ✅ Total values match!');
    } else {
        console.log('  ⚠️  Total values do not match (this might be OK if there are fees/discounts)');
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

console.log('\n' + '='.repeat(60));

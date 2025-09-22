const fs = require('fs');
const path = require('path');

/**
 * Debug script to check what order information is being extracted
 */
async function debugSafiloOrder() {
    console.log('🔍 Debugging Safilo Order Processing...\n');
    
    try {
        // Check if we can find the latest Safilo order data
        const emailsPath = path.join(__dirname, 'data', 'emails.json');
        const inventoryPath = path.join(__dirname, 'data', 'inventory.json');
        
        // Read inventory data
        const inventoryData = JSON.parse(fs.readFileSync(inventoryPath, 'utf8'));
        const safiloItems = inventoryData.filter(item => item.vendor === 'Safilo');
        
        console.log(`📊 Found ${safiloItems.length} Safilo items in inventory`);
        
        if (safiloItems.length > 0) {
            const sampleItem = safiloItems[0];
            console.log('\n🔍 Sample Safilo Item:');
            console.log('- SKU:', sampleItem.sku);
            console.log('- Brand:', sampleItem.brand);
            console.log('- Model:', sampleItem.model);
            console.log('- Order Number:', sampleItem.order_number || 'MISSING');
            console.log('- Account Number:', sampleItem.account_number || 'MISSING');
            console.log('- Wholesale Price:', sampleItem.wholesale_price);
            console.log('- UPC:', sampleItem.upc);
            console.log('- API Verified:', sampleItem.api_verified);
            console.log('- Email ID:', sampleItem.email_id);
            
            console.log('\n📧 Checking email data...');
            
            // Try to read emails data
            try {
                const emailsData = JSON.parse(fs.readFileSync(emailsPath, 'utf8'));
                const relatedEmail = emailsData.find(email => email.id === sampleItem.email_id);
                
                if (relatedEmail && relatedEmail.parsed_data) {
                    console.log('\n📋 Email Parse Data:');
                    console.log('- Vendor:', relatedEmail.parsed_data.vendor);
                    console.log('- Account Number:', relatedEmail.parsed_data.account_number);
                    console.log('- Order Number:', relatedEmail.parsed_data.order?.order_number);
                    console.log('- Customer Name:', relatedEmail.parsed_data.order?.customer_name);
                    console.log('- Reference Number:', relatedEmail.parsed_data.order?.reference_number);
                    console.log('- Items Count:', relatedEmail.parsed_data.items?.length);
                    
                    if (relatedEmail.parsed_data.enrichment_stats) {
                        console.log('\n📈 Enrichment Stats:');
                        console.log('- Total Frames:', relatedEmail.parsed_data.enrichment_stats.totalFrames);
                        console.log('- Validated:', relatedEmail.parsed_data.enrichment_stats.validated);
                        console.log('- Validation Rate:', relatedEmail.parsed_data.enrichment_stats.validationRate);
                    }
                } else {
                    console.log('❌ No parsed data found in email');
                }
            } catch (emailError) {
                console.log('❌ Error reading emails:', emailError.message);
            }
        }
        
        console.log('\n🎯 Diagnosis:');
        if (safiloItems.length > 0 && safiloItems[0].wholesale_price) {
            console.log('✅ SafiloService API enrichment is working');
        }
        if (!safiloItems[0]?.order_number) {
            console.log('❌ Order information extraction is failing');
            console.log('   This suggests the PDF header parsing needs debugging');
        }
        
    } catch (error) {
        console.error('❌ Debug failed:', error.message);
    }
}

// Run debug
debugSafiloOrder();
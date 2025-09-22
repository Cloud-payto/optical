const http = require('http');

// Test with a Safilo email that should trigger the enhanced data storage
const safiloTestEmail = {
  headers: {
    from: "pmillet@modernoptical.com",
    to: "test@optiprofit.com", 
    subject: "FW: Your Receipt for Order 113008888",
    date: new Date().toISOString(),
    message_id: "<data-test-" + Date.now() + "@modernoptical.com>",
    references: "<ADR50000001732709100B90C763A6E961FE0A39BC72A4E652307@SAFILO.COM>"
  },
  envelope: {
    from: "pmillet@modernoptical.com",
    to: ["test@optiprofit.com"]
  },
  plain: `From: Safilo <noreply@safilo.com>
Subject: Your Receipt for Order 113008888

Your order has been received for processing and will ship shortly.

We appreciate your business.
Safilo USA, Inc.`,
  html: "<p>Safilo order with enhanced data storage test</p>",
  attachments: [
    {
      content_type: "application/pdf",
      file_name: "order_confirmation.pdf", 
      size: 12345,
      // Test PDF with frame data
      content: "JVBERi0xLjMNCiXi48/TDQpDQVJSRVJBIDg5MjAgVEJPIE1JTElUQVJZIEdSRUVOIDU1LzE2IDE0NQ0KTUlTIDAwNjIgUkhMIEdPTEQgQkxBQ0svIDUyLzE2IDE0MA0K"
    }
  ],
  spam_score: 0.1,
  spam_status: "NOT_SPAM"
};

function makeRequest(options, data) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let responseData = '';
      
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body: responseData
        });
      });
    });
    
    req.on('error', reject);
    
    if (data) {
      req.write(data);
    }
    
    req.end();
  });
}

async function testEnhancedDataStorage() {
  console.log('🔍 Testing Enhanced Safilo Data Storage...\n');
  
  try {
    console.log('📧 Sending Safilo email...');
    
    const response = await makeRequest({
      hostname: 'localhost',
      port: 3001,
      path: '/api/webhook/email',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    }, JSON.stringify(safiloTestEmail));
    
    const result = JSON.parse(response.body);
    console.log('📨 Response:', result);
    
    if (result.parsed) {
      console.log('✅ Email processed successfully!');
      
      // Check inventory to see the enhanced data
      console.log('\n📦 Checking enhanced inventory data...');
      const inventoryResponse = await makeRequest({
        hostname: 'localhost',
        port: 3001,
        path: '/api/inventory/1',
        method: 'GET'
      });
      
      const inventory = JSON.parse(inventoryResponse.body);
      const latestSafiloItems = inventory.inventory
        .filter(item => item.vendor === 'Safilo')
        .slice(-3); // Get last 3 Safilo items
      
      console.log(`Found ${latestSafiloItems.length} latest Safilo items`);
      
      latestSafiloItems.forEach((item, index) => {
        console.log(`\nSafilo Item ${index + 1}:`);
        console.log('- SKU:', item.sku);
        console.log('- Brand:', item.brand);  
        console.log('- Model:', item.model);
        console.log('- Color:', item.color);
        console.log('- Size:', item.size);
        console.log('- Wholesale Price:', item.wholesale_price ? `$${item.wholesale_price}` : 'Not set');
        console.log('- Full Size:', item.full_size || 'Not set');
        console.log('- UPC:', item.upc || 'Not set');
        console.log('- API Verified:', item.api_verified ? 'Yes' : 'No');
        console.log('- In Stock:', item.in_stock ? 'Yes' : (item.in_stock === false ? 'No' : 'Unknown'));
      });
      
    } else {
      console.log('⚠️  Email not parsed - check logs');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

setTimeout(testEnhancedDataStorage, 2000);
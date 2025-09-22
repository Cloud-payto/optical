const http = require('http');
const fs = require('fs');

// Test with a realistic Safilo email including PDF attachment content
const realisticSafiloEmailData = {
  headers: {
    from: "pmillet@modernoptical.com",
    to: "test@optiprofit.com", 
    subject: "FW: Your Receipt for Order 113006337",
    date: new Date().toISOString(),
    message_id: "<realistic-test-" + Date.now() + "@modernoptical.com>",
    references: "<ADR50000001732709100B90C763A6E961FE0A39BC72A4E652307@SAFILO.COM>"
  },
  envelope: {
    from: "pmillet@modernoptical.com",
    to: ["test@optiprofit.com"]
  },
  plain: `From: Safilo <noreply@safilo.com>
Subject: Your Receipt for Order 113006337

Your order has been received for processing and will ship shortly.

We appreciate your business.
Safilo USA, Inc.`,
  html: "<p>Safilo order confirmation with PDF attachment</p>",
  attachments: [
    {
      content_type: "application/pdf",
      file_name: "order_confirmation.pdf", 
      size: 12345,
      // Simple test PDF content with some frame data
      content: "JVBERi0xLjMNCiXi48/TDQolRVRGOCBQYXJhbWV0ZXJzOiAjRFJTVFhoDQpNSVMgMDA2MiBSSEwgR09MRCBCTEFDSy8gNTIvMTYgMTQwDQpDQVJSRVJBIDg5MjAgVEJPIE1JTElUQVJZIEdSRUVOIDU1LzE2IDE0NQ0KS1MgREFFU0hBIDIvRy9TIDBUNCBIQVZBTkEgUElOSyA1NS8xOSAxNDUgTEENCg=="
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

async function testRealisticSafilo() {
  console.log('🔍 Testing Realistic Safilo Email Processing...\n');
  
  try {
    console.log('📧 Sending Safilo Email with PDF:');
    console.log('From:', realisticSafiloEmailData.headers.from);
    console.log('Subject:', realisticSafiloEmailData.headers.subject);
    console.log('References:', realisticSafiloEmailData.headers.references);
    console.log('Has PDF attachment:', realisticSafiloEmailData.attachments.length > 0);
    console.log('Expected: Should detect Safilo, parse PDF, create pending inventory\n');
    
    const response = await makeRequest({
      hostname: 'localhost',
      port: 3001,
      path: '/api/webhook/email',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    }, JSON.stringify(realisticSafiloEmailData));
    
    const result = JSON.parse(response.body);
    console.log('📨 Response:', result);
    
    if (result.parsed) {
      console.log('✅ SUCCESS: Safilo email processed successfully!');
    } else {
      console.log('⚠️  WARNING: Email received but not parsed (check logs)');
    }
    
    // Check inventory count
    console.log('\n📦 Checking inventory...');
    const inventoryResponse = await makeRequest({
      hostname: 'localhost',
      port: 3001,
      path: '/api/inventory/1',
      method: 'GET'
    });
    
    const inventory = JSON.parse(inventoryResponse.body);
    const safiloItems = inventory.inventory.filter(item => item.vendor === 'Safilo');
    
    console.log(`Found ${safiloItems.length} Safilo items in inventory`);
    if (safiloItems.length > 0) {
      console.log('Latest Safilo item:', {
        sku: safiloItems[safiloItems.length - 1].sku,
        brand: safiloItems[safiloItems.length - 1].brand,
        model: safiloItems[safiloItems.length - 1].model,
        status: safiloItems[safiloItems.length - 1].status
      });
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

setTimeout(testRealisticSafilo, 2000);
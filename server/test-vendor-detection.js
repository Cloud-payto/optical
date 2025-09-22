const http = require('http');

// Test data simulating a forwarded Safilo email from your modernoptical.com address
const forwardedSafiloEmailData = {
  headers: {
    from: "pmillet@modernoptical.com",  // Your forwarding address
    to: "test@optiprofit.com", 
    subject: "FW: Your Receipt for Order 113006337",  // Forwarded subject
    date: new Date().toISOString(),
    message_id: "<forwarded-test-" + Date.now() + "@modernoptical.com>",
    references: "<ADR50000001732709100B90C763A6E961FE0A39BC72A4E652307@SAFILO.COM>"  // Original Safilo message
  },
  envelope: {
    from: "pmillet@modernoptical.com",  // Your forwarding address
    to: ["test@optiprofit.com"]
  },
  plain: `
From: Chelsea Piper <cpiper@petelinvision.com>
Sent: Tuesday, September 9, 2025 10:39 AM
To: Payton Millet <pmillet@modernoptical.com>
Subject: Fw: Your Receipt for Order 113006337

From: Safilo <noreply@safilo.com>
Sent: Monday, September 8, 2025 11:00 AM
To: Chelsea Piper <cpiper@petelinvision.com>
Cc: LURA.HAUGEN@SAFILO.COM <LURA.HAUGEN@SAFILO.COM>
Subject: Your Receipt for Order 113006337

Your order has been received for processing and will ship shortly.

We appreciate your business.
Safilo USA, Inc.
  `,
  html: `<p>Forwarded Safilo order confirmation with attachment</p>`,
  attachments: [
    {
      content_type: "application/pdf",
      file_name: "order_confirmation.pdf", 
      size: 12345,
      content: "base64encodedpdfcontent"
    }
  ],
  spam_score: 0.1,
  spam_status: "NOT_SPAM"
};

// Test data for a regular Modern Optical email (not forwarded)
const regularModernOpticalEmailData = {
  headers: {
    from: "orders@modernoptical.com",
    to: "test@optiprofit.com", 
    subject: "Order Confirmation #12345",
    date: new Date().toISOString(),
    message_id: "<direct-test-" + Date.now() + "@modernoptical.com>"
  },
  envelope: {
    from: "orders@modernoptical.com",
    to: ["test@optiprofit.com"]
  },
  plain: "This is a direct Modern Optical order confirmation.",
  html: "<p>Direct Modern Optical order</p>",
  attachments: [],
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

async function testVendorDetection() {
  console.log('🔍 Testing Vendor Detection Logic...\n');
  
  try {
    // Test 1: Forwarded Safilo email
    console.log('📧 Test 1: Forwarded Safilo Email');
    console.log('From:', forwardedSafiloEmailData.headers.from);
    console.log('Subject:', forwardedSafiloEmailData.headers.subject);
    console.log('References:', forwardedSafiloEmailData.headers.references);
    console.log('Expected: Should detect as Safilo (not Modern Optical)\n');
    
    const webhookResponse1 = await makeRequest({
      hostname: 'localhost',
      port: 3001,
      path: '/api/webhook/email',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    }, JSON.stringify(forwardedSafiloEmailData));
    
    const response1 = JSON.parse(webhookResponse1.body);
    console.log('📨 Response:', response1);
    
    if (response1.parsed) {
      console.log('✅ SUCCESS: Forwarded Safilo email was correctly detected and parsed');
    } else {
      console.log('❌ FAILED: Forwarded Safilo email was not detected as Safilo');
    }
    
    console.log('\n' + '='.repeat(60) + '\n');
    
    // Test 2: Regular Modern Optical email
    console.log('📧 Test 2: Direct Modern Optical Email');
    console.log('From:', regularModernOpticalEmailData.headers.from);
    console.log('Subject:', regularModernOpticalEmailData.headers.subject);
    console.log('Expected: Should detect as Modern Optical\n');
    
    const webhookResponse2 = await makeRequest({
      hostname: 'localhost',
      port: 3001,
      path: '/api/webhook/email',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    }, JSON.stringify(regularModernOpticalEmailData));
    
    const response2 = JSON.parse(webhookResponse2.body);
    console.log('📨 Response:', response2);
    
    if (response2.parsed) {
      console.log('✅ SUCCESS: Direct Modern Optical email was correctly detected');
    } else {
      console.log('⚠️  NOTE: Modern Optical email not parsed (may be expected if no HTML content)');
    }
    
    console.log('\n🔧 Vendor detection tests completed!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
}

// Run test
console.log('Make sure the server is running (npm start)');
console.log('Waiting 2 seconds before starting test...\n');
setTimeout(testVendorDetection, 2000);
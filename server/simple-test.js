const http = require('http');

// Simple test with very clear Safilo content
const testEmailData = {
  headers: {
    from: "pmillet@modernoptical.com",
    to: "test@optiprofit.com", 
    subject: "FW: Your Receipt for Order 113006337",
    date: new Date().toISOString(),
    message_id: "<simple-test-" + Date.now() + "@modernoptical.com>"
  },
  envelope: {
    from: "pmillet@modernoptical.com",
    to: ["test@optiprofit.com"]
  },
  plain: "From: Safilo <noreply@safilo.com>\nSafilo USA, Inc.\nYour order has been processed.",
  html: "<p>From: Safilo &lt;noreply@safilo.com&gt;</p><p>Safilo USA, Inc.</p>",
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

async function testSimple() {
  console.log('🔍 Simple Vendor Detection Test...\n');
  
  try {
    console.log('📧 Testing Email:');
    console.log('From:', testEmailData.headers.from);
    console.log('Subject:', testEmailData.headers.subject);
    console.log('Content:', testEmailData.plain);
    console.log('Expected: Should detect Safilo from content\n');
    
    const response = await makeRequest({
      hostname: 'localhost',
      port: 3001,
      path: '/api/webhook/email',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    }, JSON.stringify(testEmailData));
    
    const result = JSON.parse(response.body);
    console.log('📨 Response:', result);
    
    if (result.parsed) {
      console.log('✅ SUCCESS: Vendor detection working!');
    } else {
      console.log('❌ FAILED: Vendor detection not working');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

setTimeout(testSimple, 2000);
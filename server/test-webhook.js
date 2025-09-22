const http = require('http');

// Test data simulating CloudMailin webhook
const testEmailData = {
  headers: {
    from: "sender@example.com",
    to: "test@optiprofit.com",
    subject: "Test Email from CloudMailin",
    date: new Date().toISOString(),
    message_id: "<test-" + Date.now() + "@example.com>"
  },
  envelope: {
    from: "sender@example.com",
    to: ["test@optiprofit.com"]
  },
  plain: "This is a test email body in plain text.\nIt contains inventory updates.",
  html: "<p>This is a test email body in HTML.</p><p>It contains inventory updates.</p>",
  attachments: [],
  spam_score: 0.1,
  spam_status: "NOT_SPAM"
};

// Function to make HTTP request
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

async function runTests() {
  console.log('Starting webhook tests...\n');
  
  try {
    // Test 1: Health check
    console.log('1. Testing health endpoint...');
    const healthResponse = await makeRequest({
      hostname: 'localhost',
      port: 3001,
      path: '/api/health',
      method: 'GET'
    });
    console.log('Health check response:', JSON.parse(healthResponse.body));
    console.log('✓ Health check passed\n');
    
    // Test 2: Webhook test endpoint
    console.log('2. Testing webhook test endpoint...');
    const testResponse = await makeRequest({
      hostname: 'localhost',
      port: 3001,
      path: '/api/webhook/email/test',
      method: 'GET'
    });
    console.log('Webhook test response:', JSON.parse(testResponse.body));
    console.log('✓ Webhook test endpoint passed\n');
    
    // Test 3: Send test email webhook
    console.log('3. Sending test email webhook...');
    const webhookResponse = await makeRequest({
      hostname: 'localhost',
      port: 3001,
      path: '/api/webhook/email',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    }, JSON.stringify(testEmailData));
    console.log('Webhook response:', JSON.parse(webhookResponse.body));
    console.log('✓ Email webhook processed\n');
    
    // Test 4: List emails
    console.log('4. Listing emails for account...');
    const listResponse = await makeRequest({
      hostname: 'localhost',
      port: 3001,
      path: '/api/webhook/email/list/1',
      method: 'GET'
    });
    const emails = JSON.parse(listResponse.body);
    console.log(`Found ${emails.count} emails:`, emails.emails);
    console.log('✓ Email listing passed\n');
    
    console.log('All tests passed! ✅');
    
  } catch (error) {
    console.error('Test failed:', error);
    process.exit(1);
  }
}

// Run tests
console.log('Make sure the server is running (npm run server)');
console.log('Waiting 2 seconds before starting tests...\n');
setTimeout(runTests, 2000);
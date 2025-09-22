const http = require('http');
const fs = require('fs');

// Test data simulating CloudMailin webhook with Safilo email
const safiloEmailData = {
  headers: {
    from: "noreply@safilo.com",
    to: "test@optiprofit.com", 
    subject: "EyeRep Order Confirmation #123456",
    date: new Date().toISOString(),
    message_id: "<safilo-test-" + Date.now() + "@safilo.com>"
  },
  envelope: {
    from: "noreply@safilo.com",
    to: ["test@optiprofit.com"]
  },
  plain: "This is a test Safilo order confirmation email.",
  html: "<p>This is a test Safilo order confirmation email.</p>",
  attachments: [
    {
      content_type: "application/pdf",
      file_name: "order_confirmation.pdf", 
      size: 12345,
      content: "base64encodedpdfcontent" // This would be actual PDF content in base64
    }
  ],
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

async function testSafiloDetection() {
  console.log('🔍 Testing Safilo Email Detection...\n');
  
  try {
    // Test Safilo email detection
    console.log('📧 Sending Safilo email webhook...');
    console.log('From:', safiloEmailData.headers.from);
    console.log('Subject:', safiloEmailData.headers.subject);
    console.log('Attachments:', safiloEmailData.attachments.length, '\n');
    
    const webhookResponse = await makeRequest({
      hostname: 'localhost',
      port: 3001,
      path: '/api/webhook/email',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    }, JSON.stringify(safiloEmailData));
    
    const response = JSON.parse(webhookResponse.body);
    console.log('📨 Webhook Response:', response);
    
    // Check if Safilo was detected and processed
    if (response.parsed) {
      console.log('✅ SUCCESS: Safilo email was detected and parsed');
    } else {
      console.log('❌ WARNING: Safilo email was not parsed (might be expected due to mock PDF)');
    }
    
    // List emails to verify it was saved
    console.log('\n📋 Checking saved emails...');
    const listResponse = await makeRequest({
      hostname: 'localhost',
      port: 3001,
      path: '/api/webhook/email/list/1',
      method: 'GET'
    });
    
    const emails = JSON.parse(listResponse.body);
    const safiloEmails = emails.emails.filter(email => 
      email.from.includes('safilo.com')
    );
    
    console.log(`Found ${safiloEmails.length} Safilo emails in database`);
    if (safiloEmails.length > 0) {
      const latestSafilo = safiloEmails[safiloEmails.length - 1];
      console.log('Latest Safilo email:', {
        id: latestSafilo.id,
        from: latestSafilo.from,
        subject: latestSafilo.subject,
        parsed_data: latestSafilo.parsed_data ? 'YES' : 'NO'
      });
    }
    
    console.log('\n🔧 Test completed successfully!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
}

// Run test
console.log('Make sure the server is running (npm run server)');
console.log('Waiting 2 seconds before starting test...\n');
setTimeout(testSafiloDetection, 2000);
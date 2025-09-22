const http = require('http');

// Function to make HTTP request
function makeRequest(options) {
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
    req.end();
  });
}

async function testEmailsAPI() {
  console.log('Testing emails API endpoint...\n');
  
  try {
    // Test health check first
    console.log('1. Testing health endpoint...');
    const healthResponse = await makeRequest({
      hostname: 'localhost',
      port: 3001,
      path: '/api/health',
      method: 'GET'
    });
    console.log('Health check response:', JSON.parse(healthResponse.body));
    console.log('✓ Health check passed\n');
    
    // Test emails endpoint
    console.log('2. Testing emails endpoint...');
    const emailsResponse = await makeRequest({
      hostname: 'localhost',
      port: 3001,
      path: '/api/emails/1',
      method: 'GET'
    });
    
    const emailsData = JSON.parse(emailsResponse.body);
    console.log('Emails response:', emailsData);
    
    if (emailsData.success) {
      console.log(`✓ Found ${emailsData.count} emails for account 1`);
      if (emailsData.emails.length > 0) {
        console.log('Latest email:', emailsData.emails[0]);
      }
    } else {
      console.log('✗ Error in emails response:', emailsData.error);
    }
    
    console.log('\nTest completed! ✅');
    
  } catch (error) {
    console.error('Test failed:', error.message);
    console.log('\nMake sure the server is running: npm run server');
  }
}

testEmailsAPI();
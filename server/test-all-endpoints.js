const http = require('http');

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

async function testAllEndpoints() {
  console.log('Testing all API endpoints...\n');
  
  const accountId = 1;
  let testsPassed = 0;
  let testsTotal = 0;
  
  try {
    // Test 1: Health check
    testsTotal++;
    console.log('1. Testing health endpoint...');
    const healthResponse = await makeRequest({
      hostname: 'localhost',
      port: 3001,
      path: '/api/health',
      method: 'GET'
    });
    
    if (healthResponse.statusCode === 200) {
      const healthData = JSON.parse(healthResponse.body);
      console.log('✓ Health check passed:', healthData.status);
      testsPassed++;
    } else {
      console.log('✗ Health check failed:', healthResponse.statusCode);
    }
    
    // Test 2: Emails endpoint (new)
    testsTotal++;
    console.log('\n2. Testing emails endpoint (/api/emails/:accountId)...');
    const emailsResponse = await makeRequest({
      hostname: 'localhost',
      port: 3001,
      path: `/api/emails/${accountId}`,
      method: 'GET'
    });
    
    if (emailsResponse.statusCode === 200) {
      const emailsData = JSON.parse(emailsResponse.body);
      console.log(`✓ Emails endpoint passed: Found ${emailsData.count} emails`);
      testsPassed++;
    } else {
      console.log('✗ Emails endpoint failed:', emailsResponse.statusCode);
    }
    
    // Test 3: Inventory endpoint
    testsTotal++;
    console.log('\n3. Testing inventory endpoint...');
    const inventoryResponse = await makeRequest({
      hostname: 'localhost',
      port: 3001,
      path: `/api/inventory/${accountId}`,
      method: 'GET'
    });
    
    if (inventoryResponse.statusCode === 200) {
      const inventoryData = JSON.parse(inventoryResponse.body);
      console.log(`✓ Inventory endpoint passed: Found ${inventoryData.count} items`);
      testsPassed++;
    } else {
      console.log('✗ Inventory endpoint failed:', inventoryResponse.statusCode);
    }
    
    // Test 4: Webhook emails endpoint (legacy)
    testsTotal++;
    console.log('\n4. Testing webhook emails endpoint (legacy)...');
    const webhookEmailsResponse = await makeRequest({
      hostname: 'localhost',
      port: 3001,
      path: `/api/webhook/email/list/${accountId}`,
      method: 'GET'
    });
    
    if (webhookEmailsResponse.statusCode === 200) {
      const webhookEmailsData = JSON.parse(webhookEmailsResponse.body);
      console.log(`✓ Webhook emails endpoint passed: Found ${webhookEmailsData.count} emails`);
      testsPassed++;
    } else {
      console.log('✗ Webhook emails endpoint failed:', webhookEmailsResponse.statusCode);
    }
    
    // Test 5: Webhook test endpoint
    testsTotal++;
    console.log('\n5. Testing webhook test endpoint...');
    const webhookTestResponse = await makeRequest({
      hostname: 'localhost',
      port: 3001,
      path: '/api/webhook/email/test',
      method: 'GET'
    });
    
    if (webhookTestResponse.statusCode === 200) {
      const webhookTestData = JSON.parse(webhookTestResponse.body);
      console.log('✓ Webhook test endpoint passed:', webhookTestData.message);
      testsPassed++;
    } else {
      console.log('✗ Webhook test endpoint failed:', webhookTestResponse.statusCode);
    }
    
    // Summary
    console.log(`\n📊 Test Results: ${testsPassed}/${testsTotal} tests passed`);
    
    if (testsPassed === testsTotal) {
      console.log('🎉 All tests passed! The API is ready for the frontend.');
    } else {
      console.log('❌ Some tests failed. Check the server logs for details.');
    }
    
  } catch (error) {
    console.error('Test suite failed:', error.message);
    console.log('\n💡 Make sure the server is running: npm run server');
    console.log('💡 Make sure sample data exists: cd server && node test-database.js');
  }
}

// Add some delay to let user read the message
console.log('🚀 Starting API endpoint tests...');
console.log('Make sure the server is running on port 3001\n');
setTimeout(testAllEndpoints, 1000);
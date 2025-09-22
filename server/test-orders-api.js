// Test orders API endpoint

const baseUrl = 'http://localhost:3001/api';

async function testOrdersAPI() {
  try {
    // Test if orders endpoint exists
    console.log('Testing orders endpoint...\n');
    
    const response = await fetch(`${baseUrl}/orders/1`);
    console.log('Status:', response.status);
    console.log('Status Text:', response.statusText);
    
    const data = await response.json();
    console.log('Response:', JSON.stringify(data, null, 2));
    
  } catch (error) {
    console.error('Error testing orders API:', error);
  }
}

// Run the test
testOrdersAPI();
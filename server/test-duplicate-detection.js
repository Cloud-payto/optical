const { getEmailsByAccount, checkDuplicateOrder } = require('./db/database');
const parserRegistry = require('./parsers');

// Get the Modern Optical email
const emails = getEmailsByAccount(1);
const modernOpticalEmail = emails.find(e => e.from_email.includes('modernoptical.com'));

if (!modernOpticalEmail) {
  console.log('Modern Optical email not found');
  process.exit(1);
}

console.log('Testing duplicate detection...');
console.log('Original email ID:', modernOpticalEmail.id);

// First test the direct duplicate check function
console.log('\n1. Testing direct duplicate check function...');
const parsedData = parserRegistry.parseEmail(modernOpticalEmail.from_email, modernOpticalEmail.html_text, modernOpticalEmail.plain_text);

if (parsedData && parsedData.order) {
  const orderNumber = parsedData.order.order_number;
  const customerName = parsedData.order.customer_name;
  const accountNumber = parsedData.order.account_number;
  
  console.log(`Checking for duplicate of order ${orderNumber} from ${customerName} (${accountNumber})`);
  
  const duplicateResult = checkDuplicateOrder(1, orderNumber, customerName, accountNumber);
  
  if (duplicateResult.isDuplicate) {
    console.log('✅ Direct duplicate check working:', duplicateResult.message);
  } else {
    console.log('❌ Direct duplicate check failed - should detect existing order');
  }
} else {
  console.log('❌ Could not parse order data for duplicate check');
}

// Extract the raw email data for webhook test
const rawData = JSON.parse(modernOpticalEmail.raw_data);

// Create a test webhook payload simulating the same email being sent again
const testPayload = rawData;

console.log('Sending duplicate email webhook...');

// Send to webhook endpoint
const url = 'http://localhost:3001/api/webhook/email';
const options = {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify(testPayload)
};

fetch(url, options)
  .then(response => response.json())
  .then(data => {
    console.log('Webhook response:', data);
    if (data.duplicate) {
      console.log('✅ Duplicate detection working! Order was not processed again.');
    } else {
      console.log('❌ Duplicate detection failed. Order was processed again.');
    }
  })
  .catch(error => {
    console.error('Error testing duplicate detection:', error);
  });
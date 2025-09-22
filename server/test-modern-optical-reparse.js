const { getEmailsByAccount, saveInventoryItems, updateEmailWithParsedData } = require('./db/database');
const parserRegistry = require('./parsers');

// Get emails for account 1
const emails = getEmailsByAccount(1);

if (!emails || emails.length === 0) {
  console.log('No emails found');
  process.exit(1);
}

// Find the Modern Optical email
const email = emails.find(e => e.from_email.includes('modernoptical.com'));

if (!email) {
  console.log('Modern Optical email not found');
  process.exit(1);
}

console.log('Found email from:', email.from_email);
console.log('Subject:', email.subject);

// Parse the raw data
const rawData = JSON.parse(email.raw_data);

console.log('Testing parser...');
console.log('Email from:', email.from_email);

try {
  if (parserRegistry.hasParser(email.from_email)) {
    console.log('Parser found! Processing...');
    
    const parsedData = parserRegistry.parseEmail(email.from_email, email.html_text, email.plain_text);
    
    console.log('Parsed Data:');
    console.log('- Vendor:', parsedData.vendor);
    console.log('- Order Number:', parsedData.order?.order_number);
    console.log('- Customer:', parsedData.order?.customer_name);
    console.log('- Account Number:', parsedData.order?.account_number);
    console.log('- Total Items:', parsedData.items?.length || 0);
    console.log('- Brands:', parsedData.brands);
    
    if (parsedData.items && parsedData.items.length > 0) {
      console.log('\nItems found:');
      parsedData.items.forEach((item, index) => {
        console.log(`  ${index + 1}. ${item.brand} - ${item.model} (${item.color}) - Size: ${item.size} - Qty: ${item.quantity}`);
      });
      
      console.log('\nSaving inventory items...');
      
      // Save inventory items with "pending" status
      parsedData.items.forEach(item => {
        saveInventoryItems(1, [{
          ...item,
          status: 'pending',
          email_id: email.id
        }]);
      });
      
      // Update email with parsed data
      updateEmailWithParsedData(email.id, parsedData);
      
      console.log(`Successfully processed ${parsedData.items.length} items!`);
    } else {
      console.log('No items found in parsed data');
    }
  } else {
    console.log('No parser available for this vendor domain');
  }
} catch (error) {
  console.error('Error parsing:', error);
}
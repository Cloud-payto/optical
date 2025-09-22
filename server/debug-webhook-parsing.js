const { getEmailsByAccount } = require('./db/database');
const parserRegistry = require('./parsers');

// Get the Modern Optical email
const emails = getEmailsByAccount(1);
const modernOpticalEmail = emails.find(e => e.from_email.includes('modernoptical.com'));

if (!modernOpticalEmail) {
  console.log('Modern Optical email not found');
  process.exit(1);
}

console.log('Debugging webhook parsing...');

// Extract the raw data as it would come from CloudMailin
const rawData = JSON.parse(modernOpticalEmail.raw_data);

// Simulate webhook parsing as it would happen in the webhook route
const emailData = {
  from: rawData.envelope?.from || rawData.headers?.from || 'unknown',
  to: rawData.envelope?.to?.[0] || rawData.headers?.to || 'unknown',
  subject: rawData.headers?.subject || 'No Subject',
  date: rawData.headers?.date || new Date().toISOString(),
  message_id: rawData.headers?.message_id || null,
  plain_text: rawData.plain || '',
  html_text: rawData.html || '',
  spam_score: rawData.spam_score || 0,
  spam_status: rawData.spam_status || 'unknown',
  attachments_count: rawData.attachments?.length || 0
};

console.log('Email data extracted for parsing:');
console.log('- From:', emailData.from);
console.log('- HTML length:', emailData.html_text.length);
console.log('- Plain length:', emailData.plain_text.length);

// Try parsing with this data
console.log('\nAttempting to parse...');
try {
  const parsedData = parserRegistry.parseEmail(emailData.from, emailData.html_text, emailData.plain_text);
  
  if (parsedData && parsedData.items && parsedData.items.length > 0) {
    console.log(`✅ Successfully parsed ${parsedData.items.length} items`);
    console.log(`Order: ${parsedData.order?.order_number}`);
    console.log(`Customer: ${parsedData.order?.customer_name}`);
  } else {
    console.log('❌ No items found in parsed data');
    console.log('Parsed data:', JSON.stringify(parsedData, null, 2));
  }
} catch (error) {
  console.error('❌ Parsing error:', error);
}

console.log('\nComparing to direct email parsing...');
try {
  const directParsedData = parserRegistry.parseEmail(modernOpticalEmail.from_email, modernOpticalEmail.html_text, modernOpticalEmail.plain_text);
  
  if (directParsedData && directParsedData.items && directParsedData.items.length > 0) {
    console.log(`✅ Direct parsing: ${directParsedData.items.length} items`);
  } else {
    console.log('❌ Direct parsing failed too');
  }
} catch (error) {
  console.error('❌ Direct parsing error:', error);
}
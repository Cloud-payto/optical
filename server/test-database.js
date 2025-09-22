// Test database functionality directly
const { 
  initializeDatabase, 
  saveEmail, 
  getEmailsByAccount,
  upsertInventory,
  getInventoryByAccount,
  closeDatabase 
} = require('./db/database');

console.log('Testing JSON file database...\n');

try {
  // Initialize database
  console.log('1. Initializing database...');
  initializeDatabase();
  console.log('✓ Database initialized\n');

  // Test saving emails
  console.log('2. Testing email save...');
  const testEmail1 = {
    from: 'orders@luxottica.com',
    to: 'test@optiprofit.com',
    subject: 'Order Confirmation - Ray-Ban Frames',
    plain_text: 'Your order for Ray-Ban frames has been confirmed.',
    html_text: '<p>Your order for Ray-Ban frames has been confirmed.</p>',
    attachments_count: 1,
    message_id: '<order123@luxottica.com>',
    spam_score: 0.1
  };
  
  const testEmail2 = {
    from: 'shipping@safilo.com',
    to: 'test@optiprofit.com',
    subject: 'Shipment Notification - Carrera Collection',
    plain_text: 'Your Carrera frames shipment is on the way.',
    html_text: '<p>Your Carrera frames shipment is on the way.</p>',
    attachments_count: 2,
    message_id: '<ship456@safilo.com>',
    spam_score: 0.05
  };
  
  const saveResult1 = saveEmail(1, JSON.stringify(testEmail1), testEmail1);
  const saveResult2 = saveEmail(1, JSON.stringify(testEmail2), testEmail2);
  console.log('✓ Emails saved with IDs:', saveResult1.emailId, saveResult2.emailId, '\n');

  // Test retrieving emails
  console.log('3. Testing email retrieval...');
  const emails = getEmailsByAccount(1);
  console.log(`✓ Retrieved ${emails.length} emails`);
  console.log('Latest email:', emails[0], '\n');

  // Test inventory upsert
  console.log('4. Testing inventory upsert...');
  const inventoryResult1 = upsertInventory(1, 'TEST-SKU-001', 50, 'Test Vendor');
  const inventoryResult2 = upsertInventory(1, 'RAY-BAN-001', 25, 'Luxottica');
  const inventoryResult3 = upsertInventory(1, 'OAKLEY-002', 30, 'Luxottica');
  console.log('✓ Inventory updated:', inventoryResult1, inventoryResult2, inventoryResult3, '\n');

  // Test inventory retrieval
  console.log('5. Testing inventory retrieval...');
  const inventory = getInventoryByAccount(1);
  console.log(`✓ Retrieved ${inventory.length} inventory items`);
  console.log('Inventory:', inventory, '\n');

  console.log('All tests passed! ✅');
  
} catch (error) {
  console.error('Test failed:', error);
} finally {
  closeDatabase();
}
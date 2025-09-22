// Test confirming a pending order
const baseUrl = 'http://localhost:3001/api';

async function testConfirmOrder() {
  try {
    console.log('Testing order confirmation...\n');
    
    // First, check current inventory status
    const invResponse = await fetch(`${baseUrl}/inventory/1`);
    const invData = await invResponse.json();
    
    // Find pending items to confirm
    const pendingItems = invData.inventory.filter(item => item.status === 'pending');
    console.log(`Found ${pendingItems.length} pending items`);
    
    if (pendingItems.length > 0) {
      const orderNumber = pendingItems[0].order_number;
      console.log(`Confirming order #${orderNumber}...`);
      
      // Confirm the order
      const confirmResponse = await fetch(`${baseUrl}/inventory/1/confirm/${orderNumber}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      const confirmData = await confirmResponse.json();
      console.log('Confirmation result:', confirmData);
      
      // Check orders list
      const ordersResponse = await fetch(`${baseUrl}/orders/1`);
      const ordersData = await ordersResponse.json();
      console.log('\nOrders after confirmation:', JSON.stringify(ordersData, null, 2));
    } else {
      console.log('No pending items to confirm');
    }
    
  } catch (error) {
    console.error('Error:', error);
  }
}

// Run the test
testConfirmOrder();
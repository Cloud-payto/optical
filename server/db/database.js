const fs = require('fs');
const path = require('path');

// Data directory path
const dataDir = path.join(__dirname, '../data');

// JSON file paths
const accountsFile = path.join(dataDir, 'accounts.json');
const emailsFile = path.join(dataDir, 'emails.json');
const inventoryFile = path.join(dataDir, 'inventory.json');
const ordersFile = path.join(dataDir, 'orders.json');

// Ensure data directory exists
function ensureDataDirectory() {
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
    console.log('Created data directory:', dataDir);
  }
}

// Helper function to read JSON file
function readJsonFile(filePath, defaultValue = []) {
  try {
    if (fs.existsSync(filePath)) {
      const data = fs.readFileSync(filePath, 'utf8');
      return JSON.parse(data);
    }
    return defaultValue;
  } catch (err) {
    console.error(`Error reading ${filePath}:`, err);
    return defaultValue;
  }
}

// Helper function to write JSON file
function writeJsonFile(filePath, data) {
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
  } catch (err) {
    console.error(`Error writing ${filePath}:`, err);
    throw err;
  }
}

// Initialize database
function initializeDatabase() {
  try {
    // Ensure data directory exists
    ensureDataDirectory();

    // Initialize accounts file
    if (!fs.existsSync(accountsFile)) {
      const defaultAccounts = [
        {
          id: 1,
          email: 'test@optiprofit.com',
          name: 'Test Account',
          created_at: new Date().toISOString()
        }
      ];
      writeJsonFile(accountsFile, defaultAccounts);
      console.log('Accounts file initialized');
    } else {
      console.log('Accounts file ready');
    }

    // Initialize emails file
    if (!fs.existsSync(emailsFile)) {
      writeJsonFile(emailsFile, []);
      console.log('Emails file initialized');
    } else {
      console.log('Emails file ready');
    }

    // Initialize inventory file
    if (!fs.existsSync(inventoryFile)) {
      writeJsonFile(inventoryFile, []);
      console.log('Inventory file initialized');
    } else {
      console.log('Inventory file ready');
    }

    // Initialize orders file
    if (!fs.existsSync(ordersFile)) {
      writeJsonFile(ordersFile, []);
      console.log('Orders file initialized');
    } else {
      console.log('Orders file ready');
    }

    console.log('JSON database initialized at:', dataDir);
  } catch (err) {
    console.error('Error initializing database:', err);
    throw err;
  }
}

// Get next ID for a collection
function getNextId(collection) {
  if (collection.length === 0) return 1;
  const maxId = Math.max(...collection.map(item => item.id || 0));
  return maxId + 1;
}

// Database functions

// Get all accounts
function getAccounts() {
  return readJsonFile(accountsFile, []);
}

// Get account by ID
function getAccountById(id) {
  const accounts = getAccounts();
  return accounts.find(account => account.id === parseInt(id));
}

// Get account by email
function getAccountByEmail(email) {
  const accounts = getAccounts();
  return accounts.find(account => account.email === email);
}

// Save email to database
function saveEmail(accountId, rawData, emailData) {
  try {
    const emails = readJsonFile(emailsFile, []);
    const newEmail = {
      id: getNextId(emails),
      account_id: parseInt(accountId),
      raw_data: rawData,
      from_email: emailData.from,
      to_email: emailData.to,
      subject: emailData.subject,
      plain_text: emailData.plain_text,
      html_text: emailData.html_text,
      attachments_count: emailData.attachments_count,
      message_id: emailData.message_id,
      spam_score: emailData.spam_score,
      processed_at: new Date().toISOString()
    };
    
    emails.push(newEmail);
    writeJsonFile(emailsFile, emails);
    
    return { emailId: newEmail.id };
  } catch (err) {
    console.error('Error saving email:', err);
    throw err;
  }
}

// Get emails by account
function getEmailsByAccount(accountId) {
  try {
    const emails = readJsonFile(emailsFile, []);
    return emails
      .filter(email => email.account_id === parseInt(accountId))
      .sort((a, b) => new Date(b.processed_at) - new Date(a.processed_at))
      .slice(0, 100);
  } catch (err) {
    console.error('Error getting emails:', err);
    throw err;
  }
}

// Create or update inventory item
function upsertInventory(accountId, sku, quantity, vendor) {
  try {
    const inventory = readJsonFile(inventoryFile, []);
    const existingIndex = inventory.findIndex(
      item => item.account_id === parseInt(accountId) && item.sku === sku
    );
    
    if (existingIndex >= 0) {
      // Update existing
      inventory[existingIndex] = {
        ...inventory[existingIndex],
        quantity: parseInt(quantity),
        vendor: vendor,
        updated_at: new Date().toISOString()
      };
      writeJsonFile(inventoryFile, inventory);
      return { 
        inventoryId: inventory[existingIndex].id,
        changes: 1
      };
    } else {
      // Create new
      const newItem = {
        id: getNextId(inventory),
        account_id: parseInt(accountId),
        sku: sku,
        quantity: parseInt(quantity),
        vendor: vendor,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      inventory.push(newItem);
      writeJsonFile(inventoryFile, inventory);
      return { 
        inventoryId: newItem.id,
        changes: 1
      };
    }
  } catch (err) {
    console.error('Error upserting inventory:', err);
    throw err;
  }
}

// Get inventory by account
function getInventoryByAccount(accountId) {
  try {
    const inventory = readJsonFile(inventoryFile, []);
    return inventory
      .filter(item => item.account_id === parseInt(accountId))
      .sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at));
  } catch (err) {
    console.error('Error getting inventory:', err);
    throw err;
  }
}

// Update email with parsed data
function updateEmailWithParsedData(emailId, parsedData) {
  try {
    const emails = readJsonFile(emailsFile, []);
    const emailIndex = emails.findIndex(email => email.id === parseInt(emailId));
    
    if (emailIndex >= 0) {
      emails[emailIndex] = {
        ...emails[emailIndex],
        parsed_data: parsedData,
        parse_status: 'success',
        parsed_at: new Date().toISOString()
      };
      writeJsonFile(emailsFile, emails);
      return { success: true };
    }
    
    return { success: false, error: 'Email not found' };
  } catch (err) {
    console.error('Error updating email with parsed data:', err);
    throw err;
  }
}

// Save multiple inventory items (for bulk operations)
function saveInventoryItems(accountId, items) {
  try {
    const inventory = readJsonFile(inventoryFile, []);
    let changesCount = 0;
    
    items.forEach(item => {
      const newItem = {
        id: getNextId(inventory),
        account_id: parseInt(accountId),
        sku: item.sku,
        brand: item.brand || '',
        model: item.model || '',
        color: item.color || '',
        size: item.size || '',
        quantity: item.quantity || 1,
        vendor: item.vendor || '',
        status: item.status || 'pending',
        order_number: item.order_number || '',
        account_number: item.account_number || '',
        email_id: item.email_id || null,
        full_name: item.full_name || '',
        // Additional fields from Safilo processor
        temple_length: item.temple_length || null,
        full_size: item.full_size || null,
        wholesale_price: item.wholesale_price || null,
        upc: item.upc || null,
        in_stock: item.in_stock || null,
        api_verified: item.api_verified || null,
        color_code: item.color_code || null,
        color_name: item.color_name || null,
        
        // Enhanced fields from SafiloService
        ean: item.ean || null,
        msrp: item.msrp || null,
        availability: item.availability || null,
        material: item.material || null,
        country_of_origin: item.country_of_origin || null,
        confidence_score: item.confidence_score || null,
        validation_reason: item.validation_reason || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      inventory.push(newItem);
      changesCount++;
    });
    
    writeJsonFile(inventoryFile, inventory);
    return { success: true, changes: changesCount };
  } catch (err) {
    console.error('Error saving inventory items:', err);
    throw err;
  }
}

// Delete inventory item
function deleteInventoryItem(accountId, itemId) {
  try {
    const inventory = readJsonFile(inventoryFile, []);
    const itemIndex = inventory.findIndex(
      item => item.account_id === parseInt(accountId) && item.id === itemId
    );
    
    if (itemIndex >= 0) {
      inventory.splice(itemIndex, 1);
      writeJsonFile(inventoryFile, inventory);
      return { success: true };
    }
    
    return { success: false, error: 'Item not found' };
  } catch (err) {
    console.error('Error deleting inventory item:', err);
    throw err;
  }
}

// Delete email
function deleteEmail(accountId, emailId) {
  try {
    const emails = readJsonFile(emailsFile, []);
    const emailIndex = emails.findIndex(
      email => email.account_id === parseInt(accountId) && email.id === emailId
    );
    
    if (emailIndex >= 0) {
      emails.splice(emailIndex, 1);
      writeJsonFile(emailsFile, emails);
      return { success: true };
    }
    
    return { success: false, error: 'Email not found' };
  } catch (err) {
    console.error('Error deleting email:', err);
    throw err;
  }
}

// Update inventory item status
function updateInventoryStatus(accountId, itemId, newStatus) {
  try {
    const inventory = readJsonFile(inventoryFile, []);
    const itemIndex = inventory.findIndex(
      item => item.account_id === parseInt(accountId) && item.id === itemId
    );
    
    if (itemIndex >= 0) {
      inventory[itemIndex] = {
        ...inventory[itemIndex],
        status: newStatus,
        updated_at: new Date().toISOString()
      };
      writeJsonFile(inventoryFile, inventory);
      return { success: true, item: inventory[itemIndex] };
    }
    
    return { success: false, error: 'Item not found' };
  } catch (err) {
    console.error('Error updating inventory status:', err);
    throw err;
  }
}

// Confirm all pending items for a specific order with optional web enrichment
async function confirmPendingOrder(accountId, orderNumber) {
  try {
    const inventory = readJsonFile(inventoryFile, []);
    const orders = readJsonFile(ordersFile, []);
    let updatedCount = 0;
    let orderItems = [];
    let orderDetails = null;
    let pendingItems = [];
    
    // Find all pending items for this order and collect details
    inventory.forEach(item => {
      if (
        item.account_id === parseInt(accountId) && 
        item.order_number === orderNumber && 
        item.status === 'pending'
      ) {
        pendingItems.push(item);
        
        // Collect order details from first item
        if (!orderDetails) {
          orderDetails = {
            order_number: orderNumber,
            vendor: item.vendor,
            email_id: item.email_id
          };
        }
      }
    });
    
    if (pendingItems.length === 0) {
      return { success: false, error: 'No pending items found for this order' };
    }
    
    console.log(`📦 Confirming ${pendingItems.length} items for order ${orderNumber}`);
    console.log(`🏢 Vendor: ${orderDetails.vendor}`);
    
    // Apply web enrichment for Modern Optical orders
    let enrichedItems = pendingItems;
    if (orderDetails.vendor === 'Modern Optical') {
      try {
        console.log('🌐 Applying Modern Optical web enrichment...');
        const parserRegistry = require('../parsers');
        const modernOpticalService = parserRegistry.getModernOpticalService();
        
        // Enrich items with web data
        enrichedItems = await modernOpticalService.enrichPendingItems(pendingItems);
        console.log(`✅ Web enrichment completed for ${enrichedItems.length} items`);
        
      } catch (enrichmentError) {
        console.error('⚠️ Web enrichment failed, proceeding without enrichment:', enrichmentError.message);
        // Continue with original items if enrichment fails
        enrichedItems = pendingItems;
      }
    }
    
    // Update inventory items with enriched data and change status to current
    enrichedItems.forEach(enrichedItem => {
      const inventoryIndex = inventory.findIndex(item => 
        item.id === enrichedItem.id
      );
      
      if (inventoryIndex >= 0) {
        // Merge enriched data with existing item
        inventory[inventoryIndex] = {
          ...inventory[inventoryIndex],
          ...enrichedItem,
          status: 'current',
          updated_at: new Date().toISOString()
        };
        
        updatedCount++;
        orderItems.push({
          id: enrichedItem.id,
          sku: enrichedItem.sku,
          brand: enrichedItem.brand,
          model: enrichedItem.model,
          color: enrichedItem.color,
          size: enrichedItem.size,
          quantity: enrichedItem.quantity,
          vendor: enrichedItem.vendor
        });
      }
    });
    
    if (updatedCount > 0) {
      writeJsonFile(inventoryFile, inventory);
      
      // Create order record
      const newOrder = {
        id: orders.length + 1,
        account_id: parseInt(accountId),
        order_number: orderNumber,
        vendor: orderDetails.vendor,
        email_id: orderDetails.email_id,
        total_items: updatedCount,
        items: orderItems,
        confirmed_at: new Date().toISOString(),
        status: 'confirmed'
      };
      
      // Get additional order details from the related email if available
      const emails = readJsonFile(emailsFile, []);
      const relatedEmail = emails.find(email => email.id === orderDetails.email_id);
      if (relatedEmail && relatedEmail.parsed_data) {
        newOrder.customer_name = relatedEmail.parsed_data.order?.customer_name;
        newOrder.account_number = relatedEmail.parsed_data.order?.account_number;
        newOrder.rep_name = relatedEmail.parsed_data.order?.rep_name;
        newOrder.order_date = relatedEmail.parsed_data.order?.order_date;
      }
      
      orders.push(newOrder);
      writeJsonFile(ordersFile, orders);
      
      console.log(`✅ Order ${orderNumber} confirmed with ${updatedCount} items`);
      
      return { success: true, updatedCount, orderId: newOrder.id };
    }
    
    return { success: false, error: 'Failed to update inventory items' };
  } catch (err) {
    console.error('Error confirming pending order:', err);
    throw err;
  }
}

// Archive inventory item
function archiveInventoryItem(accountId, itemId) {
  return updateInventoryStatus(accountId, itemId, 'archived');
}

// Restore inventory item from archive
function restoreInventoryItem(accountId, itemId) {
  return updateInventoryStatus(accountId, itemId, 'current');
}

// Archive all inventory items by brand and vendor
function archiveAllItemsByBrand(accountId, brandName, vendorName) {
  try {
    const inventory = readJsonFile(inventoryFile, []);
    let archivedCount = 0;
    
    inventory.forEach(item => {
      if (
        item.account_id === parseInt(accountId) && 
        item.brand === brandName &&
        item.vendor === vendorName &&
        item.status === 'current'
      ) {
        item.status = 'archived';
        item.updated_at = new Date().toISOString();
        archivedCount++;
      }
    });
    
    if (archivedCount > 0) {
      writeJsonFile(inventoryFile, inventory);
      return { success: true, archivedCount };
    }
    
    return { success: false, error: 'No current items found for this brand' };
  } catch (err) {
    console.error('Error archiving items by brand:', err);
    throw err;
  }
}

// Delete all archived items by brand and vendor
function deleteArchivedItemsByBrand(accountId, brandName, vendorName) {
  try {
    const inventory = readJsonFile(inventoryFile, []);
    const originalLength = inventory.length;
    
    // Filter out archived items for this brand/vendor
    const filteredInventory = inventory.filter(item => !(
      item.account_id === parseInt(accountId) && 
      item.brand === brandName &&
      item.vendor === vendorName &&
      item.status === 'archived'
    ));
    
    const deletedCount = originalLength - filteredInventory.length;
    
    if (deletedCount > 0) {
      writeJsonFile(inventoryFile, filteredInventory);
      return { success: true, deletedCount };
    }
    
    return { success: false, error: 'No archived items found for this brand' };
  } catch (err) {
    console.error('Error deleting archived items by brand:', err);
    throw err;
  }
}

// Delete all archived items by vendor
function deleteArchivedItemsByVendor(accountId, vendorName) {
  try {
    const inventory = readJsonFile(inventoryFile, []);
    const originalLength = inventory.length;
    
    // Filter out archived items for this vendor
    const filteredInventory = inventory.filter(item => !(
      item.account_id === parseInt(accountId) && 
      item.vendor === vendorName &&
      item.status === 'archived'
    ));
    
    const deletedCount = originalLength - filteredInventory.length;
    
    if (deletedCount > 0) {
      writeJsonFile(inventoryFile, filteredInventory);
      return { success: true, deletedCount };
    }
    
    return { success: false, error: 'No archived items found for this vendor' };
  } catch (err) {
    console.error('Error deleting archived items by vendor:', err);
    throw err;
  }
}

// Mark inventory item as sold
function markInventoryItemAsSold(accountId, itemId) {
  return updateInventoryStatus(accountId, itemId, 'sold');
}

// Get all confirmed orders for an account
function getOrdersByAccount(accountId) {
  try {
    const orders = readJsonFile(ordersFile, []);
    return orders.filter(order => order.account_id === parseInt(accountId));
  } catch (err) {
    console.error('Error fetching orders:', err);
    throw err;
  }
}

// Get a specific order by ID
function getOrderById(accountId, orderId) {
  try {
    const orders = readJsonFile(ordersFile, []);
    const order = orders.find(order => 
      order.account_id === parseInt(accountId) && 
      order.id === parseInt(orderId)
    );
    
    if (order) {
      return { success: true, order };
    }
    
    return { success: false, error: 'Order not found' };
  } catch (err) {
    console.error('Error fetching order:', err);
    throw err;
  }
}

// Archive an order
function archiveOrder(accountId, orderId) {
  try {
    const orders = readJsonFile(ordersFile, []);
    const orderIndex = orders.findIndex(order => 
      order.account_id === parseInt(accountId) && 
      order.id === parseInt(orderId)
    );
    
    if (orderIndex >= 0) {
      orders[orderIndex] = {
        ...orders[orderIndex],
        status: 'archived',
        archived_at: new Date().toISOString()
      };
      writeJsonFile(ordersFile, orders);
      return { success: true, order: orders[orderIndex] };
    }
    
    return { success: false, error: 'Order not found' };
  } catch (err) {
    console.error('Error archiving order:', err);
    throw err;
  }
}

// Delete an order (only if archived)
function deleteOrder(accountId, orderId) {
  try {
    const orders = readJsonFile(ordersFile, []);
    const orderIndex = orders.findIndex(order => 
      order.account_id === parseInt(accountId) && 
      order.id === parseInt(orderId)
    );
    
    if (orderIndex >= 0) {
      const order = orders[orderIndex];
      
      // Only allow deletion of archived orders
      if (order.status !== 'archived') {
        return { success: false, error: 'Only archived orders can be deleted' };
      }
      
      orders.splice(orderIndex, 1);
      writeJsonFile(ordersFile, orders);
      return { success: true };
    }
    
    return { success: false, error: 'Order not found' };
  } catch (err) {
    console.error('Error deleting order:', err);
    throw err;
  }
}

// Check for duplicate order by order number, customer, and account number
function checkDuplicateOrder(accountId, orderNumber, customerName, accountNumber) {
  try {
    const inventory = readJsonFile(inventoryFile, []);
    
    // Look for existing order with same details
    const existingOrder = inventory.find(item => 
      item.account_id === parseInt(accountId) && 
      item.order_number === orderNumber &&
      item.vendor === 'Modern Optical' // For now, focus on Modern Optical
    );
    
    if (existingOrder) {
      return { 
        isDuplicate: true, 
        message: `Order ${orderNumber} already exists in inventory`,
        existingOrderId: existingOrder.id
      };
    }
    
    return { isDuplicate: false };
    
  } catch (err) {
    console.error('Error checking duplicate order:', err);
    return { isDuplicate: false, error: err.message };
  }
}

// Close database connection (no-op for JSON files)
function closeDatabase() {
  console.log('Database closed (JSON files)');
}

// Export a dummy db object for compatibility
const db = {
  close: closeDatabase
};

module.exports = {
  db,
  initializeDatabase,
  getAccounts,
  getAccountById,
  getAccountByEmail,
  saveEmail,
  getEmailsByAccount,
  updateEmailWithParsedData,
  saveInventoryItems,
  deleteInventoryItem,
  deleteEmail,
  upsertInventory,
  getInventoryByAccount,
  closeDatabase,
  updateInventoryStatus,
  confirmPendingOrder,
  archiveInventoryItem,
  restoreInventoryItem,
  archiveAllItemsByBrand,
  deleteArchivedItemsByBrand,
  deleteArchivedItemsByVendor,
  markInventoryItemAsSold,
  getOrdersByAccount,
  getOrderById,
  archiveOrder,
  deleteOrder,
  checkDuplicateOrder
};
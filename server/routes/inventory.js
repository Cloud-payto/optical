const express = require('express');
const router = express.Router();
const { inventoryOperations, orderOperations, emailOperations, checkDuplicateOrder, supabase } = require('../lib/supabase');
const parserRegistry = require('../parsers');

/**
 * POST /api/inventory/bulk-add
 * Add parsed order and items to database
 *
 * Body: {
 *   accountId: string (UUID),
 *   vendor: string,
 *   order: { order_number, customer_name, order_date, etc. },
 *   items: [ { sku, brand, model, color, quantity, etc. } ],
 *   emailId?: number (optional - for tracking which email this came from)
 * }
 */
router.post('/bulk-add', async (req, res) => {
  try {
    const { accountId, vendor, order, items, emailId } = req.body;


    // Validate required fields
    if (!accountId || !vendor || !order || !items || items.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: accountId, vendor, order, and items are required'
      });
    }

    // Validate account exists
    const { data: accountExists, error: accountError } = await supabase
      .from('accounts')
      .select('id')
      .eq('id', accountId)
      .single();

    if (accountError || !accountExists) {
      console.error(`Unknown account: ${accountId}`, accountError);
      return res.status(404).json({
        success: false,
        error: `Account not found: ${accountId}`
      });
    }

    // Look up vendor UUID by name
    let vendorId = null;
    if (vendor) {
      const { data: vendorData, error: vendorError } = await supabase
        .from('vendors')
        .select('id')
        .ilike('name', vendor)
        .single();

      if (vendorData && !vendorError) {
        vendorId = vendorData.id;
        console.log(`✓ Found vendor ID: ${vendorId} for ${vendor}`);

        // NOTE: Vendor is NOT auto-added to account_vendors here
        // User must explicitly import via "Import from Inventory" button
        // We just track the vendor_id for inventory records
        if (order.account_number) {
          console.log(`ℹ️  Vendor account #${order.account_number} detected for ${vendor} (not auto-added to account)`);
        }
      } else {
        console.warn(`Vendor '${vendor}' not found in vendors table`);
      }
    }

    // Check for duplicate order
    const orderNumber = order.order_number;
    if (orderNumber) {
      const duplicateCheck = await checkDuplicateOrder(orderNumber, accountId);
      console.log('Duplicate check result:', duplicateCheck);

      if (duplicateCheck) {
        console.log(`Duplicate order detected: ${orderNumber}`);
        return res.status(409).json({
          success: false,
          error: 'Duplicate order',
          message: `Order ${orderNumber} already exists for this account`
        });
      }
    }

    // Create order record first
    let orderId = null;
    try {
      const orderRecord = await orderOperations.saveOrder({
        account_id: accountId,
        vendor_id: vendorId,
        email_id: emailId || null,
        order_number: order.order_number,
        reference_number: order.reference_number || null,
        account_number: order.account_number || null,
        customer_name: order.customer_name || null,
        customer_code: order.customer_code || null,
        placed_by: order.placed_by || order.rep_name || null,
        order_date: order.order_date || null,
        total_pieces: order.total_pieces || items.length,
        status: 'pending'
      });
      orderId = orderRecord.id;
      console.log(`✓ Created order record with ID: ${orderId}`);
    } catch (orderError) {
      console.error('Failed to create order record:', orderError);
      return res.status(500).json({
        success: false,
        error: 'Failed to create order record',
        message: orderError.message
      });
    }

    // Prepare inventory items with "pending" status and link to order
    const inventoryItems = items.map(item => ({
      account_id: accountId,
      order_id: orderId,
      sku: item.sku,
      brand: item.brand,
      model: item.model,
      color: item.color,
      color_code: item.color_code || null,
      color_name: item.color_name || null,
      size: item.size || null,
      full_size: item.full_size || null,
      temple_length: item.temple_length || null,
      quantity: item.quantity || 1,
      vendor_id: vendorId,
      status: 'pending',
      email_id: emailId || null,
      wholesale_price: item.wholesale_price || null,
      upc: item.upc || null,
      in_stock: item.in_stock || null,
      api_verified: item.api_verified || false,
      enriched_data: item.enriched_data || {
        order_number: order.order_number,
        order: order
      }
    }));

    // Save inventory items
    try {
      const savedItems = await inventoryOperations.saveInventoryItems(inventoryItems);
      console.log(`✓ Saved ${savedItems.length} inventory items`);

      return res.status(201).json({
        success: true,
        message: `Successfully added order ${orderNumber} with ${savedItems.length} items`,
        orderId: orderId,
        itemsCount: savedItems.length,
        items: savedItems
      });
    } catch (inventoryError) {
      console.error('Failed to save inventory items:', inventoryError);

      // Try to clean up the order record if items failed to save
      try {
        await supabase.from('orders').delete().eq('id', orderId);
        console.log('✓ Rolled back order record');
      } catch (rollbackError) {
        console.error('Failed to rollback order:', rollbackError);
      }

      return res.status(500).json({
        success: false,
        error: 'Failed to save inventory items',
        message: inventoryError.message
      });
    }

  } catch (error) {
    console.error('[BULK-ADD] Error:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message
    });
  }
});

// GET /api/inventory/:userId - Get inventory for a user
router.get('/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const inventory = await inventoryOperations.getInventoryByAccount(userId);
    
    res.json({
      success: true,
      count: inventory.length,
      inventory: inventory
    });
  } catch (error) {
    console.error('Error fetching inventory:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// POST /api/inventory/:accountId - Add or update inventory item
router.post('/:accountId', (req, res) => {
  try {
    const { accountId } = req.params;
    const { sku, quantity, vendor } = req.body;
    
    if (!sku || quantity === undefined) {
      return res.status(400).json({
        success: false,
        error: 'SKU and quantity are required'
      });
    }
    
    const result = upsertInventory(accountId, sku, quantity, vendor || '');
    
    res.json({
      success: true,
      ...result
    });
  } catch (error) {
    console.error('Error updating inventory:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// DELETE /api/inventory/:userId/:itemId - Delete inventory item
router.delete('/:userId/:itemId', async (req, res) => {
  try {
    const { userId, itemId } = req.params;
    
    await inventoryOperations.deleteInventoryItem(itemId, userId);
    
    res.json({
      success: true,
      message: 'Inventory item deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting inventory item:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// POST /api/inventory/:userId/confirm/:orderNumber - Confirm pending order items
router.post('/:userId/confirm/:orderNumber', async (req, res) => {
  try {
    const { userId, orderNumber } = req.params;

    console.log(`📦 Confirming order ${orderNumber} for user ${userId}`);

    const result = await inventoryOperations.confirmPendingOrder(orderNumber, userId);

    if (result && result.success) {
      res.json({
        success: true,
        message: `Confirmed ${result.updatedCount} items with enrichment`,
        updatedCount: result.updatedCount
      });
    } else {
      res.status(200).json({
        success: false,
        error: result?.error || result?.message || 'Order not found or no pending items'
      });
    }
  } catch (error) {
    console.error('Error confirming pending order:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// PUT /api/inventory/:userId/:itemId/archive - Archive inventory item
router.put('/:userId/:itemId/archive', async (req, res) => {
  try {
    const { userId, itemId } = req.params;

    const item = await inventoryOperations.archiveInventoryItem(itemId, userId);
    
    res.json({
      success: true,
      message: 'Item archived successfully',
      item: item
    });
  } catch (error) {
    console.error('Error archiving inventory item:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// PUT /api/inventory/:accountId/:itemId/restore - Restore inventory item from archive
router.put('/:accountId/:itemId/restore', (req, res) => {
  try {
    const { accountId, itemId } = req.params;

    const result = restoreInventoryItem(accountId, itemId);
    
    if (result.success) {
      res.json({
        success: true,
        message: 'Item restored successfully',
        item: result.item
      });
    } else {
      res.status(404).json({
        success: false,
        error: result.error
      });
    }
  } catch (error) {
    console.error('Error restoring inventory item:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// PUT /api/inventory/:accountId/archive-brand - Archive all items by brand
router.put('/:accountId/archive-brand', async (req, res) => {
  try {
    const { accountId } = req.params;
    const { brandName, vendorName } = req.body;

    if (!brandName || !vendorName) {
      return res.status(400).json({
        success: false,
        error: 'Brand name and vendor name are required'
      });
    }

    const result = await inventoryOperations.archiveAllItemsByBrand(accountId, brandName, vendorName);

    if (result.success) {
      res.json({
        success: true,
        message: `Archived ${result.archivedCount} items from ${brandName}`,
        archivedCount: result.archivedCount
      });
    } else {
      res.status(404).json({
        success: false,
        error: result.error
      });
    }
  } catch (error) {
    console.error('Error archiving items by brand:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// POST /api/inventory/:accountId/test-enrichment - Test Modern Optical web enrichment
router.post('/:accountId/test-enrichment', async (req, res) => {
  try {
    const { brand, model } = req.body;
    
    if (!brand || !model) {
      return res.status(400).json({
        success: false,
        error: 'Brand and model are required'
      });
    }
    
    console.log(`🧪 Testing Modern Optical enrichment for: ${brand} - ${model}`);
    
    const modernOpticalService = parserRegistry.getModernOpticalService();
    const webData = await modernOpticalService.webService.scrapeProduct(brand, model);
    
    res.json({
      success: true,
      message: `Enrichment test completed for ${brand} - ${model}`,
      webData: webData,
      found: webData.found,
      variants: webData.variants?.length || 0
    });
    
  } catch (error) {
    console.error('Error testing enrichment:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// DELETE /api/inventory/:accountId/delete-archived-brand - Delete all archived items by brand
router.delete('/:accountId/delete-archived-brand', async (req, res) => {
  try {
    const { accountId } = req.params;
    const { brandName, vendorName } = req.body;

    if (!brandName || !vendorName) {
      return res.status(400).json({
        success: false,
        error: 'Brand name and vendor name are required'
      });
    }

    const result = await inventoryOperations.deleteArchivedItemsByBrand(accountId, brandName, vendorName);

    if (result.success) {
      res.json({
        success: true,
        message: `Deleted ${result.deletedCount} archived items from ${brandName}`,
        deletedCount: result.deletedCount
      });
    } else {
      res.status(404).json({
        success: false,
        error: result.error
      });
    }
  } catch (error) {
    console.error('Error deleting archived items by brand:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// DELETE /api/inventory/:accountId/delete-archived-vendor - Delete all archived items by vendor
router.delete('/:accountId/delete-archived-vendor', async (req, res) => {
  try {
    const { accountId } = req.params;
    const { vendorName } = req.body;

    if (!vendorName) {
      return res.status(400).json({
        success: false,
        error: 'Vendor name is required'
      });
    }

    const result = await inventoryOperations.deleteArchivedItemsByVendor(accountId, vendorName);

    if (result.success) {
      res.json({
        success: true,
        message: `Deleted ${result.deletedCount} archived items from ${vendorName}`,
        deletedCount: result.deletedCount
      });
    } else {
      res.status(404).json({
        success: false,
        error: result.error
      });
    }
  } catch (error) {
    console.error('Error deleting archived items by vendor:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// PUT /api/inventory/:accountId/:itemId/sold - Mark item as sold
router.put('/:accountId/:itemId/sold', async (req, res) => {
  try {
    const { accountId, itemId } = req.params;

    const result = await inventoryOperations.markInventoryItemAsSold(itemId, accountId);

    if (result.success) {
      res.json({
        success: true,
        message: 'Item marked as sold',
        item: result.item
      });
    } else {
      res.status(404).json({
        success: false,
        error: result.error
      });
    }
  } catch (error) {
    console.error('Error marking item as sold:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;
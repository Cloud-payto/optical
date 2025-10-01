const express = require('express');
const router = express.Router();
const { inventoryOperations } = require('../lib/supabase');
const parserRegistry = require('../parsers');

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
    
    if (result.success) {
      res.json({
        success: true,
        message: `Confirmed ${result.updatedCount} items with enrichment`,
        updatedCount: result.updatedCount
      });
    } else {
      res.status(404).json({
        success: false,
        error: result.error
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
router.put('/:accountId/archive-brand', (req, res) => {
  try {
    const { accountId } = req.params;
    const { brandName, vendorName } = req.body;
    
    if (!brandName || !vendorName) {
      return res.status(400).json({
        success: false,
        error: 'Brand name and vendor name are required'
      });
    }
    
    const result = archiveAllItemsByBrand(accountId, brandName, vendorName);
    
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
router.delete('/:accountId/delete-archived-brand', (req, res) => {
  try {
    const { accountId } = req.params;
    const { brandName, vendorName } = req.body;
    
    if (!brandName || !vendorName) {
      return res.status(400).json({
        success: false,
        error: 'Brand name and vendor name are required'
      });
    }
    
    const result = deleteArchivedItemsByBrand(accountId, brandName, vendorName);
    
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
router.delete('/:accountId/delete-archived-vendor', (req, res) => {
  try {
    const { accountId } = req.params;
    const { vendorName } = req.body;
    
    if (!vendorName) {
      return res.status(400).json({
        success: false,
        error: 'Vendor name is required'
      });
    }
    
    const result = deleteArchivedItemsByVendor(accountId, vendorName);
    
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
const express = require('express');
const router = express.Router();
const { orderOperations } = require('../lib/supabase');

// GET /api/orders/:accountId - Get all orders for an account
router.get('/:accountId', async (req, res) => {
  try {
    const { accountId } = req.params;
    const orders = await orderOperations.getOrdersByAccount(parseInt(accountId));
    
    res.json({
      success: true,
      count: orders.length,
      orders: orders
    });
  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// GET /api/orders/:accountId/:orderId - Get a specific order
router.get('/:accountId/:orderId', async (req, res) => {
  try {
    const { accountId, orderId } = req.params;
    const order = await orderOperations.getOrderById(parseInt(orderId), parseInt(accountId));
    
    res.json({
      success: true,
      order: order
    });
  } catch (error) {
    console.error('Error fetching order:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// PUT /api/orders/:accountId/:orderId/archive - Archive an order
router.put('/:accountId/:orderId/archive', async (req, res) => {
  try {
    const { accountId, orderId } = req.params;
    const order = await orderOperations.archiveOrder(parseInt(orderId), parseInt(accountId));
    
    res.json({
      success: true,
      message: 'Order archived successfully',
      order: order
    });
  } catch (error) {
    console.error('Error archiving order:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// DELETE /api/orders/:accountId/:orderId - Delete an archived order
router.delete('/:accountId/:orderId', (req, res) => {
  try {
    const { accountId, orderId } = req.params;
    const result = deleteOrder(accountId, parseInt(orderId));
    
    if (result.success) {
      res.json({
        success: true,
        message: 'Order deleted successfully'
      });
    } else {
      res.status(400).json({
        success: false,
        error: result.error
      });
    }
  } catch (error) {
    console.error('Error deleting order:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;
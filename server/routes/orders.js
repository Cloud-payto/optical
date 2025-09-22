const express = require('express');
const router = express.Router();
const { 
  getOrdersByAccount, 
  getOrderById,
  archiveOrder,
  deleteOrder
} = require('../db/database');

// GET /api/orders/:accountId - Get all orders for an account
router.get('/:accountId', (req, res) => {
  try {
    const { accountId } = req.params;
    const orders = getOrdersByAccount(accountId);
    
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
router.get('/:accountId/:orderId', (req, res) => {
  try {
    const { accountId, orderId } = req.params;
    const result = getOrderById(accountId, parseInt(orderId));
    
    if (result.success) {
      res.json({
        success: true,
        order: result.order
      });
    } else {
      res.status(404).json({
        success: false,
        error: result.error
      });
    }
  } catch (error) {
    console.error('Error fetching order:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// PUT /api/orders/:accountId/:orderId/archive - Archive an order
router.put('/:accountId/:orderId/archive', (req, res) => {
  try {
    const { accountId, orderId } = req.params;
    const result = archiveOrder(accountId, parseInt(orderId));
    
    if (result.success) {
      res.json({
        success: true,
        message: 'Order archived successfully',
        order: result.order
      });
    } else {
      res.status(404).json({
        success: false,
        error: result.error
      });
    }
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
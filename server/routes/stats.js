const express = require('express');
const router = express.Router();
const { statsOperations } = require('../lib/supabase');
const { extractQueryParams } = require('../lib/queryBuilder');
const { getAllowedSortColumns } = require('../utils/sortingConfig');

// GET /api/stats/:userId - Get dashboard stats for a user
router.get('/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const stats = await statsOperations.getDashboardStats(userId);

    res.json({
      success: true,
      stats: stats
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// GET /api/stats/:userId/inventory-by-vendor - Get inventory grouped by vendor and brand
router.get('/:userId/inventory-by-vendor', async (req, res) => {
  try {
    const { userId } = req.params;

    // Extract query parameters for sorting/pagination
    const queryParams = extractQueryParams(req);
    const allowedColumns = getAllowedSortColumns('dashboard');

    const result = await statsOperations.getInventoryByVendorAndBrand(
      userId,
      {
        ...queryParams,
        allowedColumns
      }
    );

    res.json({
      success: true,
      vendors: result.vendors,
      pagination: result.pagination
    });
  } catch (error) {
    console.error('Error fetching inventory by vendor:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;

const express = require('express');
const router = express.Router();
const { vendorOperations } = require('../lib/supabase');

// Get all vendors
router.get('/', async (req, res) => {
  try {
    const vendors = await vendorOperations.getAllVendors();
    res.json(vendors);
  } catch (error) {
    console.error('Error fetching vendors:', error);
    res.status(500).json({ error: 'Failed to fetch vendors' });
  }
});

// Get vendor by ID
router.get('/:vendorId', async (req, res) => {
  try {
    const { vendorId } = req.params;
    const vendor = await vendorOperations.getVendorById(vendorId);
    res.json(vendor);
  } catch (error) {
    console.error('Error fetching vendor:', error);
    res.status(500).json({ error: 'Failed to fetch vendor' });
  }
});

// Get all brands
router.get('/brands/all', async (req, res) => {
  try {
    const brands = await vendorOperations.getAllBrands();
    res.json(brands);
  } catch (error) {
    console.error('Error fetching brands:', error);
    res.status(500).json({ error: 'Failed to fetch brands' });
  }
});

// Get brands by vendor
router.get('/:vendorId/brands', async (req, res) => {
  try {
    const { vendorId } = req.params;
    const brands = await vendorOperations.getBrandsByVendor(vendorId);
    res.json(brands);
  } catch (error) {
    console.error('Error fetching vendor brands:', error);
    res.status(500).json({ error: 'Failed to fetch vendor brands' });
  }
});

// Get user-specific vendor pricing
router.get('/pricing/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const pricing = await vendorOperations.getUserVendorPricing(userId);
    res.json(pricing);
  } catch (error) {
    console.error('Error fetching user vendor pricing:', error);
    res.status(500).json({ error: 'Failed to fetch vendor pricing' });
  }
});

// Save user-specific vendor pricing
router.post('/pricing/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const pricingData = req.body;
    const result = await vendorOperations.saveUserVendorPricing(userId, pricingData);
    res.json(result);
  } catch (error) {
    console.error('Error saving user vendor pricing:', error);
    res.status(500).json({ error: 'Failed to save vendor pricing' });
  }
});

// Get vendors with user pricing (for BrandsCostsPage)
router.get('/companies/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const vendorsWithPricing = await vendorOperations.getVendorsWithUserPricing(userId);
    res.json(vendorsWithPricing);
  } catch (error) {
    console.error('Error fetching vendors with pricing:', error);
    res.status(500).json({ error: 'Failed to fetch vendors with pricing' });
  }
});

module.exports = router;
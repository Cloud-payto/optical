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

// Get all brands (BEFORE /:vendorId to avoid conflict)
router.get('/brands/all', async (req, res) => {
  try {
    const brands = await vendorOperations.getAllBrands();
    res.json(brands);
  } catch (error) {
    console.error('Error fetching brands:', error);
    res.status(500).json({ error: 'Failed to fetch brands' });
  }
});

// Get user-specific account brands (BEFORE /:vendorId to avoid conflict)
router.get('/pricing/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const accountBrands = await vendorOperations.getAccountBrands(userId);
    res.json(accountBrands);
  } catch (error) {
    console.error('Error fetching account brands:', error);
    res.status(500).json({ error: 'Failed to fetch account brands' });
  }
});

// Get vendors with user pricing (BEFORE /:vendorId to avoid conflict)
router.get('/companies/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const vendorsWithAccountBrands = await vendorOperations.getVendorsWithAccountBrands(userId);

    // Transform vendors to Company format expected by frontend
    const companies = vendorsWithAccountBrands.map(vendor => ({
      id: vendor.id,
      name: vendor.name,
      brands: (vendor.brands || []).map(brand => ({
        id: brand.id,
        name: brand.name,
        wholesaleCost: brand.wholesale_cost || 0,
        yourCost: brand.effective_wholesale_cost || brand.wholesale_cost || 0,
        tariffTax: brand.account_brand?.tariff_tax || 0,
        retailPrice: brand.msrp || 0,
        notes: brand.notes || brand.account_brand?.notes || ''
      })),
      contactInfo: {
        companyEmail: '',
        companyPhone: '',
        supportEmail: '',
        supportPhone: '',
        website: vendor.domain || '',
        repName: '',
        repEmail: '',
        repPhone: ''
      }
    }));

    res.json(companies);
  } catch (error) {
    console.error('Error fetching vendors with pricing:', error);
    res.status(500).json({ error: 'Failed to fetch vendors with pricing' });
  }
});

// Get missing vendors for a user (BEFORE /:vendorId to avoid conflict)
router.get('/missing/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const missingVendors = await vendorOperations.getMissingVendorsForUser(userId);
    res.json(missingVendors);
  } catch (error) {
    console.error('Error fetching missing vendors:', error);
    res.status(500).json({ error: 'Failed to fetch missing vendors' });
  }
});

// Get missing brands for a specific vendor (BEFORE /:vendorId to avoid conflict)
router.get('/missing/:userId/:vendorId/brands', async (req, res) => {
  try {
    const { userId, vendorId } = req.params;
    console.log('🔍 GET /missing/:userId/:vendorId/brands called with:', { userId, vendorId });

    const missingBrands = await vendorOperations.getMissingBrandsForVendor(userId, vendorId);
    console.log(`✅ Found ${missingBrands?.length || 0} missing brands for vendor ${vendorId}`);

    res.json(missingBrands);
  } catch (error) {
    console.error('❌ Error fetching missing brands:', error);
    res.status(500).json({ error: 'Failed to fetch missing brands', details: error.message });
  }
});

// Get vendor by ID (AFTER specific routes)
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

// Get brands by vendor (AFTER specific routes)
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

// Save account-specific brand data
router.post('/pricing/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const brandData = {
      ...req.body,
      brand_name: req.body.brand_name, // Ensure this is passed for new brands
    };

    console.log('🔥 DEBUG: POST /pricing/:userId called');
    console.log('🔥 DEBUG: Account ID (userId):', userId);
    console.log('🔥 DEBUG: Received from frontend:', brandData);

    // Validate required fields - either brand_id (existing) OR brand_name (new) + vendor_id
    if ((!brandData.brand_id && !brandData.brand_name) || !brandData.vendor_id) {
      console.log('🔥 DEBUG: Missing required fields');
      return res.status(400).json({
        error: 'Missing required fields: (brand_id OR brand_name) AND vendor_id are required'
      });
    }

    console.log('🔥 DEBUG: Calling saveAccountBrand with userId:', userId, 'brandData:', brandData);

    const result = await vendorOperations.saveAccountBrand(userId, brandData);

    console.log('🔥 DEBUG: saveAccountBrand result:', result);

    if (result.success) {
      res.json({
        success: true,
        message: 'Account brand data saved successfully',
        data: result
      });
    } else {
      res.status(500).json({
        error: 'Failed to save account brand data',
        details: result
      });
    }
  } catch (error) {
    console.error('Error saving account brand data:', error);
    res.status(500).json({
      error: 'Failed to save account brand data',
      message: error.message,
      details: error.stack
    });
  }
});

// Add multiple account-brand relationships at once
router.post('/account-brands/:userId/bulk', async (req, res) => {
  try {
    const { userId } = req.params;
    const { vendorId, brandIds } = req.body;

    if (!vendorId || !brandIds || !Array.isArray(brandIds)) {
      return res.status(400).json({ error: 'vendorId and brandIds array are required' });
    }

    const result = await vendorOperations.addAccountBrandsBulk(userId, vendorId, brandIds);
    res.json(result);
  } catch (error) {
    console.error('Error adding account brands in bulk:', error);
    res.status(500).json({ error: 'Failed to add account brands' });
  }
});

// GET /api/vendors/pending-imports/:userId - Get vendors/brands from inventory that can be imported
router.get('/pending-imports/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const result = await vendorOperations.getPendingVendorImports(userId);
    res.json(result);
  } catch (error) {
    console.error('Error getting pending vendor imports:', error);
    res.status(500).json({ error: 'Failed to get pending imports' });
  }
});

// POST /api/vendors/import-from-inventory/:userId - Import vendors and brands from inventory
router.post('/import-from-inventory/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { vendorIds, brandData } = req.body;

    const result = await vendorOperations.importVendorsAndBrandsFromInventory(userId, vendorIds, brandData);
    res.json(result);
  } catch (error) {
    console.error('Error importing from inventory:', error);
    res.status(500).json({ error: 'Failed to import from inventory' });
  }
});

// DEBUG: GET /api/vendors/debug-account-vendors/:userId - Check account_vendors for a user
router.get('/debug-account-vendors/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { supabase } = require('../lib/supabase');

    const { data, error } = await supabase
      .from('account_vendors')
      .select('*, vendors(name)')
      .eq('account_id', userId);

    if (error) throw error;

    res.json({
      success: true,
      count: data?.length || 0,
      vendors: data || []
    });
  } catch (error) {
    console.error('Error checking account_vendors:', error);
    res.status(500).json({ error: 'Failed to check account_vendors' });
  }
});

module.exports = router;
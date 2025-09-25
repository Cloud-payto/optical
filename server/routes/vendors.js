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

// Get user-specific account brands
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

// Save account-specific brand data
router.post('/pricing/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const brandData = req.body;
    
    console.log('🔥 DEBUG: POST /pricing/:userId called');
    console.log('🔥 DEBUG: Account ID (userId):', userId);
    console.log('🔥 DEBUG: Received from frontend:', brandData);
    
    // Validate required fields
    if (!brandData.brand_id || !brandData.vendor_id) {
      console.log('🔥 DEBUG: Missing required fields');
      return res.status(400).json({ 
        error: 'Missing required fields: brand_id and vendor_id are required' 
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

// Get vendors with user pricing (for BrandsCostsPage)
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

module.exports = router;
const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client for server-side operations
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.warn('⚠️  Missing Supabase environment variables: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
  console.warn('⚠️  Supabase features will be disabled');
}

// Create Supabase client with service role key for admin access
const supabase = (supabaseUrl && supabaseServiceKey) 
  ? createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })
  : null;

// Helper function to handle Supabase errors
function handleSupabaseError(error, operation) {
  console.error(`Supabase error during ${operation}:`, error);
  throw new Error(`Database operation failed: ${operation}`);
}

// Database operations for emails
const emailOperations = {
  async saveEmail(emailData) {
    try {
      const { data, error } = await supabase
        .from('emails')
        .insert([emailData])
        .select()
        .single();
      
      if (error) throw error;
      return data;
    } catch (error) {
      handleSupabaseError(error, 'saveEmail');
    }
  },

  async getEmailsByAccount(userId) {
    try {
      const { data, error } = await supabase
        .from('emails')
        .select('*')
        .eq('account_id', userId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data || [];
    } catch (error) {
      handleSupabaseError(error, 'getEmailsByAccount');
    }
  },

  async updateEmailWithParsedData(emailId, parsedData) {
    try {
      const { data, error } = await supabase
        .from('emails')
        .update({ 
          parsed_data: parsedData,
          parse_status: 'completed',
          processed_at: new Date().toISOString()
        })
        .eq('id', emailId)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    } catch (error) {
      handleSupabaseError(error, 'updateEmailWithParsedData');
    }
  },

  async deleteEmail(emailId, userId) {
    try {
      const { error } = await supabase
        .from('emails')
        .delete()
        .eq('id', emailId)
        .eq('account_id', userId);
      
      if (error) throw error;
      return { success: true };
    } catch (error) {
      handleSupabaseError(error, 'deleteEmail');
    }
  }
};

// Database operations for inventory
const inventoryOperations = {
  async saveInventoryItems(items) {
    try {
      const { data, error } = await supabase
        .from('inventory')
        .insert(items)
        .select();
      
      if (error) throw error;
      return data;
    } catch (error) {
      handleSupabaseError(error, 'saveInventoryItems');
    }
  },

  async getInventoryByAccount(userId) {
    try {
      const { data, error } = await supabase
        .from('inventory')
        .select('*')
        .eq('account_id', userId)
        .neq('status', 'archived')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data || [];
    } catch (error) {
      handleSupabaseError(error, 'getInventoryByAccount');
    }
  },

  async deleteInventoryItem(itemId, userId) {
    try {
      const { error } = await supabase
        .from('inventory')
        .delete()
        .eq('id', itemId)
        .eq('account_id', userId);
      
      if (error) throw error;
      return { success: true };
    } catch (error) {
      handleSupabaseError(error, 'deleteInventoryItem');
    }
  },

  async archiveInventoryItem(itemId, userId) {
    try {
      const { data, error } = await supabase
        .from('inventory')
        .update({ status: 'archived' })
        .eq('id', itemId)
        .eq('account_id', userId)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    } catch (error) {
      handleSupabaseError(error, 'archiveInventoryItem');
    }
  },

  async confirmPendingOrder(orderNumber, userId) {
    try {
      const { data, error } = await supabase
        .from('inventory')
        .update({ status: 'confirmed' })
        .eq('order_number', orderNumber)
        .eq('account_id', userId)
        .eq('status', 'pending')
        .select();
      
      if (error) throw error;
      return data;
    } catch (error) {
      handleSupabaseError(error, 'confirmPendingOrder');
    }
  }
};

// Database operations for orders
const orderOperations = {
  async getOrdersByAccount(userId) {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          items:inventory(*)
        `)
        .eq('account_id', userId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data || [];
    } catch (error) {
      handleSupabaseError(error, 'getOrdersByAccount');
    }
  },

  async getOrderById(orderId, userId) {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          items:inventory(*)
        `)
        .eq('id', orderId)
        .eq('account_id', userId)
        .single();
      
      if (error) throw error;
      return data;
    } catch (error) {
      handleSupabaseError(error, 'getOrderById');
    }
  },

  async archiveOrder(orderId, userId) {
    try {
      const { data, error } = await supabase
        .from('orders')
        .update({ status: 'archived' })
        .eq('id', orderId)
        .eq('account_id', userId)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    } catch (error) {
      handleSupabaseError(error, 'archiveOrder');
    }
  }
};

// Dashboard stats operations
const statsOperations = {
  async getDashboardStats(userId) {
    try {
      // Get total orders
      const { count: totalOrders } = await supabase
        .from('orders')
        .select('*', { count: 'exact', head: true })
        .eq('account_id', userId);

      // Get total inventory
      const { count: totalInventory } = await supabase
        .from('inventory')
        .select('*', { count: 'exact', head: true })
        .eq('account_id', userId)
        .neq('status', 'archived');

      // Get pending items
      const { count: pendingItems } = await supabase
        .from('inventory')
        .select('*', { count: 'exact', head: true })
        .eq('account_id', userId)
        .eq('status', 'pending');

      // Calculate total value (if wholesale_price exists)
      const { data: inventoryData } = await supabase
        .from('inventory')
        .select('wholesale_price, quantity')
        .eq('account_id', userId)
        .not('wholesale_price', 'is', null);

      const totalValue = (inventoryData || []).reduce((sum, item) => {
        return sum + (item.wholesale_price * item.quantity || 0);
      }, 0);

      return {
        totalOrders: totalOrders || 0,
        totalInventory: totalInventory || 0,
        totalValue: totalValue || 0,
        pendingItems: pendingItems || 0
      };
    } catch (error) {
      handleSupabaseError(error, 'getDashboardStats');
    }
  }
};

// Database operations for vendors and account brands
const vendorOperations = {
  async getAllVendors() {
    try {
      const { data, error } = await supabase
        .from('vendors')
        .select('*')
        .order('name', { ascending: true });
      
      if (error) throw error;
      return data || [];
    } catch (error) {
      handleSupabaseError(error, 'getAllVendors');
    }
  },

  async getVendorById(vendorId) {
    try {
      const { data, error } = await supabase
        .from('vendors')
        .select('*')
        .eq('id', vendorId)
        .single();
      
      if (error) throw error;
      return data;
    } catch (error) {
      handleSupabaseError(error, 'getVendorById');
    }
  },

  async getAllBrands() {
    try {
      const { data, error } = await supabase
        .from('brands')
        .select(`
          *,
          vendor:vendors(name)
        `)
        .order('name', { ascending: true });
      
      if (error) throw error;
      return data || [];
    } catch (error) {
      handleSupabaseError(error, 'getAllBrands');
    }
  },

  async getBrandsByVendor(vendorId) {
    try {
      const { data, error } = await supabase
        .from('brands')
        .select('*')
        .eq('vendor_id', vendorId)
        .order('name', { ascending: true });
      
      if (error) throw error;
      return data || [];
    } catch (error) {
      handleSupabaseError(error, 'getBrandsByVendor');
    }
  },

  async getAccountBrands(userId) {
    try {
      const { data, error } = await supabase
        .from('account_brands')
        .select(`
          *,
          vendor:vendors(*),
          brand:brands(*)
        `)
        .eq('account_id', userId);
      
      if (error) throw error;
      return data || [];
    } catch (error) {
      handleSupabaseError(error, 'getAccountBrands');
    }
  },

  async saveAccountBrand(userId, brandData) {
    try {
      console.log('🔥 DEBUG: saveAccountBrand called');
      console.log('🔥 DEBUG: userId (account_id):', userId);
      console.log('🔥 DEBUG: brandData received:', brandData);
      
      // Separate global brand data from account-specific brand data
      const { brand_id, vendor_id, global_wholesale_cost, msrp, map_price, ...accountBrandData } = brandData;
      
      console.log('🔥 DEBUG: Extracted fields:', {
        brand_id,
        vendor_id,
        global_wholesale_cost,
        msrp,
        map_price,
        accountBrandData
      });
      
      // Start a transaction-like approach using multiple operations
      let globalBrandData = null;
      let accountBrandResult = null;

      // 1. If global pricing is provided, update the global brands table
      if (brand_id && (global_wholesale_cost !== undefined || msrp !== undefined || map_price !== undefined)) {
        console.log('🔥 DEBUG: Updating global brands table');
        const globalBrandUpdateData = {};
        if (global_wholesale_cost !== undefined) globalBrandUpdateData.wholesale_cost = global_wholesale_cost;
        if (msrp !== undefined) globalBrandUpdateData.msrp = msrp;
        if (map_price !== undefined) globalBrandUpdateData.map_price = map_price;
        
        console.log('🔥 DEBUG: Global brand update data:', globalBrandUpdateData);
        
        const { data: brandUpdateResult, error: brandError } = await supabase
          .from('brands')
          .upsert({ 
            id: brand_id,
            vendor_id: vendor_id,
            ...globalBrandUpdateData,
            updated_at: new Date().toISOString()
          })
          .select();
        
        if (brandError) {
          console.error('🔥 DEBUG: Error updating brands table:', brandError);
          throw brandError;
        }
        
        console.log('🔥 DEBUG: Global brand update result:', brandUpdateResult);
        globalBrandData = brandUpdateResult;
      }

      // 2. First, let's verify the brand exists in the brands table
      console.log('🔥 DEBUG: Verifying brand exists in brands table');
      const { data: existingBrand, error: brandCheckError } = await supabase
        .from('brands')
        .select('id, name, vendor_id')
        .eq('id', brand_id)
        .single();
      
      if (brandCheckError) {
        console.log('🔥 DEBUG: Brand check error:', brandCheckError);
        console.log('🔥 DEBUG: Brand does not exist, creating it first');
        
        // Create the brand if it doesn't exist
        const { data: newBrand, error: createBrandError } = await supabase
          .from('brands')
          .insert({
            id: brand_id,
            vendor_id: vendor_id,
            name: `Brand ${brand_id}`, // Temporary name
            wholesale_cost: global_wholesale_cost,
            msrp: msrp,
            map_price: map_price,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .select()
          .single();
          
        if (createBrandError) {
          console.error('🔥 DEBUG: Error creating brand:', createBrandError);
          throw createBrandError;
        }
        console.log('🔥 DEBUG: Created new brand:', newBrand);
      } else {
        console.log('🔥 DEBUG: Brand exists:', existingBrand);
      }

      // 3. Save account-specific brand data to account_brands table
      const accountBrandFields = {
        account_id: userId,
        vendor_id: vendor_id,
        brand_id: brand_id,
        ...accountBrandData,
        updated_at: new Date().toISOString()
      };

      console.log('🔥 DEBUG: Attempting to save to account_brands table:', accountBrandFields);

      const { data: accountUpdateResult, error: accountError } = await supabase
        .from('account_brands')
        .upsert(accountBrandFields)
        .select();
      
      if (accountError) {
        console.error('🔥 DEBUG: Error saving to account_brands table:', accountError);
        throw accountError;
      }
      
      console.log('🔥 DEBUG: Successfully saved to account_brands:', accountUpdateResult);
      accountBrandResult = accountUpdateResult;

      const finalResult = {
        global_brand: globalBrandData,
        account_brand: accountBrandResult,
        success: true
      };

      console.log('🔥 DEBUG: Final result:', finalResult);
      return finalResult;
    } catch (error) {
      console.error('🔥 DEBUG: Error in saveAccountBrand:', error);
      handleSupabaseError(error, 'saveAccountBrand');
    }
  },

  async getVendorsWithAccountBrands(userId) {
    try {
      console.log('Starting getVendorsWithAccountBrands for userId:', userId);
      // Get all vendors with their brands and user-specific pricing
      const { data, error } = await supabase
        .from('vendors')
        .select(`
          id,
          name,
          code,
          domain,
          is_active,
          settings,
          brands!vendor_id(
            id,
            name,
            category,
            tier,
            wholesale_cost,
            msrp,
            map_price,
            is_active,
            notes
          )
        `);
      
      if (error) throw error;
      
      // Get user-specific pricing for each vendor/brand combination
      const vendorIds = data?.map(v => v.id) || [];
      const brandIds = data?.flatMap(v => v.brands?.map(b => b.id) || []) || [];
      
      let accountBrands = [];
      if (vendorIds.length > 0) {
        const { data: accountBrandData, error: accountBrandError } = await supabase
          .from('account_brands')
          .select('*')
          .eq('account_id', userId)
          .in('vendor_id', vendorIds);
        
        if (accountBrandError) throw accountBrandError;
        accountBrands = accountBrandData || [];
      }
      
      // Merge vendor data with user pricing
      const vendorsWithPricing = (data || []).map(vendor => {
        const brandsWithAccountData = (vendor.brands || []).map(brand => {
          const accountBrand = accountBrands.find(ab => 
            ab.vendor_id === vendor.id && ab.brand_id === brand.id
          );
          
          return {
            ...brand,
            // Use COALESCE logic: account wholesale cost OR global brand default
            effective_wholesale_cost: accountBrand?.wholesale_cost || brand.wholesale_cost || 0,
            account_brand: accountBrand
          };
        });
        
        return {
          ...vendor,
          brands: brandsWithAccountData
        };
      });
      
      console.log('Function completed, returning:', vendorsWithPricing?.length, 'vendors');
      return vendorsWithPricing;
    } catch (error) {
      console.error(`Supabase error during getVendorsWithAccountBrands:`, error);
      throw error; // This will be caught by the route handler
    }
  }
};

// Check duplicate order helper
async function checkDuplicateOrder(orderNumber, userId) {
  try {
    const { data, error } = await supabase
      .from('orders')
      .select('id')
      .eq('order_number', orderNumber)
      .eq('account_id', userId)
      .single();
    
    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
      throw error;
    }
    
    return !!data; // Returns true if duplicate found
  } catch (error) {
    handleSupabaseError(error, 'checkDuplicateOrder');
  }
}

module.exports = {
  supabase,
  emailOperations,
  inventoryOperations,
  orderOperations,
  statsOperations,
  vendorOperations,
  checkDuplicateOrder,
  handleSupabaseError
};
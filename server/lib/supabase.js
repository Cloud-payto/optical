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
        .eq('user_id', userId)
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
        .eq('user_id', userId);
      
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
        .eq('user_id', userId)
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
        .eq('user_id', userId);
      
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
        .eq('user_id', userId)
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
        .eq('user_id', userId)
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
        .eq('user_id', userId)
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
        .eq('user_id', userId)
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
        .eq('user_id', userId)
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
        .eq('user_id', userId);

      // Get total inventory
      const { count: totalInventory } = await supabase
        .from('inventory')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .neq('status', 'archived');

      // Get pending items
      const { count: pendingItems } = await supabase
        .from('inventory')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('status', 'pending');

      // Calculate total value (if wholesale_price exists)
      const { data: inventoryData } = await supabase
        .from('inventory')
        .select('wholesale_price, quantity')
        .eq('user_id', userId)
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

// Database operations for vendors
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

  async getUserVendorPricing(userId) {
    try {
      const { data, error } = await supabase
        .from('account_vendor_pricing')
        .select(`
          *,
          vendor:vendors(*),
          brand:brands(*)
        `)
        .eq('user_id', userId);
      
      if (error) throw error;
      return data || [];
    } catch (error) {
      handleSupabaseError(error, 'getUserVendorPricing');
    }
  },

  async saveUserVendorPricing(userId, pricingData) {
    try {
      const { data, error } = await supabase
        .from('account_vendor_pricing')
        .upsert({ 
          user_id: userId, 
          ...pricingData,
          updated_at: new Date().toISOString()
        })
        .select();
      
      if (error) throw error;
      return data;
    } catch (error) {
      handleSupabaseError(error, 'saveUserVendorPricing');
    }
  },

  async getVendorsWithUserPricing(userId) {
    try {
      // Get all vendors with their pricing data for the user
      const { data, error } = await supabase
        .from('vendors')
        .select(`
          *,
          brands:brands(*),
          user_pricing:account_vendor_pricing!inner(
            discount_percentage,
            your_cost,
            wholesale_cost,
            tariff_tax
          )
        `)
        .eq('user_pricing.user_id', userId);
      
      if (error) throw error;
      return data || [];
    } catch (error) {
      handleSupabaseError(error, 'getVendorsWithUserPricing');
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
      .eq('user_id', userId)
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
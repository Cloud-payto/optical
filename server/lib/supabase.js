const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client for server-side operations
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing required Supabase environment variables: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
}

// Create Supabase client with service role key for admin access
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

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

  async getEmailsByAccount(accountId) {
    try {
      const { data, error } = await supabase
        .from('emails')
        .select('*')
        .eq('account_id', accountId)
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

  async deleteEmail(emailId, accountId) {
    try {
      const { error } = await supabase
        .from('emails')
        .delete()
        .eq('id', emailId)
        .eq('account_id', accountId);
      
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

  async getInventoryByAccount(accountId) {
    try {
      const { data, error } = await supabase
        .from('inventory')
        .select('*')
        .eq('account_id', accountId)
        .neq('status', 'archived')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data || [];
    } catch (error) {
      handleSupabaseError(error, 'getInventoryByAccount');
    }
  },

  async deleteInventoryItem(itemId, accountId) {
    try {
      const { error } = await supabase
        .from('inventory')
        .delete()
        .eq('id', itemId)
        .eq('account_id', accountId);
      
      if (error) throw error;
      return { success: true };
    } catch (error) {
      handleSupabaseError(error, 'deleteInventoryItem');
    }
  },

  async archiveInventoryItem(itemId, accountId) {
    try {
      const { data, error } = await supabase
        .from('inventory')
        .update({ status: 'archived' })
        .eq('id', itemId)
        .eq('account_id', accountId)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    } catch (error) {
      handleSupabaseError(error, 'archiveInventoryItem');
    }
  },

  async confirmPendingOrder(orderNumber, accountId) {
    try {
      const { data, error } = await supabase
        .from('inventory')
        .update({ status: 'confirmed' })
        .eq('order_number', orderNumber)
        .eq('account_id', accountId)
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
  async getOrdersByAccount(accountId) {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          items:inventory(*)
        `)
        .eq('account_id', accountId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data || [];
    } catch (error) {
      handleSupabaseError(error, 'getOrdersByAccount');
    }
  },

  async getOrderById(orderId, accountId) {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          items:inventory(*)
        `)
        .eq('id', orderId)
        .eq('account_id', accountId)
        .single();
      
      if (error) throw error;
      return data;
    } catch (error) {
      handleSupabaseError(error, 'getOrderById');
    }
  },

  async archiveOrder(orderId, accountId) {
    try {
      const { data, error } = await supabase
        .from('orders')
        .update({ status: 'archived' })
        .eq('id', orderId)
        .eq('account_id', accountId)
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
  async getDashboardStats(accountId) {
    try {
      // Get total orders
      const { count: totalOrders } = await supabase
        .from('orders')
        .select('*', { count: 'exact', head: true })
        .eq('account_id', accountId);

      // Get total inventory
      const { count: totalInventory } = await supabase
        .from('inventory')
        .select('*', { count: 'exact', head: true })
        .eq('account_id', accountId)
        .neq('status', 'archived');

      // Get pending items
      const { count: pendingItems } = await supabase
        .from('inventory')
        .select('*', { count: 'exact', head: true })
        .eq('account_id', accountId)
        .eq('status', 'pending');

      // Calculate total value (if wholesale_price exists)
      const { data: inventoryData } = await supabase
        .from('inventory')
        .select('wholesale_price, quantity')
        .eq('account_id', accountId)
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

// Check duplicate order helper
async function checkDuplicateOrder(orderNumber, accountId) {
  try {
    const { data, error } = await supabase
      .from('orders')
      .select('id')
      .eq('order_number', orderNumber)
      .eq('account_id', accountId)
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
  checkDuplicateOrder,
  handleSupabaseError
};
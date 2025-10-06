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
          parse_status: 'parsed',
          received_at: new Date().toISOString()
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
  },

  async saveOrUpdateVendorAccountNumber(accountId, vendorId, vendorAccountNumber) {
    try {
      // Try to upsert into account_vendors table (separate from brands)
      const { data, error } = await supabase
        .from('account_vendors')
        .upsert(
          {
            account_id: accountId,
            vendor_id: vendorId,
            vendor_account_number: vendorAccountNumber,
            updated_at: new Date().toISOString()
          },
          {
            onConflict: 'account_id,vendor_id'
          }
        )
        .select()
        .single();

      if (error) {
        // If table doesn't exist, just log and continue
        if (error.code === '42P01' || error.code === '42P10') {
          console.log(`ℹ️  account_vendors table not set up yet, skipping vendor account number save`);
          return { skipped: true, message: 'Table not ready' };
        }
        throw error;
      }

      console.log(`✅ Saved vendor account number for account ${accountId}, vendor ${vendorId}`);
      return data;
    } catch (error) {
      // Log but don't throw - this is not critical for email parsing
      console.warn(`⚠️  Could not save vendor account number:`, error.message);
      return { error: error.message };
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
        .select(`
          *,
          vendor:vendors(name),
          order:orders(order_number, customer_name, order_date)
        `)
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

  async markInventoryItemAsSold(itemId, userId) {
    try {
      const { data, error } = await supabase
        .from('inventory')
        .update({
          status: 'sold',
          sold_date: new Date().toISOString().split('T')[0] // Set current date as sold_date
        })
        .eq('id', itemId)
        .eq('account_id', userId)
        .select()
        .single();

      if (error) throw error;
      return { success: true, item: data };
    } catch (error) {
      handleSupabaseError(error, 'markInventoryItemAsSold');
      return { success: false, error: error.message };
    }
  },

  async confirmPendingOrder(orderNumber, userId) {
    try {
      // First, try to find the order with vendor information
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .select('id, vendor_id, vendors(name)')
        .eq('order_number', orderNumber)
        .eq('account_id', userId)
        .single();

      let pendingItems;
      let vendorName;

      if (orderError || !order) {
        // If order doesn't exist in orders table, look for pending inventory items directly
        console.log(`⚠️ Order ${orderNumber} not found in orders table, searching inventory items directly`);

        // DEBUG: Check if items exist with ANY status for this order number
        const { data: anyStatusItems } = await supabase
          .from('inventory')
          .select('id, status, enriched_data')
          .eq('account_id', userId);

        const matchingAnyStatus = anyStatusItems?.filter(item =>
          item.enriched_data?.order_number === orderNumber ||
          item.enriched_data?.order?.order_number === orderNumber
        ) || [];

        console.log(`🔍 DEBUG: Found ${matchingAnyStatus.length} items with ANY status for order ${orderNumber}`);
        if (matchingAnyStatus.length > 0) {
          console.log(`📊 Status breakdown:`, matchingAnyStatus.reduce((acc, item) => {
            acc[item.status] = (acc[item.status] || 0) + 1;
            return acc;
          }, {}));
        }

        // Get all pending items for this user and filter in JavaScript
        // since we can't easily query the enriched_data JSONB field with Supabase
        const { data: allPendingItems, error: inventoryError } = await supabase
          .from('inventory')
          .select('*, vendors(name), order:orders(order_number, customer_name, order_date)')
          .eq('account_id', userId)
          .eq('status', 'pending');

        if (inventoryError) throw inventoryError;

        console.log(`🔍 Found ${allPendingItems?.length || 0} total pending items for user`);

        // Log sample of enriched_data to debug
        if (allPendingItems && allPendingItems.length > 0) {
          console.log(`📋 Sample enriched_data structures:`);
          allPendingItems.slice(0, 3).forEach((item, idx) => {
            console.log(`  Item ${idx + 1}:`, {
              id: item.id,
              order_order_number: item.order?.order_number,
              enriched_data_order_number: item.enriched_data?.order_number,
              enriched_data_order_object: item.enriched_data?.order?.order_number
            });
          });
        }

        // Filter items that match the order number (either in orders table or enriched_data)
        const items = allPendingItems?.filter(item => {
          // Check if order.order_number matches
          if (item.order?.order_number === orderNumber) return true;
          // Check if enriched_data contains the order number
          if (item.enriched_data?.order_number === orderNumber) return true;
          // Check if enriched_data.order.order_number matches
          if (item.enriched_data?.order?.order_number === orderNumber) return true;
          return false;
        }) || [];

        console.log(`🎯 Filtered to ${items.length} items matching order number ${orderNumber}`);

        if (items.length === 0) {
          return { success: false, message: `No pending items found for order ${orderNumber}` };
        }

        pendingItems = items;
        vendorName = items[0]?.vendors?.name || items[0]?.vendor?.name || 'Unknown';
      } else {
        // Get pending inventory items for this order
        const { data: items, error: fetchError } = await supabase
          .from('inventory')
          .select('*')
          .eq('order_id', order.id)
          .eq('account_id', userId)
          .eq('status', 'pending');

        if (fetchError) throw fetchError;

        pendingItems = items;
        vendorName = order.vendors?.name;
      }

      if (!pendingItems || pendingItems.length === 0) {
        return { success: false, message: `No pending items found for order ${orderNumber}` };
      }

      // Update each item to confirmed status (enrichment should have already happened in n8n)
      console.log(`🔄 Updating ${pendingItems.length} items to confirmed status...`);
      console.log(`📝 Sample item IDs to update:`, pendingItems.slice(0, 3).map(i => i.id));

      const updatePromises = pendingItems.map(item =>
        supabase
          .from('inventory')
          .update({
            status: 'confirmed'
          })
          .eq('id', item.id)
          .select()
      );

      const results = await Promise.all(updatePromises);

      // Check for errors in the results
      const errors = results.filter(r => r.error);
      if (errors.length > 0) {
        console.error(`❌ Errors updating items:`, errors.map(e => e.error));
      }

      const updatedItems = results.map(r => r.data?.[0]).filter(Boolean);

      console.log(`✅ Successfully updated ${updatedItems.length} items to confirmed status`);

      if (updatedItems.length === 0 && pendingItems.length > 0) {
        console.error(`⚠️ WARNING: Tried to update ${pendingItems.length} items but 0 were updated!`);
        console.error(`📊 First pending item structure:`, JSON.stringify(pendingItems[0], null, 2));
      }

      // Update order status to 'confirmed' after all items are confirmed (if order exists)
      if (order) {
        console.log(`📋 Updating order ${order.id} status to confirmed...`);
        await supabase
          .from('orders')
          .update({ status: 'confirmed' })
          .eq('id', order.id);
        console.log(`✅ Order status updated successfully`);
      } else {
        console.log(`⚠️ No order record found in orders table for order number ${orderNumber}`);
      }

      return { success: true, message: `Confirmed ${updatedItems.length} items`, updatedCount: updatedItems.length };
    } catch (error) {
      handleSupabaseError(error, 'confirmPendingOrder');
      return { success: false, error: error.message || 'Unknown error confirming order' };
    }
  },

  async archiveAllItemsByBrand(userId, brandName, vendorName) {
    try {
      // First, get vendor_id from vendor name
      const { data: vendor, error: vendorError } = await supabase
        .from('vendors')
        .select('id')
        .eq('name', vendorName)
        .single();

      if (vendorError || !vendor) {
        return { success: false, error: `Vendor '${vendorName}' not found` };
      }

      // Update all items matching the brand and vendor to archived status
      const { data, error } = await supabase
        .from('inventory')
        .update({ status: 'archived' })
        .eq('account_id', userId)
        .eq('vendor_id', vendor.id)
        .eq('brand', brandName)
        .neq('status', 'archived') // Only update items not already archived
        .select();

      if (error) throw error;

      return {
        success: true,
        archivedCount: data?.length || 0,
        message: `Archived ${data?.length || 0} items from ${brandName}`
      };
    } catch (error) {
      handleSupabaseError(error, 'archiveAllItemsByBrand');
    }
  },

  async deleteArchivedItemsByBrand(userId, brandName, vendorName) {
    try {
      // First, get vendor_id from vendor name
      const { data: vendor, error: vendorError } = await supabase
        .from('vendors')
        .select('id')
        .eq('name', vendorName)
        .single();

      if (vendorError || !vendor) {
        return { success: false, error: `Vendor '${vendorName}' not found` };
      }

      // Delete all archived items matching the brand and vendor
      const { data, error } = await supabase
        .from('inventory')
        .delete()
        .eq('account_id', userId)
        .eq('vendor_id', vendor.id)
        .eq('brand', brandName)
        .eq('status', 'archived')
        .select();

      if (error) throw error;

      return {
        success: true,
        deletedCount: data?.length || 0,
        message: `Deleted ${data?.length || 0} archived items from ${brandName}`
      };
    } catch (error) {
      handleSupabaseError(error, 'deleteArchivedItemsByBrand');
    }
  },

  async deleteArchivedItemsByVendor(userId, vendorName) {
    try {
      // First, get vendor_id from vendor name
      const { data: vendor, error: vendorError } = await supabase
        .from('vendors')
        .select('id')
        .eq('name', vendorName)
        .single();

      if (vendorError || !vendor) {
        return { success: false, error: `Vendor '${vendorName}' not found` };
      }

      // Delete all archived items matching the vendor
      const { data, error } = await supabase
        .from('inventory')
        .delete()
        .eq('account_id', userId)
        .eq('vendor_id', vendor.id)
        .eq('status', 'archived')
        .select();

      if (error) throw error;

      return {
        success: true,
        deletedCount: data?.length || 0,
        message: `Deleted ${data?.length || 0} archived items from ${vendorName}`
      };
    } catch (error) {
      handleSupabaseError(error, 'deleteArchivedItemsByVendor');
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
          vendor:vendors(name),
          items:inventory(*)
        `)
        .eq('account_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Flatten vendor object to vendor string for easier access
      const ordersWithVendorName = data?.map(order => ({
        ...order,
        vendor: order.vendor?.name || 'Unknown Vendor'
      })) || [];

      // Debug: Log order dates
      if (ordersWithVendorName.length > 0) {
        console.log('📅 Sample order dates from DB:');
        ordersWithVendorName.slice(0, 3).forEach(order => {
          console.log(`  Order ${order.order_number}: order_date = ${order.order_date}, customer = ${order.customer_name}`);
        });
      }

      return ordersWithVendorName;
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

  async saveOrder(orderData) {
    try {
      console.log('💾 SAVING ORDER TO DATABASE:');
      console.log('  Order Number:', orderData.order_number);
      console.log('  Order Date (raw):', orderData.order_date);
      console.log('  Order Date (type):', typeof orderData.order_date);
      console.log('  Customer Name:', orderData.customer_name);

      const { data, error } = await supabase
        .from('orders')
        .insert([orderData])
        .select()
        .single();

      if (error) {
        console.error('❌ Database error saving order:', error);
        throw error;
      }

      console.log('✅ Order saved successfully!');
      console.log('  Returned order_date from DB:', data.order_date);
      console.log('  Returned customer_name from DB:', data.customer_name);

      return data;
    } catch (error) {
      handleSupabaseError(error, 'saveOrder');
    }
  },

  async archiveOrder(orderId, userId) {
    try {
      const { data, error } = await supabase
        .from('orders')
        .update({
          status: 'cancelled',  // Database only allows: pending, confirmed, shipped, delivered, cancelled
          metadata: { archived: true, archived_at: new Date().toISOString() }
        })
        .eq('id', orderId)
        .eq('account_id', userId)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      handleSupabaseError(error, 'archiveOrder');
    }
  },

  async deleteOrder(orderId, userId) {
    try {
      // First, delete all inventory items associated with this order
      console.log(`🗑️  Deleting inventory items for order ${orderId}...`);
      const { error: inventoryError, data: deletedItems } = await supabase
        .from('inventory')
        .delete()
        .eq('order_id', orderId)
        .eq('account_id', userId)
        .select();

      if (inventoryError) {
        console.error('❌ Error deleting inventory items:', inventoryError);
        throw inventoryError;
      }

      console.log(`✅ Deleted ${deletedItems?.length || 0} inventory items`);

      // Then, delete the order itself
      const { error } = await supabase
        .from('orders')
        .delete()
        .eq('id', orderId)
        .eq('account_id', userId);

      if (error) throw error;

      console.log(`✅ Order ${orderId} deleted successfully`);
      return { success: true, deletedInventoryCount: deletedItems?.length || 0 };
    } catch (error) {
      handleSupabaseError(error, 'deleteOrder');
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
  },

  async getInventoryByVendorAndBrand(userId) {
    try {
      // Get all confirmed inventory with vendor and brand info
      const { data: inventory, error } = await supabase
        .from('inventory')
        .select(`
          id,
          brand,
          model,
          quantity,
          wholesale_price,
          status,
          vendor:vendors(id, name),
          enriched_data
        `)
        .eq('account_id', userId)
        .eq('status', 'confirmed')
        .order('vendor_id');

      if (error) throw error;

      // Group by vendor, then by brand
      const vendorMap = new Map();

      (inventory || []).forEach(item => {
        const vendorName = item.vendor?.name || 'Unknown Vendor';
        const vendorId = item.vendor?.id || 'unknown';
        const brandName = item.brand || 'Unknown Brand';

        if (!vendorMap.has(vendorId)) {
          vendorMap.set(vendorId, {
            vendorId,
            vendorName,
            totalItems: 0,
            totalValue: 0,
            brands: new Map()
          });
        }

        const vendor = vendorMap.get(vendorId);

        if (!vendor.brands.has(brandName)) {
          vendor.brands.set(brandName, {
            brandName,
            itemCount: 0,
            totalValue: 0,
            items: []
          });
        }

        const brand = vendor.brands.get(brandName);
        const itemValue = (item.wholesale_price || 0) * (item.quantity || 1);

        brand.itemCount += item.quantity || 1;
        brand.totalValue += itemValue;
        brand.items.push(item);

        vendor.totalItems += item.quantity || 1;
        vendor.totalValue += itemValue;
      });

      // Convert maps to arrays
      const vendorStats = Array.from(vendorMap.values()).map(vendor => ({
        vendorId: vendor.vendorId,
        vendorName: vendor.vendorName,
        totalItems: vendor.totalItems,
        totalValue: vendor.totalValue,
        brands: Array.from(vendor.brands.values()).map(brand => ({
          brandName: brand.brandName,
          itemCount: brand.itemCount,
          totalValue: brand.totalValue
        }))
      }));

      return vendorStats;
    } catch (error) {
      handleSupabaseError(error, 'getInventoryByVendorAndBrand');
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
      console.log('🔥 DEBUG: saveAccountBrand - Start');
      console.log('🔥 DEBUG: userId (account_id):', userId);
      console.log('🔥 DEBUG: brandData received:', brandData);
      
      const { 
        brand_id, 
        brand_name,  // New field for creating brands
        vendor_id, 
        global_wholesale_cost,
        msrp,        // Retail price for brands table
        wholesale_cost,
        tariff_tax,
        discount_percentage,
        notes 
      } = brandData;

      let finalBrandId = brand_id;

      // Step 1: Handle brand creation/update
      if (!brand_id && brand_name) {
        // Create NEW brand - let DB generate UUID
        console.log('🔥 Creating new brand:', brand_name);
        
        const { data: newBrand, error: createError } = await supabase
          .from('brands')
          .insert({
            name: brand_name,
            vendor_id: vendor_id,
            wholesale_cost: global_wholesale_cost || wholesale_cost,
            msrp: msrp || 0,
            is_active: true
          })
          .select()
          .single();
        
        if (createError) {
          console.error('🔥 Error creating brand:', createError);
          throw createError;
        }
        
        finalBrandId = newBrand.id; // Use the DB-generated UUID
        console.log('✅ Brand created with ID:', finalBrandId);
        
      } else if (brand_id) {
        // Update EXISTING brand if global_wholesale_cost or msrp provided
        if (global_wholesale_cost !== undefined || msrp !== undefined) {
          console.log('🔥 Updating existing brand:', brand_id);
          
          const updateData = {};
          if (global_wholesale_cost !== undefined) {
            updateData.wholesale_cost = global_wholesale_cost;
          }
          if (msrp !== undefined) {
            updateData.msrp = msrp;
          }
          
          const { error: updateError } = await supabase
            .from('brands')
            .update(updateData)
            .eq('id', brand_id);
          
          if (updateError) {
            console.error('🔥 Error updating brand:', updateError);
            throw updateError;
          }
        }
        finalBrandId = brand_id;
      } else {
        throw new Error('Either brand_id or brand_name must be provided');
      }

      // Step 2: Create/update account_brands entry using proper upsert with conflict resolution
      console.log('🔥 Saving to account_brands with brand_id:', finalBrandId);
      
      const accountBrandData = {
        account_id: userId,
        brand_id: finalBrandId,  // Use the real UUID
        vendor_id: vendor_id,
        wholesale_cost: wholesale_cost,
        tariff_tax: tariff_tax || 0,
        discount_percentage: discount_percentage || 0,
        notes: notes || '',
        updated_at: new Date().toISOString()
      };
      
      console.log('🔥 Account brand data to upsert:', accountBrandData);
      
      // Try multiple upsert approaches
      let accountBrand, accountError;
      
      try {
        // Method 1: Simple upsert (let Supabase auto-detect conflicts)
        console.log('🔥 Attempting simple upsert (auto-conflict resolution)');
        const result = await supabase
          .from('account_brands')
          .upsert(accountBrandData)
          .select()
          .single();
          
        accountBrand = result.data;
        accountError = result.error;
        
        if (accountError && accountError.code === '23505') {
          // Constraint violation - try with explicit conflict resolution
          console.log('🔥 Auto-conflict failed, trying with exact constraint name');
          
          const result2 = await supabase
            .from('account_brands')
            .upsert(accountBrandData, {
              onConflict: 'account_brands_account_id_brand_id_key',
              ignoreDuplicates: false
            })
            .select()
            .single();
            
          accountBrand = result2.data;
          accountError = result2.error;
          
          if (accountError) {
            console.log('🔥 Exact constraint name failed too, falling back to manual');
            throw new Error('All upsert methods failed, using manual approach');
          } else {
            console.log('✅ Exact constraint name method worked!');
          }
        }
        
      } catch (err) {
        console.log('🔥 Simple upsert failed, trying manual approach');
        
        // Method 2: Manual check and update/insert
        const { data: existing } = await supabase
          .from('account_brands')
          .select('id')
          .eq('account_id', userId)
          .eq('brand_id', finalBrandId)
          .single();
          
        if (existing) {
          // Update existing
          console.log('🔥 Existing record found, updating');
          const result = await supabase
            .from('account_brands')
            .update({
              vendor_id: vendor_id,
              wholesale_cost: wholesale_cost,
              tariff_tax: tariff_tax || 0,
              discount_percentage: discount_percentage || 0,
              notes: notes || '',
              updated_at: new Date().toISOString()
            })
            .eq('account_id', userId)
            .eq('brand_id', finalBrandId)
            .select()
            .single();
            
          accountBrand = result.data;
          accountError = result.error;
        } else {
          // Insert new
          console.log('🔥 No existing record found, inserting new');
          const result = await supabase
            .from('account_brands')
            .insert(accountBrandData)
            .select()
            .single();
            
          accountBrand = result.data;
          accountError = result.error;
        }
      }

      if (accountError) {
        console.error('🔥 Error saving account_brands:', accountError);
        throw accountError;
      }

      console.log('✅ Successfully saved account brand:', accountBrand);
      
      const finalResult = {
        account_brand: accountBrand,
        brand_id: finalBrandId, // Return the real brand ID for frontend update
        success: true
      };

      return finalResult;
    } catch (error) {
      console.error('🔥 DEBUG: Error in saveAccountBrand:', error);
      throw error; // Let the route handler catch this
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
        console.log('🔥 DEBUG: Fetching account_brands for userId:', userId, 'vendorIds:', vendorIds);

        const { data: accountBrandData, error: accountBrandError } = await supabase
          .from('account_brands')
          .select('*')
          .eq('account_id', userId)
          .in('vendor_id', vendorIds);

        if (accountBrandError) throw accountBrandError;
        accountBrands = accountBrandData || [];

        console.log('🔥 DEBUG: Found account_brands data:', accountBrands.length, 'records');
        console.log('🔥 DEBUG: Account brands:', accountBrands);
      }

      // Merge vendor data with user pricing
      const vendorsWithPricing = (data || []).map(vendor => {
        const brandsWithAccountData = (vendor.brands || []).map(brand => {
          const accountBrand = accountBrands.find(ab =>
            ab.vendor_id === vendor.id && ab.brand_id === brand.id
          );

          if (accountBrand) {
            console.log('🔥 DEBUG: Found account_brand for brand:', brand.name, 'data:', accountBrand);
          } else {
            console.log('🔥 DEBUG: No account_brand found for brand:', brand.name, 'vendor:', vendor.id, 'brand:', brand.id);
          }

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
  },

  async getMissingVendorsForUser(userId) {
    try {
      // Get all vendor IDs from user's inventory
      const { data: inventoryVendors, error: inventoryError } = await supabase
        .from('inventory')
        .select('vendor_id')
        .eq('account_id', userId)
        .not('vendor_id', 'is', null);

      if (inventoryError) throw inventoryError;

      // Get unique vendor IDs from inventory
      const inventoryVendorIds = [...new Set(inventoryVendors?.map(item => item.vendor_id) || [])];

      if (inventoryVendorIds.length === 0) {
        return [];
      }

      // Get vendor IDs that user already has in account_brands
      const { data: accountVendors, error: accountError } = await supabase
        .from('account_brands')
        .select('vendor_id')
        .eq('account_id', userId)
        .in('vendor_id', inventoryVendorIds);

      if (accountError) throw accountError;

      const accountVendorIds = [...new Set(accountVendors?.map(ab => ab.vendor_id) || [])];

      // Find vendor IDs that are in inventory but not in account_brands
      const missingVendorIds = inventoryVendorIds.filter(vid => !accountVendorIds.includes(vid));

      if (missingVendorIds.length === 0) {
        return [];
      }

      // Get full vendor details for missing vendors
      const { data: vendors, error: vendorsError } = await supabase
        .from('vendors')
        .select('*')
        .in('id', missingVendorIds);

      if (vendorsError) throw vendorsError;

      return vendors || [];
    } catch (error) {
      handleSupabaseError(error, 'getMissingVendorsForUser');
    }
  },

  async getMissingBrandsForVendor(userId, vendorId) {
    try {
      // Get all brands for this vendor from the global brands table
      const { data: allBrands, error: brandsError } = await supabase
        .from('brands')
        .select('*')
        .eq('vendor_id', vendorId)
        .eq('is_active', true);

      if (brandsError) throw brandsError;

      // Get brand IDs that user already has for this vendor
      const { data: accountBrands, error: accountError } = await supabase
        .from('account_brands')
        .select('brand_id')
        .eq('account_id', userId)
        .eq('vendor_id', vendorId);

      if (accountError) throw accountError;

      const accountBrandIds = accountBrands?.map(ab => ab.brand_id) || [];

      // Filter out brands the user already has
      const missingBrands = (allBrands || []).filter(brand => !accountBrandIds.includes(brand.id));

      return missingBrands;
    } catch (error) {
      handleSupabaseError(error, 'getMissingBrandsForVendor');
    }
  },

  async addAccountBrandsBulk(userId, vendorId, brandIds) {
    try {
      // Prepare account_brands entries
      const accountBrandsData = brandIds.map(brandId => ({
        account_id: userId,
        vendor_id: vendorId,
        brand_id: brandId,
        discount_percentage: 45, // Default 45% discount
        tariff_tax: 0,
        notes: '',
        updated_at: new Date().toISOString()
      }));

      // Use upsert to handle any duplicates gracefully
      const { data, error } = await supabase
        .from('account_brands')
        .upsert(accountBrandsData, {
          onConflict: 'account_id,brand_id',
          ignoreDuplicates: false
        })
        .select();

      if (error) throw error;

      return { success: true, addedCount: data?.length || 0, data };
    } catch (error) {
      handleSupabaseError(error, 'addAccountBrandsBulk');
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
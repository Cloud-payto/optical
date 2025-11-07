const { createClient } = require('@supabase/supabase-js');
const { applySortingAndPagination, getPaginationMetadata } = require('./queryBuilder');

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

// Helper function to calculate median wholesale price for a brand
async function calculateMedianWholesalePrice(accountId, vendorId, brandName) {
  try {
    console.log(`📊 Calculating median wholesale price for brand "${brandName}" (vendor: ${vendorId}, account: ${accountId})`);

    // Get all current inventory items for this brand
    const { data: items, error } = await supabase
      .from('inventory')
      .select('wholesale_price')
      .eq('account_id', accountId)
      .eq('vendor_id', vendorId)
      .ilike('brand', brandName)
      .eq('status', 'current')
      .not('wholesale_price', 'is', null)
      .gt('wholesale_price', 0);

    if (error) throw error;

    if (!items || items.length === 0) {
      console.log(`  ℹ️  No wholesale prices found for "${brandName}"`);
      return null;
    }

    // Extract prices and sort them
    const prices = items.map(item => parseFloat(item.wholesale_price)).sort((a, b) => a - b);

    console.log(`  📈 Found ${prices.length} wholesale prices for "${brandName}"`);
    console.log(`  💰 Price range: $${Math.min(...prices).toFixed(2)} - $${Math.max(...prices).toFixed(2)}`);

    // Calculate median
    const middle = Math.floor(prices.length / 2);
    let median;

    if (prices.length % 2 === 0) {
      // Even number of items - average the two middle values
      median = (prices[middle - 1] + prices[middle]) / 2;
    } else {
      // Odd number of items - take the middle value
      median = prices[middle];
    }

    console.log(`  ✅ Calculated median: $${median.toFixed(2)}`);

    return median;
  } catch (error) {
    console.error(`Error calculating median wholesale price:`, error);
    return null;
  }
}

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
      console.log(`🔍 confirmPendingOrder called with orderNumber: "${orderNumber}", userId: "${userId}"`);

      // First, try to find the order with vendor information
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .select('id, vendor_id, vendors(name)')
        .eq('order_number', orderNumber)
        .eq('account_id', userId)
        .single();

      console.log(`📋 Order lookup result:`, { found: !!order, orderId: order?.id, error: orderError?.message });

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

      // Update each item to current status (enrichment should have already happened in n8n)
      console.log(`🔄 Updating ${pendingItems.length} items to current status...`);
      console.log(`📝 Sample item IDs to update:`, pendingItems.slice(0, 3).map(i => i.id));

      const updatePromises = pendingItems.map(item =>
        supabase
          .from('inventory')
          .update({
            status: 'current'
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

      console.log(`✅ Successfully updated ${updatedItems.length} items to current status`);

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

      // DETECT VENDORS AND BRANDS FOR IMPORT
      console.log(`🔍 Checking for vendors/brands to suggest for import...`);

      // Extract unique vendor IDs and brands from the confirmed items
      const vendorIds = [...new Set(pendingItems.map(item => item.vendor_id).filter(Boolean))];
      const brandNames = [...new Set(pendingItems.map(item => item.brand).filter(Boolean))];

      console.log(`📦 Found ${vendorIds.length} unique vendors and ${brandNames.length} unique brands in this order`);

      for (const vendorId of vendorIds) {
        try {
          // Check if user has this vendor in account_vendors
          const { data: existingAccountVendor } = await supabase
            .from('account_vendors')
            .select('id')
            .eq('account_id', userId)
            .eq('vendor_id', vendorId)
            .single();

          if (!existingAccountVendor) {
            console.log(`📌 Vendor ${vendorId} not in account_vendors - will be available for import`);
          } else {
            console.log(`✓ Vendor ${vendorId} already in account_vendors`);
          }
        } catch (error) {
          console.error(`Error checking vendor ${vendorId}:`, error);
        }
      }

      // Check brands
      for (const brandName of brandNames) {
        try {
          // Find the brand in the global brands table
          const vendorId = pendingItems.find(item => item.brand === brandName)?.vendor_id;

          if (!vendorId) continue;

          const { data: globalBrand } = await supabase
            .from('brands')
            .select('id')
            .eq('vendor_id', vendorId)
            .ilike('name', brandName)
            .single();

          if (globalBrand) {
            // Check if user has this brand in account_brands
            const { data: existingAccountBrand } = await supabase
              .from('account_brands')
              .select('id')
              .eq('account_id', userId)
              .eq('brand_id', globalBrand.id)
              .single();

            if (!existingAccountBrand) {
              console.log(`📌 Brand "${brandName}" not in account_brands - will be available for import`);
            } else {
              console.log(`✓ Brand "${brandName}" already in account_brands`);
            }
          } else {
            console.log(`📌 Brand "${brandName}" not in global brands table - will be created on import`);
          }
        } catch (error) {
          console.error(`Error checking brand ${brandName}:`, error);
        }
      }

      console.log(`✅ Vendor/brand detection complete`);

      // CALCULATE MEDIAN WHOLESALE PRICES FOR BRANDS
      console.log(`\n📊 Calculating median wholesale prices for brands...`);

      // Get unique brand/vendor combinations from the confirmed items
      const brandVendorPairs = new Map();
      pendingItems.forEach(item => {
        if (item.brand && item.vendor_id) {
          const key = `${item.vendor_id}:${item.brand}`;
          if (!brandVendorPairs.has(key)) {
            brandVendorPairs.set(key, {
              vendorId: item.vendor_id,
              brandName: item.brand
            });
          }
        }
      });

      console.log(`  Found ${brandVendorPairs.size} unique brand/vendor pairs to calculate medians for`);

      // Calculate and update median for each brand
      for (const [key, { vendorId, brandName }] of brandVendorPairs) {
        try {
          const median = await calculateMedianWholesalePrice(userId, vendorId, brandName);

          if (median !== null) {
            // Update the brand's wholesale_cost in the brands table
            const { data: globalBrand } = await supabase
              .from('brands')
              .select('id, wholesale_cost')
              .eq('vendor_id', vendorId)
              .ilike('name', brandName)
              .single();

            if (globalBrand) {
              // Update the brand's wholesale_cost with the calculated median
              await supabase
                .from('brands')
                .update({
                  wholesale_cost: median,
                  price_last_updated: new Date().toISOString(),
                  price_source: 'auto_calculated_median'
                })
                .eq('id', globalBrand.id);

              console.log(`  ✅ Updated "${brandName}" wholesale_cost to $${median.toFixed(2)} (median from confirmed inventory)`);
            } else {
              console.log(`  ℹ️  Brand "${brandName}" not found in global brands table yet`);
            }
          }
        } catch (error) {
          console.error(`  ❌ Error calculating median for "${brandName}":`, error.message);
          // Continue with other brands even if one fails
        }
      }

      console.log(`✅ Median calculation complete\n`);

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

      console.log(`📦 Archiving all items for brand ${brandName} from vendor ${vendorName}...`);

      // Update all items matching the brand and vendor to archived status
      const { data, error } = await supabase
        .from('inventory')
        .update({ status: 'archived' })
        .eq('account_id', userId)
        .eq('vendor_id', vendor.id)
        .eq('brand', brandName)
        .neq('status', 'archived') // Only update items not already archived
        .select();

      if (error) {
        console.error(`❌ Error archiving items:`, error);
        throw error;
      }

      console.log(`✅ Archived ${data?.length || 0} items from ${brandName}`);

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
          vendor:vendors(name),
          items:inventory(*)
        `)
        .eq('id', orderId)
        .eq('account_id', userId)
        .single();

      if (error) throw error;

      // Flatten vendor object to vendor string for consistency with getOrdersByAccount
      return {
        ...data,
        vendor: data.vendor?.name || 'Unknown Vendor'
      };
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
      // Note: We don't update inventory items status because 'archived' is not in the database constraint
      // The inventory items will be filtered out on the frontend by checking if their parent order is archived
      // This is handled by checking order.metadata.archived

      console.log(`📦 Archiving order ${orderId}...`);

      // First, get the current order to preserve its status
      const { data: currentOrder, error: fetchError } = await supabase
        .from('orders')
        .select('status, metadata')
        .eq('id', orderId)
        .eq('account_id', userId)
        .single();

      if (fetchError) throw fetchError;

      // Archive the order itself - preserve current status, just add archived flag to metadata
      const { data, error } = await supabase
        .from('orders')
        .update({
          // Keep the current status (e.g., 'confirmed') instead of changing to 'cancelled'
          // This prevents archived orders from appearing in the wrong tabs
          metadata: {
            ...(currentOrder.metadata || {}),
            archived: true,
            archived_at: new Date().toISOString()
          }
        })
        .eq('id', orderId)
        .eq('account_id', userId)
        .select()
        .single();

      if (error) throw error;

      console.log(`✅ Order ${orderId} archived successfully (status preserved as '${currentOrder.status}')`);
      return data;
    } catch (error) {
      handleSupabaseError(error, 'archiveOrder');
    }
  },

  async deleteOrder(orderId, userId) {
    try {
      console.log(`🗑️  Deleting order ${orderId}...`);

      // First, get the order to find its order_number
      const { data: order, error: orderFetchError } = await supabase
        .from('orders')
        .select('order_number')
        .eq('id', orderId)
        .eq('account_id', userId)
        .single();

      if (orderFetchError) {
        console.error('❌ Error fetching order:', orderFetchError);
        throw orderFetchError;
      }

      const orderNumber = order?.order_number;
      console.log(`📋 Order number: ${orderNumber}`);

      // Delete inventory items with order_id foreign key
      console.log(`🗑️  Deleting inventory items with order_id = ${orderId}...`);
      const { error: inventoryError1, data: deletedItemsByOrderId } = await supabase
        .from('inventory')
        .delete()
        .eq('order_id', orderId)
        .eq('account_id', userId)
        .select();

      if (inventoryError1) {
        console.error('❌ Error deleting inventory items by order_id:', inventoryError1);
        throw inventoryError1;
      }

      console.log(`✅ Deleted ${deletedItemsByOrderId?.length || 0} inventory items by order_id`);

      // Also delete inventory items where enriched_data contains this order number
      // (for items that don't have order_id set but have the order number in enriched_data)
      let deletedItemsByOrderNumber = [];
      let itemsToDelete = []; // Declare outside the if block to avoid ReferenceError
      if (orderNumber) {
        console.log(`🗑️  Deleting inventory items with order number ${orderNumber} in enriched_data...`);

        // Get all inventory items for this user (all statuses, not just pending)
        const { data: allItems } = await supabase
          .from('inventory')
          .select('id, status, order_id, enriched_data')
          .eq('account_id', userId);

        console.log(`📊 Total items for user: ${allItems?.length || 0}`);

        // Filter items that match this order number in enriched_data
        itemsToDelete = allItems?.filter(item => {
          // Skip items that were already deleted by order_id
          if (item.order_id === orderId) {
            console.log(`  ⏭️  Skipping item ${item.id} (already deleted via order_id)`);
            return false;
          }

          const enrichedOrderNumber = item.enriched_data?.order_number || item.enriched_data?.order?.order_number;
          const matches = enrichedOrderNumber === orderNumber;

          if (matches) {
            console.log(`  🎯 MATCH: Item ${item.id} has order number ${enrichedOrderNumber} in enriched_data`);
          }

          return matches;
        }) || [];

        console.log(`📝 Found ${itemsToDelete.length} additional items to delete by order number in enriched_data`);

        if (itemsToDelete.length > 0) {
          console.log(`Items to delete:`, itemsToDelete.map(i => ({ id: i.id, status: i.status })));

          const itemIds = itemsToDelete.map(item => item.id);
          const { error: inventoryError2, data: deletedItems } = await supabase
            .from('inventory')
            .delete()
            .in('id', itemIds)
            .select();

          if (inventoryError2) {
            console.error('❌ Error deleting inventory items by order number:', inventoryError2);
            throw inventoryError2;
          }

          deletedItemsByOrderNumber = deletedItems || [];
          console.log(`✅ Deleted ${deletedItemsByOrderNumber.length} inventory items by order number`);
        }
      }

      // Then, delete the order itself
      const { error } = await supabase
        .from('orders')
        .delete()
        .eq('id', orderId)
        .eq('account_id', userId);

      if (error) throw error;

      console.log(`✅ Order ${orderId} deleted successfully`);
      const totalDeleted = (deletedItemsByOrderId?.length || 0) + itemsToDelete.length;
      return { success: true, deletedInventoryCount: totalDeleted };
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

      // Get items with missing prices (wholesale_price is null or 0)
      const { count: itemsWithMissingPrices } = await supabase
        .from('inventory')
        .select('*', { count: 'exact', head: true })
        .eq('account_id', userId)
        .neq('status', 'archived')
        .or('wholesale_price.is.null,wholesale_price.eq.0');

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
        pendingItems: pendingItems || 0,
        itemsWithMissingPrices: itemsWithMissingPrices || 0
      };
    } catch (error) {
      handleSupabaseError(error, 'getDashboardStats');
    }
  },

  async getInventoryByVendorAndBrand(userId, options = {}) {
    try {
      // Fetch ALL current inventory items (no pagination at item level)
      const { data: inventory, error } = await supabase
        .from('inventory')
        .select(`
          id,
          brand,
          model,
          quantity,
          wholesale_price,
          status,
          created_at,
          updated_at,
          received_date,
          vendor:vendors(id, name),
          enriched_data
        `)
        .eq('account_id', userId)
        .eq('status', 'current')
        .order('created_at', { ascending: false }); // Basic ordering for consistency

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
            brands: new Map(),
            // Track latest dates for sorting
            latestCreatedAt: item.created_at,
            latestReceivedDate: item.received_date,
            latestUpdatedAt: item.updated_at
          });
        }

        const vendor = vendorMap.get(vendorId);

        // Update latest dates
        if (item.created_at && item.created_at > vendor.latestCreatedAt) {
          vendor.latestCreatedAt = item.created_at;
        }
        if (item.received_date && item.received_date > vendor.latestReceivedDate) {
          vendor.latestReceivedDate = item.received_date;
        }
        if (item.updated_at && item.updated_at > vendor.latestUpdatedAt) {
          vendor.latestUpdatedAt = item.updated_at;
        }

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
      let vendorStats = Array.from(vendorMap.values()).map(vendor => ({
        vendorId: vendor.vendorId,
        vendorName: vendor.vendorName,
        totalItems: vendor.totalItems,
        totalValue: vendor.totalValue,
        latestCreatedAt: vendor.latestCreatedAt,
        latestReceivedDate: vendor.latestReceivedDate,
        latestUpdatedAt: vendor.latestUpdatedAt,
        brands: Array.from(vendor.brands.values()).map(brand => ({
          brandName: brand.brandName,
          itemCount: brand.itemCount,
          totalValue: brand.totalValue
        }))
      }));

      // Sort vendors based on options
      const sortBy = options.sortBy || 'created_at';
      const sortOrder = options.sortOrder || 'desc';

      vendorStats.sort((a, b) => {
        let aValue, bValue;

        switch (sortBy) {
          case 'brand':
            // Sort by first brand name alphabetically
            aValue = a.brands[0]?.brandName || '';
            bValue = b.brands[0]?.brandName || '';
            break;
          case 'quantity':
            aValue = a.totalItems;
            bValue = b.totalItems;
            break;
          case 'wholesale_price':
            aValue = a.totalValue;
            bValue = b.totalValue;
            break;
          case 'received_date':
            aValue = a.latestReceivedDate || '';
            bValue = b.latestReceivedDate || '';
            break;
          case 'updated_at':
            aValue = a.latestUpdatedAt || '';
            bValue = b.latestUpdatedAt || '';
            break;
          case 'model':
            // For model, sort by vendor name as fallback
            aValue = a.vendorName;
            bValue = b.vendorName;
            break;
          case 'created_at':
          default:
            aValue = a.latestCreatedAt || '';
            bValue = b.latestCreatedAt || '';
            break;
        }

        // Compare values
        let comparison = 0;
        if (aValue < bValue) comparison = -1;
        if (aValue > bValue) comparison = 1;

        // Apply sort order
        return sortOrder === 'asc' ? comparison : -comparison;
      });

      // Apply pagination to vendor array (NOT individual items)
      const totalVendors = vendorStats.length;
      const page = Math.max(1, parseInt(options.page) || 1);
      const pageSize = Math.min(Math.max(1, parseInt(options.pageSize) || 50), 100);
      const startIndex = (page - 1) * pageSize;
      const endIndex = startIndex + pageSize;

      const paginatedVendors = vendorStats.slice(startIndex, endIndex);

      // Remove temporary sorting fields from response
      const cleanedVendors = paginatedVendors.map(({ latestCreatedAt, latestReceivedDate, latestUpdatedAt, ...vendor }) => vendor);

      // Calculate pagination metadata based on VENDOR count
      const pagination = getPaginationMetadata(
        totalVendors,
        page,
        pageSize
      );

      return {
        vendors: cleanedVendors,
        pagination
      };
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

      // Step 3: Update inventory items with missing prices for this brand
      if (wholesale_cost && wholesale_cost > 0) {
        try {
          console.log(`🔍 Attempting to update inventory prices for brand_id: ${finalBrandId}, vendor_id: ${vendor_id}, wholesale_cost: ${wholesale_cost}`);

          // Get the brand name from the brands table
          const { data: brandInfo, error: brandError } = await supabase
            .from('brands')
            .select('name')
            .eq('id', finalBrandId)
            .single();

          if (brandError) {
            console.error('⚠️  Error fetching brand info:', brandError);
            return;
          }

          if (brandInfo) {
            console.log(`🔍 Found brand name: "${brandInfo.name}"`);

            // Create normalized version for matching (remove spaces, hyphens, lowercase)
            const normalizedBrandName = brandInfo.name.toLowerCase().replace(/[\s-]/g, '');
            console.log(`🔍 Normalized brand name: "${normalizedBrandName}"`);

            // Get ALL inventory items for this vendor with missing prices
            const { data: allVendorItems, error: fetchError } = await supabase
              .from('inventory')
              .select('id, brand, wholesale_price, model')
              .eq('account_id', userId)
              .eq('vendor_id', vendor_id)
              .or('wholesale_price.is.null,wholesale_price.eq.0');

            if (fetchError) {
              console.error('⚠️  Error fetching inventory items:', fetchError);
              return;
            }

            console.log(`🔍 Found ${allVendorItems?.length || 0} total inventory items for this vendor with missing prices`);

            // Filter items that match the brand name (fuzzy matching)
            const matchingItems = (allVendorItems || []).filter(item => {
              if (!item.brand) return false;
              const normalizedItemBrand = item.brand.toLowerCase().replace(/[\s-]/g, '');
              return normalizedItemBrand === normalizedBrandName;
            });

            console.log(`🔍 Found ${matchingItems.length} items matching brand "${brandInfo.name}" after fuzzy matching`);
            if (matchingItems.length > 0) {
              console.log('📋 Sample items to update:', matchingItems.slice(0, 3).map(i => ({
                id: i.id,
                brand: i.brand,
                model: i.model,
                current_price: i.wholesale_price
              })));

              // Get the IDs of items to update
              const itemIds = matchingItems.map(item => item.id);

              // Update the matched items
              const { data: updatedItems, error: updateError } = await supabase
                .from('inventory')
                .update({
                  wholesale_price: wholesale_cost,
                  updated_at: new Date().toISOString()
                })
                .in('id', itemIds)
                .select('id, brand, model');

              if (updateError) {
                console.error('⚠️  Error updating inventory prices:', updateError);
              } else if (updatedItems && updatedItems.length > 0) {
                console.log(`✅ Successfully updated ${updatedItems.length} inventory item(s) with new pricing $${wholesale_cost} for brand "${brandInfo.name}"`);
                console.log('📋 Updated items:', updatedItems.map(i => ({ id: i.id, brand: i.brand, model: i.model })));
              }
            } else {
              console.log(`ℹ️  No inventory items matched brand "${brandInfo.name}". Brand names in inventory for this vendor:`);
              const uniqueBrands = [...new Set((allVendorItems || []).map(i => i.brand).filter(Boolean))];
              console.log(`   Available brands: ${uniqueBrands.join(', ')}`);
              console.log(`   Looking for: "${brandInfo.name}" (normalized: "${normalizedBrandName}")`);
            }
          }
        } catch (inventoryUpdateError) {
          console.error('⚠️  Error in inventory price update:', inventoryUpdateError);
          // Don't throw - this is a bonus feature, not critical
        }
      }

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

      // FIRST: Get vendor IDs that the user has explicitly added to their account
      const { data: accountVendors, error: accountVendorsError } = await supabase
        .from('account_vendors')
        .select('vendor_id, vendor_account_number')
        .eq('account_id', userId);

      if (accountVendorsError) throw accountVendorsError;

      // If user has no vendors added, return empty array
      if (!accountVendors || accountVendors.length === 0) {
        console.log('No account_vendors found for user, returning empty array');
        return [];
      }

      // Get unique vendor IDs and create account number map
      const userVendorIds = [...new Set(accountVendors.map(av => av.vendor_id))];
      const vendorAccountNumbers = {};
      accountVendors.forEach(av => {
        if (av.vendor_account_number) {
          vendorAccountNumbers[av.vendor_id] = av.vendor_account_number;
        }
      });
      console.log('User has', userVendorIds.length, 'vendors added:', userVendorIds);

      // THEN: Get only those vendors with their brands
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
        `)
        .in('id', userVendorIds);

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
          brands: brandsWithAccountData,
          account_number: vendorAccountNumbers[vendor.id] || null
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
      // First, ensure vendor is added to account_vendors
      await this.addAccountVendor(userId, vendorId);

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
  },

  // Add vendor to user's account
  async addAccountVendor(userId, vendorId, vendorAccountNumber = null) {
    try {
      const { data, error } = await supabase
        .from('account_vendors')
        .upsert({
          account_id: userId,
          vendor_id: vendorId,
          vendor_account_number: vendorAccountNumber,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'account_id,vendor_id',
          ignoreDuplicates: false
        })
        .select()
        .single();

      if (error) throw error;

      console.log(`✅ Added vendor ${vendorId} to account ${userId}`);
      return { success: true, data };
    } catch (error) {
      handleSupabaseError(error, 'addAccountVendor');
    }
  },

  // Remove vendor from user's account
  async removeAccountVendor(userId, vendorId) {
    try {
      const { error } = await supabase
        .from('account_vendors')
        .delete()
        .eq('account_id', userId)
        .eq('vendor_id', vendorId);

      if (error) throw error;

      console.log(`✅ Removed vendor ${vendorId} from account ${userId}`);
      return { success: true };
    } catch (error) {
      handleSupabaseError(error, 'removeAccountVendor');
    }
  },

  // Get vendors and brands from user's inventory that aren't in their account yet
  async getPendingVendorImports(userId) {
    try {
      console.log(`🔍 Getting pending vendor/brand imports for user ${userId}...`);

      // Get all current inventory items for this user
      const { data: inventoryItems, error: inventoryError } = await supabase
        .from('inventory')
        .select('vendor_id, brand, vendors(id, name)')
        .eq('account_id', userId)
        .eq('status', 'current')
        .not('vendor_id', 'is', null);

      if (inventoryError) throw inventoryError;

      if (!inventoryItems || inventoryItems.length === 0) {
        return { vendors: [], brands: [] };
      }

      // Extract unique vendors and brands
      const uniqueVendorIds = [...new Set(inventoryItems.map(item => item.vendor_id).filter(Boolean))];
      const brandsByVendor = {};

      inventoryItems.forEach(item => {
        if (item.brand && item.vendor_id) {
          if (!brandsByVendor[item.vendor_id]) {
            brandsByVendor[item.vendor_id] = new Set();
          }
          brandsByVendor[item.vendor_id].add(item.brand);
        }
      });

      console.log(`📦 Found ${uniqueVendorIds.length} unique vendors in inventory`);

      // Log vendor details from inventory
      const vendorNamesInInventory = inventoryItems
        .filter(item => item.vendor_id)
        .map(item => ({ id: item.vendor_id, name: item.vendors?.name }))
        .filter((v, i, arr) => arr.findIndex(x => x.id === v.id) === i);

      console.log('📋 Vendors in confirmed inventory:');
      vendorNamesInInventory.forEach(v => console.log(`   - ${v.name} (${v.id})`));

      // Get account numbers from orders table for these vendors
      console.log('🔍 Looking up account numbers from orders...');
      const { data: ordersWithAccountNumbers, error: ordersError } = await supabase
        .from('orders')
        .select('vendor_id, account_number')
        .eq('account_id', userId)
        .in('vendor_id', uniqueVendorIds)
        .not('account_number', 'is', null);

      if (ordersError) {
        console.error('Error fetching account numbers from orders:', ordersError);
      }

      // Create a map of vendor account numbers from orders (most recent)
      const vendorAccountNumbersFromOrders = {};
      ordersWithAccountNumbers?.forEach(order => {
        if (order.account_number && order.vendor_id) {
          // Only set if not already set (keeps most recent due to order of query)
          if (!vendorAccountNumbersFromOrders[order.vendor_id]) {
            vendorAccountNumbersFromOrders[order.vendor_id] = order.account_number;
            console.log(`   ✓ Found account number for vendor ${order.vendor_id}: ${order.account_number}`);
          }
        }
      });

      // Check which vendors are NOT in account_vendors
      const { data: existingAccountVendors, error: accountVendorsError } = await supabase
        .from('account_vendors')
        .select('vendor_id, vendor_account_number, vendors(name)')
        .eq('account_id', userId)
        .in('vendor_id', uniqueVendorIds);

      if (accountVendorsError) throw accountVendorsError;

      console.log('✅ Vendors already in account_vendors:');
      existingAccountVendors?.forEach(av => console.log(`   - ${av.vendors?.name} (${av.vendor_id})`));

      const existingVendorIds = existingAccountVendors?.map(av => av.vendor_id) || [];
      const missingVendorIds = uniqueVendorIds.filter(vid => !existingVendorIds.includes(vid));

      // Create a map of vendor account numbers (from existing account_vendors or orders)
      const vendorAccountNumbers = {};
      existingAccountVendors?.forEach(av => {
        if (av.vendor_account_number) {
          vendorAccountNumbers[av.vendor_id] = av.vendor_account_number;
        }
      });

      console.log(`\n🆕 ${missingVendorIds.length} NEW vendors detected (not in account):`);
      missingVendorIds.forEach(vid => {
        const vendorName = inventoryItems.find(item => item.vendor_id === vid)?.vendors?.name;
        console.log(`   - ${vendorName} (${vid})`);
      });

      // Get vendor details for missing vendors
      const vendorsToImport = [];
      for (const vendorId of missingVendorIds) {
        const vendorItem = inventoryItems.find(item => item.vendor_id === vendorId);
        if (vendorItem?.vendors) {
          const brandCount = brandsByVendor[vendorId]?.size || 0;
          // Use account number from orders if available, otherwise from existing account_vendors
          const accountNumber = vendorAccountNumbersFromOrders[vendorId] || vendorAccountNumbers[vendorId] || null;
          vendorsToImport.push({
            id: vendorId,
            name: vendorItem.vendors.name,
            brandCount: brandCount,
            accountNumber: accountNumber
          });

          if (accountNumber) {
            console.log(`   📋 ${vendorItem.vendors.name} will be imported with account number: ${accountNumber}`);
          }
        }
      }

      // Check which brands are NOT in account_brands
      const brandsToImport = [];

      console.log('\n🔍 Checking brands from inventory...');

      for (const [vendorId, brandNamesSet] of Object.entries(brandsByVendor)) {
        const brandNames = Array.from(brandNamesSet);
        const vendorInfo = inventoryItems.find(item => item.vendor_id === vendorId);
        const vendorName = vendorInfo?.vendors?.name || 'Unknown';

        console.log(`\n  Vendor: ${vendorName}`);
        console.log(`  Brands found in inventory: ${brandNames.join(', ')}`);

        for (const brandName of brandNames) {
          // Find brand in global brands table
          const { data: globalBrand } = await supabase
            .from('brands')
            .select('id, name')
            .eq('vendor_id', vendorId)
            .ilike('name', brandName)
            .single();

          if (globalBrand) {
            console.log(`    ✓ "${brandName}" exists in global brands table (${globalBrand.id})`);

            // Check if it's in account_brands
            const { data: accountBrand } = await supabase
              .from('account_brands')
              .select('id')
              .eq('account_id', userId)
              .eq('brand_id', globalBrand.id)
              .single();

            if (!accountBrand) {
              console.log(`      🆕 NEW: "${brandName}" not in user's account_brands - will be imported`);
              brandsToImport.push({
                brand_id: globalBrand.id,
                brand_name: globalBrand.name,
                vendor_id: vendorId,
                vendor_name: vendorName,
                vendor_account_number: vendorAccountNumbers[vendorId] || null
              });
            } else {
              console.log(`      ✅ "${brandName}" already in user's account_brands`);
            }
          } else {
            console.log(`    🆕 NEW: "${brandName}" doesn't exist in global brands table - will be created and imported`);
            brandsToImport.push({
              brand_id: null, // Will be created
              brand_name: brandName,
              vendor_id: vendorId,
              vendor_name: vendorName,
              vendor_account_number: vendorAccountNumbers[vendorId] || null
            });
          }
        }
      }

      console.log(`\n📊 SUMMARY: ${brandsToImport.length} brands ready to import`);
      if (brandsToImport.length > 0) {
        console.log('Brands to import:');
        brandsToImport.forEach(b => console.log(`   - ${b.brand_name} (${b.vendor_name})`));
      }

      return {
        vendors: vendorsToImport,
        brands: brandsToImport
      };
    } catch (error) {
      handleSupabaseError(error, 'getPendingVendorImports');
      return { vendors: [], brands: [] };
    }
  },

  // Import vendors and brands from inventory
  async importVendorsAndBrandsFromInventory(userId, vendorData, brandData) {
    try {
      console.log(`📥 Importing vendors and brands for user ${userId}...`);
      console.log(`  Vendors: ${vendorData?.length || 0}`);
      console.log(`  Brands: ${brandData?.length || 0}`);

      // Add vendors to account_vendors with their account numbers
      for (const vendor of vendorData || []) {
        const vendorId = typeof vendor === 'string' ? vendor : vendor.id;
        const accountNumber = typeof vendor === 'object' ? vendor.accountNumber : null;

        console.log(`  Adding vendor ${vendorId}${accountNumber ? ` with account number ${accountNumber}` : ''}`);
        await this.addAccountVendor(userId, vendorId, accountNumber);
      }

      // Add brands to account_brands (creating them in brands table if needed)
      for (const brand of brandData || []) {
        // Calculate median wholesale price for this brand from user's confirmed inventory
        const median = await calculateMedianWholesalePrice(userId, brand.vendor_id, brand.brand_name);

        // Calculate retail price (MSRP) as 2.5x the wholesale cost for insurance purposes
        const calculatedRetailPrice = median ? median * 2.5 : 0;

        console.log(`  📊 Brand "${brand.brand_name}": ${median ? `Using calculated median $${median.toFixed(2)}` : 'No median available, using 0'}`);
        if (calculatedRetailPrice > 0) {
          console.log(`  💰 Calculated retail price (2.5x): $${calculatedRetailPrice.toFixed(2)}`);
        }

        if (brand.brand_id) {
          // Brand exists in global table, just add to account_brands
          await this.saveAccountBrand(userId, {
            brand_id: brand.brand_id,
            vendor_id: brand.vendor_id,
            wholesale_cost: median || 0, // Use calculated median or 0
            discount_percentage: 45,
            tariff_tax: 0,
            notes: median ? `Auto-calculated from ${brand.brand_name} inventory median` : ''
          });

          // Also update the global brand with calculated retail price if median exists
          if (median && calculatedRetailPrice > 0) {
            await supabase
              .from('brands')
              .update({
                msrp: calculatedRetailPrice
              })
              .eq('id', brand.brand_id);
          }
        } else {
          // Brand doesn't exist, create it first with the median and calculated retail price
          await this.saveAccountBrand(userId, {
            brand_name: brand.brand_name,
            vendor_id: brand.vendor_id,
            wholesale_cost: median || 0, // Use calculated median or 0
            global_wholesale_cost: median || 0, // Also set global wholesale cost
            msrp: calculatedRetailPrice, // Set calculated retail price
            discount_percentage: 45,
            tariff_tax: 0,
            notes: median ? `Auto-calculated from ${brand.brand_name} inventory median` : ''
          });
        }
      }

      console.log(`✅ Import complete`);

      return {
        success: true,
        vendorsAdded: vendorData?.length || 0,
        brandsAdded: brandData?.length || 0
      };
    } catch (error) {
      handleSupabaseError(error, 'importVendorsAndBrandsFromInventory');
      return { success: false, error: error.message };
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

// Database operations for feedback (bug reports and vendor requests)
const feedbackOperations = {
  /**
   * Save a bug report to the database
   * @param {string} accountId - User's account ID
   * @param {string} userEmail - User's email
   * @param {string} title - Bug report title
   * @param {string} description - Bug description
   * @returns {Promise<Object>} The created bug report
   */
  async saveBugReport(accountId, userEmail, title, description) {
    try {
      const { data, error } = await supabase
        .from('bug_reports')
        .insert([
          {
            account_id: accountId,
            user_email: userEmail,
            title,
            description,
            status: 'new'
          }
        ])
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      handleSupabaseError(error, 'saveBugReport');
    }
  },

  /**
   * Save a vendor request to the database
   * @param {string} accountId - User's account ID
   * @param {string} userEmail - User's email
   * @param {string} vendorName - Requested vendor name
   * @param {string|null} vendorWebsite - Vendor website (optional)
   * @param {string} reason - Reason for requesting vendor
   * @returns {Promise<Object>} The created vendor request
   */
  async saveVendorRequest(accountId, userEmail, vendorName, vendorWebsite, reason) {
    try {
      const { data, error } = await supabase
        .from('vendor_requests')
        .insert([
          {
            account_id: accountId,
            user_email: userEmail,
            vendor_name: vendorName,
            vendor_website: vendorWebsite,
            reason,
            status: 'new'
          }
        ])
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      handleSupabaseError(error, 'saveVendorRequest');
    }
  },

  /**
   * Get all bug reports (with optional filtering)
   * @param {string|null} status - Filter by status (optional)
   * @param {number|null} limit - Limit number of results (optional)
   * @returns {Promise<Array>} Array of bug reports
   */
  async getBugReports(status = null, limit = null) {
    try {
      let query = supabase
        .from('bug_reports')
        .select('*')
        .order('created_at', { ascending: false });

      if (status) {
        query = query.eq('status', status);
      }

      if (limit) {
        query = query.limit(parseInt(limit));
      }

      const { data, error } = await query;

      if (error) throw error;
      return data || [];
    } catch (error) {
      handleSupabaseError(error, 'getBugReports');
    }
  },

  /**
   * Get all vendor requests (with optional filtering)
   * @param {string|null} status - Filter by status (optional)
   * @param {number|null} limit - Limit number of results (optional)
   * @returns {Promise<Array>} Array of vendor requests
   */
  async getVendorRequests(status = null, limit = null) {
    try {
      let query = supabase
        .from('vendor_requests')
        .select('*')
        .order('created_at', { ascending: false });

      if (status) {
        query = query.eq('status', status);
      }

      if (limit) {
        query = query.limit(parseInt(limit));
      }

      const { data, error } = await query;

      if (error) throw error;
      return data || [];
    } catch (error) {
      handleSupabaseError(error, 'getVendorRequests');
    }
  },

  /**
   * Update bug report status
   * @param {string} id - Bug report ID
   * @param {string} status - New status
   * @returns {Promise<Object>} Updated bug report
   */
  async updateBugReportStatus(id, status) {
    try {
      const updateData = { status, updated_at: new Date().toISOString() };

      // If status is resolved or closed, set resolved_at timestamp
      if (status === 'resolved' || status === 'closed') {
        updateData.resolved_at = new Date().toISOString();
      }

      const { data, error } = await supabase
        .from('bug_reports')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      handleSupabaseError(error, 'updateBugReportStatus');
    }
  },

  /**
   * Update vendor request status
   * @param {string} id - Vendor request ID
   * @param {string} status - New status
   * @returns {Promise<Object>} Updated vendor request
   */
  async updateVendorRequestStatus(id, status) {
    try {
      const updateData = { status, updated_at: new Date().toISOString() };

      // If status is completed, set completed_at timestamp
      if (status === 'completed') {
        updateData.completed_at = new Date().toISOString();
      }

      const { data, error } = await supabase
        .from('vendor_requests')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      handleSupabaseError(error, 'updateVendorRequestStatus');
    }
  }
};

module.exports = {
  supabase,
  emailOperations,
  inventoryOperations,
  orderOperations,
  statsOperations,
  vendorOperations,
  feedbackOperations,
  checkDuplicateOrder,
  handleSupabaseError
};
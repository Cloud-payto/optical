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
      const { data, error } = await supabase
        .from('account_brands')
        .upsert(
          { 
            account_id: accountId,
            vendor_id: vendorId,
            vendor_account_number: vendorAccountNumber
          },
          { 
            onConflict: 'account_id,vendor_id',
            ignoreDuplicates: false 
          }
        )
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      handleSupabaseError(error, 'saveOrUpdateVendorAccountNumber');
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

  async confirmPendingOrder(orderNumber, userId) {
    try {
      // First, find the order with vendor information
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .select('id, vendor_id, vendors(name)')
        .eq('order_number', orderNumber)
        .eq('account_id', userId)
        .single();

      if (orderError || !order) {
        throw new Error(`Order not found: ${orderNumber}`);
      }

      // Get pending inventory items for this order
      const { data: pendingItems, error: fetchError } = await supabase
        .from('inventory')
        .select('*')
        .eq('order_id', order.id)
        .eq('account_id', userId)
        .eq('status', 'pending');

      if (fetchError) throw fetchError;

      let enrichedItems = pendingItems;

      // Apply Modern Optical web enrichment if applicable
      const vendorName = order.vendors?.name;
      if (vendorName === 'Modern Optical') {
        try {
          console.log('🌐 Applying Modern Optical web enrichment...');
          const parserRegistry = require('../parsers');
          const modernOpticalService = parserRegistry.getModernOpticalService();

          // Enrich items with web data (UPC, wholesale price, MSRP)
          enrichedItems = await modernOpticalService.enrichPendingItems(pendingItems);
          console.log(`✅ Web enrichment completed for ${enrichedItems.length} items`);

        } catch (enrichmentError) {
          console.error('⚠️ Web enrichment failed, proceeding without enrichment:', enrichmentError.message);
          // Continue with original items if enrichment fails
          enrichedItems = pendingItems;
        }
      }

      // Update each item with enriched data and confirmed status
      const updatePromises = enrichedItems.map(enrichedItem =>
        supabase
          .from('inventory')
          .update({
            status: 'confirmed',
            upc: enrichedItem.upc || null,
            wholesale_price: enrichedItem.wholesale_price || null,
            msrp: enrichedItem.msrp || null,
            in_stock: enrichedItem.in_stock || null,
            api_verified: enrichedItem.api_verified || false,
            enriched_data: enrichedItem.enriched_data || null
          })
          .eq('id', enrichedItem.id)
          .select()
      );

      const results = await Promise.all(updatePromises);
      const updatedItems = results.map(r => r.data?.[0]).filter(Boolean);

      // Update order status to 'confirmed' after all items are confirmed
      await supabase
        .from('orders')
        .update({ status: 'confirmed' })
        .eq('id', order.id);

      return updatedItems;
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
      const { data, error } = await supabase
        .from('orders')
        .insert([orderData])
        .select()
        .single();
      
      if (error) throw error;
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
      const { error } = await supabase
        .from('orders')
        .delete()
        .eq('id', orderId)
        .eq('account_id', userId);

      if (error) throw error;
      return { success: true };
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
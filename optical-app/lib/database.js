import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing Supabase environment variables');
}

// Use service role key for server-side operations
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Database connection wrapper for Supabase
export async function query(text, params = []) {
  try {
    // Convert parameterized query to Supabase format
    let supabaseQuery = text;
    
    // Replace PostgreSQL-style parameters ($1, $2, etc.) with actual values
    if (params && params.length > 0) {
      params.forEach((param, index) => {
        const placeholder = `$${index + 1}`;
        let value = param;
        
        // Handle different data types
        if (typeof param === 'string') {
          value = `'${param.replace(/'/g, "''")}'`; // Escape single quotes
        } else if (param === null || param === undefined) {
          value = 'NULL';
        } else if (typeof param === 'object') {
          value = `'${JSON.stringify(param)}'`;
        }
        
        supabaseQuery = supabaseQuery.replace(placeholder, value);
      });
    }
    
    const { data, error } = await supabase.rpc('execute_sql', { sql_query: supabaseQuery });
    
    if (error) {
      throw error;
    }
    
    return { rows: data || [] };
  } catch (error) {
    console.error('Database query error:', error);
    throw error;
  }
}

// Alternative approach using Supabase table methods
export async function supabaseQuery(table) {
  return supabase.from(table);
}

// Account management
export async function createAccount(data) {
  const { name, businessName, email, phone, address, city, state, zipCode, country, timezone } = data;
  
  const { data: result, error } = await supabase
    .from('accounts')
    .insert({
      name,
      business_name: businessName,
      email,
      phone,
      address,
      city,
      state,
      zip_code: zipCode,
      country,
      timezone
    })
    .select()
    .single();
  
  if (error) throw error;
  return result;
}

// User management
export async function createUser(accountId, userData) {
  const { email, password, firstName, lastName, role = 'user' } = userData;
  const passwordHash = await bcrypt.hash(password, 10);
  
  const { data: result, error } = await supabase
    .from('users')
    .insert({
      account_id: accountId,
      email,
      password_hash: passwordHash,
      first_name: firstName,
      last_name: lastName,
      role
    })
    .select('id, account_id, email, first_name, last_name, role, created_at')
    .single();
  
  if (error) throw error;
  return result;
}

export async function getUserByEmail(email) {
  const { data: result, error } = await supabase
    .from('users')
    .select(`
      *,
      accounts!inner(name, status)
    `)
    .eq('email', email)
    .eq('is_active', true)
    .single();
  
  if (error && error.code !== 'PGRST116') throw error; // PGRST116 = no rows
  return result;
}

export async function validatePassword(password, passwordHash) {
  return bcrypt.compare(password, passwordHash);
}

// Email management
export async function saveEmail(accountId, rawData, emailData) {
  const {
    from, to, subject, date, message_id, plain_text, html_text,
    spam_score, spam_status, attachments_count
  } = emailData;
  
  const { data: result, error } = await supabase
    .from('emails')
    .insert({
      account_id: accountId,
      message_id,
      from_email: from,
      to_email: to,
      subject,
      received_at: date,
      raw_data: typeof rawData === 'string' ? JSON.parse(rawData) : rawData,
      plain_text,
      html_text,
      attachments_count,
      spam_score,
      spam_status
    })
    .select('id')
    .single();
  
  if (error) throw error;
  return { emailId: result.id };
}

export async function getEmailsByAccount(accountId) {
  const { data: result, error } = await supabase
    .from('emails')
    .select(`
      *,
      vendors(name)
    `)
    .eq('account_id', accountId)
    .order('received_at', { ascending: false })
    .limit(100);
  
  if (error) throw error;
  return result;
}

export async function updateEmailWithParsedData(emailId, parsedData) {
  const { data: result, error } = await supabase
    .from('emails')
    .update({
      parsed_data: parsedData,
      parse_status: 'parsed',
      updated_at: new Date().toISOString()
    })
    .eq('id', emailId)
    .select()
    .single();
  
  if (error) throw error;
  return result;
}

// Order management
export async function checkDuplicateOrder(accountId, orderNumber, customerName, accountNumber) {
  const { data: result, error } = await supabase
    .from('orders')
    .select('id, order_number, customer_name, created_at')
    .eq('account_id', accountId)
    .eq('order_number', orderNumber)
    .eq('customer_name', customerName)
    .eq('account_number', accountNumber);
  
  if (error) throw error;
  
  if (result && result.length > 0) {
    const order = result[0];
    return {
      isDuplicate: true,
      message: `Order ${orderNumber} for ${customerName} already exists (created ${order.created_at})`,
      existingOrderId: order.id
    };
  }
  
  return { isDuplicate: false };
}

export async function createOrder(orderData) {
  const {
    account_id, vendor_id, email_id, order_number, reference_number,
    account_number, customer_name, customer_code, customer_phone,
    placed_by, order_date, total_pieces, total_amount
  } = orderData;
  
  const { data: result, error } = await supabase
    .from('orders')
    .insert({
      account_id,
      vendor_id,
      email_id,
      order_number,
      reference_number,
      account_number,
      customer_name,
      customer_code,
      customer_phone,
      placed_by,
      order_date,
      total_pieces,
      total_amount
    })
    .select()
    .single();
  
  if (error) throw error;
  return result;
}

// Inventory management
export async function saveInventoryItems(accountId, items) {
  const inventoryItems = items.map(item => ({
    account_id: accountId,
    vendor_id: item.vendor_id || null,
    order_id: item.order_id || null,
    email_id: item.email_id || null,
    sku: item.sku,
    brand: item.brand,
    model: item.model,
    color: item.color,
    color_code: item.color_code,
    color_name: item.color_name,
    size: item.size,
    full_size: item.full_size,
    temple_length: item.temple_length,
    quantity: item.quantity || 1,
    status: item.status || 'pending',
    upc: item.upc || null,
    ean: item.ean || null,
    material: item.material || null,
    country_of_origin: item.country_of_origin || null,
    wholesale_price: item.wholesale_price || null,
    msrp: item.msrp || null,
    api_verified: item.api_verified || false,
    confidence_score: item.confidence_score || null,
    validation_reason: item.validation_reason || null,
    in_stock: item.in_stock || null,
    availability: item.availability || null,
    enriched_data: item.enriched_data || {}
  }));
  
  const { data: result, error } = await supabase
    .from('inventory')
    .insert(inventoryItems)
    .select('id');
  
  if (error) throw error;
  return result;
}

export async function getInventoryByAccount(accountId, filters = {}) {
  let query = supabase
    .from('inventory')
    .select(`
      *,
      vendors(name),
      orders(order_number)
    `)
    .eq('account_id', accountId);
  
  if (filters.vendor_id) {
    query = query.eq('vendor_id', filters.vendor_id);
  }
  
  if (filters.status) {
    query = query.eq('status', filters.status);
  }
  
  if (filters.brand) {
    query = query.eq('brand', filters.brand);
  }
  
  const { data: result, error } = await query
    .order('created_at', { ascending: false })
    .limit(500);
  
  if (error) throw error;
  return result;
}

// Dashboard statistics
export async function getDashboardStats(accountId) {
  const stats = {};
  
  // Total orders
  const { count: totalOrders } = await supabase
    .from('orders')
    .select('*', { count: 'exact', head: true })
    .eq('account_id', accountId);
  stats.totalOrders = totalOrders || 0;
  
  // Total inventory
  const { data: inventoryData } = await supabase
    .from('inventory')
    .select('quantity')
    .eq('account_id', accountId);
  stats.totalInventory = inventoryData?.reduce((sum, item) => sum + (item.quantity || 0), 0) || 0;
  
  // Total value
  const { data: valueData } = await supabase
    .from('inventory')
    .select('quantity, wholesale_price')
    .eq('account_id', accountId)
    .not('wholesale_price', 'is', null);
  stats.totalValue = valueData?.reduce((sum, item) => {
    return sum + ((item.quantity || 0) * (item.wholesale_price || 0));
  }, 0) || 0;
  
  // Pending items
  const { count: pendingItems } = await supabase
    .from('inventory')
    .select('*', { count: 'exact', head: true })
    .eq('account_id', accountId)
    .eq('status', 'pending');
  stats.pendingItems = pendingItems || 0;
  
  return stats;
}

// Vendor management
export async function getVendors() {
  const { data: result, error } = await supabase
    .from('vendors')
    .select('*')
    .eq('is_active', true)
    .order('name');
  
  if (error) throw error;
  return result;
}

export async function getVendorByDomain(domain) {
  const { data: result, error } = await supabase
    .from('vendors')
    .select('*')
    .eq('domain', domain)
    .eq('is_active', true)
    .single();
  
  if (error && error.code !== 'PGRST116') throw error;
  return result;
}
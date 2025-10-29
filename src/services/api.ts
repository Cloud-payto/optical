// API service for backend communication
import { getApiEndpoint } from '../lib/api-config';
import { supabase } from '../lib/supabase';

// Helper function to get current user ID (async)
async function getCurrentUserId(): Promise<string> {
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) {
    throw new Error('User not authenticated. Please log in to continue.');
  }
  return user.id;
}

// Helper function to get current user ID from session (async)
async function getCurrentUserIdFromSession(): Promise<string> {
  const { data: { session }, error } = await supabase.auth.getSession();
  console.log('🔥 DEBUG: getCurrentUserIdFromSession - session:', session);
  console.log('🔥 DEBUG: getCurrentUserIdFromSession - error:', error);
  
  if (error || !session?.user) {
    console.log('🔥 DEBUG: User not authenticated, session:', session, 'error:', error);
    throw new Error('User not authenticated. Please log in to continue.');
  }
  
  console.log('🔥 DEBUG: Current user ID:', session.user.id);
  return session.user.id;
}

// Generic API request function with auth headers
async function apiRequest<T>(endpoint: string, options?: RequestInit): Promise<T> {
  try {
    // Get current session for auth token with error handling
    let session = null;
    try {
      const { data, error } = await supabase.auth.getSession();
      if (error) {
        console.warn('Failed to get session for API request:', error);
      } else {
        session = data.session;
      }
    } catch (sessionError) {
      console.warn('Session retrieval failed, proceeding without auth:', sessionError);
    }
    
    const response = await fetch(getApiEndpoint(endpoint), {
      headers: {
        'Content-Type': 'application/json',
        ...(session?.access_token && {
          'Authorization': `Bearer ${session.access_token}`,
        }),
        ...options?.headers,
      },
      ...options,
    });

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('Authentication required. Please log in again.');
      }
      throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error(`API request failed for ${endpoint}:`, error);
    throw error;
  }
}

// Email API functions
export interface EmailData {
  id: string; // UUID format
  from_email: string;
  to_email: string;
  subject: string;
  attachments_count: number;
  spam_score: number;
  received_at: string; // Changed from processed_at to match database
  created_at?: string;
  parse_status?: string;
  parsed_data?: {
    vendor: string;
    account_number: string;
    brands?: string[];
    order: {
      order_number: string;
      vendor: string;
      customer_name: string;
      total_pieces: number;
      order_date?: string; // Add order_date field
      rep_name?: string;
    };
    items: Array<{
      sku: string;
      brand: string;
      model: string;
      color: string;
      size: string;
      quantity: number;
    }>;
  };
}

export interface EmailResponse {
  success: boolean;
  count: number;
  emails: EmailData[];
}

export async function fetchEmails(userId?: string): Promise<EmailResponse> {
  const currentUserId = userId || await getCurrentUserIdFromSession();
  return apiRequest<EmailResponse>(`/emails/${currentUserId}`);
}

// Inventory API functions
export interface InventoryItem {
  id: string; // UUID format
  account_id: string; // UUID format
  sku: string;
  brand?: string;
  model?: string;
  color?: string;
  color_code?: string;
  color_name?: string;
  size?: string;
  full_size?: string;
  temple_length?: string;
  quantity: number;
  vendor?: {
    name?: string;
  };
  order?: {
    order_number?: string;
    order_date?: string;
    customer_name?: string;
  };
  status?: string;
  order_number?: string; // Legacy field
  account_number?: string;
  email_id?: string; // UUID format
  full_name?: string;
  wholesale_price?: number;
  upc?: string;
  in_stock?: boolean;
  api_verified?: boolean;
  created_at: string;
  updated_at: string;
}

export interface InventoryResponse {
  success: boolean;
  count: number;
  inventory: InventoryItem[];
}

export async function fetchInventory(userId?: string): Promise<InventoryResponse> {
  const currentUserId = userId || await getCurrentUserIdFromSession();
  return apiRequest<InventoryResponse>(`/inventory/${currentUserId}`);
}

// Mark inventory as received (placeholder for future implementation)
export async function markAsReceived(emailId: number, userId?: string): Promise<{ success: boolean }> {
  const currentUserId = userId || await getCurrentUserIdFromSession();
  return apiRequest<{ success: boolean }>(`/emails/${currentUserId}/${emailId}/received`, {
    method: 'POST',
  });
}

// Delete functions
export async function deleteEmail(emailId: string, userId?: string): Promise<{ success: boolean; message: string }> {
  const currentUserId = userId || await getCurrentUserIdFromSession();
  return apiRequest<{ success: boolean; message: string }>(`/emails/${currentUserId}/${emailId}`, {
    method: 'DELETE',
  });
}

export async function deleteInventoryItem(itemId: string, userId?: string): Promise<{ success: boolean; message: string }> {
  const currentUserId = userId || await getCurrentUserIdFromSession();
  return apiRequest<{ success: boolean; message: string }>(`/inventory/${currentUserId}/${itemId}`, {
    method: 'DELETE',
  });
}

// New inventory workflow functions
export async function confirmPendingOrder(orderNumber: string, userId?: string): Promise<{ success: boolean; message: string; updatedCount: number }> {
  const currentUserId = userId || await getCurrentUserIdFromSession();
  return apiRequest<{ success: boolean; message: string; updatedCount: number }>(`/inventory/${currentUserId}/confirm/${orderNumber}`, {
    method: 'POST',
  });
}

export async function archiveInventoryItem(itemId: string, userId?: string): Promise<{ success: boolean; message: string; item: InventoryItem }> {
  const currentUserId = userId || await getCurrentUserIdFromSession();
  return apiRequest<{ success: boolean; message: string; item: InventoryItem }>(`/inventory/${currentUserId}/${itemId}/archive`, {
    method: 'PUT',
  });
}

export async function restoreInventoryItem(itemId: string, userId?: string): Promise<{ success: boolean; message: string; item: InventoryItem }> {
  const currentUserId = userId || await getCurrentUserIdFromSession();
  return apiRequest<{ success: boolean; message: string; item: InventoryItem }>(`/inventory/${currentUserId}/${itemId}/restore`, {
    method: 'PUT',
  });
}

export async function archiveAllItemsByBrand(brandName: string, vendorName: string, userId?: string): Promise<{ success: boolean; message: string; archivedCount: number }> {
  const currentUserId = userId || await getCurrentUserIdFromSession();
  return apiRequest<{ success: boolean; message: string; archivedCount: number }>(`/inventory/${currentUserId}/archive-brand`, {
    method: 'PUT',
    body: JSON.stringify({ brandName, vendorName }),
  });
}

// Orders API functions
export interface OrderData {
  id: number;
  account_id: number;
  order_number: string;
  vendor: string;
  email_id: number;
  total_items: number;
  customer_name?: string;
  account_number?: string;
  rep_name?: string;
  order_date?: string;
  confirmed_at: string;
  status: string;
  items: Array<{
    id: number;
    sku: string;
    brand: string;
    model: string;
    color: string;
    size: string;
    quantity: number;
    vendor: string;
  }>;
}

export interface OrderResponse {
  success: boolean;
  count?: number;
  orders?: OrderData[];
  order?: OrderData;
  error?: string;
}

export async function fetchOrders(userId?: string): Promise<OrderResponse> {
  const currentUserId = userId || await getCurrentUserIdFromSession();
  return apiRequest<OrderResponse>(`/orders/${currentUserId}`);
}

export async function fetchOrderById(orderId: number, userId?: string): Promise<OrderResponse> {
  const currentUserId = userId || await getCurrentUserIdFromSession();
  return apiRequest<OrderResponse>(`/orders/${currentUserId}/${orderId}`);
}

export async function archiveOrder(orderId: number, userId?: string): Promise<{ success: boolean; message: string; order: OrderData }> {
  const currentUserId = userId || await getCurrentUserIdFromSession();
  return apiRequest<{ success: boolean; message: string; order: OrderData }>(`/orders/${currentUserId}/${orderId}/archive`, {
    method: 'PUT',
  });
}

export async function deleteOrder(orderId: number, userId?: string): Promise<{ success: boolean; message: string }> {
  const currentUserId = userId || await getCurrentUserIdFromSession();
  return apiRequest<{ success: boolean; message: string }>(`/orders/${currentUserId}/${orderId}`, {
    method: 'DELETE',
  });
}

export async function deleteArchivedItemsByBrand(brandName: string, vendorName: string, userId?: string): Promise<{ success: boolean; message: string; deletedCount: number }> {
  const currentUserId = userId || await getCurrentUserIdFromSession();
  return apiRequest<{ success: boolean; message: string; deletedCount: number }>(`/inventory/${currentUserId}/delete-archived-brand`, {
    method: 'DELETE',
    body: JSON.stringify({ brandName, vendorName }),
  });
}

export async function deleteArchivedItemsByVendor(vendorName: string, userId?: string): Promise<{ success: boolean; message: string; deletedCount: number }> {
  const currentUserId = userId || await getCurrentUserIdFromSession();
  return apiRequest<{ success: boolean; message: string; deletedCount: number }>(`/inventory/${currentUserId}/delete-archived-vendor`, {
    method: 'DELETE',
    body: JSON.stringify({ vendorName }),
  });
}

export async function markItemAsSold(itemId: string, userId?: string): Promise<{ success: boolean; message: string; item: InventoryItem }> {
  const currentUserId = userId || await getCurrentUserIdFromSession();
  return apiRequest<{ success: boolean; message: string; item: InventoryItem }>(`/inventory/${currentUserId}/${itemId}/sold`, {
    method: 'PUT',
  });
}

// Vendor API functions
export interface Vendor {
  id: string;
  name: string;
  segment: string;
  brands?: string;
  discount?: string;
  min_order?: string;
  payment_terms?: string;
  free_shipping?: boolean;
  buying_groups?: string;
  website?: string;
  contact_email?: string;
  contact_phone?: string;
  support_email?: string;
  support_phone?: string;
  rep_name?: string;
  rep_email?: string;
  rep_phone?: string;
}

export interface Brand {
  id: string;
  name: string;
  vendor_id: string;
  wholesale_cost?: number;
  wholesaleCost?: number; // camelCase version
  your_cost?: number;
  yourCost?: number; // camelCase version
  tariff_tax?: number;
  tariffTax?: number; // camelCase version
  retailPrice?: number; // Add retailPrice field
  vendor?: { name: string };
  notes?: string;
}

export interface Company {
  id: string;
  name: string;
  brands: Brand[];
  contactInfo?: {
    companyEmail?: string;
    companyPhone?: string;
    supportEmail?: string;
    supportPhone?: string;
    website?: string;
    repName?: string;
    repEmail?: string;
    repPhone?: string;
  };
}

export interface AccountBrand {
  id: string;
  account_id: string;
  vendor_id: string;
  brand_id?: string;
  discount_percentage?: number;
  wholesale_cost?: number;
  tariff_tax?: number;
  notes?: string;
  vendor?: Vendor;
  brand?: Brand;
}

// Keep the old interface for backward compatibility during transition
export interface UserVendorPricing extends AccountBrand {
  user_id: string;
  your_cost?: number;
}

export async function fetchVendors(): Promise<Vendor[]> {
  return apiRequest<Vendor[]>('/vendors');
}

export async function fetchVendorById(vendorId: string): Promise<Vendor> {
  return apiRequest<Vendor>(`/vendors/${vendorId}`);
}

export async function fetchAllBrands(): Promise<Brand[]> {
  return apiRequest<Brand[]>('/vendors/brands/all');
}

export async function fetchBrandsByVendor(vendorId: string): Promise<Brand[]> {
  return apiRequest<Brand[]>(`/vendors/${vendorId}/brands`);
}

export async function fetchAccountBrands(userId?: string): Promise<UserVendorPricing[]> {
  const currentUserId = userId || await getCurrentUserIdFromSession();
  return apiRequest<UserVendorPricing[]>(`/vendors/pricing/${currentUserId}`);
}

export async function saveAccountBrand(brandData: Partial<UserVendorPricing>, userId?: string): Promise<UserVendorPricing[]> {
  const currentUserId = userId || await getCurrentUserIdFromSession();
  console.log('🔥 DEBUG: saveAccountBrand API call');
  console.log('🔥 DEBUG: currentUserId:', currentUserId);
  console.log('🔥 DEBUG: brandData being sent to API:', brandData);
  
  const result = await apiRequest<UserVendorPricing[]>(`/vendors/pricing/${currentUserId}`, {
    method: 'POST',
    body: JSON.stringify(brandData),
  });
  
  console.log('🔥 DEBUG: API response received:', result);
  return result;
}

export async function fetchCompaniesWithPricing(userId?: string): Promise<Company[]> {
  const currentUserId = userId || await getCurrentUserIdFromSession();
  return apiRequest<Company[]>(`/vendors/companies/${currentUserId}`);
}

// Pending vendor/brand imports from inventory
export interface PendingImport {
  vendors: Array<{
    id: string;
    name: string;
    brandCount: number;
  }>;
  brands: Array<{
    brand_id: string | null;
    brand_name: string;
    vendor_id: string;
    vendor_name: string;
  }>;
}

export async function fetchPendingImports(userId?: string): Promise<PendingImport> {
  const currentUserId = userId || await getCurrentUserIdFromSession();
  return apiRequest<PendingImport>(`/vendors/pending-imports/${currentUserId}`);
}

export async function importFromInventory(vendorIds: string[], brandData: any[], userId?: string): Promise<{ success: boolean; vendorsAdded: number; brandsAdded: number }> {
  const currentUserId = userId || await getCurrentUserIdFromSession();
  return apiRequest<{ success: boolean; vendorsAdded: number; brandsAdded: number }>(`/vendors/import-from-inventory/${currentUserId}`, {
    method: 'POST',
    body: JSON.stringify({ vendorIds, brandData }),
  });
}

// Health check
export interface HealthResponse {
  status: string;
  message: string;
  timestamp: string;
}

export async function checkHealth(): Promise<HealthResponse> {
  return apiRequest<HealthResponse>('/health');
}

// Dashboard Stats API functions
export interface DashboardStats {
  totalOrders: number;
  totalInventory: number;
  totalValue: number;
  pendingItems: number;
  itemsWithMissingPrices: number;
}

export interface BrandStats {
  brandName: string;
  itemCount: number;
  totalValue: number;
}

export interface VendorInventoryStats {
  vendorId: string;
  vendorName: string;
  totalItems: number;
  totalValue: number;
  brands: BrandStats[];
}

export interface PaginationMetadata {
  totalCount: number;
  totalPages: number;
  currentPage: number;
  pageSize: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface SortOptions {
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  page?: number;
  pageSize?: number;
}

export interface InventoryByVendorResponse {
  vendors: VendorInventoryStats[];
  pagination: PaginationMetadata;
}

export async function fetchDashboardStats(userId?: string): Promise<DashboardStats> {
  const currentUserId = userId || await getCurrentUserIdFromSession();
  const response = await apiRequest<{ success: boolean; stats: DashboardStats }>(`/stats/${currentUserId}`);
  return response.stats;
}

export async function fetchInventoryByVendor(
  userId?: string,
  options?: SortOptions
): Promise<InventoryByVendorResponse> {
  const currentUserId = userId || await getCurrentUserIdFromSession();

  // Build query string from options
  const params = new URLSearchParams();
  if (options?.sortBy) params.append('sortBy', options.sortBy);
  if (options?.sortOrder) params.append('sortOrder', options.sortOrder);
  if (options?.page) params.append('page', options.page.toString());
  if (options?.pageSize) params.append('pageSize', options.pageSize.toString());

  const queryString = params.toString();
  const endpoint = `/stats/${currentUserId}/inventory-by-vendor${queryString ? `?${queryString}` : ''}`;

  const response = await apiRequest<{
    success: boolean;
    vendors: VendorInventoryStats[];
    pagination: PaginationMetadata;
  }>(endpoint);

  return {
    vendors: response.vendors,
    pagination: response.pagination
  };
}
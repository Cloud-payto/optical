// API service for backend communication
import { getApiEndpoint } from '../lib/api-config';
import { supabase } from '../lib/supabase';

// Helper function to get current user ID
function getCurrentUserId(): string {
  const { data: { user } } = supabase.auth.getUser();
  if (!user) {
    throw new Error('User not authenticated. Please log in to continue.');
  }
  return user.id;
}

// Helper function to get current user ID synchronously from session
function getCurrentUserIdSync(): string {
  const { data: { session } } = supabase.auth.getSession();
  if (!session?.user) {
    throw new Error('User not authenticated. Please log in to continue.');
  }
  return session.user.id;
}

// Generic API request function with auth headers
async function apiRequest<T>(endpoint: string, options?: RequestInit): Promise<T> {
  try {
    // Get current session for auth token
    const { data: { session } } = await supabase.auth.getSession();
    
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
  id: number;
  from_email: string;
  to_email: string;
  subject: string;
  attachments_count: number;
  spam_score: number;
  processed_at: string;
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
  const currentUserId = userId || getCurrentUserIdSync();
  return apiRequest<EmailResponse>(`/emails/${currentUserId}`);
}

// Inventory API functions
export interface InventoryItem {
  id: number;
  account_id: number;
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
  vendor: string;
  status?: string;
  order_number?: string;
  account_number?: string;
  email_id?: number;
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
  const currentUserId = userId || getCurrentUserIdSync();
  return apiRequest<InventoryResponse>(`/inventory/${currentUserId}`);
}

// Mark inventory as received (placeholder for future implementation)
export async function markAsReceived(emailId: number, userId?: string): Promise<{ success: boolean }> {
  const currentUserId = userId || getCurrentUserIdSync();
  return apiRequest<{ success: boolean }>(`/emails/${currentUserId}/${emailId}/received`, {
    method: 'POST',
  });
}

// Delete functions
export async function deleteEmail(emailId: number, userId?: string): Promise<{ success: boolean; message: string }> {
  const currentUserId = userId || getCurrentUserIdSync();
  return apiRequest<{ success: boolean; message: string }>(`/emails/${currentUserId}/${emailId}`, {
    method: 'DELETE',
  });
}

export async function deleteInventoryItem(itemId: number, userId?: string): Promise<{ success: boolean; message: string }> {
  const currentUserId = userId || getCurrentUserIdSync();
  return apiRequest<{ success: boolean; message: string }>(`/inventory/${currentUserId}/${itemId}`, {
    method: 'DELETE',
  });
}

// New inventory workflow functions
export async function confirmPendingOrder(orderNumber: string, userId?: string): Promise<{ success: boolean; message: string; updatedCount: number }> {
  const currentUserId = userId || getCurrentUserIdSync();
  return apiRequest<{ success: boolean; message: string; updatedCount: number }>(`/inventory/${currentUserId}/confirm/${orderNumber}`, {
    method: 'POST',
  });
}

export async function archiveInventoryItem(itemId: number, userId?: string): Promise<{ success: boolean; message: string; item: InventoryItem }> {
  const currentUserId = userId || getCurrentUserIdSync();
  return apiRequest<{ success: boolean; message: string; item: InventoryItem }>(`/inventory/${currentUserId}/${itemId}/archive`, {
    method: 'PUT',
  });
}

export async function restoreInventoryItem(itemId: number, userId?: string): Promise<{ success: boolean; message: string; item: InventoryItem }> {
  const currentUserId = userId || getCurrentUserIdSync();
  return apiRequest<{ success: boolean; message: string; item: InventoryItem }>(`/inventory/${currentUserId}/${itemId}/restore`, {
    method: 'PUT',
  });
}

export async function archiveAllItemsByBrand(brandName: string, vendorName: string, userId?: string): Promise<{ success: boolean; message: string; archivedCount: number }> {
  const currentUserId = userId || getCurrentUserIdSync();
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
  const currentUserId = userId || getCurrentUserIdSync();
  return apiRequest<OrderResponse>(`/orders/${currentUserId}`);
}

export async function fetchOrderById(orderId: number, userId?: string): Promise<OrderResponse> {
  const currentUserId = userId || getCurrentUserIdSync();
  return apiRequest<OrderResponse>(`/orders/${currentUserId}/${orderId}`);
}

export async function archiveOrder(orderId: number, userId?: string): Promise<{ success: boolean; message: string; order: OrderData }> {
  const currentUserId = userId || getCurrentUserIdSync();
  return apiRequest<{ success: boolean; message: string; order: OrderData }>(`/orders/${currentUserId}/${orderId}/archive`, {
    method: 'PUT',
  });
}

export async function deleteOrder(orderId: number, userId?: string): Promise<{ success: boolean; message: string }> {
  const currentUserId = userId || getCurrentUserIdSync();
  return apiRequest<{ success: boolean; message: string }>(`/orders/${currentUserId}/${orderId}`, {
    method: 'DELETE',
  });
}

export async function deleteArchivedItemsByBrand(brandName: string, vendorName: string, userId?: string): Promise<{ success: boolean; message: string; deletedCount: number }> {
  const currentUserId = userId || getCurrentUserIdSync();
  return apiRequest<{ success: boolean; message: string; deletedCount: number }>(`/inventory/${currentUserId}/delete-archived-brand`, {
    method: 'DELETE',
    body: JSON.stringify({ brandName, vendorName }),
  });
}

export async function deleteArchivedItemsByVendor(vendorName: string, userId?: string): Promise<{ success: boolean; message: string; deletedCount: number }> {
  const currentUserId = userId || getCurrentUserIdSync();
  return apiRequest<{ success: boolean; message: string; deletedCount: number }>(`/inventory/${currentUserId}/delete-archived-vendor`, {
    method: 'DELETE',
    body: JSON.stringify({ vendorName }),
  });
}

export async function markItemAsSold(itemId: number, userId?: string): Promise<{ success: boolean; message: string; item: InventoryItem }> {
  const currentUserId = userId || getCurrentUserIdSync();
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
  your_cost?: number;
  tariff_tax?: number;
  vendor?: { name: string };
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

export interface UserVendorPricing {
  id: string;
  user_id: string;
  vendor_id: string;
  brand_id?: string;
  discount_percentage?: number;
  your_cost?: number;
  wholesale_cost?: number;
  tariff_tax?: number;
  vendor?: Vendor;
  brand?: Brand;
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

export async function fetchUserVendorPricing(userId?: string): Promise<UserVendorPricing[]> {
  const currentUserId = userId || getCurrentUserIdSync();
  return apiRequest<UserVendorPricing[]>(`/vendors/pricing/${currentUserId}`);
}

export async function saveUserVendorPricing(pricingData: Partial<UserVendorPricing>, userId?: string): Promise<UserVendorPricing[]> {
  const currentUserId = userId || getCurrentUserIdSync();
  return apiRequest<UserVendorPricing[]>(`/vendors/pricing/${currentUserId}`, {
    method: 'POST',
    body: JSON.stringify(pricingData),
  });
}

export async function fetchCompaniesWithPricing(userId?: string): Promise<Company[]> {
  const currentUserId = userId || getCurrentUserIdSync();
  return apiRequest<Company[]>(`/vendors/companies/${currentUserId}`);
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
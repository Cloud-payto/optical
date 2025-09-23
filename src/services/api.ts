// API service for backend communication
import { getApiEndpoint } from '@/lib/api-config';

// Default account ID (since we're using a single test account for now)
const DEFAULT_ACCOUNT_ID = 1;

// Generic API request function
async function apiRequest<T>(endpoint: string, options?: RequestInit): Promise<T> {
  try {
    const response = await fetch(getApiEndpoint(endpoint), {
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
      ...options,
    });

    if (!response.ok) {
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

export async function fetchEmails(accountId: number = DEFAULT_ACCOUNT_ID): Promise<EmailResponse> {
  return apiRequest<EmailResponse>(`/emails/${accountId}`);
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

export async function fetchInventory(accountId: number = DEFAULT_ACCOUNT_ID): Promise<InventoryResponse> {
  return apiRequest<InventoryResponse>(`/inventory/${accountId}`);
}

// Mark inventory as received (placeholder for future implementation)
export async function markAsReceived(emailId: number): Promise<{ success: boolean }> {
  return apiRequest<{ success: boolean }>(`/emails/${emailId}/received`, {
    method: 'POST',
  });
}

// Delete functions
export async function deleteEmail(emailId: number, accountId: number = DEFAULT_ACCOUNT_ID): Promise<{ success: boolean; message: string }> {
  return apiRequest<{ success: boolean; message: string }>(`/emails/${accountId}/${emailId}`, {
    method: 'DELETE',
  });
}

export async function deleteInventoryItem(itemId: number, accountId: number = DEFAULT_ACCOUNT_ID): Promise<{ success: boolean; message: string }> {
  return apiRequest<{ success: boolean; message: string }>(`/inventory/${accountId}/${itemId}`, {
    method: 'DELETE',
  });
}

// New inventory workflow functions
export async function confirmPendingOrder(orderNumber: string, accountId: number = DEFAULT_ACCOUNT_ID): Promise<{ success: boolean; message: string; updatedCount: number }> {
  return apiRequest<{ success: boolean; message: string; updatedCount: number }>(`/inventory/${accountId}/confirm/${orderNumber}`, {
    method: 'POST',
  });
}

export async function archiveInventoryItem(itemId: number, accountId: number = DEFAULT_ACCOUNT_ID): Promise<{ success: boolean; message: string; item: InventoryItem }> {
  return apiRequest<{ success: boolean; message: string; item: InventoryItem }>(`/inventory/${accountId}/${itemId}/archive`, {
    method: 'PUT',
  });
}

export async function restoreInventoryItem(itemId: number, accountId: number = DEFAULT_ACCOUNT_ID): Promise<{ success: boolean; message: string; item: InventoryItem }> {
  return apiRequest<{ success: boolean; message: string; item: InventoryItem }>(`/inventory/${accountId}/${itemId}/restore`, {
    method: 'PUT',
  });
}

export async function archiveAllItemsByBrand(brandName: string, vendorName: string, accountId: number = DEFAULT_ACCOUNT_ID): Promise<{ success: boolean; message: string; archivedCount: number }> {
  return apiRequest<{ success: boolean; message: string; archivedCount: number }>(`/inventory/${accountId}/archive-brand`, {
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

export async function fetchOrders(accountId: number = DEFAULT_ACCOUNT_ID): Promise<OrderResponse> {
  return apiRequest<OrderResponse>(`/orders/${accountId}`);
}

export async function fetchOrderById(orderId: number, accountId: number = DEFAULT_ACCOUNT_ID): Promise<OrderResponse> {
  return apiRequest<OrderResponse>(`/orders/${accountId}/${orderId}`);
}

export async function archiveOrder(orderId: number, accountId: number = DEFAULT_ACCOUNT_ID): Promise<{ success: boolean; message: string; order: OrderData }> {
  return apiRequest<{ success: boolean; message: string; order: OrderData }>(`/orders/${accountId}/${orderId}/archive`, {
    method: 'PUT',
  });
}

export async function deleteOrder(orderId: number, accountId: number = DEFAULT_ACCOUNT_ID): Promise<{ success: boolean; message: string }> {
  return apiRequest<{ success: boolean; message: string }>(`/orders/${accountId}/${orderId}`, {
    method: 'DELETE',
  });
}

export async function deleteArchivedItemsByBrand(brandName: string, vendorName: string, accountId: number = DEFAULT_ACCOUNT_ID): Promise<{ success: boolean; message: string; deletedCount: number }> {
  return apiRequest<{ success: boolean; message: string; deletedCount: number }>(`/inventory/${accountId}/delete-archived-brand`, {
    method: 'DELETE',
    body: JSON.stringify({ brandName, vendorName }),
  });
}

export async function deleteArchivedItemsByVendor(vendorName: string, accountId: number = DEFAULT_ACCOUNT_ID): Promise<{ success: boolean; message: string; deletedCount: number }> {
  return apiRequest<{ success: boolean; message: string; deletedCount: number }>(`/inventory/${accountId}/delete-archived-vendor`, {
    method: 'DELETE',
    body: JSON.stringify({ vendorName }),
  });
}

export async function markItemAsSold(itemId: number, accountId: number = DEFAULT_ACCOUNT_ID): Promise<{ success: boolean; message: string; item: InventoryItem }> {
  return apiRequest<{ success: boolean; message: string; item: InventoryItem }>(`/inventory/${accountId}/${itemId}/sold`, {
    method: 'PUT',
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
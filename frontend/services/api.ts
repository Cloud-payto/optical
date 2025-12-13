// API service for backend communication
import { getApiEndpoint } from '../lib/api-config';
import { supabase } from '../lib/supabase';
import { DEMO_USER_ID } from '../demo/demoConstants';

// Helper function to get current user ID (async)
async function getCurrentUserId(): Promise<string> {
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) {
    throw new Error('User not authenticated. Please log in to continue.');
  }
  return user.id;
}

// Helper function to check if demo mode is active
function isDemoModeActive(): boolean {
  try {
    if (typeof window === 'undefined' || !window.sessionStorage) {
      return false;
    }
    // Check if demo is active by looking at sessionStorage
    // DemoContext sets this when demo starts
    const demoSessionId = sessionStorage.getItem('demo_session_id');
    return !!demoSessionId;
  } catch {
    return false;
  }
}

// Helper function to get current user ID from session (async)
async function getCurrentUserIdFromSession(): Promise<string> {
  // Check if demo mode is active first
  if (isDemoModeActive()) {
    console.log('🎭 Demo mode detected - returning demo user ID for API calls');
    return DEMO_USER_ID;
  }

  const { data: { session }, error } = await supabase.auth.getSession();

  if (error || !session?.user) {
    throw new Error('User not authenticated. Please log in to continue.');
  }

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

// New inventory workflow functions - Updated for partial confirmation
export interface ConfirmOrderResponse {
  success: boolean;
  message: string;
  updatedCount: number;
  orderStatus: 'partial' | 'confirmed';
  receivedItems: number;
  totalItems: number;
  pendingItems: number;
}

export async function confirmPendingOrder(
  orderNumber: string,
  frameIds?: string[],
  userId?: string
): Promise<ConfirmOrderResponse> {
  const currentUserId = userId || await getCurrentUserIdFromSession();

  return apiRequest<ConfirmOrderResponse>(`/inventory/${currentUserId}/confirm/${orderNumber}`, {
    method: 'POST',
    body: JSON.stringify({
      frameIds,
      confirmAll: !frameIds || frameIds.length === 0
    }),
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

export interface ManualInventoryData {
  vendor: string;
  brand: string;
  model: string;
  color: string;
  size?: string;
  sku?: string;
  quantity: number;
  cost?: number;
  retail_price?: number;
  order_number?: string;
  notes?: string;
}

export async function createManualInventoryItem(data: ManualInventoryData, userId?: string): Promise<{ success: boolean; message: string; items: InventoryItem[] }> {
  const currentUserId = userId || await getCurrentUserIdFromSession();

  // Use Supabase directly to insert the inventory items
  const itemsToInsert = Array.from({ length: data.quantity }, () => ({
    account_id: currentUserId,
    vendor_name: data.vendor,
    brand: data.brand,
    model: data.model,
    color: data.color,
    size: data.size || null,
    sku: data.sku || null,
    cost: data.cost || null,
    retail_price: data.retail_price || null,
    order_number: data.order_number || null,
    notes: data.notes || null,
    status: 'current',
    created_at: new Date().toISOString(),
  }));

  const { data: insertedItems, error } = await supabase
    .from('inventory')
    .insert(itemsToInsert)
    .select();

  if (error) {
    console.error('Failed to create manual inventory items:', error);
    throw new Error('Failed to add frames to inventory');
  }

  return {
    success: true,
    message: `Successfully added ${data.quantity} frame(s) to inventory`,
    items: insertedItems as InventoryItem[],
  };
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

export interface CatalogBrands {
  vendor_id: string;
  vendor_name: string;
  brands: string[];
}

export async function fetchCatalogBrands(): Promise<CatalogBrands[]> {
  return apiRequest<CatalogBrands[]>('/vendors/catalog-brands');
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

export async function fetchVendorAccountNumber(userId: string, vendorId: string): Promise<string | null> {
  const response = await apiRequest<{ vendor_account_number: string | null }>(
    `/vendors/account-number/${userId}/${vendorId}`
  );
  return response.vendor_account_number;
}

export async function fetchAccountBrands(userId?: string): Promise<UserVendorPricing[]> {
  const currentUserId = userId || await getCurrentUserIdFromSession();
  return apiRequest<UserVendorPricing[]>(`/vendors/pricing/${currentUserId}`);
}

export interface CascadeOptions {
  cascadeToInventory?: boolean;
  cascadeToOrders?: boolean;
  previewOnly?: boolean;
}

export interface CascadeResults {
  inventoryItemsAffected: number;
  ordersAffected: number;
  inventoryUpdated: boolean;
  ordersUpdated: boolean;
}

export interface SaveAccountBrandResponse {
  success: boolean;
  account_brand?: UserVendorPricing;
  brand_id?: string;
  cascade?: CascadeResults;
}

export async function saveAccountBrand(
  brandData: Partial<UserVendorPricing> & CascadeOptions,
  userId?: string
): Promise<SaveAccountBrandResponse> {
  const currentUserId = userId || await getCurrentUserIdFromSession();

  const result = await apiRequest<SaveAccountBrandResponse>(`/vendors/pricing/${currentUserId}`, {
    method: 'POST',
    body: JSON.stringify(brandData),
  });

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
    accountNumber: string | null;
  }>;
  brands: Array<{
    brand_id: string | null;
    brand_name: string;
    vendor_id: string;
    vendor_name: string;
    vendor_account_number: string | null;
  }>;
}

export async function fetchPendingImports(userId?: string): Promise<PendingImport> {
  const currentUserId = userId || await getCurrentUserIdFromSession();
  return apiRequest<PendingImport>(`/vendors/pending-imports/${currentUserId}`);
}

export async function importFromInventory(
  vendorData: Array<{ id: string; name: string; brandCount: number; accountNumber: string | null }>,
  brandData: any[],
  userId?: string
): Promise<{ success: boolean; vendorsAdded: number; brandsAdded: number }> {
  const currentUserId = userId || await getCurrentUserIdFromSession();
  return apiRequest<{ success: boolean; vendorsAdded: number; brandsAdded: number }>(`/vendors/import-from-inventory/${currentUserId}`, {
    method: 'POST',
    body: JSON.stringify({ vendorIds: vendorData, brandData }),
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
  actualInventoryCost: number;
  averageProfitMargin: number;
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

// Account management functions
export interface UpdateAccountData {
  businessName?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  name?: string;
}

export async function updateAccount(data: UpdateAccountData): Promise<void> {
  const userId = await getCurrentUserIdFromSession();

  // Use Supabase directly to update the account
  const { error } = await supabase
    .from('accounts')
    .update({
      business_name: data.businessName,
      phone: data.phone,
      address: data.address,
      city: data.city,
      state: data.state,
      zip_code: data.zipCode,
      name: data.name,
      updated_at: new Date().toISOString(),
    })
    .eq('id', userId);

  if (error) {
    console.error('Failed to update account:', error);
    throw new Error('Failed to update account information');
  }
}

export async function getCurrentAccount(): Promise<any> {
  const userId = await getCurrentUserIdFromSession();

  const { data, error } = await supabase
    .from('accounts')
    .select('*')
    .eq('id', userId)
    .single();

  if (error) {
    console.error('Failed to get account:', error);
    throw new Error('Failed to get account information');
  }

  return data;
}

// ============================================================
// PRACTICE PROFILE API FUNCTIONS
// ============================================================

import type { PracticeProfile } from '../types/practiceProfile';

export interface PracticeProfileData {
  practice_type: string | null;
  practice_specialty: string | null;
  years_in_business: number | null;
  patient_volume_range: string | null;
  current_brands: string[];
  average_frame_price_range: string | null;
  primary_goals: string[];
}

/**
 * Fetch the current user's practice profile
 */
export async function fetchPracticeProfile(userId?: string): Promise<PracticeProfile | null> {
  const currentUserId = userId || await getCurrentUserIdFromSession();

  const { data, error } = await supabase
    .from('practice_profiles')
    .select('*')
    .eq('account_id', currentUserId)
    .maybeSingle();

  if (error && error.code !== 'PGRST116') { // PGRST116 = not found, which is OK
    console.error('Failed to fetch practice profile:', error);
    throw new Error('Failed to fetch practice profile');
  }

  return data;
}

/**
 * Save or update the practice profile (upsert)
 */
export async function savePracticeProfile(
  profileData: PracticeProfileData,
  userId?: string
): Promise<PracticeProfile> {
  const currentUserId = userId || await getCurrentUserIdFromSession();

  const dataToSave = {
    account_id: currentUserId,
    ...profileData,
    is_completed: true,
    completed_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from('practice_profiles')
    .upsert(dataToSave, {
      onConflict: 'account_id',
    })
    .select()
    .single();

  if (error) {
    console.error('Failed to save practice profile:', error);
    throw new Error('Failed to save practice profile');
  }

  // Also update accounts table to mark questionnaire as completed
  const { error: accountError } = await supabase
    .from('accounts')
    .update({
      questionnaire_completed: true,
      updated_at: new Date().toISOString(),
    })
    .eq('id', currentUserId);

  if (accountError) {
    console.error('Failed to update account questionnaire status:', accountError);
    // Don't throw - profile was saved successfully
  }

  return data;
}

/**
 * Update an existing practice profile
 */
export async function updatePracticeProfile(
  profileData: Partial<PracticeProfileData>,
  userId?: string
): Promise<PracticeProfile> {
  const currentUserId = userId || await getCurrentUserIdFromSession();

  const { data, error } = await supabase
    .from('practice_profiles')
    .update({
      ...profileData,
      updated_at: new Date().toISOString(),
    })
    .eq('account_id', currentUserId)
    .select()
    .single();

  if (error) {
    console.error('Failed to update practice profile:', error);
    throw new Error('Failed to update practice profile');
  }

  return data;
}

/**
 * Mark the questionnaire as skipped by the user
 */
export async function markQuestionnaireSkipped(userId?: string): Promise<void> {
  const currentUserId = userId || await getCurrentUserIdFromSession();

  const { error } = await supabase
    .from('accounts')
    .update({
      questionnaire_skipped: true,
      questionnaire_last_prompted: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', currentUserId);

  if (error) {
    console.error('Failed to mark questionnaire as skipped:', error);
    throw new Error('Failed to update questionnaire status');
  }
}

/**
 * Check if user has completed or skipped the questionnaire
 */
export async function getQuestionnaireStatus(userId?: string): Promise<{
  completed: boolean;
  skipped: boolean;
  lastPrompted: string | null;
}> {
  const currentUserId = userId || await getCurrentUserIdFromSession();

  const { data, error } = await supabase
    .from('accounts')
    .select('questionnaire_completed, questionnaire_skipped, questionnaire_last_prompted')
    .eq('id', currentUserId)
    .single();

  if (error) {
    console.error('Failed to get questionnaire status:', error);
    return { completed: false, skipped: false, lastPrompted: null };
  }

  return {
    completed: data.questionnaire_completed || false,
    skipped: data.questionnaire_skipped || false,
    lastPrompted: data.questionnaire_last_prompted,
  };
}

// =============================================================================
// Return Reports API Functions
// =============================================================================

export interface ReturnReport {
  id: string;
  account_id: string;
  vendor_id?: string;
  vendor_name: string;
  report_number: string;
  filename: string;
  pdf_path: string;
  item_count: number;
  total_quantity: number;
  status: 'draft' | 'generated' | 'sent' | 'cancelled';
  generated_date: string;
  created_at: string;
  updated_at: string;
  notes?: string;
  sent_to_email?: string;
  sent_at?: string;
}

export interface SaveReturnReportRequest {
  account_id: string;
  vendor_id?: string;
  vendor_name: string;
  vendor_account_number?: string;
  report_number: string;
  filename: string;
  pdf_path: string;
  item_count: number;
  total_quantity: number;
  status?: 'pending' | 'submitted' | 'completed';
}

/**
 * Save return report metadata to database
 */
export async function saveReturnReportMetadata(
  metadata: SaveReturnReportRequest,
  userId?: string
): Promise<{ success: boolean; data: ReturnReport }> {
  const currentUserId = userId || await getCurrentUserIdFromSession();

  // Ensure the account_id matches current user
  const requestData = {
    ...metadata,
    account_id: currentUserId
  };

  return await apiRequest<{ success: boolean; data: ReturnReport }>(
    '/return-reports',
    {
      method: 'POST',
      body: JSON.stringify(requestData)
    }
  );
}

/**
 * Fetch all return reports for current user
 */
export async function fetchReturnReports(
  userId?: string,
  statusFilter?: 'all' | 'pending' | 'submitted' | 'completed'
): Promise<ReturnReport[]> {
  const currentUserId = userId || await getCurrentUserIdFromSession();

  const queryParams = new URLSearchParams();
  if (statusFilter && statusFilter !== 'all') {
    queryParams.append('status', statusFilter);
  }

  const queryString = queryParams.toString();
  const endpoint = `/return-reports${queryString ? '?' + queryString : ''}`;

  const response = await apiRequest<{ success: boolean; data: ReturnReport[] }>(endpoint);
  return response.data;
}

/**
 * Fetch a specific return report by ID
 */
export async function fetchReturnReportById(
  reportId: string,
  userId?: string
): Promise<ReturnReport> {
  const currentUserId = userId || await getCurrentUserIdFromSession();

  const response = await apiRequest<{ success: boolean; data: ReturnReport }>(
    `/return-reports/${reportId}`
  );
  return response.data;
}

/**
 * Update return report status or metadata
 */
export async function updateReturnReport(
  reportId: string,
  updates: {
    status?: 'pending' | 'submitted' | 'completed';
    notes?: string;
    sent_to_email?: string;
    sent_at?: string;
  },
  userId?: string
): Promise<{ success: boolean; data: ReturnReport }> {
  const currentUserId = userId || await getCurrentUserIdFromSession();

  return await apiRequest<{ success: boolean; data: ReturnReport }>(
    `/return-reports/${reportId}`,
    {
      method: 'PATCH',
      body: JSON.stringify(updates)
    }
  );
}

/**
 * Delete a return report (removes metadata and PDF from storage)
 */
export async function deleteReturnReport(
  reportId: string,
  userId?: string
): Promise<{ success: boolean; message: string }> {
  const currentUserId = userId || await getCurrentUserIdFromSession();

  return await apiRequest<{ success: boolean; message: string }>(
    `/return-reports/${reportId}`,
    {
      method: 'DELETE'
    }
  );
}
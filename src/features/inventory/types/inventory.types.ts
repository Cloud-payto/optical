/**
 * Inventory-related TypeScript type definitions
 * Centralized types for the Inventory feature
 */

export interface InventoryItem {
  id: string;
  account_id: string;
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
  status?: 'pending' | 'current' | 'archived' | 'sold';
  order_number?: string;
  account_number?: string;
  email_id?: string;
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

export interface InventoryFilters {
  status?: 'pending' | 'current' | 'archived' | 'sold';
  vendor?: string;
  brand?: string;
  searchTerm?: string;
}

export interface GroupedInventory {
  [vendor: string]: {
    [brand: string]: InventoryItem[];
  };
}

/**
 * Order-related TypeScript type definitions
 * Centralized types for the Orders feature
 */

export interface OrderItem {
  id: number;
  sku: string;
  upc?: string;
  brand: string;
  model: string;
  color: string;
  size: string;
  quantity: number;
  vendor: string;
  wholesale_price?: number;
}

export interface Order {
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
  status: 'pending' | 'confirmed' | 'archived';
  items: OrderItem[];
}

export interface OrdersResponse {
  success: boolean;
  count?: number;
  orders?: Order[];
  order?: Order;
  error?: string;
}

export interface OrderFilters {
  status?: 'pending' | 'confirmed' | 'archived';
  vendor?: string;
  searchTerm?: string;
}

export interface GroupedOrders {
  [vendor: string]: {
    [orderNumber: string]: Order;
  };
}

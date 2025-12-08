/**
 * Demo Data for OptiProfit Interactive Demo
 *
 * This file contains both:
 * 1. Mock data for development/fallback
 * 2. API integration functions for Supabase Edge Functions
 *
 * API Endpoints (Supabase Edge Functions):
 * - POST /demo-initialize - Initialize demo session
 * - GET /demo-vendor - Get Modern Optical vendor data
 * - GET /demo-order - Get parsed order email
 * - GET /demo-inventory - Get demo inventory items
 * - GET /demo-pricing - Get brand pricing data
 * - PATCH /demo-progress - Update demo progress
 * - POST /demo-extend - Extend demo session
 * - DELETE /demo-cleanup - Clean up demo session
 */

import { Company, Brand } from '../types';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

export interface DemoOrder {
  id: string;
  order_number: string;
  vendor: string;
  customer_name: string;
  order_date: string;
  total_pieces: number;
  status: 'pending' | 'confirmed' | 'shipped';
  account_number?: string;
  items: DemoInventoryItem[];
}

export interface DemoInventoryItem {
  id: string;
  sku: string;
  brand: string;
  model: string;
  color: string;
  size: string;
  quantity: number;
  status: 'pending' | 'current' | 'sold' | 'archived' | 'returned';
  wholesale_cost?: number;
  your_cost?: number;
  retail_price?: number;
  vendor_id: string;
  vendor_name: string;
}

export interface DemoData {
  vendor: Company;
  order: DemoOrder;
  inventoryItems: DemoInventoryItem[];
  brands: Brand[];
}

// ============================================================
// Session Management
// ============================================================

const SESSION_STORAGE_KEY = 'demo_session_id';
const SESSION_EXPIRY_KEY = 'demo_session_expiry';

export const getDemoSessionId = (): string | null => {
  return sessionStorage.getItem(SESSION_STORAGE_KEY);
};

export const setDemoSessionId = (sessionId: string, expiresAt: string): void => {
  sessionStorage.setItem(SESSION_STORAGE_KEY, sessionId);
  sessionStorage.setItem(SESSION_EXPIRY_KEY, expiresAt);
};

export const clearDemoSession = (): void => {
  sessionStorage.removeItem(SESSION_STORAGE_KEY);
  sessionStorage.removeItem(SESSION_EXPIRY_KEY);
};

export const isDemoSessionExpired = (): boolean => {
  const expiryStr = sessionStorage.getItem(SESSION_EXPIRY_KEY);
  if (!expiryStr) return true;

  const expiryTime = new Date(expiryStr).getTime();
  const currentTime = Date.now();
  return currentTime >= expiryTime;
};

// ============================================================
// API Integration Functions
// ============================================================

/**
 * Initialize a new demo session
 * Calls POST /demo-initialize endpoint
 */
export const initializeDemoSession = async (durationMinutes: number = 60): Promise<DemoData> => {
  if (!isSupabaseConfigured) {
    console.warn('[DEMO API] Supabase not configured, using mock data');
    return DEMO_DATA;
  }

  try {
    const { data, error } = await supabase.functions.invoke('demo-initialize', {
      body: { durationMinutes },
    });

    if (error) {
      console.error('[DEMO API] Error initializing demo:', error);
      return DEMO_DATA;
    }

    if (!data?.success) {
      console.error('[DEMO API] Demo initialization failed:', data?.error);
      return DEMO_DATA;
    }

    // Store session ID
    setDemoSessionId(data.data.sessionId, data.data.expiresAt);

    // Transform API response to match DemoData interface
    return {
      vendor: data.data.vendor,
      order: data.data.order,
      inventoryItems: data.data.inventoryItems,
      brands: data.data.brandPricing,
    };

  } catch (error) {
    console.error('[DEMO API] Exception initializing demo:', error);
    return DEMO_DATA;
  }
};

/**
 * Get vendor data for current demo session
 * Calls GET /demo-vendor endpoint
 */
export const getDemoVendor = async (): Promise<Company | null> => {
  const sessionId = getDemoSessionId();
  if (!sessionId || !isSupabaseConfigured) {
    return DEMO_VENDOR;
  }

  try {
    const { data, error } = await supabase.functions.invoke('demo-vendor', {
      body: { sessionId },
    });

    if (error || !data?.success) {
      console.error('[DEMO API] Error fetching vendor:', error || data?.error);
      return DEMO_VENDOR;
    }

    return data.data;
  } catch (error) {
    console.error('[DEMO API] Exception fetching vendor:', error);
    return DEMO_VENDOR;
  }
};

/**
 * Get order data for current demo session
 * Calls GET /demo-order endpoint
 */
export const getDemoOrder = async (): Promise<DemoOrder | null> => {
  const sessionId = getDemoSessionId();
  if (!sessionId || !isSupabaseConfigured) {
    return DEMO_ORDER;
  }

  try {
    const { data, error } = await supabase.functions.invoke('demo-order', {
      body: { sessionId },
    });

    if (error || !data?.success) {
      console.error('[DEMO API] Error fetching order:', error || data?.error);
      return DEMO_ORDER;
    }

    return data.data;
  } catch (error) {
    console.error('[DEMO API] Exception fetching order:', error);
    return DEMO_ORDER;
  }
};

/**
 * Get inventory items for current demo session
 * Calls GET /demo-inventory endpoint
 */
export const getDemoInventory = async (status?: string): Promise<DemoInventoryItem[]> => {
  const sessionId = getDemoSessionId();
  if (!sessionId || !isSupabaseConfigured) {
    return status
      ? DEMO_INVENTORY_ITEMS.filter(item => item.status === status)
      : DEMO_INVENTORY_ITEMS;
  }

  try {
    const { data, error } = await supabase.functions.invoke('demo-inventory', {
      body: { sessionId, status },
    });

    if (error || !data?.success) {
      console.error('[DEMO API] Error fetching inventory:', error || data?.error);
      return DEMO_INVENTORY_ITEMS;
    }

    return data.data.items;
  } catch (error) {
    console.error('[DEMO API] Exception fetching inventory:', error);
    return DEMO_INVENTORY_ITEMS;
  }
};

/**
 * Get brand pricing for current demo session
 * Calls GET /demo-pricing endpoint
 */
export const getDemoPricing = async (brandName?: string): Promise<any[]> => {
  const sessionId = getDemoSessionId();
  if (!sessionId || !isSupabaseConfigured) {
    return brandName
      ? DEMO_BRAND_PRICING.filter(brand => brand.name === brandName)
      : DEMO_BRAND_PRICING;
  }

  try {
    const { data, error } = await supabase.functions.invoke('demo-pricing', {
      body: { sessionId, brandName },
    });

    if (error || !data?.success) {
      console.error('[DEMO API] Error fetching pricing:', error || data?.error);
      return DEMO_BRAND_PRICING;
    }

    return data.data;
  } catch (error) {
    console.error('[DEMO API] Exception fetching pricing:', error);
    return DEMO_BRAND_PRICING;
  }
};

/**
 * Update demo progress
 * Calls PATCH /demo-progress endpoint
 */
export const updateDemoProgress = async (
  currentStep: number,
  completedSteps: number[]
): Promise<boolean> => {
  const sessionId = getDemoSessionId();
  if (!sessionId || !isSupabaseConfigured) {
    console.log('[DEMO API] No session or Supabase not configured, skipping progress update');
    return false;
  }

  try {
    const { data, error } = await supabase.functions.invoke('demo-progress', {
      body: { sessionId, currentStep, completedSteps },
    });

    if (error || !data?.success) {
      console.error('[DEMO API] Error updating progress:', error || data?.error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('[DEMO API] Exception updating progress:', error);
    return false;
  }
};

/**
 * Extend demo session by 1 hour
 * Calls POST /demo-extend endpoint
 */
export const extendDemoSession = async (): Promise<boolean> => {
  const sessionId = getDemoSessionId();
  if (!sessionId || !isSupabaseConfigured) {
    console.log('[DEMO API] No session or Supabase not configured');
    return false;
  }

  try {
    const { data, error } = await supabase.functions.invoke('demo-extend', {
      body: { sessionId },
    });

    if (error || !data?.success) {
      console.error('[DEMO API] Error extending session:', error || data?.error);
      return false;
    }

    // Update stored expiry time
    setDemoSessionId(sessionId, data.data.expiresAt);
    return true;
  } catch (error) {
    console.error('[DEMO API] Exception extending session:', error);
    return false;
  }
};

/**
 * Cleanup demo session
 * Calls DELETE /demo-cleanup endpoint
 */
export const cleanupDemoSession = async (): Promise<boolean> => {
  const sessionId = getDemoSessionId();
  if (!sessionId || !isSupabaseConfigured) {
    clearDemoSession();
    return true;
  }

  try {
    const { data, error } = await supabase.functions.invoke('demo-cleanup', {
      body: { sessionId },
    });

    if (error || !data?.success) {
      console.error('[DEMO API] Error cleaning up session:', error || data?.error);
    }

    // Clear session storage regardless of API result
    clearDemoSession();
    return true;
  } catch (error) {
    console.error('[DEMO API] Exception cleaning up session:', error);
    clearDemoSession();
    return true;
  }
};

// ============================================================
// Mock Data (used as fallbacks and for development)
// ============================================================
export const DEMO_VENDOR: Company = {
  id: 'demo-modern-optical',
  name: 'Modern Optical',
  accountNumber: 'MO-12345',
  brands: [
    {
      id: 'demo-modern-collection',
      name: 'Modern Optics Collection',
      category: 'Fashion',
      tier: 'Premium',
      wholesale_cost: 85,
      msrp: 150,
      map_price: 135,
      is_active: true,
      notes: 'Premium fashion frames with modern designs'
    },
    {
      id: 'demo-classic-series',
      name: 'Classic Series',
      category: 'Traditional',
      tier: 'Standard',
      wholesale_cost: 65,
      msrp: 120,
      map_price: 110,
      is_active: true,
      notes: 'Timeless designs for everyday wear'
    }
  ],
  contactInfo: {
    companyEmail: 'orders@modernoptical.com',
    companyPhone: '(555) 123-4567',
    supportEmail: 'support@modernoptical.com',
    supportPhone: '(555) 123-4568',
    website: 'https://modernoptical.com',
    repName: 'Sarah Johnson',
    repEmail: 'sarah.johnson@modernoptical.com',
    repPhone: '(555) 123-4569'
  }
};

// ============================================================
// TODO: Replace with API call - GET /api/demo/order
// ============================================================
export const DEMO_ORDER: DemoOrder = {
  id: 'demo-order-1',
  order_number: 'MO-2024-DEMO',
  vendor: 'Modern Optical',
  customer_name: 'Downtown Vision Center',
  order_date: new Date().toISOString().split('T')[0],
  total_pieces: 3,
  status: 'pending',
  account_number: 'MO-12345',
  items: [
    {
      id: 'demo-item-1',
      sku: 'MOC-001-BLK-52',
      brand: 'Modern Optics Collection',
      model: 'Metropolitan',
      color: 'Black',
      size: '52-18-140',
      quantity: 1,
      status: 'pending',
      wholesale_cost: 85,
      your_cost: 55,
      retail_price: 150,
      vendor_id: 'demo-modern-optical',
      vendor_name: 'Modern Optical'
    },
    {
      id: 'demo-item-2',
      sku: 'MOC-002-TOR-54',
      brand: 'Modern Optics Collection',
      model: 'Executive',
      color: 'Tortoise',
      size: '54-16-142',
      quantity: 1,
      status: 'pending',
      wholesale_cost: 85,
      your_cost: 55,
      retail_price: 150,
      vendor_id: 'demo-modern-optical',
      vendor_name: 'Modern Optical'
    },
    {
      id: 'demo-item-3',
      sku: 'CS-101-BRN-50',
      brand: 'Classic Series',
      model: 'Heritage',
      color: 'Brown',
      size: '50-19-145',
      quantity: 1,
      status: 'pending',
      wholesale_cost: 65,
      your_cost: 45,
      retail_price: 120,
      vendor_id: 'demo-modern-optical',
      vendor_name: 'Modern Optical'
    }
  ]
};

// ============================================================
// TODO: Replace with API call - GET /api/demo/inventory
// ============================================================
export const DEMO_INVENTORY_ITEMS: DemoInventoryItem[] = [
  // Pending items (from order)
  ...DEMO_ORDER.items,

  // Current inventory items
  {
    id: 'demo-current-1',
    sku: 'MOC-003-SIL-52',
    brand: 'Modern Optics Collection',
    model: 'Urbanite',
    color: 'Silver',
    size: '52-17-140',
    quantity: 2,
    status: 'current',
    wholesale_cost: 85,
    your_cost: 55,
    retail_price: 150,
    vendor_id: 'demo-modern-optical',
    vendor_name: 'Modern Optical'
  },
  {
    id: 'demo-current-2',
    sku: 'CS-102-BLU-54',
    brand: 'Classic Series',
    model: 'Vintage',
    color: 'Blue',
    size: '54-18-142',
    quantity: 1,
    status: 'current',
    wholesale_cost: 65,
    your_cost: 45,
    retail_price: 120,
    vendor_id: 'demo-modern-optical',
    vendor_name: 'Modern Optical'
  },

  // Sold items
  {
    id: 'demo-sold-1',
    sku: 'MOC-001-BLK-54',
    brand: 'Modern Optics Collection',
    model: 'Metropolitan',
    color: 'Black',
    size: '54-18-140',
    quantity: 1,
    status: 'sold',
    wholesale_cost: 85,
    your_cost: 55,
    retail_price: 150,
    vendor_id: 'demo-modern-optical',
    vendor_name: 'Modern Optical'
  }
];

// ============================================================
// TODO: Replace with API call - GET /api/demo/pricing
// ============================================================
export const DEMO_BRAND_PRICING = [
  {
    id: 'demo-modern-collection',
    name: 'Modern Optics Collection',
    category: 'Fashion',
    tier: 'Premium',
    wholesaleCost: 85,
    yourCost: 55,
    msrp: 150,
    mapPrice: 135,
    discountPercentage: 35.29,
    tariffTax: 3,
    isActive: true,
    vendorId: 'demo-modern-optical',
    vendorName: 'Modern Optical'
  },
  {
    id: 'demo-classic-series',
    name: 'Classic Series',
    category: 'Traditional',
    tier: 'Standard',
    wholesaleCost: 65,
    yourCost: 45,
    msrp: 120,
    mapPrice: 110,
    discountPercentage: 30.77,
    tariffTax: 2,
    isActive: true,
    vendorId: 'demo-modern-optical',
    vendorName: 'Modern Optical'
  }
];

// ============================================================
// Complete demo data export
// ============================================================
export const DEMO_DATA: DemoData = {
  vendor: DEMO_VENDOR,
  order: DEMO_ORDER,
  inventoryItems: DEMO_INVENTORY_ITEMS,
  brands: DEMO_VENDOR.brands
};

// ============================================================
// Demo calculation data for profit calculator
// ============================================================
export const DEMO_CALCULATION_DATA = {
  company: DEMO_VENDOR.name,
  brand: 'Modern Optics Collection',
  wholesaleCost: 85,
  yourCost: 55,
  tariffTax: 3,
  retailPrice: 150,
  margin: 61.3, // ((150 - 55 - 3) / 150) * 100
  profit: 92    // 150 - 55 - 3
};

// ============================================================
// Main fetch function - initializes demo and returns all data
// ============================================================
export const fetchDemoData = async (): Promise<DemoData> => {
  // Check if we have an active session
  const existingSessionId = getDemoSessionId();

  if (existingSessionId && !isDemoSessionExpired()) {
    console.log('[DEMO API] Using existing session:', existingSessionId);
    // Session exists and is valid, fetch data using existing session
    try {
      const [vendor, order, inventory, pricing] = await Promise.all([
        getDemoVendor(),
        getDemoOrder(),
        getDemoInventory(),
        getDemoPricing(),
      ]);

      return {
        vendor: vendor || DEMO_VENDOR,
        order: order || DEMO_ORDER,
        inventoryItems: inventory || DEMO_INVENTORY_ITEMS,
        brands: pricing || DEMO_BRAND_PRICING,
      };
    } catch (error) {
      console.error('[DEMO API] Error fetching existing session data:', error);
      // Fall through to initialize new session
    }
  }

  // No session or session expired - initialize new session
  console.log('[DEMO API] Initializing new demo session...');
  return await initializeDemoSession(60);
};

export default DEMO_DATA;

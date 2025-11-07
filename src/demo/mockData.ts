// Demo data fixtures for the interactive product demo
import { Company, Brand } from '../types';

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

// Modern Optical demo vendor
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

// Demo order data
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

// Demo inventory items showing lifecycle
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

// Complete demo data
export const DEMO_DATA: DemoData = {
  vendor: DEMO_VENDOR,
  order: DEMO_ORDER,
  inventoryItems: DEMO_INVENTORY_ITEMS,
  brands: DEMO_VENDOR.brands
};

// Demo calculation data for profit calculator
export const DEMO_CALCULATION_DATA = {
  company: DEMO_VENDOR.name,
  brand: 'Modern Optics Collection',
  wholesaleCost: 85,
  yourCost: 55,
  tariffTax: 3,
  retailPrice: 150,
  margin: 63.3, // ((150 - 55 - 3) / 150) * 100
  profit: 92    // 150 - 55 - 3
};

export default DEMO_DATA;
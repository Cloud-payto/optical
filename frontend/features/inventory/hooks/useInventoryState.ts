import { useState } from 'react';
import { EmailData, InventoryItem, OrderData } from '../../../services/api';

/**
 * INVENTORY STATE HOOK
 *
 * Manages all state for the Inventory page
 * Extracted from Inventory.tsx to reduce file size and improve organization
 *
 * This hook consolidates all 27+ useState hooks into a single manageable module
 */

export interface InventoryState {
  // Data
  emails: EmailData[];
  inventory: InventoryItem[];
  orders: OrderData[];

  // UI State
  loading: boolean;
  error: string | null;
  searchTerm: string;

  // Tab State
  activeTab: 'orders' | 'inventory' | 'archive';
  ordersSubTab: 'pending' | 'confirmed';
  inventorySubTab: 'pending' | 'current' | 'sold';

  // Loading States (for optimistic UI)
  deletingItems: Set<number | string>;
  expandedItems: Set<number>;
  expandedVendors: Set<string>;
  expandedBrands: Set<string>;
  confirmingOrders: Set<string>;
  archivingItems: Set<number>;
  restoringItems: Set<number>;
  archivingBrands: Set<string>;
  deletingBrands: Set<string>;
  deletingVendors: Set<string>;
  archivingOrders: Set<number>;
  deletingOrders: Set<number>;
  sellingItems: Set<number>;

  // Modal State
  openDropdown: string | null;
  selectedEmailDetails: EmailData | null;
  confirmDeleteDialog: {
    isOpen: boolean;
    emailId: string | null;
    itemId: number | null;
    type: 'email' | 'item' | null;
  };
  showOrderDetailsModal: boolean;
  expandedOrders: Set<string>;
  selectedFrames: Set<number>;
  showConfirmModal: boolean;
  confirmingOrderKey: string | null;

  // Misc
  copied: boolean;
  vendorSuggestion: any;
  showVendorSuggestion: boolean;
}

export interface InventoryStateActions {
  setEmails: React.Dispatch<React.SetStateAction<EmailData[]>>;
  setInventory: React.Dispatch<React.SetStateAction<InventoryItem[]>>;
  setOrders: React.Dispatch<React.SetStateAction<OrderData[]>>;
  setLoading: React.Dispatch<React.SetStateAction<boolean>>;
  setError: React.Dispatch<React.SetStateAction<string | null>>;
  setSearchTerm: React.Dispatch<React.SetStateAction<string>>;
  setActiveTab: React.Dispatch<React.SetStateAction<'orders' | 'inventory' | 'archive'>>;
  setOrdersSubTab: React.Dispatch<React.SetStateAction<'pending' | 'confirmed'>>;
  setInventorySubTab: React.Dispatch<React.SetStateAction<'pending' | 'current' | 'sold'>>;
  setDeletingItems: React.Dispatch<React.SetStateAction<Set<number | string>>>;
  setExpandedItems: React.Dispatch<React.SetStateAction<Set<number>>>;
  setExpandedVendors: React.Dispatch<React.SetStateAction<Set<string>>>;
  setExpandedBrands: React.Dispatch<React.SetStateAction<Set<string>>>;
  setConfirmingOrders: React.Dispatch<React.SetStateAction<Set<string>>>;
  setArchivingItems: React.Dispatch<React.SetStateAction<Set<number>>>;
  setRestoringItems: React.Dispatch<React.SetStateAction<Set<number>>>;
  setOpenDropdown: React.Dispatch<React.SetStateAction<string | null>>;
  setArchivingBrands: React.Dispatch<React.SetStateAction<Set<string>>>;
  setSelectedEmailDetails: React.Dispatch<React.SetStateAction<EmailData | null>>;
  setConfirmDeleteDialog: React.Dispatch<React.SetStateAction<{
    isOpen: boolean;
    emailId: string | null;
    itemId: number | null;
    type: 'email' | 'item' | null;
  }>>;
  setShowOrderDetailsModal: React.Dispatch<React.SetStateAction<boolean>>;
  setExpandedOrders: React.Dispatch<React.SetStateAction<Set<string>>>;
  setSelectedFrames: React.Dispatch<React.SetStateAction<Set<number>>>;
  setShowConfirmModal: React.Dispatch<React.SetStateAction<boolean>>;
  setConfirmingOrderKey: React.Dispatch<React.SetStateAction<string | null>>;
  setArchivingOrders: React.Dispatch<React.SetStateAction<Set<number>>>;
  setDeletingOrders: React.Dispatch<React.SetStateAction<Set<number>>>;
  setSellingItems: React.Dispatch<React.SetStateAction<Set<number>>>;
  setDeletingBrands: React.Dispatch<React.SetStateAction<Set<string>>>;
  setDeletingVendors: React.Dispatch<React.SetStateAction<Set<string>>>;
  setCopied: React.Dispatch<React.SetStateAction<boolean>>;
  setVendorSuggestion: React.Dispatch<React.SetStateAction<any>>;
  setShowVendorSuggestion: React.Dispatch<React.SetStateAction<boolean>>;
}

export function useInventoryState() {
  // Data State
  const [emails, setEmails] = useState<EmailData[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [orders, setOrders] = useState<OrderData[]>([]);

  // UI State
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Tab State
  const [activeTab, setActiveTab] = useState<'orders' | 'inventory' | 'archive'>('orders');
  const [ordersSubTab, setOrdersSubTab] = useState<'pending' | 'confirmed'>('pending');
  const [inventorySubTab, setInventorySubTab] = useState<'pending' | 'current' | 'sold'>('pending');

  // Loading States
  const [deletingItems, setDeletingItems] = useState<Set<number | string>>(new Set());
  const [expandedItems, setExpandedItems] = useState<Set<number>>(new Set());
  const [expandedVendors, setExpandedVendors] = useState<Set<string>>(new Set());
  const [expandedBrands, setExpandedBrands] = useState<Set<string>>(new Set());
  const [confirmingOrders, setConfirmingOrders] = useState<Set<string>>(new Set());
  const [archivingItems, setArchivingItems] = useState<Set<number>>(new Set());
  const [restoringItems, setRestoringItems] = useState<Set<number>>(new Set());
  const [archivingBrands, setArchivingBrands] = useState<Set<string>>(new Set());
  const [deletingBrands, setDeletingBrands] = useState<Set<string>>(new Set());
  const [deletingVendors, setDeletingVendors] = useState<Set<string>>(new Set());
  const [archivingOrders, setArchivingOrders] = useState<Set<number>>(new Set());
  const [deletingOrders, setDeletingOrders] = useState<Set<number>>(new Set());
  const [sellingItems, setSellingItems] = useState<Set<number>>(new Set());

  // Modal State
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [selectedEmailDetails, setSelectedEmailDetails] = useState<EmailData | null>(null);
  const [confirmDeleteDialog, setConfirmDeleteDialog] = useState<{
    isOpen: boolean;
    emailId: string | null;
    itemId: number | null;
    type: 'email' | 'item' | null;
  }>({ isOpen: false, emailId: null, itemId: null, type: null });
  const [showOrderDetailsModal, setShowOrderDetailsModal] = useState(false);
  const [expandedOrders, setExpandedOrders] = useState<Set<string>>(new Set());
  const [selectedFrames, setSelectedFrames] = useState<Set<number>>(new Set());
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmingOrderKey, setConfirmingOrderKey] = useState<string | null>(null);

  // Misc
  const [copied, setCopied] = useState(false);
  const [vendorSuggestion, setVendorSuggestion] = useState<any>(null);
  const [showVendorSuggestion, setShowVendorSuggestion] = useState(false);

  // Return state and actions
  const state: InventoryState = {
    emails,
    inventory,
    orders,
    loading,
    error,
    searchTerm,
    activeTab,
    ordersSubTab,
    inventorySubTab,
    deletingItems,
    expandedItems,
    expandedVendors,
    expandedBrands,
    confirmingOrders,
    archivingItems,
    restoringItems,
    openDropdown,
    archivingBrands,
    selectedEmailDetails,
    confirmDeleteDialog,
    showOrderDetailsModal,
    expandedOrders,
    selectedFrames,
    showConfirmModal,
    confirmingOrderKey,
    archivingOrders,
    deletingOrders,
    sellingItems,
    deletingBrands,
    deletingVendors,
    copied,
    vendorSuggestion,
    showVendorSuggestion,
  };

  const actions: InventoryStateActions = {
    setEmails,
    setInventory,
    setOrders,
    setLoading,
    setError,
    setSearchTerm,
    setActiveTab,
    setOrdersSubTab,
    setInventorySubTab,
    setDeletingItems,
    setExpandedItems,
    setExpandedVendors,
    setExpandedBrands,
    setConfirmingOrders,
    setArchivingItems,
    setRestoringItems,
    setOpenDropdown,
    setArchivingBrands,
    setSelectedEmailDetails,
    setConfirmDeleteDialog,
    setShowOrderDetailsModal,
    setExpandedOrders,
    setSelectedFrames,
    setShowConfirmModal,
    setConfirmingOrderKey,
    setArchivingOrders,
    setDeletingOrders,
    setSellingItems,
    setDeletingBrands,
    setDeletingVendors,
    setCopied,
    setVendorSuggestion,
    setShowVendorSuggestion,
  };

  return { state, actions };
}

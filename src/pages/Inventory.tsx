import React, { useState, useEffect } from 'react';
import { SearchIcon, PackageIcon, MailIcon, FilterIcon, RefreshCwIcon, TrashIcon, ChevronDownIcon, ChevronRightIcon, CheckIcon, ArchiveIcon, MoreVerticalIcon, XIcon, EyeIcon, Copy, Check } from 'lucide-react';
import { fetchEmails, fetchInventory, fetchOrders, deleteEmail, deleteInventoryItem, confirmPendingOrder, archiveInventoryItem, restoreInventoryItem, archiveAllItemsByBrand, deleteArchivedItemsByBrand, deleteArchivedItemsByVendor, markItemAsSold, archiveOrder, deleteOrder, EmailData, InventoryItem, EmailResponse, InventoryResponse, OrderData, OrderResponse } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import toast from 'react-hot-toast';

// Helper function to extract vendor name from email address
const extractVendorFromEmail = (email: string): string => {
  const domain = email.split('@')[1]?.toLowerCase() || '';
  if (domain.includes('modernoptical')) return 'Modern Optical';
  if (domain.includes('luxottica')) return 'Luxottica';
  if (domain.includes('safilo')) return 'Safilo';
  
  // Fallback: capitalize domain name
  return domain
    .replace(/\.(com|net|org|biz)$/, '')
    .split(/[-.]/)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ') || 'Unknown Vendor';
};

const Inventory: React.FC = () => {
  const { user, isAuthenticated } = useAuth();
  const [emails, setEmails] = useState<EmailData[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [orders, setOrders] = useState<OrderData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'orders' | 'inventory' | 'archive'>('orders');
  const [ordersSubTab, setOrdersSubTab] = useState<'pending' | 'confirmed'>('pending');
  const [inventorySubTab, setInventorySubTab] = useState<'pending' | 'current' | 'sold'>('pending');
  const [deletingItems, setDeletingItems] = useState<Set<number | string>>(new Set());
  const [expandedItems, setExpandedItems] = useState<Set<number>>(new Set());
  const [expandedVendors, setExpandedVendors] = useState<Set<string>>(new Set());
  const [expandedBrands, setExpandedBrands] = useState<Set<string>>(new Set());
  const [confirmingOrders, setConfirmingOrders] = useState<Set<string>>(new Set());
  const [archivingItems, setArchivingItems] = useState<Set<number>>(new Set());
  const [restoringItems, setRestoringItems] = useState<Set<number>>(new Set());
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [archivingBrands, setArchivingBrands] = useState<Set<string>>(new Set());
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
  const [archivingOrders, setArchivingOrders] = useState<Set<number>>(new Set());
  const [deletingOrders, setDeletingOrders] = useState<Set<number>>(new Set());
  const [sellingItems, setSellingItems] = useState<Set<number>>(new Set());
  const [deletingBrands, setDeletingBrands] = useState<Set<string>>(new Set());
  const [deletingVendors, setDeletingVendors] = useState<Set<string>>(new Set());
  const [copied, setCopied] = useState(false);

  // Copy email to clipboard
  const copyToClipboard = async () => {
    if (!user?.id) return;
    
    const email = `a48947dbd077295c13ea+${user.id}@cloudmailin.net`;
    try {
      await navigator.clipboard.writeText(email);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy email:', err);
      // Fallback for browsers that don't support clipboard API
      const textArea = document.createElement('textarea');
      textArea.value = email;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Load data
  const loadData = async () => {
    if (!isAuthenticated || !user) {
      setError('Please log in to view inventory data');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      const [emailResponse, inventoryResponse, ordersResponse] = await Promise.all([
        fetchEmails(),
        fetchInventory(),
        fetchOrders()
      ]);
      
      setEmails(emailResponse.emails || []);
      setInventory(inventoryResponse.inventory || []);
      setOrders(ordersResponse.orders || []);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load data';
      setError(errorMessage);
      console.error('Error loading inventory data:', err);
      
      // If it's an authentication error, don't keep showing loading
      if (errorMessage.includes('Authentication') || errorMessage.includes('401')) {
        setLoading(false);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated && user) {
      loadData();
    } else if (isAuthenticated === false) {
      // If explicitly not authenticated, stop loading
      setLoading(false);
      setError('Please log in to view inventory data');
    }
  }, [isAuthenticated, user]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = () => {
      setOpenDropdown(null);
    };
    
    if (openDropdown) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [openDropdown]);

  // Delete email function
  const handleDeleteEmail = async (emailId: string) => {
    setConfirmDeleteDialog({ isOpen: true, emailId, itemId: null, type: 'email' });
  };

  const confirmDelete = async () => {
    const { emailId, itemId, type } = confirmDeleteDialog;

    if (type === 'email' && emailId) {
      setDeletingItems(prev => new Set(prev).add(emailId));

      try {
        await deleteEmail(emailId);
        toast.success('Email deleted successfully');
        await loadData(); // Refresh the data
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Failed to delete email');
      } finally {
        setDeletingItems(prev => {
          const newSet = new Set(prev);
          newSet.delete(emailId);
          return newSet;
        });
      }
    } else if (type === 'item' && itemId) {
      setDeletingItems(prev => new Set(prev).add(itemId));

      try {
        await deleteInventoryItem(itemId);
        toast.success('Item deleted successfully');
        await loadData();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Failed to delete item');
      } finally {
        setDeletingItems(prev => {
          const newSet = new Set(prev);
          newSet.delete(itemId);
          return newSet;
        });
      }
    }
  };

  // Delete inventory item function
  const handleDeleteInventoryItem = async (itemId: string) => {
    setConfirmDeleteDialog({ isOpen: true, emailId: null, itemId, type: 'item' });
  };

  const oldHandleDeleteInventoryItem = async (itemId: number) => {
    if (!confirm('Are you sure you want to delete this inventory item?')) {
      return;
    }

    setDeletingItems(prev => new Set(prev).add(itemId));
    
    try {
      await deleteInventoryItem(itemId);
      await loadData(); // Refresh the data
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete inventory item');
    } finally {
      setDeletingItems(prev => {
        const newSet = new Set(prev);
        newSet.delete(itemId);
        return newSet;
      });
    }
  };

  // Toggle item expansion
  const toggleItemExpansion = (itemId: number) => {
    setExpandedItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(itemId)) {
        newSet.delete(itemId);
      } else {
        newSet.add(itemId);
      }
      return newSet;
    });
  };

  // Toggle vendor expansion
  const toggleVendorExpansion = (vendorName: string) => {
    setExpandedVendors(prev => {
      const newSet = new Set(prev);
      if (newSet.has(vendorName)) {
        newSet.delete(vendorName);
      } else {
        newSet.add(vendorName);
      }
      return newSet;
    });
  };

  // Toggle brand expansion
  const toggleBrandExpansion = (brandKey: string) => {
    setExpandedBrands(prev => {
      const newSet = new Set(prev);
      if (newSet.has(brandKey)) {
        newSet.delete(brandKey);
      } else {
        newSet.add(brandKey);
      }
      return newSet;
    });
  };

  // Confirm pending order
  const handleConfirmOrder = async (orderNumber: string) => {
    if (!confirm(`Are you sure you want to confirm order ${orderNumber}? All pending items will be moved to current inventory.`)) {
      return;
    }

    setConfirmingOrders(prev => new Set(prev).add(orderNumber));
    
    try {
      await confirmPendingOrder(orderNumber);
      await loadData(); // Refresh the data
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to confirm order');
    } finally {
      setConfirmingOrders(prev => {
        const newSet = new Set(prev);
        newSet.delete(orderNumber);
        return newSet;
      });
    }
  };

  // Archive inventory item
  const handleArchiveItem = async (itemId: number) => {
    if (!confirm('Are you sure you want to archive this item?')) {
      return;
    }

    setArchivingItems(prev => new Set(prev).add(itemId));
    
    try {
      await archiveInventoryItem(itemId);
      await loadData(); // Refresh the data
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to archive item');
    } finally {
      setArchivingItems(prev => {
        const newSet = new Set(prev);
        newSet.delete(itemId);
        return newSet;
      });
    }
  };

  // Restore inventory item
  const handleRestoreItem = async (itemId: number) => {
    if (!confirm('Are you sure you want to restore this item to current inventory?')) {
      return;
    }

    setRestoringItems(prev => new Set(prev).add(itemId));
    
    try {
      await restoreInventoryItem(itemId);
      await loadData(); // Refresh the data
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to restore item');
    } finally {
      setRestoringItems(prev => {
        const newSet = new Set(prev);
        newSet.delete(itemId);
        return newSet;
      });
    }
  };

  // Archive all items by brand
  const handleArchiveAllByBrand = async (brandName: string, vendorName: string) => {
    if (!confirm(`Are you sure you want to archive all items from ${brandName}? This will move all current items to the archive.`)) {
      return;
    }

    const brandKey = `${vendorName}-${brandName}`;
    setArchivingBrands(prev => new Set(prev).add(brandKey));
    
    try {
      await archiveAllItemsByBrand(brandName, vendorName);
      await loadData(); // Refresh the data
      setOpenDropdown(null); // Close the dropdown
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to archive items');
    } finally {
      setArchivingBrands(prev => {
        const newSet = new Set(prev);
        newSet.delete(brandKey);
        return newSet;
      });
    }
  };

  // View order details
  const handleViewOrderDetails = (email: EmailData) => {
    setSelectedEmailDetails(email);
    setShowOrderDetailsModal(true);
  };

  // Close order details modal
  const closeOrderDetailsModal = () => {
    setSelectedEmailDetails(null);
    setShowOrderDetailsModal(false);
  };

  // Toggle order expansion
  const toggleOrderExpansion = (orderKey: string) => {
    setExpandedOrders(prev => {
      const newSet = new Set(prev);
      if (newSet.has(orderKey)) {
        newSet.delete(orderKey);
      } else {
        newSet.add(orderKey);
      }
      return newSet;
    });
  };

  // Handle frame selection for partial confirmation
  const toggleFrameSelection = (frameId: number) => {
    setSelectedFrames(prev => {
      const newSet = new Set(prev);
      if (newSet.has(frameId)) {
        newSet.delete(frameId);
      } else {
        newSet.add(frameId);
      }
      return newSet;
    });
  };

  // Handle order confirmation dialog
  const handleOrderConfirmation = (orderKey: string) => {
    setConfirmingOrderKey(orderKey);
    const order = groupedPendingOrders[orderKey];
    if (order) {
      // Pre-select all frames
      const frameIds = order.items.map(item => item.id);
      setSelectedFrames(new Set(frameIds));
      setShowConfirmModal(true);
    }
  };

  // Process partial order confirmation
  const processPartialConfirmation = async () => {
    if (!confirmingOrderKey || selectedFrames.size === 0) return;

    const order = groupedPendingOrders[confirmingOrderKey];
    if (!order) return;

    try {
      // Move selected frames to current inventory
      const selectedFrameIds = Array.from(selectedFrames);
      
      for (const frameId of selectedFrameIds) {
        // Update individual frame status (you might want to create a batch API endpoint)
        // For now, we'll use the existing confirm order endpoint
        await confirmPendingOrder(order.orderNumber);
      }
      
      await loadData(); // Refresh data
      setShowConfirmModal(false);
      setSelectedFrames(new Set());
      setConfirmingOrderKey(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to confirm order');
    }
  };

  // Archive a confirmed order
  const handleArchiveOrder = async (orderId: number) => {
    if (!confirm('Are you sure you want to archive this order?')) {
      return;
    }

    setArchivingOrders(prev => new Set(prev).add(orderId));
    
    try {
      await archiveOrder(orderId);
      await loadData(); // Refresh the data
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to archive order');
    } finally {
      setArchivingOrders(prev => {
        const newSet = new Set(prev);
        newSet.delete(orderId);
        return newSet;
      });
    }
  };

  // Delete an archived order
  const handleDeleteOrder = async (orderId: number) => {
    if (!confirm('Are you sure you want to permanently delete this archived order? This action cannot be undone.')) {
      return;
    }

    setDeletingOrders(prev => new Set(prev).add(orderId));
    
    try {
      await deleteOrder(orderId);
      await loadData(); // Refresh the data
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete order');
    } finally {
      setDeletingOrders(prev => {
        const newSet = new Set(prev);
        newSet.delete(orderId);
        return newSet;
      });
    }
  };

  // Mark item as sold
  const handleMarkAsSold = async (itemId: number) => {
    if (!confirm('Are you sure you want to mark this item as sold?')) {
      return;
    }

    setSellingItems(prev => new Set(prev).add(itemId));
    
    try {
      await markItemAsSold(itemId);
      await loadData(); // Refresh the data
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to mark item as sold');
    } finally {
      setSellingItems(prev => {
        const newSet = new Set(prev);
        newSet.delete(itemId);
        return newSet;
      });
    }
  };

  // Delete all archived items by brand
  const handleDeleteArchivedByBrand = async (brandName: string, vendorName: string) => {
    if (!confirm(`Are you sure you want to permanently delete all archived items from ${brandName}? This action cannot be undone.`)) {
      return;
    }

    const brandKey = `${vendorName}-${brandName}`;
    setDeletingBrands(prev => new Set(prev).add(brandKey));
    
    try {
      await deleteArchivedItemsByBrand(brandName, vendorName);
      await loadData(); // Refresh the data
      setOpenDropdown(null); // Close the dropdown
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete archived items');
    } finally {
      setDeletingBrands(prev => {
        const newSet = new Set(prev);
        newSet.delete(brandKey);
        return newSet;
      });
    }
  };

  // Delete all archived items by vendor
  const handleDeleteArchivedByVendor = async (vendorName: string) => {
    if (!confirm(`Are you sure you want to permanently delete all archived items from ${vendorName}? This action cannot be undone.`)) {
      return;
    }

    setDeletingVendors(prev => new Set(prev).add(vendorName));
    
    try {
      await deleteArchivedItemsByVendor(vendorName);
      await loadData(); // Refresh the data
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete archived items');
    } finally {
      setDeletingVendors(prev => {
        const newSet = new Set(prev);
        newSet.delete(vendorName);
        return newSet;
      });
    }
  };

  // Filter data based on search term
  const filteredEmails = emails.filter(email =>
    (email.subject || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (email.from_email || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredInventory = inventory.filter(item => {
    const fullName = (item as any).full_name || item.sku || '';
    const brand = (item as any).brand || '';
    const model = (item as any).model || '';
    const sku = item.sku || '';
    const vendor = item.vendor || '';
    
    return (
      fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
      vendor.toLowerCase().includes(searchTerm.toLowerCase()) ||
      brand.toLowerCase().includes(searchTerm.toLowerCase()) ||
      model.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  // Separate inventory by status
  const pendingInventory = filteredInventory.filter(item => item.status === 'pending');
  const currentInventory = filteredInventory.filter(item => item.status === 'current');
  const archivedInventory = filteredInventory.filter(item => item.status === 'archived');
  const soldInventory = filteredInventory.filter(item => item.status === 'sold');

  // Group pending inventory by order number for new UX
  const groupPendingByOrder = (items: typeof inventory) => {
    return items.reduce((orders, item) => {
      const orderKey = `${item.vendor?.name}-${item.order?.order_number || 'Unknown'}`;
      if (!orders[orderKey]) {
        orders[orderKey] = {
          vendor: item.vendor?.name,
          orderNumber: item.order?.order_number || 'Unknown',
          orderDate: item.order?.order_date || '',
          accountNumber: (item as any).account_number || '',
          items: []
        };
      }
      orders[orderKey].items.push(item);
      return orders;
    }, {} as Record<string, { vendor: string; orderNumber: string; orderDate: string; accountNumber: string; items: typeof inventory }>);
  };

  const groupedPendingOrders = groupPendingByOrder(pendingInventory);
  
  // Debug: Log order dates to check format (disabled for production)
  // React.useEffect(() => {
  //   if (pendingInventory.length > 0) {
  //     console.log('Debug: Sample inventory item with order data:', pendingInventory[0]);
  //     console.log('Debug: Order date from first item:', pendingInventory[0]?.order?.order_date);
  //   }
  //   
  //   // Test the formatOrderDate function with known values
  //   console.log('Testing formatOrderDate function:');
  //   console.log('- Input: "09/08/2025" → Output:', formatOrderDate("09/08/2025"));
  //   console.log('- Input: undefined → Output:', formatOrderDate(undefined));
  //   console.log('- Input: "invalid" → Output:', formatOrderDate("invalid"));
  //   console.log('- Input: "12/25/2023" → Output:', formatOrderDate("12/25/2023"));
  // }, [pendingInventory]);

  // Helper function to group inventory by vendor, then by brand
  const groupInventoryByVendorAndBrand = (items: typeof inventory) => {
    return items.reduce((vendors, item) => {
      const vendor = item.vendor?.name || 'Unknown Vendor';
      const brand = (item as any).brand || 'Unknown Brand';
      
      if (!vendors[vendor]) {
        vendors[vendor] = {};
      }
      if (!vendors[vendor][brand]) {
        vendors[vendor][brand] = [];
      }
      vendors[vendor][brand].push(item);
      return vendors;
    }, {} as Record<string, Record<string, typeof inventory>>);
  };

  // Group each inventory collection
  const groupedPendingInventory = groupInventoryByVendorAndBrand(pendingInventory);
  const groupedCurrentInventory = groupInventoryByVendorAndBrand(currentInventory);
  const groupedArchivedInventory = groupInventoryByVendorAndBrand(archivedInventory);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  /**
   * Safely format order date string for display
   * Handles multiple formats: MM/DD/YYYY, YYYY-MM-DD, ISO timestamps
   */
  const formatOrderDate = (dateString: string | undefined): string => {
    if (!dateString) return 'N/A';

    // If already formatted with comma, return as is
    if (dateString.includes(',')) return dateString;

    let date: Date;

    // Try different date formats
    if (dateString.includes('/')) {
      // Handle MM/DD/YYYY format
      const [month, day, year] = dateString.split('/');
      if (month && day && year) {
        date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
      } else {
        console.error('Invalid MM/DD/YYYY format:', dateString);
        return 'Invalid Date';
      }
    } else if (dateString.match(/^\d{4}-\d{2}-\d{2}$/)) {
      // Handle YYYY-MM-DD format (date only, no time)
      // Parse as local date to avoid timezone issues
      const [year, month, day] = dateString.split('-');
      date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    } else {
      // Handle ISO timestamp or other formats
      date = new Date(dateString);
    }

    // Verify parsing succeeded
    if (isNaN(date.getTime())) {
      console.error('Invalid date format:', dateString);
      return 'Invalid Date';
    }

    // Format for display (removed timezone to avoid date shifting)
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <RefreshCwIcon className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading inventory data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Inventory Management</h1>
          <p className="text-gray-600">Track pending orders and received inventory items</p>
        </div>

        {/* Forwarding Email Section */}
        {user && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <h3 className="text-sm font-medium text-gray-700 mb-2">
              📧 Forward vendor emails to:
            </h3>
            <div className="flex items-center gap-2">
              <code className="flex-1 bg-white px-3 py-2 rounded border border-blue-200 text-sm font-mono text-gray-800">
                a48947dbd077295c13ea+{user.id}@cloudmailin.net
              </code>
              <button
                onClick={copyToClipboard}
                className="inline-flex items-center px-3 py-2 border border-blue-200 rounded-md text-sm font-medium text-blue-700 bg-white hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                title={copied ? 'Copied!' : 'Copy to clipboard'}
              >
                {copied ? (
                  <Check size={16} className="text-green-600" />
                ) : (
                  <Copy size={16} />
                )}
              </button>
            </div>
            {copied && (
              <p className="mt-2 text-xs text-green-600">Email address copied to clipboard!</p>
            )}
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-md p-4">
            <div className="flex">
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">
                  Error loading data
                </h3>
                <div className="mt-2 text-sm text-red-700">
                  <p>{error}</p>
                </div>
                <div className="mt-4">
                  <button
                    onClick={loadData}
                    className="bg-red-100 px-3 py-1 rounded-md text-sm font-medium text-red-800 hover:bg-red-200"
                  >
                    Retry
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Search and Controls */}
        <div className="mb-6 flex flex-col sm:flex-row gap-4 items-center justify-between">
          <div className="relative flex-1 max-w-md">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <SearchIcon className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search emails or inventory..."
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button
            onClick={loadData}
            className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <RefreshCwIcon className="h-4 w-4 mr-2" />
            Refresh
          </button>
        </div>

        {/* Main Tabs */}
        <div className="mb-6">
          <nav className="flex space-x-8 border-b border-gray-200">
            <button
              onClick={() => setActiveTab('orders')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'orders'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <MailIcon className="h-5 w-5 inline mr-2" />
              Orders ({filteredEmails.length + orders.filter(o => o.status === 'confirmed' && !o.metadata?.archived).length})
            </button>
            <button
              onClick={() => setActiveTab('inventory')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'inventory'
                  ? 'border-green-500 text-green-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <PackageIcon className="h-5 w-5 inline mr-2" />
              Inventory ({pendingInventory.length + currentInventory.length + soldInventory.length})
            </button>
            <button
              onClick={() => setActiveTab('archive')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'archive'
                  ? 'border-gray-500 text-gray-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <ArchiveIcon className="h-5 w-5 inline mr-2" />
              Archive ({archivedInventory.length + orders.filter(o => o.metadata?.archived).length})
            </button>
          </nav>
        </div>

        {/* Content */}
        <div className="bg-white shadow rounded-lg overflow-hidden">

          {/* ORDERS TAB */}
          {activeTab === 'orders' && (
            <div>
              {/* Orders Sub-tabs */}
              <div className="border-b border-gray-200 bg-gray-50 px-6">
                <nav className="flex space-x-8">
                  <button
                    onClick={() => setOrdersSubTab('pending')}
                    className={`py-3 px-1 border-b-2 font-medium text-sm ${
                      ordersSubTab === 'pending'
                        ? 'border-orange-500 text-orange-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    Pending ({filteredEmails.length})
                  </button>
                  <button
                    onClick={() => setOrdersSubTab('confirmed')}
                    className={`py-3 px-1 border-b-2 font-medium text-sm ${
                      ordersSubTab === 'confirmed'
                        ? 'border-green-500 text-green-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    Confirmed ({orders.filter(o => o.status === 'confirmed' && !o.metadata?.archived).length})
                  </button>
                </nav>
              </div>

              {/* Pending Orders Content */}
              {ordersSubTab === 'pending' && (
            <div>
              {filteredEmails.length === 0 ? (
                <div className="text-center py-12">
                  <MailIcon className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No pending orders</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    {searchTerm ? 'No orders match your search.' : 'No order emails have been received yet.'}
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Vendor
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Order Details
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Items
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Email Received
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      <AnimatePresence mode="popLayout">
                        {filteredEmails.map((email, index) => {
                          const isParsed = email.parse_status === 'parsed' && email.parsed_data;
                          const vendorName = isParsed ? email.parsed_data!.vendor : extractVendorFromEmail(email.from_email);

                          // Extract brands from items if brands array is missing
                          const getBrands = () => {
                            if (!isParsed || !email.parsed_data) return [];
                            if (email.parsed_data.brands && email.parsed_data.brands.length > 0) {
                              return email.parsed_data.brands;
                            }
                            // Fallback: extract unique brands from items
                            if (email.parsed_data.items && email.parsed_data.items.length > 0) {
                              const uniqueBrands = [...new Set(email.parsed_data.items.map(item => item.brand).filter(Boolean))];
                              return uniqueBrands;
                            }
                            return [];
                          };

                          const brands = getBrands();

                          return (
                            <motion.tr
                              key={email.id}
                              layout
                              initial={{ opacity: 0, x: -20 }}
                              animate={{ opacity: 1, x: 0 }}
                              exit={{ opacity: 0, x: 20, height: 0 }}
                              transition={{ duration: 0.3, delay: index * 0.05 }}
                              className="hover:bg-gray-50"
                            >
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              <div className="flex items-center">
                                <span>{vendorName}</span>
                                {isParsed && (
                                  <span className="ml-2 inline-flex px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
                                    Parsed
                                  </span>
                                )}
                              </div>
                              {isParsed && brands.length > 0 && (
                                <div className="text-xs text-gray-500 mt-1">
                                  Brands: {brands.join(', ')}
                                </div>
                              )}
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-500">
                              {isParsed ? (
                                <div>
                                  <div className="font-medium">Order #{email.parsed_data!.order.order_number}</div>
                                  <div className="text-xs text-gray-500 mt-1">
                                    Customer: {email.parsed_data!.order.customer_name}
                                  </div>
                                  <div className="text-xs text-gray-500">
                                    Account: {email.parsed_data!.account_number}
                                  </div>
                                </div>
                              ) : (
                                <div className="truncate max-w-xs">{email.subject}</div>
                              )}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {isParsed ? (
                                <div>
                                  <div className="font-medium">{email.parsed_data!.items.length} items</div>
                                  <div className="text-xs text-gray-500 mt-1">
                                    Total: {email.parsed_data!.order.total_pieces} pieces
                                  </div>
                                </div>
                              ) : (
                                <span className="text-gray-400">Not parsed</span>
                              )}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {formatDate(email.processed_at)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                                isParsed
                                  ? 'bg-green-100 text-green-800'
                                  : 'bg-yellow-100 text-yellow-800'
                              }`}>
                                {isParsed ? 'Parsed' : 'Pending'}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              <div className="flex space-x-2">
                                <button
                                  onClick={() => handleViewOrderDetails(email)}
                                  className="text-blue-600 hover:text-blue-900 flex items-center"
                                >
                                  <EyeIcon className="h-4 w-4 mr-1" />
                                  Preview Order
                                </button>
                                <motion.button
                                  whileHover={{ scale: 1.05 }}
                                  whileTap={{ scale: 0.95 }}
                                  onClick={() => handleDeleteEmail(email.id)}
                                  disabled={deletingItems.has(email.id)}
                                  className="text-red-600 hover:text-red-900 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                >
                                  {deletingItems.has(email.id) ? (
                                    <span className="flex items-center">
                                      <div className="animate-spin h-4 w-4 border-2 border-red-500 border-t-transparent rounded-full mr-1"></div>
                                      Deleting...
                                    </span>
                                  ) : (
                                    <TrashIcon className="h-4 w-4" />
                                  )}
                                </motion.button>
                              </div>
                            </td>
                          </motion.tr>
                          );
                        })}
                      </AnimatePresence>
                    </tbody>
                  </table>
                </div>
              )}

              {/* Confirmed Orders Content */}
              {ordersSubTab === 'confirmed' && (
                <div className="p-6">
                  {orders.filter(order => order.status === 'confirmed' && !order.metadata?.archived).length === 0 ? (
                    <div className="text-center py-12">
                      <CheckIcon className="mx-auto h-12 w-12 text-gray-400" />
                      <h3 className="mt-2 text-sm font-medium text-gray-900">No confirmed orders</h3>
                      <p className="mt-1 text-sm text-gray-500">
                        Confirmed orders will appear here after you confirm pending inventory
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {orders
                        .filter(order => order.status === 'confirmed' && !order.metadata?.archived)
                        .filter(order => {
                          if (!searchTerm) return true;
                          return (
                            (order.order_number || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                            (order.vendor || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                            (order.customer_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                            (order.account_number || '').toLowerCase().includes(searchTerm.toLowerCase())
                          );
                        })
                        .map(order => (
                        <div key={order.id} className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                          <div className="flex justify-between items-start mb-4">
                            <div>
                              <h3 className="text-lg font-semibold text-gray-900">
                                {order.vendor} • {order.customer_name || 'Unknown Customer'}
                              </h3>
                              <p className="text-sm text-gray-600 mt-1">
                                Order #{order.order_number}
                                {order.account_number && ` • Account: ${order.account_number}`}
                              </p>
                            </div>
                            <div className="flex space-x-2">
                              <button
                                onClick={() => handleArchiveOrder(order.id)}
                                className="text-gray-600 hover:text-gray-900 text-sm px-3 py-1 border border-gray-300 rounded hover:bg-gray-50"
                              >
                                <ArchiveIcon className="h-4 w-4 inline mr-1" />
                                Archive
                              </button>
                            </div>
                          </div>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                            <div>
                              <span className="font-medium text-gray-600">Order Date:</span>
                              <span className="ml-2 text-gray-900">{order.order_date || 'Not specified'}</span>
                            </div>
                            <div>
                              <span className="font-medium text-gray-600">Total Pieces:</span>
                              <span className="ml-2 text-gray-900">{order.total_pieces || 0}</span>
                            </div>
                            <div>
                              <span className="font-medium text-gray-600">Status:</span>
                              <span className="ml-2 px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
                                Confirmed
                              </span>
                            </div>
                          </div>
                        </div>
                        ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* INVENTORY TAB */}
          {activeTab === 'inventory' && (
            <div>
              {/* Inventory Sub-tabs */}
              <div className="border-b border-gray-200 bg-gray-50 px-6">
                <nav className="flex space-x-8">
                  <button
                    onClick={() => setInventorySubTab('pending')}
                    className={`py-3 px-1 border-b-2 font-medium text-sm ${
                      inventorySubTab === 'pending'
                        ? 'border-orange-500 text-orange-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    Pending ({pendingInventory.length})
                  </button>
                  <button
                    onClick={() => setInventorySubTab('current')}
                    className={`py-3 px-1 border-b-2 font-medium text-sm ${
                      inventorySubTab === 'current'
                        ? 'border-green-500 text-green-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    Current ({currentInventory.length})
                  </button>
                  <button
                    onClick={() => setInventorySubTab('sold')}
                    className={`py-3 px-1 border-b-2 font-medium text-sm ${
                      inventorySubTab === 'sold'
                        ? 'border-purple-500 text-purple-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    Sold ({soldInventory.length})
                  </button>
                </nav>
              </div>

              {/* Pending Inventory Content */}
              {inventorySubTab === 'pending' && (
            <div>
              {pendingInventory.length === 0 ? (
                <div className="text-center py-12">
                  <PackageIcon className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No pending inventory items</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    {searchTerm ? 'No pending items match your search.' : 'No pending inventory items yet.'}
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {Object.entries(groupedPendingOrders).map(([orderKey, order]) => {
                    const isOrderExpanded = expandedOrders.has(orderKey);
                    
                    return (
                      <div key={orderKey} className="bg-white rounded-lg border border-gray-200 shadow-sm">
                        {/* Order Header */}
                        <div 
                          className="px-6 py-4 cursor-pointer hover:bg-gray-50 transition-colors duration-150"
                          onClick={() => toggleOrderExpansion(orderKey)}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              {isOrderExpanded ? (
                                <ChevronDownIcon className="h-5 w-5 text-gray-400 transition-transform duration-150" />
                              ) : (
                                <ChevronRightIcon className="h-5 w-5 text-gray-400 transition-transform duration-150" />
                              )}
                              <div>
                                <h2 className="text-lg font-semibold text-gray-900">
                                  {order.vendor} - Order #{order.orderNumber}
                                </h2>
                                <p className="text-sm text-gray-500">
                                  {order.items.length} item{order.items.length !== 1 ? 's' : ''} pending confirmation
                                  {order.accountNumber && ` • Account #${order.accountNumber}`}
                                  {order.orderDate && ` • ${formatOrderDate(order.orderDate)}`}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center space-x-2">
                              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-orange-100 text-orange-800">
                                {order.items.length} pending
                              </span>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleOrderConfirmation(orderKey);
                                }}
                                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                              >
                                Confirm Order
                              </button>
                            </div>
                          </div>
                        </div>

                        {/* Order Items (shown when expanded) */}
                        {isOrderExpanded && (
                          <div className="border-t border-gray-200 bg-gray-50">
                            <div className="divide-y divide-gray-200">
                              {order.items.map((item) => {
                                const isItemExpanded = expandedItems.has(item.id);
                                const isSelected = selectedFrames.has(item.id);
                                const fullName = (item as any).full_name || item.sku;
                                const brand = (item as any).brand || '';
                                const model = (item as any).model || '';
                                const colorName = (item as any).color_name || (item as any).color || '';
                                const size = (item as any).size || '';
                                const fullSize = (item as any).full_size || '';
                                const orderNumber = item.order?.order_number || '';
                                const accountNumber = (item as any).account_number || '';
                                
                                const frameName = model || fullName;
                                
                                return (
                                  <div key={item.id} className="relative bg-white">
                                    {/* Item Header */}
                                    <div className="px-6 py-4 hover:bg-gray-50 transition-colors duration-150">
                                      <div className="flex items-center justify-between">
                                        <div className="flex items-center space-x-4 flex-1">
                                          {/* Selection Checkbox */}
                                          <div className="flex-shrink-0">
                                            <input
                                              type="checkbox"
                                              checked={isSelected}
                                              onChange={() => toggleFrameSelection(item.id)}
                                              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                            />
                                          </div>
                                          
                                          {/* Expand/Collapse Button */}
                                          <button
                                            onClick={() => toggleItemExpansion(item.id)}
                                            className="flex-shrink-0 p-1 hover:bg-gray-100 rounded"
                                          >
                                            {isItemExpanded ? (
                                              <ChevronDownIcon className="h-4 w-4 text-gray-400" />
                                            ) : (
                                              <ChevronRightIcon className="h-4 w-4 text-gray-400" />
                                            )}
                                          </button>
                                          
                                          {/* Frame Info */}
                                          <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium text-gray-900 truncate">
                                              {frameName}
                                            </p>
                                            <p className="text-xs text-gray-500">
                                              {colorName} • {fullSize || `Size ${size}`} • Qty: {item.quantity}
                                            </p>
                                          </div>
                                          
                                          {/* Pricing Info */}
                                          <div className="flex-shrink-0 text-right">
                                            {(item as any).wholesale_price && (
                                              <p className="text-sm font-medium text-gray-900">
                                                ${(item as any).wholesale_price}
                                              </p>
                                            )}
                                            {(item as any).api_verified && (
                                              <span className="inline-flex items-center px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
                                                ✓ Verified
                                              </span>
                                            )}
                                          </div>
                                          
                                          {/* Actions */}
                                          <div className="flex-shrink-0">
                                            <button
                                              onClick={() => handleDeleteInventoryItem(item.id)}
                                              disabled={deletingItems.has(item.id)}
                                              className="text-red-600 hover:text-red-900 disabled:opacity-50 disabled:cursor-not-allowed p-1"
                                            >
                                              {deletingItems.has(item.id) ? (
                                                <div className="animate-spin h-4 w-4 border-2 border-red-500 border-t-transparent rounded-full"></div>
                                              ) : (
                                                <TrashIcon className="h-4 w-4" />
                                              )}
                                            </button>
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                    
                                    {/* Expanded Item Details (View Details layout) */}
                                    {isItemExpanded && (
                                      <div className="px-6 pb-4 bg-gray-100 border-t border-gray-200">
                                        <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                                          {/* Order Information */}
                                          <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
                                            <h4 className="text-sm font-medium text-gray-900 mb-3">Order Information</h4>
                                            <div className="space-y-2">
                                              <div className="flex justify-between">
                                                <span className="text-sm text-gray-500">Order Date:</span>
                                                <span className="text-sm text-gray-900">{formatOrderDate(item.order?.order_date)}</span>
                                              </div>
                                              <div className="flex justify-between">
                                                <span className="text-sm text-gray-500">Vendor:</span>
                                                <span className="text-sm text-gray-900">{item.vendor?.name}</span>
                                              </div>
                                              {orderNumber && (
                                                <div className="flex justify-between">
                                                  <span className="text-sm text-gray-500">Order #:</span>
                                                  <span className="text-sm text-gray-900">{orderNumber}</span>
                                                </div>
                                              )}
                                              {accountNumber && (
                                                <div className="flex justify-between">
                                                  <span className="text-sm text-gray-500">Account #:</span>
                                                  <span className="text-sm text-gray-900">{accountNumber}</span>
                                                </div>
                                              )}
                                              <div className="flex justify-between">
                                                <span className="text-sm text-gray-500">UPC:</span>
                                                <span className="text-sm text-gray-900 font-mono text-xs">{(item as any).upc || 'N/A'}</span>
                                              </div>
                                              {(item as any).availability && (
                                                <div className="flex justify-between">
                                                  <span className="text-sm text-gray-500">Stock Status:</span>
                                                  <span className={`text-sm font-medium ${
                                                    (item as any).in_stock ? 'text-green-800' : 'text-red-800'
                                                  }`}>
                                                    {(item as any).availability}
                                                  </span>
                                                </div>
                                              )}
                                            </div>
                                          </div>
                                          
                                          {/* Product Details */}
                                          <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
                                            <h4 className="text-sm font-medium text-gray-900 mb-3">Product Details</h4>
                                            <div className="space-y-2">
                                              <div className="flex justify-between">
                                                <span className="text-sm text-gray-500">Brand:</span>
                                                <span className="text-sm text-gray-900">{brand}</span>
                                              </div>
                                              <div className="flex justify-between">
                                                <span className="text-sm text-gray-500">Model:</span>
                                                <span className="text-sm text-gray-900">{model}</span>
                                              </div>
                                              <div className="flex justify-between">
                                                <span className="text-sm text-gray-500">Color:</span>
                                                <span className="text-sm text-gray-900">{colorName}</span>
                                              </div>
                                              <div className="flex justify-between">
                                                <span className="text-sm text-gray-500">Size:</span>
                                                <span className="text-sm text-gray-900">{fullSize || size}</span>
                                              </div>
                                            </div>
                                          </div>
                                          
                                          {/* Pricing & Details */}
                                          <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
                                            <h4 className="text-sm font-medium text-gray-900 mb-3">Pricing & Details</h4>
                                            <div className="space-y-2">
                                              <div className="flex justify-between">
                                                <span className="text-sm text-gray-500">Wholesale Price:</span>
                                                <span className="text-sm text-gray-900">
                                                  {(item as any).wholesale_price ? `$${(item as any).wholesale_price}` : '$--'}
                                                </span>
                                              </div>
                                              <div className="flex justify-between">
                                                <span className="text-sm text-gray-500">MSRP:</span>
                                                <span className="text-sm text-gray-900">
                                                  {(item as any).msrp ? `$${(item as any).msrp}` : '$--'}
                                                </span>
                                              </div>
                                              {(item as any).api_verified && (
                                                <div className="flex justify-between">
                                                  <span className="text-sm text-gray-500">API Verified:</span>
                                                  <span className="inline-flex items-center px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
                                                    {(item as any).confidence_score}% confidence
                                                  </span>
                                                </div>
                                              )}
                                              <div className="flex justify-between">
                                                <span className="text-sm text-gray-500">Measurements:</span>
                                                <span className="text-sm text-gray-500">
                                                  {(item as any).full_size || '--'}
                                                </span>
                                              </div>
                                              <div className="flex justify-between items-center pt-2 border-t border-gray-100">
                                                <span className="text-sm text-gray-500">Quantity:</span>
                                                <span className="text-sm font-medium text-gray-900">{item.quantity}</span>
                                              </div>
                                            </div>
                                          </div>
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

              {/* Current Inventory Content */}
              {inventorySubTab === 'current' && (
            <div>
              {currentInventory.length === 0 ? (
                <div className="text-center py-12">
                  <PackageIcon className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No current inventory items</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    {searchTerm ? 'No current items match your search.' : 'No confirmed inventory items yet.'}
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {Object.entries(groupedCurrentInventory).map(([vendorName, brands]) => {
                    const isVendorExpanded = expandedVendors.has(vendorName);
                    const totalItemsInVendor = Object.values(brands).flat().length;
                    
                    return (
                      <div key={vendorName} className="bg-white rounded-lg border border-gray-200 shadow-sm">
                        {/* Vendor Header */}
                        <div 
                          className="px-6 py-4 cursor-pointer hover:bg-gray-50 transition-colors duration-150"
                          onClick={() => toggleVendorExpansion(vendorName)}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              {isVendorExpanded ? (
                                <ChevronDownIcon className="h-5 w-5 text-gray-400 transition-transform duration-150" />
                              ) : (
                                <ChevronRightIcon className="h-5 w-5 text-gray-400 transition-transform duration-150" />
                              )}
                              <div>
                                <h2 className="text-lg font-semibold text-gray-900">{vendorName}</h2>
                                <p className="text-sm text-gray-500">
                                  {Object.keys(brands).length} brand{Object.keys(brands).length !== 1 ? 's' : ''} • {totalItemsInVendor} item{totalItemsInVendor !== 1 ? 's' : ''}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center space-x-2">
                              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                                {totalItemsInVendor} items
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Brands (shown when vendor is expanded) */}
                        {isVendorExpanded && (
                          <div className="border-t border-gray-200">
                            {Object.entries(brands).map(([brandName, items]) => {
                              const brandKey = `${vendorName}-${brandName}`;
                              const isBrandExpanded = expandedBrands.has(brandKey);
                              
                              return (
                                <div key={brandKey} className="border-b border-gray-100 last:border-b-0">
                                  {/* Brand Header */}
                                  <div className="px-8 py-3 bg-gray-25 relative">
                                    <div className="flex items-center justify-between">
                                      <div 
                                        className="flex items-center space-x-3 flex-1 cursor-pointer hover:bg-gray-50 transition-colors duration-150 p-2 -m-2 rounded"
                                        onClick={() => toggleBrandExpansion(brandKey)}
                                      >
                                        {isBrandExpanded ? (
                                          <ChevronDownIcon className="h-4 w-4 text-gray-400 transition-transform duration-150" />
                                        ) : (
                                          <ChevronRightIcon className="h-4 w-4 text-gray-400 transition-transform duration-150" />
                                        )}
                                        <div>
                                          <h3 className="text-base font-medium text-gray-800">{brandName}</h3>
                                          <p className="text-sm text-gray-500">{items.length} item{items.length !== 1 ? 's' : ''}</p>
                                        </div>
                                      </div>
                                      <div className="flex items-center space-x-2">
                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                                          {items.length}
                                        </span>
                                        <div className="relative">
                                          <button
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              setOpenDropdown(openDropdown === brandKey ? null : brandKey);
                                            }}
                                            className="p-1 hover:bg-gray-100 rounded-full transition-colors duration-150"
                                            title="More actions"
                                          >
                                            <MoreVerticalIcon className="h-4 w-4 text-gray-500" />
                                          </button>
                                          {openDropdown === brandKey && (
                                            <div className="absolute right-0 top-8 w-48 bg-white rounded-md shadow-lg border border-gray-200 py-1 z-50">
                                              <button
                                                onClick={(e) => {
                                                  e.stopPropagation();
                                                  handleArchiveAllByBrand(brandName, vendorName);
                                                }}
                                                disabled={archivingBrands.has(brandKey)}
                                                className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                                              >
                                                {archivingBrands.has(brandKey) ? (
                                                  <>
                                                    <div className="animate-spin h-4 w-4 border-2 border-orange-500 border-t-transparent rounded-full"></div>
                                                    <span>Archiving...</span>
                                                  </>
                                                ) : (
                                                  <>
                                                    <ArchiveIcon className="h-4 w-4" />
                                                    <span>Archive all {brandName} items</span>
                                                  </>
                                                )}
                                              </button>
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                  </div>

                                  {/* Items (shown when brand is expanded) */}
                                  {isBrandExpanded && (
                                    <div className="bg-gray-50">
                                      <div className="divide-y divide-gray-200">
                                        {items.map((item) => {
                                          const isExpanded = expandedItems.has(item.id);
                                          const fullName = (item as any).full_name || item.sku;
                                          const brand = (item as any).brand || '';
                                          const model = (item as any).model || '';
                                          const colorName = (item as any).color_name || (item as any).color || '';
                                          const colorCode = (item as any).color_code || '';
                                          const size = (item as any).size || '';
                                          const fullSize = (item as any).full_size || '';
                                          const status = (item as any).status || 'current';
                                          const orderNumber = item.order?.order_number || '';
                                          const accountNumber = (item as any).account_number || '';
                                          
                                          // Use model directly, don't mix with other data
                                          const frameName = model || item.sku;
                                          
                                          return (
                                            <div key={item.id} className="relative bg-white">
                                              {/* Collapsed Row */}
                                              <div 
                                                className="px-10 py-3 hover:bg-gray-50 cursor-pointer transition-colors duration-150"
                                                onClick={() => toggleItemExpansion(item.id)}
                                              >
                                                <div className="flex items-center justify-between">
                                                  <div className="flex-1 min-w-0">
                                                    <div className="flex items-center space-x-4">
                                                      {/* Expand/Collapse Icon */}
                                                      <div className="flex-shrink-0">
                                                        {isExpanded ? (
                                                          <ChevronDownIcon className="h-4 w-4 text-gray-400 transition-transform duration-150" />
                                                        ) : (
                                                          <ChevronRightIcon className="h-4 w-4 text-gray-400 transition-transform duration-150" />
                                                        )}
                                                      </div>
                                                      
                                                      {/* Frame Name */}
                                                      <div className="flex-1 min-w-0">
                                                        <p className="text-sm font-medium text-gray-900 truncate">
                                                          {frameName}
                                                        </p>
                                                        <p className="text-xs text-gray-500">
                                                          {colorName} • {fullSize || `Size ${size}`}
                                                        </p>
                                                      </div>
                                                      
                                                      {/* Quantity */}
                                                      <div className="flex-shrink-0">
                                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                                          Qty: {item.quantity}
                                                        </span>
                                                      </div>
                                                      
                                                      {/* Status */}
                                                      <div className="flex-shrink-0">
                                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                                          Current
                                                        </span>
                                                      </div>
                                                      
                                                      {/* Action Buttons */}
                                                      <div className="flex-shrink-0 flex space-x-2">
                                                        <button
                                                          onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleMarkAsSold(item.id);
                                                          }}
                                                          disabled={sellingItems.has(item.id)}
                                                          className="text-purple-600 hover:text-purple-900 disabled:opacity-50 disabled:cursor-not-allowed px-2 py-1 text-xs border border-purple-600 rounded hover:bg-purple-50"
                                                        >
                                                          {sellingItems.has(item.id) ? (
                                                            <div className="animate-spin h-3 w-3 border-2 border-purple-500 border-t-transparent rounded-full"></div>
                                                          ) : (
                                                            'Sold'
                                                          )}
                                                        </button>
                                                        <button
                                                          onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleArchiveItem(item.id);
                                                          }}
                                                          disabled={archivingItems.has(item.id)}
                                                          className="text-orange-600 hover:text-orange-900 disabled:opacity-50 disabled:cursor-not-allowed px-2 py-1 text-xs border border-orange-600 rounded hover:bg-orange-50"
                                                        >
                                                          {archivingItems.has(item.id) ? (
                                                            <div className="animate-spin h-3 w-3 border-2 border-orange-500 border-t-transparent rounded-full"></div>
                                                          ) : (
                                                            'Archive'
                                                          )}
                                                        </button>
                                                      </div>
                                                    </div>
                                                  </div>
                                                </div>
                                              </div>
                                              
                                              {/* Expanded Card - Same as pending */}
                                              {isExpanded && (
                                                <div className="px-10 pb-4 bg-gray-100 border-t border-gray-200">
                                                  <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                                                    {/* Order Information */}
                                                    <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
                                                      <h4 className="text-sm font-medium text-gray-900 mb-3">Order Information</h4>
                                                      <div className="space-y-2">
                                                        <div className="flex justify-between">
                                                          <span className="text-sm text-gray-500">Order Date:</span>
                                                          <span className="text-sm text-gray-900">{formatOrderDate(item.order?.order_date)}</span>
                                                        </div>
                                                        <div className="flex justify-between">
                                                          <span className="text-sm text-gray-500">Vendor:</span>
                                                          <span className="text-sm text-gray-900">{item.vendor?.name}</span>
                                                        </div>
                                                        {orderNumber && (
                                                          <div className="flex justify-between">
                                                            <span className="text-sm text-gray-500">Order #:</span>
                                                            <span className="text-sm text-gray-900">{orderNumber}</span>
                                                          </div>
                                                        )}
                                                        {accountNumber && (
                                                          <div className="flex justify-between">
                                                            <span className="text-sm text-gray-500">Account #:</span>
                                                            <span className="text-sm text-gray-900">{accountNumber}</span>
                                                          </div>
                                                        )}
                                                        <div className="flex justify-between">
                                                          <span className="text-sm text-gray-500">UPC:</span>
                                                          <span className="text-sm text-gray-900 font-mono text-xs">{(item as any).upc || 'N/A'}</span>
                                                        </div>
                                                        {(item as any).availability && (
                                                          <div className="flex justify-between">
                                                            <span className="text-sm text-gray-500">Stock Status:</span>
                                                            <span className={`text-sm font-medium ${
                                                              (item as any).in_stock ? 'text-green-800' : 'text-red-800'
                                                            }`}>
                                                              {(item as any).availability}
                                                            </span>
                                                          </div>
                                                        )}
                                                      </div>
                                                    </div>
                                                    
                                                    {/* Product Details */}
                                                    <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
                                                      <h4 className="text-sm font-medium text-gray-900 mb-3">Product Details</h4>
                                                      <div className="space-y-2">
                                                        <div className="flex justify-between">
                                                          <span className="text-sm text-gray-500">Brand:</span>
                                                          <span className="text-sm text-gray-900">{brand}</span>
                                                        </div>
                                                        <div className="flex justify-between">
                                                          <span className="text-sm text-gray-500">Model:</span>
                                                          <span className="text-sm text-gray-900">{model}</span>
                                                        </div>
                                                        <div className="flex justify-between">
                                                          <span className="text-sm text-gray-500">Color:</span>
                                                          <span className="text-sm text-gray-900">{colorName}</span>
                                                        </div>
                                                        <div className="flex justify-between">
                                                          <span className="text-sm text-gray-500">Size:</span>
                                                          <span className="text-sm text-gray-900">{fullSize || size}</span>
                                                        </div>
                                                      </div>
                                                    </div>
                                                    
                                                    {/* Pricing & Measurements */}
                                                    <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
                                                      <h4 className="text-sm font-medium text-gray-900 mb-3">Pricing & Details</h4>
                                                      <div className="space-y-2">
                                                        <div className="flex justify-between">
                                                          <span className="text-sm text-gray-500">Wholesale Price:</span>
                                                          <span className="text-sm text-gray-900">
                                                            {(item as any).wholesale_price ? `$${(item as any).wholesale_price}` : '$--'}
                                                          </span>
                                                        </div>
                                                        <div className="flex justify-between">
                                                          <span className="text-sm text-gray-500">MSRP:</span>
                                                          <span className="text-sm text-gray-900">
                                                            {(item as any).msrp ? `$${(item as any).msrp}` : '$--'}
                                                          </span>
                                                        </div>
                                                        {(item as any).api_verified && (
                                                          <div className="flex justify-between">
                                                            <span className="text-sm text-gray-500">API Verified:</span>
                                                            <span className="inline-flex items-center px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
                                                              {(item as any).confidence_score}% confidence
                                                            </span>
                                                          </div>
                                                        )}
                                                        <div className="flex justify-between">
                                                          <span className="text-sm text-gray-500">Measurements:</span>
                                                          <span className="text-sm text-gray-500">
                                                            {(item as any).full_size || '--'}
                                                          </span>
                                                        </div>
                                                        <div className="flex justify-between items-center pt-2 border-t border-gray-100">
                                                          <span className="text-sm text-gray-500">Quantity:</span>
                                                          <span className="text-sm font-medium text-gray-900">{item.quantity}</span>
                                                        </div>
                                                      </div>
                                                    </div>
                                                  </div>
                                                </div>
                                              )}
                                            </div>
                                          );
                                        })}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

              {/* Sold Inventory Content */}
              {inventorySubTab === 'sold' && (
                <div>
                  {/* Confirmed Orders Section */}
                  <div className="mb-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Confirmed Orders</h3>
                    <div className="space-y-4">
                      {orders
                        .filter(order => !order.metadata?.archived)
                        .filter(order => {
                          if (!searchTerm) return true;
                          return (
                            (order.order_number || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                            (order.vendor || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                            (order.customer_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                            (order.account_number || '').toLowerCase().includes(searchTerm.toLowerCase())
                          );
                        })
                        .map((order) => (
                        <div key={order.id} className="bg-white rounded-lg border border-gray-200 shadow-sm">
                          <div className="px-6 py-4">
                            <div className="flex items-center justify-between">
                              <div>
                                <h3 className="text-lg font-semibold text-gray-900">Order #{order.order_number}</h3>
                                <p className="text-sm text-gray-600 mt-1">
                                  {order.vendor} • {order.customer_name || 'Unknown Customer'}
                                </p>
                                {order.account_number && (
                                  <p className="text-sm text-gray-500">Account: {order.account_number}</p>
                                )}
                              </div>
                              <div className="text-right">
                                <div className="flex items-center space-x-4">
                                  <div>
                                    <p className="text-sm font-medium text-gray-900">{order.total_items} items</p>
                                    <p className="text-xs text-gray-500">
                                      Confirmed {formatDate(order.confirmed_at)}
                                    </p>
                                  </div>
                                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                    Confirmed
                                  </span>
                                  <button
                                    onClick={() => handleArchiveOrder(order.id)}
                                    disabled={archivingOrders.has(order.id)}
                                    className="inline-flex items-center px-3 py-1 border border-orange-300 text-sm font-medium rounded-md text-orange-700 bg-white hover:bg-orange-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 disabled:opacity-50 disabled:cursor-not-allowed"
                                  >
                                    {archivingOrders.has(order.id) ? (
                                      <>
                                        <div className="animate-spin h-3 w-3 border-2 border-orange-500 border-t-transparent rounded-full mr-2"></div>
                                        Archiving...
                                      </>
                                    ) : (
                                      <>
                                        <ArchiveIcon className="h-4 w-4 mr-1" />
                                        Archive
                                      </>
                                    )}
                                  </button>
                                </div>
                              </div>
                            </div>
                        
                        {/* Order Details */}
                        <div className="mt-4 pt-4 border-t border-gray-200">
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                            <div>
                              <span className="font-medium text-gray-600">Rep:</span>
                              <span className="ml-2 text-gray-900">{order.rep_name || 'Not specified'}</span>
                            </div>
                            <div>
                              <span className="font-medium text-gray-600">Order Date:</span>
                              <span className="ml-2 text-gray-900">{order.order_date || 'Not specified'}</span>
                            </div>
                            <div>
                              <span className="font-medium text-gray-600">Email ID:</span>
                              <span className="ml-2 text-gray-900">#{order.email_id}</span>
                            </div>
                          </div>
                          
                          {/* Items List */}
                          <div className="mt-4">
                            <h4 className="text-sm font-medium text-gray-900 mb-2">Items ({order.items.length}):</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                              {order.items.map((item) => (
                                <div key={item.id} className="text-xs bg-gray-50 rounded px-2 py-1">
                                  <span className="font-medium">{item.brand} - {item.model}</span>
                                  <br />
                                  <span className="text-gray-600">{item.color} • Size {item.size} • Qty: {item.quantity}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                      ))}
                    </div>
                  </div>

                  {/* Archived Orders Section */}
                  {orders.filter(order => order.metadata?.archived).length > 0 && (
                    <div className="mt-8">
                      <h3 className="text-lg font-medium text-gray-900 mb-4">Archived Orders</h3>
                      <div className="space-y-4">
                        {orders
                          .filter(order => order.metadata?.archived)
                          .filter(order => {
                            if (!searchTerm) return true;
                            return (
                              (order.order_number || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                              (order.vendor || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                              (order.customer_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                              (order.account_number || '').toLowerCase().includes(searchTerm.toLowerCase())
                            );
                          })
                          .map((order) => (
                            <div key={order.id} className="bg-gray-50 rounded-lg border border-gray-300 shadow-sm">
                              <div className="px-6 py-4">
                                <div className="flex items-center justify-between">
                                  <div>
                                    <h3 className="text-lg font-semibold text-gray-700">Order #{order.order_number}</h3>
                                    <p className="text-sm text-gray-600 mt-1">
                                      {order.vendor} • {order.customer_name || 'Unknown Customer'}
                                    </p>
                                    {order.account_number && (
                                      <p className="text-sm text-gray-500">Account: {order.account_number}</p>
                                    )}
                                  </div>
                                  <div className="text-right">
                                    <div className="flex items-center space-x-4">
                                      <div>
                                        <p className="text-sm font-medium text-gray-700">{order.total_items} items</p>
                                        <p className="text-xs text-gray-500">
                                          Archived {formatDate((order as any).archived_at || order.confirmed_at)}
                                        </p>
                                      </div>
                                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-200 text-gray-700">
                                        Archived
                                      </span>
                                      <button
                                        onClick={() => handleDeleteOrder(order.id)}
                                        disabled={deletingOrders.has(order.id)}
                                        className="inline-flex items-center px-3 py-1 border border-red-300 text-sm font-medium rounded-md text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
                                      >
                                        {deletingOrders.has(order.id) ? (
                                          <>
                                            <div className="animate-spin h-3 w-3 border-2 border-red-500 border-t-transparent rounded-full mr-2"></div>
                                            Deleting...
                                          </>
                                        ) : (
                                          <>
                                            <TrashIcon className="h-4 w-4 mr-1" />
                                            Delete
                                          </>
                                        )}
                                      </button>
                                    </div>
                                  </div>
                                </div>
                                
                                {/* Order Details */}
                                <div className="mt-4 pt-4 border-t border-gray-200">
                                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                                    <div>
                                      <span className="font-medium text-gray-600">Rep:</span>
                                      <span className="ml-2 text-gray-700">{order.rep_name || 'Not specified'}</span>
                                    </div>
                                    <div>
                                      <span className="font-medium text-gray-600">Order Date:</span>
                                      <span className="ml-2 text-gray-700">{order.order_date || 'Not specified'}</span>
                                    </div>
                                    <div>
                                      <span className="font-medium text-gray-600">Email ID:</span>
                                      <span className="ml-2 text-gray-700">#{order.email_id}</span>
                                    </div>
                                  </div>
                                  
                                  {/* Items List */}
                                  <div className="mt-4">
                                    <h4 className="text-sm font-medium text-gray-700 mb-2">Items ({order.items.length}):</h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                                      {order.items.map((item) => (
                                        <div key={item.id} className="text-xs bg-gray-100 rounded px-2 py-1">
                                          <span className="font-medium">{item.brand} - {item.model}</span>
                                          <br />
                                          <span className="text-gray-600">{item.color} • Size {item.size} • Qty: {item.quantity}</span>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Archive Tab */}
          {activeTab === 'archive' && (
            <div>
              {archivedInventory.length === 0 ? (
                <div className="text-center py-12">
                  <PackageIcon className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No archived items</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    {searchTerm ? 'No archived items match your search.' : 'No items have been archived yet.'}
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {Object.entries(groupedArchivedInventory).map(([vendorName, brands]) => {
                    const isVendorExpanded = expandedVendors.has(vendorName);
                    const totalItemsInVendor = Object.values(brands).flat().length;
                    
                    return (
                      <div key={vendorName} className="bg-white rounded-lg border border-gray-200 shadow-sm">
                        {/* Vendor Header */}
                        <div 
                          className="px-6 py-4 cursor-pointer hover:bg-gray-50 transition-colors duration-150"
                          onClick={() => toggleVendorExpansion(vendorName)}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              {isVendorExpanded ? (
                                <ChevronDownIcon className="h-5 w-5 text-gray-400 transition-transform duration-150" />
                              ) : (
                                <ChevronRightIcon className="h-5 w-5 text-gray-400 transition-transform duration-150" />
                              )}
                              <div>
                                <h2 className="text-lg font-semibold text-gray-900">{vendorName}</h2>
                                <p className="text-sm text-gray-500">
                                  {Object.keys(brands).length} brand{Object.keys(brands).length !== 1 ? 's' : ''} • {totalItemsInVendor} item{totalItemsInVendor !== 1 ? 's' : ''}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center space-x-2">
                              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800">
                                {totalItemsInVendor} items
                              </span>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteArchivedByVendor(vendorName);
                                }}
                                disabled={deletingVendors.has(vendorName)}
                                className="inline-flex items-center px-3 py-1 border border-red-300 text-sm font-medium rounded-md text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                {deletingVendors.has(vendorName) ? (
                                  <>
                                    <div className="animate-spin h-3 w-3 border-2 border-red-500 border-t-transparent rounded-full mr-2"></div>
                                    Deleting...
                                  </>
                                ) : (
                                  <>
                                    <TrashIcon className="h-4 w-4 mr-1" />
                                    Delete All
                                  </>
                                )}
                              </button>
                            </div>
                          </div>
                        </div>

                        {/* Archive items with restore and delete options */}
                        {isVendorExpanded && (
                          <div className="border-t border-gray-200">
                            {Object.entries(brands).map(([brandName, items]) => {
                              const brandKey = `${vendorName}-${brandName}`;
                              const isBrandExpanded = expandedBrands.has(brandKey);
                              
                              return (
                                <div key={brandKey} className="border-b border-gray-100 last:border-b-0">
                                  {/* Brand Header */}
                                  <div className="px-8 py-3 bg-gray-25">
                                    <div className="flex items-center justify-between">
                                      <div 
                                        className="flex items-center space-x-3 flex-1 cursor-pointer hover:bg-gray-50 transition-colors duration-150 p-2 -m-2 rounded"
                                        onClick={() => toggleBrandExpansion(brandKey)}
                                      >
                                        {isBrandExpanded ? (
                                          <ChevronDownIcon className="h-4 w-4 text-gray-400 transition-transform duration-150" />
                                        ) : (
                                          <ChevronRightIcon className="h-4 w-4 text-gray-400 transition-transform duration-150" />
                                        )}
                                        <div>
                                          <h3 className="text-base font-medium text-gray-800">{brandName}</h3>
                                          <p className="text-sm text-gray-500">{items.length} archived item{items.length !== 1 ? 's' : ''}</p>
                                        </div>
                                      </div>
                                      <div className="flex items-center space-x-2">
                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                                          {items.length}
                                        </span>
                                        <button
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            handleDeleteArchivedByBrand(brandName, vendorName);
                                          }}
                                          disabled={deletingBrands.has(brandKey)}
                                          className="inline-flex items-center px-2 py-1 border border-red-300 text-xs font-medium rounded text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                          {deletingBrands.has(brandKey) ? (
                                            <>
                                              <div className="animate-spin h-3 w-3 border-2 border-red-500 border-t-transparent rounded-full mr-1"></div>
                                              Deleting...
                                            </>
                                          ) : (
                                            <>
                                              <TrashIcon className="h-3 w-3 mr-1" />
                                              Delete All
                                            </>
                                          )}
                                        </button>
                                      </div>
                                    </div>
                                  </div>

                                  {/* Archived Items */}
                                  {isBrandExpanded && (
                                    <div className="bg-gray-50">
                                      <div className="divide-y divide-gray-200">
                                        {items.map((item) => {
                                          const fullName = (item as any).full_name || item.sku;
                                          const model = (item as any).model || '';
                                          const color = (item as any).color || '';
                                          const size = (item as any).size || '';
                                          
                                          // Extract just the frame name without brand prefix
                                          const frameName = model || (fullName && fullName.includes(' - ') ? fullName.split(' - ').pop() : fullName) || item.sku;
                                          
                                          return (
                                            <div key={item.id} className="relative bg-white px-10 py-3">
                                              <div className="flex items-center justify-between">
                                                <div className="flex-1 min-w-0">
                                                  <div className="flex items-center space-x-4">
                                                    {/* Frame Name */}
                                                    <div className="flex-1 min-w-0">
                                                      <p className="text-sm font-medium text-gray-900 truncate">
                                                        {frameName}
                                                      </p>
                                                      <p className="text-xs text-gray-500">
                                                        {color} • Size {size} • Qty: {item.quantity}
                                                      </p>
                                                    </div>
                                                    
                                                    {/* Status */}
                                                    <div className="flex-shrink-0">
                                                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                                        Archived
                                                      </span>
                                                    </div>
                                                    
                                                    {/* Action Buttons */}
                                                    <div className="flex-shrink-0 flex space-x-2">
                                                      <button
                                                        onClick={(e) => {
                                                          e.stopPropagation();
                                                          handleRestoreItem(item.id);
                                                        }}
                                                        disabled={restoringItems.has(item.id)}
                                                        className="text-green-600 hover:text-green-900 disabled:opacity-50 disabled:cursor-not-allowed px-2 py-1 text-xs border border-green-600 rounded hover:bg-green-50"
                                                      >
                                                        {restoringItems.has(item.id) ? (
                                                          <div className="animate-spin h-3 w-3 border-2 border-green-500 border-t-transparent rounded-full"></div>
                                                        ) : (
                                                          'Restore'
                                                        )}
                                                      </button>
                                                      <button
                                                        onClick={(e) => {
                                                          e.stopPropagation();
                                                          handleDeleteInventoryItem(item.id);
                                                        }}
                                                        disabled={deletingItems.has(item.id)}
                                                        className="text-red-600 hover:text-red-900 disabled:opacity-50 disabled:cursor-not-allowed p-1"
                                                      >
                                                        {deletingItems.has(item.id) ? (
                                                          <div className="animate-spin h-3 w-3 border-2 border-red-500 border-t-transparent rounded-full"></div>
                                                        ) : (
                                                          <TrashIcon className="h-3 w-3" />
                                                        )}
                                                      </button>
                                                    </div>
                                                  </div>
                                                </div>
                                              </div>
                                            </div>
                                          );
                                        })}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
              )}
            </div>
          )}

          {/* ARCHIVE TAB */}
          {activeTab === 'archive' && (
            <div className="p-6">
              <div className="space-y-8">
                {/* Archived Orders Section */}
                {orders.filter(order => order.metadata?.archived).length > 0 && (
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Archived Orders</h3>
                    <div className="space-y-4">
                      {orders
                        .filter(order => order.metadata?.archived)
                        .map(order => (
                          <div key={order.id} className="bg-gray-50 border border-gray-200 rounded-lg p-6">
                            <div className="flex justify-between items-start">
                              <div>
                                <h4 className="text-md font-semibold text-gray-700">
                                  {order.vendor} • {order.customer_name || 'Unknown Customer'}
                                </h4>
                                <p className="text-sm text-gray-500 mt-1">
                                  Order #{order.order_number}
                                  {order.account_number && ` • Account: ${order.account_number}`}
                                </p>
                              </div>
                              <span className="px-2 py-1 bg-gray-200 text-gray-700 rounded-full text-xs font-medium">
                                Archived
                              </span>
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                )}

                {/* Archived Inventory Section */}
                {archivedInventory.length > 0 && (
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Archived Inventory</h3>
                    <div className="space-y-4">
                      {Object.entries(groupInventoryByVendorAndBrand(archivedInventory)).map(([vendorName, brands]) => {
                    const isVendorExpanded = expandedVendors.has(vendorName);
                    const totalItemsInVendor = Object.values(brands).flat().length;
                    
                    return (
                      <div key={vendorName} className="bg-white rounded-lg border border-gray-200 shadow-sm">
                        {/* Vendor Header */}
                        <div 
                          className="px-6 py-4 cursor-pointer hover:bg-gray-50 transition-colors duration-150"
                          onClick={() => toggleVendorExpansion(vendorName)}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              {isVendorExpanded ? (
                                <ChevronDownIcon className="h-5 w-5 text-gray-400 transition-transform duration-150" />
                              ) : (
                                <ChevronRightIcon className="h-5 w-5 text-gray-400 transition-transform duration-150" />
                              )}
                              <div>
                                <h2 className="text-lg font-semibold text-gray-900">{vendorName}</h2>
                                <p className="text-sm text-gray-500">
                                  {Object.keys(brands).length} brand{Object.keys(brands).length !== 1 ? 's' : ''} • {totalItemsInVendor} sold item{totalItemsInVendor !== 1 ? 's' : ''}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center space-x-2">
                              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-purple-100 text-purple-800">
                                {totalItemsInVendor} sold
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Brands (shown when vendor is expanded) */}
                        {isVendorExpanded && (
                          <div className="border-t border-gray-200">
                            {Object.entries(brands).map(([brandName, items]) => {
                              const brandKey = `${vendorName}-${brandName}`;
                              const isBrandExpanded = expandedBrands.has(brandKey);
                              
                              return (
                                <div key={brandKey} className="border-b border-gray-100 last:border-b-0">
                                  {/* Brand Header */}
                                  <div 
                                    className="px-8 py-3 cursor-pointer hover:bg-gray-50 transition-colors duration-150 bg-gray-25"
                                    onClick={() => toggleBrandExpansion(brandKey)}
                                  >
                                    <div className="flex items-center justify-between">
                                      <div className="flex items-center space-x-3">
                                        {isBrandExpanded ? (
                                          <ChevronDownIcon className="h-4 w-4 text-gray-400 transition-transform duration-150" />
                                        ) : (
                                          <ChevronRightIcon className="h-4 w-4 text-gray-400 transition-transform duration-150" />
                                        )}
                                        <div>
                                          <h3 className="text-base font-medium text-gray-800">{brandName}</h3>
                                          <p className="text-sm text-gray-500">{items.length} sold item{items.length !== 1 ? 's' : ''}</p>
                                        </div>
                                      </div>
                                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-700">
                                        {items.length}
                                      </span>
                                    </div>
                                  </div>

                                  {/* Sold Items */}
                                  {isBrandExpanded && (
                                    <div className="bg-gray-50">
                                      <div className="divide-y divide-gray-200">
                                        {items.map((item) => {
                                          const fullName = (item as any).full_name || item.sku;
                                          const model = (item as any).model || '';
                                          const color = (item as any).color || '';
                                          const size = (item as any).size || '';
                                          const soldDate = (item as any).updated_at || item.created_at;
                                          
                                          // Extract just the frame name without brand prefix
                                          const frameName = model || (fullName && fullName.includes(' - ') ? fullName.split(' - ').pop() : fullName) || item.sku;
                                          
                                          return (
                                            <div key={item.id} className="relative bg-white px-10 py-3">
                                              <div className="flex items-center justify-between">
                                                <div className="flex-1 min-w-0">
                                                  <div className="flex items-center space-x-4">
                                                    {/* Frame Name */}
                                                    <div className="flex-1 min-w-0">
                                                      <p className="text-sm font-medium text-gray-900 truncate">
                                                        {frameName}
                                                      </p>
                                                      <p className="text-xs text-gray-500">
                                                        {color} • Size {size} • Qty: {item.quantity}
                                                      </p>
                                                      <p className="text-xs text-gray-400">
                                                        Sold on {formatDate(soldDate)}
                                                      </p>
                                                    </div>
                                                    
                                                    {/* Status */}
                                                    <div className="flex-shrink-0">
                                                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                                                        Sold
                                                      </span>
                                                    </div>
                                                  </div>
                                                </div>
                                              </div>
                                            </div>
                                          );
                                        })}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                      })}
                    </div>
                  </div>
                )}

                {/* Empty State */}
                {orders.filter(o => o.metadata?.archived).length === 0 && archivedInventory.length === 0 && (
                  <div className="text-center py-12">
                    <ArchiveIcon className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900">No archived items</h3>
                    <p className="mt-1 text-sm text-gray-500">
                      Archived orders and inventory will appear here
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Order Details Modal */}
      {showOrderDetailsModal && selectedEmailDetails && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-gray-500 opacity-75" onClick={closeOrderDetailsModal}></div>
            </div>

            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg leading-6 font-medium text-gray-900">
                    Order Details
                  </h3>
                  <button
                    onClick={closeOrderDetailsModal}
                    className="rounded-md text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    <XIcon className="h-6 w-6" />
                  </button>
                </div>

                <div className="mt-3">
                  {/* Order Information */}
                  <div className="bg-gray-50 rounded-lg p-4 mb-4">
                    <h4 className="text-sm font-medium text-gray-900 mb-3">Email Information</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-500">From:</span>
                        <span className="ml-2 text-gray-900">{selectedEmailDetails.from_email}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Date:</span>
                        <span className="ml-2 text-gray-900">{formatDate(selectedEmailDetails.processed_at)}</span>
                      </div>
                      <div className="md:col-span-2">
                        <span className="text-gray-500">Subject:</span>
                        <span className="ml-2 text-gray-900">{selectedEmailDetails.subject}</span>
                      </div>
                    </div>
                  </div>

                  {/* Parsed Data */}
                  {selectedEmailDetails.parse_status === 'parsed' && selectedEmailDetails.parsed_data ? (
                    <>
                      {/* Order Summary */}
                      <div className="bg-gray-50 rounded-lg p-4 mb-4">
                        <h4 className="text-sm font-medium text-gray-900 mb-3">Order Summary</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="text-gray-500">Order Number:</span>
                            <span className="ml-2 text-gray-900 font-medium">{selectedEmailDetails.parsed_data.order.order_number}</span>
                          </div>
                          <div>
                            <span className="text-gray-500">Vendor:</span>
                            <span className="ml-2 text-gray-900">{selectedEmailDetails.parsed_data.vendor}</span>
                          </div>
                          <div>
                            <span className="text-gray-500">Customer:</span>
                            <span className="ml-2 text-gray-900">{selectedEmailDetails.parsed_data.order.customer_name}</span>
                          </div>
                          <div>
                            <span className="text-gray-500">Account:</span>
                            <span className="ml-2 text-gray-900">{selectedEmailDetails.parsed_data.account_number}</span>
                          </div>
                          <div>
                            <span className="text-gray-500">Total Items:</span>
                            <span className="ml-2 text-gray-900">{selectedEmailDetails.parsed_data.items.length}</span>
                          </div>
                          <div>
                            <span className="text-gray-500">Total Pieces:</span>
                            <span className="ml-2 text-gray-900">{selectedEmailDetails.parsed_data.order.total_pieces || selectedEmailDetails.parsed_data.items.reduce((sum: number, item: any) => sum + (item.quantity || 0), 0)}</span>
                          </div>
                        </div>
                      </div>

                      {/* Items List */}
                      <div className="bg-gray-50 rounded-lg p-4">
                        <h4 className="text-sm font-medium text-gray-900 mb-3">Order Items</h4>
                        <div className="overflow-x-auto">
                          <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-100">
                              <tr>
                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  UPC
                                </th>
                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  Brand
                                </th>
                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  Model
                                </th>
                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  Color
                                </th>
                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  Size
                                </th>
                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  Qty
                                </th>
                              </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                              {selectedEmailDetails.parsed_data.items.map((item: any, index: number) => (
                                <tr key={index}>
                                  <td className="px-4 py-2 text-sm text-gray-900">{item.upc || 'N/A'}</td>
                                  <td className="px-4 py-2 text-sm text-gray-900">{item.brand}</td>
                                  <td className="px-4 py-2 text-sm text-gray-900">{item.model}</td>
                                  <td className="px-4 py-2 text-sm text-gray-900">{item.color}</td>
                                  <td className="px-4 py-2 text-sm text-gray-900">{item.size}</td>
                                  <td className="px-4 py-2 text-sm text-gray-900">{item.quantity}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-gray-500">This order has not been parsed yet.</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  type="button"
                  onClick={closeOrderDetailsModal}
                  className="w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Frame Confirmation Modal */}
      {showConfirmModal && confirmingOrderKey && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-gray-500 opacity-75" onClick={() => setShowConfirmModal(false)}></div>
            </div>

            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-3xl sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg leading-6 font-medium text-gray-900">
                    Confirm Order Frames
                  </h3>
                  <button
                    onClick={() => setShowConfirmModal(false)}
                    className="rounded-md text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    <XIcon className="h-6 w-6" />
                  </button>
                </div>

                {confirmingOrderKey && groupedPendingOrders[confirmingOrderKey] && (
                  <div className="mt-3">
                    {/* Order Information */}
                    <div className="bg-blue-50 rounded-lg p-4 mb-4 border border-blue-200">
                      <h4 className="text-sm font-medium text-blue-900 mb-3">Order Information</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-blue-700">Vendor:</span>
                          <span className="ml-2 text-blue-900 font-medium">{groupedPendingOrders[confirmingOrderKey].vendor}</span>
                        </div>
                        <div>
                          <span className="text-blue-700">Order Number:</span>
                          <span className="ml-2 text-blue-900 font-medium">{groupedPendingOrders[confirmingOrderKey].orderNumber}</span>
                        </div>
                        {groupedPendingOrders[confirmingOrderKey].accountNumber && (
                          <div className="md:col-span-2">
                            <span className="text-blue-700">Account Number:</span>
                            <span className="ml-2 text-blue-900 font-medium">{groupedPendingOrders[confirmingOrderKey].accountNumber}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Instructions */}
                    <div className="bg-gray-50 rounded-lg p-4 mb-4">
                      <h4 className="text-sm font-medium text-gray-900 mb-2">Instructions</h4>
                      <p className="text-sm text-gray-600">
                        Select the frames you actually received from this order. Only selected frames will be moved to current inventory. 
                        Unselected frames will remain in pending inventory for future processing.
                      </p>
                    </div>

                    {/* Frame Selection List */}
                    <div className="bg-white border rounded-lg">
                      <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
                        <div className="flex items-center justify-between">
                          <h4 className="text-sm font-medium text-gray-900">
                            Select Received Frames ({selectedFrames.size} of {groupedPendingOrders[confirmingOrderKey].items.length} selected)
                          </h4>
                          <div className="flex space-x-2">
                            <button
                              onClick={() => {
                                const allFrameIds = groupedPendingOrders[confirmingOrderKey].items.map(item => item.id);
                                setSelectedFrames(new Set(allFrameIds));
                              }}
                              className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                            >
                              Select All
                            </button>
                            <button
                              onClick={() => setSelectedFrames(new Set())}
                              className="text-xs text-gray-600 hover:text-gray-800 font-medium"
                            >
                              Clear All
                            </button>
                          </div>
                        </div>
                      </div>
                      
                      <div className="max-h-96 overflow-y-auto">
                        <div className="divide-y divide-gray-200">
                          {groupedPendingOrders[confirmingOrderKey].items.map((item) => {
                            const isSelected = selectedFrames.has(item.id);
                            const brand = (item as any).brand || '';
                            const model = (item as any).model || '';
                            const colorName = (item as any).color_name || (item as any).color || '';
                            const size = (item as any).size || '';
                            const fullSize = (item as any).full_size || '';
                            const wholesalePrice = (item as any).wholesale_price;
                            const frameName = model || (item as any).full_name || item.sku;
                            
                            return (
                              <div key={item.id} className="p-4 hover:bg-gray-50">
                                <div className="flex items-center space-x-3">
                                  <input
                                    type="checkbox"
                                    checked={isSelected}
                                    onChange={() => toggleFrameSelection(item.id)}
                                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                  />
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between">
                                      <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-gray-900 truncate">
                                          {frameName}
                                        </p>
                                        <p className="text-xs text-gray-500">
                                          {colorName} • {fullSize || `Size ${size}`} • Qty: {item.quantity}
                                        </p>
                                      </div>
                                      <div className="flex items-center space-x-4">
                                        {wholesalePrice && (
                                          <div className="text-right">
                                            <p className="text-sm font-medium text-gray-900">
                                              ${wholesalePrice}
                                            </p>
                                            <p className="text-xs text-gray-500">Wholesale</p>
                                          </div>
                                        )}
                                        {(item as any).api_verified && (
                                          <span className="inline-flex items-center px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
                                            ✓ Verified
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>

                    {/* Summary */}
                    {selectedFrames.size > 0 && (
                      <div className="bg-green-50 rounded-lg p-4 mt-4 border border-green-200">
                        <div className="flex items-center">
                          <CheckIcon className="h-5 w-5 text-green-600 mr-2" />
                          <div className="text-sm">
                            <p className="text-green-800 font-medium">
                              {selectedFrames.size} frame{selectedFrames.size !== 1 ? 's' : ''} will be moved to current inventory
                            </p>
                            {selectedFrames.size < groupedPendingOrders[confirmingOrderKey].items.length && (
                              <p className="text-green-700 mt-1">
                                {groupedPendingOrders[confirmingOrderKey].items.length - selectedFrames.size} frame{(groupedPendingOrders[confirmingOrderKey].items.length - selectedFrames.size) !== 1 ? 's' : ''} will remain pending
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  type="button"
                  onClick={processPartialConfirmation}
                  disabled={selectedFrames.size === 0}
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-gray-300 disabled:cursor-not-allowed sm:ml-3 sm:w-auto sm:text-sm"
                >
                  Confirm {selectedFrames.size} Frame{selectedFrames.size !== 1 ? 's' : ''}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowConfirmModal(false);
                    setSelectedFrames(new Set());
                    setConfirmingOrderKey(null);
                  }}
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Delete Dialog */}
      <ConfirmDialog
        isOpen={confirmDeleteDialog.isOpen}
        onClose={() => setConfirmDeleteDialog({ isOpen: false, emailId: null, itemId: null, type: null })}
        onConfirm={confirmDelete}
        title={confirmDeleteDialog.type === 'email' ? 'Delete Email' : 'Delete Item'}
        message={confirmDeleteDialog.type === 'email'
          ? 'Are you sure you want to delete this email? This action cannot be undone.'
          : 'Are you sure you want to delete this inventory item? This action cannot be undone.'}
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
      />
    </div>
  );
};

export default Inventory;
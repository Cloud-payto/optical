/**
 * Modern Inventory Page
 * Features: Filters, Return Window tracking, Return Report generation
 */

import React, { useState, useMemo } from 'react';
import { Plus } from 'lucide-react';
import { useInventoryByStatus } from './hooks/useInventory';
import { useInventoryManagement } from './hooks/useInventoryManagement';
import { InventoryFilters } from './components/InventoryFilters';
import { ModernInventoryTable } from './components/ModernInventoryTable';
import { ReturnReportModal } from './components/ReturnReportModal';
import { ManualEntryModal, ManualInventoryData } from './components/ManualEntryModal';
import { ForwardingEmailDisplay } from '../../components/ForwardingEmailDisplay';
import { useAuth } from '../../contexts/AuthContext';
import { useDemo } from '../../contexts/DemoContext';
import { createManualInventoryItem } from '../../services/api';
import { Button } from '../../components/ui/Button';
import type { InventoryFilters as FilterState, InventoryItem } from './types/inventory.types';
import { calculateReturnWindow } from './utils/returnWindow';
import {
  generateReturnReportPDF,
  generateReportNumber,
  formatReportDate,
  generateReportFilename,
  downloadPDF
} from './utils/generateReturnReportPDF';
import { uploadReturnReport } from '../../lib/storage';
import { saveReturnReportMetadata } from '../../services/api';
import toast from 'react-hot-toast';

export function InventoryPage() {
  const { user } = useAuth();
  const { isDemo } = useDemo(); // Get demo state
  const [activeTab, setActiveTab] = useState<'pending' | 'current' | 'archived' | 'sold'>('current');
  const [filters, setFilters] = useState<FilterState>({
    status: 'current',
    sortBy: 'brand'
  });
  const [returnReportItems, setReturnReportItems] = useState<InventoryItem[]>([]);
  const [isReturnModalOpen, setIsReturnModalOpen] = useState(false);
  const [isManualEntryOpen, setIsManualEntryOpen] = useState(false);

  // Fetch data based on active tab
  const { data: rawInventory, isLoading, error } = useInventoryByStatus(activeTab);

  // Get mutation functions
  const { archiveItem, restoreItem, deleteItem, markAsSold } = useInventoryManagement();

  // Extract unique values for filters
  const { vendors, brands, colors } = useMemo(() => {
    if (!rawInventory) return { vendors: [], brands: [], colors: [] };

    const vendorSet = new Set<string>();
    const brandSet = new Set<string>();
    const colorSet = new Set<string>();

    rawInventory.forEach(item => {
      if (item.vendor?.name) vendorSet.add(item.vendor.name);
      if (item.brand) brandSet.add(item.brand);
      if (item.color) colorSet.add(item.color);
    });

    return {
      vendors: Array.from(vendorSet).sort(),
      brands: Array.from(brandSet).sort(),
      colors: Array.from(colorSet).sort()
    };
  }, [rawInventory]);

  // Apply filters and sorting
  const filteredInventory = useMemo(() => {
    if (!rawInventory) return [];

    let filtered = [...rawInventory];

    // Apply filters
    if (filters.vendor) {
      filtered = filtered.filter(item => item.vendor?.name === filters.vendor);
    }
    if (filters.brand) {
      filtered = filtered.filter(item => item.brand === filters.brand);
    }
    if (filters.color) {
      filtered = filtered.filter(item => item.color === filters.color);
    }

    // Apply sorting
    switch (filters.sortBy) {
      case 'newest':
        filtered.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        break;
      case 'oldest':
        filtered.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
        break;
      case 'return_window':
        // Sort by return window (items expiring soon first)
        filtered.sort((a, b) => {
          const aWindow = calculateReturnWindow(a.order?.order_date);
          const bWindow = calculateReturnWindow(b.order?.order_date);
          if (!aWindow) return 1;
          if (!bWindow) return -1;
          return aWindow.daysRemaining - bWindow.daysRemaining;
        });
        break;
      case 'brand':
        filtered.sort((a, b) => {
          // First sort by brand
          const brandCompare = (a.brand || '').localeCompare(b.brand || '');
          if (brandCompare !== 0) return brandCompare;

          // Then sort by model within the same brand
          return (a.model || '').localeCompare(b.model || '');
        });
        break;
      case 'stock':
        filtered.sort((a, b) => b.quantity - a.quantity);
        break;
    }

    return filtered;
  }, [rawInventory, filters]);

  const handleAddToReturnReport = (item: InventoryItem) => {
    setReturnReportItems(prev => {
      // Check if already added
      if (prev.some(i => i.id === item.id)) {
        return prev; // Already in cart
      }
      return [...prev, item];
    });
  };

  const handleOpenReturnReport = () => {
    setIsReturnModalOpen(true);
  };

  const handleGenerateReport = async (vendorName: string, items: InventoryItem[]) => {
    // Check authentication first
    if (!user) {
      toast.error('You must be logged in to generate reports');
      return;
    }

    const loadingToast = toast.loading('Generating return report...');

    try {
      const reportNumber = generateReportNumber();
      const reportDate = formatReportDate();
      const contactEmail = user.email || 'contact@optiprofit.com';
      const filename = generateReportFilename(vendorName, reportNumber);

      // Step 1: Generate PDF blob
      const pdfBlob = await generateReturnReportPDF(items, {
        reportNumber,
        date: reportDate,
        vendorName,
        contactEmail,
        accountNumber: user.id?.toString()
      });

      console.log('[REPORT] PDF generated:', {
        reportNumber,
        vendorName,
        filename,
        size: pdfBlob.size
      });

      // Step 2: Upload PDF to Supabase Storage
      toast.loading('Uploading to cloud storage...', { id: loadingToast });
      const storagePath = await uploadReturnReport(pdfBlob, filename, user.id);

      if (!storagePath) {
        throw new Error('Failed to upload PDF to storage');
      }

      console.log('[REPORT] PDF uploaded to storage:', storagePath);

      // Step 3: Save report metadata to database
      toast.loading('Saving report metadata...', { id: loadingToast });

      // Extract vendor_id from items (they should all have same vendor)
      const vendorId = items[0]?.vendor?.id;

      const reportMetadata = {
        account_id: user.id,
        vendor_id: vendorId,
        vendor_name: vendorName,
        report_number: reportNumber,
        filename: filename,
        pdf_path: storagePath,
        item_count: items.length,
        total_quantity: items.reduce((sum, item) => sum + item.quantity, 0),
        status: 'pending' as const
      };

      await saveReturnReportMetadata(reportMetadata);

      console.log('[REPORT] Metadata saved to database');

      // Step 4: Download PDF to user's browser
      downloadPDF(pdfBlob, filename);

      // Step 5: Clear items from return cart
      items.forEach(item => {
        setReturnReportItems(prev => prev.filter(i => i.id !== item.id));
      });

      // Show success message
      toast.success(
        `Return report ${reportNumber} generated successfully!`,
        { id: loadingToast, duration: 5000 }
      );

      // Close the modal
      setIsReturnModalOpen(false);

      console.log('[REPORT] Report generation complete:', {
        reportNumber,
        vendorName,
        itemCount: items.length,
        totalQuantity: reportMetadata.total_quantity
      });

    } catch (error) {
      console.error('[REPORT] Error generating return report:', error);
      toast.error(
        error instanceof Error ? error.message : 'Failed to generate return report. Please try again.',
        { id: loadingToast }
      );
    }
  };

  const handleManualEntrySubmit = async (data: ManualInventoryData) => {
    await createManualInventoryItem(data);
    // The real-time subscription will automatically update the inventory list
  };

  const tabs = [
    { key: 'pending' as const, label: 'Pending', count: 0 },
    { key: 'current' as const, label: 'Current Inventory', count: rawInventory?.length || 0 },
    { key: 'sold' as const, label: 'Sold', count: 0 },
    { key: 'archived' as const, label: 'Archived', count: 0 },
  ];

  return (
    <div className="space-y-6 p-6 bg-gray-50 dark:bg-[#181F1C] min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Inventory</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Manage your frames inventory</p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            onClick={() => setIsManualEntryOpen(true)}
            className="flex items-center gap-2"
            rounded="lg"
          >
            <Plus className="w-4 h-4" />
            Add Frame Manually
          </Button>
          {user?.id && <ForwardingEmailDisplay accountId={user.id} compact />}
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white dark:bg-[#1F2623] rounded-lg shadow-sm">
        <nav className="flex space-x-8 px-6">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                data-demo={tab.key === 'pending' ? 'inventory-pending-tab' : undefined}
                onClick={() => {
                  setActiveTab(tab.key);
                  setFilters(prev => ({ ...prev, status: tab.key }));
                }}
                className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  isActive
                    ? 'border-purple-500 text-purple-600 dark:text-purple-400'
                    : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
                }`}
              >
                {tab.label}
                {tab.count > 0 && (
                  <span className={`ml-2 py-0.5 px-2 rounded-full text-xs ${
                    isActive ? 'bg-purple-100 dark:bg-purple-900/50 text-purple-600 dark:text-purple-300' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
                  }`}>
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Filters */}
      <InventoryFilters
        filters={filters}
        onFilterChange={setFilters}
        vendors={vendors}
        brands={brands}
        colors={colors}
        returnReportCount={returnReportItems.length}
        onOpenReturnReport={handleOpenReturnReport}
      />

      {/* Error State */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <p className="text-red-800 dark:text-red-300">
            Error loading inventory: {error instanceof Error ? error.message : 'Unknown error'}
          </p>
        </div>
      )}

      {/* Modern Inventory Table */}
      <ModernInventoryTable
        items={filteredInventory}
        isLoading={isLoading}
        isDemo={isDemo}
        onAddToReturnReport={handleAddToReturnReport}
        onArchive={(itemId) => archiveItem.mutate(itemId)}
        onRestore={(itemId) => restoreItem.mutate(itemId)}
        onDelete={(itemId) => deleteItem.mutate(itemId)}
        onMarkAsSold={(itemId) => markAsSold.mutate(itemId)}
      />

      {/* Return Report Modal */}
      <ReturnReportModal
        isOpen={isReturnModalOpen}
        onClose={() => setIsReturnModalOpen(false)}
        items={returnReportItems}
        onGenerateReport={handleGenerateReport}
      />

      {/* Manual Entry Modal */}
      <ManualEntryModal
        isOpen={isManualEntryOpen}
        onClose={() => setIsManualEntryOpen(false)}
        onSubmit={handleManualEntrySubmit}
      />
    </div>
  );
}

export default InventoryPage;

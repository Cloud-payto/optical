import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Container } from '../components/ui/Container';
import { fetchDashboardStats, fetchInventoryByVendor, DashboardStats, VendorInventoryStats, PaginationMetadata } from '../services/api';
import { PackageIcon, DollarSignIcon, ShoppingCartIcon, ClockIcon, ChevronDownIcon, ChevronRightIcon, ArrowUpDown, AlertTriangleIcon } from 'lucide-react';
import DemoButton from '../components/demo/DemoButton';

const DashboardPage: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [vendorStats, setVendorStats] = useState<VendorInventoryStats[]>([]);
  const [pagination, setPagination] = useState<PaginationMetadata | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedVendors, setExpandedVendors] = useState<Set<string>>(new Set());

  // Sorting and pagination state
  const [sortBy, setSortBy] = useState<string>('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(50);

  useEffect(() => {
    loadDashboardData();
  }, []);

  // Reload when sort/page changes
  useEffect(() => {
    loadVendorData();
  }, [sortBy, sortOrder, currentPage, pageSize]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const [statsData, vendorResponse] = await Promise.all([
        fetchDashboardStats(),
        fetchInventoryByVendor(undefined, { sortBy, sortOrder, page: currentPage, pageSize })
      ]);
      setStats(statsData);
      setVendorStats(vendorResponse.vendors);
      setPagination(vendorResponse.pagination);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load dashboard data');
      console.error('Dashboard error:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadVendorData = async () => {
    try {
      const vendorResponse = await fetchInventoryByVendor(undefined, { sortBy, sortOrder, page: currentPage, pageSize });
      setVendorStats(vendorResponse.vendors);
      setPagination(vendorResponse.pagination);
    } catch (err) {
      console.error('Error loading vendor data:', err);
    }
  };

  const toggleVendor = (vendorId: string) => {
    setExpandedVendors(prev => {
      const next = new Set(prev);
      if (next.has(vendorId)) {
        next.delete(vendorId);
      } else {
        next.add(vendorId);
      }
      return next;
    });
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value);
  };

  if (loading) {
    return (
      <div className="h-full bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-full bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={loadDashboardData}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full bg-gray-50 dark:bg-gray-950">
      <div className="p-6 md:p-8">
        <Container size="xl">
          {/* Page Title with Demo Button */}
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
            <DemoButton size="md" variant="primary">
              ✨ Watch Interactive Demo
            </DemoButton>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between mb-2">
                <p className="text-gray-700 dark:text-gray-200 font-medium">Total Inventory Value</p>
                <DollarSignIcon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{formatCurrency(stats?.totalValue || 0)}</p>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between mb-2">
                <p className="text-gray-700 dark:text-gray-200 font-medium">Total Items</p>
                <PackageIcon className="w-5 h-5 text-green-600 dark:text-green-400" />
              </div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats?.totalInventory || 0}</p>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between mb-2">
                <p className="text-gray-700 dark:text-gray-200 font-medium">Pending Items</p>
                <ClockIcon className="w-5 h-5 text-orange-600 dark:text-orange-400" />
              </div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats?.pendingItems || 0}</p>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between mb-2">
                <p className="text-gray-700 dark:text-gray-200 font-medium">Total Orders</p>
                <ShoppingCartIcon className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              </div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats?.totalOrders || 0}</p>
            </div>
          </div>

          {/* Missing Prices Alert */}
          {stats && stats.itemsWithMissingPrices > 0 && (
            <div className="bg-yellow-50 dark:bg-yellow-900/20 border-l-4 border-yellow-400 dark:border-yellow-600 p-4 rounded-lg mb-8">
              <div className="flex items-start">
                <AlertTriangleIcon className="h-5 w-5 text-yellow-400 dark:text-yellow-500 mt-0.5 mr-3 flex-shrink-0" />
                <div className="flex-1">
                  <h3 className="text-sm font-medium text-yellow-800 dark:text-yellow-300">
                    Missing Pricing Information
                  </h3>
                  <p className="mt-1 text-sm text-yellow-700 dark:text-yellow-400">
                    You have <strong>{stats.itemsWithMissingPrices}</strong> {stats.itemsWithMissingPrices === 1 ? 'item' : 'items'} in inventory without pricing information.
                    This affects your total inventory value calculation.
                  </p>
                  <div className="mt-3">
                    <Link
                      to="/brands"
                      className="text-sm font-medium text-yellow-800 dark:text-yellow-300 hover:text-yellow-900 dark:hover:text-yellow-200 underline"
                    >
                      Add pricing for your vendors →
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Inventory by Vendor */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">Inventory by Vendor & Brand</h2>
              </div>

              {/* Sort and Filter Controls */}
              <div className="flex flex-wrap items-center gap-4">
                <div className="flex items-center gap-2">
                  <ArrowUpDown className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-200">Sort by:</label>
                  <select
                    value={sortBy}
                    onChange={(e) => {
                      setSortBy(e.target.value);
                      setCurrentPage(1); // Reset to page 1 when sorting changes
                    }}
                    className="px-3 py-1.5 pr-9 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 min-w-[160px]"
                  >
                    <option value="created_at">Date Added</option>
                    <option value="brand">Brand Name</option>
                    <option value="model">Model</option>
                    <option value="quantity">Quantity</option>
                    <option value="wholesale_price">Wholesale Price</option>
                    <option value="received_date">Received Date</option>
                  </select>
                </div>

                <div className="flex items-center gap-2">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-200">Order:</label>
                  <select
                    value={sortOrder}
                    onChange={(e) => setSortOrder(e.target.value as 'asc' | 'desc')}
                    className="px-3 py-1.5 pr-9 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 min-w-[130px]"
                  >
                    <option value="asc">Ascending</option>
                    <option value="desc">Descending</option>
                  </select>
                </div>

                <div className="flex items-center gap-2">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-200">Items per page:</label>
                  <select
                    value={pageSize}
                    onChange={(e) => {
                      setPageSize(Number(e.target.value));
                      setCurrentPage(1); // Reset to page 1 when page size changes
                    }}
                    className="px-3 py-1.5 pr-9 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 min-w-[80px]"
                  >
                    <option value="10">10</option>
                    <option value="25">25</option>
                    <option value="50">50</option>
                    <option value="100">100</option>
                  </select>
                </div>
              </div>
            </div>
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {vendorStats.length === 0 ? (
                <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                  <PackageIcon className="w-12 h-12 mx-auto mb-3 text-gray-400 dark:text-gray-500" />
                  <p>No confirmed inventory yet</p>
                  <p className="text-sm mt-1">Confirm pending orders to see inventory stats</p>
                </div>
              ) : (
                vendorStats.map((vendor) => (
                  <div key={vendor.vendorId} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                    {/* Vendor Header */}
                    <button
                      onClick={() => toggleVendor(vendor.vendorId)}
                      className="w-full px-6 py-4 flex items-center justify-between text-left"
                    >
                      <div className="flex items-center space-x-3">
                        {expandedVendors.has(vendor.vendorId) ? (
                          <ChevronDownIcon className="w-5 h-5 text-gray-400 dark:text-gray-500" />
                        ) : (
                          <ChevronRightIcon className="w-5 h-5 text-gray-400 dark:text-gray-500" />
                        )}
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{vendor.vendorName}</h3>
                          <p className="text-sm text-gray-500 dark:text-gray-400">{vendor.brands.length} brands</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-gray-900 dark:text-white">{formatCurrency(vendor.totalValue)}</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">{vendor.totalItems} items</p>
                      </div>
                    </button>

                    {/* Brand Details */}
                    {expandedVendors.has(vendor.vendorId) && (
                      <div className="px-6 pb-4 ml-8">
                        <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4 space-y-3">
                          {vendor.brands.map((brand, idx) => (
                            <div key={idx} className="flex items-center justify-between py-2 border-b border-gray-200 dark:border-gray-700 last:border-0">
                              <div>
                                <p className="font-medium text-gray-900 dark:text-white">{brand.brandName}</p>
                                <p className="text-sm text-gray-500 dark:text-gray-400">{brand.itemCount} items</p>
                              </div>
                              <p className="font-semibold text-gray-900 dark:text-white">{formatCurrency(brand.totalValue)}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>

            {/* Pagination Controls */}
            {pagination && pagination.totalPages > 1 && (
              <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
                <div className="flex items-center justify-between">
                  {/* Pagination Info */}
                  <div className="text-sm text-gray-600 dark:text-gray-300">
                    Showing page {pagination.currentPage} of {pagination.totalPages} ({pagination.totalCount} total items)
                  </div>

                  {/* Pagination Buttons */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setCurrentPage(1)}
                      disabled={!pagination.hasPreviousPage}
                      className="px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      First
                    </button>
                    <button
                      onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                      disabled={!pagination.hasPreviousPage}
                      className="px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Previous
                    </button>

                    {/* Page Numbers */}
                    <div className="flex items-center gap-1">
                      {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                        // Show pages around current page
                        let pageNum: number;
                        if (pagination.totalPages <= 5) {
                          pageNum = i + 1;
                        } else if (pagination.currentPage <= 3) {
                          pageNum = i + 1;
                        } else if (pagination.currentPage >= pagination.totalPages - 2) {
                          pageNum = pagination.totalPages - 4 + i;
                        } else {
                          pageNum = pagination.currentPage - 2 + i;
                        }

                        return (
                          <button
                            key={pageNum}
                            onClick={() => setCurrentPage(pageNum)}
                            className={`px-3 py-1.5 text-sm border rounded-lg ${
                              pageNum === pagination.currentPage
                                ? 'bg-blue-600 dark:bg-blue-600 text-white border-blue-600'
                                : 'border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700'
                            }`}
                          >
                            {pageNum}
                          </button>
                        );
                      })}
                    </div>

                    <button
                      onClick={() => setCurrentPage(prev => Math.min(pagination.totalPages, prev + 1))}
                      disabled={!pagination.hasNextPage}
                      className="px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Next
                    </button>
                    <button
                      onClick={() => setCurrentPage(pagination.totalPages)}
                      disabled={!pagination.hasNextPage}
                      className="px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Last
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </Container>
      </div>
    </div>
  );
};

export default DashboardPage;

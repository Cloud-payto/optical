import React, { useState, useEffect } from 'react';
import { Container } from '../components/ui/Container';
import { fetchDashboardStats, fetchInventoryByVendor, DashboardStats, VendorInventoryStats } from '../services/api';
import { PackageIcon, DollarSignIcon, ShoppingCartIcon, ClockIcon, ChevronDownIcon, ChevronRightIcon } from 'lucide-react';

const DashboardPage: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [vendorStats, setVendorStats] = useState<VendorInventoryStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedVendors, setExpandedVendors] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const [statsData, vendorData] = await Promise.all([
        fetchDashboardStats(),
        fetchInventoryByVendor()
      ]);
      setStats(statsData);
      setVendorStats(vendorData);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load dashboard data');
      console.error('Dashboard error:', err);
    } finally {
      setLoading(false);
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
    <div className="h-full bg-gray-50">
      <div className="p-6 md:p-8">
        <Container size="xl">
          {/* Page Title */}
          <h1 className="text-3xl font-bold text-gray-900 mb-8">Dashboard</h1>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
              <div className="flex items-center justify-between mb-2">
                <p className="text-gray-700 font-medium">Total Inventory Value</p>
                <DollarSignIcon className="w-5 h-5 text-blue-600" />
              </div>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(stats?.totalValue || 0)}</p>
            </div>
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
              <div className="flex items-center justify-between mb-2">
                <p className="text-gray-700 font-medium">Total Items</p>
                <PackageIcon className="w-5 h-5 text-green-600" />
              </div>
              <p className="text-2xl font-bold text-gray-900">{stats?.totalInventory || 0}</p>
            </div>
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
              <div className="flex items-center justify-between mb-2">
                <p className="text-gray-700 font-medium">Pending Items</p>
                <ClockIcon className="w-5 h-5 text-orange-600" />
              </div>
              <p className="text-2xl font-bold text-gray-900">{stats?.pendingItems || 0}</p>
            </div>
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
              <div className="flex items-center justify-between mb-2">
                <p className="text-gray-700 font-medium">Total Orders</p>
                <ShoppingCartIcon className="w-5 h-5 text-purple-600" />
              </div>
              <p className="text-2xl font-bold text-gray-900">{stats?.totalOrders || 0}</p>
            </div>
          </div>

          {/* Inventory by Vendor */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900">Inventory by Vendor & Brand</h2>
            </div>
            <div className="divide-y divide-gray-200">
              {vendorStats.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  <PackageIcon className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                  <p>No confirmed inventory yet</p>
                  <p className="text-sm mt-1">Confirm pending orders to see inventory stats</p>
                </div>
              ) : (
                vendorStats.map((vendor) => (
                  <div key={vendor.vendorId} className="hover:bg-gray-50 transition-colors">
                    {/* Vendor Header */}
                    <button
                      onClick={() => toggleVendor(vendor.vendorId)}
                      className="w-full px-6 py-4 flex items-center justify-between text-left"
                    >
                      <div className="flex items-center space-x-3">
                        {expandedVendors.has(vendor.vendorId) ? (
                          <ChevronDownIcon className="w-5 h-5 text-gray-400" />
                        ) : (
                          <ChevronRightIcon className="w-5 h-5 text-gray-400" />
                        )}
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">{vendor.vendorName}</h3>
                          <p className="text-sm text-gray-500">{vendor.brands.length} brands</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-gray-900">{formatCurrency(vendor.totalValue)}</p>
                        <p className="text-sm text-gray-500">{vendor.totalItems} items</p>
                      </div>
                    </button>

                    {/* Brand Details */}
                    {expandedVendors.has(vendor.vendorId) && (
                      <div className="px-6 pb-4 ml-8">
                        <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                          {vendor.brands.map((brand, idx) => (
                            <div key={idx} className="flex items-center justify-between py-2 border-b border-gray-200 last:border-0">
                              <div>
                                <p className="font-medium text-gray-900">{brand.brandName}</p>
                                <p className="text-sm text-gray-500">{brand.itemCount} items</p>
                              </div>
                              <p className="font-semibold text-gray-900">{formatCurrency(brand.totalValue)}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </Container>
      </div>
    </div>
  );
};

export default DashboardPage;

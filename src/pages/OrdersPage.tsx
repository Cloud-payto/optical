import React, { useState, useEffect } from 'react';
import { Search, Filter, SortAsc, MoreHorizontal, Package } from 'lucide-react';
import { fetchOrders, archiveOrder, deleteOrder, OrderData } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';

type TabType = 'All' | 'Draft' | 'Ordered' | 'Partial' | 'Received' | 'Closed';

const OrdersPage: React.FC = () => {
  const { user, isAuthenticated } = useAuth();
  const [orders, setOrders] = useState<OrderData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<TabType>('All');
  const [openDropdown, setOpenDropdown] = useState<number | null>(null);

  // Load orders
  const loadOrders = async () => {
    if (!isAuthenticated || !user) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const response = await fetchOrders(user.id);
      if (response.success && response.orders) {
        setOrders(response.orders);
      }
    } catch (error) {
      console.error('Failed to load orders:', error);
      toast.error('Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, [isAuthenticated, user]);

  // Filter orders by tab
  const filteredOrders = orders.filter(order => {
    // Search filter
    const matchesSearch =
      order.order_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.vendor.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customer_name?.toLowerCase().includes(searchTerm.toLowerCase());

    if (!matchesSearch) return false;

    // Tab filter
    if (activeTab === 'All') return true;
    return order.status?.toLowerCase() === activeTab.toLowerCase();
  });

  // Handle archive order
  const handleArchiveOrder = async (orderId: number) => {
    try {
      const response = await archiveOrder(orderId, user?.id);
      if (response.success) {
        toast.success('Order archived successfully');
        loadOrders();
      }
    } catch (error) {
      console.error('Failed to archive order:', error);
      toast.error('Failed to archive order');
    }
    setOpenDropdown(null);
  };

  // Handle delete order
  const handleDeleteOrder = async (orderId: number) => {
    if (!confirm('Are you sure you want to delete this order?')) return;

    try {
      const response = await deleteOrder(orderId, user?.id);
      if (response.success) {
        toast.success('Order deleted successfully');
        loadOrders();
      }
    } catch (error) {
      console.error('Failed to delete order:', error);
      toast.error('Failed to delete order');
    }
    setOpenDropdown(null);
  };

  // Get status badge
  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { bg: string; text: string; dot: string }> = {
      'closed': { bg: 'bg-red-50', text: 'text-red-700', dot: 'bg-red-500' },
      'open': { bg: 'bg-green-50', text: 'text-green-700', dot: 'bg-green-500' },
      'partial': { bg: 'bg-yellow-50', text: 'text-yellow-700', dot: 'bg-yellow-500' },
      'received': { bg: 'bg-blue-50', text: 'text-blue-700', dot: 'bg-blue-500' },
      'ordered': { bg: 'bg-purple-50', text: 'text-purple-700', dot: 'bg-purple-500' },
      'draft': { bg: 'bg-gray-50', text: 'text-gray-700', dot: 'bg-gray-500' },
    };

    const config = statusMap[status?.toLowerCase()] || statusMap['draft'];

    return (
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
        <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`}></span>
        {status || 'Draft'}
      </span>
    );
  };

  // Format date
  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  // Get received count
  const getReceivedCount = (order: OrderData) => {
    const received = order.items.filter(item => item.quantity > 0).length;
    return `${received} of ${order.total_items}`;
  };

  const tabs: TabType[] = ['All', 'Draft', 'Ordered', 'Partial', 'Received', 'Closed'];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-[1400px] mx-auto p-6">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-gray-900">Purchase orders</h1>
          <p className="text-sm text-gray-500 mt-1">
            The inventory section on the OptiProfit product page provides a snapshot of product availability.
          </p>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
            <div className="flex items-center gap-6">
              {tabs.map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`relative pb-1 text-sm font-medium transition-colors ${
                    activeTab === tab
                      ? 'text-gray-900'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {tab}
                  {activeTab === tab && (
                    <motion.div
                      layoutId="activeTab"
                      className="absolute bottom-0 left-0 right-0 h-0.5 bg-violet-600"
                      transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                    />
                  )}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-3">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                />
              </div>

              {/* Filter Button */}
              <button className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                <Filter className="h-4 w-4 text-gray-600" />
              </button>

              {/* Sort Button */}
              <button className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                <SortAsc className="h-4 w-4 text-gray-600" />
              </button>

              {/* More Options */}
              <button className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                <MoreHorizontal className="h-4 w-4 text-gray-600" />
              </button>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="w-12 px-6 py-3">
                    <input type="checkbox" className="rounded border-gray-300 text-violet-600 focus:ring-violet-500" />
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Purchase order
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Vendor
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Destination
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Received
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Order Date
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                <AnimatePresence>
                  {loading ? (
                    <tr>
                      <td colSpan={8} className="px-6 py-12 text-center text-gray-500">
                        <div className="flex items-center justify-center gap-2">
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-violet-600"></div>
                          Loading orders...
                        </div>
                      </td>
                    </tr>
                  ) : filteredOrders.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-6 py-12 text-center">
                        <div className="flex flex-col items-center gap-3">
                          <Package className="h-12 w-12 text-gray-300" />
                          <p className="text-gray-500">No orders found</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredOrders.map((order) => (
                      <motion.tr
                        key={order.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="hover:bg-gray-50 transition-colors"
                      >
                        <td className="px-6 py-4">
                          <input type="checkbox" className="rounded border-gray-300 text-violet-600 focus:ring-violet-500" />
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-col">
                            <span className="text-sm font-medium text-gray-900">#{order.order_number}</span>
                            <span className="text-xs text-gray-500">{order.account_number || 'N/A'}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900">{order.vendor}</td>
                        <td className="px-6 py-4 text-sm text-gray-900">{order.customer_name || 'N/A'}</td>
                        <td className="px-6 py-4">{getStatusBadge(order.status)}</td>
                        <td className="px-6 py-4 text-sm text-gray-900">{getReceivedCount(order)}</td>
                        <td className="px-6 py-4 text-sm text-gray-900">
                          ${order.items.reduce((sum, item) => sum + (item.quantity || 0), 0).toFixed(2)}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900">{formatDate(order.order_date)}</td>
                      </motion.tr>
                    ))
                  )}
                </AnimatePresence>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrdersPage;

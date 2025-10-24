import React, { useState, useEffect } from 'react';
import { Search, Filter, SortAsc, MoreHorizontal, Package, Eye, CheckCircle, X, Archive } from 'lucide-react';
import { fetchOrders, archiveOrder, deleteOrder, confirmPendingOrder, OrderData } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';

type TabType = 'All' | 'Pending' | 'Confirmed' | 'Archived';

const OrdersPage: React.FC = () => {
  const { user, isAuthenticated } = useAuth();
  const [orders, setOrders] = useState<OrderData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<TabType>('All');
  const [openDropdown, setOpenDropdown] = useState<number | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<OrderData | null>(null);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [confirmingOrders, setConfirmingOrders] = useState<Set<number>>(new Set());
  const [archivingOrders, setArchivingOrders] = useState<Set<number>>(new Set());

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

  // Filter and sort orders by tab
  const filteredOrders = orders
    .filter(order => {
      // Search filter
      const matchesSearch =
        order.order_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.vendor.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.customer_name?.toLowerCase().includes(searchTerm.toLowerCase());

      if (!matchesSearch) return false;

      // Tab filter
      if (activeTab === 'All') return !order.metadata?.archived; // Don't show archived in "All"
      if (activeTab === 'Pending') return order.status?.toLowerCase() === 'pending' && !order.metadata?.archived;
      if (activeTab === 'Confirmed') return order.status?.toLowerCase() === 'confirmed' && !order.metadata?.archived;
      if (activeTab === 'Archived') return order.metadata?.archived === true;
      return false;
    })
    .sort((a, b) => {
      // Sort by status: pending -> confirmed -> archived
      const statusOrder = { pending: 0, confirmed: 1, archived: 2 };
      const statusA = statusOrder[a.status?.toLowerCase() as keyof typeof statusOrder] ?? 3;
      const statusB = statusOrder[b.status?.toLowerCase() as keyof typeof statusOrder] ?? 3;
      return statusA - statusB;
    });

  // Handle archive order
  const handleArchiveOrder = async (orderId: number) => {
    setArchivingOrders(prev => new Set(prev).add(orderId));

    try {
      const response = await archiveOrder(orderId, user?.id);
      if (response.success) {
        toast.success('Order archived successfully');
        loadOrders();
      }
    } catch (error) {
      console.error('Failed to archive order:', error);
      toast.error('Failed to archive order');
    } finally {
      setArchivingOrders(prev => {
        const newSet = new Set(prev);
        newSet.delete(orderId);
        return newSet;
      });
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

  // Handle confirm order
  const handleConfirmOrder = async (order: OrderData) => {
    setConfirmingOrders(prev => new Set(prev).add(order.id));

    try {
      const response = await confirmPendingOrder(order.order_number, user?.id);
      if (response.success) {
        toast.success('Order confirmed successfully');
        loadOrders();
      }
    } catch (error) {
      console.error('Failed to confirm order:', error);
      toast.error('Failed to confirm order');
    } finally {
      setConfirmingOrders(prev => {
        const newSet = new Set(prev);
        newSet.delete(order.id);
        return newSet;
      });
    }
  };

  // Handle preview order
  const handlePreviewOrder = (order: OrderData) => {
    setSelectedOrder(order);
    setShowPreviewModal(true);
  };

  // Get status badge
  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { bg: string; text: string; dot: string; label: string }> = {
      'pending': { bg: 'bg-yellow-50', text: 'text-yellow-700', dot: 'bg-yellow-500', label: 'Pending' },
      'confirmed': { bg: 'bg-green-50', text: 'text-green-700', dot: 'bg-green-500', label: 'Confirmed' },
      'archived': { bg: 'bg-gray-50', text: 'text-gray-700', dot: 'bg-gray-500', label: 'Archived' },
    };

    const config = statusMap[status?.toLowerCase()] || statusMap['pending'];

    return (
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
        <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`}></span>
        {config.label}
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

  const tabs: TabType[] = ['All', 'Pending', 'Confirmed', 'Archived'];

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
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                <AnimatePresence>
                  {loading ? (
                    <tr>
                      <td colSpan={9} className="px-6 py-12 text-center text-gray-500">
                        <div className="flex items-center justify-center gap-2">
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-violet-600"></div>
                          Loading orders...
                        </div>
                      </td>
                    </tr>
                  ) : filteredOrders.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="px-6 py-12 text-center">
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
                            {order.account_number && (
                              <span className="text-xs text-gray-500">{order.account_number}</span>
                            )}
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
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            {/* Preview Button */}
                            <button
                              onClick={() => handlePreviewOrder(order)}
                              className="p-1.5 text-gray-600 hover:text-violet-600 hover:bg-violet-50 rounded-lg transition-colors"
                              title="Preview order"
                            >
                              <Eye className="h-4 w-4" />
                            </button>

                            {/* Confirm Button - only show for pending orders */}
                            {order.status?.toLowerCase() === 'pending' && (
                              <button
                                onClick={() => handleConfirmOrder(order)}
                                disabled={confirmingOrders.has(order.id)}
                                className="p-1.5 text-gray-600 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                title="Confirm order"
                              >
                                {confirmingOrders.has(order.id) ? (
                                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-600"></div>
                                ) : (
                                  <CheckCircle className="h-4 w-4" />
                                )}
                              </button>
                            )}

                            {/* Archive Button - only show for confirmed orders */}
                            {order.status?.toLowerCase() === 'confirmed' && (
                              <button
                                onClick={() => handleArchiveOrder(order.id)}
                                disabled={archivingOrders.has(order.id)}
                                className="p-1.5 text-gray-600 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                title="Archive order"
                              >
                                {archivingOrders.has(order.id) ? (
                                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600"></div>
                                ) : (
                                  <Archive className="h-4 w-4" />
                                )}
                              </button>
                            )}
                          </div>
                        </td>
                      </motion.tr>
                    ))
                  )}
                </AnimatePresence>
              </tbody>
            </table>
          </div>
        </div>

        {/* Preview Modal */}
        <AnimatePresence>
          {showPreviewModal && selectedOrder && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-gray-500/75 z-50 flex items-center justify-center p-4"
              onClick={() => setShowPreviewModal(false)}
            >
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden"
              >
                {/* Modal Header */}
                <div className="flex items-center justify-between px-6 py-5 border-b border-gray-200">
                  <h3 className="text-lg font-medium text-gray-900">Order Details</h3>
                  <button
                    onClick={() => setShowPreviewModal(false)}
                    className="text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 rounded-md"
                  >
                    <X className="h-6 w-6" />
                  </button>
                </div>

                {/* Modal Body */}
                <div className="px-6 py-4 overflow-y-auto max-h-[calc(90vh-180px)]">
                  {/* Order Summary Section */}
                  <div className="bg-gray-50 rounded-lg p-4 mb-4">
                    <h4 className="text-sm font-medium text-gray-900 mb-3">Order Summary</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-500">Order Number:</span>
                        <span className="ml-2 text-gray-900 font-medium">{selectedOrder.order_number}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Vendor:</span>
                        <span className="ml-2 text-gray-900">{selectedOrder.vendor}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Customer:</span>
                        <span className="ml-2 text-gray-900">{selectedOrder.customer_name || 'N/A'}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Account:</span>
                        <span className="ml-2 text-gray-900">{selectedOrder.account_number || 'N/A'}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Total Items:</span>
                        <span className="ml-2 text-gray-900">{selectedOrder.items.length}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Total Pieces:</span>
                        <span className="ml-2 text-gray-900">{selectedOrder.items.reduce((sum, item) => sum + (item.quantity || 0), 0)}</span>
                      </div>
                      {selectedOrder.order_date && (
                        <div>
                          <span className="text-gray-500">Order Date:</span>
                          <span className="ml-2 text-gray-900">{formatDate(selectedOrder.order_date)}</span>
                        </div>
                      )}
                      {selectedOrder.rep_name && (
                        <div>
                          <span className="text-gray-500">Sales Rep:</span>
                          <span className="ml-2 text-gray-900">{selectedOrder.rep_name}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Items Table */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="text-sm font-medium text-gray-900 mb-3">Order Items</h4>
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-100">
                          <tr>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">UPC</th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Brand</th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Model</th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Color</th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Size</th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Qty</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {selectedOrder.items.map((item, index) => (
                            <tr key={index}>
                              <td className="px-4 py-2 text-sm text-gray-900">{item.sku || 'N/A'}</td>
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
                </div>

                {/* Modal Footer */}
                <div className="bg-gray-50 px-6 py-3 border-t border-gray-200 flex justify-end">
                  {selectedOrder.status?.toLowerCase() === 'pending' && (
                    <button
                      onClick={() => {
                        handleConfirmOrder(selectedOrder);
                        setShowPreviewModal(false);
                      }}
                      disabled={confirmingOrders.has(selectedOrder.id)}
                      className="mr-3 inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-green-600 text-base font-medium text-white hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {confirmingOrders.has(selectedOrder.id) ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Confirming...
                        </>
                      ) : (
                        'Confirm Order'
                      )}
                    </button>
                  )}
                  <button
                    onClick={() => setShowPreviewModal(false)}
                    className="inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:text-sm"
                  >
                    Close
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default OrdersPage;

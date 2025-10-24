import React, { useState, useEffect } from 'react';
import { Search, Filter, SortAsc, MoreHorizontal, Package, Eye, CheckCircle, X, Archive } from 'lucide-react';
import { fetchOrders, fetchEmails, archiveOrder, deleteOrder, confirmPendingOrder, OrderData, EmailData } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';

type TabType = 'All' | 'Pending' | 'Confirmed' | 'Archived';

const OrdersPage: React.FC = () => {
  const { user, isAuthenticated } = useAuth();
  const [orders, setOrders] = useState<OrderData[]>([]);
  const [emails, setEmails] = useState<EmailData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<TabType>('All');
  const [openDropdown, setOpenDropdown] = useState<number | null>(null);
  const [selectedEmailDetails, setSelectedEmailDetails] = useState<EmailData | null>(null);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [confirmingOrders, setConfirmingOrders] = useState<Set<number>>(new Set());
  const [archivingOrders, setArchivingOrders] = useState<Set<number>>(new Set());

  // Load orders and emails
  const loadOrders = async () => {
    if (!isAuthenticated || !user) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const [ordersResponse, emailsResponse] = await Promise.all([
        fetchOrders(user.id),
        fetchEmails()
      ]);

      if (ordersResponse.success && ordersResponse.orders) {
        setOrders(ordersResponse.orders);
      }
      if (emailsResponse.emails) {
        setEmails(emailsResponse.emails);
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
    // For confirmed/archived orders, we need to construct a fake EmailData from the order
    // since they don't have email_id or the original email might be deleted
    const fakeEmailFromOrder: EmailData = {
      id: order.id.toString(),
      from_email: order.vendor + ' Orders',
      to_email: user?.email || '',
      subject: `Order #${order.order_number}`,
      attachments_count: 0,
      spam_score: 0,
      received_at: order.confirmed_at || order.order_date || new Date().toISOString(),
      spam_status: 'parsed',
      parse_status: 'parsed',
      parsed_data: {
        vendor: order.vendor,
        account_number: order.account_number || '',
        order: {
          order_number: order.order_number,
          customer_name: order.customer_name || '',
          total_pieces: order.total_items,
          order_date: order.order_date,
          rep_name: order.rep_name
        },
        items: order.items.map(item => ({
          upc: item.sku, // Use SKU as UPC for confirmed orders
          brand: item.brand,
          model: item.model,
          color: item.color,
          size: item.size,
          quantity: item.quantity
        }))
      }
    };

    setSelectedEmailDetails(fakeEmailFromOrder);
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

  // Format date with time
  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return 'N/A';
    try {
      let date: Date;
      if (dateString.includes('T') || dateString.includes('Z')) {
        date = new Date(dateString);
      } else if (dateString.includes('/')) {
        const [month, day, year] = dateString.split('/').map(Number);
        date = new Date(year, month - 1, day);
      } else if (dateString.includes('-')) {
        date = new Date(dateString);
      } else {
        date = new Date(dateString);
      }

      if (isNaN(date.getTime())) {
        return dateString;
      }

      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      return dateString || 'Invalid date';
    }
  };

  // Format date without time
  const formatDateOnly = (dateString: string | null | undefined) => {
    if (!dateString) return 'N/A';
    try {
      let date: Date;
      if (dateString.includes('T') || dateString.includes('Z')) {
        date = new Date(dateString);
      } else if (dateString.includes('/')) {
        const [month, day, year] = dateString.split('/').map(Number);
        date = new Date(year, month - 1, day);
      } else if (dateString.includes('-')) {
        date = new Date(dateString);
      } else {
        date = new Date(dateString);
      }

      if (isNaN(date.getTime())) {
        return dateString;
      }

      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch (error) {
      return dateString || 'Invalid date';
    }
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

        {/* Preview Modal - EXACT copy from old Inventory page */}
        {showPreviewModal && selectedEmailDetails && (
          <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
              <div className="fixed inset-0 transition-opacity" aria-hidden="true">
                <div className="absolute inset-0 bg-gray-500 opacity-75" onClick={() => setSelectedEmailDetails(null)}></div>
              </div>

              <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

              <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full">
                <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg leading-6 font-medium text-gray-900">
                      Order Details
                    </h3>
                    <button
                      onClick={() => { setSelectedEmailDetails(null); setShowPreviewModal(false); }}
                      className="rounded-md text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      <X className="h-6 w-6" />
                    </button>
                  </div>

                  <div className="mt-3">
                    {/* Email Information */}
                    <div className="bg-gray-50 rounded-lg p-4 mb-4">
                      <h4 className="text-sm font-medium text-gray-900 mb-3">Email Information</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-gray-500">From:</span>
                          <span className="ml-2 text-gray-900">{selectedEmailDetails.from_email}</span>
                        </div>
                        <div>
                          <span className="text-gray-500">Email Received:</span>
                          <span className="ml-2 text-gray-900">{formatDate(selectedEmailDetails.received_at)}</span>
                        </div>
                        {selectedEmailDetails.parsed_data?.order?.order_date && (
                          <div>
                            <span className="text-gray-500">Order Date:</span>
                            <span className="ml-2 text-gray-900">{formatDateOnly(selectedEmailDetails.parsed_data.order.order_date)}</span>
                          </div>
                        )}
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
                              <span className="ml-2 text-gray-900">
                                {selectedEmailDetails.parsed_data.vendor
                                  ? selectedEmailDetails.parsed_data.vendor.replace(/_/g, ' ').split(' ').map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
                                  : 'Unknown'}
                              </span>
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
                            {selectedEmailDetails.parsed_data.order.order_date && (
                              <div>
                                <span className="text-gray-500">Order Date:</span>
                                <span className="ml-2 text-gray-900">{formatDateOnly(selectedEmailDetails.parsed_data.order.order_date)}</span>
                              </div>
                            )}
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
                    onClick={() => { setSelectedEmailDetails(null); setShowPreviewModal(false); }}
                    className="w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default OrdersPage;

import React from 'react';
import { SearchIcon, MailIcon, ChevronDownIcon, ChevronRightIcon, CheckIcon, EyeIcon, MoreVerticalIcon, TrashIcon, ArchiveIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { OrderData, EmailData } from '../../../services/api';
import { extractVendorFromEmail } from '../utils/vendorHelpers';
import { SensitiveText } from '../../../components/ui/SensitiveText';

interface OrdersTabProps {
  // Sub-tab state
  ordersSubTab: 'pending' | 'confirmed';
  setOrdersSubTab: (tab: 'pending' | 'confirmed') => void;

  // Data
  emails: EmailData[];
  orders: OrderData[];
  pendingOrdersList: OrderData[];
  confirmedOrdersList: OrderData[];
  searchTerm: string;

  // Expansion state
  expandedOrders: Set<string>;
  toggleOrderExpansion: (orderKey: string) => void;

  // Actions
  handleViewOrderDetails: (email: EmailData) => void;
  handleDeleteEmail: (emailId: string) => void;
  handleArchiveOrder: (orderId: number) => void;
  handleDeleteOrder: (orderId: number) => void;

  // Loading states
  deletingOrders: Set<number>;
  archivingOrders: Set<number>;

  // Dropdown state
  openDropdown: string | null;
  setOpenDropdown: (value: string | null) => void;
}

export const OrdersTab: React.FC<OrdersTabProps> = ({
  ordersSubTab,
  setOrdersSubTab,
  emails,
  orders,
  pendingOrdersList,
  confirmedOrdersList,
  searchTerm,
  expandedOrders,
  toggleOrderExpansion,
  handleViewOrderDetails,
  handleDeleteEmail,
  handleArchiveOrder,
  handleDeleteOrder,
  deletingOrders,
  archivingOrders,
  openDropdown,
  setOpenDropdown
}) => {
  // Format date helper
  const formatOrderDate = (dateString: string | null | undefined): string => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'N/A';

      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch (error) {
      console.error('Date formatting error:', error);
      return 'N/A';
    }
  };

  return (
    <div>
      {/* Orders Sub-tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-6">
        <nav className="flex space-x-8">
          <button
            onClick={() => setOrdersSubTab('pending')}
            className={`py-3 px-1 border-b-2 font-medium text-sm ${
              ordersSubTab === 'pending'
                ? 'border-orange-500 text-orange-600 dark:text-orange-400'
                : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            Pending ({emails.length})
          </button>
          <button
            onClick={() => setOrdersSubTab('confirmed')}
            className={`py-3 px-1 border-b-2 font-medium text-sm ${
              ordersSubTab === 'confirmed'
                ? 'border-green-500 text-green-600 dark:text-green-400'
                : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            Confirmed ({orders.filter(o => o.status === 'confirmed' && !o.metadata?.archived).length})
          </button>
        </nav>
      </div>

      {/* Pending Orders Content */}
      {ordersSubTab === 'pending' && (
        <div>
          {pendingOrdersList.length === 0 ? (
            <div className="text-center py-12">
              <MailIcon className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500" />
              <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No pending orders</h3>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                {searchTerm ? 'No orders match your search.' : 'No pending orders yet.'}
              </p>
            </div>
          ) : (
            <div>
              <table className="w-full divide-y divide-gray-200 dark:divide-gray-700 table-fixed">
                <thead className="bg-gray-50 dark:bg-gray-800">
                  <tr>
                    <th className="w-[12%] px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Vendor
                    </th>
                    <th className="w-[25%] px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Order Details
                    </th>
                    <th className="w-[15%] px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Customer
                    </th>
                    <th className="w-[15%] px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Order Date
                    </th>
                    <th className="w-[10%] px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="w-[10%] px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Total
                    </th>
                    <th className="w-[13%] px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-[#1F2623] divide-y divide-gray-200 dark:divide-gray-700">
                  {pendingOrdersList.map((order) => {
                    const email = emails.find(e => e.parsed_data?.order?.order_number === order.order_number);
                    const orderKey = `order-${order.id}`;
                    const isExpanded = expandedOrders.has(orderKey);

                    return (
                      <React.Fragment key={order.id}>
                        <motion.tr
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors duration-150"
                        >
                          <td className="px-4 py-3 whitespace-normal text-sm">
                            <div className="flex items-center">
                              <button
                                onClick={() => toggleOrderExpansion(orderKey)}
                                className="mr-2 p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
                              >
                                {isExpanded ? (
                                  <ChevronDownIcon className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                                ) : (
                                  <ChevronRightIcon className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                                )}
                              </button>
                              <span className="font-medium text-gray-900 dark:text-white">{order.vendor || 'Unknown'}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3 whitespace-normal text-sm">
                            <div className="flex flex-col">
                              <SensitiveText type="order" className="font-medium text-gray-900 dark:text-white">#{order.order_number}</SensitiveText>
                              {order.subject && (
                                <span className="text-xs text-gray-500 dark:text-gray-400 line-clamp-1">{order.subject}</span>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-3 whitespace-normal text-sm text-gray-900 dark:text-white">
                            <SensitiveText type="customer">{order.customer_name || 'N/A'}</SensitiveText>
                          </td>
                          <td className="px-4 py-3 whitespace-normal text-sm text-gray-500 dark:text-gray-400">
                            {formatOrderDate(order.order_date)}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-300">
                              Pending
                            </span>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                            ${order.total?.toFixed(2) || '0.00'}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-right text-sm font-medium">
                            <div className="flex justify-end space-x-2">
                              {email && (
                                <button
                                  onClick={() => handleViewOrderDetails(email)}
                                  className="text-blue-600 hover:text-blue-900 p-1 hover:bg-blue-50 rounded"
                                  title="View Details"
                                >
                                  <EyeIcon className="h-4 w-4" />
                                </button>
                              )}
                              {email && (
                                <button
                                  onClick={() => handleDeleteEmail(email.id)}
                                  className="text-red-600 hover:text-red-900 p-1 hover:bg-red-50 rounded"
                                  title="Delete Order"
                                >
                                  <TrashIcon className="h-4 w-4" />
                                </button>
                              )}
                            </div>
                          </td>
                        </motion.tr>

                        {/* Expanded Details */}
                        <AnimatePresence>
                          {isExpanded && (
                            <tr>
                              <td colSpan={7} className="px-4 py-0">
                                <motion.div
                                  initial={{ height: 0, opacity: 0 }}
                                  animate={{ height: 'auto', opacity: 1 }}
                                  exit={{ height: 0, opacity: 0 }}
                                  transition={{ duration: 0.2 }}
                                  className="overflow-hidden bg-gray-50 dark:bg-gray-800"
                                >
                                  <div className="px-6 py-4 space-y-3">
                                    {order.items && order.items.length > 0 ? (
                                      <div>
                                        <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                          Order Items ({order.items.length})
                                        </h4>
                                        <div className="space-y-2">
                                          {order.items.map((item: any, idx: number) => (
                                            <div key={idx} className="bg-white dark:bg-[#1F2623] rounded-lg border border-gray-200 dark:border-gray-700 p-3">
                                              <div className="grid grid-cols-4 gap-4 text-sm">
                                                <div>
                                                  <span className="text-gray-500 dark:text-gray-400">Brand:</span>
                                                  <span className="ml-2 font-medium text-gray-900 dark:text-white">{item.brand || 'N/A'}</span>
                                                </div>
                                                <div>
                                                  <span className="text-gray-500 dark:text-gray-400">Model:</span>
                                                  <span className="ml-2 font-medium text-gray-900 dark:text-white">{item.model || 'N/A'}</span>
                                                </div>
                                                <div>
                                                  <span className="text-gray-500 dark:text-gray-400">Color:</span>
                                                  <span className="ml-2 font-medium text-gray-900 dark:text-white">{item.color || 'N/A'}</span>
                                                </div>
                                                <div>
                                                  <span className="text-gray-500 dark:text-gray-400">Price:</span>
                                                  <span className="ml-2 font-medium text-gray-900 dark:text-white">
                                                    ${item.unit_cost?.toFixed(2) || '0.00'}
                                                  </span>
                                                </div>
                                              </div>
                                            </div>
                                          ))}
                                        </div>
                                      </div>
                                    ) : (
                                      <p className="text-sm text-gray-500 dark:text-gray-400">No items found for this order</p>
                                    )}
                                  </div>
                                </motion.div>
                              </td>
                            </tr>
                          )}
                        </AnimatePresence>
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Confirmed Orders Content */}
      {ordersSubTab === 'confirmed' && (
        <div>
          {confirmedOrdersList.length === 0 ? (
            <div className="text-center py-12">
              <CheckIcon className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500" />
              <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No confirmed orders</h3>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                {searchTerm ? 'No confirmed orders match your search.' : 'No orders have been confirmed yet.'}
              </p>
            </div>
          ) : (
            <div>
              <table className="w-full divide-y divide-gray-200 dark:divide-gray-700 table-fixed">
                <thead className="bg-gray-50 dark:bg-gray-800">
                  <tr>
                    <th className="w-[12%] px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Vendor
                    </th>
                    <th className="w-[25%] px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Order Details
                    </th>
                    <th className="w-[15%] px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Customer
                    </th>
                    <th className="w-[15%] px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Order Date
                    </th>
                    <th className="w-[10%] px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="w-[10%] px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Total
                    </th>
                    <th className="w-[13%] px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-[#1F2623] divide-y divide-gray-200 dark:divide-gray-700">
                  {confirmedOrdersList.map((order) => {
                    const orderKey = `order-${order.id}`;
                    const isExpanded = expandedOrders.has(orderKey);

                    return (
                      <React.Fragment key={order.id}>
                        <motion.tr
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors duration-150"
                        >
                          <td className="px-4 py-3 whitespace-normal text-sm">
                            <div className="flex items-center">
                              <button
                                onClick={() => toggleOrderExpansion(orderKey)}
                                className="mr-2 p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
                              >
                                {isExpanded ? (
                                  <ChevronDownIcon className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                                ) : (
                                  <ChevronRightIcon className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                                )}
                              </button>
                              <span className="font-medium text-gray-900 dark:text-white">{order.vendor || 'Unknown'}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3 whitespace-normal text-sm">
                            <div className="flex flex-col">
                              <SensitiveText type="order" className="font-medium text-gray-900 dark:text-white">#{order.order_number}</SensitiveText>
                              {order.subject && (
                                <span className="text-xs text-gray-500 dark:text-gray-400 line-clamp-1">{order.subject}</span>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-3 whitespace-normal text-sm text-gray-900 dark:text-white">
                            <SensitiveText type="customer">{order.customer_name || 'N/A'}</SensitiveText>
                          </td>
                          <td className="px-4 py-3 whitespace-normal text-sm text-gray-500 dark:text-gray-400">
                            {formatOrderDate(order.order_date)}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300">
                              Confirmed
                            </span>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                            ${order.total?.toFixed(2) || '0.00'}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-right text-sm font-medium">
                            <div className="relative inline-block text-left">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setOpenDropdown(openDropdown === orderKey ? null : orderKey);
                                }}
                                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                              >
                                <MoreVerticalIcon className="h-4 w-4" />
                              </button>

                              {openDropdown === orderKey && (
                                <div className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white dark:bg-gray-800 ring-1 ring-black ring-opacity-5 dark:ring-gray-700 z-10">
                                  <div className="py-1">
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleArchiveOrder(order.id);
                                        setOpenDropdown(null);
                                      }}
                                      disabled={archivingOrders.has(order.id)}
                                      className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center disabled:opacity-50"
                                    >
                                      <ArchiveIcon className="h-4 w-4 mr-2" />
                                      {archivingOrders.has(order.id) ? 'Archiving...' : 'Archive'}
                                    </button>
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleDeleteOrder(order.id);
                                        setOpenDropdown(null);
                                      }}
                                      disabled={deletingOrders.has(order.id)}
                                      className="w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center disabled:opacity-50"
                                    >
                                      <TrashIcon className="h-4 w-4 mr-2" />
                                      {deletingOrders.has(order.id) ? 'Deleting...' : 'Delete'}
                                    </button>
                                  </div>
                                </div>
                              )}
                            </div>
                          </td>
                        </motion.tr>

                        {/* Expanded Details */}
                        <AnimatePresence>
                          {isExpanded && (
                            <tr>
                              <td colSpan={7} className="px-4 py-0">
                                <motion.div
                                  initial={{ height: 0, opacity: 0 }}
                                  animate={{ height: 'auto', opacity: 1 }}
                                  exit={{ height: 0, opacity: 0 }}
                                  transition={{ duration: 0.2 }}
                                  className="overflow-hidden bg-gray-50 dark:bg-gray-800"
                                >
                                  <div className="px-6 py-4 space-y-3">
                                    {order.items && order.items.length > 0 ? (
                                      <div>
                                        <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                          Order Items ({order.items.length})
                                        </h4>
                                        <div className="space-y-2">
                                          {order.items.map((item: any, idx: number) => (
                                            <div key={idx} className="bg-white dark:bg-[#1F2623] rounded-lg border border-gray-200 dark:border-gray-700 p-3">
                                              <div className="grid grid-cols-4 gap-4 text-sm">
                                                <div>
                                                  <span className="text-gray-500 dark:text-gray-400">Brand:</span>
                                                  <span className="ml-2 font-medium text-gray-900 dark:text-white">{item.brand || 'N/A'}</span>
                                                </div>
                                                <div>
                                                  <span className="text-gray-500 dark:text-gray-400">Model:</span>
                                                  <span className="ml-2 font-medium text-gray-900 dark:text-white">{item.model || 'N/A'}</span>
                                                </div>
                                                <div>
                                                  <span className="text-gray-500 dark:text-gray-400">Color:</span>
                                                  <span className="ml-2 font-medium text-gray-900 dark:text-white">{item.color || 'N/A'}</span>
                                                </div>
                                                <div>
                                                  <span className="text-gray-500 dark:text-gray-400">Price:</span>
                                                  <span className="ml-2 font-medium text-gray-900 dark:text-white">
                                                    ${item.unit_cost?.toFixed(2) || '0.00'}
                                                  </span>
                                                </div>
                                              </div>
                                            </div>
                                          ))}
                                        </div>
                                      </div>
                                    ) : (
                                      <p className="text-sm text-gray-500 dark:text-gray-400">No items found for this order</p>
                                    )}
                                  </div>
                                </motion.div>
                              </td>
                            </tr>
                          )}
                        </AnimatePresence>
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

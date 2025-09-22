import { useState, useEffect } from 'react';

export default function RecentOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRecentOrders();
  }, []);

  const fetchRecentOrders = async () => {
    try {
      const response = await fetch('/api/orders?limit=5');
      const data = await response.json();
      if (data.success) {
        setOrders(data.orders || []);
      }
    } catch (error) {
      console.error('Error fetching recent orders:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 bg-gray-200 rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">No orders found</p>
        <p className="text-sm text-gray-400 mt-1">
          Orders will appear here once email processing begins
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {orders.map((order) => (
        <div key={order.id} className="border-l-4 border-blue-400 pl-4">
          <div className="flex justify-between items-start">
            <div>
              <p className="font-medium text-gray-900">
                Order #{order.order_number}
              </p>
              <p className="text-sm text-gray-600">
                {order.customer_name}
              </p>
              <p className="text-xs text-gray-500">
                {order.vendor_name || 'Unknown Vendor'}
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm font-medium text-gray-900">
                {order.total_pieces} items
              </p>
              <p className="text-xs text-gray-500">
                {new Date(order.order_date).toLocaleDateString()}
              </p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
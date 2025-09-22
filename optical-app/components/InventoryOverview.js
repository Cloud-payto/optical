import { useState, useEffect } from 'react';

export default function InventoryOverview() {
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchInventoryOverview();
  }, []);

  const fetchInventoryOverview = async () => {
    try {
      const response = await fetch('/api/inventory?limit=5');
      const data = await response.json();
      if (data.success) {
        setInventory(data.items || []);
      }
    } catch (error) {
      console.error('Error fetching inventory:', error);
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

  if (inventory.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">No inventory items found</p>
        <p className="text-sm text-gray-400 mt-1">
          Inventory will appear here once orders are processed
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {inventory.map((item) => (
        <div key={item.id} className="border rounded-lg p-3">
          <div className="flex justify-between items-start">
            <div>
              <p className="font-medium text-gray-900">
                {item.brand} {item.model}
              </p>
              <p className="text-sm text-gray-600">
                {item.color_name} - {item.size}
              </p>
              <p className="text-xs text-gray-500">
                SKU: {item.sku}
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm font-medium text-gray-900">
                Qty: {item.quantity}
              </p>
              <span
                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  item.status === 'pending'
                    ? 'bg-yellow-100 text-yellow-800'
                    : item.status === 'confirmed'
                    ? 'bg-green-100 text-green-800'
                    : 'bg-gray-100 text-gray-800'
                }`}
              >
                {item.status}
              </span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
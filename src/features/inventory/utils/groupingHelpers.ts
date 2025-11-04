import { InventoryItem } from '../../../services/api';

/**
 * Group pending inventory items by order
 * Returns a map of orderKey -> order details + items
 */
export function groupPendingByOrder(items: InventoryItem[]) {
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
  }, {} as Record<string, { vendor: string; orderNumber: string; orderDate: string; accountNumber: string; items: InventoryItem[] }>);
}

/**
 * Group inventory items by vendor, then by brand
 * Returns a nested map: vendor -> brand -> items[]
 */
export function groupInventoryByVendorAndBrand(items: InventoryItem[]) {
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
  }, {} as Record<string, Record<string, InventoryItem[]>>);
}

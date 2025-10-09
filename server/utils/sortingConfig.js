/**
 * Sorting Configuration
 * Defines whitelisted columns for sorting on different tables
 * Security: Only columns listed here can be used for sorting
 */

/**
 * Dashboard/Stats sortable columns
 * Based on the inventory and orders tables
 */
const DASHBOARD_SORT_COLUMNS = [
  // Order fields
  'order_number',
  'order_date',
  'customer_name',
  'total_pieces',
  'total_amount',
  'status',
  'shipped_date',
  'delivered_date',
  'created_at',
  'updated_at',

  // Inventory fields (for inventory-by-vendor view)
  'brand',
  'model',
  'quantity',
  'wholesale_price',
  'selling_price',
  'received_date',
  'sold_date'
];

/**
 * Inventory sortable columns
 * Based on the inventory table schema
 */
const INVENTORY_SORT_COLUMNS = [
  'id',
  'sku',
  'brand',
  'model',
  'color',
  'size',
  'quantity',
  'status',
  'wholesale_price',
  'msrp',
  'selling_price',
  'received_date',
  'sold_date',
  'returned_date',
  'created_at',
  'updated_at',
  'vendor_id',
  'order_id'
];

/**
 * Orders sortable columns
 * Based on the orders table schema
 */
const ORDERS_SORT_COLUMNS = [
  'id',
  'order_number',
  'reference_number',
  'customer_name',
  'customer_code',
  'placed_by',
  'order_date',
  'total_pieces',
  'total_amount',
  'status',
  'tracking_number',
  'shipped_date',
  'delivered_date',
  'created_at',
  'updated_at',
  'vendor_id'
];

/**
 * Get allowed sort columns for a specific context
 *
 * @param {string} context - Context name ('dashboard', 'inventory', 'orders')
 * @returns {Array<string>} Array of allowed column names
 */
function getAllowedSortColumns(context) {
  switch (context) {
    case 'dashboard':
      return DASHBOARD_SORT_COLUMNS;
    case 'inventory':
      return INVENTORY_SORT_COLUMNS;
    case 'orders':
      return ORDERS_SORT_COLUMNS;
    default:
      console.warn(`Unknown sorting context: ${context}`);
      return [];
  }
}

module.exports = {
  DASHBOARD_SORT_COLUMNS,
  INVENTORY_SORT_COLUMNS,
  ORDERS_SORT_COLUMNS,
  getAllowedSortColumns
};

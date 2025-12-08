/**
 * INVENTORY UTILITY FUNCTIONS
 *
 * Centralized export for all inventory-related utility functions
 * Extracted from Inventory.tsx for better code organization
 */

// Date formatting utilities
export { formatOrderDate, formatDate } from './dateHelpers';

// Vendor-related utilities
export { extractVendorFromEmail, copyToClipboard, generateForwardingEmail } from './vendorHelpers';

// Grouping utilities for organizing inventory data
export { groupPendingByOrder, groupInventoryByVendorAndBrand } from './groupingHelpers';

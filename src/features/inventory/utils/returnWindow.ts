/**
 * Return Window Utility Functions
 * Calculates return window status and display text for inventory items
 */

export interface ReturnWindowInfo {
  expiresDate: Date;
  status: 'good' | 'warning' | 'critical' | 'expired';
  displayText: string;
  daysRemaining: number;
}

/**
 * Calculate return window information for an inventory item
 * @param orderDate - The date the order was placed (YYYY-MM-DD format)
 * @param returnWindowYears - Number of years for return window (default: 2)
 * @returns ReturnWindowInfo object with status and display text
 */
export function calculateReturnWindow(
  orderDate: string | undefined,
  returnWindowYears: number = 2
): ReturnWindowInfo | null {
  if (!orderDate) {
    return null;
  }

  try {
    const orderDateObj = new Date(orderDate);
    const today = new Date();

    // Calculate expiration date (2 years from order date)
    const expiresDate = new Date(orderDateObj);
    expiresDate.setFullYear(expiresDate.getFullYear() + returnWindowYears);

    // Calculate days remaining
    const msPerDay = 1000 * 60 * 60 * 24;
    const daysRemaining = Math.ceil((expiresDate.getTime() - today.getTime()) / msPerDay);

    // Determine status based on time remaining
    let status: 'good' | 'warning' | 'critical' | 'expired';
    if (daysRemaining < 0) {
      status = 'expired';
    } else if (daysRemaining < 180) { // Less than 6 months
      status = 'critical';
    } else if (daysRemaining < 365) { // Less than 1 year
      status = 'warning';
    } else {
      status = 'good';
    }

    // Generate display text
    const displayText = formatReturnWindowDisplay(daysRemaining);

    return {
      expiresDate,
      status,
      displayText,
      daysRemaining
    };
  } catch (error) {
    console.error('Error calculating return window:', error);
    return null;
  }
}

/**
 * Format the return window display text based on days remaining
 * Auto-smart format that chooses appropriate units
 */
function formatReturnWindowDisplay(daysRemaining: number): string {
  if (daysRemaining < 0) {
    return 'Expired';
  }

  if (daysRemaining < 30) {
    // Less than 1 month: show days
    return `${daysRemaining}d left`;
  }

  if (daysRemaining < 365) {
    // Less than 1 year: show months and weeks
    const months = Math.floor(daysRemaining / 30);
    const remainingDays = daysRemaining % 30;
    const weeks = Math.floor(remainingDays / 7);

    if (weeks > 0) {
      return `${months}m ${weeks}w left`;
    }
    return `${months}m left`;
  }

  // More than 1 year: show years and months
  const years = Math.floor(daysRemaining / 365);
  const remainingDays = daysRemaining % 365;
  const months = Math.floor(remainingDays / 30);

  if (months > 0) {
    return `${years}y ${months}m left`;
  }
  return `${years}y left`;
}

/**
 * Get the color class for the return window status
 */
export function getReturnWindowColorClass(status: 'good' | 'warning' | 'critical' | 'expired'): string {
  switch (status) {
    case 'good':
      return 'text-green-600 bg-green-50';
    case 'warning':
      return 'text-yellow-600 bg-yellow-50';
    case 'critical':
      return 'text-red-600 bg-red-50';
    case 'expired':
      return 'text-gray-600 bg-gray-50';
    default:
      return 'text-gray-600 bg-gray-50';
  }
}

/**
 * Get the emoji indicator for the return window status
 */
export function getReturnWindowEmoji(status: 'good' | 'warning' | 'critical' | 'expired'): string {
  switch (status) {
    case 'good':
      return '🟢';
    case 'warning':
      return '🟡';
    case 'critical':
      return '🔴';
    case 'expired':
      return '❌';
    default:
      return '';
  }
}

/**
 * Format a date to readable string (e.g., "March 24, 2027")
 */
export function formatReturnWindowDate(date: Date): string {
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

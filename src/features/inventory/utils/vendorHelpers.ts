/**
 * VENDOR HELPER UTILITIES
 *
 * Helper functions for vendor-related operations
 * Extracted from Inventory.tsx
 */

/**
 * Extract vendor name from email address
 * @param email - Email address to parse
 * @returns Friendly vendor name
 */
export function extractVendorFromEmail(email: string): string {
  const domain = email.split('@')[1]?.toLowerCase() || '';

  // Known vendors
  if (domain.includes('modernoptical')) return 'Modern Optical';
  if (domain.includes('luxottica')) return 'Luxottica';
  if (domain.includes('safilo')) return 'Safilo';
  if (domain.includes('ideal')) return 'Ideal Optics';
  if (domain.includes('kenmark')) return 'Kenmark';
  if (domain.includes('lamyamerica')) return 'Lamyamerica';
  if (domain.includes('etnia')) return 'Etnia Barcelona';
  if (domain.includes('europa')) return 'Europa';

  // Fallback: capitalize domain name
  return domain
    .replace(/\.(com|net|org|biz)$/, '')
    .split(/[-.]/)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ') || 'Unknown Vendor';
}

/**
 * Copy text to clipboard with fallback for older browsers
 * @param text - Text to copy
 * @returns Promise that resolves when copied
 */
export async function copyToClipboard(text: string): Promise<void> {
  try {
    await navigator.clipboard.writeText(text);
  } catch (err) {
    // Fallback for browsers that don't support clipboard API
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.left = '-999999px';
    document.body.appendChild(textArea);
    textArea.select();
    document.execCommand('copy');
    document.body.removeChild(textArea);
  }
}

/**
 * Generate CloudMailin forwarding email for a user
 * @param userId - User ID
 * @returns Forwarding email address
 */
export function generateForwardingEmail(userId: string): string {
  const cloudmailinAddress = 'a48947dbd077295c13ea';
  return `${cloudmailinAddress}+${userId}@cloudmailin.net`;
}

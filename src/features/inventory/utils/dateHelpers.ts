/**
 * Format order date string to readable format (date only, no time)
 * Handles multiple date formats: MM/DD/YYYY, YYYY-MM-DD, ISO timestamps
 */
export function formatOrderDate(dateString: string | null | undefined): string {
  if (!dateString) return 'N/A';

  // If already formatted with comma, return as is
  if (dateString.includes(',')) return dateString;

  let date: Date;

  // Try different date formats
  if (dateString.includes('/')) {
    // Handle MM/DD/YYYY format
    const [month, day, year] = dateString.split('/');
    if (month && day && year) {
      date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    } else {
      console.error('Invalid MM/DD/YYYY format:', dateString);
      return 'Invalid Date';
    }
  } else if (dateString.match(/^\d{4}-\d{2}-\d{2}$/)) {
    // Handle YYYY-MM-DD format (date only, no time)
    // Parse as local date to avoid timezone issues
    const [year, month, day] = dateString.split('-');
    date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
  } else {
    // Handle ISO timestamp or other formats
    date = new Date(dateString);
  }

  // Verify parsing succeeded
  if (isNaN(date.getTime())) {
    console.error('Failed to parse date:', dateString);
    return 'Invalid Date';
  }

  // Format: "Jan 15, 2024"
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
}

/**
 * Format date with time included
 * Used for email received timestamps
 */
export function formatDate(dateString: string | null | undefined): string {
  if (!dateString) return 'N/A';

  try {
    // Handle various date formats
    let date: Date;

    // Check if it's already a valid ISO date string
    if (dateString.includes('T') || dateString.includes('Z')) {
      date = new Date(dateString);
    }
    // Handle formats like "9/5/2025" or "09/08/2025"
    else if (dateString.includes('/')) {
      const [month, day, year] = dateString.split('/').map(Number);
      date = new Date(year, month - 1, day);
    }
    // Handle formats like "2025-09-05"
    else if (dateString.includes('-')) {
      date = new Date(dateString);
    }
    // Fallback: try parsing directly
    else {
      date = new Date(dateString);
    }

    // Check if date is valid
    if (isNaN(date.getTime())) {
      console.warn('Invalid date:', dateString);
      return dateString; // Return original string if can't parse
    }

    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch (error) {
    console.error('Date formatting error:', error);
    return dateString; // Return original on error
  }
}

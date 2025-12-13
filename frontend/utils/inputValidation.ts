/**
 * Input validation utilities for the Profit Calculator
 *
 * These utilities provide consistent validation across all numeric inputs,
 * preventing invalid values and ensuring data quality.
 */

/**
 * Validate and format decimal input for currency fields
 *
 * @param value - The input value to validate (string or number)
 * @param min - Minimum allowed value (default: 0)
 * @param max - Maximum allowed value (default: 10000)
 * @returns Validated number or null if invalid
 */
export const validateCurrencyInput = (
  value: string | number,
  min: number = 0,
  max: number = 10000
): number | null => {
  // Handle empty string - return null to allow empty field during editing
  // The onBlur handler should set to min value when field loses focus
  if (value === '' || value === null || value === undefined) {
    return null;
  }

  // For string values starting with "0" followed by digits (like "07"),
  // strip leading zeros to handle the case where user types after clearing to 0
  let processedValue = value;
  if (typeof value === 'string' && /^0[0-9]/.test(value)) {
    processedValue = value.replace(/^0+/, '') || '0';
  }

  const num = typeof processedValue === 'string' ? parseFloat(processedValue) : processedValue;

  // Return null if not a valid number (e.g., "abc")
  if (isNaN(num)) return null;

  // Clamp to minimum (but allow values being typed - min is enforced on blur)
  if (num < min) return num; // Allow typing small numbers, enforce min on blur

  // Clamp to maximum
  if (num > max) return max;

  return num;
};

/**
 * Validate percentage input (0-100)
 *
 * @param value - The input value to validate
 * @returns Validated number between 0-100 or null if invalid
 */
export const validatePercentageInput = (
  value: string | number
): number | null => {
  // Handle empty string - return 0 (minimum for percentage)
  if (value === '' || value === null || value === undefined) {
    return 0;
  }

  // Strip leading zeros (like "07" -> "7")
  let processedValue = value;
  if (typeof value === 'string' && /^0[0-9]/.test(value)) {
    processedValue = value.replace(/^0+/, '') || '0';
  }

  const num = typeof processedValue === 'string' ? parseFloat(processedValue) : processedValue;

  if (isNaN(num)) return null;

  // Clamp between 0-100
  return Math.min(100, Math.max(0, num));
};

/**
 * Format number to fixed decimal places
 *
 * @param value - The number to format
 * @param decimals - Number of decimal places (default: 2)
 * @returns Formatted number with specified decimal places
 */
export const formatToDecimals = (
  value: number,
  decimals: number = 2
): number => {
  return parseFloat(value.toFixed(decimals));
};

/**
 * Ensure value is non-negative
 *
 * @param value - The number to check
 * @returns The value or 0 if negative
 */
export const ensureNonNegative = (value: number): number => {
  return Math.max(0, value);
};

/**
 * Get validation warning message if value is problematic
 *
 * @param fieldName - Name of the field being validated
 * @param value - Current value of the field
 * @param min - Minimum recommended value
 * @param max - Maximum recommended value
 * @returns Warning message or null if value is acceptable
 */
export const getValidationWarning = (
  fieldName: string,
  value: number,
  min?: number,
  max?: number
): string | null => {
  if (min !== undefined && value < min) {
    return `${fieldName} should be at least $${min.toFixed(2)}`;
  }
  if (max !== undefined && value > max) {
    return `${fieldName} exceeds recommended maximum of $${max.toFixed(2)}`;
  }
  if (value === 0 && fieldName.toLowerCase().includes('cost')) {
    return `Warning: ${fieldName} is $0.00 - this may not be realistic`;
  }
  return null;
};

/**
 * Validate that a number is within a reasonable range
 *
 * @param value - The value to check
 * @param min - Minimum value
 * @param max - Maximum value
 * @returns True if within range
 */
export const isWithinRange = (
  value: number,
  min: number,
  max: number
): boolean => {
  return value >= min && value <= max;
};

/**
 * Parse and validate numeric input, handling empty strings
 *
 * @param value - The input value
 * @param defaultValue - Default value if input is empty (default: 0)
 * @returns Parsed number or default value
 */
export const parseNumericInput = (
  value: string,
  defaultValue: number = 0
): number => {
  if (value === '' || value === null || value === undefined) {
    return defaultValue;
  }

  const parsed = parseFloat(value);
  return isNaN(parsed) ? defaultValue : parsed;
};

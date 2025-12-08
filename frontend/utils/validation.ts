import { PasswordStrength } from '../types/user';

/**
 * Validate email address format
 */
export function validateEmail(email: string): { isValid: boolean; error?: string } {
  if (!email) {
    return { isValid: false, error: 'Email is required' };
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return { isValid: false, error: 'Please enter a valid email address' };
  }

  return { isValid: true };
}

/**
 * Validate password strength and return score with feedback
 */
export function validatePasswordStrength(password: string): PasswordStrength {
  if (!password) {
    return {
      score: 0,
      feedback: 'Password is required',
      color: 'red',
    };
  }

  let score = 0;
  const feedback: string[] = [];

  // Length check
  if (password.length >= 8) {
    score++;
  } else {
    feedback.push('At least 8 characters');
  }

  // Uppercase check
  if (/[A-Z]/.test(password)) {
    score++;
  } else {
    feedback.push('One uppercase letter');
  }

  // Lowercase check
  if (/[a-z]/.test(password)) {
    score++;
  } else {
    feedback.push('One lowercase letter');
  }

  // Number check
  if (/[0-9]/.test(password)) {
    score++;
  } else {
    feedback.push('One number');
  }

  // Special character check
  if (/[^A-Za-z0-9]/.test(password)) {
    score++;
  } else {
    feedback.push('One special character');
  }

  // Determine color based on score
  let color: 'red' | 'yellow' | 'green';
  let strengthText: string;

  if (score <= 2) {
    color = 'red';
    strengthText = 'Weak password';
  } else if (score <= 3) {
    color = 'yellow';
    strengthText = 'Medium password';
  } else {
    color = 'green';
    strengthText = 'Strong password';
  }

  const feedbackText = feedback.length > 0
    ? `${strengthText}. Add: ${feedback.join(', ')}`
    : strengthText;

  return {
    score,
    feedback: feedbackText,
    color,
  };
}

/**
 * Validate phone number format (US format)
 */
export function validatePhone(phone: string): { isValid: boolean; error?: string } {
  if (!phone) {
    return { isValid: true }; // Phone is optional
  }

  // Remove formatting characters
  const cleanPhone = phone.replace(/[\s\-\(\)\.]/g, '');

  // Check if it's a valid US phone number (10 or 11 digits)
  const phoneRegex = /^1?\d{10}$/;
  if (!phoneRegex.test(cleanPhone)) {
    return {
      isValid: false,
      error: 'Please enter a valid phone number (10 digits)'
    };
  }

  return { isValid: true };
}

/**
 * Validate required field
 */
export function validateRequired(value: string, fieldName: string): { isValid: boolean; error?: string } {
  if (!value || value.trim().length === 0) {
    return { isValid: false, error: `${fieldName} is required` };
  }
  return { isValid: true };
}

/**
 * Validate zip code format (US format)
 */
export function validateZipCode(zipCode: string): { isValid: boolean; error?: string } {
  if (!zipCode) {
    return { isValid: true }; // Zip code is optional
  }

  // US zip code: 5 digits or 5+4 format
  const zipRegex = /^\d{5}(-\d{4})?$/;
  if (!zipRegex.test(zipCode)) {
    return {
      isValid: false,
      error: 'Please enter a valid zip code (e.g., 12345 or 12345-6789)'
    };
  }

  return { isValid: true };
}

/**
 * Validate passwords match
 */
export function validatePasswordsMatch(
  password: string,
  confirmPassword: string
): { isValid: boolean; error?: string } {
  if (password !== confirmPassword) {
    return { isValid: false, error: 'Passwords do not match' };
  }
  return { isValid: true };
}

/**
 * Format phone number for display
 */
export function formatPhoneNumber(phone: string): string {
  const cleaned = phone.replace(/\D/g, '');

  if (cleaned.length === 10) {
    return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
  } else if (cleaned.length === 11 && cleaned[0] === '1') {
    return `+1 (${cleaned.slice(1, 4)}) ${cleaned.slice(4, 7)}-${cleaned.slice(7)}`;
  }

  return phone;
}

/**
 * Validate US state code
 */
export function validateStateCode(state: string): { isValid: boolean; error?: string } {
  if (!state) {
    return { isValid: true }; // State is optional
  }

  const validStates = [
    'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA',
    'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
    'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
    'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC',
    'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY'
  ];

  if (!validStates.includes(state.toUpperCase())) {
    return {
      isValid: false,
      error: 'Please enter a valid US state code (e.g., CA, NY, TX)'
    };
  }

  return { isValid: true };
}

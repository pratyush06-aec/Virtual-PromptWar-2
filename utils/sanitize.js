/**
 * @module sanitize
 * @description Input sanitization and validation utilities for application security.
 * Prevents XSS attacks, validates user inputs, and provides safe data handling.
 */

/**
 * Sanitizes HTML input by escaping special characters to prevent XSS.
 * @param {string} input - Raw user input string
 * @returns {string} Sanitized string safe for DOM insertion
 */
export function sanitizeHTML(input) {
  if (typeof input !== 'string') return '';
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#x27;',
    '/': '&#x2F;',
  };
  return input.replace(/[&<>"'/]/g, (char) => map[char]);
}

/**
 * Validates email format using RFC 5322 simplified regex.
 * @param {string} email - Email address to validate
 * @returns {boolean} True if the email format is valid
 */
export function validateEmail(email) {
  if (typeof email !== 'string') return false;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.trim());
}

/**
 * Validates that a string length falls within specified bounds.
 * @param {string} str - String to validate
 * @param {number} min - Minimum allowed length (inclusive)
 * @param {number} max - Maximum allowed length (inclusive)
 * @returns {boolean} True if string length is within bounds
 */
export function validateLength(str, min, max) {
  if (typeof str !== 'string') return false;
  const len = str.trim().length;
  return len >= min && len <= max;
}

/**
 * Validates age input for voter eligibility.
 * @param {number|string} age - Age value to validate
 * @returns {boolean} True if age is a valid voter age (18-120)
 */
export function validateAge(age) {
  const num = Number(age);
  return Number.isInteger(num) && num >= 18 && num <= 120;
}

/**
 * Validates password strength.
 * @param {string} password - Password to validate
 * @returns {{valid: boolean, message: string}} Validation result with message
 */
export function validatePassword(password) {
  if (typeof password !== 'string') {
    return { valid: false, message: 'Password must be a string.' };
  }
  if (password.length < 6) {
    return { valid: false, message: 'Password must be at least 6 characters.' };
  }
  if (password.length > 128) {
    return { valid: false, message: 'Password must not exceed 128 characters.' };
  }
  return { valid: true, message: 'Password is valid.' };
}

/**
 * Sanitizes all string values in an object recursively.
 * @param {Object} obj - Object with string values to sanitize
 * @returns {Object} New object with all string values sanitized
 */
export function sanitizeObject(obj) {
  if (typeof obj !== 'object' || obj === null) return obj;
  const sanitized = {};
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'string') {
      sanitized[key] = sanitizeHTML(value);
    } else if (typeof value === 'object' && value !== null) {
      sanitized[key] = sanitizeObject(value);
    } else {
      sanitized[key] = value;
    }
  }
  return sanitized;
}

/**
 * Creates a debounced version of a function that delays invocation.
 * @param {Function} fn - Function to debounce
 * @param {number} delay - Delay in milliseconds
 * @returns {Function} Debounced function
 */
export function debounce(fn, delay) {
  let timeoutId = null;
  return function debounced(...args) {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn.apply(this, args), delay);
  };
}

/**
 * Validates location input format (city name or PIN code).
 * @param {string} location - Location string to validate
 * @returns {boolean} True if the location format is valid
 */
export function validateLocation(location) {
  if (typeof location !== 'string') return false;
  const trimmed = location.trim();
  if (trimmed.length < 2 || trimmed.length > 100) return false;
  // Allow alphanumeric, spaces, slashes, hyphens
  return /^[a-zA-Z0-9\s/\-,]+$/.test(trimmed);
}

/**
 * Truncates a string to a maximum length with ellipsis.
 * @param {string} str - String to truncate
 * @param {number} maxLen - Maximum length before truncation
 * @returns {string} Truncated string
 */
export function truncate(str, maxLen) {
  if (typeof str !== 'string') return '';
  return str.length > maxLen ? str.slice(0, maxLen - 3) + '...' : str;
}

/**
 * Generates a unique ID for DOM elements.
 * @param {string} prefix - Prefix for the ID
 * @returns {string} Unique ID string
 */
export function generateId(prefix = 'bb') {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

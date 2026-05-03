import { expect, test, describe, beforeEach } from 'vitest';
import { sanitizeHTML, validateEmail, validateAge, validatePassword } from '../utils/sanitize.js';

describe('Sanitization & Security Utils', () => {
  describe('sanitizeHTML', () => {
    test('escapes basic HTML tags', () => {
      const input = '<script>alert("xss")</script>';
      const expected = '&lt;script&gt;alert(&quot;xss&quot;)&lt;&#x2F;script&gt;';
      expect(sanitizeHTML(input)).toBe(expected);
    });

    test('handles non-string inputs safely', () => {
      expect(sanitizeHTML(null)).toBe('');
      expect(sanitizeHTML(undefined)).toBe('');
      expect(sanitizeHTML(123)).toBe('');
    });
    
    test('handles normal strings without modification', () => {
      const input = 'Hello World 123';
      expect(sanitizeHTML(input)).toBe(input);
    });
  });

  describe('validateEmail', () => {
    test('accepts valid emails', () => {
      expect(validateEmail('test@example.com')).toBe(true);
      expect(validateEmail('user.name+tag@domain.co.in')).toBe(true);
    });

    test('rejects invalid emails', () => {
      expect(validateEmail('invalid-email')).toBe(false);
      expect(validateEmail('user@')).toBe(false);
      expect(validateEmail('@domain.com')).toBe(false);
      expect(validateEmail(null)).toBe(false);
    });
  });

  describe('validateAge', () => {
    test('accepts valid voting ages', () => {
      expect(validateAge(18)).toBe(true);
      expect(validateAge('25')).toBe(true);
      expect(validateAge(120)).toBe(true);
    });

    test('rejects invalid voting ages', () => {
      expect(validateAge(17)).toBe(false);
      expect(validateAge(0)).toBe(false);
      expect(validateAge(121)).toBe(false);
      expect(validateAge('not_a_number')).toBe(false);
    });
  });
  
  describe('validatePassword', () => {
    test('accepts valid passwords', () => {
      expect(validatePassword('strongPass123').valid).toBe(true);
    });
    
    test('rejects short passwords', () => {
      const result = validatePassword('short');
      expect(result.valid).toBe(false);
      expect(result.message).toContain('at least 6');
    });
  });
});

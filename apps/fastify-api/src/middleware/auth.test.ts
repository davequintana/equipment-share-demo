import { describe, it, expect } from 'vitest';
import { validateEmail, validatePassword } from './auth';

describe('Auth Validation', () => {
  describe('validateEmail', () => {
    it('should validate correct email addresses', () => {
      const validEmails = [
        'test@example.com',
        'user.name@domain.co.uk',
        'user+tag@example.org',
        'test123@sub.domain.com',
        'a@b.co',
      ];

      validEmails.forEach(email => {
        expect(validateEmail(email), `${email} should be valid`).toBe(true);
      });
    });

    it('should reject invalid email addresses', () => {
      const invalidEmails = [
        'invalid-email',
        '@domain.com',
        'user@',
        'user@domain',
        'user..double.dot@domain.com',
        'user@domain..com',
        '',
        ' ',
        'user@domain.com ',
        ' user@domain.com',
      ];

      invalidEmails.forEach(email => {
        expect(validateEmail(email), `${email} should be invalid`).toBe(false);
      });
    });

    it('should reject emails that are too long (> 254 characters)', () => {
      const longEmail = 'a'.repeat(250) + '@example.com';
      expect(validateEmail(longEmail)).toBe(false);
    });

    it('should handle potential ReDoS attack patterns safely', () => {
      // Test patterns that could cause catastrophic backtracking
      const maliciousPatterns = [
        '!@!.' + '!.'.repeat(100),
        'a@' + 'b'.repeat(1000) + '.com',
        'user@' + 'sub.'.repeat(100) + 'domain.com',
      ];

      const startTime = Date.now();
      
      maliciousPatterns.forEach(pattern => {
        validateEmail(pattern);
      });
      
      const endTime = Date.now();
      const executionTime = endTime - startTime;
      
      // Should complete quickly (under 100ms) even with malicious patterns
      expect(executionTime).toBeLessThan(100);
    });

    it('should handle edge cases', () => {
      expect(validateEmail('a@b.c')).toBe(true);
      expect(validateEmail('test@localhost')).toBe(false); // No TLD
      expect(validateEmail('test@127.0.0.1')).toBe(false); // IP not supported by this regex
    });
  });

  describe('validatePassword', () => {
    it('should validate strong passwords', () => {
      const strongPasswords = [
        'StrongP@ssw0rd!',
        'MySecure123!',
        'Complex$Pass1',
      ];

      strongPasswords.forEach(password => {
        const result = validatePassword(password);
        expect(result.valid, `${password} should be valid`).toBe(true);
        expect(result.errors).toHaveLength(0);
      });
    });

    it('should reject weak passwords', () => {
      const weakPasswords = [
        'short',
        'nouppercase123!',
        'NOLOWERCASE123!',
        'NoNumbers!',
        'NoSpecialChars123',
      ];

      weakPasswords.forEach(password => {
        const result = validatePassword(password);
        expect(result.valid, `${password} should be invalid`).toBe(false);
        expect(result.errors.length, `${password} should have error messages`).toBeGreaterThan(0);
      });
    });
  });
});

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { FastifyRequest, FastifyReply } from 'fastify';
import { JwtPayload } from '../types.js';
import {
  validateEmail,
  validatePassword,
  validateName,
  checkRateLimit,
  resetRateLimit,
  authenticateUser
} from './auth';

// Extended FastifyRequest interface for JWT
interface FastifyRequestWithJWT extends FastifyRequest {
  jwtVerify(): Promise<void>;
  user?: JwtPayload | null;
}

// Mock Fastify request and reply objects
const createMockRequest = (overrides = {}): FastifyRequestWithJWT => ({
  jwtVerify: vi.fn(),
  user: undefined,
  ...overrides,
} as unknown as FastifyRequestWithJWT);

const createMockReply = (): FastifyReply => {
  const reply = {
    code: vi.fn().mockReturnThis(),
    send: vi.fn().mockReturnThis(),
  };
  return reply as unknown as FastifyReply;
};

describe('Auth Middleware', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('authenticateUser', () => {
    it('should successfully authenticate valid user', async () => {
      const mockRequest = createMockRequest({
        jwtVerify: vi.fn().mockResolvedValue(undefined),
        user: { id: 'user123', email: 'test@example.com' }
      });
      const mockReply = createMockReply();

      const result = await authenticateUser(mockRequest, mockReply);

      expect(result).toBe(true);
      expect(mockRequest.jwtVerify).toHaveBeenCalledOnce();
      expect(mockReply.code).not.toHaveBeenCalled();
      expect(mockReply.send).not.toHaveBeenCalled();
    });

    it('should reject user with invalid token payload - missing id', async () => {
      const mockRequest = createMockRequest({
        jwtVerify: vi.fn().mockResolvedValue(undefined),
        user: { email: 'test@example.com' } // missing id
      });
      const mockReply = createMockReply();

      await authenticateUser(mockRequest, mockReply);

      expect(mockReply.code).toHaveBeenCalledWith(401);
      expect(mockReply.send).toHaveBeenCalledWith({
        error: 'Invalid token payload',
        code: 'INVALID_TOKEN'
      });
    });

    it('should reject user with invalid token payload - missing email', async () => {
      const mockRequest = createMockRequest({
        jwtVerify: vi.fn().mockResolvedValue(undefined),
        user: { id: 'user123' } // missing email
      });
      const mockReply = createMockReply();

      await authenticateUser(mockRequest, mockReply);

      expect(mockReply.code).toHaveBeenCalledWith(401);
      expect(mockReply.send).toHaveBeenCalledWith({
        error: 'Invalid token payload',
        code: 'INVALID_TOKEN'
      });
    });

    it('should reject user with no user object', async () => {
      const mockRequest = createMockRequest({
        jwtVerify: vi.fn().mockResolvedValue(undefined),
        user: null
      });
      const mockReply = createMockReply();

      await authenticateUser(mockRequest, mockReply);

      expect(mockReply.code).toHaveBeenCalledWith(401);
      expect(mockReply.send).toHaveBeenCalledWith({
        error: 'Invalid token payload',
        code: 'INVALID_TOKEN'
      });
    });

    it('should handle expired token error', async () => {
      const mockRequest = createMockRequest({
        jwtVerify: vi.fn().mockRejectedValue(new Error('jwt expired'))
      });
      const mockReply = createMockReply();

      await authenticateUser(mockRequest, mockReply);

      expect(mockReply.code).toHaveBeenCalledWith(401);
      expect(mockReply.send).toHaveBeenCalledWith({
        error: 'Token expired',
        code: 'TOKEN_EXPIRED'
      });
    });

    it('should handle missing token error', async () => {
      const mockRequest = createMockRequest({
        jwtVerify: vi.fn().mockRejectedValue(new Error('jwt must be provided'))
      });
      const mockReply = createMockReply();

      await authenticateUser(mockRequest, mockReply);

      expect(mockReply.code).toHaveBeenCalledWith(401);
      expect(mockReply.send).toHaveBeenCalledWith({
        error: 'Authorization token required',
        code: 'TOKEN_REQUIRED'
      });
    });

    it('should handle generic authentication errors', async () => {
      const mockRequest = createMockRequest({
        jwtVerify: vi.fn().mockRejectedValue(new Error('invalid signature'))
      });
      const mockReply = createMockReply();

      await authenticateUser(mockRequest, mockReply);

      expect(mockReply.code).toHaveBeenCalledWith(401);
      expect(mockReply.send).toHaveBeenCalledWith({
        error: 'Unauthorized',
        code: 'UNAUTHORIZED'
      });
    });

    it('should handle non-Error exceptions', async () => {
      const mockRequest = createMockRequest({
        jwtVerify: vi.fn().mockRejectedValue('string error')
      });
      const mockReply = createMockReply();

      await authenticateUser(mockRequest, mockReply);

      expect(mockReply.code).toHaveBeenCalledWith(401);
      expect(mockReply.send).toHaveBeenCalledWith({
        error: 'Unauthorized',
        code: 'UNAUTHORIZED'
      });
    });
  });

  describe('validateEmail', () => {
    it('should validate correct email addresses', () => {
      const validEmails = [
        'test@example.com',
        'user.name@domain.co.uk',
        'user+tag@example.org',
        'test123@sub.domain.com',
        'a@b.co',
        'user.email+tag+sorting@example.com',
        'test.email.with+symbol@example.co.uk',
        'firstname-lastname@domain.com',
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
        'user@',
        '@example.com',
        'user@@example.com',
        'user@.example.com',
        'user@example.',
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
        '@'.repeat(1000),
        '.'.repeat(1000) + '@example.com',
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
        'Abcdef1',
        'Password123',
        'MyP@ss1',
      ];

      strongPasswords.forEach(password => {
        const result = validatePassword(password);
        expect(result.valid, `${password} should be valid`).toBe(true);
        expect(result.errors).toHaveLength(0);
      });
    });

    it('should reject passwords that are too short', () => {
      const shortPasswords = ['Ab1', 'Pass1', '12345'];

      shortPasswords.forEach(password => {
        const result = validatePassword(password);
        expect(result.valid, `${password} should be invalid (too short)`).toBe(false);
        expect(result.errors).toContain('Password must be at least 6 characters long');
      });
    });

    it('should reject passwords without lowercase letters', () => {
      const result = validatePassword('PASSWORD123');
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Password must contain at least one lowercase letter');
    });

    it('should reject passwords without uppercase letters', () => {
      const result = validatePassword('password123');
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Password must contain at least one uppercase letter');
    });

    it('should reject passwords without numbers', () => {
      const result = validatePassword('Password');
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Password must contain at least one number');
    });

    it('should accumulate multiple errors', () => {
      const result = validatePassword('pass'); // short, no uppercase, no numbers
      expect(result.valid).toBe(false);
      expect(result.errors).toHaveLength(3);
      expect(result.errors).toContain('Password must be at least 6 characters long');
      expect(result.errors).toContain('Password must contain at least one uppercase letter');
      expect(result.errors).toContain('Password must contain at least one number');
    });

    it('should handle empty password', () => {
      const result = validatePassword('');
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });

  describe('validateName', () => {
    it('should validate correct names', () => {
      const validNames = [
        'John',
        'Mary Jane',
        'Jean-Claude',
        'José María',
        'O\'Connor',
        '李明',
        'Mohammed Al-Rashid',
        'A'.repeat(50), // max length
      ];

      validNames.forEach(name => {
        expect(validateName(name), `${name} should be valid`).toBe(true);
      });
    });

    it('should reject invalid names', () => {
      const invalidNames = [
        '',           // empty
        ' ',          // only whitespace
        '  ',         // multiple whitespace
        'A',          // too short
        'A'.repeat(51), // too long
        '   John   ', // should fail because of leading/trailing spaces
      ];

      invalidNames.forEach(name => {
        expect(validateName(name), `"${name}" should be invalid`).toBe(false);
      });
    });

    it('should handle names with exact length boundaries', () => {
      expect(validateName('Jo')).toBe(true);  // min length (2)
      expect(validateName('J')).toBe(false);   // below min length
      expect(validateName('A'.repeat(50))).toBe(true);  // max length (50)
      expect(validateName('A'.repeat(51))).toBe(false); // above max length
    });
  });

  describe('checkRateLimit and resetRateLimit', () => {
    beforeEach(() => {
      // Reset any existing rate limit data
      resetRateLimit('test-ip');
      resetRateLimit('192.168.1.1');
    });

    afterEach(() => {
      // Clean up after each test
      resetRateLimit('test-ip');
      resetRateLimit('192.168.1.1');
    });

    it('should allow first attempt', () => {
      expect(checkRateLimit('test-ip')).toBe(true);
    });

    it('should allow up to 5 attempts', () => {
      for (let i = 1; i <= 5; i++) {
        expect(checkRateLimit('test-ip'), `Attempt ${i} should be allowed`).toBe(true);
      }
    });

    it('should block 6th attempt within time window', () => {
      // Make 5 attempts
      for (let i = 1; i <= 5; i++) {
        checkRateLimit('test-ip');
      }

      // 6th attempt should be blocked
      expect(checkRateLimit('test-ip')).toBe(false);
    });

    it('should handle different IPs independently', () => {
      // Make 5 attempts for first IP
      for (let i = 1; i <= 5; i++) {
        checkRateLimit('192.168.1.1');
      }

      // Second IP should still be allowed
      expect(checkRateLimit('192.168.1.2')).toBe(true);
    });

    it('should reset rate limit for specific IP', () => {
      // Make 5 attempts
      for (let i = 1; i <= 5; i++) {
        checkRateLimit('test-ip');
      }

      // Should be blocked
      expect(checkRateLimit('test-ip')).toBe(false);

      // Reset and try again
      resetRateLimit('test-ip');
      expect(checkRateLimit('test-ip')).toBe(true);
    });

    it('should reset after 15 minutes', () => {
      // Mock Date.now to control time
      const originalNow = Date.now;
      let mockTime = 1000000000; // arbitrary start time

      vi.spyOn(Date, 'now').mockImplementation(() => mockTime);

      // Make 5 attempts
      for (let i = 1; i <= 5; i++) {
        checkRateLimit('test-ip');
      }

      // Should be blocked
      expect(checkRateLimit('test-ip')).toBe(false);

      // Fast forward 15 minutes + 1 second
      mockTime += (15 * 60 * 1000) + 1000;

      // Should be allowed again
      expect(checkRateLimit('test-ip')).toBe(true);

      // Restore original Date.now
      Date.now = originalNow;
    });

    it('should not reset before 15 minutes', () => {
      const originalNow = Date.now;
      let mockTime = 1000000000;

      vi.spyOn(Date, 'now').mockImplementation(() => mockTime);

      // Make 5 attempts
      for (let i = 1; i <= 5; i++) {
        checkRateLimit('test-ip');
      }

      // Should be blocked
      expect(checkRateLimit('test-ip')).toBe(false);

      // Fast forward 14 minutes (not enough)
      mockTime += 14 * 60 * 1000;

      // Should still be blocked
      expect(checkRateLimit('test-ip')).toBe(false);

      Date.now = originalNow;
    });

    it('should handle concurrent rate limit checks correctly', () => {
      const ip = 'concurrent-test-ip';

      // Simulate concurrent requests
      const results: boolean[] = [];
      for (let i = 0; i < 10; i++) {
        results.push(checkRateLimit(ip));
      }

      // Should allow first 5, block the rest
      const allowedCount = results.filter(result => result === true).length;
      const blockedCount = results.filter(result => result === false).length;

      expect(allowedCount).toBe(5);
      expect(blockedCount).toBe(5);
    });

    it('should maintain separate counters for different IPs', () => {
      const ip1 = 'ip1';
      const ip2 = 'ip2';

      // Max out ip1
      for (let i = 0; i < 5; i++) {
        checkRateLimit(ip1);
      }
      expect(checkRateLimit(ip1)).toBe(false);

      // ip2 should still work independently
      expect(checkRateLimit(ip2)).toBe(true);
      expect(checkRateLimit(ip2)).toBe(true);
    });
  });

  // Additional edge case tests
  describe('Edge Cases and Error Handling', () => {
    describe('validateEmail edge cases', () => {
      it('should handle special characters correctly', () => {
        const specialCases = [
          'user+tag@example.com',
          'user.name@example.com',
          'user_name@example.com',
          'user-name@example.com',
          'user123@example.com',
          'a.b.c@example.com',
        ];

        specialCases.forEach(email => {
          expect(validateEmail(email), `${email} should be valid`).toBe(true);
        });
      });

      it('should reject emails with invalid special characters', () => {
        const invalidCases = [
          'user@exam..ple.com',
          'user@@example.com',
          '.user@example.com',
          'user.@example.com',
          'user@.example.com',
          'user@example..com',
        ];

        invalidCases.forEach(email => {
          expect(validateEmail(email), `${email} should be invalid`).toBe(false);
        });
      });
    });

    describe('validatePassword edge cases', () => {
      it('should handle minimum requirements exactly', () => {
        expect(validatePassword('Aa1bcd')).toEqual({
          valid: true,
          errors: []
        });
      });

      it('should handle password with all types of characters', () => {
        expect(validatePassword('MyPass123!@#')).toEqual({
          valid: true,
          errors: []
        });
      });

      it('should provide specific error messages for each missing requirement', () => {
        const result = validatePassword('abc'); // short, no uppercase, no numbers
        expect(result.valid).toBe(false);
        expect(result.errors).toContain('Password must be at least 6 characters long');
        expect(result.errors).toContain('Password must contain at least one uppercase letter');
        expect(result.errors).toContain('Password must contain at least one number');
      });
    });

    describe('validateName edge cases', () => {
      it('should handle names with various unicode characters', () => {
        const unicodeNames = [
          'José',
          'François',
          'Müller',
          '李明',
          'Наталья',
          'محمد',
        ];

        unicodeNames.forEach(name => {
          expect(validateName(name), `${name} should be valid`).toBe(true);
        });
      });

      it('should handle names with hyphens and apostrophes', () => {
        const names = [
          'Mary-Jane',
          "O'Connor",
          'Jean-Claude',
          "D'Angelo",
        ];

        names.forEach(name => {
          expect(validateName(name), `${name} should be valid`).toBe(true);
        });
      });

      it('should reject names with only whitespace variations', () => {
        const invalidNames = [
          '  ',
          '\t',
          '\n',
          '   \t\n  ',
        ];

        invalidNames.forEach(name => {
          expect(validateName(name), `"${name}" should be invalid`).toBe(false);
        });
      });
    });

    describe('authenticateUser edge cases', () => {
      it('should handle user object with extra properties', async () => {
        const mockRequest = createMockRequest({
          jwtVerify: vi.fn().mockResolvedValue(undefined),
          user: {
            id: 'user123',
            email: 'test@example.com',
            extraProp: 'should not interfere',
            iat: 1234567890,
            exp: 1234567890
          }
        });
        const mockReply = createMockReply();

        const result = await authenticateUser(mockRequest, mockReply);

        expect(result).toBe(true);
        expect(mockReply.code).not.toHaveBeenCalled();
      });

      it('should handle empty string in user properties', async () => {
        const mockRequest = createMockRequest({
          jwtVerify: vi.fn().mockResolvedValue(undefined),
          user: { id: '', email: 'test@example.com' } // empty id
        });
        const mockReply = createMockReply();

        await authenticateUser(mockRequest, mockReply);

        expect(mockReply.code).toHaveBeenCalledWith(401);
        expect(mockReply.send).toHaveBeenCalledWith({
          error: 'Invalid token payload',
          code: 'INVALID_TOKEN'
        });
      });
    });
  });
});

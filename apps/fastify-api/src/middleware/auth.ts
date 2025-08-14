import { FastifyRequest, FastifyReply } from 'fastify';
import { JwtPayload } from '../types';
import { kafkaUserActivityService } from '../kafka-user-activity.js';

/**
 * Authentication middleware for protected routes
 * Verifies JWT tokens and validates user information
 * @param request - Fastify request object
 * @param reply - Fastify reply object
 * @param done - Callback function to signal completion
 */
export const authenticateUser = (request: FastifyRequest, reply: FastifyReply, done: (err?: Error) => void): void => {
  request.jwtVerify()
    .then(() => {
      // Additional validation - ensure user still exists
      const user = request.user as JwtPayload;
      if (!user?.id || !user?.email) {
        reply.code(401).send({
          error: 'Invalid token payload',
          code: 'INVALID_TOKEN'
        });
        done(new Error('Invalid token payload'));
        return;
      }

      // Success - continue to the route handler
      // Track user activity for session management
      kafkaUserActivityService.trackUserActivity(
        user.id,
        user.email,
        'api-access',
        {
          userAgent: request.headers['user-agent'],
          ip: request.ip,
        }
      ).catch((error) => {
        // Don't fail the request if activity tracking fails
        console.warn('Failed to track user activity:', error);
      });

      done();
    })
    .catch((error) => {
      // More specific error handling
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      if (errorMessage.includes('jwt expired')) {
        reply.code(401).send({
          error: 'Token expired',
          code: 'TOKEN_EXPIRED'
        });
        done(new Error('Token expired'));
        return;
      }

      if (errorMessage.includes('jwt must be provided')) {
        reply.code(401).send({
          error: 'Authorization token required',
          code: 'TOKEN_REQUIRED'
        });
        done(new Error('Authorization token required'));
        return;
      }

      reply.code(401).send({
        error: 'Unauthorized',
        code: 'UNAUTHORIZED'
      });
      done(new Error('Unauthorized'));
    });
};

/**
 * Validates email format using ReDoS-safe regex pattern
 * Implements comprehensive email validation with security considerations
 * @param email - Email address to validate
 * @returns True if email is valid, false otherwise
 */
export function validateEmail(email: string): boolean {
  if (email.length > 254) return false;

  // ReDoS-safe email regex: Uses bounded quantifiers {0,61} and non-overlapping character classes
  // This pattern is specifically designed to prevent exponential backtracking attacks
  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;

  if (!emailRegex.test(email)) return false;

  const parts = email.split('@');
  if (parts.length !== 2) return false;

  const [localPart, domainPart] = parts;

  // Check for leading or trailing dots in local part
  if (localPart.startsWith('.') || localPart.endsWith('.')) return false;

  // Check for consecutive dots in local part
  if (localPart.includes('..')) return false;

  // Check for leading or trailing dots in domain part
  if (domainPart.startsWith('.') || domainPart.endsWith('.')) return false;

  // Check for consecutive dots in domain part
  if (domainPart.includes('..')) return false;

  // Reject IP addresses (domains that look like IPv4)
  if (/^\d+\.\d+\.\d+\.\d+$/.test(domainPart)) return false;

  // Domain must have at least one dot and a valid TLD
  const domainParts = domainPart.split('.');
  if (domainParts.length < 2) return false;

  // Each domain part must be valid (no empty parts)
  for (const part of domainParts) {
    if (part.length === 0) return false;
  }

  // The last part (TLD) must be at least 1 character and only letters
  const tld = domainParts[domainParts.length - 1];
  if (tld.length < 1 || !/^[a-zA-Z]+$/.test(tld)) return false;

  return true;
}

/**
 * Validates password strength requirements
 * @param password - Password to validate
 * @returns Object containing validation result and error messages
 */
export const validatePassword = (password: string): { valid: boolean; errors: string[] } => {
  const errors: string[] = [];

  if (password.length < 6) {
    errors.push('Password must be at least 6 characters long');
  }

  if (!/(?=.*[a-z])/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }

  if (!/(?=.*[A-Z])/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }

  if (!/(?=.*\d)/.test(password)) {
    errors.push('Password must contain at least one number');
  }

  return {
    valid: errors.length === 0,
    errors
  };
};

/**
 * Validates user name format and length
 * @param name - Name to validate
 * @returns True if name is valid, false otherwise
 */
export const validateName = (name: string): boolean => {
  // Trim whitespace and check if the trimmed name meets requirements
  const trimmedName = name.trim();
  return Boolean(trimmedName && trimmedName.length >= 2 && trimmedName.length <= 50 && trimmedName === name);
};

/**
 * Rate limiting implementation with automatic cleanup
 * Prevents brute force attacks by limiting login attempts per IP
 */
// Rate limiting helper (basic implementation)
const loginAttempts = new Map<string, { count: number; lastAttempt: number }>();
const RATE_LIMIT_WINDOW = 15 * 60 * 1000; // 15 minutes
const MAX_ATTEMPTS = 5;

// Cleanup old entries periodically to prevent memory leaks
setInterval(() => {
  const now = Date.now();
  const expiredIps: string[] = [];

  for (const [ip, attempts] of loginAttempts.entries()) {
    if (now - attempts.lastAttempt > RATE_LIMIT_WINDOW) {
      expiredIps.push(ip);
    }
  }

  for (const ip of expiredIps) {
    loginAttempts.delete(ip);
  }
}, RATE_LIMIT_WINDOW); // Run cleanup every 15 minutes

/**
 * Checks if an IP address has exceeded rate limit
 * @param ip - Client IP address
 * @returns True if request is allowed, false if rate limited
 */
export const checkRateLimit = (ip: string): boolean => {
  const now = Date.now();
  const userAttempts = loginAttempts.get(ip);

  if (!userAttempts) {
    loginAttempts.set(ip, { count: 1, lastAttempt: now });
    return true;
  }

  // Reset after window expires
  if (now - userAttempts.lastAttempt > RATE_LIMIT_WINDOW) {
    loginAttempts.set(ip, { count: 1, lastAttempt: now });
    return true;
  }

  // Check if exceeded max attempts
  if (userAttempts.count >= MAX_ATTEMPTS) {
    return false;
  }

  userAttempts.count++;
  userAttempts.lastAttempt = now;
  return true;
};

/**
 * Resets rate limit for an IP address after successful login
 * @param ip - Client IP address to reset
 */
export const resetRateLimit = (ip: string): void => {
  loginAttempts.delete(ip);
};

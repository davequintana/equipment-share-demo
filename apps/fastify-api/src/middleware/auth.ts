import { FastifyRequest, FastifyReply } from 'fastify';
import { JwtPayload } from '../types.js';

// Authentication middleware for protected routes
export const authenticateUser = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    await request.jwtVerify();

    // Additional validation - ensure user still exists
    const user = request.user as JwtPayload;
    if (!user || !user.id || !user.email) {
      return reply.code(401).send({
        error: 'Invalid token payload',
        code: 'INVALID_TOKEN'
      });
    }

    return true;
  } catch (error) {
    // More specific error handling
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    if (errorMessage.includes('jwt expired')) {
      return reply.code(401).send({
        error: 'Token expired',
        code: 'TOKEN_EXPIRED'
      });
    }

    if (errorMessage.includes('jwt must be provided')) {
      return reply.code(401).send({
        error: 'Authorization token required',
        code: 'TOKEN_REQUIRED'
      });
    }

    return reply.code(401).send({
      error: 'Unauthorized',
      code: 'UNAUTHORIZED'
    });
  }
};

// Input validation helpers
export function validateEmail(email: string): boolean {
  if (email.length > 254) return false;

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

export const validateName = (name: string): boolean => {
  // Trim whitespace and check if the trimmed name meets requirements
  const trimmedName = name.trim();
  return Boolean(trimmedName && trimmedName.length >= 2 && trimmedName.length <= 50 && trimmedName === name);
};

// Rate limiting helper (basic implementation)
const loginAttempts = new Map<string, { count: number; lastAttempt: number }>();

export const checkRateLimit = (ip: string): boolean => {
  const now = Date.now();
  const userAttempts = loginAttempts.get(ip);

  if (!userAttempts) {
    loginAttempts.set(ip, { count: 1, lastAttempt: now });
    return true;
  }

  // Reset after 15 minutes
  if (now - userAttempts.lastAttempt > 15 * 60 * 1000) {
    loginAttempts.set(ip, { count: 1, lastAttempt: now });
    return true;
  }

  // Allow max 5 attempts per 15 minutes
  if (userAttempts.count >= 5) {
    return false;
  }

  userAttempts.count++;
  userAttempts.lastAttempt = now;
  return true;
};

export const resetRateLimit = (ip: string): void => {
  loginAttempts.delete(ip);
};

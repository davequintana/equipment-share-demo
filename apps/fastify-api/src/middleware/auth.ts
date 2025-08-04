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
export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

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
  return Boolean(name && name.trim().length >= 2 && name.trim().length <= 50);
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

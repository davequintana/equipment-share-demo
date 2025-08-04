// Test setup for Fastify API
// Add any global test configuration here

import { beforeAll } from 'vitest';

beforeAll(() => {
  // Setup for database tests
  process.env['NODE_ENV'] = 'test';
});

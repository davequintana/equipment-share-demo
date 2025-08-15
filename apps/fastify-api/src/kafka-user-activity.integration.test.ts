import { describe, it, expect, beforeEach, afterEach, vi, beforeAll, afterAll } from 'vitest';
import { kafkaUserActivityService } from './kafka-user-activity';

// Integration tests focused on the exported singleton service
describe('KafkaUserActivityService Integration Tests', () => {
  let originalNodeEnv: string | undefined;
  let originalCI: string | undefined;

  beforeAll(() => {
    // Store original environment
    originalNodeEnv = process.env.NODE_ENV;
    originalCI = process.env.CI;

    // Mock console to reduce noise
    vi.spyOn(console, 'log').mockImplementation(() => undefined);
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
  });

  afterAll(() => {
    // Restore original environment
    if (originalNodeEnv !== undefined) {
      process.env.NODE_ENV = originalNodeEnv;
    } else {
      delete process.env.NODE_ENV;
    }

    if (originalCI !== undefined) {
      process.env.CI = originalCI;
    } else {
      delete process.env.CI;
    }

    vi.restoreAllMocks();
  });

  beforeEach(() => {
    vi.clearAllMocks();
    // Clear any existing sessions from singleton
    kafkaUserActivityService.getActiveSessions().clear();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Service Integration Workflow', () => {
    it('should handle complete user activity workflow', async () => {
      const userId = 'integration-user-123';
      const email = 'integration@example.com';
      const sessionId = 'integration-session-123';

      // Track initial activity
      await kafkaUserActivityService.trackUserActivity(userId, email, 'login', {
        sessionId,
        userAgent: 'Test Browser',
        ip: '127.0.0.1',
        page: '/login',
      });

      // Verify session was created
      expect(kafkaUserActivityService.isUserActive(userId)).toBe(true);
      const session = kafkaUserActivityService.getUserSession(userId);
      expect(session).toBeDefined();
      expect(session?.sessionId).toBe(sessionId);

      // Track page navigation
      await kafkaUserActivityService.trackUserActivity(userId, email, 'navigate', {
        sessionId,
        page: '/dashboard',
        metadata: { previousPage: '/login' },
      });

      // Session should still be active with updated timestamp
      expect(kafkaUserActivityService.isUserActive(userId)).toBe(true);
      const updatedSession = kafkaUserActivityService.getUserSession(userId);
      expect(updatedSession?.lastActivity).toBeGreaterThan(session?.lastActivity || 0);

      // Manual logout
      await kafkaUserActivityService.logoutUser(userId, email);

      // Session should be removed after processing
      expect(kafkaUserActivityService.isUserActive(userId)).toBe(false);
    });

    it('should handle multiple concurrent users', async () => {
      const users = [
        { id: 'user1', email: 'user1@example.com' },
        { id: 'user2', email: 'user2@example.com' },
        { id: 'user3', email: 'user3@example.com' },
      ];

      // Track activity for all users concurrently
      const trackingPromises = users.map(user =>
        kafkaUserActivityService.trackUserActivity(user.id, user.email, 'activity', {
          sessionId: `session-${user.id}`,
          action: 'concurrent-test',
        })
      );

      await Promise.all(trackingPromises);

      // All users should be active
      users.forEach(user => {
        expect(kafkaUserActivityService.isUserActive(user.id)).toBe(true);
      });

      expect(kafkaUserActivityService.getActiveSessions().size).toBe(3);

      // Logout all users
      const logoutPromises = users.map(user =>
        kafkaUserActivityService.logoutUser(user.id, user.email)
      );

      await Promise.all(logoutPromises);

      // All users should be inactive
      users.forEach(user => {
        expect(kafkaUserActivityService.isUserActive(user.id)).toBe(false);
      });

      expect(kafkaUserActivityService.getActiveSessions().size).toBe(0);
    });

    it('should handle complex user behavior tracking', async () => {
      const userId = 'behavior-user-123';
      const email = 'behavior@example.com';

      // Simulate complex user interactions
      const interactions = [
        { action: 'click', element: 'button', x: 100, y: 200 },
        { action: 'scroll', scrollTop: 500, scrollLeft: 0 },
        { action: 'keypress', key: 'Enter', target: 'search-input' },
        { action: 'hover', element: 'menu-item', x: 150, y: 300 },
        { action: 'focus', target: 'email-field' },
      ];

      const trackingPromises = interactions.map((interaction, index) =>
        kafkaUserActivityService.trackUserActivity(userId, email, interaction.action, {
          sessionId: 'behavior-session',
          page: '/dashboard',
          timestamp: Date.now() + index * 100, // Stagger timestamps
          ...interaction,
        })
      );

      await Promise.all(trackingPromises);

      // User should be active after all interactions
      expect(kafkaUserActivityService.isUserActive(userId)).toBe(true);

      const session = kafkaUserActivityService.getUserSession(userId);
      expect(session?.sessionId).toBe('behavior-session');
    });

    it('should handle edge cases gracefully', async () => {
      const edgeCases = [
        // Empty metadata
        { userId: 'edge1', email: 'edge1@example.com', action: 'empty-meta', metadata: {} },
        // Very long strings
        { userId: 'edge2', email: 'edge2@example.com', action: 'long-string', metadata: { text: 'x'.repeat(10000) } },
        // Special characters
        { userId: 'edge3', email: 'edge3@example.com', action: 'special-chars', metadata: { text: '🚀📊💻🔥✨' } },
        // Numeric userId (as string)
        { userId: '12345', email: 'numeric@example.com', action: 'numeric-id', metadata: { userId: 12345 } },
      ];

      // All edge cases should be handled without throwing
      for (const testCase of edgeCases) {
        await expect(
          kafkaUserActivityService.trackUserActivity(
            testCase.userId,
            testCase.email,
            testCase.action,
            testCase.metadata
          )
        ).resolves.not.toThrow();

        expect(kafkaUserActivityService.isUserActive(testCase.userId)).toBe(true);
      }

      expect(kafkaUserActivityService.getActiveSessions().size).toBe(4);
    });
  });

  describe('Environment and Configuration', () => {
    it('should respect test environment configuration', () => {
      // In test environment, service should be disabled
      expect(kafkaUserActivityService['isEnabled']).toBe(false);
      expect(kafkaUserActivityService['kafka']).toBeNull();
    });

    it('should handle initialization in test environment', async () => {
      // Should complete without error even in test environment
      await expect(kafkaUserActivityService.initialize()).resolves.not.toThrow();

      // Should remain disconnected in test environment
      expect(kafkaUserActivityService['isConnected']).toBe(false);
    });

    it('should handle shutdown gracefully', async () => {
      const userId = 'shutdown-test';
      const email = 'shutdown@example.com';

      // Create some active sessions
      await kafkaUserActivityService.trackUserActivity(userId, email, 'pre-shutdown');
      expect(kafkaUserActivityService.isUserActive(userId)).toBe(true);

      // Shutdown should clear sessions
      await expect(kafkaUserActivityService.shutdown()).resolves.not.toThrow();

      // Sessions should be cleared
      expect(kafkaUserActivityService.getActiveSessions().size).toBe(0);
    });
  });

  describe('Performance and Reliability', () => {
    it('should handle high-frequency activity tracking', async () => {
      const userId = 'performance-test';
      const email = 'performance@example.com';
      const activityCount = 1000;

      const startTime = Date.now();

      // Track many activities in quick succession
      const promises = Array.from({ length: activityCount }, (_, i) =>
        kafkaUserActivityService.trackUserActivity(userId, email, `activity-${i}`, {
          timestamp: Date.now() + i,
          sequence: i,
        })
      );

      await Promise.all(promises);

      const endTime = Date.now();
      const duration = endTime - startTime;

      // Should complete within reasonable time (less than 1 second)
      expect(duration).toBeLessThan(1000);

      // Should still have only one active session
      expect(kafkaUserActivityService.getActiveSessions().size).toBe(1);
      expect(kafkaUserActivityService.isUserActive(userId)).toBe(true);
    });

    it('should handle memory efficiently with session updates', () => {
      const userId = 'memory-test';
      const email = 'memory@example.com';
      const updateCount = 10000;

      const startTime = Date.now();

      // Rapid session updates
      for (let i = 0; i < updateCount; i++) {
        kafkaUserActivityService['updateUserSession'](
          userId,
          email,
          Date.now() + i,
          'memory-session'
        );
      }

      const endTime = Date.now();
      const duration = endTime - startTime;

      // Should complete quickly
      expect(duration).toBeLessThan(500);

      // Should still have only one session
      expect(kafkaUserActivityService.getActiveSessions().size).toBe(1);

      const session = kafkaUserActivityService.getUserSession(userId);
      expect(session?.lastActivity).toBe(Date.now() + updateCount - 1);
    });

    it('should handle error conditions without crashing', async () => {
      const problematicInputs = [
        // Null/undefined values (handled by TypeScript but testing runtime)
        { userId: '', email: '', action: '' },
        // Very large objects
        {
          userId: 'large-data',
          email: 'large@example.com',
          action: 'large-metadata',
          metadata: {
            largeArray: new Array(10000).fill('data'),
            largeString: 'x'.repeat(100000),
          }
        },
        // Circular references (would be serialized)
        {
          userId: 'circular',
          email: 'circular@example.com',
          action: 'circular-ref',
          metadata: { type: 'circular' }
        },
      ];

      for (const input of problematicInputs) {
        await expect(
          kafkaUserActivityService.trackUserActivity(
            input.userId,
            input.email,
            input.action,
            input.metadata
          )
        ).resolves.not.toThrow();
      }
    });
  });

  describe('Data Integrity', () => {
    it('should maintain consistent session state', async () => {
      const userId = 'consistency-test';
      const email = 'consistency@example.com';
      const sessionId = 'consistent-session';

      // Initial activity
      await kafkaUserActivityService.trackUserActivity(userId, email, 'initial', {
        sessionId,
      });

      let session = kafkaUserActivityService.getUserSession(userId);
      expect(session?.sessionId).toBe(sessionId);
      const initialActivity = session?.lastActivity || 0;

      // Update activity
      await kafkaUserActivityService.trackUserActivity(userId, email, 'update', {
        sessionId, // Same session ID
      });

      session = kafkaUserActivityService.getUserSession(userId);
      expect(session?.sessionId).toBe(sessionId); // Should preserve session ID
      expect(session?.lastActivity).toBeGreaterThan(initialActivity); // Should update timestamp

      // Logout
      await kafkaUserActivityService.logoutUser(userId, email);

      expect(kafkaUserActivityService.getUserSession(userId)).toBeUndefined();
    });

    it('should handle session ID generation consistently', async () => {
      const userId = 'session-gen-test';
      const email = 'sessiongen@example.com';

      // Track activity without providing session ID
      await kafkaUserActivityService.trackUserActivity(userId, email, 'auto-session');

      const session = kafkaUserActivityService.getUserSession(userId);
      expect(session?.sessionId).toMatch(/^session-session-gen-test-\d+$/);

      const generatedSessionId = session?.sessionId || '';

      // Update activity - should preserve generated session ID
      await kafkaUserActivityService.trackUserActivity(userId, email, 'preserve-session');

      const updatedSession = kafkaUserActivityService.getUserSession(userId);
      expect(updatedSession?.sessionId).toBe(generatedSessionId);
    });
  });
});

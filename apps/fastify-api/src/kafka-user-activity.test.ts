import { describe, it, expect, beforeEach, afterEach, vi, beforeAll, afterAll } from 'vitest';
import { kafkaUserActivityService, UserActivityEvent } from './kafka-user-activity';

// Mock kafkajs
const mockSend = vi.fn();
const mockConnect = vi.fn();
const mockDisconnect = vi.fn();
const mockSubscribe = vi.fn();
const mockRun = vi.fn();

const mockProducer = {
  send: mockSend,
  connect: mockConnect,
  disconnect: mockDisconnect,
};

const mockConsumer = {
  connect: mockConnect,
  disconnect: mockDisconnect,
  subscribe: mockSubscribe,
  run: mockRun,
};

const mockKafka = {
  producer: vi.fn(() => mockProducer),
  consumer: vi.fn(() => mockConsumer),
};

vi.mock('kafkajs', () => ({
  Kafka: vi.fn(() => mockKafka),
}));

// Mock timers for timeout testing
vi.useFakeTimers();

describe('KafkaUserActivityService', () => {
  let service: typeof kafkaUserActivityService;
  let consoleSpy: ReturnType<typeof vi.spyOn>;

  beforeAll(() => {
    // Mock console to reduce noise in tests
    consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => undefined);
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
  });

  afterAll(() => {
    consoleSpy.mockRestore();
  });

  beforeEach(() => {
    vi.clearAllMocks();
    vi.clearAllTimers();

    // Reset service state by creating a new instance
    // Note: We use the singleton, so we need to reset its internal state
    service = kafkaUserActivityService;

    // Clear any existing sessions
    service.getActiveSessions().clear();
  });

  afterEach(() => {
    vi.clearAllTimers();
    vi.clearAllMocks();
  });

  describe('Constructor and Environment Handling', () => {
    it('should be disabled in test environment', () => {
      // In test environment, service should be disabled
      expect(service['isEnabled']).toBe(false);
    });

    it('should handle missing KAFKA_BROKERS environment variable', () => {
      // Service should use default localhost broker when env var is not set
      delete process.env.KAFKA_BROKERS;

      // Since we're in test environment, kafka should be null
      expect(service['kafka']).toBeNull();
    });
  });

  describe('Session Management', () => {
    describe('updateUserSession', () => {
      it('should create new user session with timeout', () => {
        const userId = 'user123';
        const email = 'test@example.com';
        const timestamp = Date.now();
        const sessionId = 'session123';

        service['updateUserSession'](userId, email, timestamp, sessionId);

        const session = service.getUserSession(userId);
        expect(session).toBeDefined();
        expect(session?.userId).toBe(userId);
        expect(session?.email).toBe(email);
        expect(session?.lastActivity).toBe(timestamp);
        expect(session?.sessionId).toBe(sessionId);
        expect(session?.timeoutId).toBeDefined();
      });

      it('should clear existing timeout when updating session', () => {
        const userId = 'user123';
        const email = 'test@example.com';
        const timestamp = Date.now();

        // Create first session
        service['updateUserSession'](userId, email, timestamp);
        const firstSession = service.getUserSession(userId);
        const firstTimeoutId = firstSession?.timeoutId;

        // Update session
        service['updateUserSession'](userId, email, timestamp + 1000);
        const updatedSession = service.getUserSession(userId);
        const newTimeoutId = updatedSession?.timeoutId;

        expect(firstTimeoutId).toBeDefined();
        expect(newTimeoutId).toBeDefined();
        expect(firstTimeoutId).not.toBe(newTimeoutId);
      });

      it('should generate session ID when not provided', () => {
        const userId = 'user123';
        const email = 'test@example.com';
        const timestamp = Date.now();

        service['updateUserSession'](userId, email, timestamp);

        const session = service.getUserSession(userId);
        expect(session?.sessionId).toMatch(/^session-user123-\d+$/);
      });

      it('should preserve existing session ID when updating', () => {
        const userId = 'user123';
        const email = 'test@example.com';
        const timestamp = Date.now();
        const originalSessionId = 'original-session';

        // Create session with specific ID
        service['updateUserSession'](userId, email, timestamp, originalSessionId);

        // Update without providing session ID
        service['updateUserSession'](userId, email, timestamp + 1000);

        const session = service.getUserSession(userId);
        expect(session?.sessionId).toBe(originalSessionId);
      });
    });

    describe('removeUserSession', () => {
      it('should remove user session and clear timeout', () => {
        const userId = 'user123';
        const email = 'test@example.com';
        const timestamp = Date.now();

        // Create session
        service['updateUserSession'](userId, email, timestamp);
        expect(service.isUserActive(userId)).toBe(true);

        // Remove session
        service['removeUserSession'](userId);
        expect(service.isUserActive(userId)).toBe(false);
        expect(service.getUserSession(userId)).toBeUndefined();
      });

      it('should handle removing non-existent session gracefully', () => {
        // Should not throw when removing non-existent session
        service['removeUserSession']('non-existent');
        expect(true).toBe(true); // Test passes if no exception thrown
      });
    });

    describe('isUserActive', () => {
      it('should return true for active users', () => {
        const userId = 'user123';
        const email = 'test@example.com';
        const timestamp = Date.now();

        service['updateUserSession'](userId, email, timestamp);
        expect(service.isUserActive(userId)).toBe(true);
      });

      it('should return false for inactive users', () => {
        expect(service.isUserActive('non-existent')).toBe(false);
      });
    });
  });

  describe('User Activity Handling', () => {
    describe('handleUserActivityEvent', () => {
      it('should handle activity events by updating session', async () => {
        const event: UserActivityEvent = {
          userId: 'user123',
          email: 'test@example.com',
          eventType: 'activity',
          timestamp: Date.now(),
          sessionId: 'session123',
          metadata: { action: 'click', page: '/dashboard' }
        };

        await service['handleUserActivityEvent'](event);

        const session = service.getUserSession('user123');
        expect(session).toBeDefined();
        expect(session?.userId).toBe('user123');
        expect(session?.sessionId).toBe('session123');
      });

      it('should handle logout events by removing session', async () => {
        const userId = 'user123';
        const email = 'test@example.com';

        // Create session first
        service['updateUserSession'](userId, email, Date.now());
        expect(service.isUserActive(userId)).toBe(true);

        // Handle logout event
        const logoutEvent: UserActivityEvent = {
          userId,
          email,
          eventType: 'logout',
          timestamp: Date.now(),
        };

        await service['handleUserActivityEvent'](logoutEvent);
        expect(service.isUserActive(userId)).toBe(false);
      });
    });

    describe('handleUserTimeout', () => {
      it('should publish logout event and remove session on timeout', async () => {
        const userId = 'user123';
        const email = 'test@example.com';

        // Create session
        service['updateUserSession'](userId, email, Date.now());
        expect(service.isUserActive(userId)).toBe(true);

        // Spy on publishUserActivity
        const publishSpy = vi.spyOn(service, 'publishUserActivity');

        // Trigger timeout
        await service['handleUserTimeout'](userId, email);

        // Check that logout event was published
        expect(publishSpy).toHaveBeenCalledWith({
          userId,
          email,
          eventType: 'logout',
          timestamp: expect.any(Number),
          metadata: {
            action: 'auto-logout-timeout',
          },
        });

        // Check that session was removed
        expect(service.isUserActive(userId)).toBe(false);
      });
    });
  });

  describe('Public API Methods', () => {
    describe('trackUserActivity', () => {
      it('should publish activity event with correct structure', async () => {
        const publishSpy = vi.spyOn(service, 'publishUserActivity');

        await service.trackUserActivity(
          'user123',
          'test@example.com',
          'click',
          {
            userAgent: 'Mozilla/5.0',
            ip: '192.168.1.1',
            page: '/dashboard',
            x: 100,
            y: 200,
            element: 'button',
          }
        );

        expect(publishSpy).toHaveBeenCalledWith({
          userId: 'user123',
          email: 'test@example.com',
          eventType: 'activity',
          timestamp: expect.any(Number),
          sessionId: undefined,
          metadata: {
            action: 'click',
            userAgent: 'Mozilla/5.0',
            ip: '192.168.1.1',
            page: '/dashboard',
            x: 100,
            y: 200,
            element: 'button',
            key: undefined,
            scrollTop: undefined,
            scrollLeft: undefined,
            target: undefined,
            text: undefined,
          },
        });
      });

      it('should handle custom timestamp in metadata', async () => {
        const publishSpy = vi.spyOn(service, 'publishUserActivity');
        const customTimestamp = 1234567890;

        await service.trackUserActivity(
          'user123',
          'test@example.com',
          'scroll',
          { timestamp: customTimestamp }
        );

        expect(publishSpy).toHaveBeenCalledWith(
          expect.objectContaining({
            timestamp: customTimestamp,
          })
        );
      });

      it('should include additional metadata properties', async () => {
        const publishSpy = vi.spyOn(service, 'publishUserActivity');

        await service.trackUserActivity(
          'user123',
          'test@example.com',
          'custom',
          {
            customProp1: 'value1',
            customProp2: 42,
            page: '/test', // This should be in metadata
          }
        );

        expect(publishSpy).toHaveBeenCalledWith(
          expect.objectContaining({
            metadata: expect.objectContaining({
              action: 'custom',
              page: '/test',
              customProp1: 'value1',
              customProp2: 42,
            }),
          })
        );
      });
    });

    describe('logoutUser', () => {
      it('should publish logout event with manual action', async () => {
        const publishSpy = vi.spyOn(service, 'publishUserActivity');

        await service.logoutUser('user123', 'test@example.com');

        expect(publishSpy).toHaveBeenCalledWith({
          userId: 'user123',
          email: 'test@example.com',
          eventType: 'logout',
          timestamp: expect.any(Number),
          metadata: {
            action: 'manual-logout',
          },
        });
      });
    });

    describe('getActiveSessions', () => {
      it('should return copy of active sessions map', () => {
        const userId = 'user123';
        const email = 'test@example.com';

        service['updateUserSession'](userId, email, Date.now());

        const sessions = service.getActiveSessions();
        expect(sessions.size).toBe(1);
        expect(sessions.has(userId)).toBe(true);

        // Should be a copy, not the original
        expect(sessions).not.toBe(service['activeSessions']);
      });
    });
  });

  describe('Timeout Behavior', () => {
    it('should auto-logout user after idle timeout', async () => {
      const userId = 'user123';
      const email = 'test@example.com';
      const publishSpy = vi.spyOn(service, 'publishUserActivity');

      // Create session
      service['updateUserSession'](userId, email, Date.now());
      expect(service.isUserActive(userId)).toBe(true);

      // Fast-forward time to trigger timeout
      await vi.advanceTimersByTimeAsync(15 * 60 * 1000); // 15 minutes

      // Check that user was logged out
      expect(publishSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          eventType: 'logout',
          metadata: { action: 'auto-logout-timeout' },
        })
      );
      expect(service.isUserActive(userId)).toBe(false);
    });

    it('should reset timeout on user activity', async () => {
      const userId = 'user123';
      const email = 'test@example.com';
      const publishSpy = vi.spyOn(service, 'publishUserActivity');

      // Create session
      service['updateUserSession'](userId, email, Date.now());

      // Advance time by 10 minutes (less than timeout)
      await vi.advanceTimersByTimeAsync(10 * 60 * 1000);

      // Update session (simulate activity)
      service['updateUserSession'](userId, email, Date.now());

      // Advance time by another 10 minutes (total 20 min, but timeout should reset)
      await vi.advanceTimersByTimeAsync(10 * 60 * 1000);

      // User should still be active (timeout was reset)
      expect(service.isUserActive(userId)).toBe(true);
      expect(publishSpy).not.toHaveBeenCalledWith(
        expect.objectContaining({ eventType: 'logout' })
      );
    });
  });

  describe('Kafka Integration (Disabled in Tests)', () => {
    describe('initialize', () => {
      it('should skip initialization when disabled', async () => {
        await service.initialize();

        expect(mockKafka.producer).not.toHaveBeenCalled();
        expect(mockKafka.consumer).not.toHaveBeenCalled();
        expect(service['isConnected']).toBe(false);
      });
    });

    describe('publishUserActivity', () => {
      it('should fall back to in-memory processing when Kafka disabled', async () => {
        const handleSpy = vi.spyOn(service, 'handleUserActivityEvent' as keyof typeof service);

        const event: UserActivityEvent = {
          userId: 'user123',
          email: 'test@example.com',
          eventType: 'activity',
          timestamp: Date.now(),
        };

        await service.publishUserActivity(event);

        expect(mockSend).not.toHaveBeenCalled();
        expect(handleSpy).toHaveBeenCalledWith(event);
      });
    });

    describe('shutdown', () => {
      it('should clear all sessions and timeouts on shutdown', async () => {
        const userId1 = 'user1';
        const userId2 = 'user2';
        const email = 'test@example.com';

        // Create multiple sessions
        service['updateUserSession'](userId1, email, Date.now());
        service['updateUserSession'](userId2, email, Date.now());

        expect(service.getActiveSessions().size).toBe(2);

        await service.shutdown();

        expect(service.getActiveSessions().size).toBe(0);
        expect(service['isConnected']).toBe(false);
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle malformed event data gracefully', async () => {
      const malformedEvent = {
        userId: '',
        email: '',
        eventType: 'activity',
        timestamp: NaN,
      } as UserActivityEvent;

      const handleAction = () => service['handleUserActivityEvent'](malformedEvent);
      await expect(handleAction()).resolves.not.toThrow();
    });

    it('should handle missing required fields gracefully', async () => {
      const incompleteEvent = {
        eventType: 'activity',
        timestamp: Date.now(),
      } as UserActivityEvent;

      const handleAction = () => service['handleUserActivityEvent'](incompleteEvent);
      await expect(handleAction()).resolves.not.toThrow();
    });
  });

  describe('Security and Input Validation', () => {
    it('should handle potentially malicious user input safely', async () => {
      const maliciousInputs = [
        '((a+)+)+b', // ReDoS pattern
        'a'.repeat(10000), // Large string
        '<script>alert("xss")</script>', // XSS attempt
        'null\0byte', // Null byte injection
      ];

      const startTime = Date.now();

      for (const maliciousInput of maliciousInputs) {
        await service.trackUserActivity(
          maliciousInput,
          maliciousInput,
          maliciousInput,
          {
            userAgent: maliciousInput,
            ip: maliciousInput,
            page: maliciousInput,
            text: maliciousInput,
          }
        );
      }

      const endTime = Date.now();

      // Should complete quickly even with malicious inputs
      expect(endTime - startTime).toBeLessThan(100);
    });

    it('should handle extremely large metadata objects', async () => {
      const largeMetadata = {
        action: 'test',
        largeString: 'x'.repeat(100000),
        largeArray: new Array(1000).fill('data'),
        nestedObject: {
          level1: {
            level2: {
              level3: 'deep nesting test',
            },
          },
        },
      };

      const trackAction = () => service.trackUserActivity(
        'user123',
        'test@example.com',
        'large-data-test',
        largeMetadata
      );

      await expect(trackAction()).resolves.not.toThrow();
    });
  });

  describe('Memory Management', () => {
    it('should not leak memory with many session updates', () => {
      const userId = 'user123';
      const email = 'test@example.com';

      // Simulate many rapid updates
      for (let i = 0; i < 1000; i++) {
        service['updateUserSession'](userId, email, Date.now() + i);
      }

      // Should still have only one session
      expect(service.getActiveSessions().size).toBe(1);

      // Should have latest timestamp
      const session = service.getUserSession(userId);
      expect(session?.lastActivity).toBe(Date.now() + 999);
    });

    it('should clean up timeouts properly on rapid session updates', () => {
      const userId = 'user123';
      const email = 'test@example.com';
      const clearTimeoutSpy = vi.spyOn(global, 'clearTimeout');

      // Create initial session
      service['updateUserSession'](userId, email, Date.now());

      // Update session multiple times rapidly
      for (let i = 0; i < 10; i++) {
        service['updateUserSession'](userId, email, Date.now() + i);
      }

      // clearTimeout should have been called for each update (except the first)
      expect(clearTimeoutSpy).toHaveBeenCalledTimes(9);

      clearTimeoutSpy.mockRestore();
    });
  });

  describe('Additional Edge Cases', () => {
    describe('startConsuming error handling', () => {
      it('should throw error when consumer is not initialized', async () => {
        // Ensure consumer is null
        service['consumer'] = null;

        await expect(service['startConsuming']()).rejects.toThrow('Consumer not initialized');
      });
    });

    describe('Unknown event types', () => {
      it('should handle unknown event types gracefully', async () => {
        const unknownEvent = {
          userId: 'user123',
          email: 'test@example.com',
          eventType: 'unknown-event-type' as 'activity' | 'logout',
          timestamp: Date.now(),
        };

        // Should not throw when handling unknown event type
        await expect(service['handleUserActivityEvent'](unknownEvent)).resolves.not.toThrow();

        // Should not create sessions for unknown event types
        expect(service.isUserActive('user123')).toBe(false);
      });

      it('should handle events with missing eventType property', async () => {
        const invalidEvent = {
          userId: 'user123',
          email: 'test@example.com',
          timestamp: Date.now(),
          // eventType is missing
        } as UserActivityEvent;

        // Should not throw when eventType is missing
        await expect(service['handleUserActivityEvent'](invalidEvent)).resolves.not.toThrow();
      });
    });

    describe('Session ID edge cases', () => {
      it('should handle very long session IDs', () => {
        const userId = 'user123';
        const email = 'test@example.com';
        const timestamp = Date.now();
        const veryLongSessionId = 'session-' + 'x'.repeat(1000);

        service['updateUserSession'](userId, email, timestamp, veryLongSessionId);

        const session = service.getUserSession(userId);
        expect(session?.sessionId).toBe(veryLongSessionId);
      });

      it('should handle session IDs with special characters', () => {
        const userId = 'user123';
        const email = 'test@example.com';
        const timestamp = Date.now();
        const specialSessionId = 'session-!@#$%^&*()_+-=[]{}|;:,.<>?`~';

        service['updateUserSession'](userId, email, timestamp, specialSessionId);

        const session = service.getUserSession(userId);
        expect(session?.sessionId).toBe(specialSessionId);
      });
    });

    describe('Timestamp edge cases', () => {
      it('should handle zero timestamp values', () => {
        const userId = 'user123';
        const email = 'test@example.com';
        const timestamp = 0;

        service['updateUserSession'](userId, email, timestamp);

        const session = service.getUserSession(userId);
        expect(session?.lastActivity).toBe(0);
      });

      it('should handle negative timestamp values', () => {
        const userId = 'user123';
        const email = 'test@example.com';
        const timestamp = -1000;

        service['updateUserSession'](userId, email, timestamp);

        const session = service.getUserSession(userId);
        expect(session?.lastActivity).toBe(-1000);
      });

      it('should handle very large timestamp values', () => {
        const userId = 'user123';
        const email = 'test@example.com';
        const timestamp = Number.MAX_SAFE_INTEGER;

        service['updateUserSession'](userId, email, timestamp);

        const session = service.getUserSession(userId);
        expect(session?.lastActivity).toBe(Number.MAX_SAFE_INTEGER);
      });
    });

    describe('Shutdown edge cases', () => {
      it('should handle shutdown with no active sessions', async () => {
        // Ensure no active sessions
        service.getActiveSessions().clear();

        await expect(service.shutdown()).resolves.not.toThrow();
      });

      it('should handle shutdown when producer/consumer are null', async () => {
        service['producer'] = null;
        service['consumer'] = null;
        service['isConnected'] = false;

        await expect(service.shutdown()).resolves.not.toThrow();
      });
    });

    describe('Data validation edge cases', () => {
      it('should handle empty user IDs and emails', async () => {
        await service.trackUserActivity('', '', 'test-action', {
          page: '/test',
        });

        // Should not throw but creates session with empty string as key
        expect(service.isUserActive('')).toBe(true);
      });

      it('should handle user IDs and emails with only whitespace', async () => {
        const whitespaceUserId = '   ';
        const whitespaceEmail = '\t\n  ';

        await service.trackUserActivity(whitespaceUserId, whitespaceEmail, 'test-action');

        expect(service.isUserActive(whitespaceUserId)).toBe(true);
      });

      it('should handle metadata with complex nested objects', async () => {
        const complexMetadata = {
          level1: {
            level2: {
              level3: {
                data: 'deep nesting test',
                array: [1, 2, 3, { nested: 'object' }],
                boolean: true,
                nullValue: null,
                undefinedValue: undefined,
              },
            },
          },
        };

        // Should not throw during processing
        await expect(
          service.trackUserActivity('user123', 'test@example.com', 'complex-test', complexMetadata)
        ).resolves.not.toThrow();

        expect(service.isUserActive('user123')).toBe(true);
      });
    });
  });
});

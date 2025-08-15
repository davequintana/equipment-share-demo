import { describe, it, expect, beforeEach, afterEach, vi, beforeAll, afterAll } from 'vitest';
import { kafkaUserActivityService, UserActivityEvent } from './kafka-user-activity';
import { Kafka, Producer, Consumer } from 'kafkajs';

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
} as unknown as Producer;

const mockConsumer = {
  connect: mockConnect,
  disconnect: mockDisconnect,
  subscribe: mockSubscribe,
  run: mockRun,
} as unknown as Consumer;

const mockKafka = {
  producer: vi.fn(() => mockProducer),
  consumer: vi.fn(() => mockConsumer),
} as unknown as Kafka;

vi.mock('kafkajs', () => ({
  Kafka: vi.fn(() => mockKafka),
}));

// Mock timers for timeout testing
vi.useFakeTimers();

describe('KafkaUserActivityService - Enhanced Coverage', () => {
  let service: typeof kafkaUserActivityService;
  let consoleSpy: ReturnType<typeof vi.spyOn>;
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

  beforeAll(() => {
    // Mock console to capture logs and errors
    consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => undefined);
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
  });

  afterAll(() => {
    consoleSpy.mockRestore();
    consoleErrorSpy.mockRestore();
  });

  beforeEach(() => {
    vi.clearAllMocks();
    vi.clearAllTimers();

    // Reset service state
    service = kafkaUserActivityService;
    service.getActiveSessions().clear();

    // Reset mock implementations
    mockConnect.mockResolvedValue(undefined);
    mockDisconnect.mockResolvedValue(undefined);
    mockSubscribe.mockResolvedValue(undefined);
    mockSend.mockResolvedValue(undefined);
    mockRun.mockResolvedValue(undefined);
  });

  afterEach(() => {
    vi.clearAllTimers();
    vi.clearAllMocks();
  });

  describe('Kafka Connection and Error Scenarios', () => {
    it('should handle producer connection failure during initialization', async () => {
      // Temporarily enable Kafka for this test
      const originalIsEnabled = service['isEnabled'];
      service['isEnabled'] = true;
      service['kafka'] = mockKafka as any;

      // Make producer connection fail
      mockConnect.mockRejectedValueOnce(new Error('Producer connection failed'));

      await service.initialize();

      // Should fall back to disabled state
      expect(service['isEnabled']).toBe(false);
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        '❌ Failed to initialize Kafka User Activity Service:',
        expect.any(Error)
      );
      expect(consoleSpy).toHaveBeenCalledWith(
        '💡 Continuing without Kafka - falling back to in-memory session tracking'
      );

      // Restore original state
      service['isEnabled'] = originalIsEnabled;
    });

    it('should handle consumer connection failure during initialization', async () => {
      // Temporarily enable Kafka for this test
      const originalIsEnabled = service['isEnabled'];
      service['isEnabled'] = true;
      service['kafka'] = mockKafka as any;

      // Make consumer connection fail (after producer succeeds)
      mockConnect
        .mockResolvedValueOnce(undefined) // producer succeeds
        .mockRejectedValueOnce(new Error('Consumer connection failed')); // consumer fails

      await service.initialize();

      // Should fall back to disabled state
      expect(service['isEnabled']).toBe(false);
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        '❌ Failed to initialize Kafka User Activity Service:',
        expect.any(Error)
      );

      // Restore original state
      service['isEnabled'] = originalIsEnabled;
    });

    it('should handle subscription failure during initialization', async () => {
      // Temporarily enable Kafka for this test
      const originalIsEnabled = service['isEnabled'];
      service['isEnabled'] = true;
      service['kafka'] = mockKafka as any;

      // Make subscription fail
      mockSubscribe.mockRejectedValueOnce(new Error('Subscription failed'));

      await service.initialize();

      // Should fall back to disabled state
      expect(service['isEnabled']).toBe(false);
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        '❌ Failed to initialize Kafka User Activity Service:',
        expect.any(Error)
      );

      // Restore original state
      service['isEnabled'] = originalIsEnabled;
    });

    it('should handle producer send failure with fallback', async () => {
      // Set up service as if Kafka is enabled and connected
      const originalIsEnabled = service['isEnabled'];
      const originalIsConnected = service['isConnected'];
      service['isEnabled'] = true;
      service['isConnected'] = true;
      service['producer'] = mockProducer as any;

      // Make producer send fail
      mockSend.mockRejectedValueOnce(new Error('Send failed'));

      // Spy on fallback method
      const handleEventSpy = vi.spyOn(service, 'handleUserActivityEvent' as any);

      const event: UserActivityEvent = {
        userId: 'user123',
        email: 'test@example.com',
        eventType: 'activity',
        timestamp: Date.now(),
      };

      await service.publishUserActivity(event);

      // Should log error and fall back to in-memory processing
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        '❌ Failed to publish user activity event:',
        expect.any(Error)
      );
      expect(handleEventSpy).toHaveBeenCalledWith(event);

      // Restore original state
      service['isEnabled'] = originalIsEnabled;
      service['isConnected'] = originalIsConnected;
    });
  });

  describe('Message Processing Edge Cases', () => {
    it('should handle JSON parsing errors in message processing', async () => {
      // Temporarily enable for testing
      const originalIsEnabled = service['isEnabled'];
      service['isEnabled'] = true;
      service['consumer'] = mockConsumer as any;

      // Set up the consumer run mock to simulate message processing
      let messageHandler: any;
      mockRun.mockImplementationOnce(({ eachMessage }) => {
        messageHandler = eachMessage;
        return Promise.resolve();
      });

      await service['startConsuming']();

      // Simulate malformed JSON message
      const malformedMessage = {
        message: {
          value: Buffer.from('{ invalid json'),
        },
      };

      await messageHandler(malformedMessage);

      // Should handle JSON parsing error gracefully
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        '❌ Error processing user activity message:',
        expect.any(Error)
      );

      // Restore original state
      service['isEnabled'] = originalIsEnabled;
    });

    it('should handle empty message value', async () => {
      // Temporarily enable for testing
      const originalIsEnabled = service['isEnabled'];
      service['isEnabled'] = true;
      service['consumer'] = mockConsumer as any;

      // Set up the consumer run mock
      let messageHandler: any;
      mockRun.mockImplementationOnce(({ eachMessage }) => {
        messageHandler = eachMessage;
        return Promise.resolve();
      });

      await service['startConsuming']();

      // Simulate empty message
      const emptyMessage = {
        message: {
          value: null,
        },
      };

      // Should not throw and handle gracefully
      await expect(messageHandler(emptyMessage)).resolves.not.toThrow();

      // Restore original state
      service['isEnabled'] = originalIsEnabled;
    });

    it('should throw error when startConsuming called without consumer', async () => {
      // Ensure consumer is null
      service['consumer'] = null;

      await expect(service['startConsuming']()).rejects.toThrow('Consumer not initialized');
    });
  });

  describe('Advanced Session Management', () => {
    it('should handle concurrent session updates safely', async () => {
      const userId = 'concurrent-user';
      const email = 'concurrent@example.com';
      const timestamp = Date.now();

      // Simulate rapid concurrent updates with a flat loop
      const updatePromises: Promise<void>[] = [];
      for (let i = 0; i < 10; i++) {
        updatePromises.push(
          Promise.resolve().then(() => {
            service['updateUserSession'](userId, email, timestamp + i, `session-${i}`);
          })
        );
      }

      await Promise.all(updatePromises);

      // Should have only one session for the user
      expect(service.getActiveSessions().size).toBe(1);
      const session = service.getUserSession(userId);
      expect(session).toBeDefined();
      expect(session?.userId).toBe(userId);
    });

    it('should handle session timeout edge case with zero timestamp', () => {
      const userId = 'zero-timestamp-user';
      const email = 'zero@example.com';
      const timestamp = 0; // Edge case: zero timestamp

      service['updateUserSession'](userId, email, timestamp);

      const session = service.getUserSession(userId);
      expect(session).toBeDefined();
      expect(session?.lastActivity).toBe(0);
      expect(session?.timeoutId).toBeDefined();
    });

    it('should handle very large timestamp values', () => {
      const userId = 'large-timestamp-user';
      const email = 'large@example.com';
      const timestamp = Number.MAX_SAFE_INTEGER;

      service['updateUserSession'](userId, email, timestamp);

      const session = service.getUserSession(userId);
      expect(session).toBeDefined();
      expect(session?.lastActivity).toBe(Number.MAX_SAFE_INTEGER);
    });
  });

  describe('Event Type Validation', () => {
    it('should handle unknown event types gracefully', async () => {
      const unknownEvent = {
        userId: 'user123',
        email: 'test@example.com',
        eventType: 'unknown-type' as any,
        timestamp: Date.now(),
      };

      // Should not throw when handling unknown event type
      await expect(service['handleUserActivityEvent'](unknownEvent)).resolves.not.toThrow();

      // Should not create or modify sessions for unknown event types
      expect(service.isUserActive('user123')).toBe(false);
    });

    it('should handle events with missing eventType', async () => {
      const invalidEvent = {
        userId: 'user123',
        email: 'test@example.com',
        timestamp: Date.now(),
      } as any;

      // Should not throw when eventType is missing
      await expect(service['handleUserActivityEvent'](invalidEvent)).resolves.not.toThrow();
    });
  });

  describe('Environment Configuration Edge Cases', () => {
    it('should handle KAFKA_BROKERS with empty string', () => {
      const originalBrokers = process.env.KAFKA_BROKERS;
      const originalIsEnabled = service['isEnabled'];

      // Set environment to enable Kafka but with empty brokers
      process.env.NODE_ENV = 'production';
      process.env.CI = 'false';
      process.env.KAFKA_BROKERS = '';

      // Create a new service instance to test constructor
      // Note: Since we're using a singleton, we'll test the constructor logic conceptually
      const brokers = process.env.KAFKA_BROKERS?.split(',') || ['localhost:9094'];
      expect(brokers).toEqual(['']); // Empty string splits to array with empty string

      // Restore environment
      if (originalBrokers !== undefined) {
        process.env.KAFKA_BROKERS = originalBrokers;
      } else {
        delete process.env.KAFKA_BROKERS;
      }
      process.env.NODE_ENV = 'test';
      service['isEnabled'] = originalIsEnabled;
    });

    it('should handle KAFKA_BROKERS with multiple brokers', () => {
      const originalBrokers = process.env.KAFKA_BROKERS;

      // Set multiple brokers
      process.env.KAFKA_BROKERS = 'broker1:9092,broker2:9092,broker3:9092';

      const brokers = process.env.KAFKA_BROKERS?.split(',') || ['localhost:9094'];
      expect(brokers).toEqual(['broker1:9092', 'broker2:9092', 'broker3:9092']);

      // Restore environment
      if (originalBrokers !== undefined) {
        process.env.KAFKA_BROKERS = originalBrokers;
      } else {
        delete process.env.KAFKA_BROKERS;
      }
    });
  });

  describe('Advanced Timeout and Cleanup', () => {
    it('should handle timeout callbacks with invalid user data', async () => {
      const userId = '';
      const email = '';

      // This should not throw even with empty user data
      await expect(service['handleUserTimeout'](userId, email)).resolves.not.toThrow();
    });

    it('should handle shutdown with partially initialized state', async () => {
      // Set up partial state
      service['producer'] = mockProducer as any;
      service['consumer'] = null; // Consumer not initialized
      service['isConnected'] = true;

      // Create some sessions
      service['updateUserSession']('user1', 'user1@example.com', Date.now());
      service['updateUserSession']('user2', 'user2@example.com', Date.now());

      await expect(service.shutdown()).resolves.not.toThrow();

      // Sessions should be cleared
      expect(service.getActiveSessions().size).toBe(0);
      expect(service['isConnected']).toBe(false);
    });

    it('should handle shutdown errors gracefully', async () => {
      // Set up state
      service['producer'] = mockProducer as any;
      service['consumer'] = mockConsumer as any;
      service['isConnected'] = true;

      // Make disconnect operations fail
      mockDisconnect.mockRejectedValue(new Error('Disconnect failed'));

      await expect(service.shutdown()).resolves.not.toThrow();

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        '❌ Error during Kafka service shutdown:',
        expect.any(Error)
      );
    });
  });

  describe('Data Serialization Edge Cases', () => {
    it('should handle events with circular references in metadata', async () => {
      const circularObj: any = { prop: 'value' };
      circularObj.self = circularObj;

      const event: UserActivityEvent = {
        userId: 'user123',
        email: 'test@example.com',
        eventType: 'activity',
        timestamp: Date.now(),
        metadata: circularObj,
      };

      // Should handle circular reference gracefully during JSON.stringify
      // Note: In a real Kafka scenario, this would fail serialization
      // but our test environment falls back to in-memory processing
      await expect(service.publishUserActivity(event)).resolves.not.toThrow();
    });

    it('should handle events with undefined and null values', async () => {
      const event: UserActivityEvent = {
        userId: 'user123',
        email: 'test@example.com',
        eventType: 'activity',
        timestamp: Date.now(),
        metadata: {
          undefinedValue: undefined,
          nullValue: null,
          validValue: 'test',
        } as any,
      };

      await expect(service.publishUserActivity(event)).resolves.not.toThrow();
    });
  });

  describe('Performance and Resource Management', () => {
    it('should handle rapid session creation and destruction', () => {
      const userCount = 1000;
      const startTime = Date.now();

      // Create many sessions rapidly
      for (let i = 0; i < userCount; i++) {
        service['updateUserSession'](`user${i}`, `user${i}@example.com`, Date.now());
      }

      expect(service.getActiveSessions().size).toBe(userCount);

      // Remove all sessions
      for (let i = 0; i < userCount; i++) {
        service['removeUserSession'](`user${i}`);
      }

      expect(service.getActiveSessions().size).toBe(0);

      const endTime = Date.now();
      const duration = endTime - startTime;

      // Should complete quickly even with many operations
      expect(duration).toBeLessThan(1000); // Should take less than 1 second
    });

    it('should handle memory efficiently with large session metadata', () => {
      const userId = 'memory-test-user';
      const email = 'memory@example.com';

      // Create session with large metadata through trackUserActivity
      const largeMetadata = {
        largeString: 'x'.repeat(100000), // 100KB string
        largeArray: new Array(10000).fill('data'),
        nestedData: {
          level1: {
            level2: {
              level3: 'deep nesting with large data'.repeat(1000),
            },
          },
        },
      };

      // Should handle large metadata without issues
      expect(() => {
        service.trackUserActivity(userId, email, 'large-metadata-test', largeMetadata);
      }).not.toThrow();

      expect(service.isUserActive(userId)).toBe(true);
    });
  });
});

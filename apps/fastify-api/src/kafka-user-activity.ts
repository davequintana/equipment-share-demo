import { Kafka, Producer, Consumer } from 'kafkajs';

export interface UserActivityEvent {
  userId: string;
  email: string;
  eventType: 'activity' | 'logout';
  timestamp: number;
  sessionId?: string;
  metadata?: {
    userAgent?: string;
    ip?: string;
    action?: string;
    page?: string;
    // Enhanced metadata for detailed behavior tracking
    x?: number;
    y?: number;
    element?: string;
    key?: string;
    scrollTop?: number;
    scrollLeft?: number;
    target?: string;
    text?: string;
    [key: string]: unknown;
  };
}

export interface UserSession {
  userId: string;
  email: string;
  lastActivity: number;
  timeoutId?: NodeJS.Timeout;
  sessionId: string;
}

class KafkaUserActivityService {
  private readonly kafka: Kafka | null;
  private producer: Producer | null = null;
  private consumer: Consumer | null = null;
  private readonly activeSessions = new Map<string, UserSession>();
  private readonly IDLE_TIMEOUT = 15 * 60 * 1000; // 15 minutes
  private readonly TOPIC_USER_ACTIVITY = 'user-activity';
  private readonly CONSUMER_GROUP = 'user-activity-consumer';
  private isConnected = false;
  private isEnabled = false;

  constructor() {
    // Check if Kafka should be enabled based on environment
    this.isEnabled =
      process.env['NODE_ENV'] !== 'test' && process.env['CI'] !== 'true';

    if (this.isEnabled) {
      const brokers = process.env['KAFKA_BROKERS']?.split(',') || [
        'localhost:9094',
      ];

      this.kafka = new Kafka({
        clientId: 'user-activity-service',
        brokers,
        retry: {
          initialRetryTime: 100,
          retries: 3,
        },
      });
    } else {
      this.kafka = null;
    }
  }

  /**
   * Initialize Kafka producer and consumer
   */
  async initialize(): Promise<void> {
    if (!this.isEnabled || !this.kafka) {
      console.log('📴 Kafka disabled for current environment');
      return;
    }

    try {
      // Initialize producer
      this.producer = this.kafka.producer({
        maxInFlightRequests: 1,
        idempotent: true,
        transactionTimeout: 30000,
      });

      // Initialize consumer
      this.consumer = this.kafka.consumer({
        groupId: this.CONSUMER_GROUP,
        sessionTimeout: 30000,
        heartbeatInterval: 3000,
      });

      await this.producer.connect();
      await this.consumer.connect();

      // Subscribe to user activity topic
      await this.consumer.subscribe({
        topic: this.TOPIC_USER_ACTIVITY,
        fromBeginning: false,
      });

      // Start consuming messages
      await this.startConsuming();

      this.isConnected = true;
      console.log('✅ Kafka User Activity Service initialized successfully');
    } catch (error) {
      console.error(
        '❌ Failed to initialize Kafka User Activity Service:',
        error,
      );
      console.log(
        '💡 Continuing without Kafka - falling back to in-memory session tracking',
      );
      this.isEnabled = false;
    }
  }

  /**
   * Publish user activity event to Kafka
   */
  async publishUserActivity(event: UserActivityEvent): Promise<void> {
    if (!this.isEnabled || !this.producer || !this.isConnected) {
      // Fall back to in-memory processing
      await this.handleUserActivityEvent(event);
      return;
    }

    try {
      await this.producer.send({
        topic: this.TOPIC_USER_ACTIVITY,
        messages: [
          {
            key: event.userId,
            value: JSON.stringify(event),
            timestamp: event.timestamp.toString(),
          },
        ],
      });

      console.log(`📤 Published user activity event for user ${event.userId}`);
    } catch (error) {
      console.error('❌ Failed to publish user activity event:', error);
      // Fall back to in-memory processing
      await this.handleUserActivityEvent(event);
    }
  }

  /**
   * Start consuming user activity events
   */
  private async startConsuming(): Promise<void> {
    if (!this.consumer) {
      throw new Error('Consumer not initialized');
    }

    await this.consumer.run({
      eachMessage: async ({ message }) => {
        try {
          if (!message.value) return;

          const event: UserActivityEvent = JSON.parse(message.value.toString());
          await this.handleUserActivityEvent(event);
        } catch (error) {
          console.error('❌ Error processing user activity message:', error);
        }
      },
    });
  }

  /**
   * Handle incoming user activity events
   */
  private async handleUserActivityEvent(
    event: UserActivityEvent,
  ): Promise<void> {
    const { userId, email, eventType, timestamp, sessionId } = event;

    if (eventType === 'activity') {
      // Update or create user session
      this.updateUserSession(userId, email, timestamp, sessionId);
    } else if (eventType === 'logout') {
      // Remove user session
      this.removeUserSession(userId);
    }
  }

  /**
   * Update user session and restart idle timer
   */
  private updateUserSession(
    userId: string,
    email: string,
    timestamp: number,
    sessionId?: string,
  ): void {
    // Clear existing timeout if any
    const existingSession = this.activeSessions.get(userId);
    if (existingSession?.timeoutId) {
      clearTimeout(existingSession.timeoutId);
    }

    // Create new timeout for auto-logout
    const timeoutId = setTimeout(() => {
      this.handleUserTimeout(userId, email);
    }, this.IDLE_TIMEOUT);

    // Update session
    const session: UserSession = {
      userId,
      email,
      lastActivity: timestamp,
      timeoutId,
      sessionId:
        sessionId ||
        existingSession?.sessionId ||
        `session-${userId}-${Date.now()}`,
    };

    this.activeSessions.set(userId, session);
    console.log(
      `🔄 Updated session for user ${userId}, auto-logout in ${this.IDLE_TIMEOUT / 1000}s`,
    );
  }

  /**
   * Remove user session
   */
  private removeUserSession(userId: string): void {
    const session = this.activeSessions.get(userId);
    if (session?.timeoutId) {
      clearTimeout(session.timeoutId);
    }
    this.activeSessions.delete(userId);
    console.log(`🗑️ Removed session for user ${userId}`);
  }

  /**
   * Handle user timeout (auto-logout)
   */
  private async handleUserTimeout(
    userId: string,
    email: string,
  ): Promise<void> {
    console.log(
      `⏰ User ${userId} (${email}) timed out - triggering auto-logout`,
    );

    // Publish logout event
    await this.publishUserActivity({
      userId,
      email,
      eventType: 'logout',
      timestamp: Date.now(),
      metadata: {
        action: 'auto-logout-timeout',
      },
    });

    // Remove session
    this.removeUserSession(userId);
  }

  /**
   * Manually trigger user logout
   */
  async logoutUser(userId: string, email: string): Promise<void> {
    await this.publishUserActivity({
      userId,
      email,
      eventType: 'logout',
      timestamp: Date.now(),
      metadata: {
        action: 'manual-logout',
      },
    });
  }

  /**
   * Track user activity with enhanced metadata support
   */
  async trackUserActivity(
    userId: string,
    email: string,
    action: string,
    metadata?: {
      userAgent?: string;
      ip?: string;
      sessionId?: string;
      page?: string;
      // Enhanced metadata for behavior tracking
      x?: number;
      y?: number;
      element?: string;
      key?: string;
      scrollTop?: number;
      scrollLeft?: number;
      target?: string;
      text?: string;
      timestamp?: number;
      [key: string]: unknown;
    },
  ): Promise<void> {
    await this.publishUserActivity({
      userId,
      email,
      eventType: 'activity',
      timestamp: metadata?.timestamp || Date.now(),
      sessionId: metadata?.sessionId,
      metadata: {
        action,
        userAgent: metadata?.userAgent,
        ip: metadata?.ip,
        page: metadata?.page,
        x: metadata?.x,
        y: metadata?.y,
        element: metadata?.element,
        key: metadata?.key,
        scrollTop: metadata?.scrollTop,
        scrollLeft: metadata?.scrollLeft,
        target: metadata?.target,
        text: metadata?.text,
        // Include any additional metadata
        ...Object.fromEntries(
          Object.entries(metadata || {}).filter(
            ([key]) =>
              ![
                'userAgent',
                'ip',
                'sessionId',
                'page',
                'x',
                'y',
                'element',
                'key',
                'scrollTop',
                'scrollLeft',
                'target',
                'text',
                'timestamp',
              ].includes(key),
          ),
        ),
      },
    });
  }

  /**
   * Check if a user session is active
   */
  isUserActive(userId: string): boolean {
    return this.activeSessions.has(userId);
  }

  /**
   * Get active sessions info (for monitoring)
   */
  getActiveSessions(): Map<string, UserSession> {
    return new Map(this.activeSessions);
  }

  /**
   * Get session info for a specific user
   */
  getUserSession(userId: string): UserSession | undefined {
    return this.activeSessions.get(userId);
  }

  /**
   * Cleanup and disconnect
   */
  async shutdown(): Promise<void> {
    try {
      // Clear all timeouts
      this.activeSessions.forEach((session) => {
        if (session.timeoutId) {
          clearTimeout(session.timeoutId);
        }
      });
      this.activeSessions.clear();

      // Disconnect Kafka clients
      if (this.producer) {
        await this.producer.disconnect();
      }
      if (this.consumer) {
        await this.consumer.disconnect();
      }

      this.isConnected = false;
      console.log('✅ Kafka User Activity Service shutdown complete');
    } catch (error) {
      console.error('❌ Error during Kafka service shutdown:', error);
    }
  }
}

// Singleton instance
export const kafkaUserActivityService = new KafkaUserActivityService();

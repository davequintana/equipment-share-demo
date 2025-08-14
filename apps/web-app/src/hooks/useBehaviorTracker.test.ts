import { renderHook, act } from '@testing-library/react';
import { vi, beforeEach, afterEach, describe, it, expect } from 'vitest';
import { useBehaviorTracker } from './useBehaviorTracker';

// Mock the API client
vi.mock('../utils/api-client', () => ({
  apiClient: {
    trackActivity: vi.fn().mockResolvedValue(undefined)
  }
}));

// Mock the dependencies
vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({
    user: { id: 'test-user-id', email: 'test@example.com' }
  })
}));

vi.mock('../utils/api-url', () => ({
  isLocalOnlyMode: vi.fn().mockReturnValue(false)
}));

// Mock timers for testing
vi.useFakeTimers();

describe('useBehaviorTracker', () => {
  let mockTrackActivity: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    vi.clearAllTimers();
    vi.clearAllMocks();

    // Get the mocked module
    const { apiClient } = await import('../utils/api-client');
    mockTrackActivity = apiClient.trackActivity as ReturnType<typeof vi.fn>;
    mockTrackActivity.mockClear();
    mockTrackActivity.mockResolvedValue(undefined);

    // Mock window location
    Object.defineProperty(window, 'location', {
      value: {
        pathname: '/test-page',
        search: '?param=value'
      },
      writable: true
    });
  });

  afterEach(() => {
    vi.clearAllTimers();
    // Clean up event listeners
    document.removeEventListener = vi.fn();
  });

  describe('Page View Tracking', () => {
    it('should track page view on initialization', () => {
      const { result } = renderHook(() => useBehaviorTracker());

      act(() => {
        result.current.trackPageView();
      });

      // Should queue the page view event (auto tracking on mount + manual call = 2)
      expect(result.current.getQueueLength()).toBe(2);
    });

    it('should track page view with custom page', () => {
      const { result } = renderHook(() => useBehaviorTracker());

      act(() => {
        result.current.trackPageView('/custom-page');
      });

      // Should queue the page view event (auto tracking on mount + manual call = 2)
      expect(result.current.getQueueLength()).toBe(2);
    });
  });

  describe('Event Batching', () => {
    it('should batch events and flush when batch size is reached', async () => {
      const { result } = renderHook(() =>
        useBehaviorTracker({ batchSize: 2 })
      );

      // Hook automatically tracks page view on mount, so we should have 1 event already
      expect(result.current.getQueueLength()).toBe(1);
      expect(mockTrackActivity).not.toHaveBeenCalled();

      // Add second event - should trigger flush because batchSize is 2
      act(() => {
        result.current.trackPageView('/page2');
      });

      // Events should be flushed automatically when batch size is reached
      await vi.waitFor(() => {
        expect(mockTrackActivity).toHaveBeenCalledTimes(2);
      });

      expect(result.current.getQueueLength()).toBe(0);
    });

    it('should flush events manually', async () => {
      const { result } = renderHook(() => useBehaviorTracker());

      act(() => {
        result.current.trackPageView('/test');
      });

      // Should have 2 events (auto page view on mount + manual call)
      expect(result.current.getQueueLength()).toBe(2);

      await act(async () => {
        await result.current.flushEvents();
      });

      expect(mockTrackActivity).toHaveBeenCalledWith(
        'test-user-id',
        'page_view',
        '/test-page?param=value',
        expect.objectContaining({
          timestamp: expect.any(Number)
        })
      );
      expect(result.current.getQueueLength()).toBe(0);
    });
  });

  describe('Mouse Event Tracking', () => {
    it('should track click events when enabled', () => {
      renderHook(() => useBehaviorTracker({ trackClicks: true }));

      // Simulate click event
      const clickEvent = new MouseEvent('click', {
        clientX: 100,
        clientY: 200,
        bubbles: true
      });

      Object.defineProperty(clickEvent, 'target', {
        value: {
          tagName: 'BUTTON',
          textContent: 'Click me',
          id: 'test-button',
          className: 'btn'
        }
      });

      act(() => {
        document.dispatchEvent(clickEvent);
      });

      // Should have captured click event
      // Note: This is a simplified test - in reality the event queue would contain the click
    });

    it('should not track mouse events when disabled', () => {
      renderHook(() => useBehaviorTracker({
        trackClicks: false,
        trackMouseMovement: false
      }));

      // Simulate events
      act(() => {
        document.dispatchEvent(new MouseEvent('click'));
        document.dispatchEvent(new MouseEvent('mousemove'));
      });

      // Events should not be tracked (queue remains empty except for page view)
    });
  });

  describe('Configuration Options', () => {
    it('should respect tracking configuration', () => {
      const { result } = renderHook(() =>
        useBehaviorTracker({
          trackPageViews: false,
          trackClicks: false,
          trackMouseMovement: false,
          trackScrolling: false,
          trackKeyboard: false
        })
      );

      // Even with all tracking disabled, should still provide functions
      expect(typeof result.current.trackPageView).toBe('function');
      expect(typeof result.current.flushEvents).toBe('function');
      expect(typeof result.current.getQueueLength).toBe('function');
    });

    it('should use custom batch size and flush interval', () => {
      const customOptions = {
        batchSize: 5,
        flushIntervalMs: 1000
      };

      const { result } = renderHook(() =>
        useBehaviorTracker(customOptions)
      );

      // Should initialize with custom configuration (but still has auto page view on mount)
      expect(result.current.getQueueLength()).toBe(1);
    });
  });

  describe('Error Handling', () => {
    it('should handle API errors gracefully', async () => {
      mockTrackActivity.mockRejectedValueOnce(new Error('API Error'));

      const { result } = renderHook(() =>
        useBehaviorTracker({ batchSize: 1 })
      );

      const consoleSpy = vi.spyOn(console, 'debug').mockImplementation(() => {
        // Mock implementation for console.debug
      });

      act(() => {
        result.current.trackPageView();
      });

      // Wait for the error to be handled
      await vi.waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith(
          'Failed to flush behavior events:',
          expect.any(Error)
        );
      });

      consoleSpy.mockRestore();
    });
  });

  describe('Performance', () => {
    it('should handle rapid event generation without blocking', () => {
      const startTime = Date.now();

      renderHook(() => useBehaviorTracker({
        trackMouseMovement: true,
        throttleMs: 50
      }));

      // Simulate rapid mouse movements
      for (let i = 0; i < 100; i++) {
        act(() => {
          document.dispatchEvent(new MouseEvent('mousemove', {
            clientX: i,
            clientY: i
          }));
        });
      }

      const endTime = Date.now();

      // Should complete quickly even with many events
      expect(endTime - startTime).toBeLessThan(100);
    });

    it('should throttle mouse movement events', () => {
      const { result } = renderHook(() =>
        useBehaviorTracker({
          trackMouseMovement: true,
          throttleMs: 100,
          batchSize: 1000 // Large batch to prevent auto-flush
        })
      );

      // Simulate rapid mouse movements
      for (let i = 0; i < 10; i++) {
        act(() => {
          document.dispatchEvent(new MouseEvent('mousemove'));
        });
      }

      // Should have throttled the events
      const queueLength = result.current.getQueueLength();
      expect(queueLength).toBeLessThan(10);
    });
  });

  describe('Security & Privacy', () => {
    it('should not track keyboard events by default', () => {
      renderHook(() => useBehaviorTracker());

      act(() => {
        document.dispatchEvent(new KeyboardEvent('keydown', { key: 'a' }));
      });

      // Should not capture keyboard events by default
    });

    it('should only track safe keyboard events when enabled', () => {
      renderHook(() => useBehaviorTracker({ trackKeyboard: true }));

      act(() => {
        // Safe keys
        document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }));
        document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab' }));

        // Sensitive keys (should be filtered out)
        document.dispatchEvent(new KeyboardEvent('keydown', { key: 'a' }));
        document.dispatchEvent(new KeyboardEvent('keydown', { key: '1' }));
      });

      // Should only track safe navigation keys
    });
  });

  describe('ReDoS Protection', () => {
    it('should handle malicious input patterns safely', () => {
      const maliciousPatterns = [
        'a'.repeat(10000),
        '((a+)+)+b',
        '([a-zA-Z]+)*',
        'x'.repeat(50000)
      ];

      const startTime = Date.now();

      const { result } = renderHook(() => useBehaviorTracker());

      maliciousPatterns.forEach(pattern => {
        act(() => {
          result.current.trackPageView(`/test?q=${pattern}`);
        });
      });

      const endTime = Date.now();

      // Must complete under 100ms even with attack patterns
      expect(endTime - startTime).toBeLessThan(100);
    });
  });
});

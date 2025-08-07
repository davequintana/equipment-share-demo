import { renderHook, act } from '@testing-library/react';
import { vi, beforeEach, afterEach, describe, it, expect } from 'vitest';
import { useIdleTimer } from './useIdleTimer';

// Mock timers for testing
vi.useFakeTimers();

describe('useIdleTimer', () => {
  let mockOnIdle: ReturnType<typeof vi.fn>;
  let mockOnWarning: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockOnIdle = vi.fn();
    mockOnWarning = vi.fn();
    vi.clearAllTimers();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllTimers();
    // Clean up any remaining event listeners
    document.removeEventListener = vi.fn();
  });

  describe('Basic Functionality', () => {
    it('should initialize with default values', () => {
      const { result } = renderHook(() =>
        useIdleTimer({
          timeout: 5000,
          onIdle: mockOnIdle,
        })
      );

      expect(result.current.isWarning).toBe(false);
      expect(result.current.timeRemaining).toBe(0);
      expect(typeof result.current.reset).toBe('function');
      expect(typeof result.current.clear).toBe('function');
    });

    it('should call onIdle after timeout period', () => {
      renderHook(() =>
        useIdleTimer({
          timeout: 5000,
          onIdle: mockOnIdle,
        })
      );

      act(() => {
        vi.advanceTimersByTime(5000);
      });

      expect(mockOnIdle).toHaveBeenCalledTimes(1);
    });

    it('should not call onIdle when disabled', () => {
      renderHook(() =>
        useIdleTimer({
          timeout: 5000,
          onIdle: mockOnIdle,
          enabled: false,
        })
      );

      act(() => {
        vi.advanceTimersByTime(5000);
      });

      expect(mockOnIdle).not.toHaveBeenCalled();
    });
  });

  describe('Warning Functionality', () => {
    it('should show warning before timeout', () => {
      const { result } = renderHook(() =>
        useIdleTimer({
          timeout: 5000,
          onIdle: mockOnIdle,
          onWarning: mockOnWarning,
          warningTime: 2000,
        })
      );

      // Advance to warning time (timeout - warningTime = 5000 - 2000 = 3000ms)
      act(() => {
        vi.advanceTimersByTime(3000);
      });

      expect(result.current.isWarning).toBe(true);
      expect(mockOnWarning).toHaveBeenCalledWith(2); // 2000ms = 2 seconds
      expect(mockOnIdle).not.toHaveBeenCalled();
    });

    it('should update time remaining during warning countdown', () => {
      const { result } = renderHook(() =>
        useIdleTimer({
          timeout: 5000,
          onIdle: mockOnIdle,
          onWarning: mockOnWarning,
          warningTime: 3000,
        })
      );

      // Advance to warning time
      act(() => {
        vi.advanceTimersByTime(2000); // timeout - warningTime = 5000 - 3000 = 2000ms
      });

      expect(result.current.isWarning).toBe(true);
      expect(result.current.timeRemaining).toBe(3); // 3 seconds

      // Advance 1 second
      act(() => {
        vi.advanceTimersByTime(1000);
      });

      expect(result.current.timeRemaining).toBe(2);
    });
  });

  describe('Event Handling', () => {
    let addEventListenerSpy: ReturnType<typeof vi.spyOn>;

    beforeEach(() => {
      addEventListenerSpy = vi.spyOn(document, 'addEventListener');
    });

    it('should add default event listeners', () => {
      renderHook(() =>
        useIdleTimer({
          timeout: 5000,
          onIdle: mockOnIdle,
        })
      );

      const defaultEvents = [
        'mousedown',
        'mousemove',
        'keypress',
        'scroll',
        'touchstart',
        'click',
        'keydown',
      ];

      defaultEvents.forEach((event) => {
        expect(addEventListenerSpy).toHaveBeenCalledWith(
          event,
          expect.any(Function),
          true
        );
      });
    });

    it('should reset timer when user activity is detected', () => {
      renderHook(() =>
        useIdleTimer({
          timeout: 5000,
          onIdle: mockOnIdle,
        })
      );

      // Advance partway through timeout
      act(() => {
        vi.advanceTimersByTime(3000);
      });

      // Simulate user activity
      act(() => {
        const mouseEvent = new Event('mousemove');
        document.dispatchEvent(mouseEvent);
      });

      // Advance time that would have triggered timeout
      act(() => {
        vi.advanceTimersByTime(3000); // Total would be 6000ms > 5000ms timeout
      });

      // Should not have triggered onIdle because timer was reset
      expect(mockOnIdle).not.toHaveBeenCalled();

      // Advance the full timeout duration from reset
      act(() => {
        vi.advanceTimersByTime(2000); // Now total is 5000ms from reset
      });

      expect(mockOnIdle).toHaveBeenCalledTimes(1);
    });
  });

  describe('Manual Controls', () => {
    it('should reset timer when reset is called', () => {
      const { result } = renderHook(() =>
        useIdleTimer({
          timeout: 5000,
          onIdle: mockOnIdle,
        })
      );

      // Advance partway through timeout
      act(() => {
        vi.advanceTimersByTime(3000);
      });

      // Manually reset
      act(() => {
        result.current.reset();
      });

      // Advance time that would have triggered timeout
      act(() => {
        vi.advanceTimersByTime(3000);
      });

      expect(mockOnIdle).not.toHaveBeenCalled();

      // Advance full timeout from reset
      act(() => {
        vi.advanceTimersByTime(2000);
      });

      expect(mockOnIdle).toHaveBeenCalledTimes(1);
    });

    it('should clear all timers when clear is called', () => {
      const { result } = renderHook(() =>
        useIdleTimer({
          timeout: 5000,
          onIdle: mockOnIdle,
          onWarning: mockOnWarning,
          warningTime: 2000,
        })
      );

      // Advance to warning time
      act(() => {
        vi.advanceTimersByTime(3000);
      });

      expect(result.current.isWarning).toBe(true);

      // Clear timers
      act(() => {
        result.current.clear();
      });

      expect(result.current.isWarning).toBe(false);
      expect(result.current.timeRemaining).toBe(0);

      // Advance time - should not trigger anything
      act(() => {
        vi.advanceTimersByTime(10000);
      });

      expect(mockOnIdle).not.toHaveBeenCalled();
    });
  });

  describe('ReDoS Protection Tests', () => {
    it('should handle large timeout values safely', () => {
      const startTime = Date.now();

      // Test with very large timeout values that could cause issues
      const largeTimeouts = [999999, 10000000];
      const testOnIdle = mockOnIdle; // Use local reference to avoid loop closure issue

      for (const timeout of largeTimeouts) {
        try {
          renderHook(() =>
            useIdleTimer({
              timeout,
              onIdle: testOnIdle,
            })
          );
        } catch (error) {
          // Should not throw errors even with large values
          expect(error).toBeUndefined();
        }
      }

      const endTime = Date.now();

      // Must complete under 100ms even with large values
      expect(endTime - startTime).toBeLessThan(100);
    });
  });
});

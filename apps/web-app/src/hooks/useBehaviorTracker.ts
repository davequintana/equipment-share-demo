import { useCallback, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { apiClient } from '../utils/api-client';
import { isLocalOnlyMode } from '../utils/api-url';

interface BehaviorTrackingOptions {
  trackPageViews?: boolean;
  trackClicks?: boolean;
  trackMouseMovement?: boolean;
  trackScrolling?: boolean;
  trackKeyboard?: boolean;
  throttleMs?: number;
  batchSize?: number;
  flushIntervalMs?: number;
}

interface UserBehaviorEvent {
  eventType: 'page_view' | 'click' | 'mouse_move' | 'scroll' | 'keyboard' | 'focus' | 'blur';
  timestamp: number;
  page: string;
  metadata?: {
    x?: number;
    y?: number;
    element?: string;
    key?: string;
    scrollTop?: number;
    scrollLeft?: number;
    target?: string;
    text?: string;
  };
}

/**
 * Advanced user behavior tracking hook
 * Captures detailed user interactions and sends them to Kafka for analytics
 */
export const useBehaviorTracker = (options: BehaviorTrackingOptions = {}) => {
  const { user } = useAuth();
  const eventQueueRef = useRef<UserBehaviorEvent[]>([]);
  const lastMouseMoveRef = useRef<number>(0);

  const {
    trackPageViews = true,
    trackClicks = true,
    trackMouseMovement = true,
    trackScrolling = true,
    trackKeyboard = false, // Disabled by default for privacy
    throttleMs = 100, // Throttle mouse moves to 100ms
    batchSize = 10,
    flushIntervalMs = 5000, // Flush every 5 seconds
  } = options;

  const getCurrentPage = useCallback(() => {
    if (typeof window === 'undefined') return '/';
    return window.location.pathname + window.location.search;
  }, []);

  const flushEvents = useCallback(async () => {
    if (!user || isLocalOnlyMode() || eventQueueRef.current.length === 0) {
      return;
    }

    const eventsToSend = [...eventQueueRef.current];
    eventQueueRef.current = [];

    try {
      // Send all events in batch
      for (const event of eventsToSend) {
        await apiClient.trackActivity(user.id, event.eventType, event.page, {
          ...event.metadata,
          timestamp: event.timestamp,
        });
      }
      console.debug(`Successfully sent ${eventsToSend.length} behavior events`);
    } catch (error) {
      console.debug('Failed to flush behavior events:', error);
      // Re-queue events if they failed to send (with limit to prevent infinite queue growth)
      if (eventQueueRef.current.length < 50) {
        eventQueueRef.current.unshift(...eventsToSend);
      }
    }
  }, [user]);

  const addEventToQueue = useCallback((event: UserBehaviorEvent) => {
    eventQueueRef.current.push(event);

    // Auto-flush if batch size reached
    if (eventQueueRef.current.length >= batchSize) {
      flushEvents();
    }
  }, [batchSize, flushEvents]);

  // Auto-flush events periodically
  useEffect(() => {
    if (!user || isLocalOnlyMode()) return;

    const interval = setInterval(flushEvents, flushIntervalMs);
    return () => clearInterval(interval);
  }, [user, flushEvents, flushIntervalMs]);

  // Track page views
  const trackPageView = useCallback((page?: string) => {
    if (!trackPageViews) return;

    const currentPage = page || getCurrentPage();
    addEventToQueue({
      eventType: 'page_view',
      timestamp: Date.now(),
      page: currentPage,
    });
  }, [trackPageViews, getCurrentPage, addEventToQueue]);

  // Track clicks
  const handleClick = useCallback((event: MouseEvent) => {
    if (!trackClicks) return;

    const target = event.target as Element | null;
    if (!target?.tagName) return;

    const element = target.tagName.toLowerCase();
    const text = target.textContent?.slice(0, 100) || '';
    const id = target.id;
    const className = target.className;

    addEventToQueue({
      eventType: 'click',
      timestamp: Date.now(),
      page: getCurrentPage(),
      metadata: {
        x: event.clientX,
        y: event.clientY,
        element,
        target: id || className || element,
        text,
      },
    });
  }, [trackClicks, getCurrentPage, addEventToQueue]);

  // Track mouse movement (throttled)
  const handleMouseMove = useCallback((event: MouseEvent) => {
    if (!trackMouseMovement) return;

    const now = Date.now();
    if (now - lastMouseMoveRef.current < throttleMs) return;
    lastMouseMoveRef.current = now;

    addEventToQueue({
      eventType: 'mouse_move',
      timestamp: now,
      page: getCurrentPage(),
      metadata: {
        x: event.clientX,
        y: event.clientY,
      },
    });
  }, [trackMouseMovement, throttleMs, getCurrentPage, addEventToQueue]);

  // Track scrolling (throttled)
  const handleScroll = useCallback(() => {
    if (!trackScrolling) return;

    addEventToQueue({
      eventType: 'scroll',
      timestamp: Date.now(),
      page: getCurrentPage(),
      metadata: {
        scrollTop: window.scrollY,
        scrollLeft: window.scrollX,
      },
    });
  }, [trackScrolling, getCurrentPage, addEventToQueue]);

  // Track keyboard events (optional - privacy sensitive)
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (!trackKeyboard) return;

    // Only track non-sensitive keys
    const allowedKeys = ['Enter', 'Tab', 'Escape', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'];
    if (!allowedKeys.includes(event.key)) return;

    addEventToQueue({
      eventType: 'keyboard',
      timestamp: Date.now(),
      page: getCurrentPage(),
      metadata: {
        key: event.key,
      },
    });
  }, [trackKeyboard, getCurrentPage, addEventToQueue]);

  // Set up event listeners
  useEffect(() => {
    if (!user || isLocalOnlyMode()) return;

    const events: Array<[string, EventListener, boolean]> = [];

    if (trackClicks) {
      events.push(['click', handleClick as EventListener, true]);
    }

    if (trackMouseMovement) {
      events.push(['mousemove', handleMouseMove as EventListener, true]);
    }

    if (trackScrolling) {
      const throttledScroll = throttle(handleScroll, throttleMs);
      events.push(['scroll', throttledScroll, true]);
    }

    if (trackKeyboard) {
      events.push(['keydown', handleKeyDown as EventListener, true]);
    }

    // Add event listeners
    events.forEach(([event, handler, capture]) => {
      document.addEventListener(event, handler, capture);
    });

    // Cleanup
    return () => {
      events.forEach(([event, handler, capture]) => {
        document.removeEventListener(event, handler, capture);
      });

      // Flush any remaining events
      flushEvents();
    };
  }, [user, trackClicks, trackMouseMovement, trackScrolling, trackKeyboard,
      handleClick, handleMouseMove, handleScroll, handleKeyDown, throttleMs, flushEvents]);

  // Track page view on mount and route changes
  useEffect(() => {
    trackPageView();

    // Listen for route changes (if using React Router)
    const handleRouteChange = () => trackPageView();
    window.addEventListener('popstate', handleRouteChange);

    return () => {
      window.removeEventListener('popstate', handleRouteChange);
    };
  }, [trackPageView]);

  // Flush events before page unload
  useEffect(() => {
    const handleBeforeUnload = () => {
      flushEvents();
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [flushEvents]);

  return {
    trackPageView,
    flushEvents,
    getQueueLength: () => eventQueueRef.current.length,
  };
};

// Utility function for throttling
function throttle<T extends (...args: unknown[]) => unknown>(func: T, limit: number): T {
  let inThrottle: boolean;
  return ((...args: unknown[]) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  }) as T;
}

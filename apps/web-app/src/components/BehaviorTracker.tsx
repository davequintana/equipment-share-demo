import React, { useEffect } from 'react';
import { useBehaviorTracker } from '../hooks/useBehaviorTracker';

interface BehaviorTrackerProps {
  /**
   * Configuration options for behavior tracking
   */
  options?: {
    trackPageViews?: boolean;
    trackClicks?: boolean;
    trackMouseMovement?: boolean;
    trackScrolling?: boolean;
    trackKeyboard?: boolean;
    throttleMs?: number;
    batchSize?: number;
    flushIntervalMs?: number;
  };
  /**
   * Whether to track mouse movement (can be performance intensive)
   */
  enableMouseTracking?: boolean;
  /**
   * Whether to track keyboard events (privacy sensitive)
   */
  enableKeyboardTracking?: boolean;
}

/**
 * BehaviorTracker component for comprehensive user interaction tracking
 *
 * This component captures:
 * - Page views and navigation
 * - Mouse clicks and movements
 * - Scroll behavior
 * - Keyboard interactions (optional)
 *
 * All events are batched and sent to Kafka for analytics
 */
export const BehaviorTracker: React.FC<BehaviorTrackerProps> = ({
  options = {},
  enableMouseTracking = true,
  enableKeyboardTracking = false,
}) => {
  const {
    trackPageViews = true,
    trackClicks = true,
    trackMouseMovement = enableMouseTracking,
    trackScrolling = true,
    trackKeyboard = enableKeyboardTracking,
    throttleMs = 200, // Slightly higher throttle for better performance
    batchSize = 15,
    flushIntervalMs = 10000, // Flush every 10 seconds
  } = options;

  const { trackPageView, getQueueLength } = useBehaviorTracker({
    trackPageViews,
    trackClicks,
    trackMouseMovement,
    trackScrolling,
    trackKeyboard,
    throttleMs,
    batchSize,
    flushIntervalMs,
  });

  // Track initial page view
  useEffect(() => {
    trackPageView();
  }, [trackPageView]);

  // Debug mode - log queue length periodically (development only)
  useEffect(() => {
    if (import.meta.env.PROD) {
      return;
    }

    const interval = setInterval(() => {
      const queueLength = getQueueLength();
      if (queueLength > 0) {
        console.debug(
          `[BehaviorTracker] Queue length: ${queueLength} events pending`,
        );
      }
    }, 30000); // Every 30 seconds

    return () => clearInterval(interval);
  }, [getQueueLength]);

  // This component renders nothing but manages behavior tracking
  return null;
};

/**
 * Higher-order component to wrap any component with behavior tracking
 */
export const withBehaviorTracking = <P extends object>(
  Component: React.ComponentType<P>,
  trackerOptions?: BehaviorTrackerProps['options'],
) => {
  const WrappedComponent: React.FC<P> = (props) => {
    return (
      <>
        <BehaviorTracker options={trackerOptions} />
        <Component {...props} />
      </>
    );
  };

  WrappedComponent.displayName = `withBehaviorTracking(${Component.displayName || Component.name})`;
  return WrappedComponent;
};

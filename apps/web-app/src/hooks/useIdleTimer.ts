import { useEffect, useRef, useCallback, useState } from 'react';

interface UseIdleTimerOptions {
  timeout: number; // in milliseconds
  onIdle: () => void;
  onWarning?: (timeRemaining: number) => void; // Called when warning should be shown
  warningTime?: number; // milliseconds before timeout to show warning
  enabled?: boolean;
  events?: string[];
}

const DEFAULT_EVENTS = [
  'mousedown',
  'mousemove',
  'keypress',
  'scroll',
  'touchstart',
  'click',
  'keydown',
];

export const useIdleTimer = ({
  timeout,
  onIdle,
  onWarning,
  warningTime = 60000, // Default 1 minute warning
  enabled = true,
  events = DEFAULT_EVENTS,
}: UseIdleTimerOptions) => {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const warningTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const onIdleRef = useRef(onIdle);
  const onWarningRef = useRef(onWarning);
  const enabledRef = useRef(enabled);
  const [isWarning, setIsWarning] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(0);

  // Update refs when props change
  useEffect(() => {
    onIdleRef.current = onIdle;
  }, [onIdle]);

  useEffect(() => {
    onWarningRef.current = onWarning;
  }, [onWarning]);

  useEffect(() => {
    enabledRef.current = enabled;
  }, [enabled]);

  const clearTimers = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    if (warningTimeoutRef.current) {
      clearTimeout(warningTimeoutRef.current);
      warningTimeoutRef.current = null;
    }
    setIsWarning(false);
    setTimeRemaining(0);
  }, []);

  const startWarning = useCallback(() => {
    if (!enabledRef.current || !onWarningRef.current) return;

    setIsWarning(true);
    const warningDuration = warningTime;
    setTimeRemaining(Math.ceil(warningDuration / 1000));

    onWarningRef.current(Math.ceil(warningDuration / 1000));

    // Update countdown every second during warning
    const countdown = setInterval(() => {
      setTimeRemaining(prev => {
        const newTime = prev - 1;
        if (newTime <= 0) {
          clearInterval(countdown);
          return 0;
        }
        return newTime;
      });
    }, 1000);

    // Clean up countdown when component unmounts or timers reset
    setTimeout(() => clearInterval(countdown), warningDuration);
  }, [warningTime]);

  const resetTimer = useCallback(() => {
    if (!enabledRef.current) return;

    clearTimers();

    const warningDelay = timeout - warningTime;

    // Set warning timer if we have onWarning callback
    if (onWarningRef.current && warningDelay > 0) {
      warningTimeoutRef.current = setTimeout(startWarning, warningDelay);
    }

    // Set main timeout timer
    timeoutRef.current = setTimeout(() => {
      if (enabledRef.current) {
        onIdleRef.current();
      }
    }, timeout);
  }, [timeout, warningTime, clearTimers, startWarning]);

  const handleActivity = useCallback(() => {
    if (!enabledRef.current) return;
    resetTimer();
  }, [resetTimer]);

  // Initialize timer and event listeners
  useEffect(() => {
    if (!enabled) {
      clearTimers();
      return;
    }

    // Start the timer
    resetTimer();

    // Add event listeners
    events.forEach((event) => {
      document.addEventListener(event, handleActivity, true);
    });

    // Cleanup function
    return () => {
      clearTimers();
      events.forEach((event) => {
        document.removeEventListener(event, handleActivity, true);
      });
    };
  }, [enabled, events, handleActivity, resetTimer, clearTimers]);

  return {
    reset: resetTimer,
    clear: clearTimers,
    isWarning,
    timeRemaining,
  };
};

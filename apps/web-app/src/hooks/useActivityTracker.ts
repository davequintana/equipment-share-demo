import { useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { apiClient } from '../utils/api-client';
import { isLocalOnlyMode } from '../utils/api-url';

/**
 * Hook for tracking user activity to maintain session state
 * @returns Function to track user activity
 */
export const useActivityTracker = () => {
  const { user } = useAuth();

  /**
   * Track user activity by sending an event to Kafka
   * This helps maintain the session and prevents automatic logout
   * @param action - The type of activity being tracked
   * @param page - The page where the activity occurred
   */
  const trackActivity = useCallback(
    async (action = 'activity', page?: string) => {
      // Don't track activity in local mode or if no user
      if (!user || isLocalOnlyMode()) {
        return;
      }

      try {
        await apiClient.trackActivity(user.id, action, page);
      } catch (error) {
        // Silently fail - don't disrupt user experience
        console.debug('Failed to track activity:', error);
      }
    },
    [user],
  );

  return { trackActivity };
};

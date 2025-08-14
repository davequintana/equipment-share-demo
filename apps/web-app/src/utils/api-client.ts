import { isLocalOnlyMode } from './api-url';

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

class ApiClient {
  private readonly baseUrl: string;
  private token: string | null = null;

  constructor() {
    if (isLocalOnlyMode()) {
      this.baseUrl = '';
    } else if (typeof window !== 'undefined') {
      // Browser: use empty baseUrl to leverage Vite proxy (/api -> localhost:3334)
      this.baseUrl = '';
    } else {
      // Server-side: use direct API URL for SSR
      this.baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3334';
    }
  }

  setToken(token: string | null) {
    this.token = token;
  }

  private getHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (this.token) {
      headers.Authorization = `Bearer ${this.token}`;
    }

    return headers;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;

    const response = await fetch(url, {
      ...options,
      headers: {
        ...this.getHeaders(),
        ...options.headers,
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Network error' }));
      throw new Error(error.error || error.message || `HTTP ${response.status}`);
    }

    return response.json();
  }

  /**
   * Track user activity to maintain session
   * @param userId - The user ID to track activity for
   * @param action - The type of activity (optional)
   * @param page - The page where activity occurred (optional)
   * @param metadata - Additional metadata for the activity (optional)
   */
  async trackActivity(userId: string, action = 'activity', page?: string, metadata?: Record<string, unknown>): Promise<void> {
    if (!this.token) {
      console.debug('trackActivity: No authentication token available');
      throw new Error('No authentication token available');
    }

    const url = `${this.baseUrl}/api/user/activity`;
    console.debug('trackActivity: Making request to', url, { action, page, metadata });

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.token}`,
      },
      body: JSON.stringify({ action, page, metadata }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.debug('trackActivity error:', response.status, response.statusText, errorText);
      throw new Error(`Failed to track activity: ${response.status} ${response.statusText} - ${errorText}`);
    }

    console.debug('trackActivity: Success', response.status);
  }

  async logout(): Promise<ApiResponse<{ message: string }>> {
    if (isLocalOnlyMode() || !this.token) {
      // In local-only mode, just return success
      return { success: true, data: { message: 'Logged out successfully' } };
    }

    try {
      const response = await this.request<{ success: boolean; message: string }>('/api/auth/logout', {
        method: 'POST',
      });

      return {
        success: true,
        data: { message: response.message },
      };
    } catch (error) {
      console.warn('Failed to logout via API:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        data: { message: 'Logout failed' },
      };
    }
  }
}

export const apiClient = new ApiClient();

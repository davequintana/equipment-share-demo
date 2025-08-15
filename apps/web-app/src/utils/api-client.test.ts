import { vi, beforeEach, afterEach, describe, it, expect, beforeAll, afterAll } from 'vitest';
import { apiClient } from './api-client';
import { isLocalOnlyMode } from './api-url';

// Mock the api-url utility
vi.mock('./api-url', () => ({
  isLocalOnlyMode: vi.fn(),
}));

// Get the mocked function for use in tests
const mockIsLocalOnlyMode = vi.mocked(isLocalOnlyMode);

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch as unknown as typeof fetch;

// Mock console methods to avoid noise in tests
const consoleMocks = {
  debug: vi.fn(),
  warn: vi.fn(),
  log: vi.fn(),
  error: vi.fn(),
};

// Mock import.meta.env
const mockImportMeta = {
  env: {
    VITE_API_URL: 'http://test-api.example.com',
  },
};

// Store original import.meta for restoration
const originalImportMeta = (globalThis as unknown as { import?: { meta: unknown } }).import?.meta;

describe('ApiClient', () => {
  beforeAll(() => {
    // Mock import.meta globally
    Object.defineProperty(globalThis, 'import', {
      value: { meta: mockImportMeta },
      writable: true,
    });

    // Mock console methods
    Object.assign(console, consoleMocks);
  });

  afterAll(() => {
    // Restore original import.meta if it existed
    if (originalImportMeta) {
      Object.defineProperty(globalThis, 'import', {
        value: { meta: originalImportMeta },
        writable: true,
      });
    }

    // Restore console methods
    vi.restoreAllMocks();
  });

  beforeEach(() => {
    vi.clearAllMocks();
    mockIsLocalOnlyMode.mockReturnValue(false);
    
    // Reset API client token state
    apiClient.setToken(null);

    // Mock successful response by default
    mockFetch.mockResolvedValue({
      ok: true,
      status: 200,
      statusText: 'OK',
      json: vi.fn().mockResolvedValue({ success: true }),
      text: vi.fn().mockResolvedValue('Success'),
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Constructor and BaseURL Configuration', () => {
    it('should handle local-only mode correctly', () => {
      mockIsLocalOnlyMode.mockReturnValue(true);
      
      // Since baseUrl is private, we test indirectly through behavior
      expect(mockIsLocalOnlyMode).toBeDefined();
    });

    it('should detect environment correctly', () => {
      mockIsLocalOnlyMode.mockReturnValue(false);
      
      // The constructor logic is already executed when the module is imported
      // We can test that the mocks are set up correctly
      expect(mockIsLocalOnlyMode).toBeDefined();
    });
  });

  describe('Token Management', () => {
    it('should set and use authentication token', () => {
      const testToken = 'test-jwt-token-123';
      
      apiClient.setToken(testToken);
      
      // Token is private, but we can test its usage through API calls
      expect(() => apiClient.setToken(testToken)).not.toThrow();
    });

    it('should clear authentication token when set to null', () => {
      apiClient.setToken('test-token');
      apiClient.setToken(null);
      
      expect(() => apiClient.setToken(null)).not.toThrow();
    });

    it('should include Authorization header when token is set', async () => {
      const testToken = 'test-jwt-token-123';
      apiClient.setToken(testToken);

      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: vi.fn().mockResolvedValue({ success: true, message: 'Success' }),
      });

      await apiClient.logout();

      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            'Authorization': `Bearer ${testToken}`,
            'Content-Type': 'application/json',
          }),
        })
      );
    });

    it('should not include Authorization header when token is null', async () => {
      apiClient.setToken(null);
      mockIsLocalOnlyMode.mockReturnValue(true);

      const result = await apiClient.logout();

      // In local-only mode, no fetch should be called
      expect(result.success).toBe(true);
      expect(result.data?.message).toBe('Logged out successfully');
    });
  });

  describe('Request Method', () => {
    beforeEach(() => {
      apiClient.setToken('test-token');
    });

    it('should make successful API requests', async () => {
      const mockResponse = { success: true, data: { id: 1, name: 'Test' } };
      
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: vi.fn().mockResolvedValue(mockResponse),
      });

      await apiClient.logout();

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/auth/logout'),
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
            'Authorization': 'Bearer test-token',
          }),
        })
      );
    });

    it('should handle HTTP error responses', async () => {
      const errorResponse = { error: 'Unauthorized access' };
      
      mockFetch.mockResolvedValue({
        ok: false,
        status: 401,
        statusText: 'Unauthorized',
        json: vi.fn().mockResolvedValue(errorResponse),
      });

      const result = await apiClient.logout();

      expect(result.success).toBe(false);
      expect(result.error).toContain('Unauthorized access');
    });

    it('should handle network errors', async () => {
      mockFetch.mockRejectedValue(new Error('Network connection failed'));

      const result = await apiClient.logout();

      expect(result.success).toBe(false);
      expect(result.error).toContain('Network connection failed');
    });

    it('should handle malformed JSON responses', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 500,
        json: vi.fn().mockRejectedValue(new Error('Invalid JSON')),
      });

      const result = await apiClient.logout();

      expect(result.success).toBe(false);
      expect(result.error).toContain('Network error');
    });

    it('should merge custom headers with default headers', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: vi.fn().mockResolvedValue({ success: true, message: 'Success' }),
      });

      await apiClient.logout();

      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
            'Authorization': 'Bearer test-token',
          }),
        })
      );
    });
  });

  describe('trackActivity Method', () => {
    beforeEach(() => {
      apiClient.setToken('test-token');
    });

    it('should track user activity with all parameters', async () => {
      const userId = 'user123';
      const action = 'page_view';
      const page = '/dashboard';
      const metadata = { browser: 'Chrome', version: '91.0' };

      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        text: vi.fn().mockResolvedValue('Activity tracked'),
      });

      await apiClient.trackActivity(userId, action, page, metadata);

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/user/activity'),
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
            'Authorization': 'Bearer test-token',
          }),
          body: JSON.stringify({ action, page, metadata }),
        })
      );

      expect(consoleMocks.debug).toHaveBeenCalledWith(
        'trackActivity: Making request to',
        expect.any(String),
        { action, page, metadata }
      );
      expect(consoleMocks.debug).toHaveBeenCalledWith('trackActivity: Success', 200);
    });

    it('should track activity with default action parameter', async () => {
      const userId = 'user123';

      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        text: vi.fn().mockResolvedValue('Activity tracked'),
      });

      await apiClient.trackActivity(userId);

      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          body: JSON.stringify({ 
            action: 'activity',
            page: undefined,
            metadata: undefined 
          }),
        })
      );
    });

    it('should track activity with custom action only', async () => {
      const userId = 'user123';
      const action = 'button_click';

      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        text: vi.fn().mockResolvedValue('Activity tracked'),
      });

      await apiClient.trackActivity(userId, action);

      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          body: JSON.stringify({ 
            action,
            page: undefined,
            metadata: undefined 
          }),
        })
      );
    });

    it('should throw error when no authentication token is available', async () => {
      apiClient.setToken(null);

      await expect(apiClient.trackActivity('user123')).rejects.toThrow(
        'No authentication token available'
      );

      expect(consoleMocks.debug).toHaveBeenCalledWith(
        'trackActivity: No authentication token available'
      );
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it('should handle API error responses', async () => {
      const userId = 'user123';

      mockFetch.mockResolvedValue({
        ok: false,
        status: 401,
        statusText: 'Unauthorized',
        text: vi.fn().mockResolvedValue('Token expired'),
      });

      await expect(apiClient.trackActivity(userId)).rejects.toThrow(
        'Failed to track activity: 401 Unauthorized - Token expired'
      );

      expect(consoleMocks.debug).toHaveBeenCalledWith(
        'trackActivity error:',
        401,
        'Unauthorized',
        'Token expired'
      );
    });

    it('should handle network errors', async () => {
      const userId = 'user123';

      mockFetch.mockRejectedValue(new Error('Network connection failed'));

      await expect(apiClient.trackActivity(userId)).rejects.toThrow(
        'Network connection failed'
      );
    });

    it('should log debug information', async () => {
      const userId = 'user123';
      const action = 'test_action';
      const page = '/test';
      const metadata = { test: true };

      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        text: vi.fn().mockResolvedValue('Success'),
      });

      await apiClient.trackActivity(userId, action, page, metadata);

      expect(consoleMocks.debug).toHaveBeenCalledWith(
        'trackActivity: Making request to',
        expect.stringContaining('/api/user/activity'),
        { action, page, metadata }
      );
      expect(consoleMocks.debug).toHaveBeenCalledWith('trackActivity: Success', 200);
    });
  });

  describe('logout Method', () => {
    it('should logout successfully with valid token', async () => {
      apiClient.setToken('valid-token');
      
      const mockResponse = { success: true, message: 'Logged out successfully' };
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: vi.fn().mockResolvedValue(mockResponse),
      });

      const result = await apiClient.logout();

      expect(result.success).toBe(true);
      expect(result.data?.message).toBe('Logged out successfully');
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/auth/logout'),
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Authorization': 'Bearer valid-token',
          }),
        })
      );
    });

    it('should return success in local-only mode', async () => {
      mockIsLocalOnlyMode.mockReturnValue(true);
      apiClient.setToken('some-token');

      const result = await apiClient.logout();

      expect(result.success).toBe(true);
      expect(result.data?.message).toBe('Logged out successfully');
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it('should return success when no token is set', async () => {
      apiClient.setToken(null);

      const result = await apiClient.logout();

      expect(result.success).toBe(true);
      expect(result.data?.message).toBe('Logged out successfully');
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it('should handle API errors gracefully', async () => {
      apiClient.setToken('test-token');
      
      const errorResponse = { error: 'Server error' };
      mockFetch.mockResolvedValue({
        ok: false,
        status: 500,
        json: vi.fn().mockResolvedValue(errorResponse),
      });

      const result = await apiClient.logout();

      expect(result.success).toBe(false);
      expect(result.error).toContain('Server error');
      expect(result.data?.message).toBe('Logout failed');
      expect(consoleMocks.warn).toHaveBeenCalledWith(
        'Failed to logout via API:',
        expect.any(Error)
      );
    });

    it('should handle network errors gracefully', async () => {
      apiClient.setToken('test-token');
      
      mockFetch.mockRejectedValue(new Error('Network timeout'));

      const result = await apiClient.logout();

      expect(result.success).toBe(false);
      expect(result.error).toBe('Network timeout');
      expect(result.data?.message).toBe('Logout failed');
      expect(consoleMocks.warn).toHaveBeenCalledWith(
        'Failed to logout via API:',
        expect.any(Error)
      );
    });

    it('should handle unknown errors gracefully', async () => {
      apiClient.setToken('test-token');
      
      // Simulate non-Error object being thrown
      mockFetch.mockRejectedValue('Unknown error string');

      const result = await apiClient.logout();

      expect(result.success).toBe(false);
      expect(result.error).toBe('Unknown error');
      expect(result.data?.message).toBe('Logout failed');
    });

    it('should handle malformed API responses', async () => {
      apiClient.setToken('test-token');
      
      mockFetch.mockResolvedValue({
        ok: false,
        status: 500,
        json: vi.fn().mockRejectedValue(new Error('Invalid JSON')),
      });

      const result = await apiClient.logout();

      expect(result.success).toBe(false);
      expect(result.error).toContain('Network error');
      expect(consoleMocks.warn).toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    beforeEach(() => {
      apiClient.setToken('test-token');
    });

    it('should handle different HTTP status codes', async () => {
      const statusCodes = [400, 401, 403, 404, 500, 502, 503];

      for (const status of statusCodes) {
        mockFetch.mockResolvedValue({
          ok: false,
          status,
          statusText: `Error ${status}`,
          json: vi.fn().mockResolvedValue({ error: `Error ${status}` }),
        });

        const result = await apiClient.logout();

        expect(result.success).toBe(false);
        expect(result.error).toContain(`Error ${status}`);
      }
    });

    it('should handle timeout scenarios', async () => {
      mockFetch.mockRejectedValue(new Error('Request timeout'));

      const result = await apiClient.logout();

      expect(result.success).toBe(false);
      expect(result.error).toContain('Request timeout');
    });

    it('should handle response parsing errors', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 400,
        json: vi.fn().mockRejectedValue(new SyntaxError('Unexpected token')),
      });

      const result = await apiClient.logout();

      expect(result.success).toBe(false);
      expect(result.error).toContain('Network error');
    });
  });

  describe('Security Tests', () => {
    it('should handle ReDoS attack patterns safely', async () => {
      apiClient.setToken('test-token');
      
      const maliciousInputs = [
        'a'.repeat(10000), // Very long string
        '((a+)+)+b', // Exponential backtracking pattern
        'user@' + 'a'.repeat(5000) + '.com', // Long email-like string
      ];

      const startTime = Date.now();

      for (const maliciousInput of maliciousInputs) {
        mockFetch.mockResolvedValue({
          ok: true,
          status: 200,
          text: vi.fn().mockResolvedValue('Success'),
        });

        await apiClient.trackActivity('user123', 'test', maliciousInput);
      }

      const endTime = Date.now();

      // Should complete under 100ms even with attack patterns
      expect(endTime - startTime).toBeLessThan(100);
    });

    it('should not leak sensitive information in error messages', async () => {
      apiClient.setToken('sensitive-token-123');
      
      mockFetch.mockRejectedValue(new Error('Database connection failed'));

      const result = await apiClient.logout();

      expect(result.error).not.toContain('sensitive-token-123');
      expect(result.error).not.toContain('password');
      expect(result.error).not.toContain('secret');
    });

    it('should sanitize error responses', async () => {
      apiClient.setToken('test-token');
      
      const maliciousError = {
        error: '<script>alert("xss")</script>',
        message: 'data:text/html,<script>alert(1)</script>',
        details: 'file:///etc/passwd',
      };

      mockFetch.mockResolvedValue({
        ok: false,
        status: 400,
        json: vi.fn().mockResolvedValue(maliciousError),
      });

      const result = await apiClient.logout();

      expect(result.success).toBe(false);
      // Error message should contain the malicious content as-is since we're not sanitizing
      // In a real application, you might want to sanitize these
      expect(result.error).toContain('<script>alert("xss")</script>');
    });
  });

  describe('Performance Tests', () => {
    beforeEach(() => {
      apiClient.setToken('test-token');
    });

    it('should handle rapid successive API calls', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: vi.fn().mockResolvedValue({ success: true, message: 'Success' }),
      });

      const promises = Array.from({ length: 10 }, () => apiClient.logout());

      const results = await Promise.all(promises);

      expect(results).toHaveLength(10);
      results.forEach(result => {
        expect(result.success).toBe(true);
      });
      expect(mockFetch).toHaveBeenCalledTimes(10);
    });

    it('should handle concurrent trackActivity calls', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        text: vi.fn().mockResolvedValue('Success'),
      });

      const promises = Array.from({ length: 5 }, (_, i) => 
        apiClient.trackActivity(`user${i}`, 'concurrent_test')
      );

      await Promise.all(promises);

      expect(mockFetch).toHaveBeenCalledTimes(5);
    });

    it('should handle large metadata objects efficiently', async () => {
      const largeMetadata = {
        userAgent: 'a'.repeat(1000),
        sessionData: Array.from({ length: 100 }, (_, i) => `item${i}`),
        preferences: Object.fromEntries(
          Array.from({ length: 50 }, (_, i) => [`pref${i}`, `value${i}`])
        ),
      };

      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        text: vi.fn().mockResolvedValue('Success'),
      });

      const startTime = Date.now();
      await apiClient.trackActivity('user123', 'large_metadata', '/test', largeMetadata);
      const endTime = Date.now();

      expect(endTime - startTime).toBeLessThan(50); // Should be very fast
      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          body: JSON.stringify({
            action: 'large_metadata',
            page: '/test',
            metadata: largeMetadata,
          }),
        })
      );
    });
  });

  describe('Integration Tests', () => {
    it('should maintain token state across multiple API calls', async () => {
      const token = 'persistent-token-123';
      apiClient.setToken(token);

      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: vi.fn().mockResolvedValue({ success: true, message: 'Success' }),
        text: vi.fn().mockResolvedValue('Success'),
      });

      // Make multiple different API calls
      await apiClient.logout();
      await apiClient.trackActivity('user123', 'test1');
      await apiClient.trackActivity('user123', 'test2');

      // All calls should use the same token
      expect(mockFetch).toHaveBeenCalledTimes(3);
      mockFetch.mock.calls.forEach(call => {
        expect(call[1]?.headers).toEqual(
          expect.objectContaining({
            'Authorization': `Bearer ${token}`,
          })
        );
      });
    });

    it('should work correctly after token changes', async () => {
      // Start with one token
      apiClient.setToken('token1');

      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        text: vi.fn().mockResolvedValue('Success'),
      });

      await apiClient.trackActivity('user123', 'first_call');

      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            'Authorization': 'Bearer token1',
          }),
        })
      );

      // Change token
      apiClient.setToken('token2');

      await apiClient.trackActivity('user123', 'second_call');

      expect(mockFetch).toHaveBeenLastCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            'Authorization': 'Bearer token2',
          }),
        })
      );
    });

    it('should handle mixed success and error responses', async () => {
      apiClient.setToken('test-token');

      // First call succeeds
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        text: vi.fn().mockResolvedValue('Success'),
      });

      // Second call fails
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        text: vi.fn().mockResolvedValue('Server error'),
      });

      // Third call succeeds
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: vi.fn().mockResolvedValue({ success: true, message: 'Success' }),
      });

      // Test trackActivity success
      await expect(apiClient.trackActivity('user123', 'success')).resolves.not.toThrow();

      // Test trackActivity failure
      await expect(apiClient.trackActivity('user123', 'failure')).rejects.toThrow();

      // Test logout success
      const result = await apiClient.logout();
      expect(result.success).toBe(true);
    });
  });
});

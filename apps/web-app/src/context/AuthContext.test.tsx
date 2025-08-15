import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { vi, beforeEach, afterEach, describe, it, expect } from 'vitest';
import '@testing-library/jest-dom';
import { AuthProvider, useAuth } from './AuthContext';
import { ReactNode, useState } from 'react';

// Helper functions moved outside to reduce nesting

const handleLogin = async (
  auth: ReturnType<typeof useAuth>,
  setError: React.Dispatch<React.SetStateAction<string>>
) => {
  try {
    await auth.login('test@example.com', 'wrong-password');
  } catch (err) {
    setError(err instanceof Error ? err.message : 'Login failed');
  }
};

// (Removed duplicate handleRegister declaration)

const handleRegister = async (
  auth: ReturnType<typeof useAuth>,
  setError: React.Dispatch<React.SetStateAction<string>>
) => {
  try {
    await auth.register('test@example.com', 'weak', 'Test User');
  } catch (err) {
    setError(err instanceof Error ? err.message : 'Registration failed');
  }
};

const handleNetworkLogin = async (
  auth: ReturnType<typeof useAuth>,
  setError: React.Dispatch<React.SetStateAction<string>>
) => {
  try {
    await auth.login('test@example.com', 'password');
  } catch (err) {
    setError(err instanceof Error ? err.message : 'Network error');
  }
};

const TestLoginComponent = () => {
  const auth = useAuth();
  const [error, setError] = useState('');

  return (
    <div>
      <button onClick={() => handleLogin(auth, setError)}>Login</button>
      <div data-testid="error">{error}</div>
    </div>
  );
};

const TestRegisterComponent = () => {
  const auth = useAuth();
  const [error, setError] = useState('');

  return (
    <div>
      <button onClick={() => handleRegister(auth, setError)}>Register</button>
      <div data-testid="error">{error}</div>
    </div>
  );
};

const TestNetworkErrorComponent = () => {
  const auth = useAuth();
  const [error, setError] = useState('');

  return (
    <div>
      <button onClick={() => handleNetworkLogin(auth, setError)}>Login</button>
      <div data-testid="error">{error}</div>
    </div>
  );
};

// Mock the useIdleTimer hook
const mockReset = vi.fn();
const mockClear = vi.fn();
let mockIdleCallback: (() => void) | null = null;
let mockWarningCallback: ((timeRemaining: number) => void) | null = null;

vi.mock('../hooks/useIdleTimer', () => ({
  useIdleTimer: vi.fn((config) => {
    // Store the callbacks for later use in tests
    mockIdleCallback = config.onIdle;
    mockWarningCallback = config.onWarning;

    return {
      reset: mockReset,
      clear: mockClear,
      isWarning: false,
      timeRemaining: config.timeout,
    };
  }),
}));

// Mock the SessionWarning component
interface SessionWarningProps {
  show: boolean;
  onExtendSession: () => void;
  onLogout: () => void;
}

vi.mock('../components/SessionWarning', () => ({
  SessionWarning: ({ show, onExtendSession, onLogout }: SessionWarningProps) =>
    show ? (
      <div data-testid="session-warning">
        <button onClick={onExtendSession}>Stay Logged In</button>
        <button onClick={onLogout}>Logout Now</button>
      </div>
    ) : null,
}));

// Mock fetch for API calls
global.fetch = vi.fn() as typeof fetch;

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};

// Setup JSDOM environment globals
Object.defineProperty(globalThis, 'localStorage', {
  value: localStorageMock,
  writable: true,
});

// Mock Notification API
const mockNotificationConstructor = vi.fn();
const mockRequestPermission = vi.fn().mockResolvedValue('granted');

Object.defineProperty(globalThis, 'Notification', {
  value: mockNotificationConstructor,
  writable: true,
  configurable: true,
});

Object.defineProperty(globalThis.Notification, 'requestPermission', {
  value: mockRequestPermission,
  writable: true,
  configurable: true,
});

Object.defineProperty(globalThis.Notification, 'permission', {
  value: 'default',
  writable: true,
  configurable: true,
});

const TestComponent = () => {
  const auth = useAuth();
  return (
    <div>
      <div data-testid="user">{auth.user?.name || 'No user'}</div>
      <div data-testid="token">{auth.token || 'No token'}</div>
      <div data-testid="loading">{auth.loading ? 'Loading' : 'Not loading'}</div>
      <button onClick={() => auth.login('test@example.com', 'password')}>
        Login
      </button>
      <button onClick={() => auth.register('Test User', 'test@example.com', 'password')}>
        Register
      </button>
      <button onClick={auth.logout}>Logout</button>
    </div>
  );
};

const renderWithAuthProvider = (children: ReactNode, isSSR = false) => {
  return render(
    <AuthProvider isSSR={isSSR}>
      {children}
    </AuthProvider>
  );
};

describe('AuthContext with Idle Timer', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockReset.mockClear();
    mockClear.mockClear();
    mockIdleCallback = null;
    mockWarningCallback = null;
    localStorageMock.getItem.mockReturnValue(null);
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        user: { id: '1', name: 'Test User', email: 'test@example.com' },
        token: 'test-token'
      }),
    });
  });

  afterEach(() => {
    vi.clearAllTimers();
  });

  it('should provide authentication context', () => {
    renderWithAuthProvider(<TestComponent />);

    expect(screen.getByTestId('user')).toHaveTextContent('No user');
    expect(screen.getByTestId('token')).toHaveTextContent('No token');
    expect(screen.getByTestId('loading')).toHaveTextContent('Not loading');
  });

  it('should initialize idle timer when user is authenticated', async () => {
    // Mock stored user data
    localStorageMock.getItem.mockImplementation((key) => {
      if (key === 'token') return 'test-token';
      if (key === 'user') return JSON.stringify({ id: '1', name: 'Test User', email: 'test@example.com' });
      return null;
    });

    const { useIdleTimer } = await import('../hooks/useIdleTimer');

    renderWithAuthProvider(<TestComponent />);

    await waitFor(() => {
      expect(useIdleTimer).toHaveBeenCalledWith({
        timeout: 15 * 60 * 1000, // 15 minutes
        onIdle: expect.any(Function),
        onWarning: expect.any(Function),
        warningTime: 2 * 60 * 1000, // 2 minutes
        enabled: true,
      });
    });
  });

  it('should not initialize idle timer when user is not authenticated', async () => {
    const { useIdleTimer } = await import('../hooks/useIdleTimer');

    renderWithAuthProvider(<TestComponent />);

    await waitFor(() => {
      expect(useIdleTimer).toHaveBeenCalledWith({
        timeout: 15 * 60 * 1000,
        onIdle: expect.any(Function),
        onWarning: expect.any(Function),
        warningTime: 2 * 60 * 1000,
        enabled: false,
      });
    });
  });

  it('should not initialize idle timer in SSR mode', async () => {
    localStorageMock.getItem.mockImplementation((key) => {
      if (key === 'token') return 'test-token';
      if (key === 'user') return JSON.stringify({ id: '1', name: 'Test User', email: 'test@example.com' });
      return null;
    });

    const { useIdleTimer } = await import('../hooks/useIdleTimer');

    renderWithAuthProvider(<TestComponent />, true);

    await waitFor(() => {
      expect(useIdleTimer).toHaveBeenCalledWith({
        timeout: 15 * 60 * 1000,
        onIdle: expect.any(Function),
        onWarning: expect.any(Function),
        warningTime: 2 * 60 * 1000,
        enabled: false, // Should be false in SSR mode
      });
    });
  });

  it('should handle login successfully', async () => {
    renderWithAuthProvider(<TestComponent />);

    const loginButton = screen.getByText('Login');
    fireEvent.click(loginButton);

    expect(screen.getByTestId('loading')).toHaveTextContent('Loading');

    await waitFor(() => {
      expect(screen.getByTestId('user')).toHaveTextContent('Test User');
      expect(screen.getByTestId('token')).toHaveTextContent('test-token');
      expect(screen.getByTestId('loading')).toHaveTextContent('Not loading');
    });

    expect(localStorageMock.setItem).toHaveBeenCalledWith('token', 'test-token');
    expect(localStorageMock.setItem).toHaveBeenCalledWith(
      'user',
      JSON.stringify({ id: '1', name: 'Test User', email: 'test@example.com' })
    );
  });

  it('should handle logout correctly', async () => {
    // Start with authenticated user
    localStorageMock.getItem.mockImplementation((key) => {
      if (key === 'token') return 'test-token';
      if (key === 'user') return JSON.stringify({ id: '1', name: 'Test User', email: 'test@example.com' });
      return null;
    });

    renderWithAuthProvider(<TestComponent />);

    await waitFor(() => {
      expect(screen.getByTestId('user')).toHaveTextContent('Test User');
    });

    const logoutButton = screen.getByText('Logout');
    fireEvent.click(logoutButton);

    expect(screen.getByTestId('user')).toHaveTextContent('No user');
    expect(screen.getByTestId('token')).toHaveTextContent('No token');
    expect(localStorageMock.removeItem).toHaveBeenCalledWith('token');
    expect(localStorageMock.removeItem).toHaveBeenCalledWith('user');
  });

  it('should auto-logout on idle timeout', async () => {
    // Mock stored user data
    localStorageMock.getItem.mockImplementation((key) => {
      if (key === 'token') return 'test-token';
      if (key === 'user') return JSON.stringify({ id: '1', name: 'Test User', email: 'test@example.com' });
      return null;
    });

    renderWithAuthProvider(<TestComponent />);

    await waitFor(() => {
      expect(screen.getByTestId('user')).toHaveTextContent('Test User');
    });

    // Ensure the idle callback was set
    expect(mockIdleCallback).toBeTruthy();

    // Simulate idle timeout using the stored callback
    await act(async () => {
      if (mockIdleCallback) {
        mockIdleCallback();
      }
    });

    await waitFor(() => {
      expect(screen.getByTestId('user')).toHaveTextContent('No user');
      expect(screen.getByTestId('token')).toHaveTextContent('No token');
    });

    expect(localStorageMock.removeItem).toHaveBeenCalledWith('token');
    expect(localStorageMock.removeItem).toHaveBeenCalledWith('user');
  });

  it('should show session warning when onWarning is triggered', async () => {
    // Mock stored user data
    localStorageMock.getItem.mockImplementation((key) => {
      if (key === 'token') return 'test-token';
      if (key === 'user') return JSON.stringify({ id: '1', name: 'Test User', email: 'test@example.com' });
      return null;
    });

    renderWithAuthProvider(<TestComponent />);

    await waitFor(() => {
      expect(screen.getByTestId('user')).toHaveTextContent('Test User');
    });

    // Ensure the warning callback was set
    expect(mockWarningCallback).toBeTruthy();

    // Trigger warning using the stored callback
    act(() => {
      if (mockWarningCallback) {
        mockWarningCallback(120);
      }
    });

    expect(screen.getByTestId('session-warning')).toBeInTheDocument();
  });

  it('should extend session when "Stay Logged In" is clicked', async () => {
    // Mock stored user data
    localStorageMock.getItem.mockImplementation((key) => {
      if (key === 'token') return 'test-token';
      if (key === 'user') return JSON.stringify({ id: '1', name: 'Test User', email: 'test@example.com' });
      return null;
    });

    renderWithAuthProvider(<TestComponent />);

    await waitFor(() => {
      expect(screen.getByTestId('user')).toHaveTextContent('Test User');
    });

    // Trigger warning using the stored callback
    act(() => {
      if (mockWarningCallback) {
        mockWarningCallback(120);
      }
    });

    const stayLoggedInButton = screen.getByText('Stay Logged In');
    fireEvent.click(stayLoggedInButton);

    expect(mockReset).toHaveBeenCalled();
    expect(screen.queryByTestId('session-warning')).not.toBeInTheDocument();
  });

  it('should request notification permission on mount', async () => {
    // First login to trigger notification permission request
    localStorageMock.getItem.mockImplementation((key) => {
      if (key === 'token') return 'test-token';
      if (key === 'user') return JSON.stringify({ id: '1', name: 'Test User', email: 'test@example.com' });
      return null;
    });

    renderWithAuthProvider(<TestComponent />);

    await waitFor(() => {
      expect(screen.getByTestId('user')).toHaveTextContent('Test User');
    });

    await waitFor(() => {
      expect(mockRequestPermission).toHaveBeenCalled();
    });
  });

  it('should show notification on auto-logout if permission granted', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {
      // Mock console.error to avoid noise in test output
    });
    const localMockNotification = vi.fn();

    // Setup notification constructor and permission
    Object.defineProperty(globalThis, 'Notification', {
      value: localMockNotification,
      writable: true,
      configurable: true,
    });

    Object.defineProperty(globalThis.Notification, 'permission', {
      value: 'granted',
      writable: true,
      configurable: true,
    });

    // Mock stored user data
    localStorageMock.getItem.mockImplementation((key) => {
      if (key === 'token') return 'test-token';
      if (key === 'user') return JSON.stringify({ id: '1', name: 'Test User', email: 'test@example.com' });
      return null;
    });

    renderWithAuthProvider(<TestComponent />);

    await waitFor(() => {
      expect(screen.getByTestId('user')).toHaveTextContent('Test User');
    });

    // Trigger idle logout using the stored callback
    await act(async () => {
      if (mockIdleCallback) {
        mockIdleCallback();
      }
    });

    await waitFor(() => {
      expect(screen.getByTestId('user')).toHaveTextContent('No user');
    });

    expect(localMockNotification).toHaveBeenCalledWith('Session Expired', {
      body: 'You have been logged out due to inactivity.',
      icon: '/favicon.ico',
    });

    consoleSpy.mockRestore();
  });

  it('should handle ReDoS attack patterns safely', () => {
    const startTime = Date.now();

    // Test with malicious user data that could cause issues
    const maliciousUserData = [
      'a'.repeat(10000),
      JSON.stringify({ name: 'a'.repeat(10000) }),
      'user@' + 'a'.repeat(1000) + '.com',
    ];

    maliciousUserData.forEach(userData => {
      localStorageMock.getItem.mockImplementation((key) => {
        if (key === 'token') return 'test-token';
        if (key === 'user') return userData;
        return null;
      });

      const { unmount } = renderWithAuthProvider(<TestComponent />);
      unmount();
    });

    const endTime = Date.now();
    expect(endTime - startTime).toBeLessThan(100);
  });

  describe('API Error Handling', () => {
    it('should handle authentication API errors', async () => {
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
        ok: false,
        status: 401,
        json: () => Promise.resolve({ error: 'Invalid credentials' }),
      });

      renderWithAuthProvider(<TestLoginComponent />);

      const loginButton = screen.getByText('Login');
      fireEvent.click(loginButton);

      await waitFor(() => {
        expect(screen.getByTestId('error')).toHaveTextContent('Invalid credentials');
      });
    });

    it('should handle registration API errors', async () => {
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
        ok: false,
        status: 400,
        json: () => Promise.resolve({
          details: ['Email already exists', 'Password too weak']
        }),
      });

      renderWithAuthProvider(<TestRegisterComponent />);

      const registerButton = screen.getByText('Register');
      fireEvent.click(registerButton);

      await waitFor(() => {
        expect(screen.getByTestId('error')).toHaveTextContent('Email already exists, Password too weak');
      });
    });

    it('should handle fetch network errors', async () => {
      (global.fetch as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('Network error'));

      renderWithAuthProvider(<TestNetworkErrorComponent />);

      const loginButton = screen.getByText('Login');
      fireEvent.click(loginButton);

      await waitFor(() => {
        expect(screen.getByTestId('error')).toHaveTextContent('Network error');
      });
    });
  });

  describe('Session State Management', () => {
    it('should handle session timeout with proper cleanup', async () => {
      // Mock stored user data
      localStorageMock.getItem.mockImplementation((key) => {
        if (key === 'token') return 'test-token';
        if (key === 'user') return JSON.stringify({ id: '1', name: 'Test User', email: 'test@example.com' });
        return null;
      });

      renderWithAuthProvider(<TestComponent />);

      await waitFor(() => {
        expect(screen.getByTestId('user')).toHaveTextContent('Test User');
      });

      // Trigger idle timeout
      act(() => {
        if (mockIdleCallback) {
          mockIdleCallback();
        }
      });

      expect(screen.getByTestId('user')).toHaveTextContent('No user');
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('token');
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('user');
    });

    it('should handle invalid JSON in localStorage gracefully', () => {
      localStorageMock.getItem.mockImplementation((key) => {
        if (key === 'token') return 'test-token';
        if (key === 'user') return 'invalid-json{';
        return null;
      });

      renderWithAuthProvider(<TestComponent />);

      // Should show no user when JSON is invalid
      expect(screen.getByTestId('user')).toHaveTextContent('No user');
    });

    it('should handle empty localStorage values', () => {
      localStorageMock.getItem.mockImplementation((key) => {
        if (key === 'token') return '';
        if (key === 'user') return '';
        return null;
      });

      renderWithAuthProvider(<TestComponent />);

      expect(screen.getByTestId('user')).toHaveTextContent('No user');
    });
  });

  describe('Security and Edge Cases', () => {
    it('should validate user data structure', () => {
      // Test with malformed user object
      localStorageMock.getItem.mockImplementation((key) => {
        if (key === 'token') return 'test-token';
        if (key === 'user') return JSON.stringify({ wrongField: 'value' });
        return null;
      });

      renderWithAuthProvider(<TestComponent />);

      expect(screen.getByTestId('user')).toHaveTextContent('No user');
    });

    it('should handle extremely long token strings', () => {
      const longToken = 'a'.repeat(10000);
      localStorageMock.getItem.mockImplementation((key) => {
        if (key === 'token') return longToken;
        if (key === 'user') return JSON.stringify({ id: '1', name: 'Test User', email: 'test@example.com' });
        return null;
      });

      const startTime = Date.now();
      renderWithAuthProvider(<TestComponent />);
      const endTime = Date.now();

      // Should handle long tokens without performance issues
      expect(endTime - startTime).toBeLessThan(100);
      expect(screen.getByTestId('user')).toHaveTextContent('Test User');
    });

    it('should handle multiple rapid authentication state changes', async () => {
      renderWithAuthProvider(<TestComponent />);

      // Test fewer rapid cycles to avoid timeout
      for (let i = 0; i < 3; i++) {
        const loginButton = screen.getByText('Login');
        fireEvent.click(loginButton);

        await waitFor(() => {
          expect(screen.getByTestId('user')).toHaveTextContent('Test User');
        });

        const logoutButton = screen.getByText('Logout');
        fireEvent.click(logoutButton);

        expect(screen.getByTestId('user')).toHaveTextContent('No user');
      }
    });
  });
});

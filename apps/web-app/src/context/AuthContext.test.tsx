import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { vi, beforeEach, afterEach, describe, it, expect } from 'vitest';
import '@testing-library/jest-dom';
import { AuthProvider, useAuth } from './AuthContext';
import { ReactNode } from 'react';

// Mock the useIdleTimer hook
vi.mock('../hooks/useIdleTimer', () => ({
  useIdleTimer: vi.fn((config) => ({
    reset: vi.fn(),
    clear: vi.fn(),
    isWarning: false,
    timeRemaining: config.timeout,
  })),
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
interface MockNotification {
  requestPermission: () => Promise<string>;
  permission: string;
}

(globalThis as typeof globalThis & { Notification: MockNotification }).Notification = {
  requestPermission: vi.fn().mockResolvedValue('granted'),
  permission: 'granted',
};const TestComponent = () => {
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

    const { useIdleTimer } = await import('../hooks/useIdleTimer');
    const mockUseIdleTimer = vi.mocked(useIdleTimer);

    renderWithAuthProvider(<TestComponent />);

    await waitFor(() => {
      expect(screen.getByTestId('user')).toHaveTextContent('Test User');
    });

    // Get the onIdle callback that was passed to useIdleTimer
    const idleCallback = mockUseIdleTimer.mock.calls[0][0].onIdle;

    // Simulate idle timeout
    act(() => {
      idleCallback();
    });

    expect(screen.getByTestId('user')).toHaveTextContent('No user');
    expect(screen.getByTestId('token')).toHaveTextContent('No token');
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

    const { useIdleTimer } = await import('../hooks/useIdleTimer');
    const mockUseIdleTimer = vi.mocked(useIdleTimer);

    renderWithAuthProvider(<TestComponent />);

    await waitFor(() => {
      expect(screen.getByTestId('user')).toHaveTextContent('Test User');
    });

    // Get the onWarning callback that was passed to useIdleTimer
    const warningCallback = mockUseIdleTimer.mock.calls[0][0].onWarning;

    // Simulate warning trigger
    act(() => {
      warningCallback?.(120); // 2 minutes remaining
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

    const { useIdleTimer } = await import('../hooks/useIdleTimer');
    const mockUseIdleTimer = vi.mocked(useIdleTimer);
    const mockReset = vi.fn();

    mockUseIdleTimer.mockReturnValue({
      reset: mockReset,
      clear: vi.fn(),
      isWarning: false,
      timeRemaining: 900000,
    });

    renderWithAuthProvider(<TestComponent />);

    await waitFor(() => {
      expect(screen.getByTestId('user')).toHaveTextContent('Test User');
    });

    // Trigger warning
    const warningCallback = mockUseIdleTimer.mock.calls[0][0].onWarning;
    act(() => {
      warningCallback?.(120);
    });

    const stayLoggedInButton = screen.getByText('Stay Logged In');
    fireEvent.click(stayLoggedInButton);

    expect(mockReset).toHaveBeenCalled();
    expect(screen.queryByTestId('session-warning')).not.toBeInTheDocument();
  });

  it('should request notification permission on mount', async () => {
    renderWithAuthProvider(<TestComponent />);

    await waitFor(() => {
      expect((globalThis as any).Notification.requestPermission).toHaveBeenCalled();
    });
  });

  it('should show notification on auto-logout if permission granted', async () => {
    const mockNotification = vi.fn();
    (globalThis as any).Notification = mockNotification;
    (globalThis as any).Notification.permission = 'granted';

    // Mock stored user data
    localStorageMock.getItem.mockImplementation((key) => {
      if (key === 'token') return 'test-token';
      if (key === 'user') return JSON.stringify({ id: '1', name: 'Test User', email: 'test@example.com' });
      return null;
    });

    const { useIdleTimer } = await import('../hooks/useIdleTimer');
    const mockUseIdleTimer = vi.mocked(useIdleTimer);

    renderWithAuthProvider(<TestComponent />);

    await waitFor(() => {
      expect(screen.getByTestId('user')).toHaveTextContent('Test User');
    });

    // Trigger idle logout
    const idleCallback = mockUseIdleTimer.mock.calls[0][0].onIdle;
    act(() => {
      idleCallback();
    });

    expect(mockNotification).toHaveBeenCalledWith('Session Expired', {
      body: 'You have been logged out due to inactivity.',
      icon: '/favicon.ico'
    });
  });

  it('should handle corrupted localStorage data gracefully', async () => {
    localStorageMock.getItem.mockImplementation((key) => {
      if (key === 'token') return 'test-token';
      if (key === 'user') return 'invalid-json{';
      return null;
    });

    // Mock console.error to avoid noise in tests
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);

    renderWithAuthProvider(<TestComponent />);

    await waitFor(() => {
      expect(screen.getByTestId('user')).toHaveTextContent('No user');
      expect(screen.getByTestId('token')).toHaveTextContent('No token');
    });

    expect(consoleSpy).toHaveBeenCalledWith('Error parsing stored user:', expect.any(Error));
    expect(localStorageMock.removeItem).toHaveBeenCalledWith('user');
    expect(localStorageMock.removeItem).toHaveBeenCalledWith('token');

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

    // Must complete under 100ms even with attack patterns
    expect(endTime - startTime).toBeLessThan(100);
  });
});

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AuthProvider, AuthContext } from '../context/AuthContext';
import { useContext } from 'react';

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Mock localStorage
const mockLocalStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};
Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage,
});

// Test component to access AuthContext
const TestComponent = () => {
  const { user, token, login, register, logout, loading } = useContext(AuthContext);

  const handleLogin = async () => {
    try {
      await login('test@example.com', 'password');
    } catch {
      // Error is handled by the login function
    }
  };

  const handleRegister = async () => {
    try {
      await register('new@example.com', 'password', 'New User');
    } catch {
      // Error is handled by the register function
    }
  };

  return (
    <div>
      <div data-testid="user">{user ? JSON.stringify(user) : 'null'}</div>
      <div data-testid="token">{token || 'null'}</div>
      <div data-testid="loading">{loading ? 'true' : 'false'}</div>
      <button onClick={handleLogin}>Login</button>
      <button onClick={handleRegister}>Register</button>
      <button onClick={logout}>Logout</button>
    </div>
  );
};

const AuthProviderWrapper = ({ children }: { children: React.ReactNode }) => (
  <AuthProvider>{children}</AuthProvider>
);

describe('AuthContext', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockLocalStorage.getItem.mockReturnValue(null);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('initializes with null user and token when no stored data', () => {
    render(
      <AuthProviderWrapper>
        <TestComponent />
      </AuthProviderWrapper>
    );

    expect(screen.getByTestId('user')).toHaveTextContent('null');
    expect(screen.getByTestId('token')).toHaveTextContent('null');
    expect(screen.getByTestId('loading')).toHaveTextContent('false');
  });

  it('initializes with stored user and token from localStorage', () => {
    const storedUser = { id: 1, email: 'stored@example.com', name: 'Stored User' };
    const storedToken = 'stored-jwt-token';

    mockLocalStorage.getItem.mockImplementation((key) => {
      if (key === 'user') return JSON.stringify(storedUser);
      if (key === 'token') return storedToken;
      return null;
    });

    render(
      <AuthProviderWrapper>
        <TestComponent />
      </AuthProviderWrapper>
    );

    expect(screen.getByTestId('user')).toHaveTextContent(JSON.stringify(storedUser));
    expect(screen.getByTestId('token')).toHaveTextContent(storedToken);
  });

  it('handles successful login', async () => {
    const user = userEvent.setup();
    const mockUser = { id: 1, email: 'test@example.com', name: 'Test User' };
    const mockToken = 'jwt-token';

    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ user: mockUser, token: mockToken }),
    });

    render(
      <AuthProviderWrapper>
        <TestComponent />
      </AuthProviderWrapper>
    );

    const loginButton = screen.getByText('Login');
    await user.click(loginButton);

    await waitFor(() => {
      expect(screen.getByTestId('user')).toHaveTextContent(JSON.stringify(mockUser));
      expect(screen.getByTestId('token')).toHaveTextContent(mockToken);
    });

    expect(mockFetch).toHaveBeenCalledWith('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'test@example.com', password: 'password' }),
    });

    expect(mockLocalStorage.setItem).toHaveBeenCalledWith('user', JSON.stringify(mockUser));
    expect(mockLocalStorage.setItem).toHaveBeenCalledWith('token', mockToken);
  });

  it('handles login failure', async () => {
    const user = userEvent.setup();

    mockFetch.mockResolvedValue({
      ok: false,
      json: () => Promise.resolve({ error: 'Invalid credentials' }),
    });

    render(
      <AuthProviderWrapper>
        <TestComponent />
      </AuthProviderWrapper>
    );

    const loginButton = screen.getByText('Login');
    await user.click(loginButton);

    // Should remain with null user and token after failed login
    await waitFor(() => {
      expect(screen.getByTestId('user')).toHaveTextContent('null');
      expect(screen.getByTestId('token')).toHaveTextContent('null');
    });
  });

  it('handles successful registration', async () => {
    const user = userEvent.setup();
    const mockUser = { id: 1, email: 'new@example.com', name: 'New User' };
    const mockToken = 'jwt-token';

    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ user: mockUser, token: mockToken }),
    });

    render(
      <AuthProviderWrapper>
        <TestComponent />
      </AuthProviderWrapper>
    );

    const registerButton = screen.getByText('Register');
    await user.click(registerButton);

    await waitFor(() => {
      expect(screen.getByTestId('user')).toHaveTextContent(JSON.stringify(mockUser));
      expect(screen.getByTestId('token')).toHaveTextContent(mockToken);
    });

    expect(mockFetch).toHaveBeenCalledWith('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'new@example.com',
        password: 'password',
        name: 'New User'
      }),
    });

    expect(mockLocalStorage.setItem).toHaveBeenCalledWith('user', JSON.stringify(mockUser));
    expect(mockLocalStorage.setItem).toHaveBeenCalledWith('token', mockToken);
  });

  it('handles registration failure', async () => {
    const user = userEvent.setup();

    mockFetch.mockResolvedValue({
      ok: false,
      json: () => Promise.resolve({ error: 'User already exists' }),
    });

    render(
      <AuthProviderWrapper>
        <TestComponent />
      </AuthProviderWrapper>
    );

    const registerButton = screen.getByText('Register');
    await user.click(registerButton);

    // Should remain with null user and token after failed registration
    await waitFor(() => {
      expect(screen.getByTestId('user')).toHaveTextContent('null');
      expect(screen.getByTestId('token')).toHaveTextContent('null');
    });
  });

  it('handles logout', async () => {
    const user = userEvent.setup();
    const initialUser = { id: 1, email: 'test@example.com', name: 'Test User' };
    const initialToken = 'jwt-token';

    mockLocalStorage.getItem.mockImplementation((key) => {
      if (key === 'user') return JSON.stringify(initialUser);
      if (key === 'token') return initialToken;
      return null;
    });

    render(
      <AuthProviderWrapper>
        <TestComponent />
      </AuthProviderWrapper>
    );

    // Verify initial state
    expect(screen.getByTestId('user')).toHaveTextContent(JSON.stringify(initialUser));
    expect(screen.getByTestId('token')).toHaveTextContent(initialToken);

    const logoutButton = screen.getByText('Logout');
    await user.click(logoutButton);

    expect(screen.getByTestId('user')).toHaveTextContent('null');
    expect(screen.getByTestId('token')).toHaveTextContent('null');
    expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('user');
    expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('token');
  });

  it('shows loading state during login', async () => {
    const user = userEvent.setup();

    // Mock fetch to take some time
    mockFetch.mockImplementation(() =>
      new Promise(resolve =>
        setTimeout(() => resolve({
          ok: true,
          json: () => Promise.resolve({
            user: { id: 1, email: 'test@example.com', name: 'Test User' },
            token: 'jwt-token'
          }),
        }), 100)
      )
    );

    render(
      <AuthProviderWrapper>
        <TestComponent />
      </AuthProviderWrapper>
    );

    const loginButton = screen.getByText('Login');
    await user.click(loginButton);

    // Should show loading state briefly
    expect(screen.getByTestId('loading')).toHaveTextContent('true');

    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('false');
    });
  });

  it('shows loading state during registration', async () => {
    const user = userEvent.setup();

    // Mock fetch to take some time
    mockFetch.mockImplementation(() =>
      new Promise(resolve =>
        setTimeout(() => resolve({
          ok: true,
          json: () => Promise.resolve({
            user: { id: 1, email: 'new@example.com', name: 'New User' },
            token: 'jwt-token'
          }),
        }), 100)
      )
    );

    render(
      <AuthProviderWrapper>
        <TestComponent />
      </AuthProviderWrapper>
    );

    const registerButton = screen.getByText('Register');
    await user.click(registerButton);

    // Should show loading state briefly
    expect(screen.getByTestId('loading')).toHaveTextContent('true');

    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('false');
    });
  });

  it('handles network errors during login', async () => {
    const user = userEvent.setup();

    mockFetch.mockRejectedValue(new Error('Network error'));

    render(
      <AuthProviderWrapper>
        <TestComponent />
      </AuthProviderWrapper>
    );

    const loginButton = screen.getByText('Login');
    await user.click(loginButton);

    // Should remain with null user and token after network error
    await waitFor(() => {
      expect(screen.getByTestId('user')).toHaveTextContent('null');
      expect(screen.getByTestId('token')).toHaveTextContent('null');
    });
  });

  it('handles network errors during registration', async () => {
    const user = userEvent.setup();

    mockFetch.mockRejectedValue(new Error('Network error'));

    render(
      <AuthProviderWrapper>
        <TestComponent />
      </AuthProviderWrapper>
    );

    const registerButton = screen.getByText('Register');
    await user.click(registerButton);

    // Should remain with null user and token after network error
    await waitFor(() => {
      expect(screen.getByTestId('user')).toHaveTextContent('null');
      expect(screen.getByTestId('token')).toHaveTextContent('null');
    });
  });

  it('handles invalid JSON in localStorage gracefully', () => {
    mockLocalStorage.getItem.mockImplementation((key) => {
      if (key === 'user') return 'invalid-json';
      if (key === 'token') return 'valid-token';
      return null;
    });

    render(
      <AuthProviderWrapper>
        <TestComponent />
      </AuthProviderWrapper>
    );

    // Should handle invalid JSON gracefully and clear both user and token
    expect(screen.getByTestId('user')).toHaveTextContent('null');
    expect(screen.getByTestId('token')).toHaveTextContent('null');
    expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('user');
    expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('token');
  });
});

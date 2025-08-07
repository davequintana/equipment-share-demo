import React, { createContext, useState, useEffect, ReactNode, useMemo, useCallback } from 'react';
import 'isomorphic-fetch'; // For SSR compatibility
import { isLocalOnlyMode } from '../utils/api-url';
import { localAuth } from '../utils/local-auth';
import { useIdleTimer } from '../hooks/useIdleTimer';
import { SessionWarning } from '../components/SessionWarning';

interface User {
  id: string;
  email: string;
  name: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  logout: () => void;
  loading: boolean;
}

export const AuthContext = createContext<AuthContextType>({
  user: null,
  token: null,
  login: async () => {
    throw new Error('AuthContext not initialized');
  },
  register: async () => {
    throw new Error('AuthContext not initialized');
  },
  logout: () => {
    throw new Error('AuthContext not initialized');
  },
  loading: false,
});

interface AuthProviderProps {
  children: ReactNode;
  isSSR?: boolean;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children, isSSR = false }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showSessionWarning, setShowSessionWarning] = useState(false);

  // Auto-logout after 15 minutes of idle time
  const IDLE_TIMEOUT = 15 * 60 * 1000; // 15 minutes in milliseconds
  const WARNING_TIME = 2 * 60 * 1000; // Show warning 2 minutes before logout

  const handleIdleLogout = useCallback(() => {
    if (user && token) {
      console.log('Auto-logout due to inactivity');
      // We'll call logout function defined below
      setUser(null);
      setToken(null);
      if (typeof window !== 'undefined') {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
      setShowSessionWarning(false);

      // Show notification to user if possible
      if (typeof window !== 'undefined' && 'Notification' in window) {
        if (Notification.permission === 'granted') {
          new Notification('Session Expired', {
            body: 'You have been logged out due to inactivity.',
            icon: '/favicon.ico'
          });
        }
      }
    }
  }, [user, token]);

  const handleSessionWarning = useCallback((timeRemaining: number) => {
    setShowSessionWarning(true);
  }, []);

  // Initialize idle timer - only when user is logged in and not in SSR
  const idleTimer = useIdleTimer({
    timeout: IDLE_TIMEOUT,
    onIdle: handleIdleLogout,
    onWarning: handleSessionWarning,
    warningTime: WARNING_TIME,
    enabled: !isSSR && !!user && !!token, // Only enable when user is authenticated
  });

  const handleExtendSession = useCallback(() => {
    setShowSessionWarning(false);
    // Reset the idle timer by triggering activity
    if (idleTimer) {
      idleTimer.reset();
    }
  }, [idleTimer]);

  useEffect(() => {
    // Only run on client side
    if (typeof window !== 'undefined') {
      const storedToken = localStorage.getItem('token');
      const storedUser = localStorage.getItem('user');

      if (storedToken && storedUser) {
        try {
          const parsedUser = JSON.parse(storedUser);
          setToken(storedToken);
          setUser(parsedUser);
        } catch (error) {
          console.error('Error parsing stored user:', error);
          localStorage.removeItem('user');
          localStorage.removeItem('token');
          // Don't set the token or user if parsing failed
        }
      }

      // Request notification permission for idle timeout notifications
      if ('Notification' in window && Notification.permission === 'default') {
        Notification.requestPermission().catch(console.error);
      }
    }
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    setLoading(true);
    try {
      // Use local auth for GitHub Pages, API for development
      if (isLocalOnlyMode()) {
        const { user, token } = await localAuth.login(email, password);
        setToken(token);
        setUser(user);
      } else {
        // Original API logic for development
        const apiUrl = typeof window !== 'undefined'
          ? '/api/auth/login'
          : `${process.env['VITE_API_URL'] || 'http://localhost:3333'}/api/auth/login`;

        const response = await fetch(apiUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ email, password }),
        });

        if (!response.ok) {
          const error = await response.json() as { error?: string; message?: string; details?: string[] };
          // Handle different types of error responses
          if (error.details && Array.isArray(error.details)) {
            throw new Error(error.details.join(', '));
          }
          throw new Error(error.error || error.message || 'Login failed');
        }

        const data = await response.json() as { token: string; user: User };
        setToken(data.token);
        setUser(data.user);

        // Store in localStorage only on client side
        if (typeof window !== 'undefined') {
          localStorage.setItem('token', data.token);
          localStorage.setItem('user', JSON.stringify(data.user));
        }
      }
    } finally {
      setLoading(false);
    }
  }, []);

  const register = useCallback(async (email: string, password: string, name: string) => {
    setLoading(true);
    try {
      // Use local auth for GitHub Pages, API for development
      if (isLocalOnlyMode()) {
        const { user, token } = await localAuth.register(email, password, name);
        setToken(token);
        setUser(user);
      } else {
        // Original API logic for development
        const apiUrl = typeof window !== 'undefined'
          ? '/api/auth/register'
          : `${process.env['VITE_API_URL'] || 'http://localhost:3333'}/api/auth/register`;

        const response = await fetch(apiUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ email, password, name }),
        });

        if (!response.ok) {
          const error = await response.json() as { error?: string; message?: string; details?: string[] };
          // Handle different types of error responses
          if (error.details && Array.isArray(error.details)) {
            throw new Error(error.details.join(', '));
          }
          throw new Error(error.error || error.message || 'Registration failed');
        }

        const data = await response.json() as { token: string; user: User };
        setToken(data.token);
        setUser(data.user);

        // Store in localStorage only on client side
        if (typeof window !== 'undefined') {
          localStorage.setItem('token', data.token);
          localStorage.setItem('user', JSON.stringify(data.user));
        }
      }
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    setToken(null);

    // Clear localStorage only on client side
    if (typeof window !== 'undefined') {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    }
  }, []);

  // Memoize the context value to prevent unnecessary re-renders
  const contextValue = useMemo(() => ({
    user,
    token,
    login,
    register,
    logout,
    loading
  }), [user, token, login, register, logout, loading]);

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
      {idleTimer && (
        <SessionWarning
          show={showSessionWarning}
          timeRemaining={idleTimer.timeRemaining || 0}
          onExtendSession={handleExtendSession}
          onLogout={handleIdleLogout}
        />
      )}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = React.useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

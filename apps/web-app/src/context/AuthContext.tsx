import React, { createContext, useState, useEffect, ReactNode } from 'react';
import 'isomorphic-fetch'; // For SSR compatibility

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

  useEffect(() => {
    // Only run on client side
    if (typeof window !== 'undefined') {
      const storedToken = localStorage.getItem('token');
      const storedUser = localStorage.getItem('user');

      if (storedToken && storedUser) {
        setToken(storedToken);
        try {
          setUser(JSON.parse(storedUser));
        } catch (error) {
          console.error('Error parsing stored user:', error);
          localStorage.removeItem('user');
          localStorage.removeItem('token');
        }
      }
    }
  }, []);

  const login = async (email: string, password: string) => {
    setLoading(true);
    try {
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
        const error = await response.json() as any;
        // Handle different types of error responses
        if (error.details && Array.isArray(error.details)) {
          throw new Error(error.details.join(', '));
        }
        throw new Error(error.error || error.message || 'Login failed');
      }

      const data = await response.json() as any;
      setToken(data.token);
      setUser(data.user);

      // Store in localStorage only on client side
      if (typeof window !== 'undefined') {
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
      }
    } finally {
      setLoading(false);
    }
  };

  const register = async (email: string, password: string, name: string) => {
    setLoading(true);
    try {
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
        const error = await response.json() as any;
        // Handle different types of error responses
        if (error.details && Array.isArray(error.details)) {
          throw new Error(error.details.join(', '));
        }
        throw new Error(error.error || error.message || 'Registration failed');
      }

      const data = await response.json() as any;
      setToken(data.token);
      setUser(data.user);

      // Store in localStorage only on client side
      if (typeof window !== 'undefined') {
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
      }
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);

    // Clear localStorage only on client side
    if (typeof window !== 'undefined') {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    }
  };

  return (
    <AuthContext.Provider value={{ user, token, login, register, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

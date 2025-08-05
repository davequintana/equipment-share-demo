// Local storage-based authentication for GitHub Pages
// This provides a complete auth experience without requiring a backend API

interface User {
  id: string;
  email: string;
  name: string;
}

interface StoredAuth {
  user: User;
  token: string;
  timestamp: number;
}

const AUTH_KEY = 'equipment-share-auth';
const TOKEN_EXPIRY = 24 * 60 * 60 * 1000; // 24 hours

// Simple client-side storage for demo users
const demoUsers = new Map<string, { password: string; user: User }>();

// Initialize with a demo user
demoUsers.set('demo@example.com', {
  password: 'password',
  user: {
    id: '1',
    email: 'demo@example.com',
    name: 'Demo User'
  }
});

export const localAuth = {
  // Get current auth from localStorage
  getCurrentAuth(): StoredAuth | null {
    try {
      const stored = localStorage.getItem(AUTH_KEY);
      if (!stored) return null;

      const auth: StoredAuth = JSON.parse(stored);
      
      // Check if token is expired
      if (Date.now() - auth.timestamp > TOKEN_EXPIRY) {
        localStorage.removeItem(AUTH_KEY);
        return null;
      }

      return auth;
    } catch {
      return null;
    }
  },

  // Store auth in localStorage
  setAuth(user: User): string {
    const token = `local-token-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const auth: StoredAuth = {
      user,
      token,
      timestamp: Date.now()
    };

    localStorage.setItem(AUTH_KEY, JSON.stringify(auth));
    return token;
  },

  // Clear auth from localStorage
  clearAuth(): void {
    localStorage.removeItem(AUTH_KEY);
  },

  // Login with email/password
  async login(email: string, password: string): Promise<{ user: User; token: string }> {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 300));

    // Check demo users first
    const demoUser = demoUsers.get(email);
    if (demoUser && demoUser.password === password) {
      const token = this.setAuth(demoUser.user);
      return { user: demoUser.user, token };
    }

    // For any other email/password, create a dynamic user
    if (email && password) {
      const user: User = {
        id: Date.now().toString(),
        email,
        name: email.split('@')[0] || 'User'
      };
      const token = this.setAuth(user);
      return { user, token };
    }

    throw new Error('Please enter both email and password');
  },

  // Register new user
  async register(email: string, password: string, name: string): Promise<{ user: User; token: string }> {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 400));

    if (!email || !password || !name) {
      throw new Error('Please fill in all fields');
    }

    // Create new user
    const user: User = {
      id: Date.now().toString(),
      email,
      name
    };

    // Store in demo users for future logins
    demoUsers.set(email, { password, user });

    const token = this.setAuth(user);
    return { user, token };
  },

  // Get user profile
  async getProfile(): Promise<User> {
    const auth = this.getCurrentAuth();
    if (!auth) {
      throw new Error('Not authenticated');
    }
    
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 200));
    
    return auth.user;
  },

  // Update user profile
  async updateProfile(updates: Partial<Omit<User, 'id'>>): Promise<User> {
    const auth = this.getCurrentAuth();
    if (!auth) {
      throw new Error('Not authenticated');
    }

    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 300));

    const updatedUser = { ...auth.user, ...updates };
    this.setAuth(updatedUser);

    // Update in demo users if exists
    const demoUser = demoUsers.get(auth.user.email);
    if (demoUser) {
      demoUsers.set(auth.user.email, { ...demoUser, user: updatedUser });
    }

    return updatedUser;
  }
};

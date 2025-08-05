// Demo API responses for GitHub Pages deployment
// This provides mock data when a real API backend is not available

import { isLocalOnlyMode } from './api-url';

// Mock user data
const mockUser = {
  id: 1,
  email: 'demo@example.com',
  name: 'Demo User',
  role: 'admin',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

// Demo delay to simulate network requests
const demoDelay = (ms = 500) => new Promise(resolve => setTimeout(resolve, ms));

// Mock authentication responses
export const mockAuthResponses = {
  login: async (email: string, password: string) => {
    await demoDelay();
    
    // Simple demo validation
    if (email && password) {
      return {
        ok: true,
        json: async () => ({
          user: mockUser,
          token: 'demo-jwt-token-' + Date.now(),
          message: 'Login successful (Demo Mode)'
        })
      };
    }
    
    return {
      ok: false,
      json: async () => ({
        error: 'Invalid credentials (Demo Mode)'
      })
    };
  },

  register: async (email: string, password: string, name?: string) => {
    await demoDelay();
    
    // Simple demo validation
    if (email && password) {
      return {
        ok: true,
        json: async () => ({
          user: { ...mockUser, email, name: name || 'New User' },
          token: 'demo-jwt-token-' + Date.now(),
          message: 'Registration successful (Demo Mode)'
        })
      };
    }
    
    return {
      ok: false,
      json: async () => ({
        error: 'Registration failed (Demo Mode)'
      })
    };
  },

  profile: async () => {
    await demoDelay();
    
    return {
      ok: true,
      json: async () => ({
        user: mockUser,
        message: 'Profile loaded (Demo Mode)'
      })
    };
  },

  updateProfile: async (data: Record<string, unknown>) => {
    await demoDelay();
    
    return {
      ok: true,
      json: async () => ({
        user: { ...mockUser, ...data },
        message: 'Profile updated (Demo Mode)'
      })
    };
  }
};

// Mock fetch for demo mode
export async function demoFetch(url: string, options?: RequestInit): Promise<Response> {
  if (!isLocalOnlyMode()) {
    // Not in demo mode, use real fetch
    return fetch(url, options);
  }

  // Parse the URL to determine which mock response to use
  const urlPath = new URL(url, window.location.origin).pathname;
  const method = options?.method?.toUpperCase() || 'GET';
  
  console.log(`🎭 Demo Mode: ${method} ${urlPath}`);

  // Mock auth endpoints
  if (urlPath.includes('/api/auth/login') && method === 'POST') {
    const body = JSON.parse(options?.body as string || '{}');
    return mockAuthResponses.login(body.email, body.password) as Promise<Response>;
  }
  
  if (urlPath.includes('/api/auth/register') && method === 'POST') {  
    const body = JSON.parse(options?.body as string || '{}');
    return mockAuthResponses.register(body.email, body.password, body.name) as Promise<Response>;
  }
  
  if (urlPath.includes('/api/users/profile')) {
    if (method === 'GET') {
      return mockAuthResponses.profile() as Promise<Response>;
    }
    if (method === 'PUT' || method === 'PATCH') {
      const body = JSON.parse(options?.body as string || '{}');
      return mockAuthResponses.updateProfile(body) as Promise<Response>;
    }
  }
  
  // Default response for unknown endpoints
  await demoDelay();
  return {
    ok: false,
    status: 404,
    json: async () => ({
      error: `Demo Mode: Endpoint ${method} ${urlPath} not implemented`,
      message: 'This is a demo deployment. Real API functionality requires a backend server.'
    })
  } as unknown as Response;
}

// Global fetch replacement for demo mode
export function setupDemoMode() {
  if (isLocalOnlyMode()) {
    console.log('🎭 Demo Mode Enabled - Using mock API responses');
    
    // Store original fetch
    const originalFetch = window.fetch;
    
    // Replace fetch with demo version
    window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = typeof input === 'string' ? input : input.toString();
      
      // Only intercept API calls
      if (url.includes('/api/') || url.startsWith('https://api.your-domain.com')) {
        return demoFetch(url, init);
      }
      
      // Use original fetch for non-API requests
      return originalFetch(input, init);
    };
  }
}

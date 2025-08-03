// Utility to get API URL for both client and server environments
export function getApiUrl(): string {
  // Check if we're in a browser environment
  if (typeof window !== 'undefined') {
    // Client-side: use Vite environment variable or fallback
    return (window as any).__VITE_API_URL__ || 'http://localhost:3333';
  } else {
    // Server-side: use process.env
    return process.env['VITE_API_URL'] || 'http://localhost:3333';
  }
}

// Utility to get API URL for both client and server environments
export function getApiUrl(): string {
  // Check if we're in a browser environment
  if (typeof window !== 'undefined') {
    // Client-side: use relative URL to leverage the proxy
    return '';
  } else {
    // Server-side: use direct API URL for SSR
    return process.env['VITE_API_URL'] || 'http://localhost:3333';
  }
}

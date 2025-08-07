// Utility to get API URL for both client and server environments
export function getApiUrl(): string {
  // Check if we're in a browser environment
  if (typeof window !== 'undefined') {
    // Check if we're running on GitHub Pages (secure hostname check)
    if (window.location.hostname.endsWith('.github.io') || window.location.hostname === 'github.io') {
      // GitHub Pages: Return null to indicate local-only mode
      return '';
    }
    // Local development: use relative URL to leverage the proxy
    return '';
  } else {
    // Server-side: use direct API URL for SSR
    return process.env['VITE_API_URL'] || 'http://localhost:3334';
  }
}

// Check if we're in local-only mode (GitHub Pages without backend)
export function isLocalOnlyMode(): boolean {
  if (typeof window !== 'undefined') {
    return window.location.hostname.endsWith('.github.io') || window.location.hostname === 'github.io';
  }
  return false;
}

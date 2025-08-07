import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Mock window and document for JSDOM environment
if (typeof window !== 'undefined') {
  // Mock Notification API
  Object.assign(globalThis, {
    Notification: {
      requestPermission: vi.fn().mockResolvedValue('granted'),
      permission: 'granted',
    },
  });

  // Mock constructor for Notification
  class MockNotification {
    title: string;
    body?: string;
    icon?: string;
    close = vi.fn();
    onclick: ((this: Notification, ev: Event) => void) | null = null;
    onshow: ((this: Notification, ev: Event) => void) | null = null;
    onerror: ((this: Notification, ev: Event) => void) | null = null;
    onclose: ((this: Notification, ev: Event) => void) | null = null;

    constructor(title: string, options?: NotificationOptions) {
      this.title = title;
      this.body = options?.body;
      this.icon = options?.icon;
    }

    static readonly requestPermission = vi.fn().mockResolvedValue('granted');
    static readonly permission = 'granted';
  }

  (globalThis as unknown as { Notification: typeof MockNotification }).Notification = MockNotification;

  // Mock localStorage
  const localStorageMock = {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn(),
  };
  Object.defineProperty(window, 'localStorage', {
    value: localStorageMock,
  });
}

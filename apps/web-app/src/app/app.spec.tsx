import { describe, it, expect } from 'vitest';
import { render } from '../server/entry';

describe('SSR Entry', () => {
  it('should render the app on server side', () => {
    const html = render('/');
    expect(html).toContain('Enterprise NX Monorepo with SSR');
    expect(html).toContain('Server-side rendered React application');
  });

  it('should render different routes', () => {
    const profileHtml = render('/profile');
    expect(profileHtml).toContain('Access Denied');

    const loginHtml = render('/login');
    expect(loginHtml).toContain('Login');
  });
});

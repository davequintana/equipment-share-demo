import { describe, it, expect } from 'vitest';
import { render } from './server/entry-debug';

describe('Debug SSR', () => {
  it('should debug SSR rendering', () => {
    console.log('Starting SSR debug test...');
    const html = render('/');
    console.log('Full HTML output:', html);

    // Let's check if this contains any loading state
    expect(html).not.toContain('Loading...');
  });
});

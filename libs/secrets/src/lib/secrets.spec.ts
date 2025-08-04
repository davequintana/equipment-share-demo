import { secrets } from './secrets.js';

describe('secrets', () => {
  it('should work', () => {
    expect(secrets()).toEqual('secrets');
  });
});

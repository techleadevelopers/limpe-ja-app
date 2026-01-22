import { normalizeRouteKey } from './route-normalizer';

describe('normalizeRouteKey', () => {
  it('removes querystring and hash fragments', () => {
    const normalized = normalizeRouteKey('/api/test/path?foo=bar#section');
    expect(normalized).toBe('/api/test/path');
  });

  it('converts UUID segments to {id}', () => {
    const normalized = normalizeRouteKey(
      '/api/bookings/4f7f7c43-6d1b-4d0d-a9f9-3a9f9b0e7a36',
    );
    expect(normalized).toBe('/api/bookings/{id}');
  });

  it('converts long numeric segments to {id}', () => {
    const normalized = normalizeRouteKey('/api/providers/123456789012');
    expect(normalized).toBe('/api/providers/{id}');
  });

  it('leaves static routes intact', () => {
    const normalized = normalizeRouteKey('/api/static/health');
    expect(normalized).toBe('/api/static/health');
  });

  it('normalizes different numeric IDs to the same key', () => {
    const first = normalizeRouteKey('/api/providers/123');
    const second = normalizeRouteKey('/api/providers/999');
    expect(first).toBe('/api/providers/{id}');
    expect(second).toBe('/api/providers/{id}');
  });

  it('normalizes different UUIDs to the same key', () => {
    const first = normalizeRouteKey('/api/bookings/b94d27b9-0b4e-4b56-ae1f-0c1f8e9f53f7');
    const second = normalizeRouteKey('/api/bookings/9fa3b1e3-3e91-4b7d-a7bc-5f2553bd3aa7');
    expect(first).toBe('/api/bookings/{id}');
    expect(second).toBe('/api/bookings/{id}');
  });
});

import { filterRoutes, matchesAnyPattern } from './filter';

describe('matchesAnyPattern', () => {
  it('matches exact routes', () => {
    expect(matchesAnyPattern('/api/users', ['/api/users'])).toBe(true);
  });

  it('matches wildcard patterns', () => {
    expect(matchesAnyPattern('/api/users/123', ['/api/users/*'])).toBe(true);
    expect(matchesAnyPattern('/api/posts', ['/api/users/*'])).toBe(false);
  });

  it('matches double wildcard', () => {
    expect(matchesAnyPattern('/api/users/profile/edit', ['/api/**'])).toBe(true);
  });

  it('returns false for empty patterns', () => {
    expect(matchesAnyPattern('/api/users', [])).toBe(false);
  });
});

describe('filterRoutes', () => {
  const routes = {
    '/api/users': ['GET', 'POST'],
    '/api/users/[id]': ['GET', 'PUT', 'DELETE'],
    '/api/posts': ['GET'],
    '/health': ['GET'],
  };

  it('returns all routes when no filters provided', () => {
    expect(filterRoutes(routes, {})).toEqual(routes);
  });

  it('filters by include pattern', () => {
    const result = filterRoutes(routes, { include: ['/api/*'] });
    expect(Object.keys(result)).toContain('/api/users');
    expect(Object.keys(result)).toContain('/api/posts');
    expect(Object.keys(result)).not.toContain('/health');
  });

  it('filters by exclude pattern', () => {
    const result = filterRoutes(routes, { exclude: ['/health'] });
    expect(Object.keys(result)).not.toContain('/health');
    expect(Object.keys(result)).toHaveLength(3);
  });

  it('applies include and exclude together', () => {
    const result = filterRoutes(routes, {
      include: ['/api/*'],
      exclude: ['/api/posts'],
    });
    expect(Object.keys(result)).toContain('/api/users');
    expect(Object.keys(result)).not.toContain('/api/posts');
    expect(Object.keys(result)).not.toContain('/health');
  });
});

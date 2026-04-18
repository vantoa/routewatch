import { searchRoutes, searchByRegex, formatSearchResults } from './search';
import { RouteInfo } from './scanner';

const routes: RouteInfo[] = [
  { route: '/api/users', methods: ['GET', 'POST'] },
  { route: '/api/users/[id]', methods: ['GET', 'PUT', 'DELETE'] },
  { route: '/api/posts', methods: ['GET'] },
  { route: '/api/posts/[id]', methods: ['GET', 'DELETE'] },
];

describe('searchRoutes', () => {
  it('filters by method', () => {
    const result = searchRoutes(routes, { method: 'POST' });
    expect(result).toHaveLength(1);
    expect(result[0].route).toBe('/api/users');
  });

  it('filters by path substring', () => {
    const result = searchRoutes(routes, { path: 'posts' });
    expect(result).toHaveLength(2);
  });

  it('filters by exact path', () => {
    const result = searchRoutes(routes, { path: '/api/posts', exact: true });
    expect(result).toHaveLength(1);
    expect(result[0].route).toBe('/api/posts');
  });

  it('combines method and path filters', () => {
    const result = searchRoutes(routes, { method: 'DELETE', path: 'users' });
    expect(result).toHaveLength(1);
    expect(result[0].route).toBe('/api/users/[id]');
  });

  it('returns all routes when no options given', () => {
    const result = searchRoutes(routes, {});
    expect(result).toHaveLength(4);
  });
});

describe('searchByRegex', () => {
  it('matches routes by regex', () => {
    const result = searchByRegex(routes, '\\[id\\]');
    expect(result).toHaveLength(2);
  });

  it('throws on invalid regex', () => {
    expect(() => searchByRegex(routes, '[')).toThrow('Invalid regex pattern');
  });
});

describe('formatSearchResults', () => {
  it('formats results', () => {
    const out = formatSearchResults([routes[0]]);
    expect(out).toContain('/api/users');
    expect(out).toContain('GET');
  });

  it('returns no match message for empty', () => {
    expect(formatSearchResults([])).toBe('No routes matched.');
  });
});

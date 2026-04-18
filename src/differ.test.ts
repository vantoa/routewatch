import { diffRoutes } from './differ';
import { RouteInfo } from './scanner';

const makeRoute = (route: string, methods: string[]): RouteInfo => ({
  route,
  methods,
  filePath: `/app${route}/route.ts`,
});

describe('diffRoutes', () => {
  it('detects added routes', () => {
    const before: RouteInfo[] = [];
    const after: RouteInfo[] = [makeRoute('/api/users', ['GET'])];
    const result = diffRoutes(before, after);
    expect(result.added).toHaveLength(1);
    expect(result.added[0].route).toBe('/api/users');
  });

  it('detects removed routes', () => {
    const before: RouteInfo[] = [makeRoute('/api/posts', ['GET', 'POST'])];
    const after: RouteInfo[] = [];
    const result = diffRoutes(before, after);
    expect(result.removed).toHaveLength(1);
    expect(result.removed[0].route).toBe('/api/posts');
  });

  it('detects modified routes when methods change', () => {
    const before: RouteInfo[] = [makeRoute('/api/items', ['GET'])];
    const after: RouteInfo[] = [makeRoute('/api/items', ['GET', 'DELETE'])];
    const result = diffRoutes(before, after);
    expect(result.modified).toHaveLength(1);
    expect(result.modified[0].after?.methods).toContain('DELETE');
  });

  it('marks unchanged routes correctly', () => {
    const route = makeRoute('/api/health', ['GET']);
    const result = diffRoutes([route], [route]);
    expect(result.unchanged).toHaveLength(1);
    expect(result.added).toHaveLength(0);
    expect(result.removed).toHaveLength(0);
    expect(result.modified).toHaveLength(0);
  });
});

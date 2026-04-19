import { pruneByMethods, pruneByPrefixes, pruneRoutes, formatPruneResult } from './prune';
import { RouteInfo } from './scanner';

function makeRoute(path: string, methods: string[]): RouteInfo {
  return { path, methods, file: `app${path}/route.ts` };
}

const routes: RouteInfo[] = [
  makeRoute('/api/users', ['GET', 'POST']),
  makeRoute('/api/users/[id]', ['GET', 'PUT', 'DELETE']),
  makeRoute('/api/health', ['GET']),
  makeRoute('/internal/metrics', ['GET']),
];

describe('pruneByMethods', () => {
  it('removes routes where all methods match', () => {
    const result = pruneByMethods(routes, ['GET']);
    expect(result.find(r => r.path === '/api/health')).toBeUndefined();
    expect(result.find(r => r.path === '/api/users')).toBeDefined();
  });

  it('keeps routes with at least one non-matching method', () => {
    const result = pruneByMethods(routes, ['DELETE']);
    expect(result).toHaveLength(3);
  });
});

describe('pruneByPrefixes', () => {
  it('removes routes matching any prefix', () => {
    const result = pruneByPrefixes(routes, ['/internal']);
    expect(result.find(r => r.path === '/internal/metrics')).toBeUndefined();
    expect(result).toHaveLength(3);
  });

  it('removes multiple prefixes', () => {
    const result = pruneByPrefixes(routes, ['/internal', '/api/users/']);
    expect(result).toHaveLength(2);
  });
});

describe('pruneRoutes', () => {
  it('applies both filters', () => {
    const { kept, pruned } = pruneRoutes(routes, { methods: ['GET'], pathPrefixes: ['/internal'] });
    expect(pruned.length).toBeGreaterThan(0);
    expect(kept.length + pruned.length).toBe(routes.length);
  });

  it('returns all routes when no options given', () => {
    const { kept, pruned } = pruneRoutes(routes, {});
    expect(kept).toHaveLength(routes.length);
    expect(pruned).toHaveLength(0);
  });
});

describe('formatPruneResult', () => {
  it('includes counts and pruned paths', () => {
    const { kept, pruned } = pruneRoutes(routes, { pathPrefixes: ['/internal'] });
    const output = formatPruneResult({ kept, pruned });
    expect(output).toContain('Pruned 1');
    expect(output).toContain('/internal/metrics');
  });
});
